from typing import Any, Dict, List, Optional
import uuid
import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from fastapi.responses import HTMLResponse, StreamingResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, func

logger = logging.getLogger(__name__)

from app.db.database import get_db
from app.models.cuestionario_admin import (
    CuestionarioAdmin,
    Pregunta,
    AsignacionCuestionario,
    RespuestaCuestionario,
    RespuestaPregunta,
    ReporteIA,
    TipoUsuario,
    EstadoCuestionario
)
from app.models.persona import User
from app.schemas.cuestionario_admin import (
    CuestionarioAdminCreate,
    CuestionarioAdminUpdate,
    CuestionarioAdminOut,
    CuestionariosPaginados,
    FiltrosCuestionarios,
    CuestionarioBulkDelete,
    RespuestaBulkCancel,
    CuestionarioDuplicate,
    CuestionarioEstadoUpdate,
    PreguntaOut,
    RespuestaCuestionarioOut,
    ReporteResponse,
    RegenerarReporteRequest,
    PreguntaRespuestaReporte,
    PersonaInfoReporte
)
from app.utils.deps import (
    get_current_active_user,
    check_admin_or_coordinador_role
)
from app.services.ai_service import ai_service
from app.services.markdown_service import markdown_service
from app.services.export_service import export_service

router = APIRouter(prefix="/cuestionarios-admin", tags=["cuestionarios-admin"])


def _formatear_valor_respuesta(valor: Any) -> str:
    """Normaliza el valor de una respuesta para su envío a la IA."""
    if valor is None:
        return ""
    if isinstance(valor, list):
        return ", ".join(str(item) for item in valor if item is not None)
    if isinstance(valor, bool):
        return "Sí" if valor else "No"
    return str(valor)


def _normalizar_respuesta(valor: Any, texto_otro: Optional[str]) -> str:
    """Genera el texto final de una respuesta combinando valor y texto_otro."""
    valor_normalizado = _formatear_valor_respuesta(valor)
    texto_otro_normalizado = (texto_otro or "").strip()

    if texto_otro_normalizado:
        if valor_normalizado:
            return f"{valor_normalizado} (Otro: {texto_otro_normalizado})"
        return f"Otro: {texto_otro_normalizado}"

    return valor_normalizado or "Sin respuesta"


def _construir_preguntas_respuestas_desde_respuesta(
    respuesta: RespuestaCuestionario
) -> List[Dict[str, Any]]:
    """Construye la estructura de preguntas y respuestas usando los datos almacenados en BD.

    IMPORTANTE: Usa pregunta_snapshot cuando existe, sino usa pregunta original.
    Reason: Preservar las respuestas de usuarios incluso si se editó/eliminó la pregunta.
    """
    preguntas_respuestas: List[Dict[str, Any]] = []

    for idx, respuesta_pregunta in enumerate(respuesta.respuestas_preguntas, 1):
        # PROTECCIÓN: Usar snapshot si existe, sino usar pregunta original
        # Reason: Las respuestas NO deben desaparecer solo porque se editó el cuestionario
        if respuesta_pregunta.pregunta_snapshot:
            # Usar snapshot (respuestas nuevas con sistema de snapshots)
            pregunta_texto = respuesta_pregunta.pregunta_snapshot.texto
            pregunta_orden = respuesta_pregunta.pregunta_snapshot.orden if respuesta_pregunta.pregunta_snapshot.orden is not None else idx
        elif respuesta_pregunta.pregunta:
            # Pregunta aún existe en el cuestionario (respuestas antiguas)
            pregunta_texto = respuesta_pregunta.pregunta.texto
            pregunta_orden = respuesta_pregunta.pregunta.orden if respuesta_pregunta.pregunta.orden is not None else idx
        else:
            # No hay snapshot ni pregunta original, saltar
            continue

        preguntas_respuestas.append({
            "pregunta_id": respuesta_pregunta.pregunta_id,
            "pregunta": pregunta_texto,
            "respuesta": _normalizar_respuesta(respuesta_pregunta.valor, respuesta_pregunta.texto_otro),
            "orden": pregunta_orden
        })

    preguntas_respuestas.sort(key=lambda item: item.get("orden", 0))
    return preguntas_respuestas


def _combinar_preguntas_respuestas(
    respuesta: RespuestaCuestionario,
    preguntas_respuestas_request: Optional[List[PreguntaRespuestaReporte]]
) -> List[Dict[str, Any]]:
    """Fusiona las respuestas almacenadas con las recibidas por request, usando BD como fuente principal."""
    base = _construir_preguntas_respuestas_desde_respuesta(respuesta)

    if not preguntas_respuestas_request:
        return base

    base_por_id: Dict[Optional[str], Dict[str, Any]] = {
        item.get("pregunta_id"): item for item in base if item.get("pregunta_id")
    }
    base_por_texto: Dict[str, Dict[str, Any]] = {
        (item.get("pregunta") or "").strip().lower(): item for item in base
    }

    for item in preguntas_respuestas_request:
        respuesta_normalizada = _normalizar_respuesta(item.respuesta, item.texto_otro)
        pregunta_key = (item.pregunta or "").strip().lower()

        destino = None
        if item.pregunta_id and item.pregunta_id in base_por_id:
            destino = base_por_id[item.pregunta_id]
        elif pregunta_key and pregunta_key in base_por_texto:
            destino = base_por_texto[pregunta_key]

        if destino:
            destino["respuesta"] = respuesta_normalizada or "Sin respuesta"
        else:
            base.append({
                "pregunta_id": item.pregunta_id,
                "pregunta": item.pregunta,
                "respuesta": respuesta_normalizada or "Sin respuesta",
                "orden": len(base) + 1
            })

    base.sort(key=lambda item: item.get("orden", 0))
    return base


def _agregar_preguntas_respuestas_al_contenido(
    contenido: str,
    respuesta: RespuestaCuestionario
) -> str:
    """Agrega una sección de preguntas y respuestas al contenido Markdown.

    IMPORTANTE: Usa pregunta_texto preservado cuando la pregunta fue eliminada.
    Reason: Preservar las respuestas de usuarios incluso si se editó/eliminó la pregunta.
    """
    if not respuesta.respuestas_preguntas:
        return contenido

    # PROTECCIÓN: Incluir respuestas incluso si la pregunta fue eliminada
    preguntas = []
    for rp in respuesta.respuestas_preguntas:
        if rp.pregunta:
            # Pregunta existe
            preguntas.append((rp, rp.pregunta.orden if rp.pregunta.orden is not None else 999))
        elif rp.pregunta_texto:
            # Pregunta eliminada pero texto preservado
            preguntas.append((rp, 999))  # Al final

    if not preguntas:
        return contenido

    # Ordenar por orden
    preguntas = sorted(preguntas, key=lambda x: x[1])

    seccion = ["\n\n---\n", "## Preguntas y Respuestas\n\n"]
    for idx, (rp, _) in enumerate(preguntas, start=1):
        # Usar pregunta_texto preservado si la pregunta fue eliminada
        if rp.pregunta:
            pregunta_texto = rp.pregunta.texto
            pregunta_descripcion = rp.pregunta.descripcion
        else:
            pregunta_texto = rp.pregunta_texto or "Pregunta eliminada"
            pregunta_descripcion = None

        respuesta_texto = _normalizar_respuesta(rp.valor, rp.texto_otro)

        seccion.append(f"{idx}. **{pregunta_texto}**\n")
        if pregunta_descripcion:
            seccion.append(f"   - Descripción: {pregunta_descripcion}\n")
        seccion.append(f"   - Respuesta: {respuesta_texto}\n\n")

    return contenido.rstrip() + "".join(seccion)


