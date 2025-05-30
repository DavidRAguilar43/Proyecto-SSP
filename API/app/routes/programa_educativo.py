from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.database import get_db
from app.models.programa_educativo import ProgramaEducativo
from app.schemas.programa_educativo import (
    ProgramaEducativoCreate,
    ProgramaEducativoUpdate,
    ProgramaEducativoOut,
    ProgramaEducativoBulkDelete,
    ProgramaEducativoBulkCreate,
    ProgramaEducativoBulkUpdate
)
from app.utils.deps import (
    get_current_active_user,
    check_admin_role,
    check_personal_role
)

router = APIRouter(prefix="/programas-educativos", tags=["programas-educativos"])


@router.post("/", response_model=ProgramaEducativoOut)
def create_programa_educativo(
    *,
    db: Session = Depends(get_db),
    programa_in: ProgramaEducativoCreate,
    current_user = Depends(check_admin_role)
) -> Any:
    """
    Crear un nuevo programa educativo.
    """
    # Verificar si ya existe un programa con la misma clave
    db_programa = db.query(ProgramaEducativo).filter(ProgramaEducativo.clave_programa == programa_in.clave_programa).first()
    if db_programa:
        raise HTTPException(
            status_code=400,
            detail="Ya existe un programa educativo con esta clave"
        )

    # Crear objeto ProgramaEducativo
    db_programa = ProgramaEducativo(
        nombre_programa=programa_in.nombre_programa,
        clave_programa=programa_in.clave_programa
    )

    db.add(db_programa)
    db.commit()
    db.refresh(db_programa)
    return db_programa


@router.get("/", response_model=List[ProgramaEducativoOut])
def read_programas_educativos(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(get_current_active_user)
) -> Any:
    """
    Recuperar programas educativos.
    """
    programas = db.query(ProgramaEducativo).offset(skip).limit(limit).all()
    return programas


@router.get("/{programa_id}", response_model=ProgramaEducativoOut)
def read_programa_educativo(
    *,
    db: Session = Depends(get_db),
    programa_id: int,
    current_user = Depends(get_current_active_user)
) -> Any:
    """
    Obtener un programa educativo por ID.
    """
    programa = db.query(ProgramaEducativo).filter(ProgramaEducativo.id == programa_id).first()
    if not programa:
        raise HTTPException(status_code=404, detail="Programa educativo no encontrado")

    return programa


@router.put("/{programa_id}", response_model=ProgramaEducativoOut)
def update_programa_educativo(
    *,
    db: Session = Depends(get_db),
    programa_id: int,
    programa_in: ProgramaEducativoUpdate,
    current_user = Depends(check_admin_role)
) -> Any:
    """
    Actualizar un programa educativo.
    """
    programa = db.query(ProgramaEducativo).filter(ProgramaEducativo.id == programa_id).first()
    if not programa:
        raise HTTPException(status_code=404, detail="Programa educativo no encontrado")

    # Verificar si se está cambiando la clave y si ya existe
    if programa_in.clave_programa and programa_in.clave_programa != programa.clave_programa:
        db_programa = db.query(ProgramaEducativo).filter(ProgramaEducativo.clave_programa == programa_in.clave_programa).first()
        if db_programa:
            raise HTTPException(
                status_code=400,
                detail="Ya existe un programa educativo con esta clave"
            )

    # Actualizar campos si se proporcionan
    update_data = programa_in.dict(exclude_unset=True)

    # Actualizar campos
    for field, value in update_data.items():
        setattr(programa, field, value)

    db.add(programa)
    db.commit()
    db.refresh(programa)
    return programa


@router.delete("/{programa_id}", response_model=ProgramaEducativoOut)
def delete_programa_educativo(
    *,
    db: Session = Depends(get_db),
    programa_id: int,
    current_user = Depends(check_admin_role)
) -> Any:
    """
    Eliminar un programa educativo.
    """
    programa = db.query(ProgramaEducativo).filter(ProgramaEducativo.id == programa_id).first()
    if not programa:
        raise HTTPException(status_code=404, detail="Programa educativo no encontrado")

    # Verificar si hay personas asociadas al programa
    if programa.personas and len(programa.personas) > 0:
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar el programa educativo porque tiene personas asociadas"
        )

    db.delete(programa)
    db.commit()
    return programa


