from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from app.db.database import Base


class Atencion(Base):
    __tablename__ = "atencion"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    fecha_atencion = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    motivo_psicologico = Column(Boolean, default=False)
    motivo_academico = Column(Boolean, default=False)
    salud_en_general_vulnerable = Column(Boolean, default=False)
    requiere_seguimiento = Column(Boolean, default=False)
    requiere_canalizacion_externa = Column(Boolean, default=False)
    estatus_canalizacion_externa = Column(String, nullable=True)
    observaciones = Column(Text, nullable=True)
    fecha_proxima_sesion = Column(DateTime, nullable=True)
    atendido = Column(Boolean, default=False)
    ultima_fecha_contacto = Column(DateTime, nullable=True)

    # Relaciones
    id_personal = Column(Integer, ForeignKey("personal.id"), nullable=True)
    personal = relationship("Personal", back_populates="atenciones")

    id_persona = Column(Integer, ForeignKey("persona.id"), nullable=True)
    persona = relationship("Persona", back_populates="atenciones")

    id_grupo = Column(Integer, ForeignKey("grupo.id"), nullable=True)
    grupo = relationship("Grupo", back_populates="atenciones")

    id_cuestionario = Column(Integer, ForeignKey("cuestionario.id_cuestionario"), nullable=True)
    cuestionario = relationship("Cuestionario", back_populates="atenciones")
