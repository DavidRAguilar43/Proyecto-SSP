from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base

class EstadoCita(str, enum.Enum):
    PENDIENTE = "pendiente"
    CONFIRMADA = "confirmada"
    CANCELADA = "cancelada"
    COMPLETADA = "completada"

class TipoCita(str, enum.Enum):
    PSICOLOGICA = "psicologica"
    ACADEMICA = "academica"
    GENERAL = "general"

class Cita(Base):
    __tablename__ = "citas"

    id_cita = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Relaciones
    id_alumno = Column(Integer, ForeignKey("personas.id"), nullable=False)
    id_personal = Column(Integer, ForeignKey("personas.id"), nullable=True)  # Se asigna después
    
    # Información de la cita
    tipo_cita = Column(Enum(TipoCita), nullable=False, default=TipoCita.GENERAL)
    motivo = Column(Text, nullable=False)
    estado = Column(Enum(EstadoCita), nullable=False, default=EstadoCita.PENDIENTE)
    
    # Fechas
    fecha_solicitud = Column(DateTime(timezone=True), server_default=func.now())
    fecha_propuesta_alumno = Column(DateTime(timezone=True), nullable=True)  # Fecha preferida por el alumno
    fecha_confirmada = Column(DateTime(timezone=True), nullable=True)  # Fecha final confirmada
    fecha_completada = Column(DateTime(timezone=True), nullable=True)
    
    # Información adicional
    observaciones_alumno = Column(Text, nullable=True)
    observaciones_personal = Column(Text, nullable=True)
    ubicacion = Column(String(200), nullable=True)
    
    # Metadatos
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    fecha_actualizacion = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relaciones
    alumno = relationship("Persona", foreign_keys=[id_alumno], back_populates="citas_como_alumno")
    personal = relationship("Persona", foreign_keys=[id_personal], back_populates="citas_como_personal")
    
    def __repr__(self):
        return f"<Cita(id={self.id_cita}, alumno_id={self.id_alumno}, estado={self.estado})>"
