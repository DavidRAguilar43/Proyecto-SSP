from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.database import Base
from app.models.associations import persona_grupo

class Grupo(Base):
    __tablename__ = "grupo"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre_grupo = Column(String, index=True)
    tipo_grupo = Column(String, index=True)
    observaciones_grupo = Column(Text, nullable=True)
    fecha_creacion_registro = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    cohorte_id = Column(Integer, ForeignKey("cohorte.id"), nullable=True)

    # Relaciones
    personas = relationship("Persona", secondary=persona_grupo, back_populates="grupos")
    atenciones = relationship("Atencion", back_populates="grupo")
    cohorte = relationship("Cohorte", back_populates="grupos")
