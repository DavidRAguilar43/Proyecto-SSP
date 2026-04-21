from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.engine import Engine

SQLALCHEMY_DATABASE_URL = "sqlite:///./ssp.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# IMPORTANTE: Habilitar foreign keys en SQLite
# Reason: Necesario para que funcione ondelete="SET NULL" en RespuestaPregunta
# y se preserven las respuestas de usuarios cuando se eliminan preguntas
@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_conn, connection_record):
    """
    Configurar pragmas de SQLite al conectar.
    CRÍTICO: Habilita foreign keys para que ondelete="SET NULL" funcione correctamente.
    """
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Función para obtener una sesión de base de datos
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
