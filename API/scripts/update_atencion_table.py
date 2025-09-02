import sqlite3
import os
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def update_atencion_table():
    """Actualiza la estructura de la tabla atencion"""
    try:
        # Conectar a la base de datos
        db_path = os.path.join(os.path.dirname(__file__), "ssp.db")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Verificar si la tabla existe
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='atencion'")
        if not cursor.fetchone():
            logger.info("La tabla atencion no existe, no es necesario actualizarla")
            conn.close()
            return
        
        # Crear una tabla temporal con la nueva estructura
        logger.info("Creando tabla temporal con la nueva estructura...")
        cursor.execute("""
        CREATE TABLE atencion_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fecha_atencion DATETIME,
            motivo_psicologico BOOLEAN DEFAULT 0,
            motivo_academico BOOLEAN DEFAULT 0,
            salud_en_general_vulnerable BOOLEAN DEFAULT 0,
            requiere_seguimiento BOOLEAN DEFAULT 0,
            requiere_canalizacion_externa BOOLEAN DEFAULT 0,
            estatus_canalizacion_externa VARCHAR,
            observaciones TEXT,
            fecha_proxima_sesion DATETIME,
            atendido BOOLEAN DEFAULT 0,
            ultima_fecha_contacto DATETIME,
            id_personal INTEGER,
            id_persona INTEGER,
            id_grupo INTEGER,
            id_cuestionario INTEGER,
            FOREIGN KEY(id_personal) REFERENCES personal(id),
            FOREIGN KEY(id_persona) REFERENCES persona(id),
            FOREIGN KEY(id_grupo) REFERENCES grupo(id),
            FOREIGN KEY(id_cuestionario) REFERENCES cuestionario(id_cuestionario)
        )
        """)
        
        # Copiar los datos de la tabla antigua a la nueva
        logger.info("Copiando datos de la tabla antigua a la nueva...")
        cursor.execute("""
        INSERT INTO atencion_new (id, fecha_atencion, observaciones, id_persona)
        SELECT id, fecha, descripcion, id_persona FROM atencion
        """)
        
        # Eliminar la tabla antigua
        logger.info("Eliminando tabla antigua...")
        cursor.execute("DROP TABLE atencion")
        
        # Renombrar la tabla nueva
        logger.info("Renombrando tabla nueva...")
        cursor.execute("ALTER TABLE atencion_new RENAME TO atencion")
        
        # Confirmar los cambios
        conn.commit()
        logger.info("Tabla atencion actualizada correctamente")
        
        # Cerrar la conexión
        conn.close()
    except Exception as e:
        logger.error(f"Error al actualizar la tabla atencion: {e}")
        if conn:
            conn.rollback()
            conn.close()

if __name__ == "__main__":
    update_atencion_table()
