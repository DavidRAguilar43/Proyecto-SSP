from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.database import get_db
from app.models.personal import Personal
from app.models.persona import Persona
from app.schemas.personal import (
    PersonalCreate, 
    PersonalUpdate, 
    PersonalOut, 
    PersonalBulkDelete, 
    PersonalBulkCreate, 
    PersonalBulkUpdate
)
from app.utils.deps import (
    get_current_active_user,
    check_admin_role,
    check_personal_role
)

router = APIRouter(prefix="/personal", tags=["personal"])


@router.post("/", response_model=PersonalOut)
def create_personal(
    *,
    db: Session = Depends(get_db),
    personal_in: PersonalCreate,
    current_user = Depends(check_admin_role)
) -> Any:
    """
    Crear un nuevo personal.
    """
    # Verificar si la persona existe
    persona = db.query(Persona).filter(Persona.id == personal_in.id_persona).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Persona no encontrada")
    
    # Verificar si ya existe un personal con el mismo número de empleado
    db_personal = db.query(Personal).filter(Personal.numero_empleado == personal_in.numero_empleado).first()
    if db_personal:
        raise HTTPException(
            status_code=400,
            detail="Ya existe un personal con este número de empleado"
        )
    
    # Verificar si la persona ya está asignada a otro personal
    db_personal = db.query(Personal).filter(Personal.id_persona == personal_in.id_persona).first()
    if db_personal:
        raise HTTPException(
            status_code=400,
            detail="Esta persona ya está asignada a otro personal"
        )
    
    # Crear objeto Personal
    db_personal = Personal(
        area=personal_in.area,
        rol=personal_in.rol,
        numero_empleado=personal_in.numero_empleado,
        id_persona=personal_in.id_persona
    )
    
    db.add(db_personal)
    db.commit()
    db.refresh(db_personal)
    return db_personal


@router.get("/", response_model=List[PersonalOut])
def read_personal_list(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    area: Optional[str] = None,
    rol: Optional[str] = None,
    current_user = Depends(get_current_active_user)
) -> Any:
    """
    Recuperar personal con filtros opcionales.
    """
    query = db.query(Personal)
    
    # Aplicar filtros si se proporcionan
    if area:
        query = query.filter(Personal.area == area)
    if rol:
        query = query.filter(Personal.rol == rol)
    
    personal_list = query.offset(skip).limit(limit).all()
    return personal_list


@router.get("/{personal_id}", response_model=PersonalOut)
def read_personal(
    *,
    db: Session = Depends(get_db),
    personal_id: int,
    current_user = Depends(get_current_active_user)
) -> Any:
    """
    Obtener un personal por ID.
    """
    personal = db.query(Personal).filter(Personal.id == personal_id).first()
    if not personal:
        raise HTTPException(status_code=404, detail="Personal no encontrado")
    
    return personal


@router.put("/{personal_id}", response_model=PersonalOut)
def update_personal(
    *,
    db: Session = Depends(get_db),
    personal_id: int,
    personal_in: PersonalUpdate,
    current_user = Depends(check_admin_role)
) -> Any:
    """
    Actualizar un personal.
    """
    personal = db.query(Personal).filter(Personal.id == personal_id).first()
    if not personal:
        raise HTTPException(status_code=404, detail="Personal no encontrado")
    
    # Verificar si se está cambiando el número de empleado y si ya existe
    if personal_in.numero_empleado and personal_in.numero_empleado != personal.numero_empleado:
        db_personal = db.query(Personal).filter(Personal.numero_empleado == personal_in.numero_empleado).first()
        if db_personal:
            raise HTTPException(
                status_code=400,
                detail="Ya existe un personal con este número de empleado"
            )
    
    # Verificar si se está cambiando la persona y si ya está asignada a otro personal
    if personal_in.id_persona and personal_in.id_persona != personal.id_persona:
        # Verificar si la persona existe
        persona = db.query(Persona).filter(Persona.id == personal_in.id_persona).first()
        if not persona:
            raise HTTPException(status_code=404, detail="Persona no encontrada")
        
        # Verificar si la persona ya está asignada a otro personal
        db_personal = db.query(Personal).filter(Personal.id_persona == personal_in.id_persona).first()
        if db_personal:
            raise HTTPException(
                status_code=400,
                detail="Esta persona ya está asignada a otro personal"
            )
    
    # Actualizar campos si se proporcionan
    update_data = personal_in.dict(exclude_unset=True)
    
    # Actualizar campos
    for field, value in update_data.items():
        setattr(personal, field, value)
    
    db.add(personal)
    db.commit()
    db.refresh(personal)
    return personal


