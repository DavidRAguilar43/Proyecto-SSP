from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base
from app.models.associations import persona_grupo, persona_programa

class Persona(Base):
    __tablename__ = "personas"

    id = Column(Integer, primary_key=True, index=True)
    # SEGURIDAD: Eliminamos tipo_persona, usamos solo rol para simplificar y mejorar seguridad
    sexo = Column(String, nullable=False)  # masculino, femenino, no_decir, otro
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
    rol = Column(String, nullable=False, default="alumno")  # SEGURIDAD: admin, coordinador, personal, docente, alumno
    is_active = Column(Boolean, default=True)
    hashed_password = Column(String, nullable=False)
    fecha_creacion = Column(DateTime, server_default=func.now())
    fecha_actualizacion = Column(DateTime, onupdate=func.now())
    # Campos de cohorte simplificados
    cohorte_ano = Column(Integer, nullable=True)  # Año de cohorte (ej: 2024, 2025)
    cohorte_periodo = Column(Integer, nullable=True, default=1)  # Período de cohorte (1 o 2)

    # Relaciones
    # Nota: cohorte_id ahora es string, no hay relación directa con tabla cohorte
    grupos = relationship("Grupo", secondary=persona_grupo, back_populates="personas")
    programas = relationship("ProgramaEducativo", secondary=persona_programa, back_populates="personas")
    personal = relationship("Personal", back_populates="persona", uselist=False)
    contactos_emergencia = relationship("ContactoEmergencia", back_populates="persona")
    atenciones = relationship("Atencion", back_populates="persona")
    cuestionarios_completados = relationship("Cuestionario", back_populates="persona")

    # Relaciones para notificaciones de registro
    notificaciones_enviadas = relationship("NotificacionRegistro", foreign_keys="NotificacionRegistro.usuario_solicitante_id", back_populates="usuario_solicitante")
    notificaciones_recibidas = relationship("NotificacionRegistro", foreign_keys="NotificacionRegistro.usuario_destinatario_id", back_populates="usuario_destinatario")

    # Relaciones de citas
    citas_como_alumno = relationship("Cita", foreign_keys="Cita.id_alumno", back_populates="alumno")
    citas_como_personal = relationship("Cita", foreign_keys="Cita.id_personal", back_populates="personal")
