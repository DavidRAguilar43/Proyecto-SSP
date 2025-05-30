from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, field_validator


# Esquema base para ProgramaEducativo
class ProgramaEducativoBase(BaseModel):
    nombre_programa: str
    clave_programa: str


# Esquema para crear un programa educativo
class ProgramaEducativoCreate(ProgramaEducativoBase):
    pass


# Esquema para actualizar un programa educativo
class ProgramaEducativoUpdate(BaseModel):
    nombre_programa: Optional[str] = None
    clave_programa: Optional[str] = None


# Esquema para respuesta de programa educativo
class ProgramaEducativoInDB(ProgramaEducativoBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# Esquema para respuesta de programa educativo (sin datos sensibles)
class ProgramaEducativoOut(ProgramaEducativoInDB):
    pass


# Esquema para operaciones por lotes
class ProgramaEducativoBulkDelete(BaseModel):
    ids: List[int]


class ProgramaEducativoBulkCreate(BaseModel):
    items: List[ProgramaEducativoCreate]


class ProgramaEducativoBulkUpdate(BaseModel):
    items: List[Dict[str, Any]]  # Lista de diccionarios con id y datos a actualizar
