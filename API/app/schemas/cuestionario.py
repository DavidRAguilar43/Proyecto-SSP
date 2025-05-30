from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, field_validator


# Esquema base para Cuestionario
class CuestionarioBase(BaseModel):
    variables: Optional[Dict[str, Any]] = None


# Esquema para crear un cuestionario
class CuestionarioCreate(CuestionarioBase):
    pass


# Esquema para actualizar un cuestionario
class CuestionarioUpdate(BaseModel):
    variables: Optional[Dict[str, Any]] = None


# Esquema para respuesta de cuestionario
class CuestionarioInDB(CuestionarioBase):
    id_cuestionario: int

    model_config = ConfigDict(from_attributes=True)


# Esquema para respuesta de cuestionario (sin datos sensibles)
class CuestionarioOut(CuestionarioInDB):
    pass


# Esquema para operaciones por lotes
class CuestionarioBulkDelete(BaseModel):
    ids: List[int]


class CuestionarioBulkCreate(BaseModel):
    items: List[CuestionarioCreate]


class CuestionarioBulkUpdate(BaseModel):
    items: List[Dict[str, Any]]  # Lista de diccionarios con id y datos a actualizar
