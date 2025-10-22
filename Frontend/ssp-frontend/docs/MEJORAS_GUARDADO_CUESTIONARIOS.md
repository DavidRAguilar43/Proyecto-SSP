# Mejoras en el Sistema de Guardado de Cuestionarios

**Fecha**: 2025-10-22  
**Archivos modificados**:
- `Frontend/ssp-frontend/src/pages/usuario/ResponderCuestionarioPage.tsx`
- `Frontend/ssp-frontend/src/components/cuestionarios/VistaPreviaPregunta.tsx`

---

## Problemas Identificados y Solucionados

### 1. ❌ Inconsistencias en el Guardado de Respuestas

**Problema**: Las respuestas no se guardaban correctamente cuando se presionaba el botón vs. cuando se editaba o continuaba contestando.

**Causa raíz**:
- El formato de datos del backend `{pregunta_id: {valor, texto_otro}}` no se convertía correctamente al formato del frontend `{pregunta_id: valor}`
- Respuestas de preguntas eliminadas se mantenían en el estado, causando inconsistencias

**Solución implementada**:
```typescript
// Conversión explícita del formato al cargar
if (cuestionarioData.respuestas_previas) {
  const preguntasValidasIds = new Set(cuestionarioData.preguntas.map((p: any) => p.id));
  const respuestasFormateadas: { [preguntaId: string]: any } = {};
  
  Object.entries(cuestionarioData.respuestas_previas).forEach(([preguntaId, data]: [string, any]) => {
    if (preguntasValidasIds.has(preguntaId)) {
      respuestasFormateadas[preguntaId] = data.valor;
    }
  });
  
  setRespuestas(respuestasFormateadas);
  lastSavedRespuestasRef.current = JSON.stringify(respuestasFormateadas);
}
```

---

### 2. ❌ Progreso Incorrecto (200% - 6/3 preguntas)

**Problema**: El indicador mostraba "Progreso: 200% (6/3)" indicando 6 respuestas para 3 preguntas.

**Causa raíz**:
- Se contaban respuestas de preguntas que ya no existen en el cuestionario actual
- No había validación de IDs de preguntas al calcular el progreso

**Solución implementada**:
```typescript
const calcularProgresoFromRespuestas = (respuestasObj: { [preguntaId: string]: any }) => {
  if (!cuestionario) return 0;
  
  // Crear un Set con los IDs de preguntas válidas del cuestionario
  const preguntasValidasIds = new Set(cuestionario.preguntas.map(p => p.id));
  
  // Contar solo respuestas que corresponden a preguntas válidas
  const preguntasRespondidas = Object.keys(respuestasObj).filter(
    preguntaId => {
      if (!preguntasValidasIds.has(preguntaId)) return false;
      const valor = respuestasObj[preguntaId];
      return valor !== undefined && valor !== '' && valor !== null;
    }
  ).length;
  
  return Math.round((preguntasRespondidas / cuestionario.preguntas.length) * 100);
};
```

---

### 3. ❌ Auto-guardado No Funcionaba al Avanzar Automáticamente

**Problema**: Al responder una pregunta y avanzar automáticamente, las respuestas no se guardaban.

**Causa raíz**:
- El debounce de 2 segundos se cancelaba al cambiar de pregunta
- El timeout no se ejecutaba antes del avance automático

**Solución implementada**:
```typescript
const handleRespuestaChange = (preguntaId: string, valor: any, autoAvanzar: boolean = false) => {
  const nuevasRespuestas = { ...respuestas, [preguntaId]: valor };
  setRespuestas(nuevasRespuestas);

  if (autoSaveTimeoutRef.current) {
    clearTimeout(autoSaveTimeoutRef.current);
  }

  // Si va a auto-avanzar, guardar inmediatamente
  if (autoAvanzar && modoVisualizacion === 'paso_a_paso') {
    autoGuardarRespuestas(nuevasRespuestas); // Guardado inmediato
    setTimeout(() => {
      handleSiguientePregunta(nuevasRespuestas);
    }, 500);
  } else {
    // Debounce de 2 segundos para otros casos
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoGuardarRespuestas(nuevasRespuestas);
    }, 2000);
  }
};
```

---

