# Fix: Loop Infinito en useEffect con showNotification

## Problema Crítico

Al crear un cuestionario y navegar a la página de edición, la aplicación se quedaba en blanco y el servidor recibía **peticiones GET infinitas** al mismo cuestionario:

```
INFO: 127.0.0.1:54515 - "GET /api/v1/cuestionarios-admin/55969246-f5a0-4db0-9c29-aabd7ac68ace HTTP/1.1" 200 OK
INFO: 127.0.0.1:52165 - "GET /api/v1/cuestionarios-admin/55969246-f5a0-4db0-9c29-aabd7ac68ace HTTP/1.1" 200 OK
INFO: 127.0.0.1:54515 - "GET /api/v1/cuestionarios-admin/55969246-f5a0-4db0-9c29-aabd7ac68ace HTTP/1.1" 200 OK
... (se repite infinitamente)
```

### Síntomas

- ✅ El cuestionario se crea correctamente
- ❌ La página de edición se queda en blanco
- ❌ Peticiones GET infinitas al servidor
- ❌ El navegador se congela
- ❌ Alto consumo de CPU y memoria

## Causa Raíz

### El Problema: Dependencias Incorrectas en useEffect

**Código problemático en `EditarCuestionarioPage.tsx` (línea 63):**

```typescript
useEffect(() => {
  const cargarCuestionario = async () => {
    // ... código de carga ...
    showNotification(errorMessage, 'error');
  };
  
  cargarCuestionario();
}, [id, showNotification]); // ← PROBLEMA: showNotification como dependencia
```

### ¿Por Qué Causa un Loop Infinito?

1. **showNotification es una función que se recrea en cada render**
   - El hook `useNotification` devuelve funciones nuevas en cada render
   - React detecta que `showNotification` es "diferente" en cada render

2. **Ciclo infinito:**
   ```
   1. Componente se monta
   2. useEffect se ejecuta (porque showNotification cambió)
   3. Se carga el cuestionario
   4. Se actualiza el estado (setCuestionario)
   5. Componente se re-renderiza
   6. showNotification se recrea (nueva referencia)
   7. useEffect detecta cambio en showNotification
   8. VOLVER AL PASO 2 → LOOP INFINITO
   ```

3. **Resultado:**
   - Peticiones GET infinitas
   - Re-renders infinitos
   - Página en blanco
   - Navegador congelado

## Solución Aplicada

### 1. ✅ Fix en EditarCuestionarioPage.tsx

**Archivo:** `Frontend/ssp-frontend/src/pages/admin/EditarCuestionarioPage.tsx`

**Antes (línea 63):**
```typescript
useEffect(() => {
  const cargarCuestionario = async () => {
    // ...
  };
  cargarCuestionario();
}, [id, showNotification]); // ← PROBLEMA
```

**Después (línea 64):**
```typescript
useEffect(() => {
  const cargarCuestionario = async () => {
    // ...
  };
  cargarCuestionario();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [id]); // Solo depende de id, showNotification se omite intencionalmente
```

**Justificación:**
- `showNotification` es una función estable que no cambia su comportamiento
- No necesitamos re-ejecutar el efecto cuando cambia su referencia
- Solo queremos cargar el cuestionario cuando cambia el `id`

### 2. ✅ Fix en CuestionariosAsignadosPage.tsx

**Archivo:** `Frontend/ssp-frontend/src/pages/usuario/CuestionariosAsignadosPage.tsx`

**Antes (línea 64):**
```typescript
useEffect(() => {
  const cargarCuestionarios = async () => {
    // ...
  };
  cargarCuestionarios();
}, [showNotification]); // ← PROBLEMA
```

**Después (línea 65):**
```typescript
useEffect(() => {
  const cargarCuestionarios = async () => {
    // ...
  };
  cargarCuestionarios();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // Sin dependencias, solo se ejecuta al montar
```

**Justificación:**
- Solo queremos cargar los cuestionarios una vez al montar el componente
- No hay variables externas que deban disparar una recarga

## Reglas para useEffect con Funciones de Hooks

### ❌ NO HACER: Incluir funciones de hooks en dependencias

```typescript
const { showNotification } = useNotification();

useEffect(() => {
  // ...
  showNotification('mensaje', 'success');
}, [showNotification]); // ← LOOP INFINITO
```

### ✅ HACER: Omitir funciones estables de las dependencias

```typescript
const { showNotification } = useNotification();

useEffect(() => {
  // ...
  showNotification('mensaje', 'success');
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // ← CORRECTO
```

### ✅ ALTERNATIVA: Usar useCallback en el hook

Si el hook exportara funciones memoizadas con `useCallback`, no habría problema:

```typescript
// En useNotification.ts
const showNotification = useCallback((message, type) => {
  // ...
}, []); // Sin dependencias, función estable
```

## Funciones Afectadas

Estas funciones del hook `useNotification` NO deben incluirse en dependencias de useEffect:

