#!/usr/bin/env python3
"""
Script de verificación de seguridad post-migración.
Verifica que la refactorización de tipo_persona -> rol se haya aplicado correctamente
y que no existan vulnerabilidades de escalación de privilegios.

Uso:
    python scripts/verify_security_migration.py
"""

import sys
import os
import logging
from datetime import datetime

# Agregar el directorio raíz al path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text, inspect
from app.db.database import SessionLocal, engine

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
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

def verify_tipo_persona_removed():
    """Verificar que la columna tipo_persona fue eliminada."""
    logger.info("Verificando eliminación de columna tipo_persona...")
    
    if check_column_exists('personas', 'tipo_persona'):
        logger.error("❌ FALLO: La columna tipo_persona aún existe")
        return False
    
    logger.info("✅ ÉXITO: Columna tipo_persona eliminada correctamente")
    return True

def verify_rol_column_exists():
    """Verificar que la columna rol existe y es correcta."""
    logger.info("Verificando columna rol...")
    
    if not check_column_exists('personas', 'rol'):
        logger.error("❌ FALLO: La columna rol no existe")
        return False
    
    logger.info("✅ ÉXITO: Columna rol existe")
    return True

def verify_valid_roles():
    """Verificar que todos los roles son válidos."""
    logger.info("Verificando roles válidos...")
    
    db = SessionLocal()
    try:
        result = db.execute(text("SELECT DISTINCT rol FROM personas"))
        roles = [row[0] for row in result.fetchall()]
        
        roles_validos = ['admin', 'personal', 'docente', 'alumno']
        roles_invalidos = [rol for rol in roles if rol not in roles_validos]
        
        if roles_invalidos:
            logger.error(f"❌ FALLO: Roles inválidos encontrados: {roles_invalidos}")
            return False
        
        logger.info(f"✅ ÉXITO: Todos los roles son válidos: {roles}")
        return True
        
    except Exception as e:
        logger.error(f"❌ ERROR verificando roles: {e}")
        return False
    finally:
        db.close()

def verify_no_admin_in_auto_registro():
    """Verificar que no hay usuarios admin creados recientemente (posible escalación)."""
    logger.info("Verificando ausencia de escalación de privilegios...")
    
    db = SessionLocal()
    try:
        # Buscar admins creados en las últimas 24 horas
        result = db.execute(text("""
            SELECT id, correo_institucional, fecha_creacion 
            FROM personas 
            WHERE rol = 'admin' 
            AND fecha_creacion > datetime('now', '-1 day')
        """))
        
        admins_recientes = result.fetchall()
        
        if admins_recientes:
            logger.warning(f"⚠️  ADVERTENCIA: {len(admins_recientes)} admin(s) creado(s) recientemente:")
            for admin in admins_recientes:
                logger.warning(f"  - ID: {admin.id}, Email: {admin.correo_institucional}, Fecha: {admin.fecha_creacion}")
            logger.warning("Verificar que estos admins fueron creados legítimamente")
            return False
        
        logger.info("✅ ÉXITO: No hay admins creados recientemente")
        return True
        
    except Exception as e:
        logger.error(f"❌ ERROR verificando escalación: {e}")
        return False
    finally:
        db.close()

def verify_role_distribution():
    """Verificar distribución de roles."""
    logger.info("Verificando distribución de roles...")
    
    db = SessionLocal()
    try:
        result = db.execute(text("""
            SELECT rol, COUNT(*) as count 
            FROM personas 
            GROUP BY rol 
            ORDER BY count DESC
        """))
        
        distribucion = result.fetchall()
        
        logger.info("Distribución de roles:")
        total_usuarios = 0
        admin_count = 0
        
        for rol, count in distribucion:
            logger.info(f"  {rol}: {count} usuarios")
            total_usuarios += count
            if rol == 'admin':
                admin_count = count
        
        # Verificar que no hay demasiados admins (posible escalación)
        if admin_count > total_usuarios * 0.1:  # Más del 10% son admins
            logger.warning(f"⚠️  ADVERTENCIA: Alto porcentaje de admins ({admin_count}/{total_usuarios} = {admin_count/total_usuarios*100:.1f}%)")
            return False
        
        logger.info(f"✅ ÉXITO: Distribución de roles normal ({admin_count} admins de {total_usuarios} usuarios)")
        return True
        
    except Exception as e:
        logger.error(f"❌ ERROR verificando distribución: {e}")
        return False
    finally:
        db.close()

