from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict, field_validator


# Esquema base para Grupo
class GrupoBase(BaseModel):
    nombre_grupo: str
    tipo_grupo: str
    observaciones_grupo: Optional[str] = None
    cohorte: Optional[str] = None
    fecha_creacion_registro: Optional[datetime] = None


# Esquema para crear un grupo
class GrupoCreate(GrupoBase):
    pass


# Esquema para actualizar un grupo
class GrupoUpdate(BaseModel):
    nombre_grupo: Optional[str] = None
    tipo_grupo: Optional[str] = None
    observaciones_grupo: Optional[str] = None
    cohorte: Optional[str] = None
    fecha_creacion_registro: Optional[datetime] = None


# Esquema para respuesta de grupo
class GrupoInDB(GrupoBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# Esquema para respuesta de grupo (sin datos sensibles)
class GrupoOut(GrupoInDB):
    pass


# Esquema para operaciones por lotes
class GrupoBulkDelete(BaseModel):
    ids: List[int]


class GrupoBulkCreate(BaseModel):
    items: List[GrupoCreate]


class GrupoBulkUpdate(BaseModel):
    items: List[Dict[str, Any]]  # Lista de diccionarios con id y datos a actualizar
