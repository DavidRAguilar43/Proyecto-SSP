# Guía de Pruebas - Drag & Drop en Cuestionarios

## Objetivo
Verificar que la funcionalidad de arrastrar y soltar preguntas funciona correctamente en el constructor de cuestionarios.

## Prerrequisitos
1. El servidor backend debe estar ejecutándose
2. El servidor frontend debe estar ejecutándose (`npm run dev`)
3. Tener una cuenta de administrador o coordinador para acceder al constructor de cuestionarios

## Escenarios de Prueba

### 1. Prueba Básica de Drag & Drop

**Pasos:**
1. Iniciar sesión como administrador o coordinador
2. Navegar a "Cuestionarios" → "Crear Cuestionario"
3. Agregar 5 preguntas de cualquier tipo
4. Expandir todas las preguntas para ver sus números de orden
5. Hacer clic y mantener presionado el icono de drag (☰) de la pregunta 1
6. Arrastrar la pregunta 1 hasta la posición 3
7. Soltar la pregunta

**Resultado Esperado:**
- La pregunta 1 ahora debe estar en la posición 3
- Las preguntas 2 y 3 deben haberse movido hacia arriba
- Los números de orden deben actualizarse automáticamente:
  - Pregunta original 2 → ahora es pregunta 1
  - Pregunta original 3 → ahora es pregunta 2
  - Pregunta original 1 → ahora es pregunta 3
  - Pregunta original 4 → sigue siendo pregunta 4
  - Pregunta original 5 → sigue siendo pregunta 5
- Durante el arrastre, la pregunta debe verse semi-transparente

### 2. Prueba de Cambio Manual de Orden

**Pasos:**
1. Crear un cuestionario con 5 preguntas
2. Expandir la pregunta 5
3. En el campo "Orden de pregunta", cambiar el valor de 5 a 1
4. Presionar Enter o hacer clic fuera del campo

**Resultado Esperado:**
- La pregunta 5 debe moverse a la posición 1
- Todas las demás preguntas deben desplazarse una posición hacia abajo
- Los números de orden deben actualizarse automáticamente:
  - Pregunta original 5 → ahora es pregunta 1
  - Pregunta original 1 → ahora es pregunta 2
  - Pregunta original 2 → ahora es pregunta 3
  - Pregunta original 3 → ahora es pregunta 4
  - Pregunta original 4 → ahora es pregunta 5

### 3. Prueba de Validación de Orden

**Pasos:**
1. Crear un cuestionario con 5 preguntas
2. Expandir la pregunta 3
3. Intentar cambiar el orden a 0
4. Intentar cambiar el orden a 10
5. Intentar cambiar el orden a -1

**Resultado Esperado:**
- No debe permitir valores menores a 1
- No debe permitir valores mayores al total de preguntas (5)
- La pregunta debe mantener su posición original si se ingresa un valor inválido

### 4. Prueba de Persistencia del Orden

**Pasos:**
1. Crear un cuestionario con 5 preguntas
2. Reordenar las preguntas usando drag & drop
3. Guardar el cuestionario como borrador
4. Navegar a otra página
5. Volver a editar el cuestionario guardado

**Resultado Esperado:**
- El orden de las preguntas debe mantenerse tal como se guardó
- Los números de orden deben reflejar el orden guardado

### 5. Prueba con Diferentes Tipos de Preguntas

**Pasos:**
1. Crear un cuestionario con los siguientes tipos de preguntas:
   - Pregunta 1: Texto Abierto
   - Pregunta 2: Opción Múltiple
   - Pregunta 3: Escala Likert
   - Pregunta 4: Checkbox
   - Pregunta 5: Radio Button
2. Reordenar las preguntas usando drag & drop
3. Verificar que todas las configuraciones se mantengan

**Resultado Esperado:**
- Todas las preguntas deben poder reordenarse sin importar su tipo
- Las configuraciones específicas de cada tipo deben mantenerse intactas
- Los colores alternados (azul/naranja) deben actualizarse según la nueva posición

### 6. Prueba de Interacción con Otras Funciones

**Pasos:**
1. Crear un cuestionario con 3 preguntas
2. Reordenar las preguntas
3. Duplicar una pregunta
4. Verificar el orden
5. Eliminar una pregunta
6. Verificar el orden nuevamente

**Resultado Esperado:**
- Al duplicar una pregunta, debe agregarse al final con el siguiente número de orden
- Al eliminar una pregunta, los números de orden deben recalcularse automáticamente
- El orden relativo de las preguntas restantes debe mantenerse

### 7. Prueba de Usabilidad del Cursor

**Pasos:**
1. Crear un cuestionario con 3 preguntas
2. Pasar el mouse sobre el icono de drag (☰)
3. Hacer clic y mantener presionado el icono
4. Soltar el icono

**Resultado Esperado:**
- Al pasar el mouse sobre el icono, el cursor debe cambiar a "grab" (mano abierta)
- Al hacer clic y mantener, el cursor debe cambiar a "grabbing" (mano cerrada)
- Al soltar, el cursor debe volver a "grab"

### 8. Prueba de Expansión/Colapso Durante Drag

**Pasos:**
1. Crear un cuestionario con 3 preguntas
2. Expandir todas las preguntas
3. Arrastrar una pregunta expandida
4. Verificar que la pregunta siga expandida después del movimiento

