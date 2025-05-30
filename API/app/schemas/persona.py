from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, field_validator, ConfigDict
from enum import Enum

# Enumeraciones
class TipoPersona(str, Enum):
    ALUMNO = "alumno"
    DOCENTE = "docente"
    ADMINISTRATIVO = "administrativo"
    OTRO = "otro"


class Sexo(str, Enum):
    MASCULINO = "masculino"
    FEMENINO = "femenino"
    OTRO = "otro"


class Genero(str, Enum):
    MASCULINO = "masculino"
    FEMENINO = "femenino"
    NO_BINARIO = "no_binario"
    OTRO = "otro"


class EstadoCivil(str, Enum):
    SOLTERO = "soltero"
    CASADO = "casado"
    DIVORCIADO = "divorciado"
    VIUDO = "viudo"
    UNION_LIBRE = "union_libre"
    OTRO = "otro"


class Rol(str, Enum):
    ADMIN = "admin"
    PERSONAL = "personal"
    ALUMNO = "alumno"
    DOCENTE = "docente"


# Esquemas base
class PersonaBase(BaseModel):
    tipo_persona: TipoPersona
    sexo: Sexo
    genero: Genero
    edad: int
    estado_civil: EstadoCivil
    religion: Optional[str] = None
    trabaja: bool = False
    lugar_trabajo: Optional[str] = None
    lugar_origen: str
    colonia_residencia_actual: str
    celular: str
    correo_institucional: EmailStr
    discapacidad: Optional[str] = None
    observaciones: Optional[str] = None
    matricula: Optional[str] = None
    semestre: Optional[int] = None
    numero_hijos: int = 0
    grupo_etnico: Optional[str] = None
    rol: Rol = Rol.ALUMNO


# Esquema para crear una persona
class PersonaCreate(PersonaBase):
    password: str
    programas_ids: Optional[List[int]] = []
    grupos_ids: Optional[List[int]] = []


# Esquema para actualizar una persona
class PersonaUpdate(BaseModel):
    tipo_persona: Optional[TipoPersona] = None
    sexo: Optional[Sexo] = None
    genero: Optional[Genero] = None
    edad: Optional[int] = None
    estado_civil: Optional[EstadoCivil] = None
    religion: Optional[str] = None
    trabaja: Optional[bool] = None
    lugar_trabajo: Optional[str] = None
    lugar_origen: Optional[str] = None
    colonia_residencia_actual: Optional[str] = None
    celular: Optional[str] = None
    correo_institucional: Optional[EmailStr] = None
    discapacidad: Optional[str] = None
    observaciones: Optional[str] = None
    matricula: Optional[str] = None
    semestre: Optional[int] = None
    numero_hijos: Optional[int] = None
    grupo_etnico: Optional[str] = None
    rol: Optional[Rol] = None
    password: Optional[str] = None
    programas_ids: Optional[List[int]] = None
    grupos_ids: Optional[List[int]] = None
    is_active: Optional[bool] = None


# Esquema para respuesta de persona
class PersonaInDB(PersonaBase):
    id: int
    is_active: bool = True
    hashed_password: str

    model_config = ConfigDict(from_attributes=True)


# Esquema para respuesta de persona (sin datos sensibles)
class PersonaOut(PersonaBase):
    id: int
    is_active: bool = True

    model_config = ConfigDict(from_attributes=True)


# Esquema para operaciones por lotes
class PersonaBulkDelete(BaseModel):
    ids: List[int]


class PersonaBulkCreate(BaseModel):
    items: List[PersonaCreate]


class PersonaBulkUpdate(BaseModel):
    items: List[dict]  # Lista de diccionarios con id y datos a actualizar
