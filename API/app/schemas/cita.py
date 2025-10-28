from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class EstadoCita(str, Enum):
    """Estados posibles de una cita."""
    PENDIENTE = "pendiente"
    CONFIRMADA = "confirmada"
    CANCELADA = "cancelada"
    COMPLETADA = "completada"

class TipoCita(str, Enum):
    """Tipos de cita disponibles."""
    PSICOLOGICA = "psicologica"
    ACADEMICA = "academica"
    GENERAL = "general"

# Schema base para citas
class CitaBase(BaseModel):
    """Schema base con campos comunes de citas."""
    tipo_cita: TipoCita = TipoCita.GENERAL
    motivo: str = Field(..., min_length=10, max_length=500, description="Motivo de la cita")
    fecha_propuesta_alumno: Optional[datetime] = Field(None, description="Fecha preferida por el alumno")
    observaciones_alumno: Optional[str] = Field(None, max_length=500, description="Observaciones adicionales del alumno")

    # Campos opcionales para cuando se crea desde el admin
    id_alumno: Optional[int] = None
    id_personal: Optional[int] = None
    id_grupo: Optional[int] = None
    id_cuestionario: Optional[int] = None

# Schema para crear una cita (desde el alumno o admin)
class CitaCreate(CitaBase):
    """Schema para crear una nueva cita."""
    pass

# Schema para actualizar una cita (desde el personal o admin)
class CitaUpdate(BaseModel):
    """
    Schema para actualizar una cita.

    Incluye campos de gestión de cita y campos de atención completada.
    """
    # Campos de gestión de cita
    estado: Optional[EstadoCita] = None
    fecha_confirmada: Optional[datetime] = None
    fecha_completada: Optional[datetime] = None
    observaciones_personal: Optional[str] = Field(None, max_length=500)
    ubicacion: Optional[str] = Field(None, max_length=200)
    id_personal: Optional[int] = None

    # Campos de atención (cuando la cita está completada)
    motivo_psicologico: Optional[bool] = None
    motivo_academico: Optional[bool] = None
    salud_en_general_vulnerable: Optional[bool] = None
    requiere_seguimiento: Optional[bool] = None
    requiere_canalizacion_externa: Optional[bool] = None
    estatus_canalizacion_externa: Optional[str] = None
    fecha_proxima_sesion: Optional[datetime] = None
    ultima_fecha_contacto: Optional[datetime] = None
    id_grupo: Optional[int] = None
    id_cuestionario: Optional[int] = None

# Schema para respuesta de cita
class CitaOut(BaseModel):
    """Schema completo para respuesta de cita con todos los campos."""
    # Identificadores
    id_cita: int
    id_alumno: int
    id_personal: Optional[int] = None
    id_grupo: Optional[int] = None
    id_cuestionario: Optional[int] = None

    # Información básica
    tipo_cita: TipoCita
    motivo: str
    estado: EstadoCita

    # Fechas
    fecha_solicitud: datetime
    fecha_propuesta_alumno: Optional[datetime] = None
    fecha_confirmada: Optional[datetime] = None
    fecha_completada: Optional[datetime] = None
    fecha_creacion: datetime
    fecha_actualizacion: Optional[datetime] = None

    # Observaciones
    observaciones_alumno: Optional[str] = None
    observaciones_personal: Optional[str] = None
    ubicacion: Optional[str] = None

    # Campos de atención (cuando está completada)
    motivo_psicologico: Optional[bool] = False
    motivo_academico: Optional[bool] = False
    salud_en_general_vulnerable: Optional[bool] = False
    requiere_seguimiento: Optional[bool] = False
    requiere_canalizacion_externa: Optional[bool] = False
    estatus_canalizacion_externa: Optional[str] = None
    fecha_proxima_sesion: Optional[datetime] = None
    ultima_fecha_contacto: Optional[datetime] = None

    # Información del alumno (computed fields)
    alumno_nombre: Optional[str] = None
    alumno_email: Optional[str] = None
    alumno_celular: Optional[str] = None
    alumno_matricula: Optional[str] = None

    # Información del personal (computed fields)
    personal_nombre: Optional[str] = None
    personal_email: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# Schema para solicitudes de citas (vista del personal)
class SolicitudCitaOut(BaseModel):
    """Schema simplificado para listar solicitudes de citas."""
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

    model_config = ConfigDict(from_attributes=True)

# Schema para notificaciones de citas
class NotificacionCita(BaseModel):
    """Schema para notificaciones relacionadas con citas."""
    id_cita: int
    tipo_notificacion: str  # "cita_confirmada", "cita_cancelada", etc.
    mensaje: str
    fecha_cita: Optional[datetime] = None
    ubicacion: Optional[str] = None
    personal_nombre: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# Schema para estadísticas de citas
class EstadisticasCitas(BaseModel):
    """Schema para estadísticas agregadas de citas."""
    total_solicitudes: int
    pendientes: int
    confirmadas: int
    canceladas: int
    completadas: int
    por_tipo: dict

    model_config = ConfigDict(from_attributes=True)


# Esquemas para operaciones por lotes
class CitaBulkDelete(BaseModel):
    """Schema para eliminación masiva de citas."""
    ids: List[int]


class CitaBulkCreate(BaseModel):
    """Schema para creación masiva de citas."""
    items: List[CitaCreate]


class CitaBulkUpdate(BaseModel):
    """Schema para actualización masiva de citas."""
    items: List[Dict[str, Any]]  # Lista de diccionarios con id_cita y campos a actualizar
