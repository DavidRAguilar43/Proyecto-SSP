from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Optional, Any
from datetime import datetime, timedelta, date

from app.db.database import get_db
from app.models.persona import Persona
from app.models.cita import Cita, EstadoCita, TipoCita
from app.schemas.cita import (
    CitaCreate, CitaUpdate, CitaOut, SolicitudCitaOut,
    NotificacionCita, EstadisticasCitas, CitaBulkDelete,
    CitaBulkCreate, CitaBulkUpdate
)
from app.utils.deps import (
    get_current_active_user,
    check_admin_role,
    check_administrative_access,
    check_deletion_permission
)

router = APIRouter()

@router.post("/solicitar", response_model=CitaOut)
def solicitar_cita(
    cita_data: CitaCreate,
    db: Session = Depends(get_db),
    current_user: Persona = Depends(get_current_active_user)
):
    """
    Solicitar una cita (solo para alumnos).
    """
    # Verificar que el usuario sea alumno
    if current_user.rol != "alumno":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los alumnos pueden solicitar citas"
        )

    # Crear la cita
    nueva_cita = Cita(
        id_alumno=current_user.id,
        tipo_cita=cita_data.tipo_cita,
        motivo=cita_data.motivo,
        fecha_propuesta_alumno=cita_data.fecha_propuesta_alumno,
        observaciones_alumno=cita_data.observaciones_alumno,
        estado=EstadoCita.PENDIENTE
    )

    db.add(nueva_cita)
    db.commit()
    db.refresh(nueva_cita)

    # Preparar respuesta
    return CitaOut(
        id_cita=nueva_cita.id_cita,
        id_alumno=nueva_cita.id_alumno,
        id_personal=nueva_cita.id_personal,
        tipo_cita=nueva_cita.tipo_cita,
        motivo=nueva_cita.motivo,
        estado=nueva_cita.estado,
        fecha_solicitud=nueva_cita.fecha_solicitud,
        fecha_propuesta_alumno=nueva_cita.fecha_propuesta_alumno,
        fecha_confirmada=nueva_cita.fecha_confirmada,
        fecha_completada=nueva_cita.fecha_completada,
        observaciones_alumno=nueva_cita.observaciones_alumno,
        observaciones_personal=nueva_cita.observaciones_personal,
        ubicacion=nueva_cita.ubicacion,
        fecha_creacion=nueva_cita.fecha_creacion,
        fecha_actualizacion=nueva_cita.fecha_actualizacion,
        alumno_nombre=current_user.correo_institucional.split('@')[0],
        alumno_email=current_user.correo_institucional,
        alumno_celular=current_user.celular,
        alumno_matricula=current_user.matricula
    )

@router.get("/mis-citas", response_model=List[CitaOut])
def get_mis_citas(
    db: Session = Depends(get_db),
    current_user: Persona = Depends(get_current_active_user)
):
    """
    Obtener las citas del alumno actual.
    """
    if current_user.rol != "alumno":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los alumnos pueden ver sus citas"
        )

    citas = db.query(Cita).filter(Cita.id_alumno == current_user.id).all()

    resultado = []
    for cita in citas:
        personal_nombre = None
        personal_email = None

        if cita.id_personal:
            personal = db.query(Persona).filter(Persona.id == cita.id_personal).first()
            if personal:
                personal_nombre = personal.correo_institucional.split('@')[0]
                personal_email = personal.correo_institucional

        resultado.append(CitaOut(
            id_cita=cita.id_cita,
            id_alumno=cita.id_alumno,
            id_personal=cita.id_personal,
            tipo_cita=cita.tipo_cita,
            motivo=cita.motivo,
            estado=cita.estado,
            fecha_solicitud=cita.fecha_solicitud,
            fecha_propuesta_alumno=cita.fecha_propuesta_alumno,
            fecha_confirmada=cita.fecha_confirmada,
            fecha_completada=cita.fecha_completada,
            observaciones_alumno=cita.observaciones_alumno,
            observaciones_personal=cita.observaciones_personal,
            ubicacion=cita.ubicacion,
            fecha_creacion=cita.fecha_creacion,
            fecha_actualizacion=cita.fecha_actualizacion,
            alumno_nombre=current_user.correo_institucional.split('@')[0],
            alumno_email=current_user.correo_institucional,
            alumno_celular=current_user.celular,
            alumno_matricula=current_user.matricula,
            personal_nombre=personal_nombre,
            personal_email=personal_email
        ))

    return resultado

