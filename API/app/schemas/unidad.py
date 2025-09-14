from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict


# Esquema base para Unidad
class UnidadBase(BaseModel):
    nombre: str


# Esquema para crear una unidad
class UnidadCreate(UnidadBase):
    pass


# Esquema para actualizar una unidad
class UnidadUpdate(BaseModel):
    nombre: Optional[str] = None


# Esquema para respuesta de unidad
class UnidadInDB(UnidadBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# Esquema para respuesta de unidad (sin datos sensibles)
class UnidadOut(UnidadInDB):
    pass


# Esquema para operaciones por lotes
class UnidadBulkDelete(BaseModel):
    ids: List[int]


class UnidadBulkCreate(BaseModel):
    items: List[UnidadCreate]


class UnidadBulkUpdate(BaseModel):
    items: List[Dict[str, Any]]  # Lista de diccionarios con id y datos a actualizar
