from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, JSON, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum

from app.db.database import Base


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
    creado_por = Column(Integer, ForeignKey("personas.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relaciones
    creador = relationship("Persona", back_populates="cuestionarios_creados")
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
    respuestas = relationship("RespuestaPregunta", back_populates="pregunta", cascade="all, delete-orphan")


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


class RespuestaCuestionario(Base):
    """Modelo para respuestas de usuarios a cuestionarios"""
    __tablename__ = "respuestas_cuestionario"

    id = Column(String, primary_key=True, index=True)  # UUID como string
    cuestionario_id = Column(String, ForeignKey("cuestionarios_admin.id", ondelete="CASCADE"), nullable=False)
    usuario_id = Column(Integer, ForeignKey("personas.id", ondelete="CASCADE"), nullable=False)
    estado = Column(String, default="pendiente", nullable=False)  # pendiente, en_progreso, completado
    fecha_inicio = Column(DateTime, server_default=func.now(), nullable=False)
    fecha_completado = Column(DateTime, nullable=True)
    progreso = Column(Integer, default=0, nullable=False)  # Porcentaje de progreso (0-100)
    tiempo_total_minutos = Column(Integer, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relaciones
    cuestionario = relationship("CuestionarioAdmin", back_populates="respuestas")
    usuario = relationship("Persona", back_populates="respuestas_cuestionarios")
    respuestas_preguntas = relationship("RespuestaPregunta", back_populates="respuesta_cuestionario", cascade="all, delete-orphan")

    # Índice único para evitar respuestas duplicadas del mismo usuario al mismo cuestionario
    __table_args__ = (
        {"sqlite_autoincrement": True},
    )


class RespuestaPregunta(Base):
    """Modelo para respuestas individuales a preguntas"""
    __tablename__ = "respuestas_pregunta"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    respuesta_cuestionario_id = Column(String, ForeignKey("respuestas_cuestionario.id", ondelete="CASCADE"), nullable=False)
    pregunta_id = Column(String, ForeignKey("preguntas.id", ondelete="CASCADE"), nullable=False)
    valor = Column(JSON, nullable=True)  # Valor de la respuesta (puede ser string, number, array, etc.)
    texto_otro = Column(Text, nullable=True)  # Para cuando se selecciona "Otro" en opciones
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relaciones
    respuesta_cuestionario = relationship("RespuestaCuestionario", back_populates="respuestas_preguntas")
    pregunta = relationship("Pregunta", back_populates="respuestas")

    # Índice único para evitar respuestas duplicadas a la misma pregunta
    __table_args__ = (
        {"sqlite_autoincrement": True},
    )
