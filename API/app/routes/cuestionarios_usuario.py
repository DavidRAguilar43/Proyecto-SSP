from typing import Any, Dict, List, Optional
import uuid
from datetime import datetime
from zoneinfo import ZoneInfo
import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from fastapi.responses import HTMLResponse, StreamingResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_

# Configurar logger
logger = logging.getLogger(__name__)

# Zona horaria de México
MEXICO_TZ = ZoneInfo("America/Mexico_City")

from app.db.database import get_db
from app.models.cuestionario_admin import (
    CuestionarioAdmin,
    Pregunta,
    AsignacionCuestionario,
    CuestionarioSnapshot,
    PreguntaSnapshot,
    RespuestaCuestionario,
    RespuestaPregunta,
    ReporteIA,
    TipoUsuario,
    EstadoCuestionario
)
from app.models.persona import User
from app.schemas.cuestionario_admin import (
    CuestionarioAdminOut,
    RespuestaCuestionarioCreate,
    RespuestaCuestionarioUpdate,
    RespuestaCuestionarioOut,
    PreguntaOut,
    GenerarReporteRequest,
    RegenerarReporteRequest,
    ReporteResponse,
    PreguntaRespuestaReporte
)
from app.services.snapshot_service import (
    obtener_o_crear_snapshot,
    obtener_pregunta_snapshot_por_original
)
from app.utils.deps import get_current_active_user
from app.services.ai_service import ai_service
from app.services.markdown_service import markdown_service
from app.services.export_service import export_service

router = APIRouter(prefix="/cuestionarios-usuario", tags=["cuestionarios-usuario"])


def _formatear_valor_respuesta(valor: Any) -> str:
    """Normaliza el valor de una respuesta para enviarla a la IA."""
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

    logger.info(f"📊 Total de respuestas_preguntas en BD: {len(respuesta.respuestas_preguntas)}")

    for idx, respuesta_pregunta in enumerate(respuesta.respuestas_preguntas, 1):
        logger.info(f"  [{idx}] Procesando respuesta_pregunta:")
        logger.info(f"      - pregunta_id: {respuesta_pregunta.pregunta_id}")
        logger.info(f"      - pregunta_snapshot_id: {respuesta_pregunta.pregunta_snapshot_id}")
        logger.info(f"      - tiene pregunta_snapshot: {respuesta_pregunta.pregunta_snapshot is not None}")
        logger.info(f"      - tiene pregunta: {respuesta_pregunta.pregunta is not None}")
        logger.info(f"      - valor: {respuesta_pregunta.valor}")
        logger.info(f"      - texto_otro: {respuesta_pregunta.texto_otro}")

        # PROTECCIÓN: Usar snapshot si existe, sino usar pregunta original
        # Reason: Las respuestas NO deben desaparecer solo porque se editó el cuestionario
        if respuesta_pregunta.pregunta_snapshot:
            # Usar snapshot (respuestas nuevas con sistema de snapshots)
            pregunta_texto = respuesta_pregunta.pregunta_snapshot.texto
            pregunta_orden = respuesta_pregunta.pregunta_snapshot.orden if respuesta_pregunta.pregunta_snapshot.orden is not None else idx
            logger.info(f"  ℹ️ [{idx}] Usando pregunta_snapshot")
        elif respuesta_pregunta.pregunta:
            # Pregunta aún existe en el cuestionario (respuestas antiguas)
            pregunta_texto = respuesta_pregunta.pregunta.texto
            pregunta_orden = respuesta_pregunta.pregunta.orden if respuesta_pregunta.pregunta.orden is not None else idx
            logger.info(f"  ℹ️ [{idx}] Usando pregunta original (respuesta antigua)")
        else:
            # No hay snapshot ni pregunta original, saltar
            logger.warning(f"  ⚠️ [{idx}] Saltando porque no hay pregunta_snapshot ni pregunta")
            continue

        pregunta_data = {
            "pregunta_id": respuesta_pregunta.pregunta_id,
            "pregunta": pregunta_texto,
            "respuesta": _normalizar_respuesta(respuesta_pregunta.valor, respuesta_pregunta.texto_otro),
            "orden": pregunta_orden
        }

        logger.info(f"  ✅ [{idx}] Agregando: {pregunta_data['pregunta'][:50]}... -> {pregunta_data['respuesta'][:50] if pregunta_data['respuesta'] else 'None'}...")
        preguntas_respuestas.append(pregunta_data)

    # Ordenar por el orden de la pregunta para mantener consistencia
    preguntas_respuestas.sort(key=lambda item: item.get("orden", 0))

    logger.info(f"📋 Total de preguntas_respuestas construidas: {len(preguntas_respuestas)}")
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

    # Asegurar orden consistente
    base.sort(key=lambda item: item.get("orden", 0))

    return base


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