@router.get("/solicitudes", response_model=List[SolicitudCitaOut])
def get_solicitudes_citas(
    estado: Optional[EstadoCita] = None,
    db: Session = Depends(get_db),
    current_user: Persona = Depends(get_current_active_user)
):
    """
    Obtener solicitudes de citas (solo para admin y coordinador).
    """
    if current_user.rol not in ["admin", "coordinador"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver las solicitudes de citas"
        )

    query = db.query(Cita).join(Persona, Cita.id_alumno == Persona.id)

    if estado:
        query = query.filter(Cita.estado == estado)

    citas = query.all()

    resultado = []
    for cita in citas:
        alumno = db.query(Persona).filter(Persona.id == cita.id_alumno).first()

        resultado.append(SolicitudCitaOut(
            id_cita=cita.id_cita,
            tipo_cita=cita.tipo_cita,
            motivo=cita.motivo,
            estado=cita.estado,
            fecha_solicitud=cita.fecha_solicitud,
            fecha_propuesta_alumno=cita.fecha_propuesta_alumno,
            observaciones_alumno=cita.observaciones_alumno,
            id_alumno=cita.id_alumno,
            alumno_nombre=alumno.correo_institucional.split('@')[0] if alumno else "Desconocido",
            alumno_email=alumno.correo_institucional if alumno else "",
            alumno_celular=alumno.celular if alumno else None,
            alumno_matricula=alumno.matricula if alumno else None,
            alumno_semestre=alumno.semestre if alumno else None
        ))

    return resultado

@router.put("/{cita_id}/confirmar", response_model=CitaOut)
def confirmar_cita(
    cita_id: int,
    cita_update: CitaUpdate,
    db: Session = Depends(get_db),
    current_user: Persona = Depends(get_current_active_user)
):
    """
    Confirmar o actualizar una cita (solo para admin y coordinador).
    """
    if current_user.rol not in ["admin", "coordinador"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para confirmar citas"
        )

    cita = db.query(Cita).filter(Cita.id_cita == cita_id).first()
    if not cita:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cita no encontrada"
        )

    # Actualizar campos
    if cita_update.estado:
        cita.estado = cita_update.estado
    if cita_update.fecha_confirmada:
        cita.fecha_confirmada = cita_update.fecha_confirmada
    if cita_update.observaciones_personal is not None:
        cita.observaciones_personal = cita_update.observaciones_personal
    if cita_update.ubicacion is not None:
        cita.ubicacion = cita_update.ubicacion
    if cita_update.id_personal:
        cita.id_personal = cita_update.id_personal
    else:
        cita.id_personal = current_user.id

    # Si se confirma, marcar fecha de confirmación
    if cita_update.estado == EstadoCita.CONFIRMADA and not cita.fecha_confirmada:
        cita.fecha_confirmada = datetime.utcnow()

    db.commit()
    db.refresh(cita)

    # Obtener información del alumno y personal
    alumno = db.query(Persona).filter(Persona.id == cita.id_alumno).first()
    personal = db.query(Persona).filter(Persona.id == cita.id_personal).first() if cita.id_personal else None

    return CitaOut(
        id_cita=cita.id_cita,
        id_alumno=cita.id_alumno,
        id_personal=cita.id_personal,
        tipo_cita=cita.tipo_cita,
        motivo=cita.motivo,
        estado=cita.estado,
        fecha_solicitud=cita.fecha_solicitud,
        fecha_propuesta_alumno=cita.fecha_propuesta_alumno,
        fecha_confirmada=cita.fecha_confirmada,
        fecha_completada=cita.fecha_completada,
        observaciones_alumno=cita.observaciones_alumno,
        observaciones_personal=cita.observaciones_personal,
        ubicacion=cita.ubicacion,
        fecha_creacion=cita.fecha_creacion,
        fecha_actualizacion=cita.fecha_actualizacion,
        alumno_nombre=alumno.correo_institucional.split('@')[0] if alumno else "Desconocido",
        alumno_email=alumno.correo_institucional if alumno else "",
        alumno_celular=alumno.celular if alumno else None,
        alumno_matricula=alumno.matricula if alumno else None,
        personal_nombre=personal.correo_institucional.split('@')[0] if personal else None,
        personal_email=personal.correo_institucional if personal else None
    )

