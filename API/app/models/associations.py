from sqlalchemy import Table, Column, Integer, ForeignKey
from app.db.database import Base

# Tabla de asociación para la relación many-to-many entre User y Grupo
user_grupo = Table(
    'user_grupo',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('grupo_id', Integer, ForeignKey('grupo.id'), primary_key=True)
)

# Tabla de asociación para la relación many-to-many entre User y ProgramaEducativo
user_programa = Table(
    'user_programa',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('programa_id', Integer, ForeignKey('programa_educativo.id'), primary_key=True)
)