def _agregar_preguntas_respuestas_al_contenido(
    contenido: str,
    respuesta: RespuestaCuestionario
) -> str:
    """Agrega una sección de preguntas y respuestas al contenido Markdown."""
    if not respuesta.respuestas_preguntas:
        return contenido

    # Filtrar y ordenar preguntas (usar snapshot si existe, sino pregunta original)
    preguntas = []
    for rp in respuesta.respuestas_preguntas:
        if rp.pregunta_snapshot:
            preguntas.append((rp, rp.pregunta_snapshot.orden))
        elif rp.pregunta:
            preguntas.append((rp, rp.pregunta.orden if rp.pregunta.orden is not None else 0))

    if not preguntas:
        return contenido

    # Ordenar por orden
    preguntas.sort(key=lambda item: item[1])

    seccion = ["\n\n---\n", "## Preguntas y Respuestas\n\n"]
    for idx, (rp, _) in enumerate(preguntas, start=1):
        # Usar snapshot si existe, sino pregunta original
        if rp.pregunta_snapshot:
            pregunta_texto = rp.pregunta_snapshot.texto
            pregunta_descripcion = rp.pregunta_snapshot.descripcion
        elif rp.pregunta:
            pregunta_texto = rp.pregunta.texto
            pregunta_descripcion = rp.pregunta.descripcion
        else:
            pregunta_texto = "Pregunta"
            pregunta_descripcion = None

        respuesta_texto = _normalizar_respuesta(rp.valor, rp.texto_otro)

        seccion.append(f"{idx}. **{pregunta_texto}**\n")
        if pregunta_descripcion:
            seccion.append(f"   - Descripción: {pregunta_descripcion}\n")
        seccion.append(f"   - Respuesta: {respuesta_texto}\n\n")

    return contenido.rstrip() + "".join(seccion)


def get_tipo_usuario_from_rol(rol: str) -> TipoUsuario:
    """Convertir rol de persona a tipo de usuario para cuestionarios"""
    if rol == "alumno":
        return TipoUsuario.ALUMNO
    elif rol == "docente":
        return TipoUsuario.DOCENTE
    elif rol in ["personal", "admin", "coordinador"]:
        return TipoUsuario.PERSONAL
    else:
        raise ValueError(f"Rol no válido para cuestionarios: {rol}")


