# 🔍 Guía de Diagnóstico: Problema de Eliminación de Personal/Docentes

## 📋 Resumen del Problema

**Síntoma**: No puedes eliminar personal o docentes desde el frontend, obtienes error 403 "No tiene permisos para eliminar personas"

**Usuario afectado**: admin@sistema.edu (ID: 1, rol: admin)
**Personas a eliminar**: 
- personal@uabc.edu.mx (ID: 7, rol: personal)
- docente@uabc.edu.mx (ID: 8, rol: docente)

## 🛠️ Herramientas de Diagnóstico Implementadas

### 1. Diagnóstico Automático en Eliminación

Cada vez que intentas eliminar una persona, el sistema ahora ejecuta automáticamente:
- ✅ Verificación de token de autenticación
- ✅ Análisis de expiración del token
- ✅ Logging detallado de requests/responses
- ✅ Análisis específico de errores HTTP

### 2. Botón de Diagnóstico Manual

En la página de Personas, ahora hay un botón **"🔍 Diagnóstico Auth"** (solo visible para admin) que:
- Ejecuta un diagnóstico completo de autenticación
- Muestra resultados en la consola del navegador
- No requiere intentar eliminar nada

### 3. Funciones de Consola para Pruebas Avanzadas

Abre la consola del navegador (F12) y usa estas funciones:

```javascript
// Diagnóstico general de autenticación
logAuthDiagnostic()

// Probar eliminación específica (sin eliminar realmente)
testDeletePersonal(7)  // Para personal@uabc.edu.mx
testDeletePersonal(8)  // Para docente@uabc.edu.mx

// Comparar permisos entre estudiante y personal
compareDeletePermissions(2, 7)  // estudiante vs personal

// Activar debugging detallado de todas las peticiones
const stopDebugging = enableRequestDebugging()
// ... hacer pruebas ...
stopDebugging()  // Desactivar cuando termines
```

## 🔧 Pasos de Diagnóstico Recomendados

### Paso 1: Verificación Básica
1. Ve a la página de Personas
2. Haz clic en **"🔍 Diagnóstico Auth"**
3. Revisa la consola para ver si hay problemas obvios

### Paso 2: Prueba de Eliminación con Logging
1. Intenta eliminar personal@uabc.edu.mx (ID: 7)
2. Observa los logs detallados en la consola
3. Anota el código de error específico y los headers

### Paso 3: Pruebas Avanzadas desde Consola
```javascript
// En la consola del navegador:
testDeletePersonal(7)
```

### Paso 4: Verificación de Token
Si sospechas que el token está corrupto:
```javascript
// Ver token actual
localStorage.getItem('token')

// Limpiar y renovar sesión
localStorage.removeItem('token')
location.reload()
```

## 🔍 Qué Buscar en los Logs

### ✅ Señales de que la autenticación está bien:
- `Token presente: ✅`
- `Token expirado: ✅` (no expirado)
- `Servidor alcanzable: ✅`
- `Header Auth enviado: ✅`

### ❌ Señales de problemas:
- **Error 401**: Token inválido o expirado
- **Error 403**: Token válido pero sin permisos
- **Error 500**: Problema del servidor backend
- **Headers sin Authorization**: Token no se está enviando

## 🚨 Posibles Causas y Soluciones

### Causa 1: Token Expirado
**Síntomas**: Error 401, token con fecha de expiración pasada
**Solución**: Cerrar sesión y volver a iniciar

### Causa 2: Token Corrupto
**Síntomas**: Token presente pero no decodificable
**Solución**: Limpiar localStorage y renovar sesión

### Causa 3: Problema de Permisos en Backend
**Síntomas**: Error 403 consistente, token válido
**Solución**: Verificar lógica de autorización en el backend

### Causa 4: Problema de CORS
**Síntomas**: Headers de autorización no llegan al servidor
**Solución**: Verificar configuración CORS del backend

### Causa 5: Error del Servidor
**Síntomas**: Error 500, logs de error en backend
**Solución**: Revisar logs del servidor backend

## 📊 Información de Debugging Recopilada

### Request Headers Esperados:
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

### Response Esperada (Éxito):
```
Status: 200
Body: { mensaje de éxito }
```

### Response de Error Común:
```
Status: 403
Body: { "detail": "No tiene permisos para eliminar personas" }
```

## 🔄 Próximos Pasos Según Resultados

### Si el diagnóstico muestra token válido pero error 403:
1. Verificar que el usuario admin tenga permisos correctos en BD
2. Revisar la función `check_deletion_permission` en el backend
3. Verificar que el rol 'admin' esté correctamente configurado

### Si el diagnóstico muestra token expirado:
1. Cerrar sesión
2. Iniciar sesión nuevamente
3. Repetir prueba

### Si el diagnóstico muestra problemas de conectividad:
1. Verificar que el backend esté ejecutándose
2. Verificar la URL de la API (http://localhost:8000)
3. Revisar configuración de CORS

## 📝 Reporte de Resultados

Después de ejecutar el diagnóstico, por favor comparte:

1. **Resultado del diagnóstico automático** (logs de consola)
2. **Código de error específico** (401, 403, 500, etc.)
3. **Headers de la petición** (especialmente Authorization)
4. **Response del servidor** (mensaje de error completo)
5. **Estado del token** (válido, expirado, corrupto)

Con esta información podremos identificar exactamente dónde está el problema y aplicar la solución correcta.
