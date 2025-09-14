from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_
import logging

from app.core.security import get_password_hash
from app.db.database import get_db
from app.models.persona import Persona
from app.models.programa_educativo import ProgramaEducativo
from app.models.grupo import Grupo
from app.models.notificacion import NotificacionRegistro
from app.schemas.persona import (
    PersonaCreate,
    PersonaRegistro,
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
from app.middleware.rate_limit import registro_rate_limiter

router = APIRouter(prefix="/personas", tags=["personas"])

# Logger para eventos de seguridad
security_logger = logging.getLogger("security")


@router.get("/validate-email/{email}")
def validate_email(
    email: str,
    db: Session = Depends(get_db)
) -> Any:
    """
    Validar si un correo electrónico ya está en uso.
    """
    db_persona = db.query(Persona).filter(Persona.correo_institucional == email).first()
    return {"available": db_persona is None}


@router.get("/validate-matricula/{matricula}")
def validate_matricula(
    matricula: str,
    db: Session = Depends(get_db)
) -> Any:
    """
    Validar si una matrícula ya está en uso.
    """
    if not matricula or matricula.strip() == "":
        return {"available": False, "message": "La matrícula es obligatoria"}

    db_persona = db.query(Persona).filter(Persona.matricula == matricula.strip()).first()
    return {"available": db_persona is None}


@router.post("/registro-alumno/", response_model=PersonaOut)
def registro_usuario(
    *,
    request: Request,
    db: Session = Depends(get_db),
    persona_in: PersonaRegistro  # SEGURIDAD: Usar schema sin rol editable
) -> Any:
    """
    Auto-registro para usuarios (alumnos, docentes, personal). No requiere autenticación.
    Los alumnos se activan inmediatamente, el personal y docentes requieren aprobación.
    SEGURIDAD: Solo se permiten roles específicos, NUNCA admin.
    """
    # SEGURIDAD: Rate limiting para prevenir spam de registros
    registro_rate_limiter.check_rate_limit(request, "registro")

    # SEGURIDAD: Validar que el rol no sea admin (ya validado en schema, pero doble verificación)
    if persona_in.rol == "admin":
        security_logger.warning(
            f"INTENTO DE ESCALACIÓN DE PRIVILEGIOS: IP {request.client.host} "
            f"intentó registrarse como admin con email {persona_in.correo_institucional}"
        )
        raise HTTPException(status_code=403, detail="No autorizado para crear administradores")

    # SEGURIDAD: Validar roles permitidos
    roles_permitidos = ["alumno", "docente", "personal"]
    if persona_in.rol not in roles_permitidos:
        security_logger.warning(
            f"INTENTO DE ROL INVÁLIDO: IP {request.client.host} "
            f"intentó registrarse con rol '{persona_in.rol}' con email {persona_in.correo_institucional}"
        )
        raise HTTPException(status_code=400, detail="Rol no válido para auto-registro")

    # Log de seguridad para registro exitoso
    security_logger.info(
        f"REGISTRO SEGURO: IP {request.client.host} registró rol '{persona_in.rol}' "
        f"con email {persona_in.correo_institucional}"
    )

    # Verificar si ya existe una persona con el mismo correo
    db_persona = db.query(Persona).filter(Persona.correo_institucional == persona_in.correo_institucional).first()
    if db_persona:
        raise HTTPException(status_code=400, detail="Ya existe una persona con este correo institucional")

    # Determinar si el usuario debe estar activo inmediatamente
    # Solo los alumnos se activan automáticamente
    is_active = persona_in.rol == "alumno"

    # Crear objeto Persona
    db_persona = Persona(
        # SEGURIDAD: Eliminamos tipo_persona, usamos solo rol
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
        semestre=persona_in.semestre if persona_in.rol == "alumno" else None,
        numero_hijos=persona_in.numero_hijos,
        grupo_etnico=persona_in.grupo_etnico,
        rol=persona_in.rol,  # SEGURIDAD: Usar rol validado del schema
        cohorte_ano=persona_in.cohorte_ano if persona_in.rol == "alumno" else None,
        cohorte_periodo=persona_in.cohorte_periodo if persona_in.rol == "alumno" else None,
        hashed_password=get_password_hash(persona_in.password),
        is_active=is_active
    )

    db.add(db_persona)
    db.commit()
    db.refresh(db_persona)

    # Si es personal o docente, crear notificación para administradores
    if persona_in.rol in ["personal", "docente"]:
        # Buscar administradores para notificar
        admins = db.query(Persona).filter(Persona.rol == "admin", Persona.is_active == True).all()

        tipo_notificacion = "registro_personal_pendiente" if persona_in.rol == "personal" else "registro_docente_pendiente"
        tipo_usuario_texto = "personal administrativo" if persona_in.rol == "personal" else "docente"

        mensaje = f"Nuevo registro de {tipo_usuario_texto} pendiente de aprobación: {persona_in.correo_institucional}"

        # Crear notificación para cada administrador
        for admin in admins:
            notificacion = NotificacionRegistro(
                tipo_notificacion=tipo_notificacion,
                mensaje=mensaje,
                usuario_solicitante_id=db_persona.id,
                usuario_destinatario_id=admin.id
            )
            db.add(notificacion)

        db.commit()

    # Los alumnos no pueden asignar programas y grupos en el auto-registro
    # Esto debe ser hecho por el personal administrativo

    return db_persona


@router.get("/mi-perfil/", response_model=PersonaOut)
def get_mi_perfil(
    *,
    db: Session = Depends(get_db),
    current_user: Persona = Depends(get_current_active_user)
) -> Any:
    """
    Obtener el perfil del usuario actual (para alumnos).
    """
    return PersonaOut.from_orm_with_relations(current_user)


@router.put("/mi-perfil/", response_model=PersonaOut)
def update_mi_perfil(
    *,
    db: Session = Depends(get_db),
    persona_in: PersonaUpdate,
    current_user: Persona = Depends(get_current_active_user)
) -> Any:
    """
    Actualizar el perfil del usuario actual (para alumnos).
    Los alumnos solo pueden actualizar ciertos campos.
    """
    # Campos que los alumnos pueden actualizar
    allowed_fields = {
        'sexo', 'genero', 'edad', 'estado_civil', 'religion', 'trabaja',
        'lugar_trabajo', 'lugar_origen', 'colonia_residencia_actual',
        'celular', 'discapacidad', 'observaciones', 'matricula',
        'semestre', 'numero_hijos', 'grupo_etnico', 'password'
    }

    # Filtrar solo los campos permitidos
    update_data = {}
    for field, value in persona_in.dict(exclude_unset=True).items():
        if field in allowed_fields and value is not None:
            if field == 'password':
                update_data['hashed_password'] = get_password_hash(value)
            else:
                update_data[field] = value

    # Actualizar la persona
    for field, value in update_data.items():
        setattr(current_user, field, value)

    db.add(current_user)
    db.commit()
    db.refresh(current_user)

    return PersonaOut.from_orm_with_relations(current_user)


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
        # SEGURIDAD: Eliminamos tipo_persona, usamos solo rol
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
        cohorte_ano=persona_in.cohorte_ano,  # Año de cohorte
        cohorte_periodo=persona_in.cohorte_periodo,  # Período de cohorte
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


@router.get("/", response_model=List[dict])
def read_personas(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    # SEGURIDAD: Eliminamos tipo_persona, usamos solo rol
    rol: Optional[str] = None,
    current_user: Persona = Depends(get_current_active_user)
) -> Any:
    """
    Recuperar personas con filtros opcionales.
    """
    query = db.query(Persona)

    # Aplicar filtros si se proporcionan
    if rol:
        query = query.filter(Persona.rol == rol)

    personas = query.offset(skip).limit(limit).all()

    # Convertir a diccionario simple para evitar problemas de serialización
    result = []
    for persona in personas:
        # Normalizar estado_civil si es necesario
        estado_civil_normalizado = persona.estado_civil
        if estado_civil_normalizado not in ['soltero', 'soltera', 'casado', 'casada', 'divorciado', 'divorciada', 'viudo', 'viuda', 'union_libre', 'otro']:
            estado_civil_normalizado = 'soltero'

        persona_dict = {
            'id': persona.id,
            # SEGURIDAD: Eliminamos tipo_persona, usamos solo rol
            'sexo': persona.sexo,
            'genero': persona.genero,
            'edad': persona.edad,
            'estado_civil': estado_civil_normalizado,
            'religion': persona.religion,
            'trabaja': persona.trabaja,
            'lugar_trabajo': persona.lugar_trabajo,
            'lugar_origen': persona.lugar_origen,
            'colonia_residencia_actual': persona.colonia_residencia_actual,
            'celular': persona.celular,
            'correo_institucional': persona.correo_institucional,
            'discapacidad': persona.discapacidad,
            'observaciones': persona.observaciones,
            'matricula': persona.matricula,
            'semestre': persona.semestre,
            'numero_hijos': persona.numero_hijos,
            'grupo_etnico': persona.grupo_etnico,
            'rol': persona.rol,
            'is_active': persona.is_active,
            'fecha_creacion': persona.fecha_creacion.isoformat() if persona.fecha_creacion else None,
            'fecha_actualizacion': persona.fecha_actualizacion.isoformat() if persona.fecha_actualizacion else None,
            'cohorte_ano': persona.cohorte_ano,
            'cohorte_periodo': persona.cohorte_periodo,
            'programas': [],
            'grupos': [],
            'cohorte': None
        }
        result.append(persona_dict)

    return result


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
            # SEGURIDAD: Eliminamos tipo_persona, usamos solo rol
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
        Persona.rol == "alumno"  # SEGURIDAD: Usar rol en lugar de tipo_persona
    ).offset(skip).limit(limit).all()

    # Debug: Imprimir estudiantes encontrados
    print(f"Estudiantes encontrados: {len(estudiantes)}")
    for e in estudiantes:
        print(f"ID: {e.id}, Rol: {e.rol}, Matrícula: {e.matricula}")
    
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
