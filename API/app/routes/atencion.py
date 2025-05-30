from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.database import get_db
from app.models.atencion import Atencion
from app.schemas.atencion import (
    AtencionCreate, 
    AtencionUpdate, 
    AtencionOut, 
    AtencionBulkDelete, 
    AtencionBulkCreate, 
    AtencionBulkUpdate
)
from app.utils.deps import (
    get_current_active_user,
    check_admin_role,
    check_personal_role
)

router = APIRouter(prefix="/atenciones", tags=["atenciones"])


@router.post("/", response_model=AtencionOut)
def create_atencion(
    *,
    db: Session = Depends(get_db),
    atencion_in: AtencionCreate,
    current_user = Depends(check_personal_role)
) -> Any:
    """
    Crear una nueva atención.
    """
    # Crear objeto Atencion
    db_atencion = Atencion(
        fecha_atencion=atencion_in.fecha_atencion,
        motivo_psicologico=atencion_in.motivo_psicologico,
        motivo_academico=atencion_in.motivo_academico,
        salud_en_general_vulnerable=atencion_in.salud_en_general_vulnerable,
        requiere_seguimiento=atencion_in.requiere_seguimiento,
        requiere_canalizacion_externa=atencion_in.requiere_canalizacion_externa,
        estatus_canalizacion_externa=atencion_in.estatus_canalizacion_externa,
        observaciones=atencion_in.observaciones,
        fecha_proxima_sesion=atencion_in.fecha_proxima_sesion,
        atendido=atencion_in.atendido,
        ultima_fecha_contacto=atencion_in.ultima_fecha_contacto,
        id_personal=atencion_in.id_personal,
        id_persona=atencion_in.id_persona,
        id_grupo=atencion_in.id_grupo,
        id_cuestionario=atencion_in.id_cuestionario
    )
    db.add(db_atencion)
    db.commit()
    db.refresh(db_atencion)
    return db_atencion


@router.get("/", response_model=List[AtencionOut])
def read_atenciones(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    id_personal: Optional[int] = None,
    id_persona: Optional[int] = None,
    id_grupo: Optional[int] = None,
    atendido: Optional[bool] = None,
    current_user = Depends(get_current_active_user)
) -> Any:
    """
    Recuperar atenciones con filtros opcionales.
    """
    query = db.query(Atencion)
    
    # Aplicar filtros si se proporcionan
    if id_personal is not None:
        query = query.filter(Atencion.id_personal == id_personal)
    if id_persona is not None:
        query = query.filter(Atencion.id_persona == id_persona)
    if id_grupo is not None:
        query = query.filter(Atencion.id_grupo == id_grupo)
    if atendido is not None:
        query = query.filter(Atencion.atendido == atendido)
    
    atenciones = query.offset(skip).limit(limit).all()
    return atenciones


@router.get("/{atencion_id}", response_model=AtencionOut)
def read_atencion(
    *,
    db: Session = Depends(get_db),
    atencion_id: int,
    current_user = Depends(get_current_active_user)
) -> Any:
    """
    Obtener una atención por ID.
    """
    atencion = db.query(Atencion).filter(Atencion.id == atencion_id).first()
    if not atencion:
        raise HTTPException(status_code=404, detail="Atención no encontrada")
    
    return atencion


@router.put("/{atencion_id}", response_model=AtencionOut)
def update_atencion(
    *,
    db: Session = Depends(get_db),
    atencion_id: int,
    atencion_in: AtencionUpdate,
    current_user = Depends(check_personal_role)
) -> Any:
    """
    Actualizar una atención.
    """
    atencion = db.query(Atencion).filter(Atencion.id == atencion_id).first()
    if not atencion:
        raise HTTPException(status_code=404, detail="Atención no encontrada")
    
    # Actualizar campos si se proporcionan
    update_data = atencion_in.dict(exclude_unset=True)
    
    # Actualizar campos
    for field, value in update_data.items():
        setattr(atencion, field, value)
    
    db.add(atencion)
    db.commit()
    db.refresh(atencion)
    return atencion


