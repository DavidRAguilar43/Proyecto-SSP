from typing import Any, List, Optional
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, func

from app.db.database import get_db
from app.models.cuestionario_admin import (
    CuestionarioAdmin, 
    Pregunta, 
    AsignacionCuestionario,
    RespuestaCuestionario,
    RespuestaPregunta,
    TipoUsuario,
    EstadoCuestionario
)
from app.models.persona import Persona
from app.schemas.cuestionario_admin import (
    CuestionarioAdminCreate,
    CuestionarioAdminUpdate,
    CuestionarioAdminOut,
    CuestionariosPaginados,
    FiltrosCuestionarios,
    CuestionarioBulkDelete,
    CuestionarioDuplicate,
    PreguntaOut
)
from app.utils.deps import (
    get_current_active_user,
    check_admin_or_coordinador_role
)

router = APIRouter(prefix="/cuestionarios-admin", tags=["cuestionarios-admin"])


@router.get("/", response_model=CuestionariosPaginados)
def get_cuestionarios(
    *,
    db: Session = Depends(get_db),
    titulo: Optional[str] = Query(None, description="Filtrar por título"),
    estado: Optional[EstadoCuestionario] = Query(None, description="Filtrar por estado"),
    tipo_usuario: Optional[TipoUsuario] = Query(None, description="Filtrar por tipo de usuario asignado"),
    fecha_creacion_desde: Optional[datetime] = Query(None, description="Filtrar desde fecha"),
    fecha_creacion_hasta: Optional[datetime] = Query(None, description="Filtrar hasta fecha"),
    creado_por: Optional[int] = Query(None, description="Filtrar por creador"),
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(10, ge=1, le=100, description="Número máximo de registros"),
    current_user: Persona = Depends(check_admin_or_coordinador_role)
) -> Any:
    """
    Obtener lista de cuestionarios administrativos con filtros y paginación.
    Solo disponible para administradores y coordinadores.
    """
    # Construir query base
    query = db.query(CuestionarioAdmin).options(
        joinedload(CuestionarioAdmin.creador),
        joinedload(CuestionarioAdmin.preguntas),
        joinedload(CuestionarioAdmin.asignaciones)
    )

    # Aplicar filtros
    if titulo:
        query = query.filter(CuestionarioAdmin.titulo.ilike(f"%{titulo}%"))
    
    if estado:
        query = query.filter(CuestionarioAdmin.estado == estado)
    
    if creado_por:
        query = query.filter(CuestionarioAdmin.creado_por == creado_por)
    
    if fecha_creacion_desde:
        query = query.filter(CuestionarioAdmin.fecha_creacion >= fecha_creacion_desde)
    
    if fecha_creacion_hasta:
        query = query.filter(CuestionarioAdmin.fecha_creacion <= fecha_creacion_hasta)
    
    if tipo_usuario:
        query = query.join(AsignacionCuestionario).filter(
            AsignacionCuestionario.tipo_usuario == tipo_usuario
        )

    # Contar total antes de aplicar paginación
    total = query.count()

    # Aplicar paginación y ordenamiento
    cuestionarios = query.order_by(CuestionarioAdmin.created_at.desc()).offset(skip).limit(limit).all()

    # Enriquecer datos
    cuestionarios_out = []
    for cuestionario in cuestionarios:
        cuestionario_dict = {
            "id": cuestionario.id,
            "titulo": cuestionario.titulo,
            "descripcion": cuestionario.descripcion,
            "fecha_creacion": cuestionario.fecha_creacion,
            "fecha_inicio": cuestionario.fecha_inicio,
            "fecha_fin": cuestionario.fecha_fin,
            "estado": cuestionario.estado,
            "creado_por": cuestionario.creado_por,
            "creado_por_nombre": f"{cuestionario.creador.nombre} {cuestionario.creador.apellido_paterno}" if cuestionario.creador else None,
            "total_preguntas": cuestionario.total_preguntas,
            "total_respuestas": cuestionario.total_respuestas,
            "preguntas": cuestionario.preguntas,
            "tipos_usuario_asignados": cuestionario.tipos_usuario_asignados,
            "created_at": cuestionario.created_at,
            "updated_at": cuestionario.updated_at
        }
        cuestionarios_out.append(CuestionarioAdminOut(**cuestionario_dict))

    return CuestionariosPaginados(
        cuestionarios=cuestionarios_out,
        total=total,
        skip=skip,
        limit=limit,
        has_next=skip + limit < total,
        has_prev=skip > 0
    )