### 4. ❌ Validación de Pregunta Obligatoria Fallaba en Primer Intento

**Problema**: Al seleccionar una respuesta por primera vez, aparecía el mensaje "Esta pregunta es obligatoria" y no avanzaba automáticamente.

**Causa raíz**:
- El estado de React (`respuestas`) no se actualizaba a tiempo para la validación
- La función `handleSiguientePregunta` usaba el estado antiguo

**Solución implementada**:
```typescript
// Validar pregunta actual (puede recibir respuestas personalizadas)
const validarPreguntaActual = (respuestasParaValidar?: { [preguntaId: string]: any }) => {
  if (!cuestionario) return true;
  const pregunta = cuestionario.preguntas[preguntaActual];
  if (!pregunta.obligatoria) return true;
  
  const respuestasAUsar = respuestasParaValidar || respuestas;
  const respuesta = respuestasAUsar[pregunta.id];
  return respuesta !== undefined && respuesta !== '' && respuesta !== null;
};

// Navegación entre preguntas (recibe respuestas actualizadas)
const handleSiguientePregunta = (respuestasParaValidar?: { [preguntaId: string]: any }) => {
  if (!cuestionario) return;
  
  if (!validarPreguntaActual(respuestasParaValidar)) {
    showNotification('Esta pregunta es obligatoria', 'warning');
    return;
  }

  if (preguntaActual < cuestionario.preguntas.length - 1) {
    setPreguntaActual(preguntaActual + 1);
  }
};
```

---

## Nuevas Funcionalidades Implementadas

### ✅ 1. Auto-guardado Automático

**Descripción**: Las respuestas se guardan automáticamente mientras el usuario contesta.

**Características**:
- **Debounce de 2 segundos** para preguntas de texto (evita múltiples llamadas)
- **Guardado inmediato** al avanzar automáticamente en preguntas de selección
- **Indicador visual** en el header ("Guardando...")
- **Prevención de guardados duplicados** mediante comparación de JSON

**Código**:
```typescript
const autoGuardarRespuestas = useCallback(async (respuestasActuales) => {
  const respuestasString = JSON.stringify(respuestasActuales);
  if (respuestasString === lastSavedRespuestasRef.current) {
    return; // Sin cambios, no guardar
  }

  try {
    setAutoSaving(true);
    const respuestasArray = Object.entries(respuestasActuales).map(([preguntaId, valor]) => ({
      pregunta_id: preguntaId,
      valor
    }));

    const progreso = calcularProgresoFromRespuestas(respuestasActuales);
    await cuestionariosUsuarioApi.guardarRespuestas(id, respuestasArray, 'en_progreso', progreso);
    
    lastSavedRespuestasRef.current = respuestasString;
  } catch (error) {
    console.error('Error en auto-guardado:', error);
  } finally {
    setAutoSaving(false);
  }
}, [cuestionario, id]);
```

---

### ✅ 2. Avance Automático en Modo Paso a Paso

**Descripción**: El cuestionario avanza automáticamente a la siguiente pregunta después de responder.

**Comportamiento por tipo de pregunta**:
- ✅ **Radio buttons**: Avanza automáticamente
- ✅ **Select (dropdown)**: Avanza automáticamente
- ✅ **Verdadero/Falso**: Avanza automáticamente
- ✅ **Escala Likert**: Avanza al soltar el slider
- ❌ **Checkboxes**: NO avanza (permite selección múltiple)
- ❌ **Texto abierto**: NO avanza (usa Shift+Enter)

**Implementación**:
```typescript
// En VistaPreviaPregunta.tsx
case 'radio_button':
  return (
    <RadioGroup
      value={localValue}
      onChange={(e) => handleChange(e.target.value, true)} // autoAvanzar = true
    >
      {/* opciones */}
    </RadioGroup>
  );
```

---

### ✅ 3. Shift+Enter para Preguntas de Texto Abierto

**Descripción**: En preguntas de texto abierto, el usuario puede usar:
- **Enter**: Agregar salto de línea (comportamiento normal)
- **Shift+Enter**: Continuar a la siguiente pregunta

**Implementación**:
```typescript
const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
  if (e.key === 'Enter' && e.shiftKey) {
    e.preventDefault();
    if (onSubmit) {
      onSubmit();
    }
  }
};

// En el TextField
<TextField
  onKeyDown={handleKeyDown}
  // ... otras props
/>
```

