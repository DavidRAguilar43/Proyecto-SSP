#!/usr/bin/env python3
"""
Script de migración para eliminar la columna tipo_persona de la tabla personas.
SEGURIDAD: Esta migración es parte de la refactorización para usar únicamente 'rol'
y eliminar la vulnerabilidad de escalación de privilegios.

IMPORTANTE: 
- Hacer backup de la base de datos antes de ejecutar
- Verificar que todos los datos de tipo_persona estén correctamente mapeados a rol
- Este script es irreversible

Uso:
    python scripts/migrate_remove_tipo_persona.py
"""

import sys
import os
import logging
from datetime import datetime

# Agregar el directorio raíz al path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text, inspect
from app.db.database import SessionLocal, engine
from app.models.persona import Persona

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'migration_remove_tipo_persona_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def check_column_exists(table_name: str, column_name: str) -> bool:
    """Verificar si una columna existe en la tabla."""
    try:
        inspector = inspect(engine)
        columns = [col['name'] for col in inspector.get_columns(table_name)]
        return column_name in columns
    except Exception as e:
        logger.error(f"Error verificando columna: {e}")
        return False

def backup_tipo_persona_data():
    """Crear backup de los datos de tipo_persona antes de eliminar la columna."""
    logger.info("Creando backup de datos tipo_persona...")
    
    db = SessionLocal()
    try:
        # Verificar que la columna tipo_persona existe
        if not check_column_exists('personas', 'tipo_persona'):
            logger.warning("La columna tipo_persona no existe. Migración ya aplicada o no necesaria.")
            return True
            
        # Obtener todos los registros con tipo_persona
        result = db.execute(text("SELECT id, tipo_persona, rol FROM personas"))
        personas = result.fetchall()
        
        logger.info(f"Encontrados {len(personas)} registros con tipo_persona")
        
        # Crear archivo de backup
        backup_file = f"backup_tipo_persona_{datetime.now().strftime('%Y%m%d_%H%M%S')}.sql"
        with open(backup_file, 'w') as f:
            f.write("-- Backup de datos tipo_persona antes de migración\n")
            f.write(f"-- Fecha: {datetime.now()}\n")
            f.write("-- Registros encontrados:\n")
            
            for persona in personas:
                f.write(f"-- ID: {persona.id}, tipo_persona: '{persona.tipo_persona}', rol: '{persona.rol}'\n")
        
        logger.info(f"Backup creado en: {backup_file}")
        return True
        
    except Exception as e:
        logger.error(f"Error creando backup: {e}")
        return False
    finally:
        db.close()

def verify_data_consistency():
    """Verificar que los datos de rol están correctamente mapeados."""
    logger.info("Verificando consistencia de datos...")
    
    db = SessionLocal()
    try:
        if not check_column_exists('personas', 'tipo_persona'):
            logger.info("Columna tipo_persona no existe, verificando solo roles...")
            # Verificar que todos los roles son válidos
            result = db.execute(text("SELECT DISTINCT rol FROM personas"))
            roles = [row[0] for row in result.fetchall()]
            
            roles_validos = ['admin', 'personal', 'docente', 'alumno']
            roles_invalidos = [rol for rol in roles if rol not in roles_validos]
            
            if roles_invalidos:
                logger.error(f"Roles inválidos encontrados: {roles_invalidos}")
                return False
            
            logger.info(f"Roles válidos encontrados: {roles}")
            return True
        
        # Verificar mapeo tipo_persona -> rol
        result = db.execute(text("""
            SELECT tipo_persona, rol, COUNT(*) as count 
            FROM personas 
            GROUP BY tipo_persona, rol
        """))
        
        mapeos = result.fetchall()
        logger.info("Mapeos tipo_persona -> rol encontrados:")
        
        inconsistencias = []
        for mapeo in mapeos:
            tipo_persona, rol, count = mapeo
            logger.info(f"  {tipo_persona} -> {rol}: {count} registros")
            
            # Verificar mapeos esperados
            if tipo_persona == 'administrativo' and rol != 'personal':
                inconsistencias.append(f"tipo_persona 'administrativo' mapeado a rol '{rol}' (esperado: 'personal')")
            elif tipo_persona in ['alumno', 'docente'] and tipo_persona != rol:
                inconsistencias.append(f"tipo_persona '{tipo_persona}' mapeado a rol '{rol}' (esperado: '{tipo_persona}')")
        
        if inconsistencias:
            logger.error("Inconsistencias encontradas:")
            for inconsistencia in inconsistencias:
                logger.error(f"  - {inconsistencia}")
            return False
        
        logger.info("Verificación de consistencia exitosa")
        return True
        
    except Exception as e:
        logger.error(f"Error verificando consistencia: {e}")
        return False
    finally:
        db.close()

