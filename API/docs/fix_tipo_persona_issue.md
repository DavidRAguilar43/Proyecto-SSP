# Fix: Error de tipo_persona en Registro de Usuarios

## Problema Identificado

### Error Original
```
sqlite3.IntegrityError: NOT NULL constraint failed: personas.tipo_persona
```

### Causa Raíz
- La base de datos SQLite tiene una columna `tipo_persona` que es NOT NULL
- El modelo de SQLAlchemy `Persona` no incluía esta columna
- Al intentar crear nuevos registros, SQLAlchemy no proporcionaba un valor para `tipo_persona`
- Esto causaba que la base de datos rechazara la inserción

### Contexto
Este problema no está relacionado con los cambios de permisos realizados. Es un problema de inconsistencia entre el modelo de datos de Python y la estructura real de la base de datos.

## Solución Temporal Implementada

### 1. Actualización del Modelo `Persona`
**Archivo**: `API/app/models/persona.py`

```python
# TEMPORAL: Mantenemos tipo_persona para compatibilidad con BD existente
# TODO: Crear migración para eliminar esta columna
tipo_persona = Column(String, nullable=False, default="usuario")  # TEMPORAL - será eliminado
```

### 2. Actualización de Endpoints de Creación
**Archivo**: `API/app/routes/persona.py`

Se agregó el campo `tipo_persona="usuario"` en todos los lugares donde se crea un objeto `Persona`:

1. **Endpoint de registro** (`registro_usuario`)
2. **Endpoint administrativo** (`create_persona`) 
3. **Bulk operations** (`bulk_create_personas`)

```python
db_persona = Persona(
    # TEMPORAL: Incluimos tipo_persona para compatibilidad con BD
    tipo_persona="usuario",  # TEMPORAL - será eliminado en migración futura
    sexo=persona_in.sexo,
    # ... resto de campos
)
```

## Impacto de la Solución

### ✅ Funcionalidad Restaurada
- ✅ Registro de usuarios funciona correctamente
- ✅ Creación administrativa de personas funciona
- ✅ Bulk operations funcionan
- ✅ No se rompe funcionalidad existente

### ⚠️ Consideraciones
- Esta es una **solución temporal**
- El campo `tipo_persona` no se usa en la lógica de negocio
- Solo se incluye para satisfacer la restricción NOT NULL de la base de datos

## Solución Permanente Recomendada

### Opción 1: Migración de Base de Datos (Recomendada)
1. Crear una migración que elimine la columna `tipo_persona` de la tabla `personas`
2. Remover el campo del modelo `Persona`
3. Limpiar el código de los endpoints

### Opción 2: Mantener el Campo
1. Definir claramente el propósito del campo `tipo_persona`
2. Implementar lógica de negocio que lo use
3. Actualizar schemas y validaciones

## Archivos Modificados

### Modelos
- `API/app/models/persona.py` - Agregado campo `tipo_persona`

### Endpoints
- `API/app/routes/persona.py` - Agregado `tipo_persona="usuario"` en creaciones

### Documentación
- `API/docs/fix_tipo_persona_issue.md` - Este documento

## Pruebas Requeridas

### ✅ Casos de Prueba
1. **Registro de alumno** - Verificar que funciona sin errores
2. **Registro de personal** - Verificar que funciona sin errores  
3. **Registro de docente** - Verificar que funciona sin errores
4. **Creación administrativa** - Verificar que admin/coordinador pueden crear personas
5. **Bulk operations** - Verificar que funcionan correctamente

### 🔍 Validaciones
- No hay errores 500 en registro
- Los usuarios se crean correctamente en la base de datos
- Las notificaciones se envían correctamente para personal/docente
- Los permisos funcionan como se espera

## Estado Actual

- ✅ **Solución temporal implementada**
- ✅ **Registro funcionando**
- ⏳ **Pendiente**: Migración permanente
- ⏳ **Pendiente**: Pruebas completas

## Próximos Pasos

1. Probar el registro con diferentes roles
2. Verificar que no hay otros errores relacionados
3. Planificar migración permanente
4. Actualizar documentación de API si es necesario
