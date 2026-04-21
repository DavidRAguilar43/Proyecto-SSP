from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.db.database import Base
from app.models.encryption_mixin import EncryptedFieldsMixin


class ContactoEmergencia(Base, EncryptedFieldsMixin):
    __tablename__ = "contacto_emergencia"

    # Campos a cifrar automáticamente
    __encrypted_fields__ = [
        "nombre_contacto",
        "telefono_contacto",
    ]

    id_contacto = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre_contacto = Column(String, index=True)
    telefono_contacto = Column(String)
    parentesco = Column(String)

    # Relación con User
    id_user = Column(Integer, ForeignKey("users.id"))
    user = relationship("User", back_populates="contactos_emergencia")
