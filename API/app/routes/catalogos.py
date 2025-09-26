from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.database import get_db
from app.models.religion import Religion
from app.models.grupo_etnico import GrupoEtnico
from app.models.discapacidad import Discapacidad
from app.models.persona import Persona
from app.schemas.catalogos import (
    ReligionCreate, ReligionUpdate, ReligionOut, ReligionBulkDelete,
    GrupoEtnicoCreate, GrupoEtnicoUpdate, GrupoEtnicoOut, GrupoEtnicoBulkDelete,
    DiscapacidadCreate, DiscapacidadUpdate, DiscapacidadOut, DiscapacidadBulkDelete,
    ElementosPendientes, ElementoPersonalizado
)
from app.utils.deps import (
    get_current_active_user,
    check_admin_role,
    check_coordinador_role,
    check_admin_or_coordinador_role,
    check_deletion_permission
)

router = APIRouter(prefix="/catalogos", tags=["catalogos"])


# ==================== RELIGIONES ====================

@router.post("/religiones/", response_model=ReligionOut)
def create_religion(
    *,
    db: Session = Depends(get_db),
    religion_in: ReligionCreate,
    current_user: Persona = Depends(check_admin_or_coordinador_role)
) -> Any:
    """
    Crear una nueva religión (administradores y coordinadores).
    """
    # Verificar si ya existe
    db_religion = db.query(Religion).filter(Religion.titulo == religion_in.titulo).first()
    if db_religion:
        raise HTTPException(status_code=400, detail="Ya existe una religión con este título")

    db_religion = Religion(**religion_in.dict())
    db.add(db_religion)
    db.commit()
    db.refresh(db_religion)
    return db_religion


@router.get("/religiones/", response_model=List[ReligionOut])
def read_religiones(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    activo: Optional[bool] = None,
    current_user: Persona = Depends(get_current_active_user)
) -> Any:
    """
    Obtener lista de religiones.
    """
    query = db.query(Religion)
    if activo is not None:
        query = query.filter(Religion.activo == activo)
    
    religiones = query.offset(skip).limit(limit).all()
    return religiones


@router.get("/religiones/activas/", response_model=List[ReligionOut])
def read_religiones_activas(
    db: Session = Depends(get_db)
) -> Any:
    """
    Obtener solo religiones activas (sin autenticación para formularios públicos).
    """
    religiones = db.query(Religion).filter(Religion.activo == True).all()
    return religiones


@router.put("/religiones/{religion_id}", response_model=ReligionOut)
def update_religion(
    *,
    db: Session = Depends(get_db),
    religion_id: int,
    religion_in: ReligionUpdate,
    current_user: Persona = Depends(check_admin_or_coordinador_role)
) -> Any:
    """
    Actualizar una religión (administradores y coordinadores).
    """
    religion = db.query(Religion).filter(Religion.id == religion_id).first()
    if not religion:
        raise HTTPException(status_code=404, detail="Religión no encontrada")

    # Verificar título único si se está actualizando
    if religion_in.titulo and religion_in.titulo != religion.titulo:
        existing = db.query(Religion).filter(Religion.titulo == religion_in.titulo).first()
        if existing:
            raise HTTPException(status_code=400, detail="Ya existe una religión con este título")

    update_data = religion_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(religion, field, value)

    db.commit()
    db.refresh(religion)
    return religion


@router.delete("/religiones/{religion_id}")
def delete_religion(
    *,
    db: Session = Depends(get_db),
    religion_id: int,
    current_user: Persona = Depends(check_deletion_permission)
) -> Any:
    """
    Eliminar una religión (solo administradores - coordinadores NO pueden eliminar).
    """
    religion = db.query(Religion).filter(Religion.id == religion_id).first()
    if not religion:
        raise HTTPException(status_code=404, detail="Religión no encontrada")

    db.delete(religion)
    db.commit()
    return {"message": "Religión eliminada exitosamente"}


# ==================== GRUPOS ÉTNICOS ====================

@router.post("/grupos-etnicos/", response_model=GrupoEtnicoOut)
def create_grupo_etnico(
    *,
    db: Session = Depends(get_db),
    grupo_etnico_in: GrupoEtnicoCreate,
    current_user: Persona = Depends(check_admin_or_coordinador_role)
) -> Any:
    """
    Crear un nuevo grupo étnico (administradores y coordinadores).
    """
    # Verificar si ya existe
    db_grupo = db.query(GrupoEtnico).filter(GrupoEtnico.titulo == grupo_etnico_in.titulo).first()
    if db_grupo:
        raise HTTPException(status_code=400, detail="Ya existe un grupo étnico con este título")

    db_grupo = GrupoEtnico(**grupo_etnico_in.dict())
    db.add(db_grupo)
    db.commit()
    db.refresh(db_grupo)
    return db_grupo


