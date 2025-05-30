from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.security import get_password_hash
from app.db.database import get_db
from app.models.persona import Persona
from app.models.programa_educativo import ProgramaEducativo
from app.models.grupo import Grupo
from app.schemas.persona import (
    PersonaCreate,
    PersonaUpdate,
    PersonaOut,
    PersonaBulkDelete,
    PersonaBulkCreate,
    PersonaBulkUpdate
)
from app.utils.deps import (
    get_current_active_user,
    check_admin_role,
    check_personal_role
)

router = APIRouter(prefix="/personas", tags=["personas"])


@router.post("/", response_model=PersonaOut)
def create_persona(
    *,
    db: Session = Depends(get_db),
    persona_in: PersonaCreate,
    current_user: Persona = Depends(check_personal_role)
) -> Any:
    """
    Crear una nueva persona.
    """
    # Verificar si ya existe una persona con el mismo correo o matrícula
    db_persona = db.query(Persona).filter(
        or_(
            Persona.correo_institucional == persona_in.correo_institucional,
            Persona.matricula == persona_in.matricula if persona_in.matricula else False
        )
    ).first()
    if db_persona:
        raise HTTPException(
            status_code=400,
            detail="Ya existe una persona con este correo o matrícula"
        )

    # Crear objeto Persona
    db_persona = Persona(
        tipo_persona=persona_in.tipo_persona,
        sexo=persona_in.sexo,
        genero=persona_in.genero,
        edad=persona_in.edad,
        estado_civil=persona_in.estado_civil,
        religion=persona_in.religion,
        trabaja=persona_in.trabaja,
        lugar_trabajo=persona_in.lugar_trabajo,
        lugar_origen=persona_in.lugar_origen,
        colonia_residencia_actual=persona_in.colonia_residencia_actual,
        celular=persona_in.celular,
        correo_institucional=persona_in.correo_institucional,
        discapacidad=persona_in.discapacidad,
        observaciones=persona_in.observaciones,
        matricula=persona_in.matricula,
        semestre=persona_in.semestre,
        numero_hijos=persona_in.numero_hijos,
        grupo_etnico=persona_in.grupo_etnico,
        rol=persona_in.rol,
        hashed_password=get_password_hash(persona_in.password)
    )

    # Agregar programas educativos
    if persona_in.programas_ids:
        programas = db.query(ProgramaEducativo).filter(
            ProgramaEducativo.id.in_(persona_in.programas_ids)
        ).all()
        db_persona.programas = programas

    # Agregar grupos
    if persona_in.grupos_ids:
        grupos = db.query(Grupo).filter(
            Grupo.id.in_(persona_in.grupos_ids)
        ).all()
        db_persona.grupos = grupos

    db.add(db_persona)
    db.commit()
    db.refresh(db_persona)
    return db_persona


@router.get("/", response_model=List[PersonaOut])
def read_personas(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    tipo_persona: Optional[str] = None,
    rol: Optional[str] = None,
    current_user: Persona = Depends(get_current_active_user)
) -> Any:
    """
    Recuperar personas con filtros opcionales.
    """
    query = db.query(Persona)

    # Aplicar filtros si se proporcionan
    if tipo_persona:
        query = query.filter(Persona.tipo_persona == tipo_persona)
    if rol:
        query = query.filter(Persona.rol == rol)

    personas = query.offset(skip).limit(limit).all()
    return personas


@router.get("/{persona_id}", response_model=PersonaOut)
def read_persona(
    *,
    db: Session = Depends(get_db),
    persona_id: int,
    current_user: Persona = Depends(get_current_active_user)
) -> Any:
    """
    Obtener una persona por ID.
    """
    persona = db.query(Persona).filter(Persona.id == persona_id).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Persona no encontrada")

    # Si no es admin o personal, solo puede ver su propia información
    if current_user.rol not in ["admin", "personal"] and current_user.id != persona_id:
        raise HTTPException(status_code=403, detail="No tiene permisos para ver esta información")

    return persona


