# Importar todos los esquemas aquí
from app.schemas.persona import PersonaCreate, PersonaUpdate, PersonaInDB, PersonaOut
from app.schemas.token import Token, TokenPayload
from app.schemas.atencion import AtencionCreate, AtencionUpdate, AtencionInDB, AtencionOut
from app.schemas.grupo import GrupoCreate, GrupoUpdate, GrupoInDB, GrupoOut
from app.schemas.personal import PersonalCreate, PersonalUpdate, PersonalInDB, PersonalOut
from app.schemas.contacto_emergencia import ContactoEmergenciaCreate, ContactoEmergenciaUpdate, ContactoEmergenciaInDB, ContactoEmergenciaOut
from app.schemas.programa_educativo import ProgramaEducativoCreate, ProgramaEducativoUpdate, ProgramaEducativoInDB, ProgramaEducativoOut
from app.schemas.cuestionario import CuestionarioCreate, CuestionarioUpdate, CuestionarioInDB, CuestionarioOut
