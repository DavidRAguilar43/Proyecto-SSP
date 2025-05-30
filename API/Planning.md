# Planificación del Sistema de Seguimiento Psicopedagógico (SSP)

## Visión General

El Sistema de Seguimiento Psicopedagógico (SSP) es una aplicación diseñada para gestionar el seguimiento de estudiantes, docentes y personal administrativo en un entorno educativo. El sistema permite registrar atenciones psicopedagógicas, gestionar grupos, programas educativos, personal y contactos de emergencia.

## Arquitectura

El sistema está construido con una arquitectura de API RESTful utilizando FastAPI como framework principal. La estructura sigue un patrón de diseño modular con separación clara de responsabilidades:

- **Modelos**: Representan las entidades de la base de datos
- **Esquemas**: Definen la validación y serialización de datos
- **Rutas**: Implementan los endpoints de la API
- **Dependencias**: Proporcionan funcionalidades reutilizables como autenticación
- **Core**: Contiene configuraciones centrales y funcionalidades de seguridad

## Estructura de Carpetas

```
API/
├── app/                  # Directorio principal de la aplicación
│   ├── core/             # Configuración central
│   │   ├── config.py     # Configuración de la aplicación
│   │   └── security.py   # Funciones de seguridad (JWT, hash)
│   ├── db/               # Configuración de la base de datos
│   │   └── database.py   # Configuración de la conexión a la base de datos
│   ├── models/           # Modelos SQLAlchemy
│   │   ├── persona.py    # Modelo Persona
│   │   ├── personal.py   # Modelo Personal
│   │   ├── atencion.py   # Modelo Atencion
│   │   ├── grupo.py      # Modelo Grupo
│   │   ├── cuestionario.py # Modelo Cuestionario
│   │   ├── contacto_emergencia.py # Modelo ContactoEmergencia
│   │   ├── programa_educativo.py # Modelo ProgramaEducativo
│   │   └── __init__.py   # Importaciones de modelos
│   ├── schemas/          # Esquemas Pydantic
│   │   ├── persona.py    # Esquemas para Persona
│   │   ├── personal.py   # Esquemas para Personal
│   │   ├── atencion.py   # Esquemas para Atencion
│   │   ├── grupo.py      # Esquemas para Grupo
│   │   ├── cuestionario.py # Esquemas para Cuestionario
│   │   ├── contacto_emergencia.py # Esquemas para ContactoEmergencia
│   │   ├── programa_educativo.py # Esquemas para ProgramaEducativo
│   │   ├── token.py      # Esquemas para tokens
│   │   └── __init__.py   # Importaciones de esquemas
│   ├── routes/           # Rutas de la API
│   │   ├── auth.py       # Endpoints de autenticación
│   │   ├── persona.py    # Endpoints para Persona
│   │   ├── personal.py   # Endpoints para Personal
│   │   ├── atencion.py   # Endpoints para Atencion
│   │   ├── grupo.py      # Endpoints para Grupo
│   │   ├── cuestionario.py # Endpoints para Cuestionario
│   │   ├── contacto_emergencia.py # Endpoints para ContactoEmergencia
│   │   ├── programa_educativo.py # Endpoints para ProgramaEducativo
│   │   └── __init__.py   # Importaciones de rutas
│   ├── utils/            # Utilidades
│   │   └── deps.py       # Dependencias para inyección
│   └── main.py           # Punto de entrada de la aplicación
├── Planning.md           # Documentación de planificación
├── README.md             # Documentación general
├── Tasks.md              # Lista de tareas
├── requirements.txt      # Dependencias del proyecto
├── ssp.db                # Base de datos SQLite
├── start_api.py          # Script para iniciar la API
└── update_atencion_table.py # Script para actualizar la tabla atencion
```

## Tecnologías Utilizadas

- **FastAPI**: Framework web de alto rendimiento
- **SQLAlchemy**: ORM para interactuar con la base de datos
- **Pydantic**: Validación de datos y serialización
- **JWT**: Autenticación basada en tokens
- **SQLite**: Base de datos relacional
- **Uvicorn**: Servidor ASGI para ejecutar la aplicación

## Estructura de la Base de Datos

### Entidades Principales

1. **Persona**
   - Entidad central que representa a estudiantes, docentes y personal administrativo
   - Campos: id, tipo_persona, sexo, genero, edad, estado_civil, religion, trabaja, lugar_trabajo, lugar_origen, colonia_residencia_actual, celular, correo_institucional, discapacidad, observaciones, matricula, semestre, numero_hijos, grupo_etnico, rol, hashed_password, is_active
   - Relaciones: programas, grupos, personal, contactos_emergencia, atenciones