def _build_download_response(
    file_stream: Any,
    filename: str,
    media_type: str,
    origin: Optional[str] = None
) -> StreamingResponse:
    headers = {
        "Content-Disposition": f"attachment; filename={filename}",
        "Access-Control-Expose-Headers": "Content-Disposition"
    }
    if origin:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
        headers["Vary"] = "Origin"
    return StreamingResponse(
        file_stream,
        media_type=media_type,
        headers=headers
    )


def _construir_persona_info(
    base_info: Dict[str, Any],
    request_persona_info: Optional[PersonaInfoReporte]
) -> Dict[str, Any]:
    """Mezcla información base de la persona con la proporcionada en el request."""
    persona_info = {**base_info}
    if request_persona_info:
        if request_persona_info.matricula:
            persona_info["matricula"] = request_persona_info.matricula
        if request_persona_info.correo:
            persona_info["correo"] = request_persona_info.correo
        if request_persona_info.nombre:
            persona_info["nombre"] = request_persona_info.nombre
        if request_persona_info.otros:
            persona_info.update(request_persona_info.otros)
    return persona_info

@router.get("/", response_model=CuestionariosPaginados)
def get_cuestionarios(
    *,
    db: Session = Depends(get_db),
    titulo: Optional[str] = Query(None, description="Filtrar por título"),
    estado: Optional[EstadoCuestionario] = Query(None, description="Filtrar por estado"),
    tipo_usuario: Optional[TipoUsuario] = Query(None, description="Filtrar por tipo de usuario asignado"),
    fecha_creacion_desde: Optional[datetime] = Query(None, description="Filtrar desde fecha"),
    fecha_creacion_hasta: Optional[datetime] = Query(None, description="Filtrar hasta fecha"),
    creado_por: Optional[int] = Query(None, description="Filtrar por creador"),
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(10, ge=1, le=100, description="Número máximo de registros"),
    current_user: User = Depends(check_admin_or_coordinador_role)
) -> Any:
    """
    Obtener lista de cuestionarios administrativos con filtros y paginación.
    Solo disponible para administradores y coordinadores.
    """
    # Construir query base
    query = db.query(CuestionarioAdmin).options(
        joinedload(CuestionarioAdmin.creador),
        joinedload(CuestionarioAdmin.preguntas),
        joinedload(CuestionarioAdmin.asignaciones)
    )

    # Aplicar filtros
    if titulo:
        query = query.filter(CuestionarioAdmin.titulo.ilike(f"%{titulo}%"))
    
    if estado:
        query = query.filter(CuestionarioAdmin.estado == estado)
    
    if creado_por:
        query = query.filter(CuestionarioAdmin.creado_por == creado_por)
    
    if fecha_creacion_desde:
        query = query.filter(CuestionarioAdmin.fecha_creacion >= fecha_creacion_desde)
    
    if fecha_creacion_hasta:
        query = query.filter(CuestionarioAdmin.fecha_creacion <= fecha_creacion_hasta)
    
    if tipo_usuario:
        query = query.join(AsignacionCuestionario).filter(
            AsignacionCuestionario.tipo_usuario == tipo_usuario
        )

    # Contar total antes de aplicar paginación
    total = query.count()

    # Aplicar paginación y ordenamiento
    cuestionarios = query.order_by(CuestionarioAdmin.created_at.desc()).offset(skip).limit(limit).all()

    # Enriquecer datos
    cuestionarios_out = []
    for cuestionario in cuestionarios:
        cuestionario_dict = {
            "id": cuestionario.id,
            "titulo": cuestionario.titulo,
            "descripcion": cuestionario.descripcion,
            "fecha_creacion": cuestionario.fecha_creacion,
            "fecha_inicio": cuestionario.fecha_inicio,
            "fecha_fin": cuestionario.fecha_fin,
            "estado": cuestionario.estado,
            "creado_por": cuestionario.creado_por,
            "creado_por_nombre": cuestionario.creador.correo_institucional if cuestionario.creador else None,
            "total_preguntas": cuestionario.total_preguntas,
            "total_respuestas": cuestionario.total_respuestas,
            "preguntas": cuestionario.preguntas,
            "tipos_usuario_asignados": cuestionario.tipos_usuario_asignados,
            "instruccion_sistema": cuestionario.instruccion_sistema,
            "modelo_ia": cuestionario.modelo_ia,
            "created_at": cuestionario.created_at,
            "updated_at": cuestionario.updated_at
        }
        cuestionarios_out.append(CuestionarioAdminOut(**cuestionario_dict))

    return CuestionariosPaginados(
        cuestionarios=cuestionarios_out,
        total=total,
        skip=skip,
        limit=limit,
        has_next=skip + limit < total,
        has_prev=skip > 0
    )


@router.get("/{cuestionario_id}", response_model=CuestionarioAdminOut)
def get_cuestionario(
    *,
    db: Session = Depends(get_db),
    cuestionario_id: str,
    current_user: User = Depends(check_admin_or_coordinador_role)
) -> Any:
    """
    Obtener un cuestionario específico por ID.
    """
    cuestionario = db.query(CuestionarioAdmin).options(
        joinedload(CuestionarioAdmin.creador),
        joinedload(CuestionarioAdmin.preguntas),
        joinedload(CuestionarioAdmin.asignaciones)
    ).filter(CuestionarioAdmin.id == cuestionario_id).first()

    if not cuestionario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cuestionario no encontrado"
        )

    # Enriquecer datos
    cuestionario_dict = {
        "id": cuestionario.id,
        "titulo": cuestionario.titulo,
        "descripcion": cuestionario.descripcion,
        "fecha_creacion": cuestionario.fecha_creacion,
        "fecha_inicio": cuestionario.fecha_inicio,
        "fecha_fin": cuestionario.fecha_fin,
        "estado": cuestionario.estado,
        "creado_por": cuestionario.creado_por,
        "creado_por_nombre": cuestionario.creador.correo_institucional if cuestionario.creador else None,
        "total_preguntas": cuestionario.total_preguntas,
        "total_respuestas": cuestionario.total_respuestas,
        "preguntas": cuestionario.preguntas,
        "tipos_usuario_asignados": cuestionario.tipos_usuario_asignados,
        "instruccion_sistema": cuestionario.instruccion_sistema,
        "modelo_ia": cuestionario.modelo_ia,
        "created_at": cuestionario.created_at,
        "updated_at": cuestionario.updated_at
    }

    return CuestionarioAdminOut(**cuestionario_dict)


