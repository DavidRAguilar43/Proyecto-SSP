from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.db.database import Base


class Unidad(Base):
    __tablename__ = "unidad"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String, index=True)
