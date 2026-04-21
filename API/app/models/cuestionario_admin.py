from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, JSON, ForeignKey, Enum as SQLEnum, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum
from datetime import datetime
from zoneinfo import ZoneInfo

from app.db.database import Base
from app.models.encryption_mixin import EncryptedFieldsMixin

# Zona horaria de México
MEXICO_TZ = ZoneInfo("America/Mexico_City")


class TipoPregunta(str, Enum):
    """Tipos de preguntas soportadas en el sistema"""
    ABIERTA = "abierta"
    OPCION_MULTIPLE = "opcion_multiple"
    VERDADERO_FALSO = "verdadero_falso"
    SELECT = "select"
    CHECKBOX = "checkbox"
    RADIO_BUTTON = "radio_button"
    ESCALA_LIKERT = "escala_likert"


class EstadoCuestionario(str, Enum):
    """Estados posibles de un cuestionario"""
    ACTIVO = "activo"
    INACTIVO = "inactivo"
    BORRADOR = "borrador"


class TipoUsuario(str, Enum):
    """Tipos de usuario que pueden ser asignados a cuestionarios"""
    ALUMNO = "alumno"
    DOCENTE = "docente"
    PERSONAL = "personal"


class CuestionarioAdmin(Base):
    """Modelo para cuestionarios administrativos"""
    __tablename__ = "cuestionarios_admin"

    id = Column(String, primary_key=True, index=True)  # UUID como string
    titulo = Column(String(100), nullable=False, index=True)
    descripcion = Column(Text, nullable=False)
    fecha_creacion = Column(DateTime, server_default=func.now(), nullable=False)
    fecha_inicio = Column(DateTime, nullable=True)
    fecha_fin = Column(DateTime, nullable=True)
    estado = Column(SQLEnum(EstadoCuestionario), default=EstadoCuestionario.BORRADOR, nullable=False)
    creado_por = Column(Integer, ForeignKey("users.id"), nullable=False)
    instruccion_sistema = Column(Text, nullable=True)  # Instrucción para la IA al generar reportes
    modelo_ia = Column(String(100), nullable=True, default="openai/gpt-3.5-turbo")  # Modelo de IA a utilizar
    max_tokens = Column(Integer, nullable=True, default=4000)  # Número máximo de tokens para la respuesta de IA
    temperature = Column(Float, nullable=True, default=0.7)  # Temperatura de la IA (0.0-1.0)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relaciones
    creador = relationship("User", back_populates="cuestionarios_creados")
    preguntas = relationship("Pregunta", back_populates="cuestionario", cascade="all, delete-orphan", order_by="Pregunta.orden")
    asignaciones = relationship("AsignacionCuestionario", back_populates="cuestionario", cascade="all, delete-orphan")
    respuestas = relationship("RespuestaCuestionario", back_populates="cuestionario", cascade="all, delete-orphan")

    @property
    def total_preguntas(self) -> int:
        """Número total de preguntas en el cuestionario"""
        return len(self.preguntas) if self.preguntas else 0

    @property
    def total_respuestas(self) -> int:
        """Número total de respuestas recibidas"""
        return len([r for r in self.respuestas if r.estado == "completado"]) if self.respuestas else 0

    @property
    def tipos_usuario_asignados(self) -> list:
        """Lista de tipos de usuario asignados"""
        return [asig.tipo_usuario for asig in self.asignaciones] if self.asignaciones else []


class Pregunta(Base):
    """Modelo para preguntas individuales de cuestionarios"""
    __tablename__ = "preguntas"

    id = Column(String, primary_key=True, index=True)  # UUID como string
    cuestionario_id = Column(String, ForeignKey("cuestionarios_admin.id", ondelete="CASCADE"), nullable=False)
    tipo = Column(SQLEnum(TipoPregunta), nullable=False)
    texto = Column(Text, nullable=False)
    descripcion = Column(Text, nullable=True)
    obligatoria = Column(Boolean, default=False, nullable=False)
    orden = Column(Integer, nullable=False)
    configuracion = Column(JSON, default={}, nullable=False)  # Configuración específica por tipo
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relaciones
    cuestionario = relationship("CuestionarioAdmin", back_populates="preguntas")
    # IMPORTANTE: NO usar cascade="all, delete-orphan" para preservar respuestas de usuarios
    # Reason: Las respuestas deben sobrevivir cuando se elimina una pregunta (ondelete="SET NULL")
    respuestas = relationship("RespuestaPregunta", back_populates="pregunta")


