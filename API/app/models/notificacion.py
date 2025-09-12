from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from app.db.database import Base


class NotificacionRegistro(Base):
    """
    Modelo para notificaciones de registros pendientes de aprobación.
    Se usa principalmente para notificar a administradores sobre registros de personal.
    """
    __tablename__ = "notificaciones_registro"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    tipo_notificacion = Column(String, nullable=False)  # "registro_personal_pendiente", "registro_docente_pendiente"
    mensaje = Column(Text, nullable=False)
    
    # Usuario que generó la notificación (el que se registró)
    usuario_solicitante_id = Column(Integer, ForeignKey("personas.id"), nullable=False)
    
    # Usuario que debe revisar la notificación (admin)
    usuario_destinatario_id = Column(Integer, ForeignKey("personas.id"), nullable=True)
    
    # Estado de la notificación
    leida = Column(Boolean, default=False, nullable=False)
    procesada = Column(Boolean, default=False, nullable=False)  # Si ya se aprobó/rechazó
    aprobada = Column(Boolean, nullable=True)  # True=aprobada, False=rechazada, None=pendiente
    
    # Metadatos adicionales
    observaciones_admin = Column(Text, nullable=True)  # Comentarios del admin al aprobar/rechazar
    
    # Timestamps
    fecha_creacion = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    fecha_leida = Column(DateTime, nullable=True)
    fecha_procesada = Column(DateTime, nullable=True)

    # Relaciones
    usuario_solicitante = relationship("Persona", foreign_keys=[usuario_solicitante_id], back_populates="notificaciones_enviadas")
    usuario_destinatario = relationship("Persona", foreign_keys=[usuario_destinatario_id], back_populates="notificaciones_recibidas")

    def __repr__(self):
        return f"<NotificacionRegistro(id={self.id}, tipo='{self.tipo_notificacion}', leida={self.leida}, procesada={self.procesada})>"

    def marcar_como_leida(self):
        """Marcar la notificación como leída."""
        self.leida = True
        self.fecha_leida = datetime.now(timezone.utc)

    def procesar(self, aprobada: bool, observaciones: str = None):
        """Procesar la notificación (aprobar o rechazar)."""
        self.procesada = True
        self.aprobada = aprobada
        self.observaciones_admin = observaciones
        self.fecha_procesada = datetime.now(timezone.utc)
        if not self.leida:
            self.marcar_como_leida()