@router.post("/", response_model=CuestionarioAdminOut)
def create_cuestionario(
    *,
    db: Session = Depends(get_db),
    cuestionario_in: CuestionarioAdminCreate,
    current_user: User = Depends(check_admin_or_coordinador_role)
) -> Any:
    """
    Crear un nuevo cuestionario administrativo.
    """
    # Generar ID único
    cuestionario_id = str(uuid.uuid4())

    # Crear el cuestionario
    db_cuestionario = CuestionarioAdmin(
        id=cuestionario_id,
        titulo=cuestionario_in.titulo,
        descripcion=cuestionario_in.descripcion,
        fecha_inicio=cuestionario_in.fecha_inicio,
        fecha_fin=cuestionario_in.fecha_fin,
        estado=cuestionario_in.estado,
        creado_por=current_user.id,
        instruccion_sistema=cuestionario_in.instruccion_sistema,
        modelo_ia=cuestionario_in.modelo_ia
    )

    db.add(db_cuestionario)
    db.flush()  # Para obtener el ID antes del commit

    # Crear las preguntas
    for pregunta_data in cuestionario_in.preguntas:
        pregunta_id = str(uuid.uuid4())
        db_pregunta = Pregunta(
            id=pregunta_id,
            cuestionario_id=cuestionario_id,
            tipo=pregunta_data.tipo,
            texto=pregunta_data.texto,
            descripcion=pregunta_data.descripcion,
            obligatoria=pregunta_data.obligatoria,
            orden=pregunta_data.orden,
            configuracion=pregunta_data.configuracion
        )
        db.add(db_pregunta)

    # Crear las asignaciones
    for tipo_usuario in cuestionario_in.tipos_usuario_asignados:
        db_asignacion = AsignacionCuestionario(
            cuestionario_id=cuestionario_id,
            tipo_usuario=tipo_usuario
        )
        db.add(db_asignacion)

    db.commit()

    # Recargar con relaciones
    db.refresh(db_cuestionario)
    cuestionario = db.query(CuestionarioAdmin).options(
        joinedload(CuestionarioAdmin.creador),
        joinedload(CuestionarioAdmin.preguntas),
        joinedload(CuestionarioAdmin.asignaciones)
    ).filter(CuestionarioAdmin.id == cuestionario_id).first()

    # Enriquecer datos para respuesta
    cuestionario_dict = {
        "id": cuestionario.id,
        "titulo": cuestionario.titulo,
        "descripcion": cuestionario.descripcion,
        "fecha_creacion": cuestionario.fecha_creacion,
        "fecha_inicio": cuestionario.fecha_inicio,
        "fecha_fin": cuestionario.fecha_fin,
        "estado": cuestionario.estado,
        "creado_por": cuestionario.creado_por,
        "creado_por_nombre": cuestionario.creador.correo_institucional if cuestionario.creador else None,
        "total_preguntas": cuestionario.total_preguntas,
        "total_respuestas": cuestionario.total_respuestas,
        "preguntas": cuestionario.preguntas,
        "tipos_usuario_asignados": cuestionario.tipos_usuario_asignados,
        "instruccion_sistema": cuestionario.instruccion_sistema,
        "modelo_ia": cuestionario.modelo_ia,
        "created_at": cuestionario.created_at,
        "updated_at": cuestionario.updated_at
    }

    return CuestionarioAdminOut(**cuestionario_dict)


@router.put("/{cuestionario_id}", response_model=CuestionarioAdminOut)
def update_cuestionario(
    *,
    db: Session = Depends(get_db),
    cuestionario_id: str,
    cuestionario_in: CuestionarioAdminUpdate,
    current_user: User = Depends(check_admin_or_coordinador_role)
) -> Any:
    """
    Actualizar un cuestionario administrativo existente.
    """
    # Buscar el cuestionario
    cuestionario = db.query(CuestionarioAdmin).filter(
        CuestionarioAdmin.id == cuestionario_id
    ).first()

    if not cuestionario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cuestionario no encontrado"
        )

    # Verificar permisos (solo el creador o admin puede editar)
    if current_user.rol != "admin" and cuestionario.creado_por != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para editar este cuestionario"
        )

    # Actualizar campos básicos
    update_data = cuestionario_in.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if field not in ['preguntas', 'tipos_usuario_asignados']:
            setattr(cuestionario, field, value)

    # Actualizar preguntas SOLO si se proporcionan explícitamente
    # Si preguntas es None, no se envió el campo, así que NO tocar las preguntas
    # Si preguntas es una lista (aunque esté vacía), entonces SÍ actualizar
    if 'preguntas' in update_data and cuestionario_in.preguntas is not None:
        # Obtener preguntas existentes
        preguntas_existentes = {p.id: p for p in cuestionario.preguntas}
        preguntas_nuevas_ids = set()

        # Actualizar o crear preguntas
        for pregunta_data in cuestionario_in.preguntas:
            pregunta_id_enviado = getattr(pregunta_data, 'id', None)

            # Si la pregunta tiene ID y existe en la BD, actualizarla
            if pregunta_id_enviado and pregunta_id_enviado in preguntas_existentes:
                pregunta_existente = preguntas_existentes[pregunta_id_enviado]

                # Actualizar la pregunta directamente
                # Reason: El sistema de snapshots preserva automáticamente las respuestas
                pregunta_existente.tipo = pregunta_data.tipo
                pregunta_existente.texto = pregunta_data.texto
                pregunta_existente.descripcion = pregunta_data.descripcion
                pregunta_existente.obligatoria = pregunta_data.obligatoria
                pregunta_existente.orden = pregunta_data.orden
                pregunta_existente.configuracion = pregunta_data.configuracion
                preguntas_nuevas_ids.add(pregunta_id_enviado)
            else:
                # Crear nueva pregunta (ID no existe en BD o no se envió)
                nuevo_id = str(uuid.uuid4())
                db_pregunta = Pregunta(
                    id=nuevo_id,
                    cuestionario_id=cuestionario_id,
                    tipo=pregunta_data.tipo,
                    texto=pregunta_data.texto,
                    descripcion=pregunta_data.descripcion,
                    obligatoria=pregunta_data.obligatoria,
                    orden=pregunta_data.orden,
                    configuracion=pregunta_data.configuracion
                )
                db.add(db_pregunta)
                preguntas_nuevas_ids.add(nuevo_id)

        # PROTECCIÓN: Verificar preguntas que se van a eliminar
        # IMPORTANTE: NO eliminar preguntas que tienen respuestas de usuarios
        # Reason: Las respuestas con snapshots seguirán funcionando, pero las respuestas
        # antiguas (sin snapshot) necesitan la pregunta original para mostrar el texto
        for pregunta_id, pregunta in preguntas_existentes.items():
            if pregunta_id not in preguntas_nuevas_ids:
                # Verificar si tiene respuestas de usuarios
                respuestas_count = db.query(RespuestaPregunta).filter(
                    RespuestaPregunta.pregunta_id == pregunta_id
                ).count()

                if respuestas_count > 0:
                    # NO eliminar preguntas con respuestas
                    # Reason: Las respuestas antiguas (sin snapshot) necesitan la pregunta original
                    logger.warning(f"⚠️ No se puede eliminar la pregunta '{pregunta.texto[:50]}...' porque tiene {respuestas_count} respuestas de usuarios")
                    # NO hacer nada, dejar la pregunta en la BD
                else:
                    # No tiene respuestas, se puede eliminar directamente
                    db.delete(pregunta)

    # Actualizar asignaciones si se proporcionan
    if cuestionario_in.tipos_usuario_asignados is not None:
        # Eliminar asignaciones existentes
        db.query(AsignacionCuestionario).filter(
            AsignacionCuestionario.cuestionario_id == cuestionario_id
        ).delete()

        # Crear nuevas asignaciones
        for tipo_usuario in cuestionario_in.tipos_usuario_asignados:
            db_asignacion = AsignacionCuestionario(
                cuestionario_id=cuestionario_id,
                tipo_usuario=tipo_usuario
            )
            db.add(db_asignacion)

    db.commit()

    # Recargar con relaciones
    cuestionario_actualizado = db.query(CuestionarioAdmin).options(
        joinedload(CuestionarioAdmin.creador),
        joinedload(CuestionarioAdmin.preguntas),
        joinedload(CuestionarioAdmin.asignaciones)
    ).filter(CuestionarioAdmin.id == cuestionario_id).first()

    # Enriquecer datos para respuesta
    cuestionario_dict = {
        "id": cuestionario_actualizado.id,
        "titulo": cuestionario_actualizado.titulo,
        "descripcion": cuestionario_actualizado.descripcion,
        "fecha_creacion": cuestionario_actualizado.fecha_creacion,
        "fecha_inicio": cuestionario_actualizado.fecha_inicio,
        "fecha_fin": cuestionario_actualizado.fecha_fin,
        "estado": cuestionario_actualizado.estado,
        "creado_por": cuestionario_actualizado.creado_por,
        "creado_por_nombre": cuestionario_actualizado.creador.correo_institucional if cuestionario_actualizado.creador else None,
        "total_preguntas": cuestionario_actualizado.total_preguntas,
        "total_respuestas": cuestionario_actualizado.total_respuestas,
        "preguntas": cuestionario_actualizado.preguntas,
        "tipos_usuario_asignados": cuestionario_actualizado.tipos_usuario_asignados,
        "instruccion_sistema": cuestionario_actualizado.instruccion_sistema,
        "modelo_ia": cuestionario_actualizado.modelo_ia,
        "created_at": cuestionario_actualizado.created_at,
        "updated_at": cuestionario_actualizado.updated_at
    }

    return CuestionarioAdminOut(**cuestionario_dict)


