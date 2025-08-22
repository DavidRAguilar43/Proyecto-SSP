from sqlalchemy import Table, Column, Integer, ForeignKey
from app.db.database import Base

# Tabla de asociación para la relación many-to-many entre Persona y Grupo
persona_grupo = Table(
    'persona_grupo',
    Base.metadata,
    Column('persona_id', Integer, ForeignKey('personas.id'), primary_key=True),
    Column('grupo_id', Integer, ForeignKey('grupo.id'), primary_key=True)
)

# Tabla de asociación para la relación many-to-many entre Persona y ProgramaEducativo
persona_programa = Table(
    'persona_programa',
    Base.metadata,
    Column('persona_id', Integer, ForeignKey('personas.id'), primary_key=True),
    Column('programa_id', Integer, ForeignKey('programa_educativo.id'), primary_key=True)
)
