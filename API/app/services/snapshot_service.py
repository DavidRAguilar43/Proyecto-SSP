"""
Servicio para crear snapshots (copias congeladas) de cuestionarios.

Este servicio se encarga de crear copias inmutables de cuestionarios cuando
un usuario los contesta por primera vez. Esto garantiza que las respuestas
del usuario siempre tengan el contexto completo del cuestionario, incluso
si el cuestionario original se modifica o elimina posteriormente.

Reason: Desacoplar completamente las respuestas del cuestionario original
para evitar pérdida de contexto cuando se editan cuestionarios.
"""

import uuid
from datetime import datetime
from zoneinfo import ZoneInfo
from typing import Optional
import logging

from sqlalchemy.orm import Session

from app.models.cuestionario_admin import (
    CuestionarioAdmin,
    Pregunta,
    CuestionarioSnapshot,
    PreguntaSnapshot
)

# Configurar logger
logger = logging.getLogger(__name__)

# Zona horaria de México
MEXICO_TZ = ZoneInfo("America/Mexico_City")


def crear_snapshot_cuestionario(
    db: Session,
    cuestionario: CuestionarioAdmin
) -> CuestionarioSnapshot:
    """
    Crea un snapshot (copia congelada) de un cuestionario.
    
    Args:
        db: Sesión de base de datos
        cuestionario: Cuestionario original del cual crear el snapshot
        
    Returns:
        CuestionarioSnapshot: El snapshot creado
        
    Raises:
        ValueError: Si el cuestionario no tiene preguntas
    """
    # Validar que el cuestionario tenga preguntas
    if not cuestionario.preguntas or len(cuestionario.preguntas) == 0:
        raise ValueError(f"El cuestionario {cuestionario.id} no tiene preguntas")
    
    logger.info(f"Creando snapshot del cuestionario {cuestionario.id} - {cuestionario.titulo}")
    
    # Crear el snapshot del cuestionario
    snapshot_id = str(uuid.uuid4())
    cuestionario_snapshot = CuestionarioSnapshot(
        id=snapshot_id,
        cuestionario_original_id=cuestionario.id,
        titulo=cuestionario.titulo,
        descripcion=cuestionario.descripcion,
        instruccion_sistema=cuestionario.instruccion_sistema,
        modelo_ia=cuestionario.modelo_ia,
        max_tokens=cuestionario.max_tokens,
        temperature=cuestionario.temperature,
        fecha_snapshot=datetime.now(MEXICO_TZ)
    )
    
    db.add(cuestionario_snapshot)
    db.flush()  # Flush para obtener el ID antes de crear las preguntas
    
    # Crear snapshots de todas las preguntas
    preguntas_snapshot_creadas = 0
    for pregunta in cuestionario.preguntas:
        pregunta_snapshot = PreguntaSnapshot(
            id=str(uuid.uuid4()),
            cuestionario_snapshot_id=snapshot_id,
            pregunta_original_id=pregunta.id,
            tipo=pregunta.tipo.value if hasattr(pregunta.tipo, 'value') else str(pregunta.tipo),
            texto=pregunta.texto,
            descripcion=pregunta.descripcion,
            obligatoria=pregunta.obligatoria,
            orden=pregunta.orden,
            configuracion=pregunta.configuracion
        )
        db.add(pregunta_snapshot)
        preguntas_snapshot_creadas += 1
    
    db.flush()
    
    logger.info(
        f"Snapshot creado exitosamente: {snapshot_id} "
        f"con {preguntas_snapshot_creadas} preguntas"
    )
    
    return cuestionario_snapshot


def obtener_o_crear_snapshot(
    db: Session,
    cuestionario_id: str,
    usuario_id: int
) -> CuestionarioSnapshot:
    """
    Obtiene un snapshot existente o crea uno nuevo si no existe.
    
    Esta función verifica si el usuario ya tiene un snapshot del cuestionario.
    Si existe, lo retorna. Si no existe, crea uno nuevo.
    
    Args:
        db: Sesión de base de datos
        cuestionario_id: ID del cuestionario original
        usuario_id: ID del usuario que está contestando
        
    Returns:
        CuestionarioSnapshot: El snapshot existente o recién creado
        
    Raises:
        ValueError: Si el cuestionario no existe o no tiene preguntas
    """
    # Buscar el cuestionario original
    cuestionario = db.query(CuestionarioAdmin).filter(
        CuestionarioAdmin.id == cuestionario_id
    ).first()
    
    if not cuestionario:
        raise ValueError(f"Cuestionario {cuestionario_id} no encontrado")
    
    # Verificar si ya existe un snapshot para este usuario y cuestionario
    # Esto se hace buscando si el usuario ya tiene una respuesta con snapshot
    from app.models.cuestionario_admin import RespuestaCuestionario
    
    respuesta_existente = db.query(RespuestaCuestionario).filter(
        RespuestaCuestionario.cuestionario_id == cuestionario_id,
        RespuestaCuestionario.usuario_id == usuario_id,
        RespuestaCuestionario.snapshot_id.isnot(None)
    ).first()
    
    if respuesta_existente and respuesta_existente.snapshot_id:
        # Ya existe un snapshot, retornarlo
        snapshot = db.query(CuestionarioSnapshot).filter(
            CuestionarioSnapshot.id == respuesta_existente.snapshot_id
        ).first()
        
        if snapshot:
            logger.info(
                f"Snapshot existente encontrado: {snapshot.id} "
                f"para usuario {usuario_id} y cuestionario {cuestionario_id}"
            )
            return snapshot
    
    # No existe snapshot, crear uno nuevo
    logger.info(
        f"No existe snapshot para usuario {usuario_id} y cuestionario {cuestionario_id}. "
        f"Creando nuevo snapshot..."
    )
    
    return crear_snapshot_cuestionario(db, cuestionario)


def obtener_pregunta_snapshot_por_original(
    db: Session,
    snapshot_id: str,
    pregunta_original_id: str
) -> Optional[PreguntaSnapshot]:
    """
    Obtiene una pregunta snapshot basándose en el ID de la pregunta original.
    
    Args:
        db: Sesión de base de datos
        snapshot_id: ID del snapshot del cuestionario
        pregunta_original_id: ID de la pregunta original
        
    Returns:
        PreguntaSnapshot o None si no se encuentra
    """
    return db.query(PreguntaSnapshot).filter(
        PreguntaSnapshot.cuestionario_snapshot_id == snapshot_id,
        PreguntaSnapshot.pregunta_original_id == pregunta_original_id
    ).first()