@router.delete("/{cuestionario_id}")
def delete_cuestionario(
    *,
    db: Session = Depends(get_db),
    cuestionario_id: str,
    current_user: User = Depends(check_admin_or_coordinador_role)
) -> Any:
    """
    Eliminar un cuestionario administrativo.
    """
    # Buscar el cuestionario
    cuestionario = db.query(CuestionarioAdmin).filter(
        CuestionarioAdmin.id == cuestionario_id
    ).first()

    if not cuestionario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cuestionario no encontrado"
        )

    # Verificar permisos (solo el creador o admin puede eliminar)
    if current_user.rol != "admin" and cuestionario.creado_por != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para eliminar este cuestionario"
        )

    # Verificar si tiene respuestas
    respuestas_count = db.query(RespuestaCuestionario).filter(
        RespuestaCuestionario.cuestionario_id == cuestionario_id,
        RespuestaCuestionario.estado == "completado"
    ).count()

    if respuestas_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se puede eliminar el cuestionario porque tiene {respuestas_count} respuesta(s) completada(s)"
        )

    # Eliminar el cuestionario (las relaciones se eliminan en cascada)
    db.delete(cuestionario)
    db.commit()

    return {"message": "Cuestionario eliminado exitosamente"}


@router.post("/{cuestionario_id}/duplicar", response_model=CuestionarioAdminOut)
def duplicate_cuestionario(
    *,
    db: Session = Depends(get_db),
    cuestionario_id: str,
    duplicate_data: CuestionarioDuplicate,
    current_user: User = Depends(check_admin_or_coordinador_role)
) -> Any:
    """
    Duplicar un cuestionario administrativo existente.
    """
    # Buscar el cuestionario original
    cuestionario_original = db.query(CuestionarioAdmin).options(
        joinedload(CuestionarioAdmin.preguntas),
        joinedload(CuestionarioAdmin.asignaciones)
    ).filter(CuestionarioAdmin.id == cuestionario_id).first()

    if not cuestionario_original:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cuestionario no encontrado"
        )

    # Generar nuevo ID
    nuevo_cuestionario_id = str(uuid.uuid4())

    # Crear el cuestionario duplicado
    db_cuestionario = CuestionarioAdmin(
        id=nuevo_cuestionario_id,
        titulo=duplicate_data.nuevo_titulo,
        descripcion=cuestionario_original.descripcion,
        fecha_inicio=cuestionario_original.fecha_inicio,
        fecha_fin=cuestionario_original.fecha_fin,
        estado=EstadoCuestionario.BORRADOR,  # Siempre crear como borrador
        creado_por=current_user.id
    )

    db.add(db_cuestionario)
    db.flush()

    # Duplicar las preguntas
    for pregunta_original in cuestionario_original.preguntas:
        pregunta_id = str(uuid.uuid4())
        db_pregunta = Pregunta(
            id=pregunta_id,
            cuestionario_id=nuevo_cuestionario_id,
            tipo=pregunta_original.tipo,
            texto=pregunta_original.texto,
            descripcion=pregunta_original.descripcion,
            obligatoria=pregunta_original.obligatoria,
            orden=pregunta_original.orden,
            configuracion=pregunta_original.configuracion
        )
        db.add(db_pregunta)

    # Duplicar las asignaciones
    for asignacion_original in cuestionario_original.asignaciones:
        db_asignacion = AsignacionCuestionario(
            cuestionario_id=nuevo_cuestionario_id,
            tipo_usuario=asignacion_original.tipo_usuario
        )
        db.add(db_asignacion)

    db.commit()

    # Recargar con relaciones
    cuestionario_duplicado = db.query(CuestionarioAdmin).options(
        joinedload(CuestionarioAdmin.creador),
        joinedload(CuestionarioAdmin.preguntas),
        joinedload(CuestionarioAdmin.asignaciones)
    ).filter(CuestionarioAdmin.id == nuevo_cuestionario_id).first()

    # Enriquecer datos para respuesta
    cuestionario_dict = {
        "id": cuestionario_duplicado.id,
        "titulo": cuestionario_duplicado.titulo,
        "descripcion": cuestionario_duplicado.descripcion,
        "fecha_creacion": cuestionario_duplicado.fecha_creacion,
        "fecha_inicio": cuestionario_duplicado.fecha_inicio,
        "fecha_fin": cuestionario_duplicado.fecha_fin,
        "estado": cuestionario_duplicado.estado,
        "creado_por": cuestionario_duplicado.creado_por,
        "creado_por_nombre": cuestionario_duplicado.creador.correo_institucional if cuestionario_duplicado.creador else None,
        "total_preguntas": cuestionario_duplicado.total_preguntas,
        "total_respuestas": cuestionario_duplicado.total_respuestas,
        "preguntas": cuestionario_duplicado.preguntas,
        "tipos_usuario_asignados": cuestionario_duplicado.tipos_usuario_asignados,
        "created_at": cuestionario_duplicado.created_at,
        "updated_at": cuestionario_duplicado.updated_at
    }

    return CuestionarioAdminOut(**cuestionario_dict)


