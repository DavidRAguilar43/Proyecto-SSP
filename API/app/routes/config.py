"""
Endpoints para configuración del sistema.

NOTA: Los endpoints de modelos de IA ahora usan el catálogo de base de datos.
Este archivo mantiene compatibilidad con código legacy.
"""

from typing import Any, List, Dict, Optional
import json
import os
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.utils.deps import get_current_active_user, check_admin_or_coordinador_role, get_db
from app.models.persona import User
from app.models.modelo_ia import ModeloIA

router = APIRouter(prefix="/config", tags=["config"])


class AIModel(BaseModel):
    """Esquema para modelo de IA."""
    id: str
    name: str
    provider: str
    description: str
    context_length: int
    recommended: bool
    category: str


class AIModelsResponse(BaseModel):
    """Esquema de respuesta para lista de modelos de IA."""
    models: List[AIModel]
    categories: Dict[str, Any]
    default_model: str
    recommended_for_psychopedagogical: List[str]
    metadata: Dict[str, Any]


def load_ai_models_from_db(db: Session) -> Dict[str, Any]:
    """
    Cargar configuración de modelos de IA desde la base de datos.

    NOTA: Reemplaza la función load_ai_models_config() que leía del JSON.

    Returns:
        Dict con la configuración de modelos en formato compatible con el JSON anterior
    """
    # Obtener todos los modelos activos de la BD
    modelos = db.query(ModeloIA).filter(ModeloIA.activo == True).all()

    # Convertir a formato JSON compatible
    models_list = []
    for modelo in modelos:
        models_list.append({
            "id": modelo.model_id,
            "name": modelo.titulo,
            "provider": modelo.proveedor,
            "description": modelo.descripcion or "",
            "context_length": 128000,  # Valor por defecto
            "recommended": modelo.recomendado,
            "category": modelo.categoria
        })

    # Obtener modelo por defecto (el primero recomendado o el primero en general)
    default_model = next(
        (m.model_id for m in modelos if m.recomendado),
        modelos[0].model_id if modelos else "openai/gpt-3.5-turbo"
    )

    # Obtener modelos recomendados para psicopedagogía
    recommended_ids = [m.model_id for m in modelos if m.recomendado]

    return {
        "models": models_list,
        "categories": {
            "premium": {
                "name": "Premium",
                "description": "Modelos de máxima calidad para análisis complejos y detallados",
                "color": "#FFD700"
            },
            "standard": {
                "name": "Estándar",
                "description": "Modelos con buen balance entre calidad y costo",
                "color": "#4CAF50"
            },
            "budget": {
                "name": "Económico",
                "description": "Modelos rápidos y económicos para tareas simples",
                "color": "#2196F3"
            }
        },
        "default_model": default_model,
        "recommended_for_psychopedagogical": recommended_ids,
        "metadata": {
            "source": "database",
            "total_models": len(models_list)
        }
    }


@router.get("/ai-models", response_model=AIModelsResponse)
def get_ai_models(
    *,
    db: Session = Depends(get_db),
    category: Optional[str] = Query(None, description="Filtrar por categoría (premium, standard, budget)"),
    recommended_only: bool = Query(False, description="Mostrar solo modelos recomendados"),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Obtener lista de modelos de IA disponibles para generación de reportes.

    NOTA: Ahora carga desde la base de datos en lugar del JSON.

    Parámetros:
    - category: Filtrar por categoría (premium, standard, budget)
    - recommended_only: Mostrar solo modelos recomendados

    Returns:
        Lista de modelos disponibles con sus características
    """
    config = load_ai_models_from_db(db)

    models = config.get("models", [])

    # Aplicar filtros
    if category:
        models = [m for m in models if m.get("category") == category]

    if recommended_only:
        models = [m for m in models if m.get("recommended", False)]

    return {
        "models": models,
        "categories": config.get("categories", {}),
        "default_model": config.get("default_model", ""),
        "recommended_for_psychopedagogical": config.get("recommended_for_psychopedagogical", []),
        "metadata": config.get("metadata", {})
    }


@router.get("/ai-models/recommended")
def get_recommended_ai_models(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Obtener solo los modelos recomendados para reportes psicopedagógicos.

    NOTA: Ahora carga desde la base de datos en lugar del JSON.

    Returns:
        Lista de modelos recomendados
    """
    config = load_ai_models_from_db(db)

    recommended_ids = config.get("recommended_for_psychopedagogical", [])
    all_models = config.get("models", [])

    # Filtrar solo los modelos recomendados
    recommended_models = [
        m for m in all_models
        if m.get("id") in recommended_ids
    ]

    return {
        "models": recommended_models,
        "total": len(recommended_models),
        "default_model": config.get("default_model", "")
    }


@router.get("/ai-models/{model_id}")
def get_ai_model_details(
    *,
    model_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Obtener detalles de un modelo específico de IA.

    NOTA: Ahora carga desde la base de datos en lugar del JSON.

    Args:
        model_id: ID del modelo (ej: "openai/gpt-4-turbo")

    Returns:
        Detalles del modelo
    """
    config = load_ai_models_from_db(db)

    all_models = config.get("models", [])

    # Buscar el modelo por ID
    model = next((m for m in all_models if m.get("id") == model_id), None)

    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Modelo '{model_id}' no encontrado"
        )

    return model


@router.get("/ai-models/by-provider/{provider}")
def get_ai_models_by_provider(
    *,
    provider: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Obtener modelos de IA de un proveedor específico.

    NOTA: Ahora carga desde la base de datos en lugar del JSON.

    Args:
        provider: Nombre del proveedor (OpenAI, Anthropic, Meta, Google, etc.)

    Returns:
        Lista de modelos del proveedor
    """
    config = load_ai_models_from_db(db)

    all_models = config.get("models", [])

    # Filtrar por proveedor (case-insensitive)
    provider_models = [
        m for m in all_models
        if m.get("provider", "").lower() == provider.lower()
    ]

    if not provider_models:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontraron modelos del proveedor '{provider}'"
        )

    return {
        "provider": provider,
        "models": provider_models,
        "total": len(provider_models)
    }


@router.put("/ai-models/default", dependencies=[Depends(check_admin_or_coordinador_role)])
def update_default_model(
    *,
    db: Session = Depends(get_db),
    model_id: str = Query(..., description="ID del nuevo modelo por defecto"),
    current_user: User = Depends(check_admin_or_coordinador_role)
) -> Any:
    """
    Actualizar el modelo de IA por defecto.
    Solo administradores y coordinadores pueden realizar esta acción.

    NOTA: Ahora marca el modelo como recomendado en la BD en lugar de modificar el JSON.

    Args:
        model_id: ID del nuevo modelo por defecto

    Returns:
        Confirmación de actualización
    """
    try:
        # Verificar que el modelo existe
        modelo = db.query(ModeloIA).filter(ModeloIA.model_id == model_id).first()

        if not modelo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Modelo '{model_id}' no encontrado"
            )

        # Desmarcar todos los modelos como no recomendados
        db.query(ModeloIA).update({"recomendado": False})

        # Marcar el nuevo modelo como recomendado
        modelo.recomendado = True

        db.commit()

        return {
            "message": "Modelo por defecto actualizado exitosamente",
            "default_model": model_id,
            "modelo_nombre": modelo.titulo
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar modelo por defecto: {str(e)}"
        )