@router.get("/notificaciones", response_model=List[NotificacionCita])
def get_notificaciones_citas(
    db: Session = Depends(get_db),
    current_user: Persona = Depends(get_current_active_user)
):
    """
    Obtener notificaciones de citas para el alumno.
    """
    if current_user.rol != "alumno":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los alumnos pueden ver notificaciones de citas"
        )

    # Obtener citas confirmadas recientes (últimos 30 días)
    fecha_limite = datetime.utcnow() - timedelta(days=30)

    citas = db.query(Cita).filter(
        Cita.id_alumno == current_user.id,
        Cita.estado.in_([EstadoCita.CONFIRMADA, EstadoCita.CANCELADA]),
        Cita.fecha_actualizacion >= fecha_limite
    ).all()

    notificaciones = []
    for cita in citas:
        personal = None
        if cita.id_personal:
            personal = db.query(Persona).filter(Persona.id == cita.id_personal).first()

        if cita.estado == EstadoCita.CONFIRMADA:
            mensaje = f"Tu cita de tipo '{cita.tipo_cita.value}' ha sido confirmada"
            if cita.fecha_confirmada:
                mensaje += f" para el {cita.fecha_confirmada.strftime('%d/%m/%Y a las %H:%M')}"
        elif cita.estado == EstadoCita.CANCELADA:
            mensaje = f"Tu cita de tipo '{cita.tipo_cita.value}' ha sido cancelada"
        else:
            continue

        notificaciones.append(NotificacionCita(
            id_cita=cita.id_cita,
            tipo_notificacion=f"cita_{cita.estado.value}",
            mensaje=mensaje,
            fecha_cita=cita.fecha_confirmada,
            ubicacion=cita.ubicacion,
            personal_nombre=personal.correo_institucional.split('@')[0] if personal else None
        ))

    return notificaciones

@router.get("/estadisticas", response_model=EstadisticasCitas)
def get_estadisticas_citas(
    db: Session = Depends(get_db),
    current_user: Persona = Depends(get_current_active_user)
):
    """
    Obtener estadísticas de citas (solo para admin y coordinador).
    """
    if current_user.rol not in ["admin", "coordinador"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver estadísticas"
        )

    total = db.query(Cita).count()
    pendientes = db.query(Cita).filter(Cita.estado == EstadoCita.PENDIENTE).count()
    confirmadas = db.query(Cita).filter(Cita.estado == EstadoCita.CONFIRMADA).count()
    canceladas = db.query(Cita).filter(Cita.estado == EstadoCita.CANCELADA).count()
    completadas = db.query(Cita).filter(Cita.estado == EstadoCita.COMPLETADA).count()

    # Estadísticas por tipo
    por_tipo = {}
    for tipo in TipoCita:
        count = db.query(Cita).filter(Cita.tipo_cita == tipo).count()
        por_tipo[tipo.value] = count

    return EstadisticasCitas(
        total_solicitudes=total,
        pendientes=pendientes,
        confirmadas=confirmadas,
        canceladas=canceladas,
        completadas=completadas,
        por_tipo=por_tipo
    )


@router.post("/bulk-delete", response_model=List[int])
def bulk_delete_citas(
    *,
    db: Session = Depends(get_db),
    bulk_delete: CitaBulkDelete,
    current_user: Persona = Depends(check_admin_role)
) -> List[int]:
    """
    Eliminar múltiples citas en una sola operación (solo administradores).
    """
    deleted_ids = []

    for cita_id in bulk_delete.ids:
        cita = db.query(Cita).filter(Cita.id_cita == cita_id).first()
        if cita:
            db.delete(cita)
            deleted_ids.append(cita_id)

    db.commit()
    return deleted_ids


# ============================================================================
# ENDPOINTS CRUD COMPLETOS (fusión con funcionalidad de atenciones)
# ============================================================================

