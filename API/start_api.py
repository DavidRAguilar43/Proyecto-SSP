import os
import sys
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    """Función principal para iniciar la API"""
    # Asegurarse de que el directorio actual esté en el path
    sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

    try:
        import uvicorn
        from app.db.database import Base, engine

        # Importar todos los modelos para asegurarse de que se creen todas las tablas
        logger.info("Creando tablas en la base de datos...")
        # Importamos los modelos explícitamente para asegurar que SQLAlchemy los registre
        import app.models.persona
        import app.models.programa_educativo
        import app.models.grupo
        import app.models.personal
        import app.models.contacto_emergencia
        import app.models.atencion
        import app.models.cuestionario

        # Crear todas las tablas
        Base.metadata.create_all(bind=engine)
        logger.info("Tablas creadas correctamente")

        # Crear usuario administrador
        create_admin()

        # Iniciar API
        logger.info("Iniciando servidor API...")
        uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
    except Exception as e:
        logger.error(f"Error al iniciar la API: {e}")

def create_admin():
    """Crea un usuario administrador si no existe"""
    try:
        from app.db.database import SessionLocal
        from app.models.persona import Persona, Rol, TipoPersona, Sexo, Genero, EstadoCivil
        from app.core.security import get_password_hash

        db = SessionLocal()
        try:
            # Verificar si ya existe un usuario administrador
            admin_user = db.query(Persona).filter(Persona.rol == Rol.ADMIN).first()
            if admin_user:
                logger.info("El usuario administrador ya existe")
                return

            # Crear usuario administrador por defecto
            admin_password = "admin123"  # Cambiar en producción
            admin = Persona(
                tipo_persona=TipoPersona.ADMINISTRATIVO,
                sexo=Sexo.OTRO,
                genero=Genero.OTRO,
                edad=30,
                estado_civil=EstadoCivil.SOLTERO,
                lugar_origen="Sistema",
                colonia_residencia_actual="Sistema",
                celular="0000000000",
                correo_institucional="admin@sistema.edu",
                rol=Rol.ADMIN,
                hashed_password=get_password_hash(admin_password),
                is_active=True
            )
            db.add(admin)
            db.commit()
            logger.info("Usuario administrador creado con éxito")
            logger.info(f"Correo: admin@sistema.edu")
            logger.info(f"Contraseña: {admin_password}")
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Error al crear usuario administrador: {e}")

if __name__ == "__main__":
    main()
