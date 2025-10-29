from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict
from datetime import datetime


# Esquema base para Departamento
class DepartamentoBase(BaseModel):
    """
    Esquema base para Departamento.
    
    Args:
        nombre: Nombre del departamento
        activo: Indica si el departamento está activo (por defecto True)
    """
    nombre: str
    activo: bool = True


# Esquema para crear un departamento
class DepartamentoCreate(DepartamentoBase):
    """
    Esquema para crear un nuevo departamento.
    
    Hereda todos los campos de DepartamentoBase.
    """
    pass


# Esquema para actualizar un departamento
class DepartamentoUpdate(BaseModel):
    """
    Esquema para actualizar un departamento existente.
    
    Todos los campos son opcionales para permitir actualizaciones parciales.
    
    Args:
        nombre: Nuevo nombre del departamento (opcional)
        activo: Nuevo estado activo/inactivo (opcional)
    """
    nombre: Optional[str] = None
    activo: Optional[bool] = None


# Esquema para respuesta de departamento
class DepartamentoInDB(DepartamentoBase):
    """
    Esquema para departamento almacenado en la base de datos.
    
    Incluye campos adicionales generados por la base de datos.
    
    Args:
        id: Identificador único del departamento
        fecha_creacion: Fecha de creación del registro
        fecha_actualizacion: Fecha de última actualización
    """
    id: int
    fecha_creacion: datetime
    fecha_actualizacion: datetime

    model_config = ConfigDict(from_attributes=True)


# Esquema para respuesta de departamento (sin datos sensibles)
class DepartamentoOut(DepartamentoInDB):
    """
    Esquema para respuesta pública de departamento.
    
    Hereda de DepartamentoInDB sin modificaciones.
    """
    pass


# Esquema para operaciones por lotes
class DepartamentoBulkDelete(BaseModel):
    """
    Esquema para eliminación masiva de departamentos.
    
    Args:
        ids: Lista de IDs de departamentos a eliminar
    """
    ids: List[int]


class DepartamentoBulkCreate(BaseModel):
    """
    Esquema para creación masiva de departamentos.
    
    Args:
        items: Lista de departamentos a crear
    """
    items: List[DepartamentoCreate]


class DepartamentoBulkUpdate(BaseModel):
    """
    Esquema para actualización masiva de departamentos.
    
    Args:
        items: Lista de diccionarios con id y campos a actualizar
    """
    items: List[Dict[str, Any]]

