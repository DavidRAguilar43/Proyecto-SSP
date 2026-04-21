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


# Esquemas específicos para Modelo IA
class ModeloIABase(BaseModel):
    titulo: str
    model_id: str
    proveedor: str
    descripcion: Optional[str] = None
    categoria: str = "standard"  # premium, standard, budget
    recomendado: bool = False
    activo: bool = True

    @field_validator('titulo', 'model_id', 'proveedor')
    @classmethod
    def validate_required_fields(cls, v):
        if not v or not v.strip():
            raise ValueError('Este campo no puede estar vacío')
        return v.strip()

    @field_validator('categoria')
    @classmethod
    def validate_categoria(cls, v):
        categorias_validas = ['premium', 'standard', 'budget']
        if v not in categorias_validas:
            raise ValueError(f'Categoría debe ser una de: {", ".join(categorias_validas)}')
        return v


class ModeloIACreate(ModeloIABase):
    pass


class ModeloIAUpdate(BaseModel):
    titulo: Optional[str] = None
    model_id: Optional[str] = None
    proveedor: Optional[str] = None
    descripcion: Optional[str] = None
    categoria: Optional[str] = None
    recomendado: Optional[bool] = None
    activo: Optional[bool] = None

    @field_validator('titulo', 'model_id', 'proveedor')
    @classmethod
    def validate_fields(cls, v):
        if v is not None and (not v or not v.strip()):
            raise ValueError('Este campo no puede estar vacío')
        return v.strip() if v else v

    @field_validator('categoria')
    @classmethod
    def validate_categoria(cls, v):
        if v is not None:
            categorias_validas = ['premium', 'standard', 'budget']
            if v not in categorias_validas:
                raise ValueError(f'Categoría debe ser una de: {", ".join(categorias_validas)}')
        return v


class ModeloIAInDB(ModeloIABase):
    id: int
    fecha_creacion: datetime
    fecha_actualizacion: datetime

    model_config = ConfigDict(from_attributes=True)


ModeloIAOut = ModeloIAInDB


# Esquemas para operaciones por lotes
class CatalogoBulkCreate(BaseModel):
    items: List[CatalogoCreate]


class CatalogoBulkUpdate(BaseModel):
    items: List[dict]  # Lista de diccionarios con id y campos a actualizar


class CatalogoBulkDelete(BaseModel):
    ids: List[int]


# Esquemas específicos de bulk delete para cada catálogo
class ReligionBulkDelete(BaseModel):
    ids: List[int]


class GrupoEtnicoBulkDelete(BaseModel):
    ids: List[int]


class DiscapacidadBulkDelete(BaseModel):
    ids: List[int]


class ModeloIABulkDelete(BaseModel):
    ids: List[int]


# Esquema para respuesta de elementos pendientes
class ElementosPendientes(BaseModel):
    religiones: List[ReligionOut]
    grupos_etnicos: List[GrupoEtnicoOut]
    discapacidades: List[DiscapacidadOut]
    modelos_ia: List[ModeloIAOut]
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
        tipos_validos = ['religion', 'grupo_etnico', 'discapacidad', 'modelo_ia']
        if v not in tipos_validos:
            raise ValueError(f'Tipo de catálogo debe ser uno de: {", ".join(tipos_validos)}')
        return v
