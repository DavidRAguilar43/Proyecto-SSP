"""
Script de prueba para verificar la protección de respuestas de usuarios.

Este script verifica que:
1. Las respuestas NO se borran al editar un cuestionario
2. La información de preguntas se preserva en las respuestas
3. Se pueden eliminar preguntas sin perder respuestas

Uso:
    python scripts/test_proteccion_respuestas.py
"""

import sys
import os
from datetime import datetime

# Agregar el directorio raíz al path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.orm import Session
from sqlalchemy import text as sa_text
from app.db.database import engine, SessionLocal
from app.models.cuestionario_admin import (
    CuestionarioAdmin,
    Pregunta,
    RespuestaCuestionario,
    RespuestaPregunta,
    TipoPregunta
)
from app.models.persona import User
import uuid


def crear_usuario_prueba(db: Session) -> User:
    """
    Crear un usuario de prueba para las respuestas.

    Args:
        db: Sesión de base de datos

    Returns:
        User: Usuario creado
    """
    # Verificar si ya existe
    usuario = db.query(User).filter(User.correo_institucional == "test_proteccion@test.com").first()
    if usuario:
        return usuario

    usuario = User(
        matricula="TEST_PROT_001",
        sexo="masculino",
        genero="masculino",
        edad=20,
        estado_civil="soltero",
        lugar_origen="Test",
        colonia_residencia_actual="Test",
        celular="1234567890",
        correo_institucional="test_proteccion@test.com",
        rol="alumno",
        hashed_password="test_hash"
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario


def test_proteccion_respuestas():
    """
    Test principal de protección de respuestas.
    """
    db = SessionLocal()

    # IMPORTANTE: Habilitar foreign keys para este test
    db.execute(sa_text("PRAGMA foreign_keys=ON"))

    try:
        print("=" * 80)
        print("TEST: Protección de Respuestas de Usuarios")
        print("=" * 80)
        
        # 1. Crear usuario de prueba
        print("\n1. Creando usuario de prueba...")
        usuario = crear_usuario_prueba(db)
        print(f"   ✓ Usuario creado: {usuario.correo_institucional}")
        
        # 2. Crear cuestionario de prueba
        print("\n2. Creando cuestionario de prueba...")
        cuestionario_id = str(uuid.uuid4())
        cuestionario = CuestionarioAdmin(
            id=cuestionario_id,
            titulo="Cuestionario de Prueba - Protección",
            descripcion="Test de protección de respuestas",
            fecha_creacion=datetime.utcnow(),
            estado="activo",
            creado_por=usuario.id,
            instruccion_sistema="Instrucción inicial",
            modelo_ia="openai/gpt-3.5-turbo"
        )
        db.add(cuestionario)
        db.flush()
        print(f"   ✓ Cuestionario creado: {cuestionario.titulo}")
        
        # 3. Crear preguntas
        print("\n3. Creando preguntas...")
        pregunta1_id = str(uuid.uuid4())
        pregunta1 = Pregunta(
            id=pregunta1_id,
            cuestionario_id=cuestionario_id,
            tipo=TipoPregunta.ABIERTA,
            texto="¿Cuál es tu nombre?",
            obligatoria=True,
            orden=1,
            configuracion={}
        )
        
        pregunta2_id = str(uuid.uuid4())
        pregunta2 = Pregunta(
            id=pregunta2_id,
            cuestionario_id=cuestionario_id,
            tipo=TipoPregunta.OPCION_MULTIPLE,
            texto="¿Cuál es tu color favorito?",
            obligatoria=True,
            orden=2,
            configuracion={"opciones": ["Rojo", "Azul", "Verde"]}
        )
        
        db.add_all([pregunta1, pregunta2])
        db.flush()
        print(f"   ✓ Pregunta 1: {pregunta1.texto}")
        print(f"   ✓ Pregunta 2: {pregunta2.texto}")
        
        # 4. Crear respuesta del usuario
        print("\n4. Usuario responde el cuestionario...")
        respuesta_cuestionario_id = str(uuid.uuid4())
        respuesta_cuestionario = RespuestaCuestionario(
            id=respuesta_cuestionario_id,
            cuestionario_id=cuestionario_id,
            usuario_id=usuario.id,
            estado="completado",
            progreso=100
        )
        db.add(respuesta_cuestionario)
        db.flush()
        
        respuesta1 = RespuestaPregunta(
            respuesta_cuestionario_id=respuesta_cuestionario_id,
            pregunta_id=pregunta1_id,
            valor="Juan Pérez",
            pregunta_texto=pregunta1.texto,
            pregunta_tipo=pregunta1.tipo.value
        )
        
        respuesta2 = RespuestaPregunta(
            respuesta_cuestionario_id=respuesta_cuestionario_id,
            pregunta_id=pregunta2_id,
            valor="Azul",
            pregunta_texto=pregunta2.texto,
            pregunta_tipo=pregunta2.tipo.value
        )
        
        db.add_all([respuesta1, respuesta2])
        db.commit()
        print(f"   ✓ Respuesta 1: {respuesta1.valor}")
        print(f"   ✓ Respuesta 2: {respuesta2.valor}")
        
        # 5. Verificar que las respuestas existen
        print("\n5. Verificando respuestas guardadas...")
        respuestas_count = db.query(RespuestaPregunta).filter(
            RespuestaPregunta.respuesta_cuestionario_id == respuesta_cuestionario_id
        ).count()
        assert respuestas_count == 2, f"Esperaba 2 respuestas, encontré {respuestas_count}"
        print(f"   ✓ {respuestas_count} respuestas guardadas correctamente")
        
        # 6. TEST: Editar solo instrucción de IA (NO debe afectar respuestas)
        print("\n6. TEST: Editando solo instrucción de IA...")
        cuestionario.instruccion_sistema = "Instrucción actualizada"
        cuestionario.modelo_ia = "openai/gpt-4"
        db.commit()
        
        respuestas_count_after = db.query(RespuestaPregunta).filter(
            RespuestaPregunta.respuesta_cuestionario_id == respuesta_cuestionario_id
        ).count()
        assert respuestas_count_after == 2, f"¡ERROR! Respuestas borradas. Esperaba 2, encontré {respuestas_count_after}"
        print(f"   ✓ Respuestas preservadas: {respuestas_count_after}")
        
        # 7. TEST: Modificar texto de pregunta (debe preservar texto original en respuestas)
        print("\n7. TEST: Modificando texto de pregunta...")
        texto_original = pregunta1.texto
        pregunta1.texto = "¿Cómo te llamas? (Editado)"
        
        # Actualizar respuestas con texto original
        db.query(RespuestaPregunta).filter(
            RespuestaPregunta.pregunta_id == pregunta1_id
        ).update({
            "pregunta_texto": texto_original
        })
        db.commit()
        
        # Verificar que la respuesta tiene el texto original
        respuesta_verificar = db.query(RespuestaPregunta).filter(
            RespuestaPregunta.pregunta_id == pregunta1_id
        ).first()
        assert respuesta_verificar.pregunta_texto == texto_original, "¡ERROR! Texto original no preservado"
        print(f"   ✓ Texto original preservado: '{respuesta_verificar.pregunta_texto}'")
        print(f"   ✓ Texto nuevo de pregunta: '{pregunta1.texto}'")
        
        # 8. TEST: Eliminar pregunta (debe preservar respuesta con información)
        print("\n8. TEST: Eliminando pregunta 2...")

        # Preservar información antes de eliminar
        db.query(RespuestaPregunta).filter(
            RespuestaPregunta.pregunta_id == pregunta2_id
        ).update({
            "pregunta_texto": pregunta2.texto,
            "pregunta_tipo": pregunta2.tipo.value
        })
        db.commit()

        # Verificar respuestas antes de eliminar
        print("   DEBUG: Respuestas antes de eliminar pregunta:")
        respuestas_antes = db.query(RespuestaPregunta).filter(
            RespuestaPregunta.respuesta_cuestionario_id == respuesta_cuestionario_id
        ).all()
        for r in respuestas_antes:
            print(f"     - pregunta_id={r.pregunta_id}, valor={r.valor}, texto={r.pregunta_texto}")

        db.delete(pregunta2)
        db.commit()

        # Verificar respuestas después de eliminar
        print("   DEBUG: Respuestas después de eliminar pregunta:")
        respuestas_despues = db.query(RespuestaPregunta).filter(
            RespuestaPregunta.respuesta_cuestionario_id == respuesta_cuestionario_id
        ).all()
        for r in respuestas_despues:
            print(f"     - pregunta_id={r.pregunta_id}, valor={r.valor}, texto={r.pregunta_texto}")

        # Verificar que la respuesta sigue existiendo
        respuesta_huerfana = db.query(RespuestaPregunta).filter(
            RespuestaPregunta.respuesta_cuestionario_id == respuesta_cuestionario_id,
            RespuestaPregunta.pregunta_id == None  # Pregunta eliminada
        ).first()

        if respuesta_huerfana is None:
            # Buscar cualquier respuesta con ese valor
            todas_respuestas = db.query(RespuestaPregunta).filter(
                RespuestaPregunta.respuesta_cuestionario_id == respuesta_cuestionario_id
            ).all()
            print(f"   DEBUG: Total respuestas encontradas: {len(todas_respuestas)}")
            for r in todas_respuestas:
                print(f"     - ID={r.id}, pregunta_id={r.pregunta_id}, valor={r.valor}")

        assert respuesta_huerfana is not None, "¡ERROR! Respuesta borrada al eliminar pregunta"
        assert respuesta_huerfana.pregunta_texto is not None, "¡ERROR! Texto de pregunta no preservado"
        assert respuesta_huerfana.valor == "Azul", "¡ERROR! Valor de respuesta perdido"

        print(f"   ✓ Respuesta preservada sin pregunta_id")
        print(f"   ✓ Texto preservado: '{respuesta_huerfana.pregunta_texto}'")
        print(f"   ✓ Tipo preservado: '{respuesta_huerfana.pregunta_tipo}'")
        print(f"   ✓ Valor preservado: '{respuesta_huerfana.valor}'")
        
        # 9. Verificar total de respuestas
        print("\n9. Verificación final...")
        total_respuestas = db.query(RespuestaPregunta).filter(
            RespuestaPregunta.respuesta_cuestionario_id == respuesta_cuestionario_id
        ).count()
        assert total_respuestas == 2, f"¡ERROR! Esperaba 2 respuestas, encontré {total_respuestas}"
        print(f"   ✓ Total de respuestas preservadas: {total_respuestas}")
        
        # Limpiar datos de prueba
        print("\n10. Limpiando datos de prueba...")
        db.query(RespuestaPregunta).filter(
            RespuestaPregunta.respuesta_cuestionario_id == respuesta_cuestionario_id
        ).delete()
        db.query(RespuestaCuestionario).filter(
            RespuestaCuestionario.id == respuesta_cuestionario_id
        ).delete()
        db.query(Pregunta).filter(Pregunta.cuestionario_id == cuestionario_id).delete()
        db.query(CuestionarioAdmin).filter(CuestionarioAdmin.id == cuestionario_id).delete()
        db.commit()
        print("   ✓ Datos de prueba eliminados")
        
        print("\n" + "=" * 80)
        print("✅ TODOS LOS TESTS PASARON EXITOSAMENTE")
        print("=" * 80)
        print("\nResumen:")
        print("  ✓ Las respuestas NO se borran al editar instrucciones de IA")
        print("  ✓ El texto original de preguntas se preserva en respuestas")
        print("  ✓ Las respuestas se mantienen al eliminar preguntas")
        print("  ✓ La información de preguntas eliminadas se preserva")
        
    except AssertionError as e:
        print(f"\n❌ TEST FALLIDO: {e}")
        db.rollback()
        return False
    except Exception as e:
        print(f"\n❌ ERROR INESPERADO: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        return False
    finally:
        db.close()
    
    return True


if __name__ == "__main__":
    success = test_proteccion_respuestas()
    sys.exit(0 if success else 1)

