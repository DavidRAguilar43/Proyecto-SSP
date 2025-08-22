from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class EstadoCita(str, Enum):
    PENDIENTE = "pendiente"
    CONFIRMADA = "confirmada"
    CANCELADA = "cancelada"
    COMPLETADA = "completada"

class TipoCita(str, Enum):
    PSICOLOGICA = "psicologica"
    ACADEMICA = "academica"
    GENERAL = "general"

# Schema base para citas
class CitaBase(BaseModel):
    tipo_cita: TipoCita = TipoCita.GENERAL
    motivo: str = Field(..., min_length=10, max_length=500, description="Motivo de la cita")
    fecha_propuesta_alumno: Optional[datetime] = Field(None, description="Fecha preferida por el alumno")
    observaciones_alumno: Optional[str] = Field(None, max_length=500, description="Observaciones adicionales del alumno")

# Schema para crear una cita (desde el alumno)
class CitaCreate(CitaBase):
    pass

# Schema para actualizar una cita (desde el personal)
class CitaUpdate(BaseModel):
    estado: Optional[EstadoCita] = None
    fecha_confirmada: Optional[datetime] = None
    observaciones_personal: Optional[str] = Field(None, max_length=500)
    ubicacion: Optional[str] = Field(None, max_length=200)
    id_personal: Optional[int] = None

# Schema para respuesta de cita
class CitaOut(CitaBase):
    id_cita: int
    id_alumno: int
    id_personal: Optional[int] = None
    estado: EstadoCita
    fecha_solicitud: datetime
    fecha_confirmada: Optional[datetime] = None
    fecha_completada: Optional[datetime] = None
    observaciones_personal: Optional[str] = None
    ubicacion: Optional[str] = None
    fecha_creacion: datetime
    fecha_actualizacion: Optional[datetime] = None
    
    # Información del alumno
    alumno_nombre: Optional[str] = None
    alumno_email: Optional[str] = None
    alumno_celular: Optional[str] = None
    alumno_matricula: Optional[str] = None
    
    # Información del personal
    personal_nombre: Optional[str] = None
    personal_email: Optional[str] = None

    class Config:
        from_attributes = True

# Schema para solicitudes de citas (vista del personal)
class SolicitudCitaOut(BaseModel):
    id_cita: int
    tipo_cita: TipoCita
    motivo: str
    estado: EstadoCita
    fecha_solicitud: datetime
    fecha_propuesta_alumno: Optional[datetime] = None
    observaciones_alumno: Optional[str] = None
    
    # Información del alumno
    id_alumno: int
    alumno_nombre: str
    alumno_email: str
    alumno_celular: Optional[str] = None
    alumno_matricula: Optional[str] = None
    alumno_semestre: Optional[int] = None
    
    class Config:
        from_attributes = True

# Schema para notificaciones de citas
class NotificacionCita(BaseModel):
    id_cita: int
    tipo_notificacion: str  # "cita_confirmada", "cita_cancelada", etc.
    mensaje: str
    fecha_cita: Optional[datetime] = None
    ubicacion: Optional[str] = None
    personal_nombre: Optional[str] = None
    
    class Config:
        from_attributes = True

# Schema para estadísticas de citas
class EstadisticasCitas(BaseModel):
    total_solicitudes: int
    pendientes: int
    confirmadas: int
    canceladas: int
    completadas: int
    por_tipo: dict
    
    class Config:
        from_attributes = True