@router.patch("/{cuestionario_id}/estado", response_model=CuestionarioAdminOut)
def cambiar_estado_cuestionario(
    *,
    db: Session = Depends(get_db),
    cuestionario_id: str,
    estado_update: CuestionarioEstadoUpdate,
    current_user: User = Depends(check_admin_or_coordinador_role)
) -> Any:
    """
    Cambiar el estado de un cuestionario (activar/desactivar/borrador).
    """
    # Buscar el cuestionario
    cuestionario = db.query(CuestionarioAdmin).options(
        joinedload(CuestionarioAdmin.creador),
        joinedload(CuestionarioAdmin.preguntas),
        joinedload(CuestionarioAdmin.asignaciones)
    ).filter(CuestionarioAdmin.id == cuestionario_id).first()

    if not cuestionario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cuestionario no encontrado"
        )

    # Verificar permisos (solo el creador o admin puede cambiar estado)
    if current_user.rol != "admin" and cuestionario.creado_por != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para cambiar el estado de este cuestionario"
        )

    # Validaciones antes de activar
    if estado_update.estado == EstadoCuestionario.ACTIVO:
        # Verificar que tenga al menos una pregunta
        if not cuestionario.preguntas or len(cuestionario.preguntas) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se puede activar un cuestionario sin preguntas"
            )

        # Verificar que tenga asignaciones
        if not cuestionario.asignaciones or len(cuestionario.asignaciones) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se puede activar un cuestionario sin asignaciones de usuarios"
            )

    # Cambiar el estado
    cuestionario.estado = estado_update.estado
    db.add(cuestionario)
    db.commit()
    db.refresh(cuestionario)

    # Enriquecer datos para respuesta
    cuestionario_dict = {
        "id": cuestionario.id,
        "titulo": cuestionario.titulo,
        "descripcion": cuestionario.descripcion,
        "fecha_creacion": cuestionario.fecha_creacion,
        "fecha_inicio": cuestionario.fecha_inicio,
        "fecha_fin": cuestionario.fecha_fin,
        "estado": cuestionario.estado,
        "creado_por": cuestionario.creado_por,
        "creado_por_nombre": cuestionario.creador.correo_institucional if cuestionario.creador else None,
        "total_preguntas": cuestionario.total_preguntas,
        "total_respuestas": cuestionario.total_respuestas,
        "preguntas": cuestionario.preguntas,
        "tipos_usuario_asignados": cuestionario.tipos_usuario_asignados,
        "created_at": cuestionario.created_at,
        "updated_at": cuestionario.updated_at
    }

    return CuestionarioAdminOut(**cuestionario_dict)


@router.post("/bulk-delete")
def bulk_delete_cuestionarios(
    *,
    db: Session = Depends(get_db),
    bulk_delete: CuestionarioBulkDelete,
    current_user: User = Depends(check_admin_or_coordinador_role)
) -> Any:
    """
    Eliminar múltiples cuestionarios en una sola operación.
    """
    deleted_ids = []
    errors = []

    for cuestionario_id in bulk_delete.ids:
        try:
            # Buscar el cuestionario
            cuestionario = db.query(CuestionarioAdmin).filter(
                CuestionarioAdmin.id == cuestionario_id
            ).first()

            if not cuestionario:
                errors.append(f"Cuestionario {cuestionario_id} no encontrado")
                continue

            # Verificar permisos
            if current_user.rol != "admin" and cuestionario.creado_por != current_user.id:
                errors.append(f"Sin permisos para eliminar cuestionario {cuestionario_id}")
                continue

            # Verificar si tiene respuestas
            respuestas_count = db.query(RespuestaCuestionario).filter(
                RespuestaCuestionario.cuestionario_id == cuestionario_id,
                RespuestaCuestionario.estado == "completado"
            ).count()

            if respuestas_count > 0:
                errors.append(f"Cuestionario {cuestionario_id} tiene {respuestas_count} respuesta(s)")
                continue

            # Eliminar el cuestionario
            db.delete(cuestionario)
            deleted_ids.append(cuestionario_id)

        except Exception as e:
            errors.append(f"Error eliminando cuestionario {cuestionario_id}: {str(e)}")

    db.commit()

    return {
        "deleted_ids": deleted_ids,
        "errors": errors,
        "total_deleted": len(deleted_ids),
        "total_errors": len(errors)
    }


@router.post("/respuestas/{respuesta_id}/regenerar-reporte", response_model=ReporteResponse)
def regenerar_reporte(
    *,
    db: Session = Depends(get_db),
    respuesta_id: str,
    current_user: User = Depends(check_admin_or_coordinador_role),
    reporte_request: Optional[RegenerarReporteRequest] = None
) -> Any:
    """
    Regenerar un reporte IA para una respuesta de cuestionario.
    Solo administradores y coordinadores pueden regenerar reportes.
    """
    # Buscar la respuesta
    respuesta = db.query(RespuestaCuestionario).filter(
        RespuestaCuestionario.id == respuesta_id
    ).options(
        joinedload(RespuestaCuestionario.respuestas_preguntas).joinedload(RespuestaPregunta.pregunta),
        joinedload(RespuestaCuestionario.respuestas_preguntas).joinedload(RespuestaPregunta.pregunta_snapshot),
        joinedload(RespuestaCuestionario.cuestionario),
        joinedload(RespuestaCuestionario.usuario)
    ).first()

    if not respuesta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Respuesta no encontrada"
        )

    if respuesta.estado != "completado":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se pueden regenerar reportes para cuestionarios completados"
        )

    # Preparar datos para la IA
    preguntas_respuestas = _combinar_preguntas_respuestas(
        respuesta,
        reporte_request.preguntas_respuestas if reporte_request else None
    )

    # Información del usuario
    base_persona_info = {
        "matricula": respuesta.usuario.matricula if respuesta.usuario else None,
        "correo": respuesta.usuario.correo_institucional if respuesta.usuario else None
    }
    persona_info = _construir_persona_info(
        base_persona_info,
        reporte_request.persona_info if reporte_request else None
    )

    instruccion_sistema = None
    if reporte_request and reporte_request.instruccion_sistema:
        instruccion_sistema = reporte_request.instruccion_sistema.strip() or None
    if not instruccion_sistema:
        instruccion_sistema = respuesta.cuestionario.instruccion_sistema

    modelo_ia = None
    if reporte_request and reporte_request.modelo_ia:
        modelo_ia = reporte_request.modelo_ia
    if not modelo_ia:
        modelo_ia = respuesta.cuestionario.modelo_ia

    # Generar reporte con IA
    contenido_reporte = ai_service.generate_questionnaire_report(
        preguntas_respuestas=preguntas_respuestas,
        instruccion_sistema=instruccion_sistema,
        persona_info=persona_info,
        modelo_ia=modelo_ia
    )

    # Obtener la versión actual más alta
    ultima_version = db.query(ReporteIA).filter(
        ReporteIA.respuesta_cuestionario_id == respuesta_id
    ).order_by(ReporteIA.version.desc()).first()

    nueva_version = (ultima_version.version + 1) if ultima_version else 1

    # Marcar reportes anteriores como no actuales
    db.query(ReporteIA).filter(
        ReporteIA.respuesta_cuestionario_id == respuesta_id,
        ReporteIA.es_actual == True
    ).update({"es_actual": False})

    # Crear nuevo reporte
    reporte_id = str(uuid.uuid4())
    nuevo_reporte = ReporteIA(
        id=reporte_id,
        respuesta_cuestionario_id=respuesta_id,
        contenido=contenido_reporte,
        version=nueva_version,
        es_actual=True
    )

    db.add(nuevo_reporte)
    db.commit()
    db.refresh(nuevo_reporte)

    return ReporteResponse(
        id=nuevo_reporte.id,
        respuesta_cuestionario_id=nuevo_reporte.respuesta_cuestionario_id,
        version=nuevo_reporte.version,
        es_actual=nuevo_reporte.es_actual,
        contenido=nuevo_reporte.contenido,
        fecha_generacion=nuevo_reporte.fecha_generacion,
        mensaje=f"Reporte regenerado exitosamente (versión {nueva_version})"
    )