@router.delete("/{atencion_id}", response_model=AtencionOut)
def delete_atencion(
    *,
    db: Session = Depends(get_db),
    atencion_id: int,
    current_user = Depends(check_admin_role)
) -> Any:
    """
    Eliminar una atención.
    """
    atencion = db.query(Atencion).filter(Atencion.id == atencion_id).first()
    if not atencion:
        raise HTTPException(status_code=404, detail="Atención no encontrada")
    
    db.delete(atencion)
    db.commit()
    return atencion


@router.post("/bulk-create", response_model=List[AtencionOut])
def bulk_create_atenciones(
    *,
    db: Session = Depends(get_db),
    bulk_atenciones: AtencionBulkCreate,
    current_user = Depends(check_admin_role)
) -> Any:
    """
    Crear múltiples atenciones en una sola operación.
    """
    created_atenciones = []
    
    for atencion_data in bulk_atenciones.items:
        # Crear objeto Atencion
        db_atencion = Atencion(
            fecha_atencion=atencion_data.fecha_atencion,
            motivo_psicologico=atencion_data.motivo_psicologico,
            motivo_academico=atencion_data.motivo_academico,
            salud_en_general_vulnerable=atencion_data.salud_en_general_vulnerable,
            requiere_seguimiento=atencion_data.requiere_seguimiento,
            requiere_canalizacion_externa=atencion_data.requiere_canalizacion_externa,
            estatus_canalizacion_externa=atencion_data.estatus_canalizacion_externa,
            observaciones=atencion_data.observaciones,
            fecha_proxima_sesion=atencion_data.fecha_proxima_sesion,
            atendido=atencion_data.atendido,
            ultima_fecha_contacto=atencion_data.ultima_fecha_contacto,
            id_personal=atencion_data.id_personal,
            id_persona=atencion_data.id_persona,
            id_grupo=atencion_data.id_grupo,
            id_cuestionario=atencion_data.id_cuestionario
        )
        
        db.add(db_atencion)
        created_atenciones.append(db_atencion)
    
    db.commit()
    
    # Refrescar todos los objetos
    for atencion in created_atenciones:
        db.refresh(atencion)
    
    return created_atenciones


@router.put("/bulk-update", response_model=List[AtencionOut])
def bulk_update_atenciones(
    *,
    db: Session = Depends(get_db),
    bulk_update: AtencionBulkUpdate,
    current_user = Depends(check_admin_role)
) -> Any:
    """
    Actualizar múltiples atenciones en una sola operación.
    """
    updated_atenciones = []
    
    for item in bulk_update.items:
        if "id" not in item:
            continue
        
        atencion_id = item.pop("id")
        atencion = db.query(Atencion).filter(Atencion.id == atencion_id).first()
        
        if not atencion:
            continue
        
        # Actualizar campos
        for field, value in item.items():
            if hasattr(atencion, field):
                setattr(atencion, field, value)
        
        db.add(atencion)
        updated_atenciones.append(atencion)
    
    db.commit()
    
    # Refrescar todos los objetos
    for atencion in updated_atenciones:
        db.refresh(atencion)
    
    return updated_atenciones


@router.post("/bulk-delete", response_model=List[int])
def bulk_delete_atenciones(
    *,
    db: Session = Depends(get_db),
    bulk_delete: AtencionBulkDelete,
    current_user = Depends(check_admin_role)
) -> Any:
    """
    Eliminar múltiples atenciones en una sola operación.
    """
    deleted_ids = []
    
    for atencion_id in bulk_delete.ids:
        atencion = db.query(Atencion).filter(Atencion.id == atencion_id).first()
        if atencion:
            db.delete(atencion)
            deleted_ids.append(atencion_id)
    
    db.commit()
    return deleted_ids


@router.get("/search/", response_model=List[AtencionOut])
def search_atenciones(
    *,
    db: Session = Depends(get_db),
    q: str = Query(None, min_length=3),
    current_user = Depends(get_current_active_user)
) -> Any:
    """
    Buscar atenciones por texto en varios campos.
    """
    if not q:
        return []
    
    atenciones = db.query(Atencion).filter(
        or_(
            Atencion.observaciones.contains(q),
            Atencion.estatus_canalizacion_externa.contains(q)
        )
    ).all()
    
    return atenciones
