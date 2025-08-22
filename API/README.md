# API del Sistema de Seguimiento Psicopedagógico (SSP)

## Descripción del Sistema

El Sistema de Seguimiento Psicopedagógico (SSP) es una plataforma integral diseñada para el seguimiento, análisis y apoyo de estudiantes en instituciones educativas. El sistema combina la recolección de datos estudiantiles con análisis de inteligencia artificial para identificar estudiantes en situación de vulnerabilidad, riesgo académico o que requieren apoyo psicológico.

## Flujo del Sistema

### 1. **Captación y Registro**
- El alumno es captado por la unidad académica correspondiente
- Se proporciona un enlace a un formulario web de registro
- El alumno completa su información personal y académica mediante un formulario en línea

### 2. **Evaluación Psicopedagógica**
- Una vez registrado, el alumno puede acceder a un cuestionario interactivo
- El cuestionario se presenta en formato chat (estilo WhatsApp) para mayor comodidad
- Las preguntas están diseñadas para identificar:
  - Pertenencia a grupos vulnerables
  - Riesgo académico
  - Necesidades de apoyo psicológico
- Todas las respuestas se almacenan en la base de datos del sistema

### 3. **Análisis con Inteligencia Artificial**
- El sistema utiliza OpenRouter API para análisis con IA generativa
- Se crea un prompt detallado con los datos clave del alumno y sus respuestas
- La IA genera un análisis general que incluye:
  - Evaluación de la situación del estudiante
  - Recomendaciones de clasificación
  - Áreas de apoyo sugeridas
- El informe de IA se guarda en el expediente del alumno

### 4. **Acceso del Personal Académico**
- El personal accede al sistema mediante autenticación web
- Pueden visualizar expedientes completos de los estudiantes
- La interfaz resalta indicadores clave y el análisis de IA
- Se presenta un resumen general de cada caso

### 5. **Validación y Seguimiento**
- El personal académico valida el diagnóstico generado por IA
- Pueden confirmar o denegar la clasificación propuesta
- Se registran las atenciones y seguimientos realizados
- Se mantiene un historial completo de cada estudiante

Esta API proporciona endpoints para gestionar toda la información del sistema, incluyendo personas, programas educativos, grupos, personal, contactos de emergencia, atenciones y análisis de IA.

## Tecnologías utilizadas

- **FastAPI**: Framework web moderno y de alto rendimiento
- **SQLAlchemy**: ORM para interactuar con la base de datos
- **Pydantic**: Validación de datos y serialización
- **JWT**: Autenticación basada en tokens
- **SQLite**: Base de datos relacional
- **OpenAI Client**: Integración con OpenRouter API para análisis de IA
- **Modelo de IA**: nousresearch/deephermes-3-mistral-24b-preview:free

## Integración con Inteligencia Artificial

El sistema utiliza OpenRouter API para el análisis automático de estudiantes:

```python
from openai import OpenAI

client = OpenAI(
  base_url="https://openrouter.ai/api/v1",
  api_key="<OPENROUTER_API_KEY>",
)

completion = client.chat.completions.create(
  extra_headers={
    "HTTP-Referer": "<YOUR_SITE_URL>",
    "X-Title": "<YOUR_SITE_NAME>",
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

## Instalación y ejecución

1. Instalar dependencias:
```bash
pip install -r requirements.txt
```

2. Ejecutar la aplicación:
```bash
python start_api.py
```

La API estará disponible en http://localhost:8000

## Documentación de la API

La documentación interactiva estará disponible en:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Credenciales del administrador por defecto

- **Correo**: admin@sistema.edu
- **Contraseña**: admin123

## Roles y permisos

La API implementa los siguientes roles con diferentes niveles de acceso:

- **admin**: Acceso completo a todas las funcionalidades
- **personal**: Puede gestionar información de personas y realizar operaciones administrativas
- **docente**: Acceso limitado a información relacionada con su función
- **alumno**: Acceso únicamente a su propia información
