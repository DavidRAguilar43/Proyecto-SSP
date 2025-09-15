from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.database import get_db
from app.models.unidad import Unidad
from app.schemas.unidad import (
    UnidadCreate,
    UnidadUpdate,
    UnidadOut,
    UnidadBulkDelete,
    UnidadBulkCreate,
    UnidadBulkUpdate
)
from app.utils.deps import (
    get_current_active_user,
    check_admin_role,
    check_admin_or_coordinador_role,
    check_personal_role
)

router = APIRouter(prefix="/unidades", tags=["unidades"])


@router.post("/", response_model=UnidadOut)
def create_unidad(
    *,
    db: Session = Depends(get_db),
    unidad_in: UnidadCreate,
    current_user = Depends(check_admin_or_coordinador_role)
) -> Any:
    """
    Crear una nueva unidad (administradores y coordinadores).
    """
    # Verificar si ya existe una unidad con el mismo nombre
    db_unidad = db.query(Unidad).filter(Unidad.nombre == unidad_in.nombre).first()
    if db_unidad:
        raise HTTPException(
            status_code=400,
            detail="Ya existe una unidad con este nombre"
        )

    # Crear objeto Unidad
    db_unidad = Unidad(
        nombre=unidad_in.nombre
    )

    db.add(db_unidad)
    db.commit()
    db.refresh(db_unidad)
    return db_unidad


@router.get("/", response_model=List[UnidadOut])
def read_unidades(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(get_current_active_user)
) -> Any:
    """
    Recuperar unidades.
    """
    unidades = db.query(Unidad).offset(skip).limit(limit).all()
    return unidades


@router.get("/{unidad_id}", response_model=UnidadOut)
def read_unidad(
    *,
    db: Session = Depends(get_db),
    unidad_id: int,
    current_user = Depends(get_current_active_user)
) -> Any:
    """
    Obtener unidad por ID.
    """
    unidad = db.query(Unidad).filter(Unidad.id == unidad_id).first()
    if not unidad:
        raise HTTPException(status_code=404, detail="Unidad no encontrada")
    return unidad


@router.put("/{unidad_id}", response_model=UnidadOut)
def update_unidad(
    *,
    db: Session = Depends(get_db),
    unidad_id: int,
    unidad_in: UnidadUpdate,
    current_user = Depends(check_admin_or_coordinador_role)
) -> Any:
    """
    Actualizar una unidad (administradores y coordinadores).
    """
    unidad = db.query(Unidad).filter(Unidad.id == unidad_id).first()
    if not unidad:
        raise HTTPException(status_code=404, detail="Unidad no encontrada")

    # Verificar si el nuevo nombre ya existe (si se está cambiando)
    if unidad_in.nombre and unidad_in.nombre != unidad.nombre:
        existing_unidad = db.query(Unidad).filter(Unidad.nombre == unidad_in.nombre).first()
        if existing_unidad:
            raise HTTPException(
                status_code=400,
                detail="Ya existe una unidad con este nombre"
            )

    # Actualizar campos
    update_data = unidad_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(unidad, field, value)

    db.add(unidad)
    db.commit()
    db.refresh(unidad)
    return unidad


@router.delete("/{unidad_id}")
def delete_unidad(
    *,
    db: Session = Depends(get_db),
    unidad_id: int,
    current_user = Depends(check_admin_role)
) -> Any:
    """
    Eliminar una unidad.
    """
    unidad = db.query(Unidad).filter(Unidad.id == unidad_id).first()
    if not unidad:
        raise HTTPException(status_code=404, detail="Unidad no encontrada")

    db.delete(unidad)
    db.commit()
    return {"message": "Unidad eliminada exitosamente"}


@router.post("/bulk-create/", response_model=List[UnidadOut])
def bulk_create_unidades(
    *,
    db: Session = Depends(get_db),
    unidades_in: UnidadBulkCreate,
    current_user = Depends(check_admin_or_coordinador_role)
) -> Any:
    """
    Crear múltiples unidades (administradores y coordinadores).
    """
    created_unidades = []
    for unidad_data in unidades_in.items:
        # Verificar si ya existe
        existing = db.query(Unidad).filter(Unidad.nombre == unidad_data.nombre).first()
        if existing:
            continue  # Saltar duplicados

        db_unidad = Unidad(**unidad_data.model_dump())
        db.add(db_unidad)
        created_unidades.append(db_unidad)

    db.commit()
    for unidad in created_unidades:
        db.refresh(unidad)

    return created_unidades


@router.put("/bulk-update/", response_model=List[UnidadOut])
def bulk_update_unidades(
    *,
    db: Session = Depends(get_db),
    unidades_in: UnidadBulkUpdate,
    current_user = Depends(check_admin_or_coordinador_role)
) -> Any:
    """
    Actualizar múltiples unidades (administradores y coordinadores).
    """
    updated_unidades = []
    for item in unidades_in.items:
        unidad_id = item.get('id')
        if not unidad_id:
            continue

        unidad = db.query(Unidad).filter(Unidad.id == unidad_id).first()
        if not unidad:
            continue

        # Actualizar campos
        for field, value in item.items():
            if field != 'id' and hasattr(unidad, field):
                setattr(unidad, field, value)

        db.add(unidad)
        updated_unidades.append(unidad)

    db.commit()
    for unidad in updated_unidades:
        db.refresh(unidad)

    return updated_unidades


@router.delete("/bulk-delete/")
def bulk_delete_unidades(
    *,
    db: Session = Depends(get_db),
    unidades_in: UnidadBulkDelete,
    current_user = Depends(check_admin_role)
) -> Any:
    """
    Eliminar múltiples unidades.
    """
    deleted_count = 0
    for unidad_id in unidades_in.ids:
        unidad = db.query(Unidad).filter(Unidad.id == unidad_id).first()
        if unidad:
            db.delete(unidad)
            deleted_count += 1

    db.commit()
    return {"message": f"{deleted_count} unidades eliminadas exitosamente"}


@router.get("/search/", response_model=List[UnidadOut])
def search_unidades(
    *,
    db: Session = Depends(get_db),
    q: str = Query(None, min_length=3),
    current_user = Depends(get_current_active_user)
) -> Any:
    """
    Buscar unidades por texto en el nombre.
    """
    if not q:
        return []

    unidades = db.query(Unidad).filter(
        Unidad.nombre.contains(q)
    ).all()

    return unidades