@router.get("/respuestas/{respuesta_id}/reportes")
def get_reportes_admin(
    *,
    db: Session = Depends(get_db),
    respuesta_id: str,
    current_user: User = Depends(check_admin_or_coordinador_role)
) -> Any:
    """
    Obtener todos los reportes generados para una respuesta de cuestionario.
    Solo administradores y coordinadores pueden acceder.
    """
    # Verificar que la respuesta existe
    respuesta = db.query(RespuestaCuestionario).options(
        joinedload(RespuestaCuestionario.respuestas_preguntas).joinedload(RespuestaPregunta.pregunta),
        joinedload(RespuestaCuestionario.respuestas_preguntas).joinedload(RespuestaPregunta.pregunta_snapshot)
    ).filter(
        RespuestaCuestionario.id == respuesta_id
    ).first()

    if not respuesta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Respuesta no encontrada"
        )

    # Obtener todos los reportes ordenados por versión descendente
    reportes = db.query(ReporteIA).filter(
        ReporteIA.respuesta_cuestionario_id == respuesta_id
    ).order_by(ReporteIA.version.desc()).all()

    return {
        "respuesta_id": respuesta_id,
        "total_reportes": len(reportes),
        "reportes": [
            {
                "id": r.id,
                "version": r.version,
                "es_actual": r.es_actual,
                "fecha_generacion": r.fecha_generacion.isoformat() if r.fecha_generacion else None,
                "contenido": r.contenido
            }
            for r in reportes
        ]
    }


@router.get("/respuestas/{respuesta_id}/reporte-actual")
def get_reporte_actual_admin(
    *,
    db: Session = Depends(get_db),
    respuesta_id: str,
    current_user: User = Depends(check_admin_or_coordinador_role)
) -> Any:
    """
    Obtener el reporte actual (más reciente) de una respuesta de cuestionario.
    Solo administradores y coordinadores pueden acceder.
    """
    # Verificar que la respuesta existe
    respuesta = db.query(RespuestaCuestionario).filter(
        RespuestaCuestionario.id == respuesta_id
    ).first()

    if not respuesta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Respuesta no encontrada"
        )

    # Obtener el reporte actual (es_actual=True)
    reporte = db.query(ReporteIA).filter(
        ReporteIA.respuesta_cuestionario_id == respuesta_id,
        ReporteIA.es_actual == True
    ).first()

    if not reporte:
        return {
            "reporte": None,
            "mensaje": "No hay reporte generado aún"
        }

    return {
        "reporte": {
            "id": reporte.id,
            "respuesta_cuestionario_id": reporte.respuesta_cuestionario_id,
            "contenido": reporte.contenido,
            "version": reporte.version,
            "es_actual": reporte.es_actual,
            "fecha_generacion": reporte.fecha_generacion.isoformat() if reporte.fecha_generacion else None,
            "created_at": reporte.created_at.isoformat() if reporte.created_at else None
        }
    }


@router.get("/respuestas/{respuesta_id}/reportes/{reporte_id}")
def get_reporte_by_id_admin(
    *,
    db: Session = Depends(get_db),
    respuesta_id: str,
    reporte_id: str,
    current_user: User = Depends(check_admin_or_coordinador_role)
) -> Any:
    """
    Obtener un reporte específico por su ID.
    Permite revisar versiones anteriores del reporte.
    Solo administradores y coordinadores pueden acceder.
    """
    # Verificar que la respuesta existe
    respuesta = db.query(RespuestaCuestionario).filter(
        RespuestaCuestionario.id == respuesta_id
    ).first()

    if not respuesta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Respuesta no encontrada"
        )

    # Obtener el reporte específico
    reporte = db.query(ReporteIA).filter(
        ReporteIA.id == reporte_id,
        ReporteIA.respuesta_cuestionario_id == respuesta_id
    ).first()

    if not reporte:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reporte no encontrado"
        )

    return {
        "id": reporte.id,
        "respuesta_cuestionario_id": reporte.respuesta_cuestionario_id,
        "version": reporte.version,
        "es_actual": reporte.es_actual,
        "contenido": reporte.contenido,
        "fecha_generacion": reporte.fecha_generacion.isoformat() if reporte.fecha_generacion else None,
        "created_at": reporte.created_at.isoformat() if reporte.created_at else None
    }


@router.get("/respuestas/{respuesta_id}/reportes/version/{version}")
def get_reporte_by_version_admin(
    *,
    db: Session = Depends(get_db),
    respuesta_id: str,
    version: int,
    current_user: User = Depends(check_admin_or_coordinador_role)
) -> Any:
    """
    Obtener un reporte específico por su número de versión.
    Permite revisar versiones anteriores del reporte.
    Solo administradores y coordinadores pueden acceder.
    """
    # Verificar que la respuesta existe
    respuesta = db.query(RespuestaCuestionario).filter(
        RespuestaCuestionario.id == respuesta_id
    ).first()

    if not respuesta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Respuesta no encontrada"
        )

    # Obtener el reporte por versión
    reporte = db.query(ReporteIA).filter(
        ReporteIA.respuesta_cuestionario_id == respuesta_id,
        ReporteIA.version == version
    ).first()

    if not reporte:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró reporte con versión {version}"
        )

    return {
        "id": reporte.id,
        "respuesta_cuestionario_id": reporte.respuesta_cuestionario_id,
        "version": reporte.version,
        "es_actual": reporte.es_actual,
        "contenido": reporte.contenido,
        "fecha_generacion": reporte.fecha_generacion.isoformat() if reporte.fecha_generacion else None,
        "created_at": reporte.created_at.isoformat() if reporte.created_at else None
    }


