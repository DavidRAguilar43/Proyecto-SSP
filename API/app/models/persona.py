from sqlalchemy import Column, Integer, String, Boolean, Text, ForeignKey, Table, Enum
from sqlalchemy.orm import relationship
import enum

from app.db.database import Base


# Tablas de relación muchos a muchos
persona_programa = Table(
    "persona_programa",
    Base.metadata,
    Column("id_persona", Integer, ForeignKey("persona.id"), primary_key=True),
    Column("id_programa", Integer, ForeignKey("programa_educativo.id"), primary_key=True),
)

persona_grupo = Table(
    "persona_grupo",
    Base.metadata,
    Column("id_persona", Integer, ForeignKey("persona.id"), primary_key=True),
    Column("id_grupo", Integer, ForeignKey("grupo.id"), primary_key=True),
)


# Enumeraciones
class TipoPersona(str, enum.Enum):
    ALUMNO = "alumno"
    DOCENTE = "docente"
    ADMINISTRATIVO = "administrativo"
    OTRO = "otro"


class Sexo(str, enum.Enum):
    MASCULINO = "masculino"
    FEMENINO = "femenino"
    OTRO = "otro"


class Genero(str, enum.Enum):
    MASCULINO = "masculino"
    FEMENINO = "femenino"
    NO_BINARIO = "no_binario"
    OTRO = "otro"


class EstadoCivil(str, enum.Enum):
    SOLTERO = "soltero"
    CASADO = "casado"
    DIVORCIADO = "divorciado"
    VIUDO = "viudo"
    UNION_LIBRE = "union_libre"
    OTRO = "otro"


class Rol(str, enum.Enum):
    ADMIN = "admin"
    PERSONAL = "personal"
    ALUMNO = "alumno"
    DOCENTE = "docente"


class Persona(Base):
    __tablename__ = "persona"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    tipo_persona = Column(Enum(TipoPersona), index=True)
    sexo = Column(Enum(Sexo))
    genero = Column(Enum(Genero))
    edad = Column(Integer)
    estado_civil = Column(Enum(EstadoCivil))
    religion = Column(String, nullable=True)
    trabaja = Column(Boolean, default=False)
    lugar_trabajo = Column(String, nullable=True)
    lugar_origen = Column(String)
    colonia_residencia_actual = Column(String)
    celular = Column(String)
    correo_institucional = Column(String, unique=True, index=True)
    discapacidad = Column(String, nullable=True)
    observaciones = Column(Text, nullable=True)
    matricula = Column(String, nullable=True, unique=True, index=True)
    semestre = Column(Integer, nullable=True)
    numero_hijos = Column(Integer, default=0)
    grupo_etnico = Column(String, nullable=True)
    rol = Column(Enum(Rol), default=Rol.ALUMNO)

    # Campos para autenticación
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)

    # Relaciones
    programas = relationship("ProgramaEducativo", secondary=persona_programa, back_populates="personas")
    grupos = relationship("Grupo", secondary=persona_grupo, back_populates="personas")
    personal = relationship("Personal", back_populates="persona", uselist=False)
    contactos_emergencia = relationship("ContactoEmergencia", back_populates="persona")
    atenciones = relationship("Atencion", back_populates="persona")