@router.get("/grupos-etnicos/", response_model=List[GrupoEtnicoOut])
def read_grupos_etnicos(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    activo: Optional[bool] = None,
    current_user: Persona = Depends(get_current_active_user)
) -> Any:
    """
    Obtener lista de grupos étnicos.
    """
    query = db.query(GrupoEtnico)
    if activo is not None:
        query = query.filter(GrupoEtnico.activo == activo)
    
    grupos = query.offset(skip).limit(limit).all()
    return grupos


@router.get("/grupos-etnicos/activos/", response_model=List[GrupoEtnicoOut])
def read_grupos_etnicos_activos(
    db: Session = Depends(get_db)
) -> Any:
    """
    Obtener solo grupos étnicos activos (sin autenticación para formularios públicos).
    """
    grupos = db.query(GrupoEtnico).filter(GrupoEtnico.activo == True).all()
    return grupos


@router.put("/grupos-etnicos/{grupo_id}", response_model=GrupoEtnicoOut)
def update_grupo_etnico(
    *,
    db: Session = Depends(get_db),
    grupo_id: int,
    grupo_etnico_in: GrupoEtnicoUpdate,
    current_user: Persona = Depends(check_admin_or_coordinador_role)
) -> Any:
    """
    Actualizar un grupo étnico (administradores y coordinadores).
    """
    grupo = db.query(GrupoEtnico).filter(GrupoEtnico.id == grupo_id).first()
    if not grupo:
        raise HTTPException(status_code=404, detail="Grupo étnico no encontrado")

    # Verificar título único si se está actualizando
    if grupo_etnico_in.titulo and grupo_etnico_in.titulo != grupo.titulo:
        existing = db.query(GrupoEtnico).filter(GrupoEtnico.titulo == grupo_etnico_in.titulo).first()
        if existing:
            raise HTTPException(status_code=400, detail="Ya existe un grupo étnico con este título")

    update_data = grupo_etnico_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(grupo, field, value)

    db.commit()
    db.refresh(grupo)
    return grupo


@router.delete("/grupos-etnicos/{grupo_id}")
def delete_grupo_etnico(
    *,
    db: Session = Depends(get_db),
    grupo_id: int,
    current_user: Persona = Depends(check_deletion_permission)
) -> Any:
    """
    Eliminar un grupo étnico (solo administradores - coordinadores NO pueden eliminar).
    """
    grupo = db.query(GrupoEtnico).filter(GrupoEtnico.id == grupo_id).first()
    if not grupo:
        raise HTTPException(status_code=404, detail="Grupo étnico no encontrado")

    db.delete(grupo)
    db.commit()
    return {"message": "Grupo étnico eliminado exitosamente"}


# ==================== DISCAPACIDADES ====================

@router.post("/discapacidades/", response_model=DiscapacidadOut)
def create_discapacidad(
    *,
    db: Session = Depends(get_db),
    discapacidad_in: DiscapacidadCreate,
    current_user: Persona = Depends(check_admin_or_coordinador_role)
) -> Any:
    """
    Crear una nueva discapacidad (administradores y coordinadores).
    """
    # Verificar si ya existe
    db_discapacidad = db.query(Discapacidad).filter(Discapacidad.titulo == discapacidad_in.titulo).first()
    if db_discapacidad:
        raise HTTPException(status_code=400, detail="Ya existe una discapacidad con este título")

    db_discapacidad = Discapacidad(**discapacidad_in.dict())
    db.add(db_discapacidad)
    db.commit()
    db.refresh(db_discapacidad)
    return db_discapacidad


@router.get("/discapacidades/", response_model=List[DiscapacidadOut])
def read_discapacidades(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    activo: Optional[bool] = None,
    current_user: Persona = Depends(get_current_active_user)
) -> Any:
    """
    Obtener lista de discapacidades.
    """
    query = db.query(Discapacidad)
    if activo is not None:
        query = query.filter(Discapacidad.activo == activo)
    
    discapacidades = query.offset(skip).limit(limit).all()
    return discapacidades


@router.get("/discapacidades/activas/", response_model=List[DiscapacidadOut])
def read_discapacidades_activas(
    db: Session = Depends(get_db)
) -> Any:
    """
    Obtener solo discapacidades activas (sin autenticación para formularios públicos).
    """
    discapacidades = db.query(Discapacidad).filter(Discapacidad.activo == True).all()
    return discapacidades


