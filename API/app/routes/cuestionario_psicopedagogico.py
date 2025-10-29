"""
Rutas para el cuestionario psicopedagógico.
"""

from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.database import get_db
from app.models.persona import Persona
from app.models.cuestionario import Cuestionario
from app.schemas.cuestionario import (
    CuestionarioPsicopedagogicoCreate,
    CuestionarioPsicopedagogicoOut,
    CuestionarioPsicopedagogicoEstudianteOut
)
from app.utils.deps import get_current_active_user
from app.services.ai_service import ai_service

router = APIRouter()

# Preguntas del cuestionario psicopedagógico (3 preguntas sencillas para prueba)
PREGUNTAS_CUESTIONARIO = {
    "pregunta_1": "¿Cómo te sientes actualmente con tu rendimiento académico? (Muy satisfecho, Satisfecho, Regular, Insatisfecho, Muy insatisfecho)",
    "pregunta_2": "¿Qué dificultades principales enfrentas en tus estudios? (Describe brevemente)",
    "pregunta_3": "¿Qué tipo de apoyo consideras que necesitas para mejorar tu desempeño académico? (Describe brevemente)"
}


@router.get("/preguntas")
def get_preguntas_cuestionario(
    current_user: Persona = Depends(get_current_active_user)
) -> Dict[str, str]:
    """
    Obtener las preguntas del cuestionario psicopedagógico.
    Disponible para todos los usuarios autenticados.
    """
    return PREGUNTAS_CUESTIONARIO


@router.post("/completar", response_model=CuestionarioPsicopedagogicoEstudianteOut)
def completar_cuestionario(
    cuestionario_data: CuestionarioPsicopedagogicoCreate,
    db: Session = Depends(get_db),
    current_user: Persona = Depends(get_current_active_user)
) -> Any:
    """
    Completar el cuestionario psicopedagógico.
    Solo el propio estudiante puede completar su cuestionario.
    """
    # Verificar que el usuario actual es el mismo que está completando el cuestionario
    if current_user.id != cuestionario_data.id_persona and current_user.rol not in ["admin", "personal"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo puedes completar tu propio cuestionario"
        )
    
    # Verificar que la persona existe y es un estudiante
    persona = db.query(Persona).filter(Persona.id == cuestionario_data.id_persona).first()
    if not persona:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Persona no encontrada"
        )
    
    if persona.rol != "alumno":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo los estudiantes pueden completar el cuestionario psicopedagógico"
        )
    
    # Verificar si ya existe un cuestionario para esta persona
    cuestionario_existente = db.query(Cuestionario).filter(
        Cuestionario.id_persona == cuestionario_data.id_persona,
        Cuestionario.tipo_cuestionario == "psicopedagogico"
    ).first()
    
    if cuestionario_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un cuestionario psicopedagógico para este estudiante"
        )
    
    # Validar que las respuestas contengan las preguntas requeridas
    preguntas_requeridas = set(PREGUNTAS_CUESTIONARIO.keys())
    respuestas_proporcionadas = set(cuestionario_data.respuestas.keys())
    
    if not preguntas_requeridas.issubset(respuestas_proporcionadas):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Faltan respuestas para algunas preguntas requeridas"
        )
    
    # Crear información del estudiante para el reporte de IA
    persona_info = {
        "edad": persona.edad,
        "semestre": persona.semestre,
        "genero": persona.genero,
        "rol": persona.rol
    }
    
    # Generar reporte con IA
    try:
        reporte_ia = ai_service.generate_psychopedagogical_report(
            cuestionario_data.respuestas, 
            persona_info
        )
    except Exception as e:
        # Si falla la generación del reporte, continuar sin él
        reporte_ia = f"Error generando reporte automático: {str(e)}"
    
    # Crear el cuestionario en la base de datos
    nuevo_cuestionario = Cuestionario(
        tipo_cuestionario="psicopedagogico",
        respuestas=cuestionario_data.respuestas,
        reporte_ia=reporte_ia,
        id_persona=cuestionario_data.id_persona,
        fecha_completado=datetime.utcnow()
    )
    
    db.add(nuevo_cuestionario)
    db.commit()
    db.refresh(nuevo_cuestionario)
    
    # Retornar respuesta para estudiante (sin reporte)
    return CuestionarioPsicopedagogicoEstudianteOut(
        id_cuestionario=nuevo_cuestionario.id_cuestionario,
        fecha_creacion=nuevo_cuestionario.fecha_creacion,
        fecha_completado=nuevo_cuestionario.fecha_completado,
        completado=True
    )


