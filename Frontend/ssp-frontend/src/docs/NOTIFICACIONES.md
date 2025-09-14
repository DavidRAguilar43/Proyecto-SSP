# Sistema de Notificaciones

Este documento describe cómo usar el sistema de notificaciones implementado en la aplicación.

## Características

- **4 tipos de notificaciones**: Éxito (verde), Error (rojo), Advertencia (amarillo), Información (azul)
- **Auto-cierre**: Las notificaciones se cierran automáticamente después de 5 segundos (configurable)
- **Cierre manual**: Los usuarios pueden cerrar las notificaciones haciendo clic en la "X"
- **Posición fija**: Aparecen en la esquina superior derecha
- **Animaciones**: Transiciones suaves al aparecer y desaparecer
- **Acciones personalizadas**: Soporte para botones de acción en las notificaciones
- **Apilamiento**: Múltiples notificaciones se apilan verticalmente

## Tipos de Notificaciones

### 1. Éxito (Verde)
```typescript
notifySuccess('Operación exitosa', 'Los datos se guardaron correctamente.');
```

### 2. Error (Rojo)
```typescript
notifyError('Error de validación', 'Por favor, complete todos los campos requeridos.');
```

### 3. Advertencia (Amarillo)
```typescript
notifyWarning('Advertencia', 'Esta acción no se puede deshacer.');
```

### 4. Información (Azul)
```typescript
notifyInfo('Información', 'Se ha enviado un correo de confirmación.');
```

## Uso Básico

### 1. Importar el hook
```typescript
import { useNotification } from '@/hooks/useNotification';
```

### 2. Usar en el componente
```typescript
const MiComponente = () => {
  const { notifySuccess, notifyError, notifyWarning, notifyInfo } = useNotification();

  const handleSave = async () => {
    try {
      await saveData();
      notifySuccess('Guardado exitoso', 'Los datos se han guardado correctamente.');
    } catch (error) {
      notifyError('Error al guardar', 'No se pudieron guardar los datos.');
    }
  };

  return (
    <Button onClick={handleSave}>
      Guardar
    </Button>
  );
};
```

## Métodos de Conveniencia

El hook `useNotification` incluye métodos específicos para operaciones comunes:

```typescript
// Operaciones CRUD
notifySaveSuccess('usuario');
notifyDeleteSuccess('documento');
notifyUpdateSuccess('perfil');

// Errores comunes
notifyValidationError('Los campos son obligatorios.');
notifyNetworkError();
notifyPermissionError();

// Notificación con confirmación
notifyWithConfirmation(
  'Confirmar eliminación',
  '¿Está seguro?',
  () => deleteItem(),
  'Eliminar',
  'Cancelar'
);

// Notificación de carga
const loadingId = notifyLoading('Procesando...');
// Después del proceso
removeNotification(loadingId);
```

## Configuración Avanzada

### Duración personalizada
```typescript
notifyInfo('Mensaje importante', 'Este mensaje dura 10 segundos.', {
  duration: 10000
});
```

### Sin auto-cierre
```typescript
notifyWarning('Acción requerida', 'Esta notificación no se cierra automáticamente.', {
  autoClose: false
});
```

### Con acciones personalizadas
```typescript
notifyInfo('Nueva actualización', 'Hay una nueva versión disponible.', {
  actions: [
    {
      label: 'Actualizar ahora',
      onClick: () => updateApp(),
      variant: 'contained',
      color: 'primary'
    },
    {
      label: 'Más tarde',
      onClick: () => {},
      variant: 'text'
    }
  ]
});
```

## Integración en la Aplicación

El sistema está integrado en `App.tsx`:

```typescript
import { NotificationProvider } from '@/contexts/NotificationContext';
import NotificationContainer from '@/components/NotificationContainer';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <NotificationContainer />
        {/* Resto de la aplicación */}
      </NotificationProvider>
    </AuthProvider>
  );
}
```

## Ejemplos de Uso en Componentes Existentes

### En AlumnoDashboard.tsx
```typescript
// Solicitud de cita exitosa
notifySuccess(
  '¡Solicitud de cita enviada exitosamente!',
  'El personal revisará tu solicitud y te contactará pronto.'
);

// Error en solicitud
notifyError(
  'Error al solicitar la cita',
  'Por favor, inténtalo de nuevo más tarde.'
);
```

### En formularios
```typescript
// Validación
if (!formData.email) {
  notifyValidationError('El email es obligatorio.');
  return;
}

// Guardado exitoso
notifySaveSuccess('usuario');
```

## Demo

Para ver todas las notificaciones en acción, visita el Dashboard como administrador y haz clic en "Mostrar Demo de Notificaciones".

## Personalización

### Colores
Los colores siguen el tema de Material-UI:
- Verde: `success`
- Rojo: `error` 
- Amarillo: `warning`
- Azul: `info`

### Posición
Las notificaciones aparecen en `position: fixed, top: 16px, right: 16px` con `z-index: 9999`.

### Animaciones
Se usan componentes `Slide` de Material-UI para las transiciones.
