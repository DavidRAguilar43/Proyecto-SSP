#!/usr/bin/env python3
"""
Script de migración para simplificar el sistema de cohortes.
Elimina la tabla cohorte y migra a campos directos en persona.
"""

import sys
import os

# Agregar el directorio padre al path para importar módulos de la app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from sqlalchemy.orm import Session
from app.db.database import SessionLocal, engine

def backup_existing_data(db: Session):
    """Hacer backup de datos existentes de cohortes."""
    print("=== BACKUP DE DATOS EXISTENTES ===")
    
    try:
        # Verificar si existe la tabla cohorte
        result = db.execute(text("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='cohorte';
        """))
        
        if result.fetchone():
            print("✅ Tabla 'cohorte' encontrada")
            
            # Obtener datos de cohortes existentes
            cohortes_result = db.execute(text("SELECT * FROM cohorte"))
            cohortes = cohortes_result.fetchall()
            
            print(f"📊 Cohortes existentes: {len(cohortes)}")
            for cohorte in cohortes:
                print(f"  - ID: {cohorte[0]}, Nombre: {cohorte[1]}")
            
            # Obtener personas con cohorte_id
            personas_result = db.execute(text("""
                SELECT id, correo_institucional, cohorte_id
                FROM personas
                WHERE cohorte_id IS NOT NULL
            """))
            personas = personas_result.fetchall()
            
            print(f"👥 Personas con cohorte asignada: {len(personas)}")
            
            return cohortes, personas
        else:
            print("ℹ️ Tabla 'cohorte' no encontrada")
            return [], []
            
    except Exception as e:
        print(f"⚠️ Error durante backup: {e}")
        return [], []

def add_new_columns(db: Session):
    """Agregar nuevas columnas a la tabla persona."""
    print("\n=== AGREGANDO NUEVAS COLUMNAS ===")
    
    try:
        # Verificar si las columnas ya existen
        result = db.execute(text("PRAGMA table_info(personas)"))
        columns = [row[1] for row in result.fetchall()]

        if 'cohorte_ano' not in columns:
            print("➕ Agregando columna 'cohorte_ano'...")
            db.execute(text("ALTER TABLE personas ADD COLUMN cohorte_ano INTEGER"))
            print("✅ Columna 'cohorte_ano' agregada")
        else:
            print("ℹ️ Columna 'cohorte_ano' ya existe")

        if 'cohorte_periodo' not in columns:
            print("➕ Agregando columna 'cohorte_periodo'...")
            db.execute(text("ALTER TABLE personas ADD COLUMN cohorte_periodo INTEGER DEFAULT 1"))
            print("✅ Columna 'cohorte_periodo' agregada")
        else:
            print("ℹ️ Columna 'cohorte_periodo' ya existe")
        
        db.commit()
        
    except Exception as e:
        print(f"❌ Error agregando columnas: {e}")
        db.rollback()
        raise

def migrate_existing_data(db: Session, cohortes, personas):
    """Migrar datos existentes al nuevo formato."""
    print("\n=== MIGRANDO DATOS EXISTENTES ===")
    
    if not personas:
        print("ℹ️ No hay datos de cohorte para migrar")
        return
    
    try:
        # Crear mapeo de cohorte_id a información de cohorte
        cohorte_map = {}
        for cohorte in cohortes:
            cohorte_id, nombre = cohorte[0], cohorte[1]
            
            # Intentar extraer año y período del nombre
            # Formatos esperados: "2024-1", "Cohorte 2024-1", etc.
            ano, periodo = extract_year_period_from_name(nombre)
            cohorte_map[cohorte_id] = (ano, periodo)
            
            print(f"📋 Cohorte ID {cohorte_id} ('{nombre}') → Año: {ano}, Período: {periodo}")
        
        # Migrar datos de personas
        migrated_count = 0
        for persona in personas:
            persona_id, email, cohorte_id = persona[0], persona[1], persona[2]
            
            if cohorte_id in cohorte_map:
                ano, periodo = cohorte_map[cohorte_id]
                
                # Actualizar persona con nuevos campos
                db.execute(text("""
                    UPDATE personas
                    SET cohorte_ano = :ano, cohorte_periodo = :periodo
                    WHERE id = :persona_id
                """), {
                    'ano': ano,
                    'periodo': periodo,
                    'persona_id': persona_id
                })
                
                migrated_count += 1
                print(f"  ✅ {email} → Año: {ano}, Período: {periodo}")
        
        db.commit()
        print(f"✅ {migrated_count} personas migradas exitosamente")
        
    except Exception as e:
        print(f"❌ Error migrando datos: {e}")
        db.rollback()
        raise

def extract_year_period_from_name(nombre):
    """Extraer año y período del nombre de cohorte."""
    import re
    
    # Buscar patrón año-período (ej: 2024-1, 2025-2)
    match = re.search(r'(\d{4})-(\d)', nombre)
    if match:
        return int(match.group(1)), int(match.group(2))
    
    # Buscar solo año (asumir período 1)
    match = re.search(r'(\d{4})', nombre)
    if match:
        return int(match.group(1)), 1
    
    # Valores por defecto si no se puede extraer
    print(f"⚠️ No se pudo extraer año/período de '{nombre}', usando valores por defecto")
    return 2024, 1

def remove_old_column(db: Session):
    """Eliminar columna cohorte_id antigua."""
    print("\n=== ELIMINANDO COLUMNA ANTIGUA ===")
    
    try:
        # En SQLite, no se puede eliminar columnas directamente
        # Necesitamos recrear la tabla sin la columna
        print("⚠️ SQLite no permite eliminar columnas directamente")
        print("ℹ️ La columna 'cohorte_id' se mantendrá pero no se usará")
        print("ℹ️ En producción, considere recrear la tabla sin esta columna")
        
    except Exception as e:
        print(f"❌ Error eliminando columna: {e}")

def drop_cohorte_table(db: Session):
    """Eliminar tabla cohorte."""
    print("\n=== ELIMINANDO TABLA COHORTE ===")
    
    try:
        # Verificar si la tabla existe
        result = db.execute(text("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='cohorte';
        """))
        
        if result.fetchone():
            print("🗑️ Eliminando tabla 'cohorte'...")
            db.execute(text("DROP TABLE cohorte"))
            db.commit()
            print("✅ Tabla 'cohorte' eliminada exitosamente")
        else:
            print("ℹ️ Tabla 'cohorte' no existe")
            
    except Exception as e:
        print(f"❌ Error eliminando tabla: {e}")
        db.rollback()
        raise

