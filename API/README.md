# API del Sistema de Seguimiento Psicopedagógico (SSP)

Esta API proporciona endpoints para gestionar la información del Sistema de Seguimiento Psicopedagógico, incluyendo la gestión de personas, programas educativos, grupos, personal, contactos de emergencia y atenciones.

## Tecnologías utilizadas

- FastAPI: Framework web moderno y de alto rendimiento
- SQLAlchemy: ORM para interactuar con la base de datos
- Pydantic: Validación de datos y serialización
- JWT: Autenticación basada en tokens
- SQLite: Base de datos relacional

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
