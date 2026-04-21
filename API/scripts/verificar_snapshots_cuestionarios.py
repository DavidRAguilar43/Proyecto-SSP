#!/usr/bin/env python3
"""
Script para verificar y corregir snapshots faltantes en respuestas de cuestionarios.

Este script:
1. Identifica respuestas sin snapshot asociado
2. Crea snapshots faltantes
3. Asocia las respuestas con sus snapshots correspondientes

Reason: Algunas respuestas antiguas pueden no tener snapshot_id porque
        el sistema de snapshots se implementó después.
"""

import sys
import os

# Agregar el directorio raíz al path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.orm import Session, joinedload
from app.db.database import SessionLocal
from app.models.cuestionario_admin import (
    CuestionarioAdmin,
    RespuestaCuestionario,
    CuestionarioSnapshot
)
from app.services.snapshot_service import obtener_o_crear_snapshot


def verificar_snapshots(db: Session):
    """
    Verifica respuestas sin snapshot y las corrige.
    
    Args:
        db: Sesión de base de datos
    """
    print("\n" + "="*80)
    print("VERIFICACIÓN DE SNAPSHOTS EN RESPUESTAS")
    print("="*80 + "\n")
    
    # Obtener respuestas sin snapshot
    respuestas_sin_snapshot = db.query(RespuestaCuestionario).filter(
        RespuestaCuestionario.snapshot_id.is_(None)
    ).options(
        joinedload(RespuestaCuestionario.cuestionario),
        joinedload(RespuestaCuestionario.usuario)
    ).all()
    
    if not respuestas_sin_snapshot:
        print("✅ Todas las respuestas tienen snapshot asociado.\n")
        return
    
    print(f"⚠️  Encontradas {len(respuestas_sin_snapshot)} respuestas sin snapshot\n")
    
    for respuesta in respuestas_sin_snapshot:
        cuestionario_titulo = respuesta.cuestionario.titulo if respuesta.cuestionario else "N/A"
        usuario_email = respuesta.usuario.correo_institucional if respuesta.usuario else "N/A"
        
        print(f"📋 Cuestionario: {cuestionario_titulo}")
        print(f"   Usuario: {usuario_email}")
        print(f"   Estado: {respuesta.estado}")
        print(f"   Respuesta ID: {respuesta.id}")
        
        if not respuesta.cuestionario_id:
            print(f"   ❌ No se puede crear snapshot: cuestionario_id es NULL")
            print()
            continue
        
        try:
            # Crear o obtener snapshot
            snapshot = obtener_o_crear_snapshot(
                db=db,
                cuestionario_id=respuesta.cuestionario_id,
                usuario_id=respuesta.usuario_id
            )
            
            # Asociar snapshot con la respuesta
            respuesta.snapshot_id = snapshot.id
            
            print(f"   ✅ Snapshot creado/asociado: {snapshot.id}")
            
        except Exception as e:
            print(f"   ❌ Error al crear snapshot: {str(e)}")
        
        print()
    
    # Guardar cambios
    try:
        db.commit()
        print("✅ Todos los snapshots han sido creados y asociados.\n")
    except Exception as e:
        db.rollback()
        print(f"❌ Error al guardar cambios: {str(e)}\n")


def main():
    """Función principal."""
    db = SessionLocal()
    
    try:
        verificar_snapshots(db)
    
    except Exception as e:
        print(f"\n❌ Error: {str(e)}\n")
        import traceback
        traceback.print_exc()
    
    finally:
        db.close()


if __name__ == "__main__":
    main()

