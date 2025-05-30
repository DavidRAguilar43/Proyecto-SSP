from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, field_validator


# Esquema base para ContactoEmergencia
class ContactoEmergenciaBase(BaseModel):
    nombre_contacto: str
    telefono_contacto: str
    parentesco: str
    id_persona: int


# Esquema para crear un contacto de emergencia
class ContactoEmergenciaCreate(ContactoEmergenciaBase):
    pass


# Esquema para actualizar un contacto de emergencia
class ContactoEmergenciaUpdate(BaseModel):
    nombre_contacto: Optional[str] = None
    telefono_contacto: Optional[str] = None
    parentesco: Optional[str] = None
    id_persona: Optional[int] = None


# Esquema para respuesta de contacto de emergencia
class ContactoEmergenciaInDB(ContactoEmergenciaBase):
    id_contacto: int

    model_config = ConfigDict(from_attributes=True)


# Esquema para respuesta de contacto de emergencia (sin datos sensibles)
class ContactoEmergenciaOut(ContactoEmergenciaInDB):
    pass


# Esquema para operaciones por lotes
class ContactoEmergenciaBulkDelete(BaseModel):
    ids: List[int]


class ContactoEmergenciaBulkCreate(BaseModel):
    items: List[ContactoEmergenciaCreate]


class ContactoEmergenciaBulkUpdate(BaseModel):
    items: List[Dict[str, Any]]  # Lista de diccionarios con id y datos a actualizar
