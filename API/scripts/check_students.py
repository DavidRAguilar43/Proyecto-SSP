from app.db.database import SessionLocal
from app.models.persona import Persona

db = SessionLocal()
estudiantes = db.query(Persona).filter(Persona.rol == "alumno").all()

print(f"Total estudiantes: {len(estudiantes)}")
for e in estudiantes:
    print(f"ID: {e.id}, Matrícula: {e.matricula}, Correo: {e.correo_institucional}")
    print(f"Campos requeridos:")
    print(f"- Rol: {e.rol}")
    print(f"- Sexo: {e.sexo}")
    print(f"- Género: {e.genero}")
    print(f"- Edad: {e.edad}")
    print(f"- Estado civil: {e.estado_civil}")
    print(f"- Lugar origen: {e.lugar_origen}")
    print(f"- Colonia: {e.colonia_residencia_actual}")
    print(f"- Celular: {e.celular}")
    print(f"- Correo: {e.correo_institucional}")
    print("---")
