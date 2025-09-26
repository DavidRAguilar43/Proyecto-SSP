from typing import Any, List, Optional
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_

from app.db.database import get_db
from app.models.cuestionario_admin import (
    CuestionarioAdmin,
    Pregunta,
    AsignacionCuestionario,
    RespuestaCuestionario,
    RespuestaPregunta,
    TipoUsuario,
    EstadoCuestionario
)
from app.models.persona import Persona
from app.schemas.cuestionario_admin import (
    CuestionarioAdminOut,
    RespuestaCuestionarioCreate,
    RespuestaCuestionarioUpdate,
    RespuestaCuestionarioOut,
    PreguntaOut
)
from app.utils.deps import get_current_active_user

router = APIRouter(prefix="/cuestionarios-usuario", tags=["cuestionarios-usuario"])


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
    current_user: Persona = Depends(get_current_active_user)
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
    query = db.query(CuestionarioAdmin).join(AsignacionCuestionario).filter(
        AsignacionCuestionario.tipo_usuario == tipo_usuario,
        CuestionarioAdmin.estado == EstadoCuestionario.ACTIVO
    ).options(
        joinedload(CuestionarioAdmin.preguntas),
        joinedload(CuestionarioAdmin.creador)
    )

    # Filtrar por fechas de disponibilidad
    now = datetime.utcnow()
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

        cuestionario_data = {
            "id": cuestionario.id,
            "titulo": cuestionario.titulo,
            "descripcion": cuestionario.descripcion,
            "fecha_creacion": cuestionario.fecha_creacion,
            "fecha_inicio": cuestionario.fecha_inicio,
            "fecha_fin": cuestionario.fecha_fin,
            "estado": cuestionario.estado,
            "creado_por": cuestionario.creado_por,
            "creado_por_nombre": f"{cuestionario.creador.nombre} {cuestionario.creador.apellido_paterno}" if cuestionario.creador else None,
            "total_preguntas": cuestionario.total_preguntas,
            "total_respuestas": cuestionario.total_respuestas,
            "preguntas": [],  # No incluir preguntas en el listado
            "tipos_usuario_asignados": cuestionario.tipos_usuario_asignados,
            "created_at": cuestionario.created_at,
            "updated_at": cuestionario.updated_at,
            # Información específica del usuario
            "estado_respuesta": estado_respuesta,
            "progreso": progreso,
            "fecha_inicio_respuesta": fecha_inicio,
            "fecha_completado_respuesta": fecha_completado,
            "puede_responder": puede_responder
        }
        
        cuestionarios_asignados.append(cuestionario_data)

    return {
        "cuestionarios": cuestionarios_asignados,
        "total": len(cuestionarios_asignados),
        "skip": skip,
        "limit": limit
    }


@router.get("/{cuestionario_id}/responder")
def get_cuestionario_para_responder(
    *,
    db: Session = Depends(get_db),
    cuestionario_id: str,
    current_user: Persona = Depends(get_current_active_user)
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
    cuestionario = db.query(CuestionarioAdmin).join(AsignacionCuestionario).filter(
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
    now = datetime.utcnow()
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

    # Construir respuesta
    cuestionario_data = {
        "id": cuestionario.id,
        "titulo": cuestionario.titulo,
        "descripcion": cuestionario.descripcion,
        "fecha_creacion": cuestionario.fecha_creacion,
        "fecha_inicio": cuestionario.fecha_inicio,
        "fecha_fin": cuestionario.fecha_fin,
        "estado": cuestionario.estado,
        "creado_por": cuestionario.creado_por,
        "creado_por_nombre": f"{cuestionario.creador.nombre} {cuestionario.creador.apellido_paterno}" if cuestionario.creador else None,
        "total_preguntas": cuestionario.total_preguntas,
        "total_respuestas": cuestionario.total_respuestas,
        "preguntas": sorted(cuestionario.preguntas, key=lambda p: p.orden),
        "tipos_usuario_asignados": cuestionario.tipos_usuario_asignados,
        "created_at": cuestionario.created_at,
        "updated_at": cuestionario.updated_at,
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
    current_user: Persona = Depends(get_current_active_user)
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
    cuestionario = db.query(CuestionarioAdmin).join(AsignacionCuestionario).filter(
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
    now = datetime.utcnow()
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

    # Buscar respuesta existente
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

    # Crear o actualizar respuesta del cuestionario
    if not respuesta_existente:
        respuesta_id = str(uuid.uuid4())
        respuesta_cuestionario = RespuestaCuestionario(
            id=respuesta_id,
            cuestionario_id=cuestionario_id,
            usuario_id=current_user.id,
            estado=respuesta_data.estado,
            progreso=respuesta_data.progreso
        )
        db.add(respuesta_cuestionario)
        db.flush()
    else:
        respuesta_cuestionario = respuesta_existente
        respuesta_cuestionario.estado = respuesta_data.estado
        respuesta_cuestionario.progreso = respuesta_data.progreso
        respuesta_cuestionario.updated_at = datetime.utcnow()

        # Si se está completando, marcar fecha
        if respuesta_data.estado == "completado":
            respuesta_cuestionario.fecha_completado = datetime.utcnow()

    # Eliminar respuestas previas de preguntas
    db.query(RespuestaPregunta).filter(
        RespuestaPregunta.respuesta_cuestionario_id == respuesta_cuestionario.id
    ).delete()

    # Guardar nuevas respuestas
    for respuesta_pregunta_data in respuesta_data.respuestas:
        # Verificar que la pregunta existe en el cuestionario
        pregunta_existe = any(p.id == respuesta_pregunta_data.pregunta_id for p in cuestionario.preguntas)
        if not pregunta_existe:
            continue  # Saltar preguntas que no pertenecen al cuestionario

        respuesta_pregunta = RespuestaPregunta(
            respuesta_cuestionario_id=respuesta_cuestionario.id,
            pregunta_id=respuesta_pregunta_data.pregunta_id,
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


@router.get("/{cuestionario_id}/mi-respuesta")
def get_mi_respuesta(
    *,
    db: Session = Depends(get_db),
    cuestionario_id: str,
    current_user: Persona = Depends(get_current_active_user)
) -> Any:
    """
    Obtener la respuesta del usuario actual a un cuestionario específico.
    """
    # Buscar la respuesta del usuario
    respuesta = db.query(RespuestaCuestionario).filter(
        RespuestaCuestionario.cuestionario_id == cuestionario_id,
        RespuestaCuestionario.usuario_id == current_user.id
    ).options(
        joinedload(RespuestaCuestionario.respuestas_preguntas),
        joinedload(RespuestaCuestionario.cuestionario)
    ).first()

    if not respuesta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No has respondido este cuestionario"
        )

    return respuesta