@router.get("/{cuestionario_id}", response_model=CuestionarioAdminOut)
def get_cuestionario(
    *,
    db: Session = Depends(get_db),
    cuestionario_id: str,
    current_user: Persona = Depends(check_admin_or_coordinador_role)
) -> Any:
    """
    Obtener un cuestionario específico por ID.
    """
    cuestionario = db.query(CuestionarioAdmin).options(
        joinedload(CuestionarioAdmin.creador),
        joinedload(CuestionarioAdmin.preguntas),
        joinedload(CuestionarioAdmin.asignaciones)
    ).filter(CuestionarioAdmin.id == cuestionario_id).first()

    if not cuestionario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cuestionario no encontrado"
        )

    # Enriquecer datos
    cuestionario_dict = {
        "id": cuestionario.id,
        "titulo": cuestionario.titulo,
        "descripcion": cuestionario.descripcion,
        "fecha_creacion": cuestionario.fecha_creacion,
        "fecha_inicio": cuestionario.fecha_inicio,
        "fecha_fin": cuestionario.fecha_fin,
        "estado": cuestionario.estado,
        "creado_por": cuestionario.creado_por,
        "creado_por_nombre": f"{cuestionario.creador.nombre} {cuestionario.creador.apellido_paterno}" if cuestionario.creador else None,
        "total_preguntas": cuestionario.total_preguntas,
        "total_respuestas": cuestionario.total_respuestas,
        "preguntas": cuestionario.preguntas,
        "tipos_usuario_asignados": cuestionario.tipos_usuario_asignados,
        "created_at": cuestionario.created_at,
        "updated_at": cuestionario.updated_at
    }

    return CuestionarioAdminOut(**cuestionario_dict)


@router.post("/", response_model=CuestionarioAdminOut)
def create_cuestionario(
    *,
    db: Session = Depends(get_db),
    cuestionario_in: CuestionarioAdminCreate,
    current_user: Persona = Depends(check_admin_or_coordinador_role)
) -> Any:
    """
    Crear un nuevo cuestionario administrativo.
    """
    # Generar ID único
    cuestionario_id = str(uuid.uuid4())

    # Crear el cuestionario
    db_cuestionario = CuestionarioAdmin(
        id=cuestionario_id,
        titulo=cuestionario_in.titulo,
        descripcion=cuestionario_in.descripcion,
        fecha_inicio=cuestionario_in.fecha_inicio,
        fecha_fin=cuestionario_in.fecha_fin,
        estado=cuestionario_in.estado,
        creado_por=current_user.id
    )

    db.add(db_cuestionario)
    db.flush()  # Para obtener el ID antes del commit

    # Crear las preguntas
    for pregunta_data in cuestionario_in.preguntas:
        pregunta_id = str(uuid.uuid4())
        db_pregunta = Pregunta(
            id=pregunta_id,
            cuestionario_id=cuestionario_id,
            tipo=pregunta_data.tipo,
            texto=pregunta_data.texto,
            descripcion=pregunta_data.descripcion,
            obligatoria=pregunta_data.obligatoria,
            orden=pregunta_data.orden,
            configuracion=pregunta_data.configuracion
        )
        db.add(db_pregunta)

    # Crear las asignaciones
    for tipo_usuario in cuestionario_in.tipos_usuario_asignados:
        db_asignacion = AsignacionCuestionario(
            cuestionario_id=cuestionario_id,
            tipo_usuario=tipo_usuario
        )
        db.add(db_asignacion)

    db.commit()

    # Recargar con relaciones
    db.refresh(db_cuestionario)
    cuestionario = db.query(CuestionarioAdmin).options(
        joinedload(CuestionarioAdmin.creador),
        joinedload(CuestionarioAdmin.preguntas),
        joinedload(CuestionarioAdmin.asignaciones)
    ).filter(CuestionarioAdmin.id == cuestionario_id).first()

    # Enriquecer datos para respuesta
    cuestionario_dict = {
        "id": cuestionario.id,
        "titulo": cuestionario.titulo,
        "descripcion": cuestionario.descripcion,
        "fecha_creacion": cuestionario.fecha_creacion,
        "fecha_inicio": cuestionario.fecha_inicio,
        "fecha_fin": cuestionario.fecha_fin,
        "estado": cuestionario.estado,
        "creado_por": cuestionario.creado_por,
        "creado_por_nombre": f"{cuestionario.creador.nombre} {cuestionario.creador.apellido_paterno}" if cuestionario.creador else None,
        "total_preguntas": cuestionario.total_preguntas,
        "total_respuestas": cuestionario.total_respuestas,
        "preguntas": cuestionario.preguntas,
        "tipos_usuario_asignados": cuestionario.tipos_usuario_asignados,
        "created_at": cuestionario.created_at,
        "updated_at": cuestionario.updated_at
    }

    return CuestionarioAdminOut(**cuestionario_dict)