@router.post("/bulk-create", response_model=List[ProgramaEducativoOut])
def bulk_create_programas_educativos(
    *,
    db: Session = Depends(get_db),
    bulk_programas: ProgramaEducativoBulkCreate,
    current_user = Depends(check_admin_role)
) -> Any:
    """
    Crear múltiples programas educativos en una sola operación.
    """
    created_programas = []

    for programa_data in bulk_programas.items:
        # Verificar si ya existe un programa con la misma clave
        db_programa = db.query(ProgramaEducativo).filter(ProgramaEducativo.clave_programa == programa_data.clave_programa).first()
        if db_programa:
            continue  # Saltar este registro si ya existe

        # Crear objeto ProgramaEducativo
        db_programa = ProgramaEducativo(
            nombre_programa=programa_data.nombre_programa,
            clave_programa=programa_data.clave_programa
        )

        db.add(db_programa)
        created_programas.append(db_programa)

    db.commit()

    # Refrescar todos los objetos
    for programa in created_programas:
        db.refresh(programa)

    return created_programas


@router.put("/bulk-update", response_model=List[ProgramaEducativoOut])
def bulk_update_programas_educativos(
    *,
    db: Session = Depends(get_db),
    bulk_update: ProgramaEducativoBulkUpdate,
    current_user = Depends(check_admin_role)
) -> Any:
    """
    Actualizar múltiples programas educativos en una sola operación.
    """
    updated_programas = []

    for item in bulk_update.items:
        if "id" not in item:
            continue

        programa_id = item.pop("id")
        programa = db.query(ProgramaEducativo).filter(ProgramaEducativo.id == programa_id).first()

        if not programa:
            continue

        # Verificar si se está cambiando la clave y si ya existe
        if "clave_programa" in item and item["clave_programa"] != programa.clave_programa:
            db_programa = db.query(ProgramaEducativo).filter(ProgramaEducativo.clave_programa == item["clave_programa"]).first()
            if db_programa:
                continue  # Saltar este registro si ya existe

        # Actualizar campos
        for field, value in item.items():
            if hasattr(programa, field):
                setattr(programa, field, value)

        db.add(programa)
        updated_programas.append(programa)

    db.commit()

    # Refrescar todos los objetos
    for programa in updated_programas:
        db.refresh(programa)

    return updated_programas


@router.post("/bulk-delete", response_model=List[int])
def bulk_delete_programas_educativos(
    *,
    db: Session = Depends(get_db),
    bulk_delete: ProgramaEducativoBulkDelete,
    current_user = Depends(check_admin_role)
) -> Any:
    """
    Eliminar múltiples programas educativos en una sola operación.
    """
    deleted_ids = []

    for programa_id in bulk_delete.ids:
        programa = db.query(ProgramaEducativo).filter(ProgramaEducativo.id == programa_id).first()
        if programa:
            # Verificar si hay personas asociadas al programa
            if programa.personas and len(programa.personas) > 0:
                continue  # Saltar este registro si tiene personas asociadas

            db.delete(programa)
            deleted_ids.append(programa_id)

    db.commit()
    return deleted_ids


@router.get("/search/", response_model=List[ProgramaEducativoOut])
def search_programas_educativos(
    *,
    db: Session = Depends(get_db),
    q: str = Query(None, min_length=3),
    current_user = Depends(get_current_active_user)
) -> Any:
    """
    Buscar programas educativos por texto en varios campos.
    """
    if not q:
        return []

    programas = db.query(ProgramaEducativo).filter(
        or_(
            ProgramaEducativo.nombre_programa.contains(q),
            ProgramaEducativo.clave_programa.contains(q)
        )
    ).all()

    return programas
