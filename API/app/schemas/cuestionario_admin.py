from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, field_validator
from enum import Enum

from app.models.cuestionario_admin import TipoPregunta, EstadoCuestionario, TipoUsuario


# Esquemas base para Pregunta
class PreguntaBase(BaseModel):
    tipo: TipoPregunta
    texto: str = Field(..., max_length=500, description="Texto de la pregunta")
    descripcion: Optional[str] = Field(None, description="Descripción opcional de la pregunta")
    obligatoria: bool = Field(False, description="Si la pregunta es obligatoria")
    orden: int = Field(..., ge=1, description="Orden de la pregunta en el cuestionario")
    configuracion: Dict[str, Any] = Field(default_factory=dict, description="Configuración específica por tipo de pregunta")

    @field_validator('texto')
    @classmethod
    def validar_texto(cls, v):
        if not v or not v.strip():
            raise ValueError('El texto de la pregunta es obligatorio')
        return v.strip()

    @field_validator('configuracion')
    @classmethod
    def validar_configuracion(cls, v, info):
        """Validar configuración según el tipo de pregunta"""
        if not info.data:
            return v
        
        tipo = info.data.get('tipo')
        if not tipo:
            return v

        # Validaciones específicas por tipo
        if tipo in ['opcion_multiple', 'select', 'checkbox', 'radio_button']:
            opciones = v.get('opciones', [])
            if not opciones or len(opciones) < 2:
                raise ValueError(f'Las preguntas de tipo {tipo} deben tener al menos 2 opciones')
            
            # Verificar que no haya opciones vacías
            if any(not str(op).strip() for op in opciones):
                raise ValueError('Las opciones no pueden estar vacías')
                
        elif tipo == 'escala_likert':
            puntos = v.get('puntos_escala', 5)
            if puntos < 3 or puntos > 10:
                raise ValueError('La escala Likert debe tener entre 3 y 10 puntos')
                
        elif tipo == 'abierta':
            limite = v.get('limite_caracteres')
            if limite is not None and limite < 1:
                raise ValueError('El límite de caracteres debe ser mayor a 0')
                
        return v


class PreguntaCreate(PreguntaBase):
    """Esquema para crear una pregunta"""
    pass


class PreguntaUpdate(BaseModel):
    """Esquema para actualizar una pregunta"""
    tipo: Optional[TipoPregunta] = None
    texto: Optional[str] = Field(None, max_length=500)
    descripcion: Optional[str] = None
    obligatoria: Optional[bool] = None
    orden: Optional[int] = Field(None, ge=1)
    configuracion: Optional[Dict[str, Any]] = None


class PreguntaOut(PreguntaBase):
    """Esquema de salida para pregunta"""
    id: str
    cuestionario_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Esquemas base para CuestionarioAdmin
class CuestionarioAdminBase(BaseModel):
    titulo: str = Field(..., max_length=100, description="Título del cuestionario")
    descripcion: str = Field(..., max_length=500, description="Descripción del cuestionario")
    fecha_inicio: Optional[datetime] = Field(None, description="Fecha de inicio de disponibilidad")
    fecha_fin: Optional[datetime] = Field(None, description="Fecha de fin de disponibilidad")
    estado: EstadoCuestionario = Field(EstadoCuestionario.BORRADOR, description="Estado del cuestionario")

    @field_validator('titulo')
    @classmethod
    def validar_titulo(cls, v):
        if not v or not v.strip():
            raise ValueError('El título es obligatorio')
        return v.strip()

    @field_validator('descripcion')
    @classmethod
    def validar_descripcion(cls, v):
        if not v or not v.strip():
            raise ValueError('La descripción es obligatoria')
        return v.strip()

    @field_validator('fecha_fin')
    @classmethod
    def validar_fechas(cls, v, info):
        """Validar que fecha_fin sea posterior a fecha_inicio"""
        if v and info.data and info.data.get('fecha_inicio'):
            if v <= info.data['fecha_inicio']:
                raise ValueError('La fecha de fin debe ser posterior a la fecha de inicio')
        return v


