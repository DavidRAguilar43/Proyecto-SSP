#!/usr/bin/env python3
"""Verificar que la migración se aplicó correctamente."""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import inspect
from app.db.database import engine

def main():
    inspector = inspect(engine)
    
    # Verificar tablas
    tables = inspector.get_table_names()
    print("=== TABLAS EN LA BASE DE DATOS ===")
    for table in sorted(tables):
        print(f"  ✓ {table}")
    
    print(f"\n¿Existe tabla 'atencion'? {'SÍ' if 'atencion' in tables else 'NO (eliminada correctamente)'}")
    
    # Verificar columnas de citas
    print("\n=== COLUMNAS EN TABLA 'citas' ===")
    citas_columns = [col['name'] for col in inspector.get_columns('citas')]
    
    required_columns = [
        'motivo_psicologico',
        'motivo_academico',
        'salud_en_general_vulnerable',
        'requiere_seguimiento',
        'requiere_canalizacion_externa',
        'estatus_canalizacion_externa',
        'fecha_proxima_sesion',
        'ultima_fecha_contacto',
        'id_grupo',
        'id_cuestionario'
    ]
    
    print("Nuevas columnas agregadas:")
    for col in required_columns:
        status = "✓" if col in citas_columns else "✗"
        print(f"  {status} {col}")
    
    all_present = all(col in citas_columns for col in required_columns)
    
    if all_present:
        print("\n✅ MIGRACIÓN EXITOSA - Todas las columnas fueron agregadas")
    else:
        print("\n❌ ERROR - Faltan algunas columnas")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())