@router.put("/{persona_id}", response_model=PersonaOut)
def update_persona(
    *,
    db: Session = Depends(get_db),
    persona_id: int,
    persona_in: PersonaUpdate,
    current_user: Persona = Depends(get_current_active_user)
) -> Any:
    """
    Actualizar una persona.
    """
    persona = db.query(Persona).filter(Persona.id == persona_id).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Persona no encontrada")

    # Verificar permisos: solo admin/personal pueden modificar cualquier usuario
    # Los demás solo pueden modificar su propia información
    if current_user.rol not in ["admin", "personal"] and current_user.id != persona_id:
        raise HTTPException(status_code=403, detail="No tiene permisos para modificar esta información")

    # Actualizar campos si se proporcionan
    update_data = persona_in.dict(exclude_unset=True)

    # Manejar la contraseña por separado
    if "password" in update_data:
        hashed_password = get_password_hash(update_data["password"])
        del update_data["password"]
        setattr(persona, "hashed_password", hashed_password)

    # Manejar programas_ids por separado
    if "programas_ids" in update_data:
        programas_ids = update_data.pop("programas_ids")
        if programas_ids is not None:
            programas = db.query(ProgramaEducativo).filter(
                ProgramaEducativo.id.in_(programas_ids)
            ).all()
            persona.programas = programas

    # Manejar grupos_ids por separado
    if "grupos_ids" in update_data:
        grupos_ids = update_data.pop("grupos_ids")
        if grupos_ids is not None:
            grupos = db.query(Grupo).filter(
                Grupo.id.in_(grupos_ids)
            ).all()
            persona.grupos = grupos

    # Actualizar el resto de campos
    for field, value in update_data.items():
        setattr(persona, field, value)

    db.add(persona)
    db.commit()
    db.refresh(persona)
    return persona


@router.delete("/{persona_id}", response_model=PersonaOut)
def delete_persona(
    *,
    db: Session = Depends(get_db),
    persona_id: int,
    current_user: Persona = Depends(check_personal_role)
) -> Any:
    """
    Eliminar una persona.
    """
    persona = db.query(Persona).filter(Persona.id == persona_id).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Persona no encontrada")

    # Limpiar relaciones antes de eliminar
    persona.programas.clear()
    persona.grupos.clear()

    # Eliminar registros relacionados
    if persona.personal:
        db.delete(persona.personal)

    # Eliminar contactos de emergencia
    for contacto in persona.contactos_emergencia:
        db.delete(contacto)

    # Eliminar atenciones
    for atencion in persona.atenciones:
        db.delete(atencion)

    db.delete(persona)
    db.commit()
    return persona


@router.post("/bulk-create", response_model=List[PersonaOut])
def bulk_create_personas(
    *,
    db: Session = Depends(get_db),
    bulk_personas: PersonaBulkCreate,
    current_user: Persona = Depends(check_admin_role)
) -> Any:
    """
    Crear múltiples personas en una sola operación.
    """
    created_personas = []

    for persona_data in bulk_personas.items:
        # Verificar si ya existe una persona con el mismo correo o matrícula
        db_persona = db.query(Persona).filter(
            or_(
                Persona.correo_institucional == persona_data.correo_institucional,
                Persona.matricula == persona_data.matricula if persona_data.matricula else False
            )
        ).first()

        if db_persona:
            continue  # Saltar este registro si ya existe

        # Crear objeto Persona
        db_persona = Persona(
            tipo_persona=persona_data.tipo_persona,
            sexo=persona_data.sexo,
            genero=persona_data.genero,
            edad=persona_data.edad,
            estado_civil=persona_data.estado_civil,
            religion=persona_data.religion,
            trabaja=persona_data.trabaja,
            lugar_trabajo=persona_data.lugar_trabajo,
            lugar_origen=persona_data.lugar_origen,
            colonia_residencia_actual=persona_data.colonia_residencia_actual,
            celular=persona_data.celular,
            correo_institucional=persona_data.correo_institucional,
            discapacidad=persona_data.discapacidad,
            observaciones=persona_data.observaciones,
            matricula=persona_data.matricula,
            semestre=persona_data.semestre,
            numero_hijos=persona_data.numero_hijos,
            grupo_etnico=persona_data.grupo_etnico,
            rol=persona_data.rol,
            hashed_password=get_password_hash(persona_data.password)
        )

        # Agregar programas educativos
        if persona_data.programas_ids:
            programas = db.query(ProgramaEducativo).filter(
                ProgramaEducativo.id.in_(persona_data.programas_ids)
            ).all()
            db_persona.programas = programas

        # Agregar grupos
        if persona_data.grupos_ids:
            grupos = db.query(Grupo).filter(
                Grupo.id.in_(persona_data.grupos_ids)
            ).all()
            db_persona.grupos = grupos

        db.add(db_persona)
        created_personas.append(db_persona)

    db.commit()

    # Refrescar todos los objetos
    for persona in created_personas:
        db.refresh(persona)

    return created_personas


