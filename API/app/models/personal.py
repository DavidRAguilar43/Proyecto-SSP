from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.db.database import Base


class Personal(Base):
    __tablename__ = "personal"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    area = Column(String, index=True)
    rol = Column(String, index=True)
    numero_empleado = Column(String, unique=True, index=True)

    # Relación con Persona
    id_persona = Column(Integer, ForeignKey("personas.id"), unique=True)
    persona = relationship("Persona", back_populates="personal")