@router.get("/asignados")
def get_cuestionarios_asignados(
    *,
    db: Session = Depends(get_db),
    estado: Optional[str] = Query(None, description="Filtrar por estado de respuesta"),
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(10, ge=1, le=50, description="Número máximo de registros"),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Obtener cuestionarios asignados al usuario actual según su rol.
    """
    try:
        # Determinar tipo de usuario basado en el rol
        tipo_usuario = get_tipo_usuario_from_rol(current_user.rol)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    # Obtener cuestionarios asignados al tipo de usuario
    query = db.query(CuestionarioAdmin).join(
        AsignacionCuestionario,
        CuestionarioAdmin.id == AsignacionCuestionario.cuestionario_id
    ).filter(
        AsignacionCuestionario.tipo_usuario == tipo_usuario,
        CuestionarioAdmin.estado == EstadoCuestionario.ACTIVO
    ).options(
        joinedload(CuestionarioAdmin.preguntas),
        joinedload(CuestionarioAdmin.creador)
    )

    # Filtrar por fechas de disponibilidad
    now = datetime.now(MEXICO_TZ)
    query = query.filter(
        or_(
            CuestionarioAdmin.fecha_inicio.is_(None),
            CuestionarioAdmin.fecha_inicio <= now
        ),
        or_(
            CuestionarioAdmin.fecha_fin.is_(None),
            CuestionarioAdmin.fecha_fin >= now
        )
    )

    cuestionarios = query.order_by(CuestionarioAdmin.created_at.desc()).offset(skip).limit(limit).all()

    # Obtener respuestas del usuario para estos cuestionarios
    cuestionarios_ids = [c.id for c in cuestionarios]
    respuestas_usuario = {}
    
    if cuestionarios_ids:
        respuestas = db.query(RespuestaCuestionario).filter(
            RespuestaCuestionario.cuestionario_id.in_(cuestionarios_ids),
            RespuestaCuestionario.usuario_id == current_user.id
        ).all()
        
        for respuesta in respuestas:
            respuestas_usuario[respuesta.cuestionario_id] = respuesta

    # Construir respuesta con información de estado
    cuestionarios_asignados = []
    for cuestionario in cuestionarios:
        respuesta = respuestas_usuario.get(cuestionario.id)

        # Determinar estado y progreso
        if respuesta:
            estado_respuesta = respuesta.estado
            progreso = respuesta.progreso
            fecha_inicio = respuesta.fecha_inicio
            fecha_completado = respuesta.fecha_completado
            puede_responder = estado_respuesta != "completado"
        else:
            estado_respuesta = "pendiente"
            progreso = 0
            fecha_inicio = None
            fecha_completado = None
            puede_responder = True

        # Filtrar por estado si se especifica
        if estado and estado_respuesta != estado:
            continue

        # Construir nombre del creador de forma segura
        creado_por_nombre = None
        if cuestionario.creador:
            try:
                nombre = getattr(cuestionario.creador, 'nombre', '')
                apellido = getattr(cuestionario.creador, 'apellido_paterno', '')
                if nombre or apellido:
                    creado_por_nombre = f"{nombre} {apellido}".strip()
            except Exception:
                creado_por_nombre = None

        # Construir objeto de cuestionario
        cuestionario_obj = {
            "id": cuestionario.id,
            "titulo": cuestionario.titulo,
            "descripcion": cuestionario.descripcion,
            "fecha_creacion": cuestionario.fecha_creacion.isoformat() if cuestionario.fecha_creacion else None,
            "fecha_inicio": cuestionario.fecha_inicio.isoformat() if cuestionario.fecha_inicio else None,
            "fecha_fin": cuestionario.fecha_fin.isoformat() if cuestionario.fecha_fin else None,
            "estado": cuestionario.estado.value if hasattr(cuestionario.estado, 'value') else str(cuestionario.estado),
            "creado_por": cuestionario.creado_por,
            "creado_por_nombre": creado_por_nombre,
            "total_preguntas": cuestionario.total_preguntas,
            "total_respuestas": cuestionario.total_respuestas,
            "preguntas": [],  # No incluir preguntas en el listado
            "tipos_usuario_asignados": [t.value if hasattr(t, 'value') else str(t) for t in cuestionario.tipos_usuario_asignados],
            "created_at": cuestionario.created_at.isoformat() if cuestionario.created_at else None,
            "updated_at": cuestionario.updated_at.isoformat() if cuestionario.updated_at else None,
        }

        # Construir objeto de respuesta si existe
        respuesta_obj = None
        if respuesta:
            respuesta_obj = {
                "id": respuesta.id,
                "cuestionario_id": respuesta.cuestionario_id,
                "usuario_id": respuesta.usuario_id,
                "estado": estado_respuesta,
                "fecha_inicio": fecha_inicio.isoformat() if fecha_inicio else None,
                "fecha_completado": fecha_completado.isoformat() if fecha_completado else None,
                "progreso_porcentaje": progreso,
                "tiempo_total_minutos": respuesta.tiempo_total_minutos,
                "respuestas": []  # No incluir respuestas detalladas en el listado
            }

        # Construir objeto de cuestionario asignado
        cuestionario_asignado = {
            "cuestionario": cuestionario_obj,
            "respuesta": respuesta_obj,
            "estado": estado_respuesta,
            "fecha_asignacion": cuestionario.created_at.isoformat() if cuestionario.created_at else None,
            "fecha_limite": cuestionario.fecha_fin.isoformat() if cuestionario.fecha_fin else None,
            "puede_responder": puede_responder
        }

        cuestionarios_asignados.append(cuestionario_asignado)

    return {
        "cuestionarios_asignados": cuestionarios_asignados,
        "total": len(cuestionarios_asignados)
    }


@router.get("/{cuestionario_id}/responder")
def get_cuestionario_para_responder(
    *,
    db: Session = Depends(get_db),
    cuestionario_id: str,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Obtener un cuestionario específico para responder, incluyendo preguntas y respuestas previas.
    """
    try:
        # Determinar tipo de usuario basado en el rol
        tipo_usuario = get_tipo_usuario_from_rol(current_user.rol)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    # Verificar que el cuestionario existe y está asignado al usuario
    cuestionario = db.query(CuestionarioAdmin).join(
        AsignacionCuestionario,
        CuestionarioAdmin.id == AsignacionCuestionario.cuestionario_id
    ).filter(
        CuestionarioAdmin.id == cuestionario_id,
        AsignacionCuestionario.tipo_usuario == tipo_usuario,
        CuestionarioAdmin.estado == EstadoCuestionario.ACTIVO
    ).options(
        joinedload(CuestionarioAdmin.preguntas),
        joinedload(CuestionarioAdmin.creador)
    ).first()

    if not cuestionario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cuestionario no encontrado o no asignado a tu tipo de usuario"
        )

    # Verificar fechas de disponibilidad
    now = datetime.now(MEXICO_TZ)
    if cuestionario.fecha_inicio and cuestionario.fecha_inicio > now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El cuestionario aún no está disponible"
        )
    
    if cuestionario.fecha_fin and cuestionario.fecha_fin < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El cuestionario ya no está disponible"
        )

    # Obtener respuesta existente del usuario
    respuesta_existente = db.query(RespuestaCuestionario).filter(
        RespuestaCuestionario.cuestionario_id == cuestionario_id,
        RespuestaCuestionario.usuario_id == current_user.id
    ).options(
        joinedload(RespuestaCuestionario.respuestas_preguntas)
    ).first()

    # Si ya completó el cuestionario, no permitir responder de nuevo
    if respuesta_existente and respuesta_existente.estado == "completado":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya has completado este cuestionario"
        )

    # Preparar respuestas previas si existen
    respuestas_previas = {}
    if respuesta_existente:
        for respuesta_pregunta in respuesta_existente.respuestas_preguntas:
            respuestas_previas[respuesta_pregunta.pregunta_id] = {
                "valor": respuesta_pregunta.valor,
                "texto_otro": respuesta_pregunta.texto_otro
            }

    # Construir nombre del creador de forma segura
    creado_por_nombre = None
    if cuestionario.creador:
        # El modelo User no tiene campos nombre/apellido, usar correo_institucional
        creado_por_nombre = cuestionario.creador.correo_institucional

    # Serializar preguntas manualmente
    preguntas_serializadas = []
    for pregunta in sorted(cuestionario.preguntas, key=lambda p: p.orden):
        pregunta_dict = {
            "id": pregunta.id,
            "cuestionario_id": pregunta.cuestionario_id,
            "texto": pregunta.texto,
            "tipo": pregunta.tipo.value if hasattr(pregunta.tipo, 'value') else str(pregunta.tipo),
            "obligatoria": pregunta.obligatoria,
            "orden": pregunta.orden,
            "configuracion": pregunta.configuracion,
            "created_at": pregunta.created_at.isoformat() if pregunta.created_at else None,
            "updated_at": pregunta.updated_at.isoformat() if pregunta.updated_at else None
        }
        preguntas_serializadas.append(pregunta_dict)

    # Serializar tipos de usuario asignados
    tipos_usuario_serializados = [
        tipo.value if hasattr(tipo, 'value') else str(tipo)
        for tipo in cuestionario.tipos_usuario_asignados
    ]

    # Construir respuesta
    cuestionario_data = {
        "id": cuestionario.id,
        "titulo": cuestionario.titulo,
        "descripcion": cuestionario.descripcion,
        "fecha_creacion": cuestionario.fecha_creacion.isoformat() if cuestionario.fecha_creacion else None,
        "fecha_inicio": cuestionario.fecha_inicio.isoformat() if cuestionario.fecha_inicio else None,
        "fecha_fin": cuestionario.fecha_fin.isoformat() if cuestionario.fecha_fin else None,
        "estado": cuestionario.estado.value if hasattr(cuestionario.estado, 'value') else str(cuestionario.estado),
        "creado_por": cuestionario.creado_por,
        "creado_por_nombre": creado_por_nombre,
        "total_preguntas": cuestionario.total_preguntas,
        "total_respuestas": cuestionario.total_respuestas,
        "preguntas": preguntas_serializadas,
        "tipos_usuario_asignados": tipos_usuario_serializados,
        "created_at": cuestionario.created_at.isoformat() if cuestionario.created_at else None,
        "updated_at": cuestionario.updated_at.isoformat() if cuestionario.updated_at else None,
        "instruccion_sistema": cuestionario.instruccion_sistema,
        "instruccion_sistema_default": ai_service._get_default_system_instruction(),
        "modelo_ia": cuestionario.modelo_ia,
        # Información de respuesta
        "respuesta_id": respuesta_existente.id if respuesta_existente else None,
        "estado_respuesta": respuesta_existente.estado if respuesta_existente else "pendiente",
        "progreso": respuesta_existente.progreso if respuesta_existente else 0,
        "respuestas_previas": respuestas_previas
    }

    return cuestionario_data


