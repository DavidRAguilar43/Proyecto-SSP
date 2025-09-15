from typing import Generator, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import ALGORITHM
from app.db.database import get_db
from app.models.persona import Persona
from app.schemas.token import TokenPayload

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)


def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> Persona:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (jwt.JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No se pudo validar las credenciales",
        )
    user = db.query(Persona).filter(Persona.id == token_data.sub).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user


def get_current_active_user(
    current_user: Persona = Depends(get_current_user),
) -> Persona:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Usuario inactivo")
    return current_user


def check_admin_role(
    current_user: Persona = Depends(get_current_active_user),
) -> Persona:
    """Solo administradores tienen acceso completo incluyendo eliminaciones."""
    if current_user.rol != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos suficientes",
        )
    return current_user


def check_coordinador_role(
    current_user: Persona = Depends(get_current_active_user),
) -> Persona:
    """Coordinadores tienen acceso administrativo excepto eliminaciones."""
    if current_user.rol not in ["admin", "coordinador"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos suficientes",
        )
    return current_user


def check_admin_or_coordinador_role(
    current_user: Persona = Depends(get_current_active_user),
) -> Persona:
    """Admin y Coordinador tienen acceso administrativo (sin restricciones de eliminación aquí)."""
    if current_user.rol not in ["admin", "coordinador"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos suficientes",
        )
    return current_user


def check_user_level_access(
    current_user: Persona = Depends(get_current_active_user),
) -> Persona:
    """Acceso de nivel usuario para roles restringidos (personal, docente, alumno)."""
    if current_user.rol not in ["admin", "coordinador", "personal", "docente", "alumno"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos suficientes",
        )
    return current_user


# DEPRECATED: Estas funciones se mantienen temporalmente para compatibilidad
# pero serán reemplazadas gradualmente por el nuevo sistema de permisos
def check_personal_role(
    current_user: Persona = Depends(get_current_active_user),
) -> Persona:
    """DEPRECATED: Solo para acceso de nivel usuario ahora."""
    if current_user.rol not in ["admin", "coordinador"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos suficientes",
        )
    return current_user


def check_docente_role(
    current_user: Persona = Depends(get_current_active_user),
) -> Persona:
    """DEPRECATED: Solo para acceso de nivel usuario ahora."""
    if current_user.rol not in ["admin", "coordinador"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos suficientes",
        )
    return current_user


def check_deletion_permission(
    current_user: Persona = Depends(get_current_active_user),
) -> Persona:
    """Solo administradores pueden eliminar registros."""
    if current_user.rol != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los administradores pueden eliminar registros",
        )
    return current_user
