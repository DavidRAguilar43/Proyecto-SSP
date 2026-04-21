"""
Script de migración para crear el catálogo de modelos de IA.
Migra los datos del archivo JSON a la base de datos.

Uso:
    python -m scripts.migrations_scripts.migrate_modelos_ia
"""

import json
import sys
from pathlib import Path

# Agregar el directorio raíz al path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sqlalchemy.orm import Session
from app.db.database import SessionLocal, engine
from app.models.modelo_ia import ModeloIA
from app.db.database import Base


def load_models_from_json():
    """Cargar modelos desde el archivo JSON."""
    json_path = Path(__file__).parent.parent.parent / "app" / "config" / "ai_models.json"
    
    if not json_path.exists():
        print(f"❌ Archivo JSON no encontrado: {json_path}")
        return []
    
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    return data.get("models", [])


def migrate_modelos_ia(db: Session):
    """
    Migrar modelos de IA del JSON a la base de datos.
    
    Args:
        db: Sesión de base de datos
    """
    print("=" * 80)
    print("🔄 INICIANDO MIGRACIÓN DE MODELOS DE IA")
    print("=" * 80)
    
    # Cargar modelos del JSON
    models_data = load_models_from_json()
    
    if not models_data:
        print("⚠️ No se encontraron modelos en el archivo JSON")
        return
    
    print(f"\n📊 Total de modelos en JSON: {len(models_data)}")
    
    # Verificar cuántos ya existen
    existing_count = db.query(ModeloIA).count()
    print(f"📊 Modelos existentes en BD: {existing_count}")
    
    created_count = 0
    updated_count = 0
    skipped_count = 0
    
    for model_data in models_data:
        try:
            # Buscar si ya existe por model_id
            existing = db.query(ModeloIA).filter(
                ModeloIA.model_id == model_data["id"]
            ).first()
            
            if existing:
                # Actualizar modelo existente
                existing.titulo = model_data["name"]
                existing.proveedor = model_data["provider"]
                existing.descripcion = model_data.get("description", "")
                existing.categoria = model_data.get("category", "standard")
                existing.recomendado = model_data.get("recommended", False)
                existing.activo = True
                
                updated_count += 1
                print(f"  ✏️ Actualizado: {model_data['name']}")
            else:
                # Crear nuevo modelo
                nuevo_modelo = ModeloIA(
                    titulo=model_data["name"],
                    model_id=model_data["id"],
                    proveedor=model_data["provider"],
                    descripcion=model_data.get("description", ""),
                    categoria=model_data.get("category", "standard"),
                    recomendado=model_data.get("recommended", False),
                    activo=True
                )
                db.add(nuevo_modelo)
                created_count += 1
                print(f"  ✅ Creado: {model_data['name']}")
        
        except Exception as e:
            print(f"  ❌ Error procesando {model_data.get('name', 'Unknown')}: {e}")
            skipped_count += 1
            continue
    
    # Commit de todos los cambios
    try:
        db.commit()
        print("\n" + "=" * 80)
        print("✅ MIGRACIÓN COMPLETADA")
        print("=" * 80)
        print(f"📊 Resumen:")
        print(f"   - Modelos creados: {created_count}")
        print(f"   - Modelos actualizados: {updated_count}")
        print(f"   - Modelos omitidos (error): {skipped_count}")
        print(f"   - Total en BD: {db.query(ModeloIA).count()}")
        print("=" * 80)
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error al guardar cambios: {e}")
        raise


def main():
    """Función principal."""
    # Crear tablas si no existen
    Base.metadata.create_all(bind=engine)
    
    # Crear sesión
    db = SessionLocal()
    
    try:
        migrate_modelos_ia(db)
    except Exception as e:
        print(f"\n❌ Error durante la migración: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    main()

