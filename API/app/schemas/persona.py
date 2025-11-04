from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, EmailStr, field_validator, ConfigDict
from datetime import datetime
from enum import Enum


# Enums para validación

# SEGURIDAD: Enum para roles permitidos en auto-registro (SIN admin ni coordinador)
class RolRegistro(str, Enum):
    ALUMNO = "alumno"
    DOCENTE = "docente"
    PERSONAL = "personal"  # Para personal administrativo


class Sexo(str, Enum):
    NO_DECIR = "no_decir"  # Opción por defecto para privacidad
    MASCULINO = "masculino"
    FEMENINO = "femenino"
    OTRO = "otro"


class Genero(str, Enum):
    NO_DECIR = "no_decir"  # Opción por defecto para privacidad
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
    NO_DECIR = "no_decir"  # Opción para no especificar
    OTRO = "otro"


class Rol(str, Enum):
    ADMIN = "admin"
    COORDINADOR = "coordinador"  # Nuevo rol con privilegios de admin excepto eliminación
    PERSONAL = "personal"
    DOCENTE = "docente"
    ALUMNO = "alumno"


# Esquema base para Persona
class PersonaBase(BaseModel):
    # SEGURIDAD: Eliminamos tipo_persona, usamos solo rol
    sexo: Sexo
    genero: Genero
    edad: int
    estado_civil: EstadoCivil
    religion: Optional[str] = None
    trabaja: bool = False
    lugar_trabajo: Optional[str] = None
    lugar_origen: str
    colonia_residencia_actual: Optional[str] = None
    celular: str
    extension_telefonica: Optional[str] = None
    correo_institucional: EmailStr
    discapacidad: Optional[str] = None
    observaciones: Optional[str] = None
    matricula: str
    semestre: Optional[int] = None
    numero_hijos: int = 0
    grupo_etnico: Optional[str] = None
    rol: Rol = Rol.ALUMNO
    # Campos de cohorte simplificados
    cohorte_ano: Optional[int] = None  # Año de cohorte (ej: 2024, 2025)
    cohorte_periodo: Optional[int] = 1  # Período de cohorte (1 o 2, por defecto 1)

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

    @field_validator('matricula')
    @classmethod
    def validate_matricula(cls, v):
        if not v or v.strip() == '':
            raise ValueError('La matrícula es obligatoria')
        return v.strip()

    @field_validator('cohorte_ano')
    @classmethod
    def validate_cohorte_ano(cls, v):
        if v is not None:
            if not isinstance(v, int) or v < 1000 or v > 9999:
                raise ValueError('El año de cohorte debe ser un número de 4 dígitos')
        return v

    @field_validator('cohorte_periodo')
    @classmethod
    def validate_cohorte_periodo(cls, v):
        if v is not None:
            if not isinstance(v, int) or v not in [1, 2]:
                raise ValueError('El período de cohorte debe ser 1 o 2')
        return v


# SEGURIDAD: Esquema específico para auto-registro (sin admin)
class PersonaRegistro(BaseModel):
    """Schema para auto-registro de usuarios. NUNCA permite rol admin."""

    # SEGURIDAD: Solo roles permitidos para auto-registro
    rol: RolRegistro

    # Campos básicos obligatorios
    sexo: Sexo = Sexo.NO_DECIR
    genero: Genero = Genero.NO_DECIR
    edad: int
    estado_civil: EstadoCivil
    lugar_origen: str
    colonia_residencia_actual: str  # Obligatorio para registro
    celular: str
    correo_institucional: EmailStr
    matricula: str
    password: str

    # Campos opcionales
    extension_telefonica: Optional[str] = None
    religion: Optional[str] = None
    trabaja: bool = False
    lugar_trabajo: Optional[str] = None
    discapacidad: Optional[str] = None
    observaciones: Optional[str] = None
    numero_hijos: int = 0
    grupo_etnico: Optional[str] = None

    # Campos específicos para alumnos
    semestre: Optional[int] = None
    cohorte_ano: Optional[int] = None
    cohorte_periodo: Optional[int] = 1

    @field_validator('rol')
    @classmethod
    def validate_rol_registro(cls, v):
        """SEGURIDAD: Prevenir escalación de privilegios."""
        if v in ["admin", "coordinador"]:
            raise ValueError('No se puede auto-registrar como administrador o coordinador')
        return v

    @field_validator('correo_institucional')
    @classmethod
    def validate_correo_institucional(cls, v):
        """SEGURIDAD: Solo correos institucionales válidos."""
        dominios_validos = ['@uabc.edu.mx', '@uabc.mx', '@sistema.edu']
        if not any(str(v).endswith(dominio) for dominio in dominios_validos):
            raise ValueError('Debe usar un correo institucional válido')
        return v

    @field_validator('edad')
    @classmethod
    def validate_edad(cls, v):
        if v < 15 or v > 100:
            raise ValueError('La edad debe estar entre 15 y 100 años')
        return v

    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('La contraseña debe tener al menos 8 caracteres')
        return v

    @field_validator('matricula')
    @classmethod
    def validate_matricula(cls, v):
        if not v or v.strip() == '':
            raise ValueError('La matrícula es obligatoria')
        return v.strip()

    @field_validator('colonia_residencia_actual')
    @classmethod
    def validate_colonia(cls, v):
        if not v or v.strip() == '':
            raise ValueError('La colonia de residencia es obligatoria')
        return v.strip()

    @field_validator('semestre')
    @classmethod
    def validate_semestre(cls, v):
        if v is not None and (v < 1 or v > 12):
            raise ValueError('El semestre debe estar entre 1 y 12')
        return v


# Esquema para actualizar una persona
class PersonaUpdate(BaseModel):
    # SEGURIDAD: Eliminamos tipo_persona, usamos solo rol con validación
    rol: Optional[Rol] = None
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
    extension_telefonica: Optional[str] = None
    correo_institucional: Optional[EmailStr] = None
    discapacidad: Optional[str] = None
    observaciones: Optional[str] = None
    matricula: Optional[str] = None
    semestre: Optional[int] = None
    numero_hijos: Optional[int] = None
    grupo_etnico: Optional[str] = None
    rol: Optional[Rol] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None  # Campo para activar/desactivar usuarios
    # Campos de cohorte simplificados
    cohorte_ano: Optional[int] = None  # Año de cohorte (ej: 2024, 2025)
    cohorte_periodo: Optional[int] = 1  # Período de cohorte (1 o 2, por defecto 1)
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
    # Override matricula para que sea opcional en respuestas (compatibilidad con datos existentes)
    matricula: Optional[str] = None
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
                'matricula': persona.matricula or '',
                'semestre': persona.semestre,
                'numero_hijos': persona.numero_hijos,
                'grupo_etnico': persona.grupo_etnico,
                'rol': persona.rol,
                'is_active': persona.is_active,
                'fecha_creacion': persona.fecha_creacion,
                'fecha_actualizacion': persona.fecha_actualizacion,
                'cohorte_ano': persona.cohorte_ano,
                'cohorte_periodo': persona.cohorte_periodo
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