@router.post("/{cuestionario_id}/responder", response_model=RespuestaCuestionarioOut)
def guardar_respuesta_cuestionario(
    *,
    db: Session = Depends(get_db),
    cuestionario_id: str,
    respuesta_data: RespuestaCuestionarioCreate,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Guardar o actualizar respuestas a un cuestionario.
    """
    try:
        # Determinar tipo de usuario basado en el rol
        tipo_usuario = get_tipo_usuario_from_rol(current_user.rol)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    # Verificar que el cuestionario existe y está asignado al usuario
    cuestionario = db.query(CuestionarioAdmin).join(
        AsignacionCuestionario,
        CuestionarioAdmin.id == AsignacionCuestionario.cuestionario_id
    ).filter(
        CuestionarioAdmin.id == cuestionario_id,
        AsignacionCuestionario.tipo_usuario == tipo_usuario,
        CuestionarioAdmin.estado == EstadoCuestionario.ACTIVO
    ).options(
        joinedload(CuestionarioAdmin.preguntas)
    ).first()

    if not cuestionario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cuestionario no encontrado o no asignado a tu tipo de usuario"
        )

    # Verificar fechas de disponibilidad
    now = datetime.now(MEXICO_TZ)
    if cuestionario.fecha_inicio and cuestionario.fecha_inicio > now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El cuestionario aún no está disponible"
        )

    if cuestionario.fecha_fin and cuestionario.fecha_fin < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El cuestionario ya no está disponible"
        )

    # PASO 1: Obtener o crear snapshot del cuestionario
    # Reason: Crear una copia congelada del cuestionario para que las respuestas
    # del usuario siempre tengan el contexto completo, independientemente de
    # cambios futuros al cuestionario original
    try:
        cuestionario_snapshot = obtener_o_crear_snapshot(
            db=db,
            cuestionario_id=cuestionario_id,
            usuario_id=current_user.id
        )
    except ValueError as e:
        logger.error(f"Error al crear snapshot: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear snapshot del cuestionario: {str(e)}"
        )

    # PASO 2: Buscar respuesta existente
    respuesta_existente = db.query(RespuestaCuestionario).filter(
        RespuestaCuestionario.cuestionario_id == cuestionario_id,
        RespuestaCuestionario.usuario_id == current_user.id
    ).first()

    # Si ya completó el cuestionario, no permitir modificar
    if respuesta_existente and respuesta_existente.estado == "completado":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya has completado este cuestionario y no se puede modificar"
        )

    # PASO 3: Crear o actualizar respuesta del cuestionario
    if not respuesta_existente:
        respuesta_id = str(uuid.uuid4())
        respuesta_cuestionario = RespuestaCuestionario(
            id=respuesta_id,
            cuestionario_id=cuestionario_id,
            snapshot_id=cuestionario_snapshot.id,  # Apuntar al snapshot
            usuario_id=current_user.id,
            estado=respuesta_data.estado,
            progreso=respuesta_data.progreso
        )
        db.add(respuesta_cuestionario)
        db.flush()
        logger.info(
            f"Nueva respuesta creada: {respuesta_id} "
            f"para usuario {current_user.id} y snapshot {cuestionario_snapshot.id}"
        )
    else:
        respuesta_cuestionario = respuesta_existente
        respuesta_cuestionario.estado = respuesta_data.estado
        respuesta_cuestionario.progreso = respuesta_data.progreso
        respuesta_cuestionario.updated_at = datetime.now(MEXICO_TZ)

        # Si se está completando, marcar fecha
        if respuesta_data.estado == "completado":
            respuesta_cuestionario.fecha_completado = datetime.now(MEXICO_TZ)
            logger.info(f"Cuestionario completado por usuario {current_user.id}")

    # PASO 4: Eliminar respuestas previas de preguntas
    db.query(RespuestaPregunta).filter(
        RespuestaPregunta.respuesta_cuestionario_id == respuesta_cuestionario.id
    ).delete()

    # PASO 5: Guardar nuevas respuestas usando el snapshot
    # Reason: Las respuestas ahora apuntan a las preguntas del snapshot,
    # no a las preguntas originales
    for respuesta_pregunta_data in respuesta_data.respuestas:
        # Buscar la pregunta snapshot correspondiente
        pregunta_snapshot = obtener_pregunta_snapshot_por_original(
            db=db,
            snapshot_id=cuestionario_snapshot.id,
            pregunta_original_id=respuesta_pregunta_data.pregunta_id
        )

        if not pregunta_snapshot:
            logger.warning(
                f"Pregunta snapshot no encontrada para pregunta original "
                f"{respuesta_pregunta_data.pregunta_id} en snapshot {cuestionario_snapshot.id}"
            )
            continue  # Saltar preguntas que no están en el snapshot

        # Crear respuesta apuntando al snapshot de la pregunta
        respuesta_pregunta = RespuestaPregunta(
            respuesta_cuestionario_id=respuesta_cuestionario.id,
            pregunta_id=respuesta_pregunta_data.pregunta_id,  # Referencia opcional al original
            pregunta_snapshot_id=pregunta_snapshot.id,  # Referencia al snapshot (OBLIGATORIA)
            valor=respuesta_pregunta_data.valor,
            texto_otro=respuesta_pregunta_data.texto_otro
        )
        db.add(respuesta_pregunta)

    db.commit()

    # Recargar con relaciones
    respuesta_final = db.query(RespuestaCuestionario).options(
        joinedload(RespuestaCuestionario.respuestas_preguntas)
    ).filter(RespuestaCuestionario.id == respuesta_cuestionario.id).first()

    return respuesta_final


@router.get("/{cuestionario_id}/mi-respuesta", response_model=RespuestaCuestionarioOut)
def get_mi_respuesta(
    *,
    db: Session = Depends(get_db),
    cuestionario_id: str,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Obtener la respuesta del usuario actual a un cuestionario específico.
    """
    # Buscar la respuesta del usuario
    respuesta = db.query(RespuestaCuestionario).filter(
        RespuestaCuestionario.cuestionario_id == cuestionario_id,
        RespuestaCuestionario.usuario_id == current_user.id
    ).options(
        joinedload(RespuestaCuestionario.respuestas_preguntas).joinedload(RespuestaPregunta.pregunta),
        joinedload(RespuestaCuestionario.respuestas_preguntas).joinedload(RespuestaPregunta.pregunta_snapshot),
        joinedload(RespuestaCuestionario.cuestionario).joinedload(CuestionarioAdmin.preguntas),
        joinedload(RespuestaCuestionario.reportes_ia)
    ).first()

    if not respuesta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No has respondido este cuestionario"
        )

    # Convertir manualmente a Pydantic para evitar problemas de serialización
    return RespuestaCuestionarioOut.model_validate(respuesta)


