# Funcionalidad de Drag & Drop en Cuestionarios

## Descripción General

Se ha implementado la funcionalidad de arrastrar y soltar (drag & drop) en el constructor de cuestionarios para permitir reordenar preguntas de manera intuitiva.

## Características Implementadas

### 1. Arrastrar y Soltar Preguntas
- **Funcionalidad**: Los usuarios pueden arrastrar preguntas hacia arriba o hacia abajo para cambiar su posición.
- **Activación**: El drag se activa después de mover el cursor 8px para evitar activaciones accidentales.
- **Indicador visual**: El icono de drag (☰) cambia el cursor a "grab" cuando se pasa el mouse sobre él.
- **Feedback visual**: Durante el arrastre, la pregunta se vuelve semi-transparente (opacidad 0.5).

### 2. Actualización Automática de Números
- **Comportamiento**: Cuando se arrastra una pregunta, todos los números de orden se actualizan automáticamente.
- **Sincronización**: El campo "Orden de pregunta" refleja siempre la posición real actual de la pregunta.

### 3. Cambio Manual de Orden
- **Campo de entrada**: Cada pregunta tiene un campo numérico "Orden de pregunta".
- **Validación**: Solo acepta números entre 1 y el total de preguntas.
- **Reordenamiento automático**: Al cambiar manualmente el número, todas las demás preguntas se reordenan automáticamente.

### 4. Persistencia del Orden
- **Estado interno**: El orden se mantiene en el estado del componente (array de preguntas).
- **Guardado**: Al guardar el cuestionario, el nuevo orden se envía al backend.
- **Propiedad `orden`**: Cada pregunta tiene una propiedad `orden` que se actualiza automáticamente.

## Tecnologías Utilizadas

### Librerías Instaladas
```json
{
  "@dnd-kit/core": "^6.x",
  "@dnd-kit/sortable": "^8.x",
  "@dnd-kit/utilities": "^3.x"
}
```

### Componentes Modificados

#### 1. CuestionarioForm.tsx
**Cambios principales:**
- Importación de hooks de `@dnd-kit/core` y `@dnd-kit/sortable`
- Configuración de sensores para drag & drop (PointerSensor y KeyboardSensor)
- Función `handleDragEnd`: Maneja el evento cuando termina el arrastre
- Función `handleCambioOrdenManual`: Maneja el cambio manual del número de orden
- Envoltorio `DndContext` y `SortableContext` alrededor de la lista de preguntas

**Código clave:**
```typescript
// Configurar sensores
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8, // Requiere mover 8px antes de activar
    },
  }),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })
);

// Manejar fin del drag
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  if (over && active.id !== over.id) {
    const oldIndex = preguntas.findIndex((p) => p.id === active.id);
    const newIndex = preguntas.findIndex((p) => p.id === over.id);
    const nuevasPreguntas = arrayMove(preguntas, oldIndex, newIndex);
    const preguntasReordenadas = nuevasPreguntas.map((pregunta, i) => ({
      ...pregunta,
      orden: i + 1
    }));
    setPreguntas(preguntasReordenadas);
  }
};

// Manejar cambio manual de orden
const handleCambioOrdenManual = (index: number, nuevoOrden: number) => {
  if (nuevoOrden < 1 || nuevoOrden > preguntas.length) return;
  const nuevasPreguntas = [...preguntas];
  const preguntaMovida = nuevasPreguntas[index];
  nuevasPreguntas.splice(index, 1);
  nuevasPreguntas.splice(nuevoOrden - 1, 0, preguntaMovida);
  const preguntasReordenadas = nuevasPreguntas.map((pregunta, i) => ({
    ...pregunta,
    orden: i + 1
  }));
  setPreguntas(preguntasReordenadas);
};
```

#### 2. PreguntaBuilder.tsx
**Cambios principales:**
- Importación de `useSortable` de `@dnd-kit/sortable`
- Importación de `CSS` de `@dnd-kit/utilities`
- Nueva prop `onCambioOrden` para manejar cambios manuales
- Hook `useSortable` para hacer el componente arrastrable
- Aplicación de estilos de transformación durante el drag
- Icono de drag interactivo con cursor "grab"
- Campo de orden actualizado para usar `index + 1` y llamar a `onCambioOrden`

**Código clave:**
```typescript
// Hook para drag & drop
const {
  attributes,
  listeners,
  setNodeRef,
  transform,
  transition,
  isDragging
} = useSortable({ id: pregunta.id });

// Estilos para drag & drop
const style = {
  transform: CSS.Transform.toString(transform),
  transition,
  opacity: isDragging ? 0.5 : 1,
};

// Icono de drag interactivo
<Box
  {...attributes}
  {...listeners}
  onClick={(e) => e.stopPropagation()}
  sx={{
    cursor: 'grab',
    '&:active': { cursor: 'grabbing' }
  }}
>
  <DragIcon sx={{ color: 'grey.400' }} />
</Box>

// Campo de orden
<TextField
  label="Orden de pregunta"
  type="number"
  value={index + 1}
  onChange={(e) => {
    const nuevoOrden = parseInt(e.target.value);
    if (onCambioOrden && !isNaN(nuevoOrden)) {
      onCambioOrden(nuevoOrden);
    }
  }}
  inputProps={{ min: 1, max: totalPreguntas }}
/>
```

