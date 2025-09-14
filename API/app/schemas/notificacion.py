from typing import Optional
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from enum import Enum


class TipoNotificacionRegistro(str, Enum):
    REGISTRO_PERSONAL_PENDIENTE = "registro_personal_pendiente"
    REGISTRO_DOCENTE_PENDIENTE = "registro_docente_pendiente"


# Esquema base para NotificacionRegistro
class NotificacionRegistroBase(BaseModel):
    tipo_notificacion: TipoNotificacionRegistro
    mensaje: str
    usuario_solicitante_id: int
    usuario_destinatario_id: Optional[int] = None


# Esquema para crear una notificación
class NotificacionRegistroCreate(NotificacionRegistroBase):
    pass


# Esquema para actualizar una notificación
class NotificacionRegistroUpdate(BaseModel):
    leida: Optional[bool] = None
    procesada: Optional[bool] = None
    aprobada: Optional[bool] = None
    observaciones_admin: Optional[str] = None


# Esquema para procesar una notificación (aprobar/rechazar)
class NotificacionRegistroProcesar(BaseModel):
    aprobada: bool
    observaciones_admin: Optional[str] = None


# Esquema de salida para NotificacionRegistro
class NotificacionRegistroOut(NotificacionRegistroBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    leida: bool
    procesada: bool
    aprobada: Optional[bool]
    observaciones_admin: Optional[str]
    fecha_creacion: datetime
    fecha_leida: Optional[datetime]
    fecha_procesada: Optional[datetime]
    
    # Información del usuario solicitante
    usuario_solicitante_nombre: Optional[str] = None
    usuario_solicitante_email: Optional[str] = None
    usuario_solicitante_matricula: Optional[str] = None
    usuario_solicitante_rol: Optional[str] = None


# Esquema para estadísticas de notificaciones
class EstadisticasNotificaciones(BaseModel):
    total_pendientes: int
    total_procesadas: int
    total_aprobadas: int
    total_rechazadas: int
    por_tipo: dict


# Esquema para respuesta de múltiples notificaciones
class NotificacionesResponse(BaseModel):
    notificaciones: list[NotificacionRegistroOut]
    total: int
    pendientes: int
    procesadas: int