class AsignacionCuestionario(Base):
    """Modelo para asignaciones de cuestionarios a tipos de usuario"""
    __tablename__ = "asignaciones_cuestionario"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    cuestionario_id = Column(String, ForeignKey("cuestionarios_admin.id", ondelete="CASCADE"), nullable=False)
    tipo_usuario = Column(SQLEnum(TipoUsuario), nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relaciones
    cuestionario = relationship("CuestionarioAdmin", back_populates="asignaciones")

    # Índice único para evitar duplicados
    __table_args__ = (
        {"sqlite_autoincrement": True},
    )


class CuestionarioSnapshot(Base):
    """
    Modelo para snapshots (copias congeladas) de cuestionarios.

    Cuando un usuario contesta un cuestionario, se crea un snapshot inmutable
    del cuestionario original. Esto garantiza que las respuestas del usuario
    siempre tengan el contexto completo del cuestionario, incluso si el
    cuestionario original se modifica o elimina posteriormente.

    Reason: Desacoplar completamente las respuestas del cuestionario original
    para evitar pérdida de contexto cuando se editan cuestionarios.
    """
    __tablename__ = "cuestionarios_snapshot"

    id = Column(String, primary_key=True, index=True)  # UUID como string
    cuestionario_original_id = Column(String, nullable=False, index=True)  # Referencia al cuestionario original (sin FK)
    titulo = Column(String(100), nullable=False)
    descripcion = Column(Text, nullable=False)
    instruccion_sistema = Column(Text, nullable=True)
    modelo_ia = Column(String(100), nullable=True)
    max_tokens = Column(Integer, nullable=True)
    temperature = Column(Float, nullable=True)
    fecha_snapshot = Column(DateTime, default=lambda: datetime.now(MEXICO_TZ), nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relaciones
    preguntas_snapshot = relationship("PreguntaSnapshot", back_populates="cuestionario_snapshot", cascade="all, delete-orphan", order_by="PreguntaSnapshot.orden")
    respuestas = relationship("RespuestaCuestionario", back_populates="cuestionario_snapshot")

    __table_args__ = (
        {"sqlite_autoincrement": True},
    )


class PreguntaSnapshot(Base):
    """
    Modelo para snapshots (copias congeladas) de preguntas.

    Cada pregunta del cuestionario original se copia aquí cuando se crea
    el snapshot del cuestionario.
    """
    __tablename__ = "preguntas_snapshot"

    id = Column(String, primary_key=True, index=True)  # UUID como string
    cuestionario_snapshot_id = Column(String, ForeignKey("cuestionarios_snapshot.id", ondelete="CASCADE"), nullable=False)
    pregunta_original_id = Column(String, nullable=False)  # Referencia a la pregunta original (sin FK)
    tipo = Column(String, nullable=False)  # Guardado como string en lugar de Enum
    texto = Column(Text, nullable=False)
    descripcion = Column(Text, nullable=True)
    obligatoria = Column(Boolean, default=False, nullable=False)
    orden = Column(Integer, nullable=False)
    configuracion = Column(JSON, default={}, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relaciones
    cuestionario_snapshot = relationship("CuestionarioSnapshot", back_populates="preguntas_snapshot")
    respuestas = relationship("RespuestaPregunta", back_populates="pregunta_snapshot")

    __table_args__ = (
        {"sqlite_autoincrement": True},
    )


class RespuestaCuestionario(Base):
    """
    Modelo para respuestas de usuarios a cuestionarios.

    IMPORTANTE: Ahora usa snapshot_id en lugar de cuestionario_id para
    garantizar que las respuestas siempre tengan el contexto completo
    del cuestionario, independientemente de cambios al cuestionario original.
    """
    __tablename__ = "respuestas_cuestionario"

    id = Column(String, primary_key=True, index=True)  # UUID como string
    cuestionario_id = Column(String, ForeignKey("cuestionarios_admin.id", ondelete="SET NULL"), nullable=True)  # Referencia al original (puede ser NULL)
    snapshot_id = Column(String, ForeignKey("cuestionarios_snapshot.id", ondelete="CASCADE"), nullable=True)  # Referencia al snapshot (nullable para respuestas antiguas)
    usuario_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    estado = Column(String, default="pendiente", nullable=False)  # pendiente, en_progreso, completado
    fecha_inicio = Column(DateTime, server_default=func.now(), nullable=False)
    fecha_completado = Column(DateTime, nullable=True)
    progreso = Column(Integer, default=0, nullable=False)  # Porcentaje de progreso (0-100)
    tiempo_total_minutos = Column(Integer, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relaciones
    cuestionario = relationship("CuestionarioAdmin", back_populates="respuestas")  # Relación opcional al original
    cuestionario_snapshot = relationship("CuestionarioSnapshot", back_populates="respuestas")  # Relación al snapshot
    usuario = relationship("User", back_populates="respuestas_cuestionarios")
    respuestas_preguntas = relationship("RespuestaPregunta", back_populates="respuesta_cuestionario", cascade="all, delete-orphan")
    reportes_ia = relationship("ReporteIA", back_populates="respuesta_cuestionario", cascade="all, delete-orphan")

    # Índice único para evitar respuestas duplicadas del mismo usuario al mismo cuestionario
    __table_args__ = (
        {"sqlite_autoincrement": True},
    )


class RespuestaPregunta(Base, EncryptedFieldsMixin):
    """
    Modelo para respuestas individuales a preguntas.

    IMPORTANTE: Ahora usa pregunta_snapshot_id para apuntar a la pregunta
    del snapshot, garantizando que la respuesta siempre tenga el contexto
    completo de la pregunta, independientemente de cambios al cuestionario original.
    """
    __tablename__ = "respuestas_pregunta"

    # Campos JSON a cifrar automáticamente
    __encrypted_json_fields__ = ["valor"]

    # Campos de texto a cifrar automáticamente
    __encrypted_fields__ = ["texto_otro"]

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    respuesta_cuestionario_id = Column(String, ForeignKey("respuestas_cuestionario.id", ondelete="CASCADE"), nullable=False)
    pregunta_id = Column(String, ForeignKey("preguntas.id", ondelete="SET NULL"), nullable=True)  # Referencia opcional a pregunta original
    pregunta_snapshot_id = Column(String, ForeignKey("preguntas_snapshot.id", ondelete="CASCADE"), nullable=True)  # Referencia al snapshot (nullable para respuestas antiguas)
    valor = Column(JSON, nullable=True)  # Valor de la respuesta (puede ser string, number, array, etc.)
    texto_otro = Column(Text, nullable=True)  # Para cuando se selecciona "Otro" en opciones
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relaciones
    respuesta_cuestionario = relationship("RespuestaCuestionario", back_populates="respuestas_preguntas")
    pregunta = relationship("Pregunta", back_populates="respuestas")  # Relación opcional al original
    pregunta_snapshot = relationship("PreguntaSnapshot", back_populates="respuestas")  # Relación al snapshot

    # Índice único para evitar respuestas duplicadas a la misma pregunta
    __table_args__ = (
        {"sqlite_autoincrement": True},
    )


class ReporteIA(Base, EncryptedFieldsMixin):
    """Modelo para almacenar reportes generados por IA"""
    __tablename__ = "reportes_ia"

    # Campos de texto a cifrar automáticamente
    __encrypted_fields__ = ["contenido"]

    id = Column(String, primary_key=True, index=True)  # UUID como string
    respuesta_cuestionario_id = Column(String, ForeignKey("respuestas_cuestionario.id", ondelete="CASCADE"), nullable=False)
    contenido = Column(Text, nullable=False)  # Contenido del reporte generado
    version = Column(Integer, default=1, nullable=False)  # Número de versión del reporte
    es_actual = Column(Boolean, default=True, nullable=False)  # Indica si es la versión actual
    fecha_generacion = Column(DateTime, default=lambda: datetime.now(MEXICO_TZ), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(MEXICO_TZ), nullable=False)

    # Relaciones
    respuesta_cuestionario = relationship("RespuestaCuestionario", back_populates="reportes_ia")

    # Índice para búsquedas rápidas
    __table_args__ = (
        {"sqlite_autoincrement": True},
    )
