from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from app.db.database import Base


class Departamento(Base):
    """
    Modelo para Departamentos escolares.
    
    Representa los diferentes departamentos dentro de la institución educativa
    (ej: Departamento de Recursos Humanos, Departamento de Servicios Escolares, etc.)
    
    Attributes:
        id: Identificador único del departamento
        nombre: Nombre del departamento
        activo: Indica si el departamento está activo/habilitado
        fecha_creacion: Fecha de creación del registro
        fecha_actualizacion: Fecha de última actualización del registro
    """
    __tablename__ = "departamento"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String, unique=True, index=True, nullable=False)
    activo = Column(Boolean, default=True, nullable=False)
    fecha_creacion = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    fecha_actualizacion = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f"<Departamento(id={self.id}, nombre='{self.nombre}', activo={self.activo})>"

