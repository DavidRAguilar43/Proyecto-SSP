from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, field_validator


# Esquema base para Cohorte
class CohorteBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    fecha_inicio: Optional[datetime] = None
    fecha_fin: Optional[datetime] = None
    activo: bool = True

    @field_validator('nombre')
    @classmethod
    def validate_nombre_format(cls, v):
        """Valida que el nombre tenga el formato YYYY-P (ej: 2025-1, 2025-2)"""
        if v:
            parts = v.split('-')
            if len(parts) != 2:
                raise ValueError('El nombre debe tener el formato YYYY-P (ej: 2025-1)')

            try:
                year = int(parts[0])
                period = int(parts[1])

                if year < 2020 or year > 2030:
                    raise ValueError('El año debe estar entre 2020 y 2030')

                if period not in [1, 2]:
                    raise ValueError('El período debe ser 1 o 2')

            except ValueError as e:
                if "invalid literal" in str(e):
                    raise ValueError('El formato debe ser YYYY-P con números válidos')
                raise e

        return v


# Esquema para crear una cohorte
class CohorteCreate(CohorteBase):
    pass


# Esquema para actualizar una cohorte
class CohorteUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    fecha_inicio: Optional[datetime] = None
    fecha_fin: Optional[datetime] = None
    activo: Optional[bool] = None

    @field_validator('nombre')
    @classmethod
    def validate_nombre_format(cls, v):
        """Valida que el nombre tenga el formato YYYY-P (ej: 2025-1, 2025-2)"""
        if v:
            parts = v.split('-')
            if len(parts) != 2:
                raise ValueError('El nombre debe tener el formato YYYY-P (ej: 2025-1)')

            try:
                year = int(parts[0])
                period = int(parts[1])

                if year < 2020 or year > 2030:
                    raise ValueError('El año debe estar entre 2020 y 2030')

                if period not in [1, 2]:
                    raise ValueError('El período debe ser 1 o 2')

            except ValueError as e:
                if "invalid literal" in str(e):
                    raise ValueError('El formato debe ser YYYY-P con números válidos')
                raise e

        return v


# Esquema para respuesta de cohorte
class CohorteInDB(CohorteBase):
    id: int
    fecha_creacion: datetime

    model_config = ConfigDict(from_attributes=True)


# Alias para compatibilidad
CohorteOut = CohorteInDB


# Esquemas para operaciones por lotes
class CohorteBulkCreate(BaseModel):
    items: List[CohorteCreate]


class CohorteBulkUpdate(BaseModel):
    items: List[dict]  # Lista de diccionarios con id y campos a actualizar


class CohorteBulkDelete(BaseModel):
    ids: List[int]
