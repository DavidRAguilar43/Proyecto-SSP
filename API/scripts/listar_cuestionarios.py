#!/usr/bin/env python3
"""
Script para listar todos los cuestionarios y sus asignaciones.
Útil para encontrar el ID del cuestionario que necesitas actualizar.
"""

import sys
from pathlib import Path
from datetime import datetime

# Agregar el directorio API al path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.cuestionario_admin import CuestionarioAdmin, AsignacionCuestionario


def listar_cuestionarios():
    """Lista todos los cuestionarios con sus detalles."""
    db = SessionLocal()
    
    try:
        cuestionarios = db.query(CuestionarioAdmin).all()
        
        if not cuestionarios:
            print("❌ No hay cuestionarios en la base de datos")
            return
        
        print(f"\n{'='*100}")
        print(f"{'CUESTIONARIOS DISPONIBLES':^100}")
        print(f"{'='*100}\n")
        
        for i, cuestionario in enumerate(cuestionarios, 1):
            # Obtener asignaciones
            asignaciones = db.query(AsignacionCuestionario).filter(
                AsignacionCuestionario.cuestionario_id == cuestionario.id
            ).all()
            
            tipos_asignados = [a.tipo_usuario.value for a in asignaciones] if asignaciones else []
            
            print(f"{i}. {cuestionario.titulo}")
            print(f"   ID: {cuestionario.id}")
            print(f"   Estado: {cuestionario.estado.value}")
            print(f"   Descripción: {cuestionario.descripcion[:60]}...")
            print(f"   Preguntas: {cuestionario.total_preguntas}")
            print(f"   Asignado a: {', '.join(tipos_asignados) if tipos_asignados else '❌ SIN ASIGNACIONES'}")
            print(f"   Creado: {cuestionario.fecha_creacion.strftime('%Y-%m-%d %H:%M:%S')}")
            
            if cuestionario.fecha_inicio:
                print(f"   Disponible desde: {cuestionario.fecha_inicio.strftime('%Y-%m-%d %H:%M:%S')}")
            if cuestionario.fecha_fin:
                print(f"   Disponible hasta: {cuestionario.fecha_fin.strftime('%Y-%m-%d %H:%M:%S')}")
            
            print()
        
        print(f"{'='*100}\n")
        print(f"Total: {len(cuestionarios)} cuestionarios\n")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    finally:
        db.close()


if __name__ == "__main__":
    listar_cuestionarios()