@router.get("/", response_model=List[CitaOut])
def get_citas(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    estado: Optional[EstadoCita] = None,
    tipo_cita: Optional[TipoCita] = None,
    id_alumno: Optional[int] = None,
    id_personal: Optional[int] = None,
    id_grupo: Optional[int] = None,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    current_user: Persona = Depends(get_current_active_user)
) -> Any:
    """
    Recuperar citas con filtros opcionales.

    Filtros disponibles:
    - estado: Estado de la cita (pendiente, confirmada, cancelada, completada)
    - tipo_cita: Tipo de cita (psicologica, academica, general)
    - id_alumno: ID del alumno
    - id_personal: ID del personal asignado
    - id_grupo: ID del grupo
    - fecha_desde: Fecha de inicio del rango
    - fecha_hasta: Fecha de fin del rango
    """
    query = db.query(Cita)

    # Aplicar filtros
    if estado:
        query = query.filter(Cita.estado == estado)
    if tipo_cita:
        query = query.filter(Cita.tipo_cita == tipo_cita)
    if id_alumno:
        query = query.filter(Cita.id_alumno == id_alumno)
    if id_personal:
        query = query.filter(Cita.id_personal == id_personal)
    if id_grupo:
        query = query.filter(Cita.id_grupo == id_grupo)
    if fecha_desde:
        query = query.filter(Cita.fecha_solicitud >= fecha_desde)
    if fecha_hasta:
        query = query.filter(Cita.fecha_solicitud <= fecha_hasta)

    # Ordenar por fecha de solicitud descendente
    query = query.order_by(Cita.fecha_solicitud.desc())

    citas = query.offset(skip).limit(limit).all()

    # Construir respuesta con información de alumno y personal
    resultado = []
    for cita in citas:
        alumno = db.query(Persona).filter(Persona.id == cita.id_alumno).first()
        personal = db.query(Persona).filter(Persona.id == cita.id_personal).first() if cita.id_personal else None

        resultado.append(CitaOut(
            id_cita=cita.id_cita,
            id_alumno=cita.id_alumno,
            id_personal=cita.id_personal,
            id_grupo=cita.id_grupo,
            id_cuestionario=cita.id_cuestionario,
            tipo_cita=cita.tipo_cita,
            motivo=cita.motivo,
            estado=cita.estado,
            fecha_solicitud=cita.fecha_solicitud,
            fecha_propuesta_alumno=cita.fecha_propuesta_alumno,
            fecha_confirmada=cita.fecha_confirmada,
            fecha_completada=cita.fecha_completada,
            observaciones_alumno=cita.observaciones_alumno,
            observaciones_personal=cita.observaciones_personal,
            ubicacion=cita.ubicacion,
            motivo_psicologico=cita.motivo_psicologico,
            motivo_academico=cita.motivo_academico,
            salud_en_general_vulnerable=cita.salud_en_general_vulnerable,
            requiere_seguimiento=cita.requiere_seguimiento,
            requiere_canalizacion_externa=cita.requiere_canalizacion_externa,
            estatus_canalizacion_externa=cita.estatus_canalizacion_externa,
            fecha_proxima_sesion=cita.fecha_proxima_sesion,
            ultima_fecha_contacto=cita.ultima_fecha_contacto,
            fecha_creacion=cita.fecha_creacion,
            fecha_actualizacion=cita.fecha_actualizacion,
            alumno_nombre=alumno.correo_institucional.split('@')[0] if alumno else "Desconocido",
            alumno_email=alumno.correo_institucional if alumno else "",
            alumno_celular=alumno.celular if alumno else None,
            alumno_matricula=alumno.matricula if alumno else None,
            personal_nombre=personal.correo_institucional.split('@')[0] if personal else None,
            personal_email=personal.correo_institucional if personal else None
        ))

    return resultado


@router.get("/{cita_id}", response_model=CitaOut)
def get_cita_by_id(
    cita_id: int,
    db: Session = Depends(get_db),
    current_user: Persona = Depends(get_current_active_user)
) -> Any:
    """
    Obtener una cita específica por ID.
    """
    cita = db.query(Cita).filter(Cita.id_cita == cita_id).first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")

    alumno = db.query(Persona).filter(Persona.id == cita.id_alumno).first()
    personal = db.query(Persona).filter(Persona.id == cita.id_personal).first() if cita.id_personal else None

    return CitaOut(
        id_cita=cita.id_cita,
        id_alumno=cita.id_alumno,
        id_personal=cita.id_personal,
        id_grupo=cita.id_grupo,
        id_cuestionario=cita.id_cuestionario,
        tipo_cita=cita.tipo_cita,
        motivo=cita.motivo,
        estado=cita.estado,
        fecha_solicitud=cita.fecha_solicitud,
        fecha_propuesta_alumno=cita.fecha_propuesta_alumno,
        fecha_confirmada=cita.fecha_confirmada,
        fecha_completada=cita.fecha_completada,
        observaciones_alumno=cita.observaciones_alumno,
        observaciones_personal=cita.observaciones_personal,
        ubicacion=cita.ubicacion,
        motivo_psicologico=cita.motivo_psicologico,
        motivo_academico=cita.motivo_academico,
        salud_en_general_vulnerable=cita.salud_en_general_vulnerable,
        requiere_seguimiento=cita.requiere_seguimiento,
        requiere_canalizacion_externa=cita.requiere_canalizacion_externa,
        estatus_canalizacion_externa=cita.estatus_canalizacion_externa,
        fecha_proxima_sesion=cita.fecha_proxima_sesion,
        ultima_fecha_contacto=cita.ultima_fecha_contacto,
        fecha_creacion=cita.fecha_creacion,
        fecha_actualizacion=cita.fecha_actualizacion,
        alumno_nombre=alumno.correo_institucional.split('@')[0] if alumno else "Desconocido",
        alumno_email=alumno.correo_institucional if alumno else "",
        alumno_celular=alumno.celular if alumno else None,
        alumno_matricula=alumno.matricula if alumno else None,
        personal_nombre=personal.correo_institucional.split('@')[0] if personal else None,
        personal_email=personal.correo_institucional if personal else None
    )



