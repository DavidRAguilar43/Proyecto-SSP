from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError
import logging

from app.core.config import settings
from app.db.database import engine, Base
from app.routes import auth_router, user_router, grupo_router, personal_router, contacto_emergencia_router, programa_educativo_router, unidad_router, citas_router
from app.routes import cuestionarios_admin, cuestionarios_usuario
# cohorte_router comentado temporalmente debido a simplificación del sistema
from app.routes.catalogos import router as catalogos_router
from app.routes.config import router as config_router

# Configurar logging
logger = logging.getLogger(__name__)

# Crear tablas en la base de datos
try:
    Base.metadata.create_all(bind=engine)
except OperationalError:
    print("Error al crear las tablas. Asegúrate de que la base de datos esté disponible.")

# Configurar cifrado automático de campos sensibles
try:
    from app.models.encryption_mixin import setup_all_encryption_listeners
    setup_all_encryption_listeners()
    logger.info("Sistema de cifrado de datos sensibles configurado correctamente")
except Exception as e:
    logger.error(f"Error al configurar sistema de cifrado: {e}")
    # No detener la aplicación, pero registrar el error

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir rutas
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(user_router, prefix=settings.API_V1_STR)
app.include_router(grupo_router, prefix=settings.API_V1_STR)
app.include_router(personal_router, prefix=settings.API_V1_STR)
app.include_router(contacto_emergencia_router, prefix=settings.API_V1_STR)
app.include_router(programa_educativo_router, prefix=settings.API_V1_STR)
app.include_router(unidad_router, prefix=settings.API_V1_STR)
app.include_router(cuestionarios_admin.router, prefix=settings.API_V1_STR)
app.include_router(cuestionarios_usuario.router, prefix=settings.API_V1_STR)
app.include_router(citas_router, prefix=f"{settings.API_V1_STR}/citas")
# app.include_router(cohorte_router, prefix=settings.API_V1_STR)  # Comentado temporalmente
app.include_router(catalogos_router, prefix=settings.API_V1_STR)
app.include_router(config_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {"message": "Bienvenido a la API del Sistema de Seguimiento Psicopedagógico"}
