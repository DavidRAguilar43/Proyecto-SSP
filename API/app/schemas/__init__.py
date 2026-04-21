# Importar todos los esquemas aquí
from app.schemas.user import UserCreate, UserUpdate, UserInDB, UserOut, UserRegistro
from app.schemas.token import Token, TokenPayload
from app.schemas.grupo import GrupoCreate, GrupoUpdate, GrupoInDB, GrupoOut
from app.schemas.personal import PersonalCreate, PersonalUpdate, PersonalInDB, PersonalOut
from app.schemas.contacto_emergencia import ContactoEmergenciaCreate, ContactoEmergenciaUpdate, ContactoEmergenciaInDB, ContactoEmergenciaOut
from app.schemas.programa_educativo import ProgramaEducativoCreate, ProgramaEducativoUpdate, ProgramaEducativoInDB, ProgramaEducativoOut
from app.schemas.departamento import DepartamentoCreate, DepartamentoUpdate, DepartamentoInDB, DepartamentoOut
from app.schemas.cohorte import CohorteBase, CohorteCreate, CohorteUpdate, CohorteInDB, CohorteOut
from app.schemas.cita import CitaCreate, CitaUpdate, CitaOut