@router.post("/{respuesta_id}/generar-reporte", response_model=ReporteResponse)
def generar_reporte(
    *,
    db: Session = Depends(get_db),
    respuesta_id: str,
    current_user: User = Depends(get_current_active_user),
    reporte_request: Optional[GenerarReporteRequest] = None
) -> Any:
    """
    Generar un reporte IA basado en las respuestas del cuestionario.
    Solo el usuario que respondió puede generar el reporte.
    """
    # Buscar la respuesta
    respuesta = db.query(RespuestaCuestionario).filter(
        RespuestaCuestionario.id == respuesta_id,
        RespuestaCuestionario.usuario_id == current_user.id
    ).options(
        joinedload(RespuestaCuestionario.respuestas_preguntas).joinedload(RespuestaPregunta.pregunta),
        joinedload(RespuestaCuestionario.respuestas_preguntas).joinedload(RespuestaPregunta.pregunta_snapshot),
        joinedload(RespuestaCuestionario.cuestionario)
    ).first()

    if not respuesta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Respuesta no encontrada"
        )

    if respuesta.estado != "completado":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se pueden generar reportes para cuestionarios completados"
        )

    # Preparar datos para la IA combinando request y datos almacenados
    logger.info("=" * 80)
    logger.info("🔍 INICIANDO CONSTRUCCIÓN DE PREGUNTAS Y RESPUESTAS PARA IA")
    logger.info("=" * 80)

    preguntas_respuestas = _combinar_preguntas_respuestas(
        respuesta,
        reporte_request.preguntas_respuestas if reporte_request else None
    )

    logger.info("=" * 80)
    logger.info(f"📊 RESULTADO FINAL: {len(preguntas_respuestas)} preguntas para enviar a IA")
    for idx, pr in enumerate(preguntas_respuestas, 1):
        logger.info(f"  [{idx}] {pr.get('pregunta', 'N/A')[:60]}... -> {pr.get('respuesta', 'N/A')[:60]}...")
    logger.info("=" * 80)

    # Información del usuario
    # PROTECCIÓN DE DATOS:
    # - Se envían: edad, género, semestre (datos demográficos útiles para el análisis)
    # - NO se envían: nombres, apellidos, correos, teléfonos, direcciones
    # - Matrícula: comentada temporalmente para pruebas
    persona_info_request = reporte_request.persona_info if reporte_request else None
    persona_info = {}

    # COMENTADO TEMPORALMENTE PARA PRUEBAS
    # if persona_info_request and persona_info_request.matricula:
    #     persona_info["matricula"] = persona_info_request.matricula
    # elif current_user.matricula:
    #     persona_info["matricula"] = current_user.matricula
    # elif hasattr(current_user, 'personal') and current_user.personal:
    #     persona_info["numero_empleado"] = current_user.personal.numero_empleado

    # Datos demográficos útiles para el análisis psicopedagógico
    if hasattr(current_user, 'edad') and current_user.edad:
        persona_info["edad"] = current_user.edad

    if hasattr(current_user, 'genero') and current_user.genero:
        persona_info["genero"] = current_user.genero

    if hasattr(current_user, 'semestre') and current_user.semestre:
        persona_info["semestre"] = current_user.semestre

    # Determinar instrucción del sistema
    # PRIORIDAD: 1) Instrucción del cuestionario, 2) Instrucción del request, 3) None (usará default del servicio)
    instruccion_sistema = None

    # Primero intentar usar la instrucción del cuestionario
    if respuesta.cuestionario.instruccion_sistema and respuesta.cuestionario.instruccion_sistema.strip():
        instruccion_sistema = respuesta.cuestionario.instruccion_sistema.strip()
        logger.info("✅ Usando instrucción del CUESTIONARIO")
    # Si no hay en el cuestionario, usar la del request (puede ser la default)
    elif reporte_request and reporte_request.instruccion_sistema and reporte_request.instruccion_sistema.strip():
        instruccion_sistema = reporte_request.instruccion_sistema.strip()
        logger.info("⚠️ Usando instrucción del REQUEST (no hay en cuestionario)")
    else:
        logger.info("ℹ️ No hay instrucción personalizada, se usará la DEFAULT del servicio")

    try:
        logger.info(f"📋 Instrucción FINAL seleccionada: {instruccion_sistema[:100] if instruccion_sistema else 'None (usará default)'}...")
        logger.info(f"📋 Instrucción del cuestionario: {respuesta.cuestionario.instruccion_sistema[:100] if respuesta.cuestionario.instruccion_sistema else 'None'}...")
        logger.info(f"📋 Instrucción del request: {reporte_request.instruccion_sistema[:100] if reporte_request and reporte_request.instruccion_sistema else 'None'}...")
    except Exception as e:
        logger.warning(f"Error al loggear instrucciones: {e}")

    # Determinar modelo de IA
    modelo_ia = None
    if reporte_request and reporte_request.modelo_ia:
        modelo_ia = reporte_request.modelo_ia
    if not modelo_ia:
        modelo_ia = respuesta.cuestionario.modelo_ia

    # Determinar parámetros de generación
    max_tokens = None
    if reporte_request and reporte_request.max_tokens is not None:
        max_tokens = reporte_request.max_tokens
    elif respuesta.cuestionario.max_tokens is not None:
        max_tokens = respuesta.cuestionario.max_tokens

    temperature = None
    if reporte_request and reporte_request.temperature is not None:
        temperature = reporte_request.temperature
    elif respuesta.cuestionario.temperature is not None:
        temperature = respuesta.cuestionario.temperature

    logger.info(f"🤖 Modelo de IA seleccionado: {modelo_ia}")
    logger.info(f"⚙️ Parámetros: max_tokens={max_tokens}, temperature={temperature}")

    # Generar reporte con IA
    try:
        contenido_reporte = ai_service.generate_questionnaire_report(
            preguntas_respuestas=preguntas_respuestas,
            instruccion_sistema=instruccion_sistema,
            persona_info=persona_info,
            modelo_ia=modelo_ia,
            max_tokens=max_tokens,
            temperature=temperature
        )
    except Exception as e:
        logger.error(f"Error al generar reporte con IA: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al generar el reporte: {str(e)}"
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
        mensaje=f"Reporte generado exitosamente (versión {nueva_version})"
    )


