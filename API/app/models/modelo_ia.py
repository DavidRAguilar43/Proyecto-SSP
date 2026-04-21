from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from app.db.database import Base


class ModeloIA(Base):
    """
    Modelo para catálogo de modelos de IA disponibles para generación de reportes.
    
    Attributes:
        id: Identificador único
        titulo: Nombre del modelo (ej: "GPT-4 Turbo", "Claude 3.5 Sonnet")
        model_id: ID técnico del modelo para la API (ej: "openai/gpt-4-turbo")
        proveedor: Proveedor del modelo (ej: "OpenAI", "Anthropic", "Meta")
        descripcion: Descripción del modelo y sus características
        categoria: Categoría del modelo (premium, standard, budget)
        recomendado: Si es recomendado para reportes psicopedagógicos
        activo: Si está activo y disponible para uso
        fecha_creacion: Fecha de creación del registro
        fecha_actualizacion: Fecha de última actualización
    """
    __tablename__ = "modelo_ia"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    titulo = Column(String, unique=True, index=True, nullable=False)  # Nombre amigable
    model_id = Column(String, unique=True, index=True, nullable=False)  # ID técnico para API
    proveedor = Column(String, nullable=False)  # OpenAI, Anthropic, Meta, etc.
    descripcion = Column(Text, nullable=True)  # Descripción del modelo
    categoria = Column(String, nullable=False, default="standard")  # premium, standard, budget
    recomendado = Column(Boolean, default=False, nullable=False)  # Si es recomendado
    activo = Column(Boolean, default=True, nullable=False)
    fecha_creacion = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    fecha_actualizacion = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f"<ModeloIA(id={self.id}, titulo='{self.titulo}', model_id='{self.model_id}', proveedor='{self.proveedor}', activo={self.activo})>"

