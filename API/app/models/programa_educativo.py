from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.db.database import Base
from app.models.associations import user_programa


class ProgramaEducativo(Base):
    __tablename__ = "programa_educativo"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre_programa = Column(String, index=True)
    clave_programa = Column(String, unique=True, index=True)

    # Relaciones
    users = relationship("User", secondary=user_programa, back_populates="programas")
