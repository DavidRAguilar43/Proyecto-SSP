from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, field_validator


# Esquema base para Personal
class PersonalBase(BaseModel):
    area: str
    rol: str
    numero_empleado: str
    id_persona: int


# Esquema para crear un personal
class PersonalCreate(PersonalBase):
    pass


# Esquema para actualizar un personal
class PersonalUpdate(BaseModel):
    area: Optional[str] = None
    rol: Optional[str] = None
    numero_empleado: Optional[str] = None
    id_persona: Optional[int] = None


# Esquema para respuesta de personal
class PersonalInDB(PersonalBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# Esquema para respuesta de personal (sin datos sensibles)
class PersonalOut(PersonalInDB):
    pass


# Esquema para operaciones por lotes
class PersonalBulkDelete(BaseModel):
    ids: List[int]


class PersonalBulkCreate(BaseModel):
    items: List[PersonalCreate]


class PersonalBulkUpdate(BaseModel):
    items: List[Dict[str, Any]]  # Lista de diccionarios con id y datos a actualizar
