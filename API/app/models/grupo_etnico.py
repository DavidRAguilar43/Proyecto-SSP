from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from app.db.database import Base


class GrupoEtnico(Base):
    __tablename__ = "grupo_etnico"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    titulo = Column(String, unique=True, index=True, nullable=False)
    activo = Column(Boolean, default=True, nullable=False)
    fecha_creacion = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    fecha_actualizacion = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f"<GrupoEtnico(id={self.id}, titulo='{self.titulo}', activo={self.activo})>"
