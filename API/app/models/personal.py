from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.db.database import Base


class Personal(Base):
    __tablename__ = "personal"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    area = Column(String, index=True)
    rol = Column(String, index=True)
    numero_empleado = Column(String, unique=True, index=True)

    # Relación con User
    id_user = Column(Integer, ForeignKey("users.id"), unique=True)
    user = relationship("User", back_populates="personal")
