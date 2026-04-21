# Testing - Reportes IA en Página de Admin

## 🎯 Objetivo

Verificar que la integración de reportes IA en la página "Cuestionarios Contestados" funciona correctamente.

## ✅ Requisitos Previos

- [ ] Backend corriendo en http://localhost:8000
- [ ] Frontend corriendo en http://localhost:3000
- [ ] Usuario admin autenticado
- [ ] Existen cuestionarios contestados en la BD

## 🧪 Casos de Testing

### 1. Cargar Página de Cuestionarios Contestados

**Pasos**:
1. Navegar a http://localhost:3000/admin/cuestionarios-contestados
2. Esperar a que cargue la tabla

**Resultado Esperado**:
- ✅ Tabla muestra respuestas completadas
- ✅ Cada fila tiene botón "Ver Detalle"
- ✅ No hay errores en consola

**Resultado Actual**: _______________

---

### 2. Abrir Detalle de Respuesta

**Pasos**:
1. Hacer clic en botón "Ver Detalle" de una respuesta
2. Esperar a que cargue el dialog

**Resultado Esperado**:
- ✅ Dialog abre mostrando preguntas y respuestas
- ✅ Se carga automáticamente el reporte (si existe)
- ✅ Muestra sección "Reporte Psicopedagógico"
- ✅ No hay errores en consola

**Resultado Actual**: _______________

---

### 3. Verificar Estado del Reporte

**Caso A: Si NO existe reporte**

**Pasos**:
1. Abrir detalle de una respuesta sin reporte
2. Observar sección de reportes

**Resultado Esperado**:
- ✅ Muestra mensaje: "No hay reporte generado aún"
- ✅ Botón "Generar Reporte" está disponible
- ✅ Botón "Ver Reporte" NO está visible

**Resultado Actual**: _______________

---

**Caso B: Si existe reporte**

**Pasos**:
1. Abrir detalle de una respuesta con reporte
2. Observar sección de reportes

**Resultado Esperado**:
- ✅ Muestra: "✓ Reporte Generado"
- ✅ Muestra versión y fecha
- ✅ Botón "Ver Reporte" está disponible
- ✅ Botón "Generar Reporte" muestra "Regenerar Reporte"

**Resultado Actual**: _______________

---

### 4. Generar Nuevo Reporte

**Pasos**:
1. Abrir detalle de respuesta SIN reporte
2. Hacer clic en "Generar Reporte"
3. Confirmar en dialog
4. Esperar a que se genere

**Resultado Esperado**:
- ✅ Dialog de confirmación aparece
- ✅ Botón muestra "Generando..."
- ✅ Notificación de éxito aparece
- ✅ Sección de reporte se actualiza
- ✅ Muestra "✓ Reporte Generado"
- ✅ Botón "Ver Reporte" aparece

**Resultado Actual**: _______________

**Errores Encontrados**: _______________

---

### 5. Ver Reporte Completo

**Pasos**:
1. Hacer clic en botón "Ver Reporte"
2. Observar modal que se abre

**Resultado Esperado**:
- ✅ Modal abre mostrando contenido del reporte
- ✅ Muestra título "Reporte Psicopedagógico"
- ✅ Muestra versión y fecha
- ✅ Contenido es legible y bien formateado
- ✅ Botón "Regenerar Reporte" está visible (solo admin)
- ✅ Botón "Cerrar" funciona

**Resultado Actual**: _______________

---

### 6. Regenerar Reporte

**Pasos**:
1. Abrir modal de reporte
2. Hacer clic en "Regenerar Reporte"
3. Esperar a que se genere

**Resultado Esperado**:
- ✅ Botón muestra "Regenerando..."
- ✅ Notificación de éxito aparece
- ✅ Modal se actualiza con nuevo reporte
- ✅ Versión incrementa (ej: 1 → 2)
- ✅ Fecha se actualiza
- ✅ Contenido puede ser diferente

**Resultado Actual**: _______________

**Errores Encontrados**: _______________

---

### 7. Cerrar Dialog y Modal

**Pasos**:
1. Hacer clic en botón "Cerrar" del dialog
2. Verificar que se cierra correctamente

**Resultado Esperado**:
- ✅ Dialog se cierra
- ✅ Vuelve a tabla de respuestas
- ✅ No hay errores en consola

**Resultado Actual**: _______________

---

## 🔍 Verificaciones Técnicas

### Consola del Navegador

**Pasos**:
1. Abrir DevTools (F12)
2. Ir a pestaña "Console"
3. Ejecutar los casos de testing anteriores

**Resultado Esperado**:
- ✅ No hay errores (rojo)
- ✅ No hay warnings críticos
- ✅ Logs muestran llamadas a API correctas

**Resultado Actual**: _______________

---

### Network (Llamadas a API)

**Pasos**:
1. Abrir DevTools → Network
2. Ejecutar caso de generar reporte
3. Observar llamadas HTTP

**Resultado Esperado**:
- ✅ GET /cuestionarios-admin/respuestas/{id}/reporte-actual → 200
- ✅ POST /cuestionarios-usuario/{id}/generar-reporte → 200
- ✅ POST /cuestionarios-admin/respuestas/{id}/regenerar-reporte → 200

**Resultado Actual**: _______________

---

## 📊 Resumen de Testing

| Caso | Estado | Notas |
|------|--------|-------|
| 1. Cargar página | ⬜ | |
| 2. Abrir detalle | ⬜ | |
| 3A. Sin reporte | ⬜ | |
| 3B. Con reporte | ⬜ | |
| 4. Generar reporte | ⬜ | |
| 5. Ver reporte | ⬜ | |
| 6. Regenerar | ⬜ | |
| 7. Cerrar | ⬜ | |
| Consola | ⬜ | |
| Network | ⬜ | |

**Leyenda**: ⬜ = No testeado | ✅ = Pasó | ❌ = Falló

---

## 🐛 Problemas Encontrados

### Problema 1
**Descripción**: _______________
**Pasos para reproducir**: _______________
**Resultado esperado**: _______________
**Resultado actual**: _______________
**Solución**: _______________

---

## 📝 Notas Adicionales

_______________

---

## ✨ Conclusión

- **Total de casos**: 10
- **Pasados**: ___
- **Fallidos**: ___
- **Estado General**: _______________

**Fecha de Testing**: _______________
**Testeado por**: _______________