@router.put("/discapacidades/{discapacidad_id}", response_model=DiscapacidadOut)
def update_discapacidad(
    *,
    db: Session = Depends(get_db),
    discapacidad_id: int,
    discapacidad_in: DiscapacidadUpdate,
    current_user: Persona = Depends(check_admin_or_coordinador_role)
) -> Any:
    """
    Actualizar una discapacidad (administradores y coordinadores).
    """
    discapacidad = db.query(Discapacidad).filter(Discapacidad.id == discapacidad_id).first()
    if not discapacidad:
        raise HTTPException(status_code=404, detail="Discapacidad no encontrada")

    # Verificar título único si se está actualizando
    if discapacidad_in.titulo and discapacidad_in.titulo != discapacidad.titulo:
        existing = db.query(Discapacidad).filter(Discapacidad.titulo == discapacidad_in.titulo).first()
        if existing:
            raise HTTPException(status_code=400, detail="Ya existe una discapacidad con este título")

    update_data = discapacidad_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(discapacidad, field, value)

    db.commit()
    db.refresh(discapacidad)
    return discapacidad


@router.delete("/discapacidades/{discapacidad_id}")
def delete_discapacidad(
    *,
    db: Session = Depends(get_db),
    discapacidad_id: int,
    current_user: Persona = Depends(check_deletion_permission)
) -> Any:
    """
    Eliminar una discapacidad (solo administradores - coordinadores NO pueden eliminar).
    """
    discapacidad = db.query(Discapacidad).filter(Discapacidad.id == discapacidad_id).first()
    if not discapacidad:
        raise HTTPException(status_code=404, detail="Discapacidad no encontrada")

    db.delete(discapacidad)
    db.commit()
    return {"message": "Discapacidad eliminada exitosamente"}


# ==================== ENDPOINTS ESPECIALES ====================

@router.get("/pendientes/", response_model=ElementosPendientes)
def get_elementos_pendientes(
    db: Session = Depends(get_db),
    current_user: Persona = Depends(check_admin_or_coordinador_role)
) -> Any:
    """
    Obtener todos los elementos pendientes de activación (administradores y coordinadores).
    """
    religiones_pendientes = db.query(Religion).filter(Religion.activo == False).all()
    grupos_pendientes = db.query(GrupoEtnico).filter(GrupoEtnico.activo == False).all()
    discapacidades_pendientes = db.query(Discapacidad).filter(Discapacidad.activo == False).all()

    total = len(religiones_pendientes) + len(grupos_pendientes) + len(discapacidades_pendientes)

    return ElementosPendientes(
        religiones=religiones_pendientes,
        grupos_etnicos=grupos_pendientes,
        discapacidades=discapacidades_pendientes,
        total=total
    )


