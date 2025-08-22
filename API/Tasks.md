# Tareas del Sistema de Seguimiento Psicopedagógico (SSP)

## Descripción del Proyecto

El Sistema de Seguimiento Psicopedagógico (SSP) es una plataforma integral que combina la recolección de datos estudiantiles con análisis de inteligencia artificial para identificar y apoyar a estudiantes en situación de vulnerabilidad, riesgo académico o que requieren apoyo psicológico.

### Flujo Operativo
1. **Captación**: Unidad académica proporciona enlace de registro al estudiante
2. **Registro**: Estudiante completa formulario web con datos personales y académicos
3. **Evaluación**: Cuestionario interactivo en formato chat para detectar vulnerabilidades
4. **Análisis IA**: Procesamiento automático con OpenRouter API y generación de informe
5. **Validación**: Personal académico revisa y valida diagnósticos de IA
6. **Seguimiento**: Registro de atenciones y seguimiento continuo del estudiante

## Tareas Completadas

### Configuración Inicial
- [x] Configurar estructura del proyecto
- [x] Configurar FastAPI
- [x] Configurar SQLAlchemy
- [x] Configurar autenticación JWT
- [x] Configurar CORS

### Modelos de Base de Datos
- [x] Implementar modelo Persona
- [x] Implementar modelo Personal
- [x] Implementar modelo Atencion
- [x] Implementar modelo Grupo
- [x] Implementar modelo Cuestionario
- [x] Implementar modelo ContactoEmergencia
- [x] Implementar modelo ProgramaEducativo
- [x] Configurar relaciones entre modelos

### Esquemas Pydantic
- [x] Implementar esquemas para Persona
- [x] Implementar esquemas para Personal
- [x] Implementar esquemas para Atencion
- [x] Implementar esquemas para Grupo
- [x] Implementar esquemas para Cuestionario
- [x] Implementar esquemas para ContactoEmergencia
- [x] Implementar esquemas para ProgramaEducativo
- [x] Implementar esquemas para Token

### Endpoints de API
- [x] Implementar endpoint de autenticación
- [x] Implementar CRUD para Persona
- [x] Implementar CRUD para Personal
- [x] Implementar CRUD para Atencion
- [x] Implementar CRUD para Grupo
- [x] Implementar CRUD para Cuestionario
- [x] Implementar CRUD para ContactoEmergencia
- [x] Implementar CRUD para ProgramaEducativo
- [x] Implementar operaciones por lotes
- [x] Implementar búsqueda y filtrado
- [x] Endpoint específico para obtener estudiantes (/personas/estudiantes/)

### Mejoras de UX Implementadas (Diciembre 2024)
- [x] **Atenciones solo para Estudiantes**: Modificado formulario para mostrar únicamente estudiantes
- [x] **Validación obligatoria**: Selección de estudiante es requerida para crear atenciones
- [x] **Información del estudiante**: Mostrar datos del estudiante seleccionado en el formulario
- [x] **Preservar asignaciones**: En edición de personas, grupos y programas se muestran como solo lectura
- [x] **Prevenir cambios accidentales**: Asignaciones académicas solo editables en creación

## Tareas Pendientes

### Integración con Inteligencia Artificial
- [ ] **Configurar OpenRouter API**
  - [ ] Obtener API key de OpenRouter
  - [ ] Configurar cliente OpenAI con base_url de OpenRouter
  - [ ] Implementar manejo de errores y reintentos
- [ ] **Desarrollo de Prompts Especializados**
  - [ ] Crear prompt para análisis psicopedagógico
  - [ ] Incluir contexto de datos del estudiante
  - [ ] Definir formato de respuesta estructurada
- [ ] **Procesamiento de Cuestionarios**
  - [ ] Integrar respuestas del cuestionario con análisis de IA
  - [ ] Implementar lógica de procesamiento automático
  - [ ] Crear sistema de puntuación y clasificación
