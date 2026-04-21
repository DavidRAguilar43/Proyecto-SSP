# Configuración de Variables de Entorno

## Descripción General

El proyecto utiliza un archivo `.env` para centralizar la configuración de la aplicación. Esto permite:

- Mantener credenciales seguras fuera del control de versiones
- Facilitar la configuración en diferentes ambientes (desarrollo, staging, producción)
- Usar valores por defecto sensatos para desarrollo

## Archivos de Configuración

### `.env.example`
Archivo de plantilla que muestra todas las variables disponibles y sus valores por defecto.
**Este archivo SÍ se commitea** para que otros desarrolladores sepan qué variables configurar.

### `.env`
Archivo de configuración local con valores reales.
**Este archivo NO se commitea** (está en `.gitignore`).

## Configuración Inicial

### 1. Copiar el archivo de ejemplo

```bash
cd API
cp .env.example .env
```

### 2. Configurar OpenRouter API

#### Obtener API Key

1. Ir a https://openrouter.io/keys
2. Crear una nueva API key
3. Copiar la clave

#### Actualizar `.env`

```bash
# Editar el archivo .env
nano .env

# O usar tu editor favorito
code .env
```

Buscar la línea:
```
OPENROUTER_API_KEY=
```

Y reemplazar con tu API key:
```
OPENROUTER_API_KEY=sk_live_your_actual_api_key_here
```

### 3. Configurar otras variables (opcional)

Las siguientes variables tienen valores por defecto y son opcionales:

```bash
# Información del sitio (usado por OpenRouter)
SITE_URL=http://localhost:3000
SITE_NAME=Sistema SSP

# Base de datos (desarrollo usa SQLite)
DATABASE_URL=sqlite:///./ssp.db

# Seguridad
SECRET_KEY=dev-secret-key-change-in-production-12345678901234567890
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Aplicación
ENVIRONMENT=development
DEBUG=True
HOST=0.0.0.0
PORT=8000
```

## Variables Disponibles

### OpenRouter API

| Variable | Descripción | Valor por Defecto | Requerida |
|----------|-------------|-------------------|-----------|
| `OPENROUTER_API_KEY` | API key de OpenRouter | - | ✅ Sí |
| `OPENROUTER_BASE_URL` | URL base de OpenRouter | `https://openrouter.io/api/v1` | ❌ No |
| `OPENROUTER_MODEL` | Modelo a usar | `meta-llama/llama-2-70b-chat` | ❌ No |
| `SITE_URL` | URL del sitio | `http://localhost:3000` | ❌ No |
| `SITE_NAME` | Nombre del sitio | `Sistema SSP` | ❌ No |

### Base de Datos

| Variable | Descripción | Valor por Defecto | Requerida |
|----------|-------------|-------------------|-----------|
| `DATABASE_URL` | URL de conexión a BD | `sqlite:///./ssp.db` | ❌ No |

### Seguridad

| Variable | Descripción | Valor por Defecto | Requerida |
|----------|-------------|-------------------|-----------|
| `SECRET_KEY` | Clave secreta para JWT | Generada aleatoriamente | ❌ No |
| `ALGORITHM` | Algoritmo de JWT | `HS256` | ❌ No |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Expiración de token (min) | `11520` (8 días) | ❌ No |

### Aplicación

| Variable | Descripción | Valor por Defecto | Requerida |
|----------|-------------|-------------------|-----------|
| `ENVIRONMENT` | Ambiente | `development` | ❌ No |
| `DEBUG` | Modo debug | `True` | ❌ No |
| `HOST` | Host de escucha | `0.0.0.0` | ❌ No |
| `PORT` | Puerto de escucha | `8000` | ❌ No |

## Cómo Funciona la Carga

1. **Valores por defecto**: Definidos en `app/core/config.py`
2. **Variables de entorno**: Sobrescriben los valores por defecto
3. **Archivo `.env`**: Cargado automáticamente por `pydantic-settings`

## Acceso a Configuración en el Código

```python
from app.core.config import settings

# Acceder a cualquier variable
api_key = settings.OPENROUTER_API_KEY
site_url = settings.SITE_URL
debug = settings.DEBUG
```

## Configuración por Ambiente

### Desarrollo

```bash
ENVIRONMENT=development
DEBUG=True
OPENROUTER_API_KEY=sk_live_dev_key_here
```

### Staging

```bash
ENVIRONMENT=staging
DEBUG=False
OPENROUTER_API_KEY=sk_live_staging_key_here
```

### Producción

```bash
ENVIRONMENT=production
DEBUG=False
OPENROUTER_API_KEY=sk_live_prod_key_here
SECRET_KEY=generate-with-openssl-rand-hex-32
```

## Generar SECRET_KEY Segura

Para producción, generar una clave segura:

```bash
# En macOS/Linux
openssl rand -hex 32

# En Windows (PowerShell)
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

## Troubleshooting

### Error: "OPENROUTER_API_KEY no configurada"

**Solución**: Verificar que:
1. El archivo `.env` existe en `/API/.env`
2. La variable `OPENROUTER_API_KEY` está configurada
3. El valor no está vacío

```bash
# Verificar
cat API/.env | grep OPENROUTER_API_KEY
```

### Error: "No module named 'pydantic_settings'"

**Solución**: Instalar la dependencia

```bash
pip install pydantic-settings
```

### Las variables no se cargan

**Solución**: Asegurar que el archivo `.env` está en la raíz de `/API/`

```bash
# Verificar ubicación
ls -la API/.env
```

## Seguridad

⚠️ **IMPORTANTE**:
- Nunca commitear el archivo `.env` con credenciales reales
- Usar `.env.example` como plantilla
- Cambiar `SECRET_KEY` en producción
- Usar variables de entorno del sistema en producción en lugar de archivos `.env`

## Referencias

- [Pydantic Settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/)
- [OpenRouter API](https://openrouter.io/docs)
- [Python-dotenv](https://github.com/theskumar/python-dotenv)

