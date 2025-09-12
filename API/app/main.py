from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError

from app.core.config import settings
from app.db.database import engine, Base
from app.routes import auth_router, persona_router, atencion_router, grupo_router, personal_router, contacto_emergencia_router, programa_educativo_router, cuestionario_router, cuestionario_psicopedagogico_router
# cohorte_router comentado temporalmente debido a simplificación del sistema
from app.routes.catalogos import router as catalogos_router
from app.routes.notificaciones import router as notificaciones_router
from app.routes.citas import router as citas_router

# Crear tablas en la base de datos
try:
    Base.metadata.create_all(bind=engine)
except OperationalError:
    print("Error al crear las tablas. Asegúrate de que la base de datos esté disponible.")

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
app.include_router(persona_router, prefix=settings.API_V1_STR)
app.include_router(atencion_router, prefix=settings.API_V1_STR)
app.include_router(grupo_router, prefix=settings.API_V1_STR)
app.include_router(personal_router, prefix=settings.API_V1_STR)
app.include_router(contacto_emergencia_router, prefix=settings.API_V1_STR)
app.include_router(programa_educativo_router, prefix=settings.API_V1_STR)
app.include_router(cuestionario_router, prefix=settings.API_V1_STR)
app.include_router(cuestionario_psicopedagogico_router, prefix=f"{settings.API_V1_STR}/cuestionario-psicopedagogico")
# app.include_router(cohorte_router, prefix=settings.API_V1_STR)  # Comentado temporalmente
app.include_router(catalogos_router, prefix=settings.API_V1_STR)
app.include_router(notificaciones_router, prefix=settings.API_V1_STR)
app.include_router(citas_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {"message": "Bienvenido a la API del Sistema de Seguimiento Psicopedagógico"}
