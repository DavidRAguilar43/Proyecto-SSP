"""
Script para reparar las respuestas de cuestionarios cuando las preguntas fueron editadas.

Este script actualiza los pregunta_id en respuestas_pregunta para que apunten a las preguntas
actuales del cuestionario, asumiendo que el orden de las respuestas coincide con el orden
de las preguntas actuales.
"""

from app.db.database import engine
from sqlalchemy.orm import Session
from app.models.cuestionario_admin import CuestionarioAdmin, RespuestaCuestionario, RespuestaPregunta


def fix_respuestas_cuestionario(cuestionario_id: str, dry_run: bool = True):
    """
    Actualiza las respuestas de un cuestionario para usar los IDs de preguntas actuales.
    
    Args:
        cuestionario_id: ID del cuestionario a reparar
        dry_run: Si es True, solo muestra lo que haría sin hacer cambios
    """
    with Session(engine) as db:
        # Obtener el cuestionario
        cuestionario = db.query(CuestionarioAdmin).filter(
            CuestionarioAdmin.id == cuestionario_id
        ).first()
        
        if not cuestionario:
            print(f'❌ Cuestionario {cuestionario_id} no encontrado')
            return
        
        # Obtener preguntas actuales ordenadas
        preguntas_actuales = sorted(cuestionario.preguntas, key=lambda p: p.orden)
        
        print(f'\n📋 Cuestionario: {cuestionario.titulo}')
        print(f'   Preguntas actuales: {len(preguntas_actuales)}')
        for i, p in enumerate(preguntas_actuales):
            print(f'   {i+1}. {p.texto[:50]}... (ID: {p.id})')
        
        # Obtener todas las respuestas del cuestionario
        respuestas = db.query(RespuestaCuestionario).filter(
            RespuestaCuestionario.cuestionario_id == cuestionario_id
        ).all()
        
        print(f'\n📊 Total de respuestas a actualizar: {len(respuestas)}')
        
        cambios_totales = 0
        
        for respuesta in respuestas:
            print(f'\n--- Respuesta ID: {respuesta.id} ---')
            print(f'    Usuario: {respuesta.usuario_id}')
            print(f'    Estado: {respuesta.estado}')
            print(f'    Fecha: {respuesta.created_at}')
            
            # Ordenar respuestas_preguntas por ID (asumiendo que se crearon en orden)
            respuestas_preguntas = sorted(respuesta.respuestas_preguntas, key=lambda rp: rp.id)
            
            if len(respuestas_preguntas) != len(preguntas_actuales):
                print(f'    ⚠️  ADVERTENCIA: Número de respuestas ({len(respuestas_preguntas)}) != número de preguntas ({len(preguntas_actuales)})')
                print(f'    Saltando esta respuesta por seguridad.')
                continue
            
            # Actualizar cada respuesta_pregunta
            for i, rp in enumerate(respuestas_preguntas):
                pregunta_actual = preguntas_actuales[i]
                
                if rp.pregunta_id != pregunta_actual.id:
                    print(f'    {i+1}. Actualizando:')
                    print(f'       Valor: {rp.valor}')
                    print(f'       Pregunta antigua: {rp.pregunta_id}')
                    print(f'       Pregunta nueva: {pregunta_actual.id} ({pregunta_actual.texto[:40]}...)')
                    
                    if not dry_run:
                        rp.pregunta_id = pregunta_actual.id
                    
                    cambios_totales += 1
                else:
                    print(f'    {i+1}. OK - Ya apunta a la pregunta correcta')
        
        if not dry_run:
            db.commit()
            print(f'\n✅ Se actualizaron {cambios_totales} respuestas_pregunta')
        else:
            print(f'\n🔍 DRY RUN: Se actualizarían {cambios_totales} respuestas_pregunta')
            print(f'   Ejecuta con dry_run=False para aplicar los cambios')


if __name__ == '__main__':
    import sys
    
    cuestionario_id = 'c1d8068b-d7a5-4f63-a70a-e549b5505155'
    
    # Primero hacer un dry run
    print('=' * 80)
    print('DRY RUN - Mostrando cambios sin aplicarlos')
    print('=' * 80)
    fix_respuestas_cuestionario(cuestionario_id, dry_run=True)
    
    # Preguntar si aplicar cambios
    print('\n' + '=' * 80)
    respuesta = input('¿Aplicar estos cambios? (s/n): ')
    
    if respuesta.lower() == 's':
        print('\n' + '=' * 80)
        print('APLICANDO CAMBIOS')
        print('=' * 80)
        fix_respuestas_cuestionario(cuestionario_id, dry_run=False)
    else:
        print('\n❌ Cambios cancelados')

