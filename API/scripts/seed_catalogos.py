#!/usr/bin/env python3
"""
Script para poblar los catálogos con datos iniciales.
"""

import sys
import os

# Agregar el directorio padre al path para importar módulos de la app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.db.database import SessionLocal, engine
from app.models.religion import Religion
from app.models.grupo_etnico import GrupoEtnico
from app.models.discapacidad import Discapacidad

def seed_religiones(db: Session):
    """Poblar catálogo de religiones."""
    religiones_data = [
        "Católica",
        "Protestante",
        "Evangélica",
        "Cristiana",
        "Judaísmo",
        "Islam",
        "Budismo",
        "Hinduismo",
        "Testigos de Jehová",
        "Mormón",
        "Adventista",
        "Pentecostal",
        "Bautista",
        "Metodista",
        "Presbiteriana",
        "Ortodoxa",
        "Agnóstico",
        "Ateo",
        "Sin religión",
        "Espiritualidad sin religión organizada"
    ]
    
    print("Poblando catálogo de religiones...")
    for titulo in religiones_data:
        # Verificar si ya existe
        existing = db.query(Religion).filter(Religion.titulo == titulo).first()
        if not existing:
            religion = Religion(titulo=titulo, activo=True)
            db.add(religion)
            print(f"  + {titulo}")
        else:
            print(f"  - {titulo} (ya existe)")
    
    db.commit()
    print(f"Religiones completadas: {len(religiones_data)} elementos")


def seed_grupos_etnicos(db: Session):
    """Poblar catálogo de grupos étnicos."""
    grupos_data = [
        "Mestizo",
        "Indígena",
        "Blanco",
        "Afromexicano",
        "Asiático",
        "Maya",
        "Náhuatl",
        "Zapoteco",
        "Mixteco",
        "Otomí",
        "Totonaco",
        "Mazahua",
        "Huichol",
        "Purépecha",
        "Chinanteco",
        "Mixe",
        "Tzeltal",
        "Tzotzil",
        "Chol",
        "Huasteco",
        "Tarahumara",
        "Yaqui",
        "Mayo",
        "Seri",
        "Cucapá",
        "Kikapú",
        "No especifica",
        "Prefiere no decir"
    ]
    
    print("\nPoblando catálogo de grupos étnicos...")
    for titulo in grupos_data:
        # Verificar si ya existe
        existing = db.query(GrupoEtnico).filter(GrupoEtnico.titulo == titulo).first()
        if not existing:
            grupo = GrupoEtnico(titulo=titulo, activo=True)
            db.add(grupo)
            print(f"  + {titulo}")
        else:
            print(f"  - {titulo} (ya existe)")
    
    db.commit()
    print(f"Grupos étnicos completados: {len(grupos_data)} elementos")


def seed_discapacidades(db: Session):
    """Poblar catálogo de discapacidades."""
    discapacidades_data = [
        "Ninguna",
        "Visual (ceguera)",
        "Visual (baja visión)",
        "Auditiva (sordera)",
        "Auditiva (hipoacusia)",
        "Motriz (miembros superiores)",
        "Motriz (miembros inferiores)",
        "Motriz (general)",
        "Intelectual",
        "Psicosocial",
        "Múltiple",
        "Autismo",
        "Síndrome de Down",
        "Parálisis cerebral",
        "Distrofia muscular",
        "Espina bífida",
        "Amputación",
        "Lesión medular",
        "Dislexia",
        "TDAH (Trastorno por Déficit de Atención e Hiperactividad)",
        "Trastorno del espectro autista",
        "Discapacidad del habla",
        "Discapacidad del lenguaje",
        "Epilepsia",
        "Diabetes",
        "Enfermedad crónica",
        "Otra discapacidad física",
        "Otra discapacidad sensorial",
        "Otra discapacidad intelectual",
        "Otra discapacidad psicosocial"
    ]
    
    print("\nPoblando catálogo de discapacidades...")
    for titulo in discapacidades_data:
        # Verificar si ya existe
        existing = db.query(Discapacidad).filter(Discapacidad.titulo == titulo).first()
        if not existing:
            discapacidad = Discapacidad(titulo=titulo, activo=True)
            db.add(discapacidad)
            print(f"  + {titulo}")
        else:
            print(f"  - {titulo} (ya existe)")
    
    db.commit()
    print(f"Discapacidades completadas: {len(discapacidades_data)} elementos")


def main():
    """Función principal."""
    print("=== POBLANDO CATÁLOGOS ===")
    print("Iniciando población de catálogos con datos iniciales...")
    
    # Crear sesión de base de datos
    db = SessionLocal()
    
    try:
        # Poblar cada catálogo
        seed_religiones(db)
        seed_grupos_etnicos(db)
        seed_discapacidades(db)
        
        print("\n=== COMPLETADO ===")
        print("Todos los catálogos han sido poblados exitosamente.")
        
        # Mostrar estadísticas finales
        total_religiones = db.query(Religion).count()
        total_grupos = db.query(GrupoEtnico).count()
        total_discapacidades = db.query(Discapacidad).count()
        
        print(f"\nEstadísticas finales:")
        print(f"  - Religiones: {total_religiones}")
        print(f"  - Grupos étnicos: {total_grupos}")
        print(f"  - Discapacidades: {total_discapacidades}")
        print(f"  - Total: {total_religiones + total_grupos + total_discapacidades}")
        
    except Exception as e:
        print(f"Error durante la población: {e}")
        db.rollback()
        return 1
    finally:
        db.close()
    
    return 0


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
