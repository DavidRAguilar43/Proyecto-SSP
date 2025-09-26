# Personalización de Campos por Rol en la Interfaz Unificada

## Objetivo
Personalizar los campos de información mostrados en la interfaz unificada de usuarios finales según el rol específico, manteniendo la misma funcionalidad pero con terminología apropiada para cada tipo de usuario.

## Mapeo de Campos por Rol

### Para usuarios con rol "personal":
- **Semestre** → **Departamento**
- **Programa** → **Puesto** 
- **Grupo** → **Extensión (Lugar de contacto)**

### Para usuarios con rol "docente":
- **Semestre** → **Facultad**
- **Programa** → **Carrera**
- **Grupo** → **Materias asignadas**

### Para usuarios con rol "alumno":
- **Semestre** → **Semestre Actual** (sin cambios)
- **Programa** → **Programa Educativo** (sin cambios)
- **Grupo** → **Grupo** (sin cambios)

## Archivos Modificados

### 1. `Frontend/ssp-frontend/src/components/AlumnoDashboard.tsx`

**Funciones agregadas:**
- `getFieldLabels()`: Retorna las etiquetas personalizadas según el rol
- `getFieldValues()`: Retorna los valores formateados según el rol

**Secciones modificadas:**
- **Líneas 133-156**: Función `formatUserInfo()` actualizada para usar etiquetas personalizadas
- **Líneas 305-336**: Sección de información académica con etiquetas dinámicas
- **Líneas 568-593**: Sección de información importante con mensajes personalizados

**Ejemplo de cambio:**
```typescript
// Antes
<Typography variant="subtitle2" color="text.secondary">
  Semestre Actual
</Typography>

// Después  
<Typography variant="subtitle2" color="text.secondary">
  {getFieldLabels().semestre}
</Typography>
```

### 2. `Frontend/ssp-frontend/src/components/AlumnoPerfilForm.tsx`

**Funciones agregadas:**
- `getFieldLabels()`: Etiquetas personalizadas para campos del formulario
- `getFieldHelperTexts()`: Textos de ayuda personalizados según el rol

**Secciones modificadas:**
- **Líneas 47-98**: Funciones de personalización agregadas
- **Líneas 286-290**: Nota informativa con terminología personalizada
- **Líneas 441-451**: Campo de semestre con etiqueta y texto de ayuda personalizados

**Ejemplo de cambio:**
```typescript
// Antes
<TextField
  fullWidth
  label="Semestre"
  type="number"
  value={formData.semestre || 1}
  onChange={handleChange('semestre')}
  inputProps={{ min: 1, max: 12 }}
/>

// Después
<TextField
  fullWidth
  label={getFieldLabels().semestre}
  type="number"
  value={formData.semestre || 1}
  onChange={handleChange('semestre')}
  helperText={getFieldHelperTexts().semestre}
  inputProps={{ min: 1, max: 12 }}
/>
```

### 3. `Frontend/ssp-frontend/src/utils/roleLabels.ts` (Nuevo archivo)

**Utilidades centralizadas:**
- `getFieldLabels(rol)`: Etiquetas de campos por rol
- `getFieldHelperTexts(rol)`: Textos de ayuda por rol
- `getFieldValues(user, rol)`: Valores formateados por rol
- `getProfileTitle(rol)`: Título del perfil por rol
- `getProfileDescription(rol)`: Descripción del perfil por rol

## Comportamiento por Rol

### Usuario con rol "personal"
```
Información mostrada:
- Departamento: Departamento 1
- Puesto: Coordinador de Servicios
- Extensión (Lugar de contacto): Ext. 1234

Formulario:
- Campo: "Departamento" con ayuda "Departamento al que pertenece"
- Nota: "Los puestos y extensiones son asignados por el personal administrativo"
```

### Usuario con rol "docente"  
```
Información mostrada:
- Facultad: Facultad 2
- Carrera: Ingeniería en Sistemas
- Materias asignadas: Programación I

Formulario:
- Campo: "Facultad" con ayuda "Facultad donde labora"
- Nota: "Las carreras y materias asignadas son asignados por el personal administrativo"
```

### Usuario con rol "alumno"
```
Información mostrada:
- Semestre Actual: 5° Semestre
- Programa Educativo: Licenciatura en Psicología
- Grupo: PSI-501

Formulario:
- Campo: "Semestre" con ayuda "Semestre actual que cursa"
- Nota: "Los programas educativos y grupos son asignados por el personal administrativo"
```

## Ventajas de la Implementación

### 1. **Interfaz Unificada Mantenida**
- Misma funcionalidad para todos los usuarios finales
- Mismos permisos y accesos
- Código reutilizable

### 2. **Terminología Apropiada**
- Cada rol ve términos relevantes a su contexto profesional
- Mejor experiencia de usuario
- Reduce confusión

### 3. **Mantenibilidad**
- Lógica centralizada en funciones auxiliares
- Fácil agregar nuevos roles o modificar etiquetas
- Código limpio y organizado

### 4. **Escalabilidad**
- Archivo de utilidades `roleLabels.ts` para futuras expansiones
- Patrón reutilizable en otros componentes
- Fácil internacionalización futura

## Pruebas Recomendadas

1. **Iniciar sesión como personal** y verificar que se muestren:
   - "Departamento" en lugar de "Semestre"
   - "Puesto" en lugar de "Programa"
   - "Extensión" en lugar de "Grupo"

2. **Iniciar sesión como docente** y verificar que se muestren:
   - "Facultad" en lugar de "Semestre"
   - "Carrera" en lugar de "Programa"
   - "Materias asignadas" en lugar de "Grupo"

3. **Iniciar sesión como alumno** y verificar que se mantengan:
   - "Semestre Actual"
   - "Programa Educativo"
   - "Grupo"

4. **Verificar formularios** para cada rol y confirmar:
   - Etiquetas correctas en campos
   - Textos de ayuda apropiados
   - Notas informativas personalizadas

## Resultado Final

✅ **Interfaz unificada mantenida** con mismos permisos para todos los usuarios finales
✅ **Terminología personalizada** según el contexto profesional de cada rol
✅ **Experiencia de usuario mejorada** con términos relevantes
✅ **Código mantenible** con lógica centralizada y reutilizable