@router.get("/respuestas/todas")
def get_todas_las_respuestas(
    *,
    db: Session = Depends(get_db),
    cuestionario_id: Optional[str] = Query(None, description="Filtrar por cuestionario específico"),
    usuario_id: Optional[int] = Query(None, description="Filtrar por usuario específico"),
    estado: Optional[str] = Query(None, description="Filtrar por estado (pendiente, en_progreso, completado)"),
    fecha_desde: Optional[datetime] = Query(None, description="Filtrar desde fecha"),
    fecha_hasta: Optional[datetime] = Query(None, description="Filtrar hasta fecha"),
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(50, ge=1, le=100, description="Número máximo de registros"),
    current_user: User = Depends(check_admin_or_coordinador_role)
) -> Any:
    """
    Obtener todas las respuestas de cuestionarios administrativos con filtros.
    Solo disponible para administradores y coordinadores.

    Returns:
        Lista de respuestas con información del usuario y cuestionario.
    """
    # Construir query base con joins para obtener información relacionada
    query = db.query(RespuestaCuestionario).options(
        joinedload(RespuestaCuestionario.usuario),
        joinedload(RespuestaCuestionario.cuestionario).joinedload(CuestionarioAdmin.preguntas),
        joinedload(RespuestaCuestionario.respuestas_preguntas).joinedload(RespuestaPregunta.pregunta),
        joinedload(RespuestaCuestionario.respuestas_preguntas).joinedload(RespuestaPregunta.pregunta_snapshot)
    )

    # Aplicar filtros
    if cuestionario_id:
        query = query.filter(RespuestaCuestionario.cuestionario_id == cuestionario_id)

    if usuario_id:
        query = query.filter(RespuestaCuestionario.usuario_id == usuario_id)

    if estado:
        query = query.filter(RespuestaCuestionario.estado == estado)

    if fecha_desde:
        query = query.filter(RespuestaCuestionario.fecha_inicio >= fecha_desde)

    if fecha_hasta:
        query = query.filter(RespuestaCuestionario.fecha_inicio <= fecha_hasta)

    # Contar total antes de aplicar paginación
    total = query.count()

    # Aplicar paginación y ordenamiento (más recientes primero)
    respuestas = query.order_by(RespuestaCuestionario.created_at.desc()).offset(skip).limit(limit).all()

    # Enriquecer datos para respuesta
    respuestas_out = []
    instruccion_sistema_default = ai_service._get_default_system_instruction()
    for respuesta in respuestas:
        # Serializar respuestas_preguntas manualmente con información de la pregunta
        respuestas_preguntas_serialized = []
        if respuesta.respuestas_preguntas:
            for rp in respuesta.respuestas_preguntas:
                respuesta_pregunta_dict = {
                    "id": rp.id,
                    "pregunta_id": rp.pregunta_id,
                    "valor": rp.valor,
                    "texto_otro": rp.texto_otro,
                    "created_at": rp.created_at.isoformat() if rp.created_at else None,
                    "updated_at": rp.updated_at.isoformat() if rp.updated_at else None
                }

                # Agregar información de la pregunta
                if rp.pregunta:
                    respuesta_pregunta_dict["pregunta"] = {
                        "id": rp.pregunta.id,
                        "texto": rp.pregunta.texto,
                        "descripcion": rp.pregunta.descripcion,
                        "tipo": rp.pregunta.tipo,
                        "obligatoria": rp.pregunta.obligatoria,
                        "orden": rp.pregunta.orden,
                        "configuracion": rp.pregunta.configuracion
                    }

                respuestas_preguntas_serialized.append(respuesta_pregunta_dict)

        respuesta_dict = {
            "id": respuesta.id,
            "cuestionario_id": respuesta.cuestionario_id,
            "usuario_id": respuesta.usuario_id,
            "estado": respuesta.estado,
            "fecha_inicio": respuesta.fecha_inicio.isoformat() if respuesta.fecha_inicio else None,
            "fecha_completado": respuesta.fecha_completado.isoformat() if respuesta.fecha_completado else None,
            "progreso": respuesta.progreso,
            "tiempo_total_minutos": respuesta.tiempo_total_minutos,
            "respuestas_preguntas": respuestas_preguntas_serialized,
            "created_at": respuesta.created_at.isoformat() if respuesta.created_at else None,
            "updated_at": respuesta.updated_at.isoformat() if respuesta.updated_at else None,
            # Información adicional del usuario
            "usuario_correo": respuesta.usuario.correo_institucional if respuesta.usuario else None,
            "usuario_matricula": respuesta.usuario.matricula if respuesta.usuario else None,
            # Nota: El modelo User no tiene campos de nombre, solo correo y matrícula
            "usuario_nombre": respuesta.usuario.correo_institucional if respuesta.usuario else None,
            # Información adicional del cuestionario
            "cuestionario_titulo": respuesta.cuestionario.titulo if respuesta.cuestionario else None,
            "cuestionario_descripcion": respuesta.cuestionario.descripcion if respuesta.cuestionario else None,
            "cuestionario_instruccion_sistema": respuesta.cuestionario.instruccion_sistema if respuesta.cuestionario else None,
            "cuestionario_modelo_ia": respuesta.cuestionario.modelo_ia if respuesta.cuestionario else None,
            "instruccion_sistema_default": instruccion_sistema_default,
        }
        respuestas_out.append(respuesta_dict)

    return {
        "respuestas": respuestas_out,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/respuestas/{respuesta_id}/reportes/{reporte_id}/html", response_class=HTMLResponse)
def get_reporte_html_by_id_admin(
    *,
    db: Session = Depends(get_db),
    respuesta_id: str,
    reporte_id: str,
    current_user: User = Depends(check_admin_or_coordinador_role)
) -> str:
    """
    Obtener un reporte específico renderizado en HTML.
    Convierte el contenido Markdown del reporte a HTML con estilos.
    Solo administradores y coordinadores pueden acceder.
    """
    # Verificar que la respuesta existe
    respuesta = db.query(RespuestaCuestionario).filter(
        RespuestaCuestionario.id == respuesta_id
    ).first()

    if not respuesta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Respuesta no encontrada"
        )

    # Obtener el reporte específico
    reporte = db.query(ReporteIA).filter(
        ReporteIA.id == reporte_id,
        ReporteIA.respuesta_cuestionario_id == respuesta_id
    ).first()

    if not reporte:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reporte no encontrado"
        )

    # Renderizar el contenido Markdown a HTML
    html_content = markdown_service.render_to_html(reporte.contenido, add_css=True)

    return html_content


@router.get("/respuestas/{respuesta_id}/reportes/version/{version}/html", response_class=HTMLResponse)
def get_reporte_html_by_version_admin(
    *,
    db: Session = Depends(get_db),
    respuesta_id: str,
    version: int,
    current_user: User = Depends(check_admin_or_coordinador_role)
) -> str:
    """
    Obtener un reporte específico por versión renderizado en HTML.
    Convierte el contenido Markdown del reporte a HTML con estilos.
    Solo administradores y coordinadores pueden acceder.
    """
    # Verificar que la respuesta existe
    respuesta = db.query(RespuestaCuestionario).filter(
        RespuestaCuestionario.id == respuesta_id
    ).first()

    if not respuesta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Respuesta no encontrada"
        )

    # Obtener el reporte por versión
    reporte = db.query(ReporteIA).filter(
        ReporteIA.respuesta_cuestionario_id == respuesta_id,
        ReporteIA.version == version
    ).first()

    if not reporte:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró reporte con versión {version}"
        )

    # Renderizar el contenido Markdown a HTML
    html_content = markdown_service.render_to_html(reporte.contenido, add_css=True)

    return html_content


@router.get("/respuestas/{respuesta_id}/reporte-actual/html", response_class=HTMLResponse)
def get_reporte_actual_html_admin(
    *,
    db: Session = Depends(get_db),
    respuesta_id: str,
    current_user: User = Depends(check_admin_or_coordinador_role)
) -> str:
    """
    Obtener el reporte actual renderizado en HTML.
    Convierte el contenido Markdown del reporte a HTML con estilos.
    Solo administradores y coordinadores pueden acceder.
    """
    # Verificar que la respuesta existe
    respuesta = db.query(RespuestaCuestionario).filter(
        RespuestaCuestionario.id == respuesta_id
    ).first()

    if not respuesta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Respuesta no encontrada"
        )

    # Obtener el reporte actual
    reporte = db.query(ReporteIA).filter(
        ReporteIA.respuesta_cuestionario_id == respuesta_id,
        ReporteIA.es_actual == True
    ).first()

    if not reporte:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No hay reporte generado para esta respuesta"
        )

    # Renderizar el contenido Markdown a HTML
    html_content = markdown_service.render_to_html(reporte.contenido, add_css=True)

    return html_content