@router.post("/elemento-personalizado/")
def create_elemento_personalizado(
    *,
    db: Session = Depends(get_db),
    elemento_in: ElementoPersonalizado
) -> Any:
    """
    Crear elemento personalizado desde formulario (sin autenticación).
    Se crea como inactivo para revisión del administrador.
    Validación case-insensitive y sin espacios.
    """
    try:
        # Normalizar el título: trim y lowercase para comparación
        titulo_normalizado = elemento_in.titulo.strip().lower()
        titulo_original = elemento_in.titulo.strip()

        if not titulo_original:
            raise HTTPException(status_code=400, detail="El título no puede estar vacío")

        if elemento_in.tipo_catalogo == "religion":
            # Verificar si ya existe (case-insensitive)
            existing = db.query(Religion).filter(
                Religion.titulo.ilike(f"%{titulo_normalizado}%")
            ).first()

            # Verificación más estricta: comparar títulos normalizados exactamente
            if existing and existing.titulo.strip().lower() == titulo_normalizado:
                return {
                    "message": "El elemento ya existe",
                    "id": existing.id,
                    "activo": existing.activo,
                    "elemento_existente": existing.titulo
                }

            # Crear nuevo elemento inactivo
            nuevo_elemento = Religion(titulo=titulo_original, activo=False)
            db.add(nuevo_elemento)

        elif elemento_in.tipo_catalogo == "grupo_etnico":
            # Verificar si ya existe (case-insensitive)
            existing = db.query(GrupoEtnico).filter(
                GrupoEtnico.titulo.ilike(f"%{titulo_normalizado}%")
            ).first()

            # Verificación más estricta: comparar títulos normalizados exactamente
            if existing and existing.titulo.strip().lower() == titulo_normalizado:
                return {
                    "message": "El elemento ya existe",
                    "id": existing.id,
                    "activo": existing.activo,
                    "elemento_existente": existing.titulo
                }

            # Crear nuevo elemento inactivo
            nuevo_elemento = GrupoEtnico(titulo=titulo_original, activo=False)
            db.add(nuevo_elemento)

        elif elemento_in.tipo_catalogo == "discapacidad":
            # Verificar si ya existe (case-insensitive)
            existing = db.query(Discapacidad).filter(
                Discapacidad.titulo.ilike(f"%{titulo_normalizado}%")
            ).first()

            # Verificación más estricta: comparar títulos normalizados exactamente
            if existing and existing.titulo.strip().lower() == titulo_normalizado:
                return {
                    "message": "El elemento ya existe",
                    "id": existing.id,
                    "activo": existing.activo,
                    "elemento_existente": existing.titulo
                }

            # Crear nuevo elemento inactivo
            nuevo_elemento = Discapacidad(titulo=titulo_original, activo=False)
            db.add(nuevo_elemento)

        db.commit()
        db.refresh(nuevo_elemento)

        return {
            "message": "Elemento creado exitosamente y enviado para revisión",
            "id": nuevo_elemento.id,
            "activo": nuevo_elemento.activo,
            "titulo": nuevo_elemento.titulo
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al crear elemento: {str(e)}")


@router.post("/activar-multiples/")
def activar_elementos_multiples(
    *,
    db: Session = Depends(get_db),
    elementos: dict,  # {"religiones": [1,2], "grupos_etnicos": [3,4], "discapacidades": [5,6]}
    current_user: Persona = Depends(check_admin_or_coordinador_role)
) -> Any:
    """
    Activar múltiples elementos de diferentes catálogos (administradores y coordinadores).
    """
    activados = {"religiones": 0, "grupos_etnicos": 0, "discapacidades": 0}

    try:
        # Activar religiones
        if "religiones" in elementos and elementos["religiones"]:
            religiones = db.query(Religion).filter(Religion.id.in_(elementos["religiones"])).all()
            for religion in religiones:
                religion.activo = True
                activados["religiones"] += 1

        # Activar grupos étnicos
        if "grupos_etnicos" in elementos and elementos["grupos_etnicos"]:
            grupos = db.query(GrupoEtnico).filter(GrupoEtnico.id.in_(elementos["grupos_etnicos"])).all()
            for grupo in grupos:
                grupo.activo = True
                activados["grupos_etnicos"] += 1

        # Activar discapacidades
        if "discapacidades" in elementos and elementos["discapacidades"]:
            discapacidades = db.query(Discapacidad).filter(Discapacidad.id.in_(elementos["discapacidades"])).all()
            for discapacidad in discapacidades:
                discapacidad.activo = True
                activados["discapacidades"] += 1

        db.commit()

        total_activados = sum(activados.values())
        return {
            "message": f"Se activaron {total_activados} elementos exitosamente",
            "detalle": activados
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al activar elementos: {str(e)}")


# ==================== BULK DELETE ENDPOINTS ====================

@router.post("/religiones/bulk-delete", response_model=List[int])
def bulk_delete_religiones(
    *,
    db: Session = Depends(get_db),
    bulk_delete: ReligionBulkDelete,
    current_user: Persona = Depends(check_admin_role)
) -> Any:
    """
    Eliminar múltiples religiones en una sola operación (solo administradores).
    """
    deleted_ids = []

    for religion_id in bulk_delete.ids:
        religion = db.query(Religion).filter(Religion.id == religion_id).first()
        if religion:
            db.delete(religion)
            deleted_ids.append(religion_id)

    db.commit()
    return deleted_ids


@router.post("/grupos-etnicos/bulk-delete", response_model=List[int])
def bulk_delete_grupos_etnicos(
    *,
    db: Session = Depends(get_db),
    bulk_delete: GrupoEtnicoBulkDelete,
    current_user: Persona = Depends(check_admin_role)
) -> Any:
    """
    Eliminar múltiples grupos étnicos en una sola operación (solo administradores).
    """
    deleted_ids = []

    for grupo_id in bulk_delete.ids:
        grupo = db.query(GrupoEtnico).filter(GrupoEtnico.id == grupo_id).first()
        if grupo:
            db.delete(grupo)
            deleted_ids.append(grupo_id)

    db.commit()
    return deleted_ids


@router.post("/discapacidades/bulk-delete", response_model=List[int])
def bulk_delete_discapacidades(
    *,
    db: Session = Depends(get_db),
    bulk_delete: DiscapacidadBulkDelete,
    current_user: Persona = Depends(check_admin_role)
) -> Any:
    """
    Eliminar múltiples discapacidades en una sola operación (solo administradores).
    """
    deleted_ids = []

    for discapacidad_id in bulk_delete.ids:
        discapacidad = db.query(Discapacidad).filter(Discapacidad.id == discapacidad_id).first()
        if discapacidad:
            db.delete(discapacidad)
            deleted_ids.append(discapacidad_id)

    db.commit()
    return deleted_ids