@router.put("/{cuestionario_id}", response_model=CuestionarioAdminOut)
def update_cuestionario(
    *,
    db: Session = Depends(get_db),
    cuestionario_id: str,
    cuestionario_in: CuestionarioAdminUpdate,
    current_user: Persona = Depends(check_admin_or_coordinador_role)
) -> Any:
    """
    Actualizar un cuestionario administrativo existente.
    """
    # Buscar el cuestionario
    cuestionario = db.query(CuestionarioAdmin).filter(
        CuestionarioAdmin.id == cuestionario_id
    ).first()

    if not cuestionario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cuestionario no encontrado"
        )

    # Verificar permisos (solo el creador o admin puede editar)
    if current_user.rol != "admin" and cuestionario.creado_por != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para editar este cuestionario"
        )

    # Actualizar campos básicos
    update_data = cuestionario_in.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if field not in ['preguntas', 'tipos_usuario_asignados']:
            setattr(cuestionario, field, value)

    # Actualizar preguntas si se proporcionan
    if cuestionario_in.preguntas is not None:
        # Eliminar preguntas existentes
        db.query(Pregunta).filter(Pregunta.cuestionario_id == cuestionario_id).delete()

        # Crear nuevas preguntas
        for pregunta_data in cuestionario_in.preguntas:
            pregunta_id = str(uuid.uuid4())
            db_pregunta = Pregunta(
                id=pregunta_id,
                cuestionario_id=cuestionario_id,
                tipo=pregunta_data.tipo,
                texto=pregunta_data.texto,
                descripcion=pregunta_data.descripcion,
                obligatoria=pregunta_data.obligatoria,
                orden=pregunta_data.orden,
                configuracion=pregunta_data.configuracion
            )
            db.add(db_pregunta)

    # Actualizar asignaciones si se proporcionan
    if cuestionario_in.tipos_usuario_asignados is not None:
        # Eliminar asignaciones existentes
        db.query(AsignacionCuestionario).filter(
            AsignacionCuestionario.cuestionario_id == cuestionario_id
        ).delete()

        # Crear nuevas asignaciones
        for tipo_usuario in cuestionario_in.tipos_usuario_asignados:
            db_asignacion = AsignacionCuestionario(
                cuestionario_id=cuestionario_id,
                tipo_usuario=tipo_usuario
            )
            db.add(db_asignacion)

    db.commit()

    # Recargar con relaciones
    cuestionario_actualizado = db.query(CuestionarioAdmin).options(
        joinedload(CuestionarioAdmin.creador),
        joinedload(CuestionarioAdmin.preguntas),
        joinedload(CuestionarioAdmin.asignaciones)
    ).filter(CuestionarioAdmin.id == cuestionario_id).first()

    # Enriquecer datos para respuesta
    cuestionario_dict = {
        "id": cuestionario_actualizado.id,
        "titulo": cuestionario_actualizado.titulo,
        "descripcion": cuestionario_actualizado.descripcion,
        "fecha_creacion": cuestionario_actualizado.fecha_creacion,
        "fecha_inicio": cuestionario_actualizado.fecha_inicio,
        "fecha_fin": cuestionario_actualizado.fecha_fin,
        "estado": cuestionario_actualizado.estado,
        "creado_por": cuestionario_actualizado.creado_por,
        "creado_por_nombre": f"{cuestionario_actualizado.creador.nombre} {cuestionario_actualizado.creador.apellido_paterno}" if cuestionario_actualizado.creador else None,
        "total_preguntas": cuestionario_actualizado.total_preguntas,
        "total_respuestas": cuestionario_actualizado.total_respuestas,
        "preguntas": cuestionario_actualizado.preguntas,
        "tipos_usuario_asignados": cuestionario_actualizado.tipos_usuario_asignados,
        "created_at": cuestionario_actualizado.created_at,
        "updated_at": cuestionario_actualizado.updated_at
    }

    return CuestionarioAdminOut(**cuestionario_dict)


