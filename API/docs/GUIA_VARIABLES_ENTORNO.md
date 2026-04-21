# Guía de Variables de Entorno

## 🎯 Objetivo

Centralizar y documentar todas las variables de configuración del backend en un archivo `.env` seguro.

## 📦 Estructura de Configuración

```
┌─────────────────────────────────────────┐
│   Variables de Entorno del Sistema      │
│   (OPENROUTER_API_KEY, etc)             │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│   Archivo .env (local)                  │
│   - NO se commitea                      │
│   - Contiene valores reales             │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│   app/core/config.py                    │
│   - Configuración centralizada          │
│   - Valores por defecto                 │
│   - Validación de tipos                 │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│   Código de la Aplicación               │
│   from app.core.config import settings  │
│   settings.OPENROUTER_API_KEY           │
└─────────────────────────────────────────┘
```

## 🔑 Variables Principales

### OpenRouter API

```env
# API key para OpenRouter (REQUERIDA)
OPENROUTER_API_KEY=sk_live_your_key_here

# URL base de OpenRouter (opcional)
OPENROUTER_BASE_URL=https://openrouter.io/api/v1

# Modelo a usar (opcional)
OPENROUTER_MODEL=meta-llama/llama-2-70b-chat

# Información del sitio (opcional)
SITE_URL=http://localhost:3000
SITE_NAME=Sistema SSP
```

### Base de Datos

```env
# URL de conexión a base de datos
DATABASE_URL=sqlite:///./ssp.db
```

### Seguridad

```env
# Clave secreta para JWT (generar con: openssl rand -hex 32)
SECRET_KEY=dev-secret-key-change-in-production

# Algoritmo de JWT
ALGORITHM=HS256

# Expiración de token en minutos
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Aplicación

```env
# Ambiente: development, staging, production
ENVIRONMENT=development

# Modo debug
DEBUG=True

# Host y puerto
HOST=0.0.0.0
PORT=8000
```

## 📋 Checklist de Configuración

- [ ] Copiar `.env.example` a `.env`
- [ ] Obtener API key en https://openrouter.io/keys
- [ ] Configurar `OPENROUTER_API_KEY` en `.env`
- [ ] Ejecutar `python scripts/verify_env_config.py`
- [ ] Verificar que todas las verificaciones pasen
- [ ] Iniciar servidor con `python start_api.py`

## 🔍 Verificación

### Ejecutar Script de Verificación

```bash
python scripts/verify_env_config.py
```

**Salida esperada:**
```
✅ Todas las verificaciones pasaron correctamente!
```

### Verificar Manualmente

```bash
# Ver todas las variables
cat .env

# Ver solo OpenRouter
grep OPENROUTER .env

# Verificar que el archivo existe
ls -la .env
```

## 🚀 Uso en Código

### Importar Configuración

```python
from app.core.config import settings
```

### Acceder a Variables

```python
# OpenRouter
api_key = settings.OPENROUTER_API_KEY
model = settings.OPENROUTER_MODEL

# Seguridad
secret = settings.SECRET_KEY
token_expiry = settings.ACCESS_TOKEN_EXPIRE_MINUTES

# Aplicación
debug = settings.DEBUG
environment = settings.ENVIRONMENT
```

### Ejemplo Completo

```python
from app.core.config import settings
from openai import OpenAI

# Crear cliente OpenRouter
client = OpenAI(
    base_url=settings.OPENROUTER_BASE_URL,
    api_key=settings.OPENROUTER_API_KEY
)

# Usar configuración
response = client.chat.completions.create(
    model=settings.OPENROUTER_MODEL,
    messages=[...]
)
```

## 🔐 Seguridad

### ✅ Hacer

- ✅ Usar `.env.example` como plantilla
- ✅ Agregar `.env` a `.gitignore`
- ✅ Cambiar `SECRET_KEY` en producción
- ✅ Usar variables de entorno del sistema en producción
- ✅ Revisar `.env` antes de commitear

### ❌ No Hacer

- ❌ Commitear archivo `.env` con credenciales
- ❌ Compartir API keys por email o chat
- ❌ Usar valores por defecto en producción
- ❌ Hardcodear credenciales en código
- ❌ Subir `.env` a repositorio público

## 🌍 Configuración por Ambiente

### Desarrollo

```env
ENVIRONMENT=development
DEBUG=True
OPENROUTER_API_KEY=sk_live_dev_key
```

### Staging

```env
ENVIRONMENT=staging
DEBUG=False
OPENROUTER_API_KEY=sk_live_staging_key
```

### Producción

```env
ENVIRONMENT=production
DEBUG=False
OPENROUTER_API_KEY=sk_live_prod_key
SECRET_KEY=<generar-con-openssl>
```

## 🆘 Problemas Comunes

### Problema: "OPENROUTER_API_KEY no configurada"

**Causa**: Variable no está en `.env` o está vacía

**Solución**:
```bash
# Verificar
grep OPENROUTER_API_KEY .env

# Editar
nano .env

# Agregar tu API key
OPENROUTER_API_KEY=sk_live_your_actual_key
```

### Problema: "No module named 'pydantic_settings'"

**Causa**: Dependencia no instalada

**Solución**:
```bash
pip install -r requirements.txt
```

### Problema: "Variables no se cargan"

**Causa**: Archivo `.env` no está en la ubicación correcta

**Solución**:
```bash
# Verificar ubicación
ls -la API/.env

# Debe estar en /API/.env, no en raíz
```

## 📚 Archivos Relacionados

- `.env.example` - Plantilla de variables
- `.env` - Configuración local (NO commitear)
- `app/core/config.py` - Configuración centralizada
- `scripts/verify_env_config.py` - Script de verificación
- `docs/CONFIGURACION_ENTORNO.md` - Documentación completa

## 🔗 Referencias

- [Pydantic Settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/)
- [OpenRouter API](https://openrouter.io/docs)
- [Python Environment Variables](https://docs.python.org/3/library/os.html#os.getenv)

## 💡 Tips

1. **Generar SECRET_KEY segura**
   ```bash
   openssl rand -hex 32
   ```

2. **Verificar que .env se carga**
   ```bash
   python -c "from app.core.config import settings; print(settings.OPENROUTER_API_KEY)"
   ```

3. **Ver todas las configuraciones**
   ```bash
   python scripts/verify_env_config.py
   ```

4. **Usar diferentes .env por máquina**
   ```bash
   # Desarrollo
   .env

   # Staging
   .env.staging

   # Producción
   .env.production
   ```

