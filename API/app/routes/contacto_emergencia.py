from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.database import get_db
from app.models.contacto_emergencia import ContactoEmergencia
from app.models.persona import Persona
from app.schemas.contacto_emergencia import (
    ContactoEmergenciaCreate, 
    ContactoEmergenciaUpdate, 
    ContactoEmergenciaOut, 
    ContactoEmergenciaBulkDelete, 
    ContactoEmergenciaBulkCreate, 
    ContactoEmergenciaBulkUpdate
)
from app.utils.deps import (
    get_current_active_user,
    check_admin_role,
    check_personal_role
)

router = APIRouter(prefix="/contactos-emergencia", tags=["contactos-emergencia"])


@router.post("/", response_model=ContactoEmergenciaOut)
def create_contacto_emergencia(
    *,
    db: Session = Depends(get_db),
    contacto_in: ContactoEmergenciaCreate,
    current_user = Depends(check_personal_role)
) -> Any:
    """
    Crear un nuevo contacto de emergencia.
    """
    # Verificar si la persona existe
    persona = db.query(Persona).filter(Persona.id == contacto_in.id_persona).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Persona no encontrada")
    
    # Crear objeto ContactoEmergencia
    db_contacto = ContactoEmergencia(
        nombre_contacto=contacto_in.nombre_contacto,
        telefono_contacto=contacto_in.telefono_contacto,
        parentesco=contacto_in.parentesco,
        id_persona=contacto_in.id_persona
    )
    
    db.add(db_contacto)
    db.commit()
    db.refresh(db_contacto)
    return db_contacto


@router.get("/", response_model=List[ContactoEmergenciaOut])
def read_contactos_emergencia(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    id_persona: Optional[int] = None,
    current_user = Depends(get_current_active_user)
) -> Any:
    """
    Recuperar contactos de emergencia con filtros opcionales.
    """
    query = db.query(ContactoEmergencia)
    
    # Aplicar filtros si se proporcionan
    if id_persona:
        query = query.filter(ContactoEmergencia.id_persona == id_persona)
    
    contactos = query.offset(skip).limit(limit).all()
    return contactos


@router.get("/{contacto_id}", response_model=ContactoEmergenciaOut)
def read_contacto_emergencia(
    *,
    db: Session = Depends(get_db),
    contacto_id: int,
    current_user = Depends(get_current_active_user)
) -> Any:
    """
    Obtener un contacto de emergencia por ID.
    """
    contacto = db.query(ContactoEmergencia).filter(ContactoEmergencia.id_contacto == contacto_id).first()
    if not contacto:
        raise HTTPException(status_code=404, detail="Contacto de emergencia no encontrado")
    
    return contacto


@router.put("/{contacto_id}", response_model=ContactoEmergenciaOut)
def update_contacto_emergencia(
    *,
    db: Session = Depends(get_db),
    contacto_id: int,
    contacto_in: ContactoEmergenciaUpdate,
    current_user = Depends(check_personal_role)
) -> Any:
    """
    Actualizar un contacto de emergencia.
    """
    contacto = db.query(ContactoEmergencia).filter(ContactoEmergencia.id_contacto == contacto_id).first()
    if not contacto:
        raise HTTPException(status_code=404, detail="Contacto de emergencia no encontrado")
    
    # Verificar si se está cambiando la persona y si existe
    if contacto_in.id_persona and contacto_in.id_persona != contacto.id_persona:
        persona = db.query(Persona).filter(Persona.id == contacto_in.id_persona).first()
        if not persona:
            raise HTTPException(status_code=404, detail="Persona no encontrada")
    
    # Actualizar campos si se proporcionan
    update_data = contacto_in.dict(exclude_unset=True)
    
    # Actualizar campos
    for field, value in update_data.items():
        setattr(contacto, field, value)
    
    db.add(contacto)
    db.commit()
    db.refresh(contacto)
    return contacto