2. **Personal**
   - Información específica del personal
   - Campos: id, area, rol, numero_empleado, id_persona
   - Relaciones: persona, atenciones

3. **Atencion**
   - Registro de atenciones psicopedagógicas
   - Campos: id, fecha_atencion, motivo_psicologico, motivo_academico, salud_en_general_vulnerable, requiere_seguimiento, requiere_canalizacion_externa, estatus_canalizacion_externa, observaciones, fecha_proxima_sesion, atendido, ultima_fecha_contacto, id_personal, id_persona, id_grupo, id_cuestionario
   - Relaciones: personal, persona, grupo, cuestionario

4. **Grupo**
   - Agrupación de personas
   - Campos: id, nombre_grupo, tipo_grupo, observaciones_grupo, cohorte, fecha_creacion_registro
   - Relaciones: personas, atenciones

5. **Cuestionario**
   - Almacena variables de cuestionarios
   - Campos: id_cuestionario, variables
   - Relaciones: atenciones

6. **ContactoEmergencia**
   - Información de contactos de emergencia
   - Campos: id_contacto, id_persona, nombre_contacto, telefono_contacto, parentesco
   - Relaciones: persona

7. **ProgramaEducativo**
   - Información de programas educativos
   - Campos: id_programa, nombre_programa, clave_programa
   - Relaciones: personas

### Relaciones

- **Persona-ProgramaEducativo**: Muchos a muchos
- **Persona-Grupo**: Muchos a muchos
- **Persona-Personal**: Uno a uno
- **Persona-ContactoEmergencia**: Uno a muchos
- **Persona-Atencion**: Uno a muchos
- **Personal-Atencion**: Uno a muchos
- **Grupo-Atencion**: Uno a muchos
- **Cuestionario-Atencion**: Uno a muchos

## Endpoints de la API

La API está organizada en los siguientes grupos de endpoints:

1. **Autenticación**
   - `/api/v1/auth/login`: Iniciar sesión
   - `/api/v1/auth/test-token`: Verificar token

2. **Personas**
   - CRUD completo para personas
   - Operaciones por lotes
   - Búsqueda y filtrado

3. **Personal**
   - CRUD completo para personal
   - Operaciones por lotes
   - Búsqueda y filtrado

4. **Atenciones**
   - CRUD completo para atenciones
   - Operaciones por lotes
   - Búsqueda y filtrado

5. **Grupos**
   - CRUD completo para grupos
   - Operaciones por lotes
   - Búsqueda y filtrado

6. **Cuestionarios**
   - CRUD completo para cuestionarios
   - Operaciones por lotes

7. **Contactos de Emergencia**
   - CRUD completo para contactos de emergencia
   - Operaciones por lotes
   - Búsqueda y filtrado

8. **Programas Educativos**
   - CRUD completo para programas educativos
   - Operaciones por lotes
   - Búsqueda y filtrado

## Control de Acceso

El sistema implementa un control de acceso basado en roles:

- **admin**: Acceso completo a todas las funcionalidades
- **personal**: Puede gestionar información de personas y realizar operaciones administrativas
- **docente**: Acceso limitado a información relacionada con su función
- **alumno**: Acceso únicamente a su propia información

## Flujo de Trabajo

1. **Autenticación**
   - El usuario se autentica con correo/matrícula y contraseña
   - El sistema devuelve un token JWT
   - El token se utiliza para autorizar las solicitudes subsiguientes

2. **Gestión de Personas**
   - Registro de nuevas personas (estudiantes, docentes, personal)
   - Asignación a programas educativos y grupos
   - Registro de contactos de emergencia

3. **Atenciones**
   - Registro de atenciones psicopedagógicas
   - Seguimiento de casos
   - Aplicación de cuestionarios

4. **Reportes**
   - Generación de reportes de atenciones
   - Estadísticas por programa educativo, grupo, etc.

## Consideraciones de Seguridad

- Contraseñas almacenadas con hash seguro (bcrypt)
- Autenticación basada en tokens JWT
- Validación estricta de datos de entrada
- Control de acceso basado en roles
- Protección contra ataques comunes (CSRF, XSS, inyección SQL)

## Próximos Pasos

1. **Implementación de Reportes**
   - Desarrollo de endpoints para generación de reportes
   - Exportación a formatos comunes (PDF, Excel)

2. **Mejoras en la Búsqueda**
   - Implementación de búsqueda avanzada
   - Filtros combinados

3. **Notificaciones**
   - Sistema de notificaciones para seguimiento de casos
   - Recordatorios de próximas sesiones

4. **Integración con Sistemas Externos**
   - Conexión con sistemas académicos
   - Importación/exportación de datos