@router.post("/", response_model=CitaOut)
def create_cita(
    *,
    db: Session = Depends(get_db),
    cita_in: CitaCreate,
    current_user: Persona = Depends(check_administrative_access)
) -> Any:
    """
    Crear una nueva cita (solo administradores y coordinadores).

    Permite crear citas directamente desde el panel de administración,
    incluyendo todos los campos de atención.
    """
    # Crear objeto Cita
    db_cita = Cita(
        id_alumno=cita_in.id_alumno if cita_in.id_alumno else None,
        id_personal=cita_in.id_personal,
        id_grupo=cita_in.id_grupo,
        id_cuestionario=cita_in.id_cuestionario,
        tipo_cita=cita_in.tipo_cita,
        motivo=cita_in.motivo,
        fecha_propuesta_alumno=cita_in.fecha_propuesta_alumno,
        observaciones_alumno=cita_in.observaciones_alumno,
        estado=EstadoCita.PENDIENTE
    )

    db.add(db_cita)
    db.commit()
    db.refresh(db_cita)

    # Obtener información del alumno
    alumno = db.query(Persona).filter(Persona.id == db_cita.id_alumno).first() if db_cita.id_alumno else None

    return CitaOut(
        id_cita=db_cita.id_cita,
        id_alumno=db_cita.id_alumno,
        id_personal=db_cita.id_personal,
        id_grupo=db_cita.id_grupo,
        id_cuestionario=db_cita.id_cuestionario,
        tipo_cita=db_cita.tipo_cita,
        motivo=db_cita.motivo,
        estado=db_cita.estado,
        fecha_solicitud=db_cita.fecha_solicitud,
        fecha_propuesta_alumno=db_cita.fecha_propuesta_alumno,
        fecha_confirmada=db_cita.fecha_confirmada,
        fecha_completada=db_cita.fecha_completada,
        observaciones_alumno=db_cita.observaciones_alumno,
        observaciones_personal=db_cita.observaciones_personal,
        ubicacion=db_cita.ubicacion,
        motivo_psicologico=db_cita.motivo_psicologico,
        motivo_academico=db_cita.motivo_academico,
        salud_en_general_vulnerable=db_cita.salud_en_general_vulnerable,
        requiere_seguimiento=db_cita.requiere_seguimiento,
        requiere_canalizacion_externa=db_cita.requiere_canalizacion_externa,
        estatus_canalizacion_externa=db_cita.estatus_canalizacion_externa,
        fecha_proxima_sesion=db_cita.fecha_proxima_sesion,
        ultima_fecha_contacto=db_cita.ultima_fecha_contacto,
        fecha_creacion=db_cita.fecha_creacion,
        fecha_actualizacion=db_cita.fecha_actualizacion,
        alumno_nombre=alumno.correo_institucional.split('@')[0] if alumno else "Desconocido",
        alumno_email=alumno.correo_institucional if alumno else "",
        alumno_celular=alumno.celular if alumno else None,
        alumno_matricula=alumno.matricula if alumno else None,
        personal_nombre=None,
        personal_email=None
    )


