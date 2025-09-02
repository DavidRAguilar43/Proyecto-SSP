#!/usr/bin/env python3
"""
Script para crear la tabla de citas en la base de datos.
"""

from sqlalchemy import create_engine, text

def create_citas_table():
    """Crear la tabla de citas."""
    # Usar la misma configuración que el resto de la aplicación
    database_url = "sqlite:///./ssp_database.db"
    engine = create_engine(database_url)
    
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS citas (
        id_cita INTEGER PRIMARY KEY AUTOINCREMENT,
        id_alumno INTEGER NOT NULL,
        id_personal INTEGER,
        tipo_cita VARCHAR(20) NOT NULL DEFAULT 'general',
        motivo TEXT NOT NULL,
        estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
        fecha_solicitud DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_propuesta_alumno DATETIME,
        fecha_confirmada DATETIME,
        fecha_completada DATETIME,
        observaciones_alumno TEXT,
        observaciones_personal TEXT,
        ubicacion VARCHAR(200),
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion DATETIME,
        FOREIGN KEY (id_alumno) REFERENCES personas (id),
        FOREIGN KEY (id_personal) REFERENCES personas (id)
    );
    """
    
    # Crear índices para mejorar el rendimiento
    create_indexes_sql = [
        "CREATE INDEX IF NOT EXISTS idx_citas_alumno ON citas (id_alumno);",
        "CREATE INDEX IF NOT EXISTS idx_citas_personal ON citas (id_personal);",
        "CREATE INDEX IF NOT EXISTS idx_citas_estado ON citas (estado);",
        "CREATE INDEX IF NOT EXISTS idx_citas_fecha_solicitud ON citas (fecha_solicitud);",
        "CREATE INDEX IF NOT EXISTS idx_citas_tipo ON citas (tipo_cita);"
    ]
    
    try:
        with engine.connect() as connection:
            # Crear la tabla
            print("🔧 Creando tabla de citas...")
            connection.execute(text(create_table_sql))
            connection.commit()
            print("✅ Tabla 'citas' creada exitosamente!")
            
            # Crear índices
            print("🔧 Creando índices...")
            for index_sql in create_indexes_sql:
                connection.execute(text(index_sql))
                connection.commit()
            print("✅ Índices creados exitosamente!")
            
            # Verificar que la tabla se creó correctamente
            result = connection.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='citas';"))
            if result.fetchone():
                print("✅ Verificación exitosa: La tabla 'citas' existe en la base de datos")
                
                # Mostrar estructura de la tabla
                result = connection.execute(text("PRAGMA table_info(citas);"))
                columns = result.fetchall()
                print("\n📋 Estructura de la tabla 'citas':")
                for col in columns:
                    print(f"  - {col[1]} ({col[2]}) {'NOT NULL' if col[3] else 'NULL'}")
            else:
                print("❌ Error: La tabla 'citas' no se creó correctamente")
                
    except Exception as e:
        print(f"❌ Error creando la tabla de citas: {e}")
        return False
    
    return True

def insert_sample_data():
    """Insertar datos de ejemplo para pruebas."""
    database_url = "sqlite:///./ssp_database.db"
    engine = create_engine(database_url)
    
    # Datos de ejemplo
    sample_citas = [
        {
            'id_alumno': 2,  # Juan Pérez
            'tipo_cita': 'psicologica',
            'motivo': 'Necesito apoyo para manejar el estrés académico y mejorar mi concentración en los estudios.',
            'estado': 'pendiente',
            'observaciones_alumno': 'Prefiero horarios por la tarde después de las 2 PM'
        },
        {
            'id_alumno': 2,  # Juan Pérez
            'tipo_cita': 'academica',
            'motivo': 'Tengo dificultades con las materias de matemáticas y necesito orientación académica.',
            'estado': 'confirmada',
            'fecha_confirmada': '2025-08-25 14:00:00',
            'id_personal': 1,  # Admin como personal
            'observaciones_personal': 'Cita confirmada para revisión de plan de estudios',
            'ubicacion': 'Oficina de Servicios Estudiantiles, Cubículo 3'
        }
    ]
    
    try:
        with engine.connect() as connection:
            print("\n🔧 Insertando datos de ejemplo...")
            
            for cita in sample_citas:
                # Construir la consulta INSERT
                columns = ', '.join(cita.keys())
                placeholders = ', '.join([f":{key}" for key in cita.keys()])
                
                insert_sql = f"INSERT INTO citas ({columns}) VALUES ({placeholders})"
                connection.execute(text(insert_sql), cita)
            
            connection.commit()
            print("✅ Datos de ejemplo insertados exitosamente!")
            
            # Verificar los datos insertados
            result = connection.execute(text("SELECT COUNT(*) FROM citas"))
            count = result.fetchone()[0]
            print(f"📊 Total de citas en la base de datos: {count}")
            
    except Exception as e:
        print(f"❌ Error insertando datos de ejemplo: {e}")

if __name__ == "__main__":
    print("🚀 CREACIÓN DE TABLA DE CITAS")
    print("=" * 50)
    
    if create_citas_table():
        print("\n🎯 ¿Deseas insertar datos de ejemplo? (y/n)")
        response = input().lower().strip()
        if response in ['y', 'yes', 'sí', 's']:
            insert_sample_data()
    
    print("\n🎉 PROCESO COMPLETADO")
    print("=" * 50)
