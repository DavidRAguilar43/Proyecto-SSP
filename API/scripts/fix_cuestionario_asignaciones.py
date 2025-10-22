#!/usr/bin/env python3
"""
Script para actualizar las asignaciones de un cuestionario.
Asegura que el cuestionario sea visible para los roles especificados.

Uso:
    python fix_cuestionario_asignaciones.py <cuestionario_id> <tipos_usuario>
    
Ejemplo:
    python fix_cuestionario_asignaciones.py "abc123" "alumno,docente,personal"
    python fix_cuestionario_asignaciones.py "abc123" "alumno"
"""

import sys
import os
from pathlib import Path

# Agregar el directorio API al path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.db.database import SessionLocal, engine
from app.models.cuestionario_admin import (
    CuestionarioAdmin,
    AsignacionCuestionario,
    TipoUsuario,
    EstadoCuestionario
)


def fix_cuestionario_asignaciones(cuestionario_id: str, tipos_usuario: list):
    """
    Actualiza las asignaciones de un cuestionario.
    
    Args:
        cuestionario_id: ID del cuestionario
        tipos_usuario: Lista de tipos de usuario (alumno, docente, personal)
    """
    db = SessionLocal()
    
    try:
        # Buscar el cuestionario
        cuestionario = db.query(CuestionarioAdmin).filter(
            CuestionarioAdmin.id == cuestionario_id
        ).first()
        
        if not cuestionario:
            print(f"❌ Cuestionario con ID '{cuestionario_id}' no encontrado")
            return False
        
        print(f"✅ Cuestionario encontrado: {cuestionario.titulo}")
        print(f"   Estado: {cuestionario.estado}")
        print(f"   Descripción: {cuestionario.descripcion}")
        
        # Validar tipos de usuario
        tipos_validos = [t.value for t in TipoUsuario]
        for tipo in tipos_usuario:
            if tipo not in tipos_validos:
                print(f"❌ Tipo de usuario inválido: {tipo}")
                print(f"   Tipos válidos: {', '.join(tipos_validos)}")
                return False
        
        # Eliminar asignaciones existentes
        asignaciones_existentes = db.query(AsignacionCuestionario).filter(
            AsignacionCuestionario.cuestionario_id == cuestionario_id
        ).all()
        
        if asignaciones_existentes:
            print(f"\n🗑️  Eliminando {len(asignaciones_existentes)} asignaciones existentes...")
            for asignacion in asignaciones_existentes:
                db.delete(asignacion)
        
        # Crear nuevas asignaciones
        print(f"\n➕ Creando nuevas asignaciones para: {', '.join(tipos_usuario)}")
        for tipo_usuario in tipos_usuario:
            asignacion = AsignacionCuestionario(
                cuestionario_id=cuestionario_id,
                tipo_usuario=TipoUsuario(tipo_usuario)
            )
            db.add(asignacion)
            print(f"   ✓ {tipo_usuario}")
        
        # Asegurar que el cuestionario está activo
        if cuestionario.estado != EstadoCuestionario.ACTIVO:
            print(f"\n⚠️  Cambiando estado a ACTIVO...")
            cuestionario.estado = EstadoCuestionario.ACTIVO
        
        db.commit()
        
        print(f"\n✅ Cuestionario actualizado exitosamente!")
        print(f"   ID: {cuestionario.id}")
        print(f"   Título: {cuestionario.titulo}")
        print(f"   Estado: {cuestionario.estado}")
        print(f"   Asignado a: {', '.join(tipos_usuario)}")
        
        return True
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {str(e)}")
        return False
    finally:
        db.close()


def main():
    if len(sys.argv) < 3:
        print("Uso: python fix_cuestionario_asignaciones.py <cuestionario_id> <tipos_usuario>")
        print("\nEjemplos:")
        print('  python fix_cuestionario_asignaciones.py "abc123" "alumno,docente,personal"')
        print('  python fix_cuestionario_asignaciones.py "abc123" "alumno"')
        print("\nTipos de usuario válidos: alumno, docente, personal")
        sys.exit(1)
    
    cuestionario_id = sys.argv[1]
    tipos_usuario_str = sys.argv[2]
    
    # Parsear tipos de usuario
    tipos_usuario = [t.strip() for t in tipos_usuario_str.split(",")]
    
    # Ejecutar
    success = fix_cuestionario_asignaciones(cuestionario_id, tipos_usuario)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()

