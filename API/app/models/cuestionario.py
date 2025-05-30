from sqlalchemy import Column, Integer, JSON
from sqlalchemy.orm import relationship

from app.db.database import Base


class Cuestionario(Base):
    __tablename__ = "cuestionario"

    id_cuestionario = Column(Integer, primary_key=True, index=True, autoincrement=True)
    variables = Column(JSON, nullable=True)  # Almacena variables del cuestionario en formato JSON

    # Relaciones
    atenciones = relationship("Atencion", back_populates="cuestionario")
