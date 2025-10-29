from fastapi import APIRouter
from . import auth, persona, personal, grupo, cuestionario, contacto_emergencia, programa_educativo, unidad, departamento, cuestionario_psicopedagogico, citas, cuestionarios_admin, cuestionarios_usuario
# Cohorte router comentado temporalmente debido a simplificación del sistema
# from . import cohorte

router = APIRouter()

router.include_router(auth.router, tags=["auth"])
router.include_router(persona.router, tags=["personas"])
router.include_router(personal.router, tags=["personal"])
router.include_router(grupo.router, tags=["grupos"])
router.include_router(cuestionario.router, tags=["cuestionarios"])
router.include_router(cuestionario_psicopedagogico.router, tags=["cuestionario_psicopedagogico"])
router.include_router(contacto_emergencia.router, tags=["contactos_emergencia"])
router.include_router(programa_educativo.router, tags=["programas_educativos"])
router.include_router(unidad.router, tags=["unidades"])
router.include_router(departamento.router, tags=["departamentos"])
# router.include_router(cohorte.router, tags=["cohortes"])  # Comentado temporalmente
router.include_router(citas.router, prefix="/citas", tags=["citas"])

# Exportar routers individuales
auth_router = auth.router
persona_router = persona.router
personal_router = personal.router
grupo_router = grupo.router
cuestionario_router = cuestionario.router
cuestionario_psicopedagogico_router = cuestionario_psicopedagogico.router
contacto_emergencia_router = contacto_emergencia.router
programa_educativo_router = programa_educativo.router
unidad_router = unidad.router
departamento_router = departamento.router
# cohorte_router = cohorte.router  # Comentado temporalmente
citas_router = citas.router