**Resultado Esperado:**
- Las preguntas deben mantener su estado de expansión/colapso después de ser reordenadas

### 9. Prueba de Vista Previa

**Pasos:**
1. Crear un cuestionario con 5 preguntas
2. Reordenar las preguntas
3. Hacer clic en "Vista Previa"
4. Verificar el orden en la vista previa

**Resultado Esperado:**
- La vista previa debe mostrar las preguntas en el nuevo orden
- Los números de pregunta en la vista previa deben coincidir con el orden actual

### 10. Prueba de Guardado Final

**Pasos:**
1. Crear un cuestionario completo con:
   - Título y descripción
   - 5 preguntas de diferentes tipos
   - Tipos de usuario asignados
   - Fechas de inicio y fin
2. Reordenar las preguntas usando drag & drop
3. Cambiar manualmente el orden de una pregunta
4. Guardar el cuestionario como "Activo"
5. Ir a la lista de cuestionarios
6. Abrir el cuestionario guardado en modo "Ver"

**Resultado Esperado:**
- El cuestionario debe guardarse correctamente
- Al ver el cuestionario, las preguntas deben aparecer en el orden correcto
- Los números de pregunta deben ser secuenciales (1, 2, 3, 4, 5)

## Pruebas de Accesibilidad

### 11. Prueba de Navegación por Teclado

**Pasos:**
1. Crear un cuestionario con 3 preguntas
2. Usar la tecla Tab para navegar hasta el icono de drag de la primera pregunta
3. Presionar Espacio o Enter para activar el drag
4. Usar las teclas de flecha (↑ ↓) para mover la pregunta
5. Presionar Espacio o Enter para soltar

**Resultado Esperado:**
- Debe ser posible reordenar preguntas usando solo el teclado
- Las teclas de flecha deben mover la pregunta hacia arriba o abajo
- El orden debe actualizarse correctamente

## Casos Extremos

### 12. Prueba con Una Sola Pregunta

**Pasos:**
1. Crear un cuestionario con 1 pregunta
2. Intentar arrastrar la pregunta

**Resultado Esperado:**
- No debe haber errores
- La pregunta debe permanecer en su posición

### 13. Prueba con Máximo de Preguntas

**Pasos:**
1. Crear un cuestionario con 50 preguntas (el máximo permitido)
2. Arrastrar la pregunta 1 a la posición 50
3. Arrastrar la pregunta 50 a la posición 1

**Resultado Esperado:**
- El drag & drop debe funcionar correctamente incluso con muchas preguntas
- Los números de orden deben actualizarse correctamente para todas las preguntas

### 14. Prueba de Movimiento Rápido

**Pasos:**
1. Crear un cuestionario con 10 preguntas
2. Reordenar rápidamente varias preguntas en sucesión
3. Verificar el orden final

**Resultado Esperado:**
- No debe haber errores o comportamientos inesperados
- El orden final debe ser correcto y consistente

## Checklist de Verificación

Marcar cada ítem después de verificarlo:

- [ ] El icono de drag (☰) es visible en cada pregunta
- [ ] El cursor cambia a "grab" al pasar sobre el icono de drag
- [ ] El cursor cambia a "grabbing" al hacer clic en el icono
- [ ] La pregunta se vuelve semi-transparente durante el arrastre
- [ ] Las preguntas se pueden reordenar arrastrándolas
- [ ] Los números de orden se actualizan automáticamente después del drag
- [ ] El campo "Orden de pregunta" muestra el número correcto
- [ ] Se puede cambiar el orden manualmente usando el campo numérico
- [ ] El cambio manual de orden reordena todas las preguntas correctamente
- [ ] No se permiten valores de orden inválidos (< 1 o > total)
- [ ] El orden se mantiene al guardar el cuestionario
- [ ] El orden se mantiene al recargar la página de edición
- [ ] Funciona con todos los tipos de preguntas
- [ ] Los colores alternados se actualizan según la nueva posición
- [ ] La duplicación de preguntas funciona correctamente
- [ ] La eliminación de preguntas actualiza los números de orden
- [ ] La vista previa muestra el orden correcto
- [ ] Se puede navegar y reordenar usando el teclado
- [ ] No hay errores en la consola del navegador
- [ ] El rendimiento es aceptable (sin lag al arrastrar)

## Reporte de Problemas

Si encuentra algún problema durante las pruebas, por favor documente:

1. **Descripción del problema**: ¿Qué salió mal?
2. **Pasos para reproducir**: ¿Cómo se puede reproducir el problema?
3. **Resultado esperado**: ¿Qué debería haber pasado?
4. **Resultado actual**: ¿Qué pasó en realidad?
5. **Navegador y versión**: ¿En qué navegador ocurrió?
6. **Capturas de pantalla**: Si es posible, adjuntar imágenes
7. **Errores de consola**: Copiar cualquier error que aparezca en la consola del navegador

## Notas Adicionales

- Las pruebas deben realizarse en diferentes navegadores (Chrome, Firefox, Safari)
- Verificar que no haya errores en la consola del navegador durante las pruebas
- Probar en diferentes tamaños de pantalla (desktop, tablet, móvil)
- Verificar que el rendimiento sea aceptable incluso con muchas preguntas