@router.put("/{cita_id}", response_model=CitaOut)
def update_cita(
    *,
    db: Session = Depends(get_db),
    cita_id: int,
    cita_in: CitaUpdate,
    current_user: Persona = Depends(check_administrative_access)
) -> Any:
    """
    Actualizar una cita (solo administradores y coordinadores).

    Permite actualizar todos los campos de la cita, incluyendo
    los campos de atención cuando la cita está completada.
    """
    cita = db.query(Cita).filter(Cita.id_cita == cita_id).first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")

    # Actualizar campos si se proporcionan
    update_data = cita_in.model_dump(exclude_unset=True)

    # Si se marca como completada, establecer fecha_completada
    if update_data.get("estado") == EstadoCita.COMPLETADA and not cita.fecha_completada:
        cita.fecha_completada = datetime.utcnow()

    # Actualizar campos
    for field, value in update_data.items():
        setattr(cita, field, value)

    db.add(cita)
    db.commit()
    db.refresh(cita)

    # Obtener información del alumno y personal
    alumno = db.query(Persona).filter(Persona.id == cita.id_alumno).first()
    personal = db.query(Persona).filter(Persona.id == cita.id_personal).first() if cita.id_personal else None

    return CitaOut(
        id_cita=cita.id_cita,
        id_alumno=cita.id_alumno,
        id_personal=cita.id_personal,
        id_grupo=cita.id_grupo,
        id_cuestionario=cita.id_cuestionario,
        tipo_cita=cita.tipo_cita,
        motivo=cita.motivo,
        estado=cita.estado,
        fecha_solicitud=cita.fecha_solicitud,
        fecha_propuesta_alumno=cita.fecha_propuesta_alumno,
        fecha_confirmada=cita.fecha_confirmada,
        fecha_completada=cita.fecha_completada,
        observaciones_alumno=cita.observaciones_alumno,
        observaciones_personal=cita.observaciones_personal,
        ubicacion=cita.ubicacion,
        motivo_psicologico=cita.motivo_psicologico,
        motivo_academico=cita.motivo_academico,
        salud_en_general_vulnerable=cita.salud_en_general_vulnerable,
        requiere_seguimiento=cita.requiere_seguimiento,
        requiere_canalizacion_externa=cita.requiere_canalizacion_externa,
        estatus_canalizacion_externa=cita.estatus_canalizacion_externa,
        fecha_proxima_sesion=cita.fecha_proxima_sesion,
        ultima_fecha_contacto=cita.ultima_fecha_contacto,
        fecha_creacion=cita.fecha_creacion,
        fecha_actualizacion=cita.fecha_actualizacion,
        alumno_nombre=alumno.correo_institucional.split('@')[0] if alumno else "Desconocido",
        alumno_email=alumno.correo_institucional if alumno else "",
        alumno_celular=alumno.celular if alumno else None,
        alumno_matricula=alumno.matricula if alumno else None,
        personal_nombre=personal.correo_institucional.split('@')[0] if personal else None,
        personal_email=personal.correo_institucional if personal else None
    )


@router.delete("/{cita_id}", response_model=CitaOut)
def delete_cita(
    *,
    db: Session = Depends(get_db),
    cita_id: int,
    current_user: Persona = Depends(check_deletion_permission)
) -> Any:
    """
    Eliminar una cita (solo administradores - coordinadores NO pueden eliminar).
    """
    cita = db.query(Cita).filter(Cita.id_cita == cita_id).first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")

    # Guardar información antes de eliminar
    alumno = db.query(Persona).filter(Persona.id == cita.id_alumno).first()
    personal = db.query(Persona).filter(Persona.id == cita.id_personal).first() if cita.id_personal else None

    cita_out = CitaOut(
        id_cita=cita.id_cita,
        id_alumno=cita.id_alumno,
        id_personal=cita.id_personal,
        id_grupo=cita.id_grupo,
        id_cuestionario=cita.id_cuestionario,
        tipo_cita=cita.tipo_cita,
        motivo=cita.motivo,
        estado=cita.estado,
        fecha_solicitud=cita.fecha_solicitud,
        fecha_propuesta_alumno=cita.fecha_propuesta_alumno,
        fecha_confirmada=cita.fecha_confirmada,
        fecha_completada=cita.fecha_completada,
        observaciones_alumno=cita.observaciones_alumno,
        observaciones_personal=cita.observaciones_personal,
        ubicacion=cita.ubicacion,
        motivo_psicologico=cita.motivo_psicologico,
        motivo_academico=cita.motivo_academico,
        salud_en_general_vulnerable=cita.salud_en_general_vulnerable,
        requiere_seguimiento=cita.requiere_seguimiento,
        requiere_canalizacion_externa=cita.requiere_canalizacion_externa,
        estatus_canalizacion_externa=cita.estatus_canalizacion_externa,
        fecha_proxima_sesion=cita.fecha_proxima_sesion,
        ultima_fecha_contacto=cita.ultima_fecha_contacto,
        fecha_creacion=cita.fecha_creacion,
        fecha_actualizacion=cita.fecha_actualizacion,
        alumno_nombre=alumno.correo_institucional.split('@')[0] if alumno else "Desconocido",
        alumno_email=alumno.correo_institucional if alumno else "",
        alumno_celular=alumno.celular if alumno else None,
        alumno_matricula=alumno.matricula if alumno else None,
        personal_nombre=personal.correo_institucional.split('@')[0] if personal else None,
        personal_email=personal.correo_institucional if personal else None
    )

    db.delete(cita)
    db.commit()
    return cita_out



