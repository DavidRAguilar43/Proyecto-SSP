from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.database import get_db
from app.models.departamento import Departamento
from app.schemas.departamento import (
    DepartamentoCreate,
    DepartamentoUpdate,
    DepartamentoOut,
    DepartamentoBulkDelete,
    DepartamentoBulkCreate,
    DepartamentoBulkUpdate
)
from app.utils.deps import (
    get_current_active_user,
    check_admin_role,
    check_admin_or_coordinador_role
)

router = APIRouter(prefix="/departamentos", tags=["departamentos"])


@router.post("/", response_model=DepartamentoOut)
def create_departamento(
    *,
    db: Session = Depends(get_db),
    departamento_in: DepartamentoCreate,
    current_user = Depends(check_admin_or_coordinador_role)
) -> Any:
    """
    Crear un nuevo departamento (administradores y coordinadores).
    
    Args:
        db: Sesión de base de datos
        departamento_in: Datos del departamento a crear
        current_user: Usuario autenticado con rol admin o coordinador
    
    Returns:
        Departamento creado
    """
    # Verificar si ya existe un departamento con el mismo nombre
    db_departamento = db.query(Departamento).filter(Departamento.nombre == departamento_in.nombre).first()
    if db_departamento:
        raise HTTPException(
            status_code=400,
            detail="Ya existe un departamento con este nombre"
        )

    # Crear objeto Departamento
    db_departamento = Departamento(
        nombre=departamento_in.nombre,
        activo=departamento_in.activo
    )

    db.add(db_departamento)
    db.commit()
    db.refresh(db_departamento)
    return db_departamento


@router.get("/publico/", response_model=List[DepartamentoOut])
def read_departamentos_publico(
    db: Session = Depends(get_db)
) -> Any:
    """
    Recuperar todos los departamentos activos (endpoint público sin autenticación).
    Ordenados alfabéticamente por nombre.
    
    Args:
        db: Sesión de base de datos
    
    Returns:
        Lista de departamentos activos ordenados alfabéticamente
    """
    departamentos = db.query(Departamento).filter(
        Departamento.activo == True
    ).order_by(Departamento.nombre).all()
    return departamentos


@router.get("/", response_model=List[DepartamentoOut])
def read_departamentos(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(get_current_active_user)
) -> Any:
    """
    Recuperar departamentos.
    
    Args:
        db: Sesión de base de datos
        skip: Número de registros a saltar
        limit: Número máximo de registros a devolver
        current_user: Usuario autenticado
    
    Returns:
        Lista de departamentos
    """
    departamentos = db.query(Departamento).offset(skip).limit(limit).all()
    return departamentos


@router.get("/{departamento_id}", response_model=DepartamentoOut)
def read_departamento(
    *,
    db: Session = Depends(get_db),
    departamento_id: int,
    current_user = Depends(get_current_active_user)
) -> Any:
    """
    Obtener departamento por ID.
    
    Args:
        db: Sesión de base de datos
        departamento_id: ID del departamento
        current_user: Usuario autenticado
    
    Returns:
        Departamento encontrado
    """
    departamento = db.query(Departamento).filter(Departamento.id == departamento_id).first()
    if not departamento:
        raise HTTPException(status_code=404, detail="Departamento no encontrado")
    return departamento


@router.put("/{departamento_id}", response_model=DepartamentoOut)
def update_departamento(
    *,
    db: Session = Depends(get_db),
    departamento_id: int,
    departamento_in: DepartamentoUpdate,
    current_user = Depends(check_admin_or_coordinador_role)
) -> Any:
    """
    Actualizar un departamento (administradores y coordinadores).
    
    Args:
        db: Sesión de base de datos
        departamento_id: ID del departamento a actualizar
        departamento_in: Datos actualizados del departamento
        current_user: Usuario autenticado con rol admin o coordinador
    
    Returns:
        Departamento actualizado
    """
    departamento = db.query(Departamento).filter(Departamento.id == departamento_id).first()
    if not departamento:
        raise HTTPException(status_code=404, detail="Departamento no encontrado")

    # Verificar si el nuevo nombre ya existe (si se está cambiando)
    if departamento_in.nombre and departamento_in.nombre != departamento.nombre:
        existing_departamento = db.query(Departamento).filter(Departamento.nombre == departamento_in.nombre).first()
        if existing_departamento:
            raise HTTPException(
                status_code=400,
                detail="Ya existe un departamento con este nombre"
            )

    # Actualizar campos
    update_data = departamento_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(departamento, field, value)

    db.add(departamento)
    db.commit()
    db.refresh(departamento)
    return departamento


