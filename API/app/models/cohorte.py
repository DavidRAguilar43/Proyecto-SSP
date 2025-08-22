from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from app.db.database import Base


class Cohorte(Base):
    __tablename__ = "cohorte"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String, unique=True, index=True)  # Formato: YYYY-P (2025-1, 2025-2)
    descripcion = Column(String, nullable=True)  # Ej: "Primer semestre 2025"
    fecha_inicio = Column(DateTime, nullable=True)
    fecha_fin = Column(DateTime, nullable=True)
    activo = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relaciones
    personas = relationship("Persona", back_populates="cohorte")
    grupos = relationship("Grupo", back_populates="cohorte")