def verify_schema_consistency():
    """Verificar que el schema de PersonaRegistro no permite admin."""
    logger.info("Verificando consistencia del schema...")
    
    try:
        # Importar y verificar el schema
        from app.schemas.persona import PersonaRegistro, RolRegistro
        
        # Verificar que RolRegistro no incluye admin
        roles_permitidos = [rol.value for rol in RolRegistro]
        
        if 'admin' in roles_permitidos:
            logger.error("❌ FALLO: RolRegistro permite 'admin' - VULNERABILIDAD DE SEGURIDAD")
            return False
        
        logger.info(f"✅ ÉXITO: RolRegistro solo permite: {roles_permitidos}")
        
        # Verificar que PersonaRegistro usa RolRegistro
        import inspect
        annotations = inspect.get_annotations(PersonaRegistro)
        
        if 'rol' not in annotations:
            logger.error("❌ FALLO: PersonaRegistro no tiene campo 'rol'")
            return False
        
        logger.info("✅ ÉXITO: PersonaRegistro usa campo 'rol' correctamente")
        return True
        
    except Exception as e:
        logger.error(f"❌ ERROR verificando schema: {e}")
        return False

def verify_endpoint_security():
    """Verificar que el endpoint de registro usa PersonaRegistro."""
    logger.info("Verificando seguridad del endpoint...")
    
    try:
        # Verificar que el endpoint usa PersonaRegistro
        from app.routes.persona import registro_usuario
        import inspect
        
        sig = inspect.signature(registro_usuario)
        
        # Buscar parámetro persona_in
        persona_param = None
        for param_name, param in sig.parameters.items():
            if param_name == 'persona_in':
                persona_param = param
                break
        
        if not persona_param:
            logger.error("❌ FALLO: Endpoint no tiene parámetro persona_in")
            return False
        
        # Verificar que usa PersonaRegistro
        if 'PersonaRegistro' not in str(persona_param.annotation):
            logger.error(f"❌ FALLO: Endpoint usa {persona_param.annotation} en lugar de PersonaRegistro")
            return False
        
        logger.info("✅ ÉXITO: Endpoint usa PersonaRegistro correctamente")
        return True
        
    except Exception as e:
        logger.error(f"❌ ERROR verificando endpoint: {e}")
        return False

def main():
    """Función principal de verificación."""
    logger.info("=== VERIFICACIÓN DE SEGURIDAD POST-MIGRACIÓN ===")
    logger.info("Verificando que la refactorización tipo_persona -> rol es segura")
    
    verificaciones = [
        ("Eliminación de tipo_persona", verify_tipo_persona_removed),
        ("Existencia de columna rol", verify_rol_column_exists),
        ("Roles válidos", verify_valid_roles),
        ("No escalación de privilegios", verify_no_admin_in_auto_registro),
        ("Distribución de roles", verify_role_distribution),
        ("Consistencia del schema", verify_schema_consistency),
        ("Seguridad del endpoint", verify_endpoint_security),
    ]
    
    resultados = []
    
    for nombre, verificacion in verificaciones:
        logger.info(f"\n--- {nombre} ---")
        try:
            resultado = verificacion()
            resultados.append((nombre, resultado))
        except Exception as e:
            logger.error(f"❌ ERROR en {nombre}: {e}")
            resultados.append((nombre, False))
    
    # Resumen
    logger.info("\n=== RESUMEN DE VERIFICACIÓN ===")
    exitosas = 0
    fallidas = 0
    
    for nombre, resultado in resultados:
        if resultado:
            logger.info(f"✅ {nombre}")
            exitosas += 1
        else:
            logger.error(f"❌ {nombre}")
            fallidas += 1
    
    logger.info(f"\nResultado: {exitosas} exitosas, {fallidas} fallidas")
    
    if fallidas == 0:
        logger.info("🎉 TODAS LAS VERIFICACIONES EXITOSAS - SISTEMA SEGURO")
        return True
    else:
        logger.error("⚠️  VERIFICACIONES FALLIDAS - REVISAR SEGURIDAD")
        return False

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        logger.warning("Verificación cancelada por usuario")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Error inesperado: {e}")
        sys.exit(1)
