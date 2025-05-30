from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.db.database import Base


class ProgramaEducativo(Base):
    __tablename__ = "programa_educativo"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre_programa = Column(String, index=True)
    clave_programa = Column(String, unique=True, index=True)

    # Relaciones
    personas = relationship("Persona", secondary="persona_programa", back_populates="programas")
