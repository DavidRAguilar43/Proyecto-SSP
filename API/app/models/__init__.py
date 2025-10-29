# Importar todos los modelos aquí para que Alembic los detecte
# IMPORTANTE: Importar las tablas de asociación primero
from app.models.associations import persona_grupo, persona_programa

from app.models.persona import Persona
from app.models.programa_educativo import ProgramaEducativo
from app.models.unidad import Unidad
from app.models.grupo import Grupo
from app.models.personal import Personal
from app.models.contacto_emergencia import ContactoEmergencia
from app.models.cuestionario import Cuestionario
from app.models.cuestionario_admin import (
    CuestionarioAdmin,
    Pregunta,
    AsignacionCuestionario,
    RespuestaCuestionario,
    RespuestaPregunta
)
from app.models.cohorte import Cohorte
from app.models.cita import Cita
from app.models.religion import Religion
from app.models.grupo_etnico import GrupoEtnico
from app.models.discapacidad import Discapacidad
from app.models.departamento import Departamento
from app.models.notificacion import NotificacionRegistro
