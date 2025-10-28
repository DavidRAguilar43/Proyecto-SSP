from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.database import Base

class EstadoCita(str, enum.Enum):
    """
    Estados posibles de una cita.

    - PENDIENTE: Cita solicitada, esperando confirmación
    - CONFIRMADA: Cita confirmada con fecha y hora
    - CANCELADA: Cita cancelada
    - COMPLETADA: Cita realizada/completada
    """
    PENDIENTE = "pendiente"
    CONFIRMADA = "confirmada"
    CANCELADA = "cancelada"
    COMPLETADA = "completada"

class TipoCita(str, enum.Enum):
    """
    Tipos de cita disponibles.
    """
    PSICOLOGICA = "psicologica"
    ACADEMICA = "academica"
    GENERAL = "general"

class Cita(Base):
    """
    Modelo unificado de Citas.

    Combina la funcionalidad de solicitud de citas y registro de atenciones.
    Una cita puede pasar por varios estados: pendiente -> confirmada -> completada.
    Cuando está completada, se pueden registrar los detalles de la atención realizada.
    """
    __tablename__ = "citas"

    id_cita = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Relaciones con personas
    id_alumno = Column(Integer, ForeignKey("personas.id"), nullable=False)
    id_personal = Column(Integer, ForeignKey("personas.id"), nullable=True)

    # Información básica de la cita
    tipo_cita = Column(Enum(TipoCita), nullable=False, default=TipoCita.GENERAL)
    motivo = Column(Text, nullable=False)
    estado = Column(Enum(EstadoCita), nullable=False, default=EstadoCita.PENDIENTE)

    # Fechas del ciclo de vida de la cita
    fecha_solicitud = Column(DateTime(timezone=True), server_default=func.now())
    fecha_propuesta_alumno = Column(DateTime(timezone=True), nullable=True)
    fecha_confirmada = Column(DateTime(timezone=True), nullable=True)
    fecha_completada = Column(DateTime(timezone=True), nullable=True)

    # Observaciones durante el proceso
    observaciones_alumno = Column(Text, nullable=True)
    observaciones_personal = Column(Text, nullable=True)
    ubicacion = Column(String(200), nullable=True)

    # --- Campos de atención (cuando la cita está completada) ---

    # Motivos específicos de la atención
    motivo_psicologico = Column(Boolean, default=False)
    motivo_academico = Column(Boolean, default=False)
    salud_en_general_vulnerable = Column(Boolean, default=False)

    # Seguimiento y canalización
    requiere_seguimiento = Column(Boolean, default=False)
    requiere_canalizacion_externa = Column(Boolean, default=False)
    estatus_canalizacion_externa = Column(String(200), nullable=True)

    # Fechas de seguimiento
    fecha_proxima_sesion = Column(DateTime(timezone=True), nullable=True)
    ultima_fecha_contacto = Column(DateTime(timezone=True), nullable=True)

    # Relaciones adicionales (de atenciones)
    id_grupo = Column(Integer, ForeignKey("grupo.id"), nullable=True)
    id_cuestionario = Column(Integer, ForeignKey("cuestionario.id_cuestionario"), nullable=True)

    # Metadatos
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    fecha_actualizacion = Column(DateTime(timezone=True), onupdate=func.now())

    # Relaciones
    alumno = relationship("Persona", foreign_keys=[id_alumno], back_populates="citas_como_alumno")
    personal_asignado = relationship("Persona", foreign_keys=[id_personal], back_populates="citas_como_personal")
    grupo = relationship("Grupo", back_populates="citas")
    cuestionario = relationship("Cuestionario", back_populates="citas")

    def __repr__(self):
        return f"<Cita(id={self.id_cita}, alumno_id={self.id_alumno}, estado={self.estado}, tipo={self.tipo_cita})>"
