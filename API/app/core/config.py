import secrets
from typing import List, Optional, Union, Any
import os

from pydantic import AnyHttpUrl, field_validator, ConfigDict
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Configuración centralizada de la aplicación.

    Las variables se cargan desde:
    1. Variables de entorno del sistema
    2. Archivo .env en la raíz del proyecto
    """

    # ============================================
    # Configuración de API
    # ============================================
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "SSP API"

    # ============================================
    # Configuración de Seguridad
    # ============================================
    SECRET_KEY: str = secrets.token_urlsafe(32)
    # 60 minutos * 24 horas * 8 días = 8 días
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8
    ALGORITHM: str = "HS256"

    # BACKEND_CORS_ORIGINS es una lista de orígenes permitidos para CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # ============================================
    # Configuración de OpenRouter API
    # ============================================
    OPENROUTER_API_KEY: Optional[str] = None
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_MODEL: str = "openai/gpt-3.5-turbo"

    # Información del sitio para OpenRouter
    SITE_URL: str = "http://localhost:3000"
    SITE_NAME: str = "Sistema SSP"

    # ============================================
    # Configuración de Base de Datos
    # ============================================
    DATABASE_URL: str = "sqlite:///./ssp.db"

    # ============================================
    # Configuración de Cifrado de Datos Sensibles
    # ============================================
    ENCRYPTION_KEY: Optional[str] = None
    KEY_ID_ACTUAL: str = "key_v1_2024"
    ROTATION_KEYS: Optional[str] = None
    ENCRYPTION_ENABLED: bool = True

    # ============================================
    # Configuración de la Aplicación
    # ============================================
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    model_config = ConfigDict(
        case_sensitive=True,
        env_file=".env",
        env_file_encoding="utf-8"
    )


settings = Settings()
