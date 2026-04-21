# Generación de Reportes con IA - Documentación

## Descripción General

Se ha implementado un sistema completo de generación de reportes psicopedagógicos utilizando IA (OpenRouter). El sistema permite:

1. **Generar reportes automáticos** basados en preguntas y respuestas del cuestionario
2. **Usar instrucciones personalizadas** configuradas en cada cuestionario
3. **Mantener versiones históricas** de reportes para comparación
4. **Regenerar reportes** con un botón dedicado

## Componentes Implementados

### 1. Modelos de Base de Datos

#### CuestionarioAdmin (Actualizado)
- **Nuevo campo**: `instruccion_sistema` (Text, nullable)
  - Almacena la instrucción personalizada para la IA
  - Se usa al generar reportes para contextualizar el análisis

#### ReporteIA (Nuevo)
- **id**: UUID único del reporte
- **respuesta_cuestionario_id**: FK a RespuestaCuestionario
- **contenido**: Texto del reporte generado
- **version**: Número de versión (1, 2, 3, etc.)
- **es_actual**: Boolean indicando si es la versión actual
- **fecha_generacion**: Timestamp de cuándo se generó
- **created_at**: Timestamp de creación

#### RespuestaCuestionario (Actualizado)
- **Nueva relación**: `reportes_ia` (One-to-Many)
  - Permite acceder a todos los reportes de una respuesta

### 2. Servicio de IA (ai_service.py)

#### Cambios Principales
- **Migración de OpenAI a OpenRouter**
  - Base URL: `https://openrouter.io/api/v1`
  - Requiere: `OPENROUTER_API_KEY` en variables de entorno
  - Modelo: `meta-llama/llama-2-70b-chat`

#### Métodos Principales
- `generate_questionnaire_report()`: Genera reporte basado en preguntas/respuestas
- `_create_prompt_from_questionnaire()`: Formatea datos para la IA
- `_get_default_system_instruction()`: Instrucción por defecto
- `_generate_mock_report()`: Modo simulado sin API key

### 3. Endpoints de API

#### Para Usuarios (cuestionarios_usuario.py)

**POST** `/cuestionarios-usuario/{respuesta_id}/generar-reporte`
- Genera un nuevo reporte para una respuesta completada
- Solo el usuario que respondió puede generar
- Retorna: ReporteResponse con versión y contenido

**GET** `/cuestionarios-usuario/{respuesta_id}/reportes`
- Obtiene todos los reportes de una respuesta
- Ordenados por versión descendente
- Incluye información de versión y fecha

**GET** `/cuestionarios-usuario/{respuesta_id}/reporte-actual`
- Obtiene el reporte actual (más reciente)
- Retorna solo la versión marcada como `es_actual=true`

#### Para Administradores (cuestionarios_admin.py)

**POST** `/cuestionarios-admin/respuestas/{respuesta_id}/regenerar-reporte`
- Regenera un reporte existente
- Solo admin/coordinador pueden acceder
- Crea nueva versión, marca anteriores como no actuales

**GET** `/cuestionarios-admin/respuestas/{respuesta_id}/reportes`
- Obtiene todos los reportes de una respuesta
- Solo admin/coordinador pueden acceder

### 4. Schemas (cuestionario_admin.py)

#### Nuevos Schemas
- `ReporteIABase`: Base para reportes
- `ReporteIAOut`: Salida de reporte con metadata
- `GenerarReporteRequest`: Request para generar
- `RegenerarReporteRequest`: Request para regenerar
- `ReporteResponse`: Respuesta con reporte generado

#### Schemas Actualizados
- `CuestionarioAdminBase`: Agregado `instruccion_sistema`
- `RespuestaCuestionarioOut`: Agregado `reportes_ia`

## Flujo de Uso

### 1. Crear Cuestionario con Instrucción
```json
{
  "titulo": "Evaluación Psicopedagógica",
  "descripcion": "Cuestionario de evaluación",
  "instruccion_sistema": "Eres un especialista en psicopedagogía. Analiza las respuestas y genera un reporte enfocado en vulnerabilidad social...",
  "preguntas": [...],
  "tipos_usuario_asignados": ["alumno"]
}
```

### 2. Usuario Completa Cuestionario
- Usuario responde todas las preguntas
- Marca como completado

### 3. Generar Reporte
```
POST /cuestionarios-usuario/{respuesta_id}/generar-reporte
```
- Sistema recopila preguntas y respuestas
- Envía a OpenRouter con instrucción personalizada
- Crea ReporteIA v1 con `es_actual=true`

### 4. Ver Reportes
```
GET /cuestionarios-usuario/{respuesta_id}/reportes
```
- Retorna todas las versiones del reporte

### 5. Regenerar Reporte (Admin)
```
POST /cuestionarios-admin/respuestas/{respuesta_id}/regenerar-reporte
```
- Marca v1 como `es_actual=false`
- Crea ReporteIA v2 con `es_actual=true`
- Mantiene v1 para comparación

## Variables de Entorno Requeridas

```bash
# OpenRouter API
OPENROUTER_API_KEY=sk_live_...

# Información del sitio (opcional)
SITE_URL=http://localhost:3000
SITE_NAME=Sistema SSP
```

## Migración de Base de Datos

Se ejecutó migración `001_add_reporte_ia_and_instruccion_sistema.py`:
- Agrega campo `instruccion_sistema` a `cuestionarios_admin`
- Crea tabla `reportes_ia` con índices

## Próximos Pasos

1. **Frontend**: Crear UI para mostrar reportes y botón de regenerar
2. **Testing**: Escribir tests para endpoints de reportes
3. **Validación**: Agregar validaciones adicionales en schemas
4. **Documentación**: Actualizar README con ejemplos de uso