@router.get("/respuestas/{respuesta_id}/reportes/{reporte_id}/download/word")
def download_reporte_word_admin(
    *,
    db: Session = Depends(get_db),
    respuesta_id: str,
    reporte_id: str,
    current_user: User = Depends(check_admin_or_coordinador_role),
    request: Request
) -> StreamingResponse:
    """
    Descargar un reporte específico en formato Word (DOCX).
    Solo administradores y coordinadores pueden acceder.
    """
    # Verificar que la respuesta existe
    respuesta = db.query(RespuestaCuestionario).options(
        joinedload(RespuestaCuestionario.respuestas_preguntas).joinedload(RespuestaPregunta.pregunta),
        joinedload(RespuestaCuestionario.respuestas_preguntas).joinedload(RespuestaPregunta.pregunta_snapshot)
    ).filter(
        RespuestaCuestionario.id == respuesta_id
    ).first()

    if not respuesta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Respuesta no encontrada"
        )

    # Obtener el reporte específico
    reporte = db.query(ReporteIA).filter(
        ReporteIA.id == reporte_id,
        ReporteIA.respuesta_cuestionario_id == respuesta_id
    ).first()

    if not reporte:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reporte no encontrado"
        )

    # Preparar metadatos
    metadata = {
        "version": reporte.version,
        "fecha_generacion": reporte.fecha_generacion.strftime("%d/%m/%Y %H:%M") if reporte.fecha_generacion else "N/A"
    }

    contenido_exportable = _agregar_preguntas_respuestas_al_contenido(reporte.contenido, respuesta)

    # Exportar a Word
    file_stream = export_service.export_to_word(contenido_exportable, metadata)

    # Nombre del archivo
    filename = f"reporte_psicopedagogico_v{reporte.version}.docx"

    return _build_download_response(
        file_stream,
        filename,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        request.headers.get("origin")
    )


@router.get("/respuestas/{respuesta_id}/reportes/{reporte_id}/download/excel")
def download_reporte_excel_admin(
    *,
    db: Session = Depends(get_db),
    respuesta_id: str,
    reporte_id: str,
    current_user: User = Depends(check_admin_or_coordinador_role),
    request: Request
) -> StreamingResponse:
    """
    Descargar un reporte específico en formato Excel (XLSX).
    Solo administradores y coordinadores pueden acceder.
    """
    # Verificar que la respuesta existe
    respuesta = db.query(RespuestaCuestionario).options(
        joinedload(RespuestaCuestionario.respuestas_preguntas).joinedload(RespuestaPregunta.pregunta),
        joinedload(RespuestaCuestionario.respuestas_preguntas).joinedload(RespuestaPregunta.pregunta_snapshot)
    ).filter(
        RespuestaCuestionario.id == respuesta_id
    ).first()

    if not respuesta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Respuesta no encontrada"
        )

    # Obtener el reporte específico
    reporte = db.query(ReporteIA).filter(
        ReporteIA.id == reporte_id,
        ReporteIA.respuesta_cuestionario_id == respuesta_id
    ).first()

    if not reporte:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reporte no encontrado"
        )

    # Preparar metadatos
    metadata = {
        "version": reporte.version,
        "fecha_generacion": reporte.fecha_generacion.strftime("%d/%m/%Y %H:%M") if reporte.fecha_generacion else "N/A"
    }

    contenido_exportable = _agregar_preguntas_respuestas_al_contenido(reporte.contenido, respuesta)

    # Exportar a Excel
    file_stream = export_service.export_to_excel(contenido_exportable, metadata)

    # Nombre del archivo
    filename = f"reporte_psicopedagogico_v{reporte.version}.xlsx"

    return _build_download_response(
        file_stream,
        filename,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        request.headers.get("origin")
    )


@router.get("/respuestas/{respuesta_id}/reportes/{reporte_id}/download/pdf")
def download_reporte_pdf_admin(
    *,
    db: Session = Depends(get_db),
    respuesta_id: str,
    reporte_id: str,
    current_user: User = Depends(check_admin_or_coordinador_role),
    request: Request
) -> StreamingResponse:
    """
    Descargar un reporte específico en formato PDF.
    Solo administradores y coordinadores pueden acceder.
    """
    # Verificar que la respuesta existe
    respuesta = db.query(RespuestaCuestionario).options(
        joinedload(RespuestaCuestionario.respuestas_preguntas).joinedload(RespuestaPregunta.pregunta),
        joinedload(RespuestaCuestionario.respuestas_preguntas).joinedload(RespuestaPregunta.pregunta_snapshot)
    ).filter(
        RespuestaCuestionario.id == respuesta_id
    ).first()

    if not respuesta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Respuesta no encontrada"
        )

    # Obtener el reporte específico
    reporte = db.query(ReporteIA).filter(
        ReporteIA.id == reporte_id,
        ReporteIA.respuesta_cuestionario_id == respuesta_id
    ).first()

    if not reporte:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reporte no encontrado"
        )

    # Preparar metadatos
    metadata = {
        "version": reporte.version,
        "fecha_generacion": reporte.fecha_generacion.strftime("%d/%m/%Y %H:%M") if reporte.fecha_generacion else "N/A"
    }

    contenido_exportable = _agregar_preguntas_respuestas_al_contenido(reporte.contenido, respuesta)

    # Exportar a PDF
    file_stream = export_service.export_to_pdf(contenido_exportable, metadata)

    # Nombre del archivo
    filename = f"reporte_psicopedagogico_v{reporte.version}.pdf"

    return _build_download_response(
        file_stream,
        filename,
        "application/pdf",
        request.headers.get("origin")
    )


@router.delete("/respuestas/{respuesta_id}")
def eliminar_respuesta(
    *,
    db: Session = Depends(get_db),
    respuesta_id: str,
    current_user: User = Depends(check_admin_or_coordinador_role)
) -> Any:
    """
    Eliminar una respuesta de cuestionario y todos sus datos asociados.
    Solo disponible para administradores y coordinadores.
    """
    # Buscar la respuesta
    respuesta = db.query(RespuestaCuestionario).filter(
        RespuestaCuestionario.id == respuesta_id
    ).first()

    if not respuesta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Respuesta no encontrada"
        )

    # Eliminar la respuesta (cascade eliminará respuestas_preguntas y reportes)
    db.delete(respuesta)
    db.commit()

    return {"message": "Respuesta eliminada correctamente"}


@router.post("/respuestas/bulk-cancel")
def bulk_cancel_respuestas(
    *,
    db: Session = Depends(get_db),
    bulk_cancel: RespuestaBulkCancel,
    current_user: User = Depends(check_admin_or_coordinador_role)
) -> Any:
    """
    Cancelar múltiples respuestas de cuestionarios en una sola operación.
    Cambia el estado de las respuestas a 'cancelado'.
    Solo disponible para administradores y coordinadores.

    Reason: Permite a los administradores cancelar respuestas en lote sin eliminarlas,
    manteniendo el historial pero marcándolas como canceladas.
    """
    cancelled_ids = []
    errors = []

    for respuesta_id in bulk_cancel.ids:
        try:
            # Buscar la respuesta
            respuesta = db.query(RespuestaCuestionario).filter(
                RespuestaCuestionario.id == respuesta_id
            ).first()

            if not respuesta:
                errors.append(f"Respuesta {respuesta_id} no encontrada")
                continue

            # Verificar que no esté ya cancelada
            if respuesta.estado == "cancelado":
                errors.append(f"Respuesta {respuesta_id} ya está cancelada")
                continue

            # Cambiar estado a cancelado
            respuesta.estado = "cancelado"
            respuesta.updated_at = datetime.now()
            cancelled_ids.append(respuesta_id)

        except Exception as e:
            errors.append(f"Error cancelando respuesta {respuesta_id}: {str(e)}")

    db.commit()

    return {
        "cancelled_ids": cancelled_ids,
        "errors": errors,
        "total_cancelled": len(cancelled_ids),
        "total_errors": len(errors)
    }