@router.delete("/{cuestionario_id}")
def delete_cuestionario(
    *,
    db: Session = Depends(get_db),
    cuestionario_id: str,
    current_user: Persona = Depends(check_admin_or_coordinador_role)
) -> Any:
    """
    Eliminar un cuestionario administrativo.
    """
    # Buscar el cuestionario
    cuestionario = db.query(CuestionarioAdmin).filter(
        CuestionarioAdmin.id == cuestionario_id
    ).first()

    if not cuestionario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cuestionario no encontrado"
        )

    # Verificar permisos (solo el creador o admin puede eliminar)
    if current_user.rol != "admin" and cuestionario.creado_por != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para eliminar este cuestionario"
        )

    # Verificar si tiene respuestas
    respuestas_count = db.query(RespuestaCuestionario).filter(
        RespuestaCuestionario.cuestionario_id == cuestionario_id,
        RespuestaCuestionario.estado == "completado"
    ).count()

    if respuestas_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se puede eliminar el cuestionario porque tiene {respuestas_count} respuesta(s) completada(s)"
        )

    # Eliminar el cuestionario (las relaciones se eliminan en cascada)
    db.delete(cuestionario)
    db.commit()

    return {"message": "Cuestionario eliminado exitosamente"}


@router.post("/{cuestionario_id}/duplicate", response_model=CuestionarioAdminOut)
def duplicate_cuestionario(
    *,
    db: Session = Depends(get_db),
    cuestionario_id: str,
    duplicate_data: CuestionarioDuplicate,
    current_user: Persona = Depends(check_admin_or_coordinador_role)
) -> Any:
    """
    Duplicar un cuestionario administrativo existente.
    """
    # Buscar el cuestionario original
    cuestionario_original = db.query(CuestionarioAdmin).options(
        joinedload(CuestionarioAdmin.preguntas),
        joinedload(CuestionarioAdmin.asignaciones)
    ).filter(CuestionarioAdmin.id == cuestionario_id).first()

    if not cuestionario_original:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cuestionario no encontrado"
        )

    # Generar nuevo ID
    nuevo_cuestionario_id = str(uuid.uuid4())

    # Crear el cuestionario duplicado
    db_cuestionario = CuestionarioAdmin(
        id=nuevo_cuestionario_id,
        titulo=duplicate_data.nuevo_titulo,
        descripcion=cuestionario_original.descripcion,
        fecha_inicio=cuestionario_original.fecha_inicio,
        fecha_fin=cuestionario_original.fecha_fin,
        estado=EstadoCuestionario.BORRADOR,  # Siempre crear como borrador
        creado_por=current_user.id
    )

    db.add(db_cuestionario)
    db.flush()

    # Duplicar las preguntas
    for pregunta_original in cuestionario_original.preguntas:
        pregunta_id = str(uuid.uuid4())
        db_pregunta = Pregunta(
            id=pregunta_id,
            cuestionario_id=nuevo_cuestionario_id,
            tipo=pregunta_original.tipo,
            texto=pregunta_original.texto,
            descripcion=pregunta_original.descripcion,
            obligatoria=pregunta_original.obligatoria,
            orden=pregunta_original.orden,
            configuracion=pregunta_original.configuracion
        )
        db.add(db_pregunta)

    # Duplicar las asignaciones
    for asignacion_original in cuestionario_original.asignaciones:
        db_asignacion = AsignacionCuestionario(
            cuestionario_id=nuevo_cuestionario_id,
            tipo_usuario=asignacion_original.tipo_usuario
        )
        db.add(db_asignacion)

    db.commit()

    # Recargar con relaciones
    cuestionario_duplicado = db.query(CuestionarioAdmin).options(
        joinedload(CuestionarioAdmin.creador),
        joinedload(CuestionarioAdmin.preguntas),
        joinedload(CuestionarioAdmin.asignaciones)
    ).filter(CuestionarioAdmin.id == nuevo_cuestionario_id).first()

    # Enriquecer datos para respuesta
    cuestionario_dict = {
        "id": cuestionario_duplicado.id,
        "titulo": cuestionario_duplicado.titulo,
        "descripcion": cuestionario_duplicado.descripcion,
        "fecha_creacion": cuestionario_duplicado.fecha_creacion,
        "fecha_inicio": cuestionario_duplicado.fecha_inicio,
        "fecha_fin": cuestionario_duplicado.fecha_fin,
        "estado": cuestionario_duplicado.estado,
        "creado_por": cuestionario_duplicado.creado_por,
        "creado_por_nombre": f"{cuestionario_duplicado.creador.nombre} {cuestionario_duplicado.creador.apellido_paterno}" if cuestionario_duplicado.creador else None,
        "total_preguntas": cuestionario_duplicado.total_preguntas,
        "total_respuestas": cuestionario_duplicado.total_respuestas,
        "preguntas": cuestionario_duplicado.preguntas,
        "tipos_usuario_asignados": cuestionario_duplicado.tipos_usuario_asignados,
        "created_at": cuestionario_duplicado.created_at,
        "updated_at": cuestionario_duplicado.updated_at
    }

    return CuestionarioAdminOut(**cuestionario_dict)