@router.put("/bulk-update", response_model=List[PersonaOut])
def bulk_update_personas(
    *,
    db: Session = Depends(get_db),
    bulk_update: PersonaBulkUpdate,
    current_user: Persona = Depends(check_admin_role)
) -> Any:
    """
    Actualizar múltiples personas en una sola operación.
    """
    updated_personas = []

    for item in bulk_update.items:
        if "id" not in item:
            continue

        persona_id = item.pop("id")
        persona = db.query(Persona).filter(Persona.id == persona_id).first()

        if not persona:
            continue

        # Manejar la contraseña por separado
        if "password" in item:
            hashed_password = get_password_hash(item["password"])
            del item["password"]
            setattr(persona, "hashed_password", hashed_password)

        # Manejar programas_ids por separado
        if "programas_ids" in item:
            programas_ids = item.pop("programas_ids")
            if programas_ids is not None:
                programas = db.query(ProgramaEducativo).filter(
                    ProgramaEducativo.id.in_(programas_ids)
                ).all()
                persona.programas = programas

        # Manejar grupos_ids por separado
        if "grupos_ids" in item:
            grupos_ids = item.pop("grupos_ids")
            if grupos_ids is not None:
                grupos = db.query(Grupo).filter(
                    Grupo.id.in_(grupos_ids)
                ).all()
                persona.grupos = grupos

        # Actualizar el resto de campos
        for field, value in item.items():
            if hasattr(persona, field):
                setattr(persona, field, value)

        db.add(persona)
        updated_personas.append(persona)

    db.commit()

    # Refrescar todos los objetos
    for persona in updated_personas:
        db.refresh(persona)

    return updated_personas


@router.post("/bulk-delete", response_model=List[int])
def bulk_delete_personas(
    *,
    db: Session = Depends(get_db),
    bulk_delete: PersonaBulkDelete,
    current_user: Persona = Depends(check_admin_role)
) -> Any:
    """
    Eliminar múltiples personas en una sola operación.
    """
    deleted_ids = []

    for persona_id in bulk_delete.ids:
        persona = db.query(Persona).filter(Persona.id == persona_id).first()
        if persona:
            db.delete(persona)
            deleted_ids.append(persona_id)

    db.commit()
    return deleted_ids


@router.get("/list/estudiantes", response_model=List[PersonaOut])
def get_estudiantes(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: Persona = Depends(get_current_active_user)
) -> Any:
    """
    Obtener solo estudiantes/alumnos para atenciones.
    """
    estudiantes = db.query(Persona).filter(
        Persona.tipo_persona == "alumno"
    ).offset(skip).limit(limit).all()
    
    # Debug: Imprimir estudiantes encontrados
    print(f"Estudiantes encontrados: {len(estudiantes)}")
    for e in estudiantes:
        print(f"ID: {e.id}, Tipo: {e.tipo_persona}, Matrícula: {e.matricula}")
    
    return estudiantes


@router.get("/search/", response_model=List[PersonaOut])
def search_personas(
    *,
    db: Session = Depends(get_db),
    q: str = Query(None, min_length=3),
    current_user: Persona = Depends(get_current_active_user)
) -> Any:
    """
    Buscar personas por texto en varios campos.
    """
    if not q:
        return []

    personas = db.query(Persona).filter(
        or_(
            Persona.correo_institucional.contains(q),
            Persona.matricula.contains(q),
            Persona.celular.contains(q),
            Persona.lugar_origen.contains(q),
            Persona.colonia_residencia_actual.contains(q)
        )
    ).all()

    return personas
