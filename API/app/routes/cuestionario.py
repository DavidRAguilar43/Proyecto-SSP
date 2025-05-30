from typing import Any, List, Optional, Dict

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.database import get_db
from app.models.cuestionario import Cuestionario
from app.schemas.cuestionario import (
    CuestionarioCreate, 
    CuestionarioUpdate, 
    CuestionarioOut, 
    CuestionarioBulkDelete, 
    CuestionarioBulkCreate, 
    CuestionarioBulkUpdate
)
from app.utils.deps import (
    get_current_active_user,
    check_admin_role,
    check_personal_role
)

router = APIRouter(prefix="/cuestionarios", tags=["cuestionarios"])


@router.post("/", response_model=CuestionarioOut)
def create_cuestionario(
    *,
    db: Session = Depends(get_db),
    cuestionario_in: CuestionarioCreate,
    current_user = Depends(check_personal_role)
) -> Any:
    """
    Crear un nuevo cuestionario.
    """
    # Crear objeto Cuestionario
    db_cuestionario = Cuestionario(
        variables=cuestionario_in.variables
    )
    
    db.add(db_cuestionario)
    db.commit()
    db.refresh(db_cuestionario)
    return db_cuestionario


@router.get("/", response_model=List[CuestionarioOut])
def read_cuestionarios(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(get_current_active_user)
) -> Any:
    """
    Recuperar cuestionarios.
    """
    cuestionarios = db.query(Cuestionario).offset(skip).limit(limit).all()
    return cuestionarios


@router.get("/{cuestionario_id}", response_model=CuestionarioOut)
def read_cuestionario(
    *,
    db: Session = Depends(get_db),
    cuestionario_id: int,
    current_user = Depends(get_current_active_user)
) -> Any:
    """
    Obtener un cuestionario por ID.
    """
    cuestionario = db.query(Cuestionario).filter(Cuestionario.id_cuestionario == cuestionario_id).first()
    if not cuestionario:
        raise HTTPException(status_code=404, detail="Cuestionario no encontrado")
    
    return cuestionario


@router.put("/{cuestionario_id}", response_model=CuestionarioOut)
def update_cuestionario(
    *,
    db: Session = Depends(get_db),
    cuestionario_id: int,
    cuestionario_in: CuestionarioUpdate,
    current_user = Depends(check_personal_role)
) -> Any:
    """
    Actualizar un cuestionario.
    """
    cuestionario = db.query(Cuestionario).filter(Cuestionario.id_cuestionario == cuestionario_id).first()
    if not cuestionario:
        raise HTTPException(status_code=404, detail="Cuestionario no encontrado")
    
    # Actualizar campos si se proporcionan
    update_data = cuestionario_in.dict(exclude_unset=True)
    
    # Actualizar campos
    for field, value in update_data.items():
        setattr(cuestionario, field, value)
    
    db.add(cuestionario)
    db.commit()
    db.refresh(cuestionario)
    return cuestionario


@router.delete("/{cuestionario_id}", response_model=CuestionarioOut)
def delete_cuestionario(
    *,
    db: Session = Depends(get_db),
    cuestionario_id: int,
    current_user = Depends(check_admin_role)
) -> Any:
    """
    Eliminar un cuestionario.
    """
    cuestionario = db.query(Cuestionario).filter(Cuestionario.id_cuestionario == cuestionario_id).first()
    if not cuestionario:
        raise HTTPException(status_code=404, detail="Cuestionario no encontrado")
    
    # Verificar si hay atenciones asociadas al cuestionario
    if cuestionario.atenciones and len(cuestionario.atenciones) > 0:
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar el cuestionario porque tiene atenciones asociadas"
        )
    
    db.delete(cuestionario)
    db.commit()
    return cuestionario


@router.post("/bulk-create", response_model=List[CuestionarioOut])
def bulk_create_cuestionarios(
    *,
    db: Session = Depends(get_db),
    bulk_cuestionarios: CuestionarioBulkCreate,
    current_user = Depends(check_admin_role)
) -> Any:
    """
    Crear múltiples cuestionarios en una sola operación.
    """
    created_cuestionarios = []
    
    for cuestionario_data in bulk_cuestionarios.items:
        # Crear objeto Cuestionario
        db_cuestionario = Cuestionario(
            variables=cuestionario_data.variables
        )
        
        db.add(db_cuestionario)
        created_cuestionarios.append(db_cuestionario)
    
    db.commit()
    
    # Refrescar todos los objetos
    for cuestionario in created_cuestionarios:
        db.refresh(cuestionario)
    
    return created_cuestionarios


@router.put("/bulk-update", response_model=List[CuestionarioOut])
def bulk_update_cuestionarios(
    *,
    db: Session = Depends(get_db),
    bulk_update: CuestionarioBulkUpdate,
    current_user = Depends(check_admin_role)
) -> Any:
    """
    Actualizar múltiples cuestionarios en una sola operación.
    """
    updated_cuestionarios = []
    
    for item in bulk_update.items:
        if "id_cuestionario" not in item:
            continue
        
        cuestionario_id = item.pop("id_cuestionario")
        cuestionario = db.query(Cuestionario).filter(Cuestionario.id_cuestionario == cuestionario_id).first()
        
        if not cuestionario:
            continue
        
        # Actualizar campos
        for field, value in item.items():
            if hasattr(cuestionario, field):
                setattr(cuestionario, field, value)
        
        db.add(cuestionario)
        updated_cuestionarios.append(cuestionario)
    
    db.commit()
    
    # Refrescar todos los objetos
    for cuestionario in updated_cuestionarios:
        db.refresh(cuestionario)
    
    return updated_cuestionarios


@router.post("/bulk-delete", response_model=List[int])
def bulk_delete_cuestionarios(
    *,
    db: Session = Depends(get_db),
    bulk_delete: CuestionarioBulkDelete,
    current_user = Depends(check_admin_role)
) -> Any:
    """
    Eliminar múltiples cuestionarios en una sola operación.
    """
    deleted_ids = []
    
    for cuestionario_id in bulk_delete.ids:
        cuestionario = db.query(Cuestionario).filter(Cuestionario.id_cuestionario == cuestionario_id).first()
        if cuestionario:
            # Verificar si hay atenciones asociadas al cuestionario
            if cuestionario.atenciones and len(cuestionario.atenciones) > 0:
                continue  # Saltar este registro si tiene atenciones asociadas
            
            db.delete(cuestionario)
            deleted_ids.append(cuestionario_id)
    
    db.commit()
    return deleted_ids