@router.delete("/{personal_id}", response_model=PersonalOut)
def delete_personal(
    *,
    db: Session = Depends(get_db),
    personal_id: int,
    current_user = Depends(check_admin_role)
) -> Any:
    """
    Eliminar un personal.
    """
    personal = db.query(Personal).filter(Personal.id == personal_id).first()
    if not personal:
        raise HTTPException(status_code=404, detail="Personal no encontrado")
    
    db.delete(personal)
    db.commit()
    return personal


@router.post("/bulk-create", response_model=List[PersonalOut])
def bulk_create_personal(
    *,
    db: Session = Depends(get_db),
    bulk_personal: PersonalBulkCreate,
    current_user = Depends(check_admin_role)
) -> Any:
    """
    Crear múltiples personal en una sola operación.
    """
    created_personal = []
    
    for personal_data in bulk_personal.items:
        # Verificar si la persona existe
        persona = db.query(Persona).filter(Persona.id == personal_data.id_persona).first()
        if not persona:
            continue  # Saltar este registro si la persona no existe
        
        # Verificar si ya existe un personal con el mismo número de empleado
        db_personal = db.query(Personal).filter(Personal.numero_empleado == personal_data.numero_empleado).first()
        if db_personal:
            continue  # Saltar este registro si ya existe
        
        # Verificar si la persona ya está asignada a otro personal
        db_personal = db.query(Personal).filter(Personal.id_persona == personal_data.id_persona).first()
        if db_personal:
            continue  # Saltar este registro si la persona ya está asignada
        
        # Crear objeto Personal
        db_personal = Personal(
            area=personal_data.area,
            rol=personal_data.rol,
            numero_empleado=personal_data.numero_empleado,
            id_persona=personal_data.id_persona
        )
        
        db.add(db_personal)
        created_personal.append(db_personal)
    
    db.commit()
    
    # Refrescar todos los objetos
    for personal in created_personal:
        db.refresh(personal)
    
    return created_personal


@router.put("/bulk-update", response_model=List[PersonalOut])
def bulk_update_personal(
    *,
    db: Session = Depends(get_db),
    bulk_update: PersonalBulkUpdate,
    current_user = Depends(check_admin_role)
) -> Any:
    """
    Actualizar múltiples personal en una sola operación.
    """
    updated_personal = []
    
    for item in bulk_update.items:
        if "id" not in item:
            continue
        
        personal_id = item.pop("id")
        personal = db.query(Personal).filter(Personal.id == personal_id).first()
        
        if not personal:
            continue
        
        # Verificar si se está cambiando el número de empleado y si ya existe
        if "numero_empleado" in item and item["numero_empleado"] != personal.numero_empleado:
            db_personal = db.query(Personal).filter(Personal.numero_empleado == item["numero_empleado"]).first()
            if db_personal:
                continue  # Saltar este registro si ya existe
        
        # Verificar si se está cambiando la persona y si ya está asignada a otro personal
        if "id_persona" in item and item["id_persona"] != personal.id_persona:
            # Verificar si la persona existe
            persona = db.query(Persona).filter(Persona.id == item["id_persona"]).first()
            if not persona:
                continue  # Saltar este registro si la persona no existe
            
            # Verificar si la persona ya está asignada a otro personal
            db_personal = db.query(Personal).filter(Personal.id_persona == item["id_persona"]).first()
            if db_personal:
                continue  # Saltar este registro si la persona ya está asignada
        
        # Actualizar campos
        for field, value in item.items():
            if hasattr(personal, field):
                setattr(personal, field, value)
        
        db.add(personal)
        updated_personal.append(personal)
    
    db.commit()
    
    # Refrescar todos los objetos
    for personal in updated_personal:
        db.refresh(personal)
    
    return updated_personal


@router.post("/bulk-delete", response_model=List[int])
def bulk_delete_personal(
    *,
    db: Session = Depends(get_db),
    bulk_delete: PersonalBulkDelete,
    current_user = Depends(check_admin_role)
) -> Any:
    """
    Eliminar múltiples personal en una sola operación.
    """
    deleted_ids = []
    
    for personal_id in bulk_delete.ids:
        personal = db.query(Personal).filter(Personal.id == personal_id).first()
        if personal:
            db.delete(personal)
            deleted_ids.append(personal_id)
    
    db.commit()
    return deleted_ids


@router.get("/search/", response_model=List[PersonalOut])
def search_personal(
    *,
    db: Session = Depends(get_db),
    q: str = Query(None, min_length=3),
    current_user = Depends(get_current_active_user)
) -> Any:
    """
    Buscar personal por texto en varios campos.
    """
    if not q:
        return []
    
    personal_list = db.query(Personal).filter(
        or_(
            Personal.area.contains(q),
            Personal.rol.contains(q),
            Personal.numero_empleado.contains(q)
        )
    ).all()
    
    return personal_list