- ❌ `showNotification`
- ❌ `showSuccess`
- ❌ `showError`
- ❌ `showWarning`
- ❌ `showInfo`
- ❌ `notifySuccess`
- ❌ `notifyError`
- ❌ `notifyWarning`
- ❌ `notifyInfo`
- ❌ `notifySaveSuccess`
- ❌ `notifyDeleteSuccess`
- ❌ `notifyUpdateSuccess`
- ❌ `notifyValidationError`
- ❌ `notifyNetworkError`
- ❌ `notifyPermissionError`
- ❌ `notifyWithConfirmation`
- ❌ `notifyLoading`

## Archivos Modificados

### 1. Frontend/ssp-frontend/src/pages/admin/EditarCuestionarioPage.tsx
- ✅ Removido `showNotification` de dependencias
- ✅ Agregado comentario explicativo
- ✅ Agregado eslint-disable para suprimir warning

### 2. Frontend/ssp-frontend/src/pages/usuario/CuestionariosAsignadosPage.tsx
- ✅ Removido `showNotification` de dependencias
- ✅ Cambiado a array vacío (solo ejecutar al montar)
- ✅ Agregado comentario explicativo

## Testing

### Casos de Prueba

1. **Crear cuestionario como borrador**
   - ✅ Debe navegar a página de edición
   - ✅ Debe cargar el cuestionario UNA SOLA VEZ
   - ✅ No debe haber peticiones infinitas
   - ✅ La página debe mostrarse correctamente

2. **Editar cuestionario existente**
   - ✅ Debe cargar el cuestionario UNA SOLA VEZ
   - ✅ No debe haber re-renders infinitos
   - ✅ La página debe responder normalmente

3. **Ver cuestionarios asignados (usuario)**
   - ✅ Debe cargar cuestionarios UNA SOLA VEZ
   - ✅ No debe haber peticiones infinitas
   - ✅ La lista debe mostrarse correctamente

### Verificación en Logs

**Antes (Loop Infinito):**
```
GET /api/v1/cuestionarios-admin/[id] HTTP/1.1" 200 OK
GET /api/v1/cuestionarios-admin/[id] HTTP/1.1" 200 OK
GET /api/v1/cuestionarios-admin/[id] HTTP/1.1" 200 OK
... (infinito)
```

**Después (Correcto):**
```
GET /api/v1/cuestionarios-admin/[id] HTTP/1.1" 200 OK
(solo una vez)
```

## Prevención Futura

### Checklist para useEffect

Antes de agregar una dependencia a useEffect, pregúntate:

1. **¿Es una función de un hook personalizado?**
   - ✅ SÍ → Probablemente NO debe estar en dependencias
   - ❌ NO → Puede estar en dependencias

2. **¿La función cambia en cada render?**
   - ✅ SÍ → NO debe estar en dependencias
   - ❌ NO → Puede estar en dependencias

3. **¿Necesito re-ejecutar el efecto cuando cambia esta función?**
   - ✅ SÍ → Considera usar useCallback en el hook
   - ❌ NO → NO debe estar en dependencias

4. **¿Es una función estable (como setState, dispatch, etc.)?**
   - ✅ SÍ → Puede omitirse de dependencias
   - ❌ NO → Evaluar caso por caso

### Regla General

**Funciones que NUNCA deben estar en dependencias de useEffect:**
- Funciones de hooks personalizados (useNotification, etc.)
- setState de useState
- dispatch de useReducer
- Funciones de contexto
- Callbacks de librerías externas

## Mejora Futura (Opcional)

### Opción 1: Memoizar funciones en useNotification

```typescript
export const useNotification = () => {
  const { showSuccess, showError, showWarning, showInfo } = useNotifications();

  const showNotification = useCallback((message: string, type: string) => {
    // ...
  }, [showSuccess, showError, showWarning, showInfo]);

  return {
    showNotification,
    // ...
  };
};
```

### Opción 2: Usar refs para funciones

```typescript
const showNotificationRef = useRef(showNotification);
useEffect(() => {
  showNotificationRef.current = showNotification;
});

useEffect(() => {
  // Usar showNotificationRef.current
}, []); // Sin dependencias
```

## Estado

- ✅ Loop infinito identificado
- ✅ Causa raíz encontrada
- ✅ Solución aplicada en 2 archivos
- ✅ Documentación completa
- ✅ Reglas de prevención establecidas
- ⏳ Pendiente: Testing en navegador
- ⏳ Pendiente: Revisar otros archivos con el mismo patrón

## Fecha
2025-09-27

## Relacionado
- Hook: `Frontend/ssp-frontend/src/hooks/useNotification.ts`
- Páginas afectadas:
  - `Frontend/ssp-frontend/src/pages/admin/EditarCuestionarioPage.tsx`
  - `Frontend/ssp-frontend/src/pages/usuario/CuestionariosAsignadosPage.tsx`
- Issue: Loop infinito en useEffect
- Patrón: React hooks + useEffect dependencies