@router.get("/{respuesta_id}/reportes")
def get_reportes(
    *,
    db: Session = Depends(get_db),
    respuesta_id: str,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Obtener todos los reportes generados para una respuesta de cuestionario.
    """
    # Verificar que la respuesta pertenece al usuario
    respuesta = db.query(RespuestaCuestionario).options(
        joinedload(RespuestaCuestionario.respuestas_preguntas).joinedload(RespuestaPregunta.pregunta),
        joinedload(RespuestaCuestionario.respuestas_preguntas).joinedload(RespuestaPregunta.pregunta_snapshot)
    ).filter(
        RespuestaCuestionario.id == respuesta_id,
        RespuestaCuestionario.usuario_id == current_user.id
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


@router.get("/{respuesta_id}/reporte-actual")
def get_reporte_actual(
    *,
    db: Session = Depends(get_db),
    respuesta_id: str,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Obtener el reporte actual (más reciente) de una respuesta.
    """
    # Verificar que la respuesta pertenece al usuario
    respuesta = db.query(RespuestaCuestionario).filter(
        RespuestaCuestionario.id == respuesta_id,
        RespuestaCuestionario.usuario_id == current_user.id
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

    return {
        "id": reporte.id,
        "respuesta_cuestionario_id": reporte.respuesta_cuestionario_id,
        "version": reporte.version,
        "es_actual": reporte.es_actual,
        "contenido": reporte.contenido,
        "fecha_generacion": reporte.fecha_generacion.isoformat() if reporte.fecha_generacion else None
    }


@router.get("/{respuesta_id}/reportes/{reporte_id}")
def get_reporte_by_id(
    *,
    db: Session = Depends(get_db),
    respuesta_id: str,
    reporte_id: str,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Obtener un reporte específico por su ID.
    Permite revisar versiones anteriores del reporte.
    """
    # Verificar que la respuesta pertenece al usuario
    respuesta = db.query(RespuestaCuestionario).filter(
        RespuestaCuestionario.id == respuesta_id,
        RespuestaCuestionario.usuario_id == current_user.id
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
        "fecha_generacion": reporte.fecha_generacion.isoformat() if reporte.fecha_generacion else None
    }


@router.get("/{respuesta_id}/reportes/version/{version}")
def get_reporte_by_version(
    *,
    db: Session = Depends(get_db),
    respuesta_id: str,
    version: int,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Obtener un reporte específico por su número de versión.
    Permite revisar versiones anteriores del reporte.
    """
    # Verificar que la respuesta pertenece al usuario
    respuesta = db.query(RespuestaCuestionario).filter(
        RespuestaCuestionario.id == respuesta_id,
        RespuestaCuestionario.usuario_id == current_user.id
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
        "fecha_generacion": reporte.fecha_generacion.isoformat() if reporte.fecha_generacion else None
    }


@router.get("/{respuesta_id}/reportes/{reporte_id}/html", response_class=HTMLResponse)
def get_reporte_html_by_id(
    *,
    db: Session = Depends(get_db),
    respuesta_id: str,
    reporte_id: str,
    current_user: User = Depends(get_current_active_user)
) -> str:
    """
    Obtener un reporte específico renderizado en HTML.
    Convierte el contenido Markdown del reporte a HTML con estilos.
    """
    # Verificar que la respuesta pertenece al usuario
    respuesta = db.query(RespuestaCuestionario).filter(
        RespuestaCuestionario.id == respuesta_id,
        RespuestaCuestionario.usuario_id == current_user.id
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


@router.get("/{respuesta_id}/reportes/version/{version}/html", response_class=HTMLResponse)
def get_reporte_html_by_version(
    *,
    db: Session = Depends(get_db),
    respuesta_id: str,
    version: int,
    current_user: User = Depends(get_current_active_user)
) -> str:
    """
    Obtener un reporte específico por versión renderizado en HTML.
    Convierte el contenido Markdown del reporte a HTML con estilos.
    """
    # Verificar que la respuesta pertenece al usuario
    respuesta = db.query(RespuestaCuestionario).filter(
        RespuestaCuestionario.id == respuesta_id,
        RespuestaCuestionario.usuario_id == current_user.id
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


@router.get("/{respuesta_id}/reporte-actual/html", response_class=HTMLResponse)
def get_reporte_actual_html(
    *,
    db: Session = Depends(get_db),
    respuesta_id: str,
    current_user: User = Depends(get_current_active_user)
) -> str:
    """
    Obtener el reporte actual renderizado en HTML.
    Convierte el contenido Markdown del reporte a HTML con estilos.
    """
    # Verificar que la respuesta pertenece al usuario
    respuesta = db.query(RespuestaCuestionario).filter(
        RespuestaCuestionario.id == respuesta_id,
        RespuestaCuestionario.usuario_id == current_user.id
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


@router.get("/{respuesta_id}/reportes/{reporte_id}/download/word")
def download_reporte_word(
    *,
    db: Session = Depends(get_db),
    respuesta_id: str,
    reporte_id: str,
    current_user: User = Depends(get_current_active_user),
    request: Request
) -> StreamingResponse:
    """
    Descargar un reporte específico en formato Word (DOCX).
    """
    # Verificar que la respuesta pertenece al usuario
    respuesta = db.query(RespuestaCuestionario).options(
        joinedload(RespuestaCuestionario.respuestas_preguntas).joinedload(RespuestaPregunta.pregunta),
        joinedload(RespuestaCuestionario.respuestas_preguntas).joinedload(RespuestaPregunta.pregunta_snapshot)
    ).filter(
        RespuestaCuestionario.id == respuesta_id,
        RespuestaCuestionario.usuario_id == current_user.id
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


@router.get("/{respuesta_id}/reportes/{reporte_id}/download/excel")
def download_reporte_excel(
    *,
    db: Session = Depends(get_db),
    respuesta_id: str,
    reporte_id: str,
    current_user: User = Depends(get_current_active_user),
    request: Request
) -> StreamingResponse:
    """
    Descargar un reporte específico en formato Excel (XLSX).
    """
    # Verificar que la respuesta pertenece al usuario
    respuesta = db.query(RespuestaCuestionario).options(
        joinedload(RespuestaCuestionario.respuestas_preguntas).joinedload(RespuestaPregunta.pregunta),
        joinedload(RespuestaCuestionario.respuestas_preguntas).joinedload(RespuestaPregunta.pregunta_snapshot)
    ).filter(
        RespuestaCuestionario.id == respuesta_id,
        RespuestaCuestionario.usuario_id == current_user.id
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


@router.get("/{respuesta_id}/reportes/{reporte_id}/download/pdf")
def download_reporte_pdf(
    *,
    db: Session = Depends(get_db),
    respuesta_id: str,
    reporte_id: str,
    current_user: User = Depends(get_current_active_user),
    request: Request
) -> StreamingResponse:
    """
    Descargar un reporte específico en formato PDF.
    """
    # Verificar que la respuesta pertenece al usuario
    respuesta = db.query(RespuestaCuestionario).options(
        joinedload(RespuestaCuestionario.respuestas_preguntas).joinedload(RespuestaPregunta.pregunta),
        joinedload(RespuestaCuestionario.respuestas_preguntas).joinedload(RespuestaPregunta.pregunta_snapshot)
    ).filter(
        RespuestaCuestionario.id == respuesta_id,
        RespuestaCuestionario.usuario_id == current_user.id
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
