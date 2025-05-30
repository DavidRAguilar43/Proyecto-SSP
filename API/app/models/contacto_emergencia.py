from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.db.database import Base


class ContactoEmergencia(Base):
    __tablename__ = "contacto_emergencia"

    id_contacto = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre_contacto = Column(String, index=True)
    telefono_contacto = Column(String)
    parentesco = Column(String)

    # Relación con Persona
    id_persona = Column(Integer, ForeignKey("persona.id"))
    persona = relationship("Persona", back_populates="contactos_emergencia")
