from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict, field_validator


# Esquema base para Atencion
class AtencionBase(BaseModel):
    fecha_atencion: Optional[datetime] = None
    motivo_psicologico: bool = False
    motivo_academico: bool = False
    salud_en_general_vulnerable: bool = False
    requiere_seguimiento: bool = False
    requiere_canalizacion_externa: bool = False
    estatus_canalizacion_externa: Optional[str] = None
    observaciones: Optional[str] = None
    fecha_proxima_sesion: Optional[datetime] = None
    atendido: bool = False
    ultima_fecha_contacto: Optional[datetime] = None
    id_personal: Optional[int] = None
    id_persona: Optional[int] = None
    id_grupo: Optional[int] = None
    id_cuestionario: Optional[int] = None


# Esquema para crear una atención
class AtencionCreate(AtencionBase):
    pass


# Esquema para actualizar una atención
class AtencionUpdate(BaseModel):
    fecha_atencion: Optional[datetime] = None
    motivo_psicologico: Optional[bool] = None
    motivo_academico: Optional[bool] = None
    salud_en_general_vulnerable: Optional[bool] = None
    requiere_seguimiento: Optional[bool] = None
    requiere_canalizacion_externa: Optional[bool] = None
    estatus_canalizacion_externa: Optional[str] = None
    observaciones: Optional[str] = None
    fecha_proxima_sesion: Optional[datetime] = None
    atendido: Optional[bool] = None
    ultima_fecha_contacto: Optional[datetime] = None
    id_personal: Optional[int] = None
    id_persona: Optional[int] = None
    id_grupo: Optional[int] = None
    id_cuestionario: Optional[int] = None


# Esquema para respuesta de atención
class AtencionInDB(AtencionBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# Esquema para respuesta de atención (sin datos sensibles)
class AtencionOut(AtencionInDB):
    pass


# Esquema para operaciones por lotes
class AtencionBulkDelete(BaseModel):
    ids: List[int]


class AtencionBulkCreate(BaseModel):
    items: List[AtencionCreate]


class AtencionBulkUpdate(BaseModel):
    items: List[Dict[str, Any]]  # Lista de diccionarios con id y datos a actualizar
