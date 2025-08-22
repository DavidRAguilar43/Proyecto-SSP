from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base
from app.models.associations import persona_grupo, persona_programa

class Persona(Base):
    __tablename__ = "personas"

    id = Column(Integer, primary_key=True, index=True)
    tipo_persona = Column(String, nullable=False)  # alumno, docente, administrativo, otro
    sexo = Column(String, nullable=False)  # masculino, femenino, otro
    genero = Column(String, nullable=False)  # masculino, femenino, no_binario, otro
    edad = Column(Integer, nullable=False)
    estado_civil = Column(String, nullable=False)  # soltero, casado, etc.
    religion = Column(String, nullable=True)
    trabaja = Column(Boolean, default=False)
    lugar_trabajo = Column(String, nullable=True)
    lugar_origen = Column(String, nullable=False)
    colonia_residencia_actual = Column(String, nullable=False)
    celular = Column(String, nullable=False)
    correo_institucional = Column(String, unique=True, index=True, nullable=False)
    discapacidad = Column(String, nullable=True)
    observaciones = Column(String, nullable=True)
    matricula = Column(String, nullable=True, unique=True, index=True)
    semestre = Column(Integer, nullable=True)
    numero_hijos = Column(Integer, default=0)
    grupo_etnico = Column(String, nullable=True)
    rol = Column(String, nullable=False, default="alumno")  # admin, personal, docente, alumno
    is_active = Column(Boolean, default=True)
    hashed_password = Column(String, nullable=False)
    fecha_creacion = Column(DateTime, server_default=func.now())
    fecha_actualizacion = Column(DateTime, onupdate=func.now())
    cohorte_id = Column(Integer, ForeignKey("cohorte.id"), nullable=True)

    # Relaciones
    cohorte = relationship("Cohorte", back_populates="personas")
    grupos = relationship("Grupo", secondary=persona_grupo, back_populates="personas")
    programas = relationship("ProgramaEducativo", secondary=persona_programa, back_populates="personas")
    personal = relationship("Personal", back_populates="persona", uselist=False)
    contactos_emergencia = relationship("ContactoEmergencia", back_populates="persona")
    atenciones = relationship("Atencion", back_populates="persona")
    cuestionarios_completados = relationship("Cuestionario", back_populates="persona")

    # Relaciones de citas
    citas_como_alumno = relationship("Cita", foreign_keys="Cita.id_alumno", back_populates="alumno")
    citas_como_personal = relationship("Cita", foreign_keys="Cita.id_personal", back_populates="personal")
