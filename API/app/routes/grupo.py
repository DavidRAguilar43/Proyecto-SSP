from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.database import get_db
from app.models.grupo import Grupo
from app.schemas.grupo import (
    GrupoCreate, 
    GrupoUpdate, 
    GrupoOut, 
    GrupoBulkDelete, 
    GrupoBulkCreate, 
    GrupoBulkUpdate
)
from app.utils.deps import (
    get_current_active_user,
    check_admin_role,
    check_personal_role
)

router = APIRouter(prefix="/grupos", tags=["grupos"])


@router.post("/", response_model=GrupoOut)
def create_grupo(
    *,
    db: Session = Depends(get_db),
    grupo_in: GrupoCreate,
    current_user = Depends(check_personal_role)
) -> Any:
    """
    Crear un nuevo grupo.
    """
    # Crear objeto Grupo
    db_grupo = Grupo(
        nombre_grupo=grupo_in.nombre_grupo,
        tipo_grupo=grupo_in.tipo_grupo,
        observaciones_grupo=grupo_in.observaciones_grupo,
        cohorte=grupo_in.cohorte,
        fecha_creacion_registro=grupo_in.fecha_creacion_registro
    )
    
    db.add(db_grupo)
    db.commit()
    db.refresh(db_grupo)
    return db_grupo


@router.get("/", response_model=List[GrupoOut])
def read_grupos(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    tipo_grupo: Optional[str] = None,
    cohorte: Optional[str] = None,
    current_user = Depends(get_current_active_user)
) -> Any:
    """
    Recuperar grupos con filtros opcionales.
    """
    query = db.query(Grupo)
    
    # Aplicar filtros si se proporcionan
    if tipo_grupo:
        query = query.filter(Grupo.tipo_grupo == tipo_grupo)
    if cohorte:
        query = query.filter(Grupo.cohorte == cohorte)
    
    grupos = query.offset(skip).limit(limit).all()
    return grupos


@router.get("/{grupo_id}", response_model=GrupoOut)
def read_grupo(
    *,
    db: Session = Depends(get_db),
    grupo_id: int,
    current_user = Depends(get_current_active_user)
) -> Any:
    """
    Obtener un grupo por ID.
    """
    grupo = db.query(Grupo).filter(Grupo.id == grupo_id).first()
    if not grupo:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")
    
    return grupo


@router.put("/{grupo_id}", response_model=GrupoOut)
def update_grupo(
    *,
    db: Session = Depends(get_db),
    grupo_id: int,
    grupo_in: GrupoUpdate,
    current_user = Depends(check_personal_role)
) -> Any:
    """
    Actualizar un grupo.
    """
    grupo = db.query(Grupo).filter(Grupo.id == grupo_id).first()
    if not grupo:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")
    
    # Actualizar campos si se proporcionan
    update_data = grupo_in.dict(exclude_unset=True)
    
    # Actualizar campos
    for field, value in update_data.items():
        setattr(grupo, field, value)
    
    db.add(grupo)
    db.commit()
    db.refresh(grupo)
    return grupo


@router.delete("/{grupo_id}", response_model=GrupoOut)
def delete_grupo(
    *,
    db: Session = Depends(get_db),
    grupo_id: int,
    current_user = Depends(check_admin_role)
) -> Any:
    """
    Eliminar un grupo.
    """
    grupo = db.query(Grupo).filter(Grupo.id == grupo_id).first()
    if not grupo:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")
    
    db.delete(grupo)
    db.commit()
    return grupo


@router.post("/bulk-create", response_model=List[GrupoOut])
def bulk_create_grupos(
    *,
    db: Session = Depends(get_db),
    bulk_grupos: GrupoBulkCreate,
    current_user = Depends(check_admin_role)
) -> Any:
    """
    Crear múltiples grupos en una sola operación.
    """
    created_grupos = []
    
    for grupo_data in bulk_grupos.items:
        # Crear objeto Grupo
        db_grupo = Grupo(
            nombre_grupo=grupo_data.nombre_grupo,
            tipo_grupo=grupo_data.tipo_grupo,
            observaciones_grupo=grupo_data.observaciones_grupo,
            cohorte=grupo_data.cohorte,
            fecha_creacion_registro=grupo_data.fecha_creacion_registro
        )
        
        db.add(db_grupo)
        created_grupos.append(db_grupo)
    
    db.commit()
    
    # Refrescar todos los objetos
    for grupo in created_grupos:
        db.refresh(grupo)
    
    return created_grupos


@router.put("/bulk-update", response_model=List[GrupoOut])
def bulk_update_grupos(
    *,
    db: Session = Depends(get_db),
    bulk_update: GrupoBulkUpdate,
    current_user = Depends(check_admin_role)
) -> Any:
    """
    Actualizar múltiples grupos en una sola operación.
    """
    updated_grupos = []
    
    for item in bulk_update.items:
        if "id" not in item:
            continue
        
        grupo_id = item.pop("id")
        grupo = db.query(Grupo).filter(Grupo.id == grupo_id).first()
        
        if not grupo:
            continue
        
        # Actualizar campos
        for field, value in item.items():
            if hasattr(grupo, field):
                setattr(grupo, field, value)
        
        db.add(grupo)
        updated_grupos.append(grupo)
    
    db.commit()
    
    # Refrescar todos los objetos
    for grupo in updated_grupos:
        db.refresh(grupo)
    
    return updated_grupos


@router.post("/bulk-delete", response_model=List[int])
def bulk_delete_grupos(
    *,
    db: Session = Depends(get_db),
    bulk_delete: GrupoBulkDelete,
    current_user = Depends(check_admin_role)
) -> Any:
    """
    Eliminar múltiples grupos en una sola operación.
    """
    deleted_ids = []
    
    for grupo_id in bulk_delete.ids:
        grupo = db.query(Grupo).filter(Grupo.id == grupo_id).first()
        if grupo:
            db.delete(grupo)
            deleted_ids.append(grupo_id)
    
    db.commit()
    return deleted_ids


@router.get("/search/", response_model=List[GrupoOut])
def search_grupos(
    *,
    db: Session = Depends(get_db),
    q: str = Query(None, min_length=3),
    current_user = Depends(get_current_active_user)
) -> Any:
    """
    Buscar grupos por texto en varios campos.
    """
    if not q:
        return []
    
    grupos = db.query(Grupo).filter(
        or_(
            Grupo.nombre_grupo.contains(q),
            Grupo.tipo_grupo.contains(q),
            Grupo.observaciones_grupo.contains(q),
            Grupo.cohorte.contains(q)
        )
    ).all()
    
    return grupos
