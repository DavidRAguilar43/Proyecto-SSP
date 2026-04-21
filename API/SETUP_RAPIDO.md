# Setup Rápido - Backend SSP

## Requisitos Previos

- Python 3.10+
- pip o poetry
- Git

## Pasos de Instalación

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd Proyecto-SSP/API
```

### 2. Crear y activar entorno virtual

```bash
# Crear venv
python -m venv venv

# Activar (macOS/Linux)
source venv/bin/activate

# Activar (Windows)
venv\Scripts\activate
```

### 3. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 4. Configurar variables de entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env y agregar tu API key de OpenRouter
nano .env
```

**Necesitas:**
- `OPENROUTER_API_KEY`: Obtén en https://openrouter.io/keys

### 5. Verificar configuración

```bash
python scripts/verify_env_config.py
```

Deberías ver:
```
✅ Todas las verificaciones pasaron correctamente!
```

### 6. Inicializar base de datos (primera vez)

```bash
# Ejecutar migraciones
alembic upgrade head

# (Opcional) Crear datos de prueba
python scripts/create_test_data.py
```

### 7. Iniciar servidor

```bash
python start_api.py
```

O con uvicorn directamente:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

El servidor estará disponible en: http://localhost:8000

## Verificación

### API Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Health Check

```bash
curl http://localhost:8000/api/v1/health
```

## Troubleshooting

### Error: "OPENROUTER_API_KEY no configurada"

```bash
# Verificar que .env existe
ls -la .env

# Verificar que tiene la API key
grep OPENROUTER_API_KEY .env
```

### Error: "ModuleNotFoundError"

```bash
# Asegurar que venv está activado
source venv/bin/activate

# Reinstalar dependencias
pip install -r requirements.txt
```

### Error: "Database is locked"

```bash
# Eliminar archivo de base de datos
rm ssp.db

# Reinicializar
alembic upgrade head
```

## Comandos Útiles

```bash
# Ver logs
tail -f logs/app.log

# Ejecutar tests
pytest tests/

# Limpiar caché Python
find . -type d -name __pycache__ -exec rm -r {} +

# Verificar estilo de código
black app/

# Verificar tipos
mypy app/
```

## Estructura de Carpetas

```
API/
├── .env                 # Variables de entorno (NO commitear)
├── .env.example         # Plantilla de variables (SÍ commitear)
├── requirements.txt     # Dependencias Python
├── start_api.py         # Script para iniciar servidor
├── app/
│   ├── main.py          # Aplicación FastAPI
│   ├── core/
│   │   ├── config.py    # Configuración centralizada
│   │   └── security.py  # Funciones de seguridad
│   ├── models/          # Modelos SQLAlchemy
│   ├── schemas/         # Schemas Pydantic
│   ├── routes/          # Rutas de API
│   ├── services/        # Servicios (IA, etc)
│   └── db/              # Configuración de BD
├── scripts/             # Scripts útiles
├── docs/                # Documentación
└── alembic/             # Migraciones de BD
```

## Documentación Completa

- [Configuración de Entorno](docs/CONFIGURACION_ENTORNO.md)
- [Generación de Reportes IA](docs/GENERACION_REPORTES_IA.md)
- [Testing](docs/TESTING_REPORTES_IA.md)

## Soporte

Para problemas o preguntas:
1. Revisar la documentación en `/docs/`
2. Ejecutar `python scripts/verify_env_config.py`
3. Revisar logs de la aplicación
4. Contactar al equipo de desarrollo

## Próximos Pasos

1. ✅ Setup completado
2. ⏳ Integrar frontend
3. ⏳ Ejecutar tests
4. ⏳ Desplegar a producción