@router.post("/bulk-delete")
def bulk_delete_cuestionarios(
    *,
    db: Session = Depends(get_db),
    bulk_delete: CuestionarioBulkDelete,
    current_user: Persona = Depends(check_admin_or_coordinador_role)
) -> Any:
    """
    Eliminar múltiples cuestionarios en una sola operación.
    """
    deleted_ids = []
    errors = []

    for cuestionario_id in bulk_delete.ids:
        try:
            # Buscar el cuestionario
            cuestionario = db.query(CuestionarioAdmin).filter(
                CuestionarioAdmin.id == cuestionario_id
            ).first()

            if not cuestionario:
                errors.append(f"Cuestionario {cuestionario_id} no encontrado")
                continue

            # Verificar permisos
            if current_user.rol != "admin" and cuestionario.creado_por != current_user.id:
                errors.append(f"Sin permisos para eliminar cuestionario {cuestionario_id}")
                continue

            # Verificar si tiene respuestas
            respuestas_count = db.query(RespuestaCuestionario).filter(
                RespuestaCuestionario.cuestionario_id == cuestionario_id,
                RespuestaCuestionario.estado == "completado"
            ).count()

            if respuestas_count > 0:
                errors.append(f"Cuestionario {cuestionario_id} tiene {respuestas_count} respuesta(s)")
                continue

            # Eliminar el cuestionario
            db.delete(cuestionario)
            deleted_ids.append(cuestionario_id)

        except Exception as e:
            errors.append(f"Error eliminando cuestionario {cuestionario_id}: {str(e)}")

    db.commit()

    return {
        "deleted_ids": deleted_ids,
        "errors": errors,
        "total_deleted": len(deleted_ids),
        "total_errors": len(errors)
    }