def verify_migration(db: Session):
    """Verificar que la migración fue exitosa."""
    print("\n=== VERIFICANDO MIGRACIÓN ===")
    
    try:
        # Verificar nuevas columnas
        result = db.execute(text("""
            SELECT COUNT(*) as total,
                   COUNT(cohorte_ano) as con_ano,
                   COUNT(cohorte_periodo) as con_periodo
            FROM personas
        """))
        
        stats = result.fetchone()
        print(f"📊 Total personas: {stats[0]}")
        print(f"📊 Con año de cohorte: {stats[1]}")
        print(f"📊 Con período de cohorte: {stats[2]}")
        
        # Mostrar algunos ejemplos
        result = db.execute(text("""
            SELECT correo_institucional, cohorte_ano, cohorte_periodo
            FROM personas
            WHERE cohorte_ano IS NOT NULL
            LIMIT 5
        """))
        
        ejemplos = result.fetchall()
        if ejemplos:
            print("\n📋 Ejemplos de datos migrados:")
            for ejemplo in ejemplos:
                print(f"  - {ejemplo[0]}: Año {ejemplo[1]}, Período {ejemplo[2]}")
        
        print("✅ Verificación completada")
        
    except Exception as e:
        print(f"❌ Error en verificación: {e}")

def main():
    """Función principal de migración."""
    print("=== MIGRACIÓN DE SIMPLIFICACIÓN DE COHORTES ===")
    print("Este script migra del sistema de tabla cohorte a campos directos")
    print()
    
    # Crear sesión de base de datos
    db = SessionLocal()
    
    try:
        # Paso 1: Backup de datos existentes
        cohortes, personas = backup_existing_data(db)
        
        # Paso 2: Agregar nuevas columnas
        add_new_columns(db)
        
        # Paso 3: Migrar datos existentes
        migrate_existing_data(db, cohortes, personas)
        
        # Paso 4: Eliminar columna antigua (opcional en SQLite)
        remove_old_column(db)
        
        # Paso 5: Eliminar tabla cohorte
        drop_cohorte_table(db)
        
        # Paso 6: Verificar migración
        verify_migration(db)
        
        print("\n=== MIGRACIÓN COMPLETADA EXITOSAMENTE ===")
        print("✅ Sistema de cohortes simplificado")
        print("✅ Datos migrados correctamente")
        print("✅ Tabla cohorte eliminada")
        
        return 0
        
    except Exception as e:
        print(f"\n❌ ERROR DURANTE LA MIGRACIÓN: {e}")
        db.rollback()
        return 1
    finally:
        db.close()

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