@router.delete("/{contacto_id}", response_model=ContactoEmergenciaOut)
def delete_contacto_emergencia(
    *,
    db: Session = Depends(get_db),
    contacto_id: int,
    current_user = Depends(check_personal_role)
) -> Any:
    """
    Eliminar un contacto de emergencia.
    """
    contacto = db.query(ContactoEmergencia).filter(ContactoEmergencia.id_contacto == contacto_id).first()
    if not contacto:
        raise HTTPException(status_code=404, detail="Contacto de emergencia no encontrado")
    
    db.delete(contacto)
    db.commit()
    return contacto


@router.post("/bulk-create", response_model=List[ContactoEmergenciaOut])
def bulk_create_contactos_emergencia(
    *,
    db: Session = Depends(get_db),
    bulk_contactos: ContactoEmergenciaBulkCreate,
    current_user = Depends(check_admin_role)
) -> Any:
    """
    Crear múltiples contactos de emergencia en una sola operación.
    """
    created_contactos = []
    
    for contacto_data in bulk_contactos.items:
        # Verificar si la persona existe
        persona = db.query(Persona).filter(Persona.id == contacto_data.id_persona).first()
        if not persona:
            continue  # Saltar este registro si la persona no existe
        
        # Crear objeto ContactoEmergencia
        db_contacto = ContactoEmergencia(
            nombre_contacto=contacto_data.nombre_contacto,
            telefono_contacto=contacto_data.telefono_contacto,
            parentesco=contacto_data.parentesco,
            id_persona=contacto_data.id_persona
        )
        
        db.add(db_contacto)
        created_contactos.append(db_contacto)
    
    db.commit()
    
    # Refrescar todos los objetos
    for contacto in created_contactos:
        db.refresh(contacto)
    
    return created_contactos


@router.put("/bulk-update", response_model=List[ContactoEmergenciaOut])
def bulk_update_contactos_emergencia(
    *,
    db: Session = Depends(get_db),
    bulk_update: ContactoEmergenciaBulkUpdate,
    current_user = Depends(check_admin_role)
) -> Any:
    """
    Actualizar múltiples contactos de emergencia en una sola operación.
    """
    updated_contactos = []
    
    for item in bulk_update.items:
        if "id_contacto" not in item:
            continue
        
        contacto_id = item.pop("id_contacto")
        contacto = db.query(ContactoEmergencia).filter(ContactoEmergencia.id_contacto == contacto_id).first()
        
        if not contacto:
            continue
        
        # Verificar si se está cambiando la persona y si existe
        if "id_persona" in item and item["id_persona"] != contacto.id_persona:
            persona = db.query(Persona).filter(Persona.id == item["id_persona"]).first()
            if not persona:
                continue  # Saltar este registro si la persona no existe
        
        # Actualizar campos
        for field, value in item.items():
            if hasattr(contacto, field):
                setattr(contacto, field, value)
        
        db.add(contacto)
        updated_contactos.append(contacto)
    
    db.commit()
    
    # Refrescar todos los objetos
    for contacto in updated_contactos:
        db.refresh(contacto)
    
    return updated_contactos


@router.post("/bulk-delete", response_model=List[int])
def bulk_delete_contactos_emergencia(
    *,
    db: Session = Depends(get_db),
    bulk_delete: ContactoEmergenciaBulkDelete,
    current_user = Depends(check_admin_role)
) -> Any:
    """
    Eliminar múltiples contactos de emergencia en una sola operación.
    """
    deleted_ids = []
    
    for contacto_id in bulk_delete.ids:
        contacto = db.query(ContactoEmergencia).filter(ContactoEmergencia.id_contacto == contacto_id).first()
        if contacto:
            db.delete(contacto)
            deleted_ids.append(contacto_id)
    
    db.commit()
    return deleted_ids


@router.get("/search/", response_model=List[ContactoEmergenciaOut])
def search_contactos_emergencia(
    *,
    db: Session = Depends(get_db),
    q: str = Query(None, min_length=3),
    current_user = Depends(get_current_active_user)
) -> Any:
    """
    Buscar contactos de emergencia por texto en varios campos.
    """
    if not q:
        return []
    
    contactos = db.query(ContactoEmergencia).filter(
        or_(
            ContactoEmergencia.nombre_contacto.contains(q),
            ContactoEmergencia.telefono_contacto.contains(q),
            ContactoEmergencia.parentesco.contains(q)
        )
    ).all()
    
    return contactos
