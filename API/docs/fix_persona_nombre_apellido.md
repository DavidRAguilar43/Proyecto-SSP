# Fix: AttributeError en Cuestionarios - Campos nombre y apellido_paterno

## Problema

```
AttributeError: 'Persona' object has no attribute 'nombre'
```

### Error Completo
```python
File "API\app\routes\cuestionarios_admin.py", line 236, in create_cuestionario
    "creado_por_nombre": f"{cuestionario.creador.nombre} {cuestionario.creador.apellido_paterno}" if cuestionario.creador else None,
                            ^^^^^^^^^^^^^^^^^^^^^^^^^^^      
AttributeError: 'Persona' object has no attribute 'nombre'
```

## Causa Raíz

El modelo `Persona` **NO** tiene los campos `nombre` y `apellido_paterno`. 

### Campos Reales del Modelo Persona

El modelo `Persona` (API/app/models/persona.py) tiene los siguientes campos de identificación:
- `correo_institucional` (String, unique, required)
- `matricula` (String, unique, optional)
- `rol` (String, required)

**NO tiene:**
- ❌ `nombre`
- ❌ `apellido_paterno`
- ❌ `apellido_materno`

## Solución Aplicada

Reemplazar todas las referencias a `nombre` y `apellido_paterno` con `correo_institucional`.

### Archivos Modificados

#### API/app/routes/cuestionarios_admin.py

Se corrigieron **5 ocurrencias** en las siguientes funciones:

1. **`get_cuestionarios()` - Línea 102**
   ```python
   # ANTES:
   "creado_por_nombre": f"{cuestionario.creador.nombre} {cuestionario.creador.apellido_paterno}" if cuestionario.creador else None,
   
   # DESPUÉS:
   "creado_por_nombre": cuestionario.creador.correo_institucional if cuestionario.creador else None,
   ```

2. **`get_cuestionario()` - Línea 154**
   ```python
   # ANTES:
   "creado_por_nombre": f"{cuestionario.creador.nombre} {cuestionario.creador.apellido_paterno}" if cuestionario.creador else None,
   
   # DESPUÉS:
   "creado_por_nombre": cuestionario.creador.correo_institucional if cuestionario.creador else None,
   ```

3. **`create_cuestionario()` - Línea 236**
   ```python
   # ANTES:
   "creado_por_nombre": f"{cuestionario.creador.nombre} {cuestionario.creador.apellido_paterno}" if cuestionario.creador else None,
   
   # DESPUÉS:
   "creado_por_nombre": cuestionario.creador.correo_institucional if cuestionario.creador else None,
   ```

4. **`update_cuestionario()` - Línea 338**
   ```python
   # ANTES:
   "creado_por_nombre": f"{cuestionario_actualizado.creador.nombre} {cuestionario_actualizado.creador.apellido_paterno}" if cuestionario_actualizado.creador else None,
   
   # DESPUÉS:
   "creado_por_nombre": cuestionario_actualizado.creador.correo_institucional if cuestionario_actualizado.creador else None,
   ```

5. **`duplicate_cuestionario()` - Línea 479**
   ```python
   # ANTES:
   "creado_por_nombre": f"{cuestionario_duplicado.creador.nombre} {cuestionario_duplicado.creador.apellido_paterno}" if cuestionario_duplicado.creador else None,
   
   # DESPUÉS:
   "creado_por_nombre": cuestionario_duplicado.creador.correo_institucional if cuestionario_duplicado.creador else None,
   ```

## Verificación

### Búsqueda de Referencias Restantes

Se verificó que no quedan referencias a `nombre` o `apellido_paterno` en:
- ✅ `API/app/routes/cuestionarios_admin.py`
- ✅ `API/app/routes/cuestionarios_usuario.py`
- ✅ `API/app/models/cuestionario_admin.py`
- ✅ `API/app/schemas/cuestionario_admin.py`

### Comando de Verificación
```bash
# Buscar referencias restantes
grep -r "\.nombre\|\.apellido" API/app/routes/cuestionarios*.py
# Resultado: Sin coincidencias
```

## Impacto

### Frontend
El campo `creado_por_nombre` ahora mostrará el correo institucional del creador en lugar de nombre completo.

**Ejemplo:**
- **Antes:** "Juan Pérez García"
- **Después:** "admin@uabc.edu.mx"

### Schema de Salida
El schema `CuestionarioAdminOut` ya tenía el campo `creado_por_nombre` como `Optional[str]`, por lo que no requiere cambios.

```python
class CuestionarioAdminOut(CuestionarioAdminBase):
    id: str
    fecha_creacion: datetime
    creado_por: int
    creado_por_nombre: Optional[str] = None  # ✅ Ya era opcional
    # ...
```

## Recomendaciones Futuras

### Opción 1: Agregar Campos de Nombre al Modelo Persona
Si se requiere mostrar nombres completos, considerar agregar estos campos al modelo:

```python
class Persona(Base):
    # ... campos existentes ...
    nombre = Column(String, nullable=True)
    apellido_paterno = Column(String, nullable=True)
    apellido_materno = Column(String, nullable=True)
```

**Pros:**
- Mejor experiencia de usuario
- Información más completa

**Contras:**
- Requiere migración de base de datos
- Datos adicionales a mantener
- Posible duplicación con correo institucional

### Opción 2: Extraer Nombre del Correo Institucional
Crear una función helper para extraer el nombre del correo:

```python
def get_nombre_from_email(correo: str) -> str:
    """Extrae el nombre del correo institucional"""
    # admin@uabc.edu.mx -> "admin"
    return correo.split('@')[0].replace('.', ' ').title()
```

**Pros:**
- No requiere cambios en la base de datos
- Automático

**Contras:**
- Menos preciso
- Puede no reflejar el nombre real

### Opción 3: Mantener Correo Institucional (Actual)
Mostrar el correo institucional como identificador del creador.

**Pros:**
- ✅ Implementado actualmente
- ✅ No requiere cambios adicionales
- ✅ Identificador único y preciso

**Contras:**
- Menos amigable para el usuario
- No muestra nombre real

## Testing

### Casos de Prueba

1. **Crear Cuestionario**
   ```bash
   POST /api/cuestionarios-admin/
   # Verificar que creado_por_nombre = correo del usuario actual
   ```

2. **Listar Cuestionarios**
   ```bash
   GET /api/cuestionarios-admin/
   # Verificar que todos los cuestionarios muestran creado_por_nombre
   ```

3. **Obtener Cuestionario**
   ```bash
   GET /api/cuestionarios-admin/{id}
   # Verificar que creado_por_nombre = correo del creador
   ```

4. **Actualizar Cuestionario**
   ```bash
   PUT /api/cuestionarios-admin/{id}
   # Verificar que creado_por_nombre se mantiene del creador original
   ```

5. **Duplicar Cuestionario**
   ```bash
   POST /api/cuestionarios-admin/{id}/duplicate
   # Verificar que creado_por_nombre = correo del usuario que duplica
   ```

## Estado

- ✅ Error corregido
- ✅ Todas las referencias actualizadas
- ✅ Verificación completada
- ✅ Documentación creada
- ⏳ Pendiente: Testing en frontend
- ⏳ Pendiente: Decisión sobre implementación futura de nombres

## Fecha
2025-09-27

## Relacionado
- Modelo: `API/app/models/persona.py`
- Schema: `API/app/schemas/cuestionario_admin.py`
- Rutas: `API/app/routes/cuestionarios_admin.py`

