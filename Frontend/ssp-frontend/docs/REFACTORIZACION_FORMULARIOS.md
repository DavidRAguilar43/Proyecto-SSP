# Refactorización de Formularios - Campos Compartidos

## Resumen
Se ha completado la refactorización de los formularios de registro de alumno y administración de personas para reutilizar campos comunes mediante un componente compartido.

## Cambios Realizados

### 1. Componente Compartido Creado
- **Archivo**: `src/components/PersonaFieldsShared.tsx`
- **Propósito**: Contiene todos los campos comunes de información personal, académica y adicional
- **Características**:
  - Campos de información básica (correo, matrícula, contraseña)
  - Campos de información personal (sexo, género, edad, estado civil, etc.)
  - Campos de información académica (semestre, cohorte) - solo para alumnos
  - Campos de información adicional (religión, grupo étnico, trabajo, etc.)
  - Configuración flexible mediante props para diferentes contextos

### 2. RegistroUsuarioForm Refactorizado
- **Archivo**: `src/components/RegistroUsuarioForm.tsx`
- **Cambios**:
  - Reemplazó todos los campos duplicados con `PersonaFieldsShared`
  - Mantiene funcionalidad específica de registro:
    - Selección de tipo de usuario
    - Validación de correo y matrícula en tiempo real
    - Confirmación de contraseña
    - Alertas informativas según el tipo de usuario
  - Corregido problema de importación de Grid2

### 3. PersonaForm Refactorizado
- **Archivo**: `src/components/PersonaForm.tsx`
- **Cambios**:
  - Reemplazó campos básicos con `PersonaFieldsShared`
  - Mantiene funcionalidad específica de administración:
    - Selección de tipo de persona y rol (incluyendo admin)
    - Asignación de programas educativos y grupos
    - Selección de cohorte mediante Autocomplete
    - Modo edición vs creación

### 4. Configuración del Componente Compartido
El componente `PersonaFieldsShared` acepta las siguientes props para personalización:

```typescript
interface PersonaFieldsSharedProps {
  formData: PersonaCreate;
  onChange: (field: keyof PersonaCreate) => (event: any) => void;
  showPassword?: boolean;
  passwordRequired?: boolean;
  passwordHelperText?: string;
  showConfirmPassword?: boolean;
  confirmPassword?: string;
  onConfirmPasswordChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  passwordError?: string;
  emailError?: string;
  matriculaError?: string;
  validatingEmail?: boolean;
  validatingMatricula?: boolean;
  showRoleSelection?: boolean;
  isEditing?: boolean;
  userRole?: 'alumno' | 'docente' | 'personal' | 'admin';
  cohorteAno?: number | '';
  cohortePeriodo?: number;
  onCohorteAnoChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCohortePeriodoChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}
```

## Configuraciones por Formulario

### RegistroUsuarioForm
```typescript
<PersonaFieldsShared
  formData={formData}
  onChange={handleChange}
  showPassword={true}
  passwordRequired={true}
  passwordHelperText="Mínimo 8 caracteres"
  showConfirmPassword={true}
  confirmPassword={confirmPassword}
  onConfirmPasswordChange={handleConfirmPasswordChange}
  passwordError={passwordError}
  emailError={emailError}
  matriculaError={matriculaError}
  validatingEmail={validatingEmail}
  validatingMatricula={validatingMatricula}
  showRoleSelection={false}
  isEditing={false}
  userRole={tipoUsuario}
  cohorteAno={cohorteAno}
  cohortePeriodo={cohortePeriodo}
  onCohorteAnoChange={handleCohorteAnoChange}
  onCohortePeriodoChange={handleCohortePeriodoChange}
/>
```

### PersonaForm (Administración)
```typescript
<PersonaFieldsShared
  formData={formData}
  onChange={handleChange}
  showPassword={true}
  passwordRequired={!persona}
  passwordHelperText={persona ? "Dejar vacío para mantener la contraseña actual" : "Requerida para nuevas personas"}
  showConfirmPassword={false}
  showRoleSelection={true}
  isEditing={!!persona}
  userRole={formData.rol as 'alumno' | 'docente' | 'personal' | 'admin'}
/>
```

## Beneficios Obtenidos

1. **Reutilización de Código**: Eliminación de duplicación de campos entre formularios
2. **Mantenimiento Simplificado**: Cambios en campos se aplican automáticamente a ambos formularios
3. **Consistencia de UI**: Garantiza que ambos formularios tengan la misma apariencia y comportamiento
4. **Flexibilidad**: Configuración mediante props permite personalizar el comportamiento según el contexto
5. **Tipos TypeScript**: Mantiene la seguridad de tipos en toda la aplicación

## Verificación
- ✅ Compilación exitosa sin errores
- ✅ Servidor de desarrollo funciona correctamente
- ✅ No hay errores de TypeScript
- ✅ Ambos formularios mantienen su funcionalidad específica
- ✅ Campos compartidos funcionan en ambos contextos

## Archivos Modificados
1. `src/components/PersonaFieldsShared.tsx` (nuevo)
2. `src/components/RegistroUsuarioForm.tsx` (refactorizado)
3. `src/components/PersonaForm.tsx` (refactorizado)
4. `docs/REFACTORIZACION_FORMULARIOS.md` (nuevo)