@router.delete("/{departamento_id}")
def delete_departamento(
    *,
    db: Session = Depends(get_db),
    departamento_id: int,
    current_user = Depends(check_admin_role)
) -> Any:
    """
    Eliminar un departamento.
    
    Args:
        db: Sesión de base de datos
        departamento_id: ID del departamento a eliminar
        current_user: Usuario autenticado con rol admin
    
    Returns:
        Mensaje de confirmación
    """
    departamento = db.query(Departamento).filter(Departamento.id == departamento_id).first()
    if not departamento:
        raise HTTPException(status_code=404, detail="Departamento no encontrado")

    db.delete(departamento)
    db.commit()
    return {"message": "Departamento eliminado exitosamente"}


@router.post("/bulk-create/", response_model=List[DepartamentoOut])
def bulk_create_departamentos(
    *,
    db: Session = Depends(get_db),
    departamentos_in: DepartamentoBulkCreate,
    current_user = Depends(check_admin_or_coordinador_role)
) -> Any:
    """
    Crear múltiples departamentos (administradores y coordinadores).
    
    Args:
        db: Sesión de base de datos
        departamentos_in: Lista de departamentos a crear
        current_user: Usuario autenticado con rol admin o coordinador
    
    Returns:
        Lista de departamentos creados
    """
    created_departamentos = []
    for departamento_data in departamentos_in.items:
        # Verificar si ya existe
        existing = db.query(Departamento).filter(Departamento.nombre == departamento_data.nombre).first()
        if existing:
            continue  # Saltar duplicados

        db_departamento = Departamento(**departamento_data.model_dump())
        db.add(db_departamento)
        created_departamentos.append(db_departamento)

    db.commit()
    for departamento in created_departamentos:
        db.refresh(departamento)

    return created_departamentos


@router.put("/bulk-update/", response_model=List[DepartamentoOut])
def bulk_update_departamentos(
    *,
    db: Session = Depends(get_db),
    departamentos_in: DepartamentoBulkUpdate,
    current_user = Depends(check_admin_or_coordinador_role)
) -> Any:
    """
    Actualizar múltiples departamentos (administradores y coordinadores).
    
    Args:
        db: Sesión de base de datos
        departamentos_in: Lista de departamentos a actualizar
        current_user: Usuario autenticado con rol admin o coordinador
    
    Returns:
        Lista de departamentos actualizados
    """
    updated_departamentos = []
    for item in departamentos_in.items:
        departamento_id = item.get('id')
        if not departamento_id:
            continue

        departamento = db.query(Departamento).filter(Departamento.id == departamento_id).first()
        if not departamento:
            continue

        # Actualizar campos
        for field, value in item.items():
            if field != 'id' and hasattr(departamento, field):
                setattr(departamento, field, value)

        db.add(departamento)
        updated_departamentos.append(departamento)

    db.commit()
    for departamento in updated_departamentos:
        db.refresh(departamento)

    return updated_departamentos


@router.post("/bulk-delete/")
def bulk_delete_departamentos(
    *,
    db: Session = Depends(get_db),
    departamentos_in: DepartamentoBulkDelete,
    current_user = Depends(check_admin_role)
) -> Any:
    """
    Eliminar múltiples departamentos.
    
    Args:
        db: Sesión de base de datos
        departamentos_in: Lista de IDs de departamentos a eliminar
        current_user: Usuario autenticado con rol admin
    
    Returns:
        Mensaje de confirmación con número de departamentos eliminados
    """
    deleted_count = 0
    for departamento_id in departamentos_in.ids:
        departamento = db.query(Departamento).filter(Departamento.id == departamento_id).first()
        if departamento:
            db.delete(departamento)
            deleted_count += 1

    db.commit()
    return {"message": f"{deleted_count} departamentos eliminados exitosamente"}


@router.get("/search/", response_model=List[DepartamentoOut])
def search_departamentos(
    *,
    db: Session = Depends(get_db),
    q: str = Query(None, min_length=3),
    current_user = Depends(get_current_active_user)
) -> Any:
    """
    Buscar departamentos por texto en el nombre.
    
    Args:
        db: Sesión de base de datos
        q: Texto de búsqueda (mínimo 3 caracteres)
        current_user: Usuario autenticado
    
    Returns:
        Lista de departamentos que coinciden con la búsqueda
    """
    if not q:
        return []

    departamentos = db.query(Departamento).filter(
        Departamento.nombre.contains(q)
    ).all()

    return departamentos

