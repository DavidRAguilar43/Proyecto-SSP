from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.db.database import get_db
from app.models.notificacion import NotificacionRegistro
from app.models.persona import Persona
from app.schemas.notificacion import (
    NotificacionRegistroOut,
    NotificacionRegistroUpdate,
    NotificacionRegistroProcesar,
    EstadisticasNotificaciones,
    NotificacionesResponse
)
from app.utils.deps import (
    get_current_active_user,
    check_admin_role
)

router = APIRouter(prefix="/notificaciones", tags=["notificaciones"])


@router.get("/registros", response_model=NotificacionesResponse)
def get_notificaciones_registros(
    *,
    db: Session = Depends(get_db),
    current_user: Persona = Depends(check_admin_role),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    solo_pendientes: bool = Query(False),
    tipo_notificacion: Optional[str] = Query(None)
) -> Any:
    """
    Obtener notificaciones de registros pendientes (solo para administradores).
    """
    query = db.query(NotificacionRegistro).filter(
        NotificacionRegistro.usuario_destinatario_id == current_user.id
    )
    
    # Filtros opcionales
    if solo_pendientes:
        query = query.filter(NotificacionRegistro.procesada == False)
    
    if tipo_notificacion:
        query = query.filter(NotificacionRegistro.tipo_notificacion == tipo_notificacion)
    
    # Ordenar por fecha de creación (más recientes primero)
    query = query.order_by(NotificacionRegistro.fecha_creacion.desc())
    
    # Contar totales
    total = query.count()
    pendientes = db.query(NotificacionRegistro).filter(
        NotificacionRegistro.usuario_destinatario_id == current_user.id,
        NotificacionRegistro.procesada == False
    ).count()
    procesadas = total - pendientes
    
    # Aplicar paginación
    notificaciones_db = query.offset(skip).limit(limit).all()
    
    # Convertir a esquemas de salida con información del usuario solicitante
    notificaciones_out = []
    for notif in notificaciones_db:
        notif_dict = {
            "id": notif.id,
            "tipo_notificacion": notif.tipo_notificacion,
            "mensaje": notif.mensaje,
            "usuario_solicitante_id": notif.usuario_solicitante_id,
            "usuario_destinatario_id": notif.usuario_destinatario_id,
            "leida": notif.leida,
            "procesada": notif.procesada,
            "aprobada": notif.aprobada,
            "observaciones_admin": notif.observaciones_admin,
            "fecha_creacion": notif.fecha_creacion,
            "fecha_leida": notif.fecha_leida,
            "fecha_procesada": notif.fecha_procesada,
        }
        
        # Agregar información del usuario solicitante
        if notif.usuario_solicitante:
            notif_dict.update({
                "usuario_solicitante_nombre": notif.usuario_solicitante.correo_institucional.split('@')[0],
                "usuario_solicitante_email": notif.usuario_solicitante.correo_institucional,
                "usuario_solicitante_matricula": notif.usuario_solicitante.matricula,
            })
        
        notificaciones_out.append(NotificacionRegistroOut(**notif_dict))
    
    return NotificacionesResponse(
        notificaciones=notificaciones_out,
        total=total,
        pendientes=pendientes,
        procesadas=procesadas
    )


@router.patch("/{notificacion_id}/marcar-leida")
def marcar_notificacion_leida(
    *,
    db: Session = Depends(get_db),
    current_user: Persona = Depends(check_admin_role),
    notificacion_id: int
) -> Any:
    """
    Marcar una notificación como leída.
    """
    notificacion = db.query(NotificacionRegistro).filter(
        NotificacionRegistro.id == notificacion_id,
        NotificacionRegistro.usuario_destinatario_id == current_user.id
    ).first()
    
    if not notificacion:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    
    notificacion.marcar_como_leida()
    db.commit()
    
    return {"message": "Notificación marcada como leída"}


@router.post("/{notificacion_id}/procesar")
def procesar_notificacion_registro(
    *,
    db: Session = Depends(get_db),
    current_user: Persona = Depends(check_admin_role),
    notificacion_id: int,
    datos_procesamiento: NotificacionRegistroProcesar
) -> Any:
    """
    Procesar una notificación de registro (aprobar o rechazar).
    """
    notificacion = db.query(NotificacionRegistro).filter(
        NotificacionRegistro.id == notificacion_id,
        NotificacionRegistro.usuario_destinatario_id == current_user.id
    ).first()
    
    if not notificacion:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    
    if notificacion.procesada:
        raise HTTPException(status_code=400, detail="Esta notificación ya ha sido procesada")
    
    # Procesar la notificación
    notificacion.procesar(
        aprobada=datos_procesamiento.aprobada,
        observaciones=datos_procesamiento.observaciones_admin
    )
    
    # Actualizar el estado del usuario solicitante
    usuario_solicitante = notificacion.usuario_solicitante
    if datos_procesamiento.aprobada:
        # Aprobar: activar la cuenta
        usuario_solicitante.is_active = True
    else:
        # Rechazar: mantener inactiva y agregar observaciones
        usuario_solicitante.is_active = False
        if datos_procesamiento.observaciones_admin:
            observaciones_actuales = usuario_solicitante.observaciones or ""
            usuario_solicitante.observaciones = f"{observaciones_actuales}\n[ADMIN] {datos_procesamiento.observaciones_admin}".strip()
    
    db.commit()
    
    accion = "aprobado" if datos_procesamiento.aprobada else "rechazado"
    return {"message": f"Registro {accion} exitosamente"}


@router.get("/estadisticas", response_model=EstadisticasNotificaciones)
def get_estadisticas_notificaciones(
    *,
    db: Session = Depends(get_db),
    current_user: Persona = Depends(check_admin_role)
) -> Any:
    """
    Obtener estadísticas de notificaciones de registros.
    """
    base_query = db.query(NotificacionRegistro).filter(
        NotificacionRegistro.usuario_destinatario_id == current_user.id
    )
    
    total_pendientes = base_query.filter(NotificacionRegistro.procesada == False).count()
    total_procesadas = base_query.filter(NotificacionRegistro.procesada == True).count()
    total_aprobadas = base_query.filter(
        NotificacionRegistro.procesada == True,
        NotificacionRegistro.aprobada == True
    ).count()
    total_rechazadas = base_query.filter(
        NotificacionRegistro.procesada == True,
        NotificacionRegistro.aprobada == False
    ).count()
    
    # Estadísticas por tipo
    tipos_stats = {}
    for tipo in ["registro_personal_pendiente", "registro_docente_pendiente"]:
        count = base_query.filter(
            NotificacionRegistro.tipo_notificacion == tipo,
            NotificacionRegistro.procesada == False
        ).count()
        tipos_stats[tipo] = count
    
    return EstadisticasNotificaciones(
        total_pendientes=total_pendientes,
        total_procesadas=total_procesadas,
        total_aprobadas=total_aprobadas,
        total_rechazadas=total_rechazadas,
        por_tipo=tipos_stats
    )
