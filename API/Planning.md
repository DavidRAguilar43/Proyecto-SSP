# Planificación del Sistema de Seguimiento Psicopedagógico (SSP)

## Visión del Sistema

El Sistema de Seguimiento Psicopedagógico (SSP) es una plataforma integral que combina la recolección de datos estudiantiles con análisis de inteligencia artificial para identificar y apoyar a estudiantes en situación de vulnerabilidad, riesgo académico o que requieren apoyo psicológico.

## Flujo Operativo del Sistema

### 1. **Captación y Registro Inicial**
- La unidad académica identifica estudiantes que requieren seguimiento
- Se proporciona un enlace web personalizado para cada estudiante
- El estudiante accede al formulario de registro en línea
- Se capturan datos personales, académicos y de contacto

### 2. **Evaluación Psicopedagógica Interactiva**
- Cuestionario presentado en formato chat (estilo WhatsApp)
- Preguntas diseñadas para detectar:
  - Indicadores de vulnerabilidad social
  - Factores de riesgo académico
  - Necesidades de apoyo psicológico
- Respuestas almacenadas automáticamente en la base de datos

### 3. **Análisis Automatizado con IA**
- Procesamiento de datos mediante OpenRouter API
- Generación de prompt contextualizado con información del estudiante
- Análisis realizado por modelo: `nousresearch/deephermes-3-mistral-24b-preview:free`
- Generación de informe con:
  - Evaluación general del estudiante
  - Clasificación de riesgo/vulnerabilidad
  - Recomendaciones de apoyo específicas

### 4. **Gestión de Expedientes**
- Creación automática de expediente digital
- Almacenamiento del análisis de IA
- Visualización de indicadores clave
- Historial completo de interacciones

### 5. **Validación y Seguimiento Profesional**
- Acceso del personal académico al sistema
- Revisión de análisis generados por IA
- Validación profesional del diagnóstico
- Registro de atenciones y seguimientos
- Confirmación o modificación de clasificaciones

## Arquitectura del Sistema

### Componentes Principales

1. **Frontend Web Multiplataforma**
   - **Portal Estudiantil**: Formulario de registro y cuestionario interactivo
   - **Panel Administrativo**: Gestión de expedientes y validación de diagnósticos
   - **Dashboard Analítico**: Visualización de indicadores y estadísticas

2. **API Backend Inteligente**
   - Servicio REST con FastAPI
   - Autenticación JWT con roles diferenciados
   - Integración con OpenRouter API para análisis de IA
   - Procesamiento de cuestionarios y generación de informes

3. **Base de Datos Relacional**
   - SQLite para desarrollo y pruebas
   - PostgreSQL para producción
   - Modelos SQLAlchemy optimizados
   - Almacenamiento de expedientes y análisis de IA

4. **Servicios de Inteligencia Artificial**
   - OpenRouter API como gateway de IA
   - Modelo especializado en análisis psicopedagógico
   - Generación de informes contextualizados
   - Procesamiento de lenguaje natural

### Flujo de Datos Inteligente

1. **Captura**: Estudiante → Portal Web → API → Base de Datos
2. **Análisis**: Base de Datos → API → OpenRouter IA → API → Base de Datos
3. **Validación**: Personal → Panel Admin → API → Base de Datos
4. **Seguimiento**: Base de Datos → API → Dashboard → Personal

## Plan de Implementación

### Fase 1: Núcleo del Sistema
- [x] Configuración inicial
- [x] Modelos de base de datos
- [x] Autenticación básica

### Fase 2: Módulo de Estudiantes
- [x] Registro de estudiantes
- [x] Cuestionario interactivo
- [x] Almacenamiento de respuestas

### Fase 3: Análisis con IA
- [ ] Integración con OpenRouter API
- [ ] Desarrollo de prompts especializados
- [ ] Procesamiento automático de cuestionarios
- [ ] Generación de informes de IA
- [ ] Almacenamiento de análisis en expedientes

### Fase 4: Validación Académica
- [ ] Panel de administración para personal
- [ ] Flujo de validación de diagnósticos
- [ ] Sistema de confirmación/denegación
- [ ] Notificaciones automáticas
- [ ] Registro de decisiones profesionales

### Fase 5: Portal Estudiantil
- [ ] Interfaz de registro simplificada
- [ ] Cuestionario en formato chat
- [ ] Experiencia de usuario optimizada
- [ ] Accesibilidad y responsividad

### Fase 6: Analytics y Reportes
- [ ] Dashboard de indicadores clave
- [ ] Reportes estadísticos
- [ ] Análisis de tendencias
- [ ] Exportación de datos

## Stack Tecnológico

| Componente              | Tecnología                                    | Propósito                           |
|------------------------|-----------------------------------------------|-------------------------------------|
| **Frontend**           | React, TypeScript, Material-UI               | Interfaces de usuario interactivas |
| **Backend**            | FastAPI, Python, SQLAlchemy                  | API REST y lógica de negocio       |
| **Base de Datos**      | SQLite (desarrollo), PostgreSQL (producción) | Almacenamiento de datos             |
| **Inteligencia Artificial** | OpenRouter API, OpenAI Client            | Análisis psicopedagógico automatizado |
| **Modelo de IA**       | nousresearch/deephermes-3-mistral-24b-preview:free | Procesamiento de lenguaje natural |
| **Autenticación**      | JWT, bcrypt                                   | Seguridad y control de acceso      |
| **Estilos**            | Material-UI, CSS-in-JS                       | Diseño y experiencia de usuario    |
| **Validación**         | Pydantic, Zod                                | Validación de datos                 |

## Integración con OpenRouter

```python
# Configuración del cliente de IA
from openai import OpenAI

client = OpenAI(
  base_url="https://openrouter.ai/api/v1",
  api_key="<OPENROUTER_API_KEY>",
)

# Análisis de estudiante
completion = client.chat.completions.create(
  extra_headers={
    "HTTP-Referer": "<YOUR_SITE_URL>",
    "X-Title": "Sistema SSP",
  },
  model="nousresearch/deephermes-3-mistral-24b-preview:free",
  messages=[
    {
      "role": "system",
      "content": "Eres un especialista en análisis psicopedagógico..."
    },
    {
      "role": "user",
      "content": f"Analiza el siguiente perfil estudiantil: {student_data}"
    }
  ]
)
```

## Próximos Pasos Prioritarios

### Desarrollo Inmediato
1. **Integración con OpenRouter API**
   - Configuración de credenciales
   - Desarrollo de prompts especializados
   - Testing de respuestas de IA

2. **Portal Estudiantil**
   - Diseño de interfaz de registro
   - Implementación de cuestionario chat
   - Validación de formularios

3. **Panel de Validación**
   - Dashboard para personal académico
   - Flujo de aprobación de diagnósticos
   - Sistema de notificaciones

### Optimizaciones Futuras
4. Análisis de rendimiento de consultas
5. Implementación de caché para IA
6. Sistema de backup automático
7. Monitoreo y logging avanzado
