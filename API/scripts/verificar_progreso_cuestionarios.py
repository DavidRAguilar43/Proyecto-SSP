#!/usr/bin/env python3
"""
Script para verificar y diagnosticar problemas de progreso en cuestionarios.

Este script:
1. Lista todos los cuestionarios con respuestas en progreso
2. Muestra el progreso guardado en BD vs el progreso real calculado
3. Identifica discrepancias
4. Ofrece opción de recalcular y actualizar el progreso

Reason: Diagnosticar el problema reportado donde el progreso en la lista
        muestra 50% pero dentro del cuestionario muestra 0%.
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
    RespuestaPregunta,
    PreguntaSnapshot
)


def calcular_progreso_real(db: Session, respuesta: RespuestaCuestionario) -> int:
    """
    Calcula el progreso real basándose en las respuestas guardadas.
    
    Args:
        db: Sesión de base de datos
        respuesta: Respuesta del cuestionario
        
    Returns:
        Porcentaje de progreso (0-100)
    """
    # Obtener el snapshot del cuestionario
    if not respuesta.cuestionario_snapshot:
        print(f"  ⚠️  Respuesta {respuesta.id} no tiene snapshot asociado")
        return 0
    
    # Contar total de preguntas en el snapshot
    total_preguntas = db.query(PreguntaSnapshot).filter(
        PreguntaSnapshot.cuestionario_snapshot_id == respuesta.snapshot_id
    ).count()
    
    if total_preguntas == 0:
        print(f"  ⚠️  Snapshot {respuesta.snapshot_id} no tiene preguntas")
        return 0
    
    # Contar respuestas válidas (no vacías)
    respuestas_validas = db.query(RespuestaPregunta).filter(
        RespuestaPregunta.respuesta_cuestionario_id == respuesta.id,
        RespuestaPregunta.valor.isnot(None)
    ).all()
    
    # Filtrar respuestas con valores no vacíos
    count_validas = 0
    for r in respuestas_validas:
        valor = r.valor
        # Excluir valores vacíos
        if valor is None:
            continue
        if isinstance(valor, str) and valor.strip() == '':
            continue
        count_validas += 1
    
    # Calcular progreso
    progreso = round((count_validas / total_preguntas) * 100)
    return progreso


def verificar_progresos(db: Session, mostrar_solo_discrepancias: bool = False):
    """
    Verifica el progreso de todos los cuestionarios en progreso.
    
    Args:
        db: Sesión de base de datos
        mostrar_solo_discrepancias: Si True, solo muestra casos con discrepancias
    """
    print("\n" + "="*80)
    print("VERIFICACIÓN DE PROGRESO DE CUESTIONARIOS")
    print("="*80 + "\n")
    
    # Obtener todas las respuestas en progreso
    respuestas = db.query(RespuestaCuestionario).filter(
        RespuestaCuestionario.estado.in_(['en_progreso', 'pendiente'])
    ).options(
        joinedload(RespuestaCuestionario.cuestionario),
        joinedload(RespuestaCuestionario.cuestionario_snapshot),
        joinedload(RespuestaCuestionario.usuario)
    ).all()
    
    if not respuestas:
        print("✅ No hay cuestionarios en progreso o pendientes.\n")
        return []
    
    print(f"📊 Encontradas {len(respuestas)} respuestas en progreso/pendientes\n")
    
    discrepancias = []
    
    for respuesta in respuestas:
        progreso_guardado = respuesta.progreso or 0
        progreso_real = calcular_progreso_real(db, respuesta)
        
        tiene_discrepancia = progreso_guardado != progreso_real
        
        if mostrar_solo_discrepancias and not tiene_discrepancia:
            continue
        
        # Información del cuestionario
        cuestionario_titulo = respuesta.cuestionario.titulo if respuesta.cuestionario else "N/A"
        usuario_email = respuesta.usuario.correo_institucional if respuesta.usuario else "N/A"
        
        # Símbolo de estado
        simbolo = "❌" if tiene_discrepancia else "✅"
        
        print(f"{simbolo} Cuestionario: {cuestionario_titulo}")
        print(f"   Usuario: {usuario_email}")
        print(f"   Estado: {respuesta.estado}")
        print(f"   Progreso guardado en BD: {progreso_guardado}%")
        print(f"   Progreso real calculado: {progreso_real}%")
        
        if tiene_discrepancia:
            diferencia = abs(progreso_guardado - progreso_real)
            print(f"   ⚠️  DISCREPANCIA: {diferencia}% de diferencia")
            discrepancias.append({
                'respuesta_id': respuesta.id,
                'cuestionario': cuestionario_titulo,
                'usuario': usuario_email,
                'progreso_guardado': progreso_guardado,
                'progreso_real': progreso_real,
                'diferencia': diferencia
            })
        
        print()
    
    return discrepancias


def corregir_progresos(db: Session, discrepancias: list):
    """
    Corrige los progresos que tienen discrepancias.
    
    Args:
        db: Sesión de base de datos
        discrepancias: Lista de discrepancias encontradas
    """
    if not discrepancias:
        print("✅ No hay discrepancias que corregir.\n")
        return
    
    print("\n" + "="*80)
    print("CORRECCIÓN DE PROGRESOS")
    print("="*80 + "\n")
    
    print(f"Se encontraron {len(discrepancias)} discrepancias.\n")
    
    respuesta = input("¿Desea corregir todas las discrepancias? (s/n): ").strip().lower()
    
    if respuesta != 's':
        print("❌ Corrección cancelada.\n")
        return
    
    print("\n🔧 Corrigiendo progresos...\n")
    
    for disc in discrepancias:
        respuesta_obj = db.query(RespuestaCuestionario).filter(
            RespuestaCuestionario.id == disc['respuesta_id']
        ).first()
        
        if respuesta_obj:
            progreso_anterior = respuesta_obj.progreso
            respuesta_obj.progreso = disc['progreso_real']
            
            print(f"✓ {disc['cuestionario']} - {disc['usuario']}")
            print(f"  Progreso: {progreso_anterior}% → {disc['progreso_real']}%")
    
    db.commit()
    print("\n✅ Todos los progresos han sido corregidos.\n")


def main():
    """Función principal."""
    db = SessionLocal()
    
    try:
        # Verificar progresos
        discrepancias = verificar_progresos(db, mostrar_solo_discrepancias=False)
        
        # Si hay discrepancias, ofrecer corregirlas
        if discrepancias:
            corregir_progresos(db, discrepancias)
        else:
            print("✅ No se encontraron discrepancias en los progresos.\n")
    
    except Exception as e:
        print(f"\n❌ Error: {str(e)}\n")
        import traceback
        traceback.print_exc()
    
    finally:
        db.close()


if __name__ == "__main__":
    main()

