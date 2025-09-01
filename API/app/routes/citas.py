from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from app.db.database import get_db
from app.models.persona import Persona
from app.models.cita import Cita, EstadoCita, TipoCita
from app.schemas.cita import (
    CitaCreate, CitaUpdate, CitaOut, SolicitudCitaOut, 
    NotificacionCita, EstadisticasCitas
)
from app.utils.deps import get_current_active_user

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
    Obtener solicitudes de citas (solo para admin y personal).
    """
    if current_user.rol not in ["admin", "personal"]:
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
    Confirmar o actualizar una cita (solo para admin y personal).
    """
    if current_user.rol not in ["admin", "personal"]:
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
    Obtener estadísticas de citas (solo para admin y personal).
    """
    if current_user.rol not in ["admin", "personal"]:
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
