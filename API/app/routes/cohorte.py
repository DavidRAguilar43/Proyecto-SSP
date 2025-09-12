from typing import Any, List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.database import get_db
from app.models.cohorte import Cohorte
from app.models.persona import Persona
from app.schemas.cohorte import (
    CohorteCreate,
    CohorteUpdate,
    CohorteOut
)
from app.utils.deps import (
    get_current_active_user,
    check_personal_role
)

router = APIRouter(prefix="/cohortes", tags=["cohortes"])

@router.post("/", response_model=CohorteOut)
def create_cohorte(
    *,
    db: Session = Depends(get_db),
    cohorte_in: CohorteCreate,
    current_user: Persona = Depends(check_personal_role)
) -> Any:
    """
    Crear una nueva cohorte.
    """
    # Verificar si ya existe una cohorte con el mismo nombre
    db_cohorte = db.query(Cohorte).filter(Cohorte.nombre == cohorte_in.nombre).first()
    if db_cohorte:
        raise HTTPException(status_code=400, detail="Ya existe una cohorte con este nombre")

    db_cohorte = Cohorte(**cohorte_in.dict())
    db.add(db_cohorte)
    db.commit()
    db.refresh(db_cohorte)
    return db_cohorte


@router.get("/", response_model=List[CohorteOut])
def read_cohortes(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    activo: Optional[bool] = None,
    current_user: Persona = Depends(get_current_active_user)
) -> Any:
    """
    Recuperar cohortes con filtros opcionales.
    """
    query = db.query(Cohorte)

    # Aplicar filtros si se proporcionan
    if activo is not None:
        query = query.filter(Cohorte.activo == activo)

    # Ordenar por nombre (más recientes primero)
    query = query.order_by(Cohorte.nombre.desc())

    cohortes = query.offset(skip).limit(limit).all()
    return cohortes


@router.get("/activas/", response_model=List[CohorteOut])
def read_cohortes_activas(
    db: Session = Depends(get_db),
    current_user: Persona = Depends(get_current_active_user)
) -> Any:
    """
    Recuperar solo cohortes activas para formularios.
    """
    cohortes = db.query(Cohorte).filter(
        Cohorte.activo == True
    ).order_by(Cohorte.nombre.desc()).all()

    return cohortes


@router.get("/generar-opciones/", response_model=List[CohorteOut])
def generar_opciones_cohortes(
    db: Session = Depends(get_db),
    current_user: Persona = Depends(check_personal_role)
) -> Any:
    """
    Generar automáticamente opciones de cohortes desde años pasados hasta futuros.
    """
    current_year = datetime.now().year
    cohortes_generadas = []

    # Generar cohortes desde 2020 hasta 2030
    for year in range(2020, 2031):
        for period in [1, 2]:
            nombre = f"{year}-{period}"
            descripcion = f"{'Primer' if period == 1 else 'Segundo'} semestre {year}"

            # Verificar si ya existe
            existing = db.query(Cohorte).filter(Cohorte.nombre == nombre).first()
            if not existing:
                cohorte = Cohorte(
                    nombre=nombre,
                    descripcion=descripcion,
                    activo=(year >= current_year - 1)  # Solo activas las del año pasado en adelante
                )
                db.add(cohorte)
                cohortes_generadas.append(cohorte)

    if cohortes_generadas:
        db.commit()
        for cohorte in cohortes_generadas:
            db.refresh(cohorte)

    return cohortes_generadas


@router.get("/search/", response_model=List[CohorteOut])
def search_cohortes(
    *,
    db: Session = Depends(get_db),
    q: str = Query(None, min_length=1),
    current_user: Persona = Depends(get_current_active_user)
) -> Any:
    """
    Buscar cohortes por texto en varios campos.
    """
    if not q:
        return []

    cohortes = db.query(Cohorte).filter(
        or_(
            Cohorte.nombre.contains(q),
            Cohorte.descripcion.contains(q)
        )
    ).order_by(Cohorte.nombre.desc()).all()

    return cohortes


@router.get("/{cohorte_id}", response_model=CohorteOut)
def read_cohorte(
    *,
    db: Session = Depends(get_db),
    cohorte_id: int,
    current_user: Persona = Depends(get_current_active_user)
) -> Any:
    """
    Obtener una cohorte por ID.
    """
    cohorte = db.query(Cohorte).filter(Cohorte.id == cohorte_id).first()
    if not cohorte:
        raise HTTPException(status_code=404, detail="Cohorte no encontrada")
    return cohorte


@router.put("/{cohorte_id}", response_model=CohorteOut)
def update_cohorte(
    *,
    db: Session = Depends(get_db),
    cohorte_id: int,
    cohorte_in: CohorteUpdate,
    current_user: Persona = Depends(check_personal_role)
) -> Any:
    """
    Actualizar una cohorte.
    """
    cohorte = db.query(Cohorte).filter(Cohorte.id == cohorte_id).first()
    if not cohorte:
        raise HTTPException(status_code=404, detail="Cohorte no encontrada")

    # Verificar nombre único si se está actualizando
    if cohorte_in.nombre and cohorte_in.nombre != cohorte.nombre:
        existing = db.query(Cohorte).filter(Cohorte.nombre == cohorte_in.nombre).first()
        if existing:
            raise HTTPException(status_code=400, detail="Ya existe una cohorte con este nombre")

    update_data = cohorte_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(cohorte, field, value)

    db.add(cohorte)
    db.commit()
    db.refresh(cohorte)
    return cohorte


@router.delete("/{cohorte_id}", response_model=CohorteOut)
def delete_cohorte(
    *,
    db: Session = Depends(get_db),
    cohorte_id: int,
    current_user: Persona = Depends(check_personal_role)
) -> Any:
    """
    Eliminar una cohorte.
    """
    cohorte = db.query(Cohorte).filter(Cohorte.id == cohorte_id).first()
    if not cohorte:
        raise HTTPException(status_code=404, detail="Cohorte no encontrada")

    # Verificar si hay personas asociadas (usando el nuevo formato de cohorte)
    # Extraer año y período del nombre de la cohorte (formato: "YYYY-P")
    try:
        cohorte_parts = cohorte.nombre.split('-')
        if len(cohorte_parts) == 2:
            cohorte_ano = int(cohorte_parts[0])
            cohorte_periodo = int(cohorte_parts[1])
            personas_count = db.query(Persona).filter(
                Persona.cohorte_ano == cohorte_ano,
                Persona.cohorte_periodo == cohorte_periodo
            ).count()
            if personas_count > 0:
                raise HTTPException(
                    status_code=400,
                    detail=f"No se puede eliminar la cohorte. Hay {personas_count} personas asociadas."
                )
    except (ValueError, IndexError):
        # Si no se puede parsear el nombre, continuar con la eliminación
        pass

    db.delete(cohorte)
    db.commit()
    return cohorte
