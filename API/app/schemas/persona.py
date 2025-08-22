from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, field_validator, ConfigDict
from datetime import datetime
from enum import Enum


# Enums para validación
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
    SOLTERA = "soltera"  # Agregamos la variante femenina
    CASADO = "casado"
    CASADA = "casada"    # Agregamos la variante femenina
    DIVORCIADO = "divorciado"
    DIVORCIADA = "divorciada"  # Agregamos la variante femenina
    VIUDO = "viudo"
    VIUDA = "viuda"      # Agregamos la variante femenina
    UNION_LIBRE = "union_libre"
    OTRO = "otro"


class Rol(str, Enum):
    ADMIN = "admin"
    PERSONAL = "personal"
    DOCENTE = "docente"
    ALUMNO = "alumno"


# Esquema base para Persona
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
    cohorte_id: Optional[int] = None  # Nuevo campo para cohorte

    @field_validator('edad')
    @classmethod
    def validate_edad(cls, v):
        if v < 15 or v > 100:
            raise ValueError('La edad debe estar entre 15 y 100 años')
        return v

    @field_validator('semestre')
    @classmethod
    def validate_semestre(cls, v):
        if v is not None and (v < 1 or v > 12):
            raise ValueError('El semestre debe estar entre 1 y 12')
        return v


# Esquema para crear una persona
class PersonaCreate(PersonaBase):
    password: str
    programas_ids: Optional[List[int]] = []
    grupos_ids: Optional[List[int]] = []

    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('La contraseña debe tener al menos 6 caracteres')
        return v


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
    cohorte_id: Optional[int] = None  # Nuevo campo para cohorte
    programas_ids: Optional[List[int]] = None
    grupos_ids: Optional[List[int]] = None

    @field_validator('edad')
    @classmethod
    def validate_edad(cls, v):
        if v is not None and (v < 15 or v > 100):
            raise ValueError('La edad debe estar entre 15 y 100 años')
        return v

    @field_validator('semestre')
    @classmethod
    def validate_semestre(cls, v):
        if v is not None and (v < 1 or v > 12):
            raise ValueError('El semestre debe estar entre 1 y 12')
        return v

    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if v is not None and len(v) < 6:
            raise ValueError('La contraseña debe tener al menos 6 caracteres')
        return v


# Esquema para respuesta de persona
class PersonaInDB(PersonaBase):
    id: int
    is_active: bool = True
    fecha_creacion: Optional[datetime] = None
    fecha_actualizacion: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# Esquema para respuesta de persona (sin datos sensibles)
class PersonaOut(PersonaInDB):
    programas: Optional[List[Dict[str, Any]]] = []
    grupos: Optional[List[Dict[str, Any]]] = []
    cohorte: Optional[Dict[str, Any]] = None  # Información de la cohorte

    @classmethod
    def from_orm_with_relations(cls, persona):
        """Crear PersonaOut desde un objeto ORM con relaciones"""
        try:
            # Obtener datos básicos de la persona
            data = {
                'id': persona.id,
                'tipo_persona': persona.tipo_persona,
                'sexo': persona.sexo,
                'genero': persona.genero,
                'edad': persona.edad,
                'estado_civil': persona.estado_civil,
                'religion': persona.religion,
                'trabaja': persona.trabaja,
                'lugar_trabajo': persona.lugar_trabajo,
                'lugar_origen': persona.lugar_origen,
                'colonia_residencia_actual': persona.colonia_residencia_actual,
                'celular': persona.celular,
                'correo_institucional': persona.correo_institucional,
                'discapacidad': persona.discapacidad,
                'observaciones': persona.observaciones,
                'matricula': persona.matricula,
                'semestre': persona.semestre,
                'numero_hijos': persona.numero_hijos,
                'grupo_etnico': persona.grupo_etnico,
                'rol': persona.rol,
                'is_active': persona.is_active,
                'fecha_creacion': persona.fecha_creacion,
                'fecha_actualizacion': persona.fecha_actualizacion,
                'cohorte_id': persona.cohorte_id
            }

            # Serializar programas de forma segura
            try:
                data['programas'] = [
                    {
                        'id': p.id,
                        'nombre_programa': p.nombre_programa,
                        'clave_programa': p.clave_programa
                    } for p in (persona.programas or [])
                ]
            except Exception:
                data['programas'] = []

            # Serializar grupos de forma segura
            try:
                data['grupos'] = [
                    {
                        'id': g.id,
                        'nombre_grupo': g.nombre_grupo,
                        'tipo_grupo': g.tipo_grupo,
                        'observaciones_grupo': g.observaciones_grupo
                    } for g in (persona.grupos or [])
                ]
            except Exception:
                data['grupos'] = []

            # Serializar cohorte de forma segura
            try:
                data['cohorte'] = {
                    'id': persona.cohorte.id,
                    'nombre': persona.cohorte.nombre,
                    'descripcion': persona.cohorte.descripcion,
                    'activo': persona.cohorte.activo
                } if persona.cohorte else None
            except Exception:
                data['cohorte'] = None

            return cls(**data)
        except Exception as e:
            # Si hay cualquier error, crear una versión mínima
            print(f"Error in from_orm_with_relations for persona {persona.id}: {e}")
            raise e


# Esquemas para operaciones por lotes
class PersonaBulkCreate(BaseModel):
    items: List[PersonaCreate]


class PersonaBulkUpdate(BaseModel):
    items: List[Dict[str, Any]]  # Lista de diccionarios con id y campos a actualizar


class PersonaBulkDelete(BaseModel):
    ids: List[int]