def fix_data_inconsistencies():
    """Corregir inconsistencias en los datos antes de eliminar tipo_persona."""
    logger.info("Corrigiendo inconsistencias de datos...")
    
    db = SessionLocal()
    try:
        # Mapear administrativo -> personal
        result = db.execute(text("""
            UPDATE personas 
            SET rol = 'personal' 
            WHERE tipo_persona = 'administrativo' AND rol != 'personal'
        """))
        
        if result.rowcount > 0:
            logger.info(f"Corregidos {result.rowcount} registros: administrativo -> personal")
        
        # Mapear otros casos si es necesario
        result = db.execute(text("""
            UPDATE personas 
            SET rol = tipo_persona 
            WHERE tipo_persona IN ('alumno', 'docente') AND rol != tipo_persona
        """))
        
        if result.rowcount > 0:
            logger.info(f"Corregidos {result.rowcount} registros: tipo_persona -> rol")
        
        db.commit()
        logger.info("Correcciones aplicadas exitosamente")
        return True
        
    except Exception as e:
        logger.error(f"Error corrigiendo inconsistencias: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def remove_tipo_persona_column():
    """Eliminar la columna tipo_persona de la tabla personas."""
    logger.info("Eliminando columna tipo_persona...")
    
    db = SessionLocal()
    try:
        # Verificar que la columna existe
        if not check_column_exists('personas', 'tipo_persona'):
            logger.warning("La columna tipo_persona no existe. Migración ya aplicada.")
            return True
        
        # Eliminar la columna
        db.execute(text("ALTER TABLE personas DROP COLUMN tipo_persona"))
        db.commit()
        
        logger.info("Columna tipo_persona eliminada exitosamente")
        
        # Verificar que se eliminó
        if check_column_exists('personas', 'tipo_persona'):
            logger.error("Error: La columna tipo_persona aún existe después de la eliminación")
            return False
        
        logger.info("Verificación exitosa: columna tipo_persona eliminada")
        return True
        
    except Exception as e:
        logger.error(f"Error eliminando columna: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def main():
    """Función principal de migración."""
    logger.info("=== INICIANDO MIGRACIÓN: Eliminar columna tipo_persona ===")
    logger.info("SEGURIDAD: Esta migración elimina tipo_persona para usar únicamente rol")
    
    # Paso 1: Crear backup
    if not backup_tipo_persona_data():
        logger.error("Error en backup. Abortando migración.")
        return False
    
    # Paso 2: Verificar consistencia
    if not verify_data_consistency():
        logger.warning("Inconsistencias encontradas. Intentando corregir...")
        
        # Paso 3: Corregir inconsistencias
        if not fix_data_inconsistencies():
            logger.error("Error corrigiendo inconsistencias. Abortando migración.")
            return False
        
        # Verificar nuevamente
        if not verify_data_consistency():
            logger.error("Inconsistencias persisten. Abortando migración.")
            return False
    
    # Paso 4: Eliminar columna
    if not remove_tipo_persona_column():
        logger.error("Error eliminando columna. Migración fallida.")
        return False
    
    logger.info("=== MIGRACIÓN COMPLETADA EXITOSAMENTE ===")
    logger.info("SEGURIDAD: Sistema ahora usa únicamente 'rol' sin tipo_persona")
    return True

if __name__ == "__main__":
    try:
        success = main()
        if success:
            logger.info("Migración exitosa")
            sys.exit(0)
        else:
            logger.error("Migración fallida")
            sys.exit(1)
    except KeyboardInterrupt:
        logger.warning("Migración cancelada por usuario")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Error inesperado: {e}")
        sys.exit(1)