- [ ] **Generación de Informes de IA**
  - [ ] Desarrollar plantillas de informes
  - [ ] Implementar almacenamiento de análisis en base de datos
  - [ ] Crear visualización de resultados para personal académico

### Gestión de Cohorte
- [x] Crear modelo Cohorte
- [x] Establecer relación con Persona
- [x] Implementar esquemas Pydantic
- [x] Crear endpoints API
- [x] Hacer cohorte opcional en registro

### Portal Estudiantil
- [ ] **Formulario de Registro Web**
  - [ ] Diseñar interfaz amigable para estudiantes
  - [ ] Implementar validación en tiempo real
  - [ ] Crear flujo de registro paso a paso
- [ ] **Cuestionario Interactivo Tipo Chat**
  - [ ] Desarrollar interfaz estilo WhatsApp
  - [ ] Implementar preguntas dinámicas
  - [ ] Crear sistema de respuestas múltiples
  - [ ] Integrar indicadores de progreso

### Panel de Validación Académica
- [ ] **Dashboard para Personal**
  - [ ] Visualización de expedientes estudiantiles
  - [ ] Mostrar análisis de IA de forma clara
  - [ ] Implementar filtros y búsqueda avanzada
- [ ] **Flujo de Validación**
  - [ ] Sistema de aprobación/denegación de diagnósticos
  - [ ] Comentarios y observaciones del personal
  - [ ] Historial de decisiones y cambios
- [ ] **Sistema de Notificaciones**
  - [ ] Alertas para casos prioritarios
  - [ ] Notificaciones de nuevos análisis
  - [ ] Recordatorios de seguimiento

### Optimizaciones
- [ ] Implementar caché para consultas frecuentes
- [ ] Optimizar consultas a base de datos
- [ ] Implementar paginación eficiente
- [ ] Mejorar mensajes de error

## Tareas en Progreso

### Mejoras de Seguridad
- [ ] Implementar autenticación de dos factores
- [ ] Mejorar validación de datos
- [ ] Implementar registro de auditoría
- [ ] Configurar HTTPS

### Documentación
- [ ] Actualizar documentación API
- [ ] Crear guía de usuario
- [ ] Documentar procedimientos de instalación
- [ ] Crear manual técnico

## Próximos Pasos Prioritarios

### Fase Inmediata (Sprint 1-2)
1. **Integración con OpenRouter API**
   - Configurar credenciales y conexión
   - Desarrollar prompts especializados para análisis psicopedagógico
   - Implementar procesamiento básico de cuestionarios

2. **Portal de Registro Estudiantil**
   - Crear interfaz web simplificada para estudiantes
   - Implementar formulario de registro paso a paso
   - Desarrollar cuestionario en formato chat interactivo

### Fase de Desarrollo (Sprint 3-4)
3. **Panel de Validación Académica**
   - Dashboard para visualización de expedientes
   - Sistema de validación de diagnósticos de IA
   - Implementar flujo de aprobación/denegación

4. **Análisis y Reportes**
   - Generación automática de informes de IA
   - Visualización de indicadores clave
   - Sistema de alertas para casos prioritarios

### Fase de Optimización (Sprint 5-6)
5. **Mejoras de Rendimiento**
   - Optimizar consultas a base de datos
   - Implementar caché para análisis de IA
   - Mejorar tiempos de respuesta

6. **Documentación y Testing**
   - Completar documentación técnica
   - Implementar pruebas automatizadas
   - Crear manuales de usuario

## Código de Integración con IA

```python
# Ejemplo de integración con OpenRouter API
from openai import OpenAI

client = OpenAI(
  base_url="https://openrouter.ai/api/v1",
  api_key="<OPENROUTER_API_KEY>",
)

completion = client.chat.completions.create(
  extra_headers={
    "HTTP-Referer": "<YOUR_SITE_URL>",
    "X-Title": "Sistema SSP",
  },
  model="nousresearch/deephermes-3-mistral-24b-preview:free",
  messages=[
    {
      "role": "user",
      "content": "Análisis psicopedagógico del estudiante..."
    }
  ]
)
```
