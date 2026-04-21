# Guía de Testing - Generación de Reportes con IA

## Pruebas Manuales

### 1. Crear Cuestionario con Instrucción

```bash
curl -X POST http://localhost:8000/cuestionarios-admin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "titulo": "Evaluación Psicopedagógica",
    "descripcion": "Cuestionario de evaluación",
    "instruccion_sistema": "Eres un especialista en psicopedagogía. Analiza las respuestas y genera un reporte enfocado en vulnerabilidad social...",
    "preguntas": [
      {
        "texto": "¿Cuál es tu situación económica?",
        "tipo": "texto"
      }
    ],
    "tipos_usuario_asignados": ["alumno"]
  }'
```

### 2. Responder Cuestionario

```bash
curl -X POST http://localhost:8000/cuestionarios-usuario/{cuestionario_id}/responder \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "respuestas": [
      {
        "pregunta_id": "pregunta_1",
        "valor": "Situación económica difícil"
      }
    ]
  }'
```

### 3. Generar Reporte

```bash
curl -X POST http://localhost:8000/cuestionarios-usuario/{respuesta_id}/generar-reporte \
  -H "Authorization: Bearer <token>"
```

**Respuesta esperada:**
```json
{
  "id": "uuid-del-reporte",
  "respuesta_cuestionario_id": "uuid-respuesta",
  "version": 1,
  "es_actual": true,
  "contenido": "Reporte generado por IA...",
  "fecha_generacion": "2025-11-05T10:30:00",
  "mensaje": "Reporte generado exitosamente (versión 1)"
}
```

### 4. Obtener Reporte Actual

```bash
curl -X GET http://localhost:8000/cuestionarios-usuario/{respuesta_id}/reporte-actual \
  -H "Authorization: Bearer <token>"
```

### 5. Obtener Historial de Reportes

```bash
curl -X GET http://localhost:8000/cuestionarios-usuario/{respuesta_id}/reportes \
  -H "Authorization: Bearer <token>"
```

### 6. Regenerar Reporte (Admin)

```bash
curl -X POST http://localhost:8000/cuestionarios-admin/respuestas/{respuesta_id}/regenerar-reporte \
  -H "Authorization: Bearer <token-admin>"
```

## Pruebas Unitarias

### Crear archivo: `tests/test_reportes_ia.py`

```python
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.database import get_db

client = TestClient(app)

@pytest.fixture
def auth_headers(client):
    # Implementar autenticación de prueba
    pass

def test_generar_reporte_exitoso(auth_headers):
    # Crear cuestionario
    # Responder cuestionario
    # Generar reporte
    # Verificar respuesta
    pass

def test_generar_reporte_sin_completar():
    # Intentar generar reporte sin completar
    # Verificar error 400
    pass

def test_regenerar_reporte_incrementa_version(auth_headers):
    # Generar reporte v1
    # Regenerar reporte
    # Verificar v2 es actual
    # Verificar v1 no es actual
    pass

def test_obtener_reportes_historial(auth_headers):
    # Generar múltiples versiones
    # Obtener historial
    # Verificar todas las versiones
    pass

def test_usuario_solo_ve_sus_reportes(auth_headers):
    # Usuario A genera reporte
    # Usuario B intenta acceder
    # Verificar error 404
    pass

def test_admin_puede_regenerar(admin_headers):
    # Admin regenera reporte de usuario
    # Verificar éxito
    pass
```

## Pruebas de Integración

### Flujo Completo

1. Crear usuario
2. Crear cuestionario con instrucción
3. Asignar cuestionario a usuario
4. Usuario responde cuestionario
5. Generar reporte
6. Verificar contenido del reporte
7. Regenerar reporte
8. Verificar nueva versión
9. Obtener historial
10. Verificar todas las versiones

## Validaciones Importantes

- ✅ Solo usuarios autenticados pueden generar reportes
- ✅ Solo el usuario que respondió puede ver su reporte
- ✅ Solo admins pueden regenerar reportes
- ✅ No se puede generar reporte de cuestionario no completado
- ✅ Versiones anteriores se marcan como no actuales
- ✅ Contenido del reporte no está vacío
- ✅ Fecha de generación es válida

## Debugging

### Ver logs de OpenRouter

```python
# En ai_service.py, agregar logging
import logging
logger = logging.getLogger(__name__)

logger.debug(f"Enviando a OpenRouter: {messages}")
logger.debug(f"Respuesta: {response}")
```

### Verificar base de datos

```bash
# SQLite
sqlite3 app.db "SELECT * FROM reportes_ia;"

# Ver estructura
sqlite3 app.db ".schema reportes_ia"
```

### Verificar variables de entorno

```bash
echo $OPENROUTER_API_KEY
```

## Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| 401 Unauthorized | Token inválido | Verificar token de autenticación |
| 404 Not Found | Respuesta no existe | Verificar ID de respuesta |
| 400 Bad Request | Cuestionario no completado | Completar cuestionario primero |
| 500 Internal Server | Error en OpenRouter | Verificar API key y conexión |

