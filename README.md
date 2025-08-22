# Sistema de Seguimiento Psicopedagógico (SSP)

## 🎯 Descripción del Proyecto

El Sistema de Seguimiento Psicopedagógico (SSP) es una plataforma integral diseñada para el seguimiento, análisis y apoyo de estudiantes en instituciones educativas. El sistema combina la recolección de datos estudiantiles con análisis de inteligencia artificial para identificar estudiantes en situación de vulnerabilidad, riesgo académico o que requieren apoyo psicológico.

## 🔄 Flujo Operativo del Sistema

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

## 🚀 Características Principales

- **Formulario Web Interactivo**: Registro estudiantil accesible y fácil de usar
- **Cuestionario Chat**: Evaluación psicopedagógica en formato conversacional
- **Análisis con IA**: Evaluación automática usando OpenRouter API
- **Gestión de Expedientes**: Sistema completo de seguimiento estudiantil
- **Dashboard Analítico**: Visualización de indicadores clave
- **Sistema de Roles**: Acceso diferenciado según tipo de usuario
- **Validación Profesional**: Confirmación humana de diagnósticos de IA

## 🛠️ Tecnologías Utilizadas

### Backend
- **FastAPI**: Framework web moderno y rápido para Python
- **SQLAlchemy**: ORM para manejo de base de datos
- **SQLite**: Base de datos ligera para desarrollo
- **Pydantic**: Validación de datos y serialización
- **JWT**: Autenticación basada en tokens
- **OpenAI Client**: Integración con OpenRouter API para IA
- **Uvicorn**: Servidor ASGI de alto rendimiento

### Frontend
- **React**: Biblioteca de JavaScript para interfaces de usuario
- **TypeScript**: Superset tipado de JavaScript
- **Material-UI**: Componentes de interfaz de usuario
- **Axios**: Cliente HTTP para comunicación con la API

### Inteligencia Artificial
- **OpenRouter API**: Plataforma de acceso a modelos de IA
- **Modelo**: nousresearch/deephermes-3-mistral-24b-preview:free

## 📁 Estructura del Proyecto

```
SSP/
├── API/                    # Backend FastAPI
│   ├── app/
│   │   ├── models/        # Modelos de base de datos
│   │   ├── schemas/       # Esquemas Pydantic
│   │   ├── routes/        # Endpoints de la API
│   │   ├── utils/         # Utilidades y dependencias
│   │   ├── ai/           # Módulos de integración con IA
│   │   └── main.py        # Aplicación principal
│   ├── requirements.txt   # Dependencias Python
│   ├── start_api.py      # Script de inicio
│   ├── Planning.md       # Planificación del proyecto
│   ├── Tasks.md          # Lista de tareas
│   └── README.md         # Documentación de la API
└── Frontend/              # Frontend React
    └── ssp-frontend/
        ├── src/
        │   ├── components/    # Componentes React
        │   ├── pages/        # Páginas de la aplicación
        │   ├── services/     # Servicios de API
        │   └── types/        # Tipos TypeScript
        └── package.json      # Dependencias Node.js
```

## 🔧 Instalación y Configuración

### Prerrequisitos
- Python 3.8+
- Node.js 16+
- npm o yarn

### Backend (API)
```bash
cd API
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
python start_api.py
```

### Frontend
```bash
cd Frontend/ssp-frontend
npm install
npm run dev
```

## 🔑 Configuración de IA

Para habilitar el análisis con inteligencia artificial, configure las siguientes variables de entorno:

```bash
OPENROUTER_API_KEY=your_openrouter_api_key
SITE_URL=your_site_url
SITE_NAME=Sistema SSP
```

### Ejemplo de Integración con OpenRouter

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

## 📊 Acceso al Sistema

### Credenciales por Defecto
- **Correo**: admin@sistema.edu
- **Contraseña**: admin123

### URLs de Acceso
- **API**: http://localhost:8000
- **Frontend**: http://localhost:3000
- **Documentación API**: http://localhost:8000/docs

## 🎯 Próximos Desarrollos

1. **Portal Estudiantil**: Interfaz de registro y cuestionario interactivo
2. **Análisis con IA**: Integración completa con OpenRouter API
3. **Dashboard Analítico**: Visualización avanzada de indicadores
4. **Sistema de Notificaciones**: Alertas automáticas para casos prioritarios
5. **Reportes Avanzados**: Generación de informes estadísticos

## 📝 Documentación Adicional

- [Planificación del Proyecto](API/Planning.md)
- [Lista de Tareas](API/Tasks.md)
- [Documentación de la API](API/README.md)

## 🤝 Contribución

Este proyecto está en desarrollo activo. Para contribuir:

1. Fork el repositorio
2. Crea una rama para tu feature
3. Realiza tus cambios
4. Envía un pull request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo LICENSE para más detalles.

---

**Desarrollado para instituciones educativas comprometidas con el bienestar estudiantil** 🎓