---

### ✅ 4. Leyenda Informativa para Texto Abierto

**Descripción**: Se muestra una leyenda debajo de las preguntas de texto abierto.

**Texto**: "💡 Presiona **Shift + Enter** para continuar a la siguiente pregunta"

**Implementación**:
```typescript
<Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}>
  💡 Presiona <strong>Shift + Enter</strong> para continuar a la siguiente pregunta
</Typography>
```

---

### ✅ 5. Indicador Visual de Auto-guardado

**Descripción**: Chip en el header que muestra "Guardando..." durante el proceso.

**Implementación**:
```typescript
{autoSaving && (
  <Chip 
    label="Guardando..." 
    size="small" 
    color="info" 
    sx={{ height: 20 }}
  />
)}
```

---

### ✅ 6. Mensaje Informativo de Auto-guardado

**Descripción**: Alert en la parte superior que informa al usuario sobre el auto-guardado.

**Texto**: "💾 Auto-guardado: Tus respuestas se guardan automáticamente mientras contestas."

---

## Logs de Depuración Agregados

Para facilitar el debugging, se agregaron console.logs en puntos clave:

```typescript
// Al cargar cuestionario
console.log('📋 Cuestionario cargado:', {
  titulo: cuestionarioData.titulo,
  totalPreguntas: cuestionarioData.preguntas?.length,
  respuestasPrevias: cuestionarioData.respuestas_previas
});

// Al cargar respuestas
console.log('✅ IDs de preguntas válidas:', Array.from(preguntasValidasIds));
console.log(`✓ Respuesta válida cargada: ${preguntaId} = ${data.valor}`);
console.warn(`⚠️ Respuesta ignorada (pregunta no existe): ${preguntaId}`);

// Al auto-guardar
console.log('💾 Auto-guardando respuestas:', {
  totalRespuestas: respuestasArray.length,
  progreso: progreso,
  respuestas: respuestasArray
});
console.log('✅ Auto-guardado exitoso');
```

---

## Mejoras Técnicas

### 1. **Uso de useCallback**
- `autoGuardarRespuestas` ahora usa `useCallback` para evitar recreaciones innecesarias

### 2. **Refs para Optimización**
- `autoSaveTimeoutRef`: Maneja el timeout del debounce
- `lastSavedRespuestasRef`: Evita guardados duplicados

### 3. **Cleanup de Efectos**
```typescript
useEffect(() => {
  return () => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
  };
}, []);
```

### 4. **Validación de Datos**
- Filtrado de respuestas inválidas al cargar
- Validación de IDs de preguntas en cálculo de progreso
- Conversión explícita de formatos de datos

---

## Testing Recomendado

### Casos de Prueba

1. **Carga de respuestas previas**
   - [ ] Crear cuestionario con 3 preguntas
   - [ ] Responder 2 preguntas
   - [ ] Salir y volver a entrar
   - [ ] Verificar que las 2 respuestas se carguen correctamente

2. **Auto-guardado**
   - [ ] Responder una pregunta de texto
   - [ ] Esperar 2 segundos
   - [ ] Verificar en consola que se guardó

3. **Avance automático**
   - [ ] Responder pregunta de radio button
   - [ ] Verificar que avanza automáticamente después de 500ms
   - [ ] Verificar que se guardó la respuesta

4. **Shift+Enter en texto abierto**
   - [ ] Escribir texto en pregunta abierta
   - [ ] Presionar Enter (debe agregar salto de línea)
   - [ ] Presionar Shift+Enter (debe avanzar a siguiente pregunta)

5. **Progreso correcto**
   - [ ] Cuestionario con 5 preguntas
   - [ ] Responder 3 preguntas
   - [ ] Verificar que muestra "60% (3/5)"

---

## Notas Importantes

⚠️ **Los console.logs son temporales** y deben eliminarse en producción.

✅ **Compatibilidad**: Funciona en modo "paso a paso" y "vista completa".

✅ **Performance**: El debounce evita llamadas excesivas al backend.

✅ **UX**: El usuario recibe feedback visual constante del estado de guardado.

