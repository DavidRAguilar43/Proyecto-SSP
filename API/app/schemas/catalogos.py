from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, field_validator


# Esquema base genérico para catálogos
class CatalogoBase(BaseModel):
    titulo: str
    activo: bool = True

    @field_validator('titulo')
    @classmethod
    def validate_titulo(cls, v):
        if not v or not v.strip():
            raise ValueError('El título no puede estar vacío')
        return v.strip()


# Esquema para crear elementos de catálogo
class CatalogoCreate(CatalogoBase):
    pass


# Esquema para actualizar elementos de catálogo
class CatalogoUpdate(BaseModel):
    titulo: Optional[str] = None
    activo: Optional[bool] = None

    @field_validator('titulo')
    @classmethod
    def validate_titulo(cls, v):
        if v is not None and (not v or not v.strip()):
            raise ValueError('El título no puede estar vacío')
        return v.strip() if v else v


# Esquema para respuesta de catálogo
class CatalogoInDB(CatalogoBase):
    id: int
    fecha_creacion: datetime
    fecha_actualizacion: datetime

    model_config = ConfigDict(from_attributes=True)


# Alias para compatibilidad
CatalogoOut = CatalogoInDB


# Esquemas específicos para Religión
class ReligionBase(CatalogoBase):
    pass


class ReligionCreate(CatalogoCreate):
    pass


class ReligionUpdate(CatalogoUpdate):
    pass


class ReligionInDB(CatalogoInDB):
    pass


ReligionOut = ReligionInDB


# Esquemas específicos para Grupo Étnico
class GrupoEtnicoBase(CatalogoBase):
    pass


class GrupoEtnicoCreate(CatalogoCreate):
    pass


class GrupoEtnicoUpdate(CatalogoUpdate):
    pass


class GrupoEtnicoInDB(CatalogoInDB):
    pass


GrupoEtnicoOut = GrupoEtnicoInDB


# Esquemas específicos para Discapacidad
class DiscapacidadBase(CatalogoBase):
    pass


class DiscapacidadCreate(CatalogoCreate):
    pass


class DiscapacidadUpdate(CatalogoUpdate):
    pass


class DiscapacidadInDB(CatalogoInDB):
    pass


DiscapacidadOut = DiscapacidadInDB


# Esquemas para operaciones por lotes
class CatalogoBulkCreate(BaseModel):
    items: List[CatalogoCreate]


class CatalogoBulkUpdate(BaseModel):
    items: List[dict]  # Lista de diccionarios con id y campos a actualizar


class CatalogoBulkDelete(BaseModel):
    ids: List[int]


# Esquema para respuesta de elementos pendientes
class ElementosPendientes(BaseModel):
    religiones: List[ReligionOut]
    grupos_etnicos: List[GrupoEtnicoOut]
    discapacidades: List[DiscapacidadOut]
    total: int


# Esquema para crear elemento personalizado desde formulario
class ElementoPersonalizado(BaseModel):
    titulo: str
    tipo_catalogo: str  # 'religion', 'grupo_etnico', 'discapacidad'

    @field_validator('titulo')
    @classmethod
    def validate_titulo(cls, v):
        if not v or not v.strip():
            raise ValueError('El título no puede estar vacío')
        return v.strip()

    @field_validator('tipo_catalogo')
    @classmethod
    def validate_tipo_catalogo(cls, v):
        tipos_validos = ['religion', 'grupo_etnico', 'discapacidad']
        if v not in tipos_validos:
            raise ValueError(f'Tipo de catálogo debe ser uno de: {", ".join(tipos_validos)}')
        return v
