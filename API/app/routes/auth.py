from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, verify_password
from app.db.database import get_db
from app.models.persona import Persona
from app.schemas.token import Token
from app.schemas.persona import PersonaOut
from app.utils.deps import get_current_active_user

router = APIRouter(prefix="/auth", tags=["autenticación"])


@router.post("/login", response_model=Token)
def login_access_token(
    db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    Obtiene un token de acceso JWT utilizando el flujo OAuth2 password.
    """
    # Buscar usuario por correo institucional
    user = db.query(Persona).filter(Persona.correo_institucional == form_data.username).first()
    if not user:
        # Si no se encuentra por correo, intentar por matrícula
        user = db.query(Persona).filter(Persona.matricula == form_data.username).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo/matrícula o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Usuario inactivo"
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }


@router.get("/test-token", response_model=PersonaOut)
def test_token(current_user: Persona = Depends(get_current_active_user)) -> Any:
    """
    Prueba el token JWT y devuelve información del usuario actual.
    """
    return current_user
