from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_
import logging

from app.core.security import get_password_hash
from app.db.database import get_db
from app.models.persona import User
from app.models.programa_educativo import ProgramaEducativo
from app.models.grupo import Grupo
from app.models.notificacion import NotificacionRegistro

from app.schemas.user import (
    UserCreate,
    UserRegistro,
    UserUpdate,
    UserOut,
    UserBulkDelete,
    UserBulkCreate,
    UserBulkUpdate
)
from app.utils.deps import (
    get_current_active_user,
    check_admin_role,
    check_administrative_access,
    check_admin_or_coordinador_role,  # DEPRECATED
    check_deletion_permission
)
from app.middleware.rate_limit import registro_rate_limiter

router = APIRouter(prefix="/users", tags=["users"])

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
    db_user = db.query(User).filter(User.correo_institucional == email).first()
    return {"available": db_user is None}


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

    db_user = db.query(User).filter(User.matricula == matricula.strip()).first()
    return {"available": db_user is None}


@router.post("/registro-alumno/", response_model=UserOut)
def registro_usuario(
    *,
    request: Request,
    db: Session = Depends(get_db),
    user_in: UserRegistro  # SEGURIDAD: Usar schema sin rol editable
) -> Any:
    """
    Auto-registro para usuarios (alumnos, docentes, personal). No requiere autenticación.
    Todos los usuarios se activan automáticamente al registrarse.
    SEGURIDAD: Solo se permiten roles específicos, NUNCA admin.
    """
    # SEGURIDAD: Rate limiting para prevenir spam de registros
    registro_rate_limiter.check_rate_limit(request, "registro")

    # SEGURIDAD: Validar que el rol no sea admin ni coordinador (ya validado en schema, pero doble verificación)
    if user_in.rol in ["admin", "coordinador"]:
        security_logger.warning(
            f"INTENTO DE ESCALACIÓN DE PRIVILEGIOS: IP {request.client.host} "
            f"intentó registrarse como {user_in.rol} con email {user_in.correo_institucional}"
        )
        raise HTTPException(status_code=403, detail="No autorizado para crear administradores o coordinadores")

    # SEGURIDAD: Validar roles permitidos
    roles_permitidos = ["alumno", "docente", "personal"]
    if user_in.rol not in roles_permitidos:
        security_logger.warning(
            f"INTENTO DE ROL INVÁLIDO: IP {request.client.host} "
            f"intentó registrarse con rol '{user_in.rol}' con email {user_in.correo_institucional}"
        )
        raise HTTPException(status_code=400, detail="Rol no válido para auto-registro")

    # Log de seguridad para registro exitoso
    security_logger.info(
        f"REGISTRO SEGURO: IP {request.client.host} registró rol '{user_in.rol}' "
        f"con email {user_in.correo_institucional}"
    )

    # Verificar si ya existe una persona con el mismo correo
    db_user = db.query(User).filter(User.correo_institucional == user_in.correo_institucional).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Ya existe una persona con este correo institucional")

    # Determinar si el usuario debe estar activo inmediatamente
    # Todos los usuarios se activan automáticamente (alumnos, personal, docentes)
    is_active = True

    # Crear objeto Persona
    db_user = User(
        sexo=user_in.sexo,
        genero=user_in.genero,
        edad=user_in.edad,
        estado_civil=user_in.estado_civil,
        religion=user_in.religion,
        trabaja=user_in.trabaja,
        lugar_trabajo=user_in.lugar_trabajo,
        lugar_origen=user_in.lugar_origen,
        colonia_residencia_actual=user_in.colonia_residencia_actual,
        celular=user_in.celular,
        correo_institucional=user_in.correo_institucional,
        discapacidad=user_in.discapacidad,
        observaciones=user_in.observaciones,
        matricula=user_in.matricula,
        semestre=user_in.semestre if user_in.rol == "alumno" else None,
        numero_hijos=user_in.numero_hijos,
        grupo_etnico=user_in.grupo_etnico,
        rol=user_in.rol,  # SEGURIDAD: Usar rol validado del schema
        cohorte_ano=user_in.cohorte_ano if user_in.rol == "alumno" else None,
        cohorte_periodo=user_in.cohorte_periodo if user_in.rol == "alumno" else None,
        hashed_password=get_password_hash(user_in.password),
        is_active=is_active
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Todos los usuarios se registran y activan automáticamente
    # Los programas y grupos pueden ser asignados posteriormente por el personal administrativo

    return db_user


@router.get("/mi-perfil/", response_model=UserOut)
def get_mi_perfil(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Obtener el perfil del usuario actual (para alumnos).
    """
    return UserOut.from_orm_with_relations(current_user)


@router.put("/mi-perfil/", response_model=UserOut)
def update_mi_perfil(
    *,
    db: Session = Depends(get_db),
    user_in: UserUpdate,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Actualizar el perfil del usuario actual (para alumnos).
    Los alumnos solo pueden actualizar ciertos campos.
    """
    # Campos que los alumnos pueden actualizar
    allowed_fields = {
        'sexo', 'genero', 'edad', 'estado_civil', 'religion', 'trabaja',
        'lugar_trabajo', 'lugar_origen', 'colonia_residencia_actual',
        'celular', 'extension_telefonica', 'discapacidad', 'observaciones', 'matricula',
        'semestre', 'numero_hijos', 'grupo_etnico', 'password'
    }

    # Filtrar solo los campos permitidos
    update_data = {}
    for field, value in user_in.dict(exclude_unset=True).items():
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

    return UserOut.from_orm_with_relations(current_user)


@router.post("/", response_model=UserOut)
def create_persona(
    *,
    db: Session = Depends(get_db),
    user_in: UserCreate,
    current_user: User = Depends(check_administrative_access)
) -> Any:
    """
    Crear una nueva persona (solo administradores y coordinadores).
    """
    # Verificar si ya existe una persona con el mismo correo o matrícula
    db_user = db.query(User).filter(
        or_(
            User.correo_institucional == user_in.correo_institucional,
            User.matricula == user_in.matricula if user_in.matricula else False
        )
    ).first()
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="Ya existe una persona con este correo o matrícula"
        )

    # Crear objeto Persona
    db_user = User(
        sexo=user_in.sexo,
        genero=user_in.genero,
        edad=user_in.edad,
        estado_civil=user_in.estado_civil,
        religion=user_in.religion,
        trabaja=user_in.trabaja,
        lugar_trabajo=user_in.lugar_trabajo,
        lugar_origen=user_in.lugar_origen,
        colonia_residencia_actual=user_in.colonia_residencia_actual,
        celular=user_in.celular,
        correo_institucional=user_in.correo_institucional,
        discapacidad=user_in.discapacidad,
        observaciones=user_in.observaciones,
        matricula=user_in.matricula,
        semestre=user_in.semestre,
        numero_hijos=user_in.numero_hijos,
        grupo_etnico=user_in.grupo_etnico,
        rol=user_in.rol,
        cohorte_ano=user_in.cohorte_ano,  # Año de cohorte
        cohorte_periodo=user_in.cohorte_periodo,  # Período de cohorte
        hashed_password=get_password_hash(user_in.password)
    )

    # Agregar programas educativos
    if user_in.programas_ids:
        programas = db.query(ProgramaEducativo).filter(
            ProgramaEducativo.id.in_(user_in.programas_ids)
        ).all()
        db_user.programas = programas

    # Agregar grupos
    if user_in.grupos_ids:
        grupos = db.query(Grupo).filter(
            Grupo.id.in_(user_in.grupos_ids)
        ).all()
        db_user.grupos = grupos

    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.get("/", response_model=List[dict])
def read_personas(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    # SEGURIDAD: Eliminamos tipo_persona, usamos solo rol
    rol: Optional[str] = None,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Recuperar personas con filtros opcionales.
    """
    query = db.query(User)

    # Aplicar filtros si se proporcionan
    if rol:
        query = query.filter(User.rol == rol)

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


@router.get("/{persona_id}", response_model=UserOut)
def read_persona(
    *,
    db: Session = Depends(get_db),
    persona_id: int,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Obtener una persona por ID.
    """
    persona = db.query(User).filter(User.id == persona_id).first()
    if not persona:
        raise HTTPException(status_code=404, detail="User no encontrada")

    # Solo admin/coordinador pueden ver información de otros usuarios
    # Usuarios finales (docente, personal, alumno) solo pueden ver su propia información
    if current_user.rol not in ["admin", "coordinador"] and current_user.id != persona_id:
        raise HTTPException(status_code=403, detail="No tiene permisos para ver esta información")

    return persona


@router.put("/{persona_id}", response_model=UserOut)
def update_persona(
    *,
    db: Session = Depends(get_db),
    persona_id: int,
    user_in: UserUpdate,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Actualizar una persona.
    """
    persona = db.query(User).filter(User.id == persona_id).first()
    if not persona:
        raise HTTPException(status_code=404, detail="User no encontrada")

    # Verificar permisos: solo admin/coordinador pueden modificar cualquier usuario
    # Usuarios finales (docente, personal, alumno) solo pueden modificar su propia información
    if current_user.rol not in ["admin", "coordinador"] and current_user.id != persona_id:
        raise HTTPException(status_code=403, detail="No tiene permisos para modificar esta información")

    # Actualizar campos si se proporcionan
    update_data = user_in.dict(exclude_unset=True)

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

    # SEGURIDAD: Solo administradores pueden cambiar el estado activo de usuarios
    if "is_active" in update_data:
        if current_user.rol != "admin":
            raise HTTPException(
                status_code=403,
                detail="Solo los administradores pueden activar/desactivar usuarios"
            )

    # Actualizar el resto de campos
    for field, value in update_data.items():
        setattr(persona, field, value)

    db.add(persona)
    db.commit()
    db.refresh(persona)
    return persona


@router.delete("/{persona_id}", response_model=UserOut)
def delete_persona(
    *,
    db: Session = Depends(get_db),
    persona_id: int,
    current_user: User = Depends(check_deletion_permission)
) -> Any:
    """
    Eliminar una persona (solo administradores - coordinadores NO pueden eliminar).
    """
    persona = db.query(User).filter(User.id == persona_id).first()
    if not persona:
        raise HTTPException(status_code=404, detail="User no encontrada")

    # Limpiar relaciones antes de eliminar
    persona.programas.clear()
    persona.grupos.clear()

    # Eliminar notificaciones relacionadas (como solicitante o destinatario)
    notificaciones_como_solicitante = db.query(NotificacionRegistro).filter(
        NotificacionRegistro.usuario_solicitante_id == persona_id
    ).all()
    for notificacion in notificaciones_como_solicitante:
        db.delete(notificacion)

    notificaciones_como_destinatario = db.query(NotificacionRegistro).filter(
        NotificacionRegistro.usuario_destinatario_id == persona_id
    ).all()
    for notificacion in notificaciones_como_destinatario:
        db.delete(notificacion)

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


@router.post("/bulk-create", response_model=List[UserOut])
def bulk_create_personas(
    *,
    db: Session = Depends(get_db),
    bulk_personas: UserBulkCreate,
    current_user: User = Depends(check_admin_role)
) -> Any:
    """
    Crear múltiples personas en una sola operación.
    """
    created_personas = []

    for user_data in bulk_personas.items:
        # Verificar si ya existe una persona con el mismo correo o matrícula
        db_user = db.query(User).filter(
            or_(
                User.correo_institucional == user_data.correo_institucional,
                User.matricula == user_data.matricula if user_data.matricula else False
            )
        ).first()

        if db_user:
            continue  # Saltar este registro si ya existe

        # Crear objeto Persona
        db_user = User(
            sexo=user_data.sexo,
            genero=user_data.genero,
            edad=user_data.edad,
            estado_civil=user_data.estado_civil,
            religion=user_data.religion,
            trabaja=user_data.trabaja,
            lugar_trabajo=user_data.lugar_trabajo,
            lugar_origen=user_data.lugar_origen,
            colonia_residencia_actual=user_data.colonia_residencia_actual,
            celular=user_data.celular,
            correo_institucional=user_data.correo_institucional,
            discapacidad=user_data.discapacidad,
            observaciones=user_data.observaciones,
            matricula=user_data.matricula,
            semestre=user_data.semestre,
            numero_hijos=user_data.numero_hijos,
            grupo_etnico=user_data.grupo_etnico,
            rol=user_data.rol,
            hashed_password=get_password_hash(user_data.password)
        )

        # Agregar programas educativos
        if user_data.programas_ids:
            programas = db.query(ProgramaEducativo).filter(
                ProgramaEducativo.id.in_(user_data.programas_ids)
            ).all()
            db_user.programas = programas

        # Agregar grupos
        if user_data.grupos_ids:
            grupos = db.query(Grupo).filter(
                Grupo.id.in_(user_data.grupos_ids)
            ).all()
            db_user.grupos = grupos

        db.add(db_user)
        created_personas.append(db_user)

    db.commit()

    # Refrescar todos los objetos
    for persona in created_personas:
        db.refresh(persona)

    return created_personas


@router.put("/bulk-update", response_model=List[UserOut])
def bulk_update_personas(
    *,
    db: Session = Depends(get_db),
    bulk_update: UserBulkUpdate,
    current_user: User = Depends(check_admin_role)
) -> Any:
    """
    Actualizar múltiples personas en una sola operación.
    """
    updated_personas = []

    for item in bulk_update.items:
        if "id" not in item:
            continue

        persona_id = item.pop("id")
        persona = db.query(User).filter(User.id == persona_id).first()

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
    bulk_delete: UserBulkDelete,
    current_user: User = Depends(check_admin_role)
) -> Any:
    """
    Eliminar múltiples personas en una sola operación.
    """
    deleted_ids = []

    for persona_id in bulk_delete.ids:
        persona = db.query(User).filter(User.id == persona_id).first()
        if persona:
            # Eliminar notificaciones relacionadas antes de eliminar la persona
            notificaciones_como_solicitante = db.query(NotificacionRegistro).filter(
                NotificacionRegistro.usuario_solicitante_id == persona_id
            ).all()
            for notificacion in notificaciones_como_solicitante:
                db.delete(notificacion)

            notificaciones_como_destinatario = db.query(NotificacionRegistro).filter(
                NotificacionRegistro.usuario_destinatario_id == persona_id
            ).all()
            for notificacion in notificaciones_como_destinatario:
                db.delete(notificacion)

            db.delete(persona)
            deleted_ids.append(persona_id)

    db.commit()
    return deleted_ids


@router.post("/limpiar-notificaciones-obsoletas")
def limpiar_notificaciones_obsoletas(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_admin_role)
) -> Any:
    """
    TEMPORAL: Limpiar todas las notificaciones de registro obsoletas.
    Este endpoint es temporal para resolver problemas de integridad después
    de eliminar la funcionalidad de notificaciones.
    """
    try:
        # Contar notificaciones antes de eliminar
        count_before = db.query(NotificacionRegistro).count()

        # Eliminar todas las notificaciones de registro
        db.query(NotificacionRegistro).delete()
        db.commit()

        return {
            "message": "Notificaciones obsoletas eliminadas exitosamente",
            "notificaciones_eliminadas": count_before
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error al limpiar notificaciones: {str(e)}"
        )


@router.get("/list/estudiantes", response_model=List[UserOut])
def get_estudiantes(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Obtener solo estudiantes/alumnos para atenciones.
    """
    estudiantes = db.query(User).filter(
        User.rol == "alumno"  # SEGURIDAD: Usar rol en lugar de tipo_persona
    ).offset(skip).limit(limit).all()

    # Debug: Imprimir estudiantes encontrados
    print(f"Estudiantes encontrados: {len(estudiantes)}")
    for e in estudiantes:
        print(f"ID: {e.id}, Rol: {e.rol}, Matrícula: {e.matricula}")
    
    return estudiantes


@router.get("/search/", response_model=List[UserOut])
def search_personas(
    *,
    db: Session = Depends(get_db),
    q: str = Query(None, min_length=3),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Buscar personas por texto en varios campos.
    """
    if not q:
        return []

    personas = db.query(User).filter(
        or_(
            User.correo_institucional.contains(q),
            User.matricula.contains(q),
            User.celular.contains(q),
            User.lugar_origen.contains(q),
            User.colonia_residencia_actual.contains(q)
        )
    ).all()

    return personas
