from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict, field_validator


# Esquema base para Cuestionario
class CuestionarioBase(BaseModel):
    variables: Optional[Dict[str, Any]] = None
    tipo_cuestionario: str = "psicopedagogico"
    respuestas: Optional[Dict[str, Any]] = None
    id_persona: Optional[int] = None


# Esquema para crear un cuestionario
class CuestionarioCreate(CuestionarioBase):
    pass


# Esquema para actualizar un cuestionario
class CuestionarioUpdate(BaseModel):
    variables: Optional[Dict[str, Any]] = None
    respuestas: Optional[Dict[str, Any]] = None
    reporte_ia: Optional[str] = None
    fecha_completado: Optional[datetime] = None


# Esquema para respuesta de cuestionario
class CuestionarioInDB(CuestionarioBase):
    id_cuestionario: int
    reporte_ia: Optional[str] = None
    fecha_creacion: Optional[datetime] = None
    fecha_completado: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# Esquema para respuesta de cuestionario (sin datos sensibles)
class CuestionarioOut(CuestionarioInDB):
    pass


# Esquema específico para el cuestionario psicopedagógico
class CuestionarioPsicopedagogicoCreate(BaseModel):
    respuestas: Dict[str, Any]  # Las respuestas del estudiante
    id_persona: int


# Esquema para la respuesta del cuestionario psicopedagógico (solo para admin/personal)
class CuestionarioPsicopedagogicoOut(BaseModel):
    id_cuestionario: int
    respuestas: Dict[str, Any]
    reporte_ia: Optional[str] = None
    fecha_creacion: datetime
    fecha_completado: Optional[datetime] = None
    id_persona: int

    model_config = ConfigDict(from_attributes=True)


# Esquema para la respuesta del cuestionario psicopedagógico (para estudiantes - sin reporte)
class CuestionarioPsicopedagogicoEstudianteOut(BaseModel):
    id_cuestionario: int
    fecha_creacion: datetime
    fecha_completado: Optional[datetime] = None
    completado: bool = False

    model_config = ConfigDict(from_attributes=True)


# Esquema para operaciones por lotes
class CuestionarioBulkDelete(BaseModel):
    ids: List[int]


class CuestionarioBulkCreate(BaseModel):
    items: List[CuestionarioCreate]


class CuestionarioBulkUpdate(BaseModel):
    items: List[Dict[str, Any]]  # Lista de diccionarios con id y datos a actualizar