@router.get("/search/", response_model=List[CitaOut])
def search_citas(
    *,
    db: Session = Depends(get_db),
    q: str = Query(None, min_length=3),
    current_user: Persona = Depends(get_current_active_user)
) -> Any:
    """
    Buscar citas por texto en varios campos.

    Busca en: motivo, observaciones_alumno, observaciones_personal,
    estatus_canalizacion_externa.
    """
    if not q:
        return []

    citas = db.query(Cita).filter(
        or_(
            Cita.motivo.contains(q),
            Cita.observaciones_alumno.contains(q),
            Cita.observaciones_personal.contains(q),
            Cita.estatus_canalizacion_externa.contains(q)
        )
    ).all()

    # Construir respuesta
    resultado = []
    for cita in citas:
        alumno = db.query(Persona).filter(Persona.id == cita.id_alumno).first()
        personal = db.query(Persona).filter(Persona.id == cita.id_personal).first() if cita.id_personal else None

        resultado.append(CitaOut(
            id_cita=cita.id_cita,
            id_alumno=cita.id_alumno,
            id_personal=cita.id_personal,
            id_grupo=cita.id_grupo,
            id_cuestionario=cita.id_cuestionario,
            tipo_cita=cita.tipo_cita,
            motivo=cita.motivo,
            estado=cita.estado,
            fecha_solicitud=cita.fecha_solicitud,
            fecha_propuesta_alumno=cita.fecha_propuesta_alumno,
            fecha_confirmada=cita.fecha_confirmada,
            fecha_completada=cita.fecha_completada,
            observaciones_alumno=cita.observaciones_alumno,
            observaciones_personal=cita.observaciones_personal,
            ubicacion=cita.ubicacion,
            motivo_psicologico=cita.motivo_psicologico,
            motivo_academico=cita.motivo_academico,
            salud_en_general_vulnerable=cita.salud_en_general_vulnerable,
            requiere_seguimiento=cita.requiere_seguimiento,
            requiere_canalizacion_externa=cita.requiere_canalizacion_externa,
            estatus_canalizacion_externa=cita.estatus_canalizacion_externa,
            fecha_proxima_sesion=cita.fecha_proxima_sesion,
            ultima_fecha_contacto=cita.ultima_fecha_contacto,
            fecha_creacion=cita.fecha_creacion,
            fecha_actualizacion=cita.fecha_actualizacion,
            alumno_nombre=alumno.correo_institucional.split('@')[0] if alumno else "Desconocido",
            alumno_email=alumno.correo_institucional if alumno else "",
            alumno_celular=alumno.celular if alumno else None,
            alumno_matricula=alumno.matricula if alumno else None,
            personal_nombre=personal.correo_institucional.split('@')[0] if personal else None,
            personal_email=personal.correo_institucional if personal else None
        ))

    return resultado


@router.post("/bulk-create", response_model=List[CitaOut])
def bulk_create_citas(
    *,
    db: Session = Depends(get_db),
    bulk_citas: CitaBulkCreate,
    current_user: Persona = Depends(check_admin_role)
) -> Any:
    """
    Crear múltiples citas en una sola operación (solo administradores).
    """
    created_citas = []

    for cita_data in bulk_citas.items:
        db_cita = Cita(
            id_alumno=cita_data.id_alumno,
            id_personal=cita_data.id_personal,
            id_grupo=cita_data.id_grupo,
            id_cuestionario=cita_data.id_cuestionario,
            tipo_cita=cita_data.tipo_cita,
            motivo=cita_data.motivo,
            fecha_propuesta_alumno=cita_data.fecha_propuesta_alumno,
            observaciones_alumno=cita_data.observaciones_alumno,
            estado=EstadoCita.PENDIENTE
        )
        db.add(db_cita)
        created_citas.append(db_cita)

    db.commit()

    # Refrescar todos los objetos
    for cita in created_citas:
        db.refresh(cita)

    # Construir respuesta
    resultado = []
    for cita in created_citas:
        alumno = db.query(Persona).filter(Persona.id == cita.id_alumno).first()
        personal = db.query(Persona).filter(Persona.id == cita.id_personal).first() if cita.id_personal else None

        resultado.append(CitaOut(
            id_cita=cita.id_cita,
            id_alumno=cita.id_alumno,
            id_personal=cita.id_personal,
            id_grupo=cita.id_grupo,
            id_cuestionario=cita.id_cuestionario,
            tipo_cita=cita.tipo_cita,
            motivo=cita.motivo,
            estado=cita.estado,
            fecha_solicitud=cita.fecha_solicitud,
            fecha_propuesta_alumno=cita.fecha_propuesta_alumno,
            fecha_confirmada=cita.fecha_confirmada,
            fecha_completada=cita.fecha_completada,
            observaciones_alumno=cita.observaciones_alumno,
            observaciones_personal=cita.observaciones_personal,
            ubicacion=cita.ubicacion,
            motivo_psicologico=cita.motivo_psicologico,
            motivo_academico=cita.motivo_academico,
            salud_en_general_vulnerable=cita.salud_en_general_vulnerable,
            requiere_seguimiento=cita.requiere_seguimiento,
            requiere_canalizacion_externa=cita.requiere_canalizacion_externa,
            estatus_canalizacion_externa=cita.estatus_canalizacion_externa,
            fecha_proxima_sesion=cita.fecha_proxima_sesion,
            ultima_fecha_contacto=cita.ultima_fecha_contacto,
            fecha_creacion=cita.fecha_creacion,
            fecha_actualizacion=cita.fecha_actualizacion,
            alumno_nombre=alumno.correo_institucional.split('@')[0] if alumno else "Desconocido",
            alumno_email=alumno.correo_institucional if alumno else "",
            alumno_celular=alumno.celular if alumno else None,
            alumno_matricula=alumno.matricula if alumno else None,
            personal_nombre=personal.correo_institucional.split('@')[0] if personal else None,
            personal_email=personal.correo_institucional if personal else None
        ))

    return resultado