class CuestionarioAdminCreate(CuestionarioAdminBase):
    """Esquema para crear un cuestionario administrativo"""
    preguntas: List[PreguntaCreate] = Field(default_factory=list, description="Lista de preguntas del cuestionario")
    tipos_usuario_asignados: List[TipoUsuario] = Field(default_factory=list, description="Tipos de usuario asignados")

    @field_validator('preguntas')
    @classmethod
    def validar_preguntas(cls, v):
        if not v:
            raise ValueError('Debe agregar al menos una pregunta')
        if len(v) > 50:
            raise ValueError('No puede exceder 50 preguntas por cuestionario')
        
        # Validar órdenes únicos
        ordenes = [p.orden for p in v]
        if len(ordenes) != len(set(ordenes)):
            raise ValueError('Los órdenes de las preguntas deben ser únicos')
            
        return v

    @field_validator('tipos_usuario_asignados')
    @classmethod
    def validar_tipos_usuario(cls, v):
        if not v:
            raise ValueError('Debe asignar el cuestionario a al menos un tipo de usuario')
        return v


class CuestionarioAdminUpdate(BaseModel):
    """Esquema para actualizar un cuestionario administrativo"""
    titulo: Optional[str] = Field(None, max_length=100)
    descripcion: Optional[str] = Field(None, max_length=500)
    fecha_inicio: Optional[datetime] = None
    fecha_fin: Optional[datetime] = None
    estado: Optional[EstadoCuestionario] = None
    preguntas: Optional[List[PreguntaUpdate]] = None
    tipos_usuario_asignados: Optional[List[TipoUsuario]] = None


class CuestionarioAdminOut(CuestionarioAdminBase):
    """Esquema de salida para cuestionario administrativo"""
    id: str
    fecha_creacion: datetime
    creado_por: int
    creado_por_nombre: Optional[str] = None
    total_preguntas: int
    total_respuestas: int = 0
    preguntas: List[PreguntaOut] = Field(default_factory=list)
    tipos_usuario_asignados: List[TipoUsuario] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Esquemas para respuestas
class RespuestaPreguntaBase(BaseModel):
    pregunta_id: str
    valor: Optional[Union[str, int, float, List[str], bool]] = None
    texto_otro: Optional[str] = None


class RespuestaPreguntaCreate(RespuestaPreguntaBase):
    pass


class RespuestaPreguntaOut(RespuestaPreguntaBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RespuestaCuestionarioBase(BaseModel):
    estado: str = Field("pendiente", description="Estado de la respuesta")
    progreso: int = Field(0, ge=0, le=100, description="Progreso en porcentaje")


class RespuestaCuestionarioCreate(RespuestaCuestionarioBase):
    respuestas: List[RespuestaPreguntaCreate] = Field(default_factory=list)


class RespuestaCuestionarioUpdate(BaseModel):
    estado: Optional[str] = None
    progreso: Optional[int] = Field(None, ge=0, le=100)
    respuestas: Optional[List[RespuestaPreguntaCreate]] = None
    fecha_completado: Optional[datetime] = None
    tiempo_total_minutos: Optional[int] = None


class RespuestaCuestionarioOut(RespuestaCuestionarioBase):
    id: str
    cuestionario_id: str
    usuario_id: int
    fecha_inicio: datetime
    fecha_completado: Optional[datetime] = None
    tiempo_total_minutos: Optional[int] = None
    respuestas_preguntas: List[RespuestaPreguntaOut] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Esquemas para asignaciones
class AsignacionCuestionarioBase(BaseModel):
    tipo_usuario: TipoUsuario


class AsignacionCuestionarioCreate(AsignacionCuestionarioBase):
    cuestionario_id: str


class AsignacionCuestionarioOut(AsignacionCuestionarioBase):
    id: int
    cuestionario_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Esquemas para filtros y búsquedas
class FiltrosCuestionarios(BaseModel):
    titulo: Optional[str] = None
    estado: Optional[EstadoCuestionario] = None
    tipo_usuario: Optional[TipoUsuario] = None
    fecha_creacion_desde: Optional[datetime] = None
    fecha_creacion_hasta: Optional[datetime] = None
    creado_por: Optional[int] = None
    skip: int = Field(0, ge=0)
    limit: int = Field(10, ge=1, le=100)


class CuestionariosPaginados(BaseModel):
    cuestionarios: List[CuestionarioAdminOut]
    total: int
    skip: int
    limit: int
    has_next: bool
    has_prev: bool


# Esquemas para operaciones en lote
class CuestionarioBulkDelete(BaseModel):
    ids: List[str] = Field(..., min_length=1, description="Lista de IDs de cuestionarios a eliminar")


class CuestionarioDuplicate(BaseModel):
    nuevo_titulo: str = Field(..., max_length=100, description="Título para el cuestionario duplicado")