@router.get("/estudiante/{persona_id}", response_model=CuestionarioPsicopedagogicoEstudianteOut)
def get_cuestionario_estudiante(
    persona_id: int,
    db: Session = Depends(get_db),
    current_user: Persona = Depends(get_current_active_user)
) -> Any:
    """
    Obtener el estado del cuestionario de un estudiante.
    Solo el propio estudiante puede ver su estado.
    """
    # Verificar permisos
    if current_user.id != persona_id and current_user.rol not in ["admin", "personal"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver este cuestionario"
        )
    
    # Buscar el cuestionario
    cuestionario = db.query(Cuestionario).filter(
        Cuestionario.id_persona == persona_id,
        Cuestionario.tipo_cuestionario == "psicopedagogico"
    ).first()
    
    if not cuestionario:
        # Si no existe, retornar estado "no completado"
        return CuestionarioPsicopedagogicoEstudianteOut(
            id_cuestionario=0,
            fecha_creacion=datetime.utcnow(),
            fecha_completado=None,
            completado=False
        )
    
    return CuestionarioPsicopedagogicoEstudianteOut(
        id_cuestionario=cuestionario.id_cuestionario,
        fecha_creacion=cuestionario.fecha_creacion,
        fecha_completado=cuestionario.fecha_completado,
        completado=cuestionario.fecha_completado is not None
    )


@router.get("/reporte/{persona_id}", response_model=CuestionarioPsicopedagogicoOut)
def get_reporte_cuestionario(
    persona_id: int,
    db: Session = Depends(get_db),
    current_user: Persona = Depends(get_current_active_user)
) -> Any:
    """
    Obtener el reporte completo del cuestionario psicopedagógico.
    Solo disponible para admin y personal.
    """
    # Verificar permisos - solo admin y personal pueden ver reportes
    if current_user.rol not in ["admin", "personal"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver reportes psicopedagógicos"
        )
    
    # Buscar el cuestionario completado
    cuestionario = db.query(Cuestionario).filter(
        Cuestionario.id_persona == persona_id,
        Cuestionario.tipo_cuestionario == "psicopedagogico",
        Cuestionario.fecha_completado.isnot(None)  # Solo cuestionarios completados
    ).first()

    if not cuestionario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cuestionario completado no encontrado para este estudiante"
        )
    
    return CuestionarioPsicopedagogicoOut(
        id_cuestionario=cuestionario.id_cuestionario,
        respuestas=cuestionario.respuestas,
        reporte_ia=cuestionario.reporte_ia,
        fecha_creacion=cuestionario.fecha_creacion,
        fecha_completado=cuestionario.fecha_completado,
        id_persona=cuestionario.id_persona
    )


@router.get("/reportes", response_model=List[CuestionarioPsicopedagogicoOut])
def get_todos_los_reportes(
    db: Session = Depends(get_db),
    current_user: Persona = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    Obtener todos los reportes de cuestionarios psicopedagógicos.
    Solo disponible para admin y personal.
    """
    # Verificar permisos - solo admin y coordinador pueden ver reportes
    # Personal, docente y alumno NO tienen acceso a reportes de otros usuarios
    if current_user.rol not in ["admin", "coordinador"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver reportes psicopedagógicos"
        )
    
    # Obtener todos los cuestionarios completados
    cuestionarios = db.query(Cuestionario).filter(
        Cuestionario.tipo_cuestionario == "psicopedagogico",
        Cuestionario.fecha_completado.isnot(None)
    ).offset(skip).limit(limit).all()
    
    return [
        CuestionarioPsicopedagogicoOut(
            id_cuestionario=c.id_cuestionario,
            respuestas=c.respuestas,
            reporte_ia=c.reporte_ia,
            fecha_creacion=c.fecha_creacion,
            fecha_completado=c.fecha_completado,
            id_persona=c.id_persona
        ) for c in cuestionarios
    ]


@router.get("/estudiantes-con-cuestionarios")
def get_estudiantes_con_cuestionarios(
    db: Session = Depends(get_db),
    current_user: Persona = Depends(get_current_active_user)
) -> List[Dict[str, Any]]:
    """
    Obtener lista de estudiantes que han completado cuestionarios psicopedagógicos.
    Solo disponible para admin y coordinador.
    """
    if current_user.rol not in ["admin", "coordinador"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para acceder a esta información"
        )

    # Obtener estudiantes con cuestionarios completados
    estudiantes_con_cuestionarios = db.query(Persona).join(
        Cuestionario, Persona.id == Cuestionario.id_persona
    ).filter(
        Persona.rol == "alumno",
        Cuestionario.tipo_cuestionario == "psicopedagogico",
        Cuestionario.fecha_completado.isnot(None)  # Solo cuestionarios completados
    ).all()

    resultado = []
    for estudiante in estudiantes_con_cuestionarios:
        cuestionario = db.query(Cuestionario).filter(
            Cuestionario.id_persona == estudiante.id,
            Cuestionario.tipo_cuestionario == "psicopedagogico",
            Cuestionario.fecha_completado.isnot(None)  # Solo cuestionarios completados
        ).first()

        resultado.append({
            "id": estudiante.id,
            "correo_institucional": estudiante.correo_institucional,
            "matricula": estudiante.matricula,
            "nombre_completo": estudiante.correo_institucional.split('@')[0],
            "tiene_cuestionario": True,
            "fecha_completado": cuestionario.fecha_completado if cuestionario else None,
            "id_cuestionario": cuestionario.id_cuestionario if cuestionario else None
        })

    return resultado
