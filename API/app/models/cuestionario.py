from sqlalchemy import Column, Integer, JSON, Text, DateTime, String, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.database import Base


class Cuestionario(Base):
    __tablename__ = "cuestionario"

    id_cuestionario = Column(Integer, primary_key=True, index=True, autoincrement=True)
    variables = Column(JSON, nullable=True)  # Almacena variables del cuestionario en formato JSON

    # Nuevos campos para el cuestionario psicopedagógico
    tipo_cuestionario = Column(String, default="psicopedagogico")  # Tipo de cuestionario
    respuestas = Column(JSON, nullable=True)  # Respuestas del estudiante
    reporte_ia = Column(Text, nullable=True)  # Reporte generado por IA
    fecha_creacion = Column(DateTime, server_default=func.now())
    fecha_completado = Column(DateTime, nullable=True)

    # Relación con el estudiante que completó el cuestionario
    id_persona = Column(Integer, ForeignKey("personas.id"), nullable=True)
    persona = relationship("Persona", back_populates="cuestionarios_completados")

    # Relaciones con citas
    citas = relationship("Cita", back_populates="cuestionario")
