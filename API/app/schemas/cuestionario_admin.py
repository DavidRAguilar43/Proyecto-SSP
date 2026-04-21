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
    id: Optional[str] = None  # ID opcional para actualización


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
    instruccion_sistema: Optional[str] = Field(None, description="Instrucción personalizada para la IA al generar reportes")
    max_tokens: Optional[int] = Field(4000, ge=100, le=10000, description="Número máximo de tokens para la respuesta de IA")
    temperature: Optional[float] = Field(0.7, ge=0.0, le=1.0, description="Temperatura de la IA (0.0=preciso, 1.0=creativo)")
    modelo_ia: Optional[str] = Field("openai/gpt-3.5-turbo", max_length=100, description="Modelo de IA a utilizar para generar reportes")

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
    instruccion_sistema: Optional[str] = None
    modelo_ia: Optional[str] = Field(None, max_length=100)
    max_tokens: Optional[int] = Field(None, ge=100, le=10000)
    temperature: Optional[float] = Field(None, ge=0.0, le=1.0)
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
    pregunta_snapshot_id: Optional[str] = None  # Referencia al snapshot de la pregunta (opcional para respuestas antiguas)
    pregunta: Optional["PreguntaOut"] = None  # Referencia opcional a la pregunta original
    pregunta_snapshot: Optional["PreguntaSnapshotOut"] = None  # Referencia al snapshot
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


class ReporteIABase(BaseModel):
    """Esquema base para reportes generados por IA"""
    contenido: str = Field(..., description="Contenido del reporte generado")


class ReporteIAOut(ReporteIABase):
    """Esquema de salida para reporte IA"""
    id: str
    respuesta_cuestionario_id: str
    version: int
    es_actual: bool
    fecha_generacion: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RespuestaCuestionarioOut(RespuestaCuestionarioBase):
    id: str
    cuestionario_id: Optional[str] = None  # Ahora es opcional
    snapshot_id: Optional[str] = None  # Referencia al snapshot (opcional para respuestas antiguas)
    usuario_id: int
    cuestionario: Optional["CuestionarioAdminOut"] = None  # Referencia opcional al original
    cuestionario_snapshot: Optional["CuestionarioSnapshotOut"] = None  # Referencia al snapshot
    fecha_inicio: datetime
    fecha_completado: Optional[datetime] = None
    tiempo_total_minutos: Optional[int] = None
    respuestas_preguntas: List[RespuestaPreguntaOut] = Field(default_factory=list)
    reportes_ia: List[ReporteIAOut] = Field(default_factory=list)
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


class RespuestaBulkCancel(BaseModel):
    """Esquema para cancelar múltiples respuestas de cuestionarios"""
    ids: List[str] = Field(..., min_length=1, description="Lista de IDs de respuestas a cancelar")


class CuestionarioDuplicate(BaseModel):
    nuevo_titulo: str = Field(..., max_length=100, description="Título para el cuestionario duplicado")


class CuestionarioEstadoUpdate(BaseModel):
    """Esquema para cambiar el estado de un cuestionario"""
    estado: EstadoCuestionario = Field(..., description="Nuevo estado del cuestionario")


class PreguntaRespuestaReporte(BaseModel):
    """Información de una pregunta y su respuesta para generar reportes"""
    pregunta_id: Optional[str] = None
    pregunta: str
    respuesta: Optional[Union[str, int, float, bool, List[str]]] = None
    texto_otro: Optional[str] = None
    tipo: Optional[str] = None
    orden: Optional[int] = None


class PersonaInfoReporte(BaseModel):
    """Información adicional de la persona que responde el cuestionario

    PROTECCIÓN DE DATOS PERSONALES:
    - Se permiten: edad, género, semestre (datos demográficos útiles)
    - NO se permiten: nombres, apellidos, correos, teléfonos, direcciones
    - Matrícula/número de empleado: comentados temporalmente para pruebas
    """
    # COMENTADO TEMPORALMENTE PARA PRUEBAS
    # matricula: Optional[str] = Field(None, description="Matrícula del estudiante")
    # numero_empleado: Optional[str] = Field(None, description="Número de empleado")

    # Datos demográficos útiles para análisis psicopedagógico
    edad: Optional[int] = Field(None, description="Edad del estudiante")
    genero: Optional[str] = Field(None, description="Género del estudiante")
    semestre: Optional[int] = Field(None, description="Semestre actual del estudiante")


class GenerarReporteRequest(BaseModel):
    """Esquema para solicitar la generación de un reporte"""
    preguntas_respuestas: List[PreguntaRespuestaReporte] = Field(default_factory=list)
    instruccion_sistema: Optional[str] = None
    modelo_ia: Optional[str] = None
    max_tokens: Optional[int] = Field(None, ge=100, le=10000)
    temperature: Optional[float] = Field(None, ge=0.0, le=1.0)
    persona_info: Optional[PersonaInfoReporte] = None


class RegenerarReporteRequest(GenerarReporteRequest):
    """Esquema para solicitar la regeneración de un reporte"""
    pass


class ReporteResponse(BaseModel):
    """Esquema de respuesta para operaciones de reporte"""
    id: str
    respuesta_cuestionario_id: str
    version: int
    es_actual: bool
    contenido: str
    fecha_generacion: datetime
    mensaje: str = "Reporte generado exitosamente"

    model_config = ConfigDict(from_attributes=True)


# Esquemas para Snapshots
class PreguntaSnapshotOut(BaseModel):
    """Esquema de salida para pregunta snapshot"""
    id: str
    cuestionario_snapshot_id: str
    pregunta_original_id: str
    tipo: str
    texto: str
    descripcion: Optional[str] = None
    obligatoria: bool
    orden: int
    configuracion: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CuestionarioSnapshotOut(BaseModel):
    """Esquema de salida para cuestionario snapshot"""
    id: str
    cuestionario_original_id: str
    titulo: str
    descripcion: str
    instruccion_sistema: Optional[str] = None
    modelo_ia: Optional[str] = None
    max_tokens: Optional[int] = None
    temperature: Optional[float] = None
    fecha_snapshot: datetime
    created_at: datetime
    preguntas_snapshot: List[PreguntaSnapshotOut] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