@router.put("/bulk-update", response_model=List[CitaOut])
def bulk_update_citas(
    *,
    db: Session = Depends(get_db),
    bulk_update: CitaBulkUpdate,
    current_user: Persona = Depends(check_admin_role)
) -> Any:
    """
    Actualizar múltiples citas en una sola operación (solo administradores).
    """
    updated_citas = []

    for item in bulk_update.items:
        if "id_cita" not in item:
            continue

        cita_id = item.pop("id_cita")
        cita = db.query(Cita).filter(Cita.id_cita == cita_id).first()

        if not cita:
            continue

        # Actualizar campos
        for field, value in item.items():
            if hasattr(cita, field):
                setattr(cita, field, value)

        db.add(cita)
        updated_citas.append(cita)

    db.commit()

    # Refrescar todos los objetos
    for cita in updated_citas:
        db.refresh(cita)

    # Construir respuesta
    resultado = []
    for cita in updated_citas:
        alumno = db.query(Persona).filter(Persona.id == cita.id_alumno).first()
        personal = db.query(Persona).filter(Persona.id == cita.id_personal).first() if cita.id_personal else None

        resultado.append(CitaOut(
            id_cita=cita.id_cita,
            id_alumno=cita.id_alumno,
            id_personal=cita.id_personal,
            id_grupo=cita.id_grupo,
            id_cuestionario=cita.id_cuestionario,
            tipo_cita=cita.tipo_cita,
            motivo=cita.motivo,
            estado=cita.estado,
            fecha_solicitud=cita.fecha_solicitud,
            fecha_propuesta_alumno=cita.fecha_propuesta_alumno,
            fecha_confirmada=cita.fecha_confirmada,
            fecha_completada=cita.fecha_completada,
            observaciones_alumno=cita.observaciones_alumno,
            observaciones_personal=cita.observaciones_personal,
            ubicacion=cita.ubicacion,
            motivo_psicologico=cita.motivo_psicologico,
            motivo_academico=cita.motivo_academico,
            salud_en_general_vulnerable=cita.salud_en_general_vulnerable,
            requiere_seguimiento=cita.requiere_seguimiento,
            requiere_canalizacion_externa=cita.requiere_canalizacion_externa,
            estatus_canalizacion_externa=cita.estatus_canalizacion_externa,
            fecha_proxima_sesion=cita.fecha_proxima_sesion,
            ultima_fecha_contacto=cita.ultima_fecha_contacto,
            fecha_creacion=cita.fecha_creacion,
            fecha_actualizacion=cita.fecha_actualizacion,
            alumno_nombre=alumno.correo_institucional.split('@')[0] if alumno else "Desconocido",
            alumno_email=alumno.correo_institucional if alumno else "",
            alumno_celular=alumno.celular if alumno else None,
            alumno_matricula=alumno.matricula if alumno else None,
            personal_nombre=personal.correo_institucional.split('@')[0] if personal else None,
            personal_email=personal.correo_institucional if personal else None
        ))

    return resultado


