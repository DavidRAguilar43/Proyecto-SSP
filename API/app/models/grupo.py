from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from app.db.database import Base


class Grupo(Base):
    __tablename__ = "grupo"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre_grupo = Column(String, index=True)
    tipo_grupo = Column(String, index=True)
    observaciones_grupo = Column(Text, nullable=True)
    cohorte = Column(String, nullable=True)
    fecha_creacion_registro = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relaciones
    personas = relationship("Persona", secondary="persona_grupo", back_populates="grupos")
    atenciones = relationship("Atencion", back_populates="grupo")