## Flujo de Funcionamiento

### Escenario 1: Arrastrar y Soltar
1. Usuario hace clic en el icono de drag (☰) de una pregunta
2. Arrastra la pregunta a una nueva posición
3. Suelta la pregunta
4. `handleDragEnd` se ejecuta
5. Se calcula la nueva posición usando `arrayMove`
6. Se actualizan los números de orden de todas las preguntas
7. El estado se actualiza con el nuevo orden

### Escenario 2: Cambio Manual de Orden
1. Usuario expande una pregunta
2. Cambia el valor del campo "Orden de pregunta"
3. `handleCambioOrdenManual` se ejecuta
4. Se valida que el número esté en el rango válido
5. Se remueve la pregunta de su posición actual
6. Se inserta en la nueva posición
7. Se actualizan los números de orden de todas las preguntas
8. El estado se actualiza con el nuevo orden

### Escenario 3: Guardado del Cuestionario
1. Usuario hace clic en "Guardar Cambios" o "Crear Cuestionario"
2. Se valida el formulario
3. Se construye el objeto con los datos del formulario, incluyendo el array de preguntas con su orden actual
4. Se envía al backend mediante `onSubmit`
5. El backend guarda las preguntas con su orden actualizado

## Compatibilidad

### Tipos de Preguntas Soportados
- ✅ Texto Abierto
- ✅ Opción Múltiple
- ✅ Selección (Select)
- ✅ Casillas de Verificación (Checkbox)
- ✅ Botones de Radio
- ✅ Escala Likert
- ✅ Verdadero/Falso

### Navegadores Soportados
- Chrome/Edge (Chromium)
- Firefox
- Safari

### Accesibilidad
- ✅ Soporte para teclado (usando KeyboardSensor)
- ✅ Indicadores visuales claros
- ✅ Feedback durante el arrastre

## Estilos Mantenidos

### Colores Alternados
- Preguntas pares: Azul claro (`rgba(33, 150, 243, 0.08)`)
- Preguntas impares: Anaranjado claro (`rgba(255, 152, 0, 0.08)`)

### Iconos
- Icono de drag: `DragIndicator` (☰)
- Color: Gris (`grey.400`)
- Cursor: `grab` (mano abierta) / `grabbing` (mano cerrada)

### Estructura Visual
- Se mantiene el diseño de dos columnas
- Se mantiene el sistema de expansión/colapso
- Se mantienen los colores y estilos existentes

## Pruebas Recomendadas

### Pruebas Funcionales
1. **Drag & Drop básico**
   - Crear un cuestionario con 5 preguntas
   - Arrastrar la pregunta 1 a la posición 3
   - Verificar que los números se actualicen correctamente

2. **Cambio manual de orden**
   - Crear un cuestionario con 5 preguntas
   - Cambiar manualmente el orden de la pregunta 5 a 1
   - Verificar que todas las preguntas se reordenen

3. **Persistencia**
   - Reordenar preguntas
   - Guardar el cuestionario
   - Recargar la página de edición
   - Verificar que el orden se mantenga

4. **Validación**
   - Intentar ingresar un número de orden inválido (0, negativo, mayor al total)
   - Verificar que no se permita

5. **Diferentes tipos de preguntas**
   - Crear preguntas de diferentes tipos
   - Reordenarlas
   - Verificar que todas funcionen correctamente

### Pruebas de Usabilidad
1. Verificar que el cursor cambie a "grab" sobre el icono de drag
2. Verificar que la pregunta se vuelva semi-transparente durante el arrastre
3. Verificar que el campo de orden muestre siempre el número correcto
4. Verificar que no se active el drag accidentalmente al hacer clic

## Notas Técnicas

### Identificadores Únicos
- Cada pregunta debe tener un `id` único
- El `id` se genera con `generarIdPregunta()` usando timestamp + random
- El `id` se usa como key en React y como identificador en el drag & drop

### Orden vs Índice
- **Índice**: Posición en el array (0-indexed)
- **Orden**: Número mostrado al usuario (1-indexed)
- La conversión se hace con `index + 1` para mostrar y `orden - 1` para el array

### Rendimiento
- `@dnd-kit` es altamente optimizado
- No hay re-renders innecesarios
- La actualización del estado es eficiente usando `arrayMove`

## Posibles Mejoras Futuras

1. **Animaciones más suaves**: Agregar transiciones CSS personalizadas
2. **Indicador de posición**: Mostrar una línea donde se soltará la pregunta
3. **Drag desde cualquier parte**: Permitir arrastrar desde toda la tarjeta, no solo el icono
4. **Undo/Redo**: Implementar historial de cambios
5. **Drag & Drop entre secciones**: Si se implementan secciones en el futuro

