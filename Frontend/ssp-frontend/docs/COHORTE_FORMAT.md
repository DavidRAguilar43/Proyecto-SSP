# Sistema de Cohorte Simplificado

## Descripción

El sistema de cohortes ha sido simplificado eliminando la tabla `cohorte` y usando campos directos en la tabla `persona`. Los usuarios pueden ingresar directamente su año y período de cohorte como campos independientes y opcionales.

## Campos

### 1. Año de Cohorte
- **Tipo:** Campo numérico (opcional)
- **Validación:** Número de 4 dígitos (1000-9999)
- **Ejemplo:** 2024, 2025, 2026
- **Descripción:** Año académico de la cohorte

### 2. Período de Cohorte
- **Tipo:** Selector con opciones predefinidas (opcional)
- **Opciones:**
  - Período 1 (por defecto)
  - Período 2
- **Descripción:** Período académico dentro del año

## Almacenamiento Directo

Los campos se almacenan por separado en la base de datos sin combinación automática:

### Campos en Base de Datos:
- `cohorte_ano`: INTEGER (nullable)
- `cohorte_periodo`: INTEGER (nullable, default: 1)

### Ejemplos:
- Año: 2024, Período: 1 → `cohorte_ano: 2024, cohorte_periodo: 1`
- Año: 2025, Período: 2 → `cohorte_ano: 2025, cohorte_periodo: 2`
- Sin cohorte → `cohorte_ano: null, cohorte_periodo: 1`

## Comportamiento

### Validación
- ✅ Ambos campos deben ser seleccionados para generar una cohorte válida
- ✅ Si solo se selecciona uno de los campos, no se genera valor de cohorte
- ✅ El año debe estar entre 2020 y 2030
- ✅ El período debe ser 1, 2 o 3

### Experiencia de Usuario
- 📱 Los campos siguen el mismo estilo visual del resto del formulario
- 👁️ Preview en tiempo real del formato resultante
- ⚡ Combinación automática al seleccionar ambos valores
- 🔄 Limpieza automática si se deselecciona algún campo

### Almacenamiento
- 💾 El valor combinado se almacena como string en el campo `cohorte_id`
- 🔗 No hay relación directa con la tabla de cohortes existente
- 📊 Permite consultas y filtros por cohorte usando el formato string

## Migración

### Cambios en el Backend
- `cohorte_id` ahora acepta `Union[int, str]` en lugar de solo `int`
- Eliminada la foreign key constraint con la tabla `cohorte`
- Soporte para almacenamiento de strings en formato `año-período`

### Cambios en el Frontend
- Reemplazado el Autocomplete de cohortes por dos campos separados
- Agregada lógica de combinación automática
- Preview visual del resultado
- Validación en tiempo real

## Casos de Uso

### Registro de Estudiante
```typescript
// Usuario selecciona:
cohorteAno = "2024"
cohortePeriodo = "1"

// Sistema genera automáticamente:
cohorteGenerada = "2024-1"

// Se envía al backend:
formData.cohorte_id = "2024-1"
```

### Consultas en Backend
```python
# Buscar estudiantes de una cohorte específica
estudiantes_2024_1 = db.query(Persona).filter(
    Persona.cohorte_id == "2024-1"
).all()

# Buscar estudiantes de un año específico
estudiantes_2024 = db.query(Persona).filter(
    Persona.cohorte_id.like("2024-%")
).all()
```

## Ventajas

1. **Flexibilidad:** No depende de cohortes predefinidas en base de datos
2. **Simplicidad:** Formato intuitivo y fácil de entender
3. **Escalabilidad:** Fácil agregar nuevos años y períodos
4. **Consultas:** Permite filtros por año o período específico
5. **Mantenimiento:** Reduce la necesidad de gestionar tabla de cohortes

## Consideraciones

- ⚠️ Los datos existentes con `cohorte_id` numérico seguirán funcionando
- ⚠️ Las nuevas cohortes usarán el formato string `año-período`
- ⚠️ Se recomienda migrar gradualmente los datos existentes si es necesario
- ⚠️ Las consultas deben considerar ambos formatos (numérico y string) durante la transición
