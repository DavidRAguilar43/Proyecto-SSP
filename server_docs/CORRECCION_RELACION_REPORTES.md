# Corrección - Relación de Reportes IA

## 🐛 Problema Identificado

Al iniciar el servidor, se presentaba el siguiente error:

```
sqlalchemy.exc.InvalidRequestError: One or more mappers failed to initialize - 
can't proceed with initialization of other mappers. Triggering mapper: 
'Mapper[CuestionarioAdmin(cuestionarios_admin)]'. Original exception was: 
Could not determine join condition between parent/child tables on relationship 
CuestionarioAdmin.reportes_ia - there are no foreign keys linking these tables.
```

## 🔍 Causa Raíz

La relación `reportes_ia` estaba definida incorrectamente en el modelo `CuestionarioAdmin`:

```python
# ❌ INCORRECTO
class CuestionarioAdmin(Base):
    # ...
    reportes_ia = relationship("ReporteIA", back_populates="respuesta_cuestionario", cascade="all, delete-orphan")
```

**Problema**: No hay una FK directa entre `CuestionarioAdmin` y `ReporteIA`. La relación debe ser a través de `RespuestaCuestionario`.

## ✅ Solución Implementada

Se removió la relación incorrecta de `CuestionarioAdmin`:

```python
# ✅ CORRECTO
class CuestionarioAdmin(Base):
    # Relaciones
    creador = relationship("Persona", back_populates="cuestionarios_creados")
    preguntas = relationship("Pregunta", back_populates="cuestionario", cascade="all, delete-orphan", order_by="Pregunta.orden")
    asignaciones = relationship("AsignacionCuestionario", back_populates="cuestionario", cascade="all, delete-orphan")
    respuestas = relationship("RespuestaCuestionario", back_populates="cuestionario", cascade="all, delete-orphan")
    # ❌ REMOVIDA: reportes_ia = relationship(...)
```

## 📊 Estructura Correcta de Relaciones

```
CuestionarioAdmin
    ↓ (1:N)
RespuestaCuestionario
    ↓ (1:N)
ReporteIA
```

**Relaciones correctas:**

1. **CuestionarioAdmin → RespuestaCuestionario**
   ```python
   respuestas = relationship("RespuestaCuestionario", back_populates="cuestionario")
   ```

2. **RespuestaCuestionario → ReporteIA**
   ```python
   reportes_ia = relationship("ReporteIA", back_populates="respuesta_cuestionario")
   ```

3. **ReporteIA → RespuestaCuestionario**
   ```python
   respuesta_cuestionario = relationship("RespuestaCuestionario", back_populates="reportes_ia")
   ```

## 🔧 Cambios Realizados

### Archivo: `app/models/cuestionario_admin.py`

**Línea 55 - Removida:**
```python
# ❌ ANTES
reportes_ia = relationship("ReporteIA", back_populates="respuesta_cuestionario", cascade="all, delete-orphan")

# ✅ DESPUÉS
# (Línea removida)
```

## ✨ Verificación

### Servidor Iniciado Correctamente

```
INFO:__main__:Creando tablas en la base de datos...
INFO:__main__:Tablas creadas correctamente
INFO:__main__:El usuario administrador ya existe
INFO:__main__:Iniciando servidor API...
INFO:__main__:Servidor disponible en: http://localhost:8000
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:app.services.ai_service:Cliente OpenRouter inicializado. Modelo: meta-llama/llama-2-70b-chat
INFO:     Application startup complete.
```

### Endpoints Funcionando

```bash
# ✅ Login endpoint responde correctamente
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@ssp.edu.mx&password=admin123"

# Respuesta: {"detail":"Correo/matrícula o contraseña incorrectos"}
# (Error esperado de validación, no de BD)
```

## 📝 Notas Importantes

1. **Acceso a Reportes**: Para acceder a los reportes de un cuestionario, ahora se debe hacer a través de las respuestas:

   ```python
   # ✅ CORRECTO
   respuesta = db.query(RespuestaCuestionario).filter(...).first()
   reportes = respuesta.reportes_ia  # Acceder a través de respuesta
   
   # ❌ INCORRECTO (ya no funciona)
   cuestionario = db.query(CuestionarioAdmin).filter(...).first()
   reportes = cuestionario.reportes_ia  # Esta relación ya no existe
   ```

2. **Cascada de Eliminación**: Los reportes se eliminan automáticamente cuando se elimina la respuesta del cuestionario.

3. **Versionado**: Cada respuesta puede tener múltiples versiones de reportes (controlado por `version` y `es_actual`).

## 🚀 Próximos Pasos

1. ✅ Servidor iniciado correctamente
2. ⏳ Probar endpoints de generación de reportes
3. ⏳ Verificar que los reportes se guardan correctamente
4. ⏳ Integrar en frontend

## 📚 Archivos Afectados

- `app/models/cuestionario_admin.py` - Relación removida
- Ningún otro archivo requiere cambios (las relaciones en `RespuestaCuestionario` y `ReporteIA` son correctas)

## 🔗 Referencias

- [SQLAlchemy Relationships](https://docs.sqlalchemy.org/en/20/orm/relationships.html)
- [Foreign Keys](https://docs.sqlalchemy.org/en/20/core/constraints.html#foreign-key)

