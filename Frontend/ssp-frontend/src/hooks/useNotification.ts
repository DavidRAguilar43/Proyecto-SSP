import { useNotifications } from '@/contexts/NotificationContext';
import type { NotificationItem } from '../types/notifications';

/**
 * Hook personalizado para facilitar el uso de notificaciones
 * Proporciona métodos convenientes para mostrar diferentes tipos de notificaciones
 */
export const useNotification = () => {
  const { showSuccess, showError, showWarning, showInfo, addNotification, removeNotification, clearAllNotifications } = useNotifications();

  // Métodos de conveniencia para casos comunes
  const notifySuccess = (message: string, title: string = 'Éxito') => {
    return showSuccess(title, message);
  };

  const notifyError = (message: string, title: string = 'Error') => {
    return showError(title, message);
  };

  const notifyWarning = (message: string, title: string = 'Advertencia') => {
    return showWarning(title, message);
  };

  const notifyInfo = (message: string, title: string = 'Información') => {
    return showInfo(title, message);
  };

  // Métodos específicos para operaciones comunes
  const notifySaveSuccess = (entity: string = 'elemento') => {
    return showSuccess('Guardado exitoso', `El ${entity} se ha guardado correctamente.`);
  };

  const notifyDeleteSuccess = (entity: string = 'elemento') => {
    return showSuccess('Eliminado exitoso', `El ${entity} se ha eliminado correctamente.`);
  };

  const notifyUpdateSuccess = (entity: string = 'elemento') => {
    return showSuccess('Actualización exitosa', `El ${entity} se ha actualizado correctamente.`);
  };

  const notifyValidationError = (message: string = 'Por favor, revise los datos ingresados.') => {
    return showError('Error de validación', message);
  };

  const notifyNetworkError = (message: string = 'No se pudo conectar con el servidor. Inténtelo más tarde.') => {
    return showError('Error de conexión', message);
  };

  const notifyPermissionError = (message: string = 'No tiene permisos para realizar esta acción.') => {
    return showError('Sin permisos', message);
  };

  // Notificación con confirmación
  const notifyWithConfirmation = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText: string = 'Confirmar',
    cancelText: string = 'Cancelar'
  ) => {
    return addNotification({
      type: 'warning',
      title,
      message,
      autoClose: false,
      actions: [
        {
          label: cancelText,
          onClick: () => {},
          variant: 'outlined',
        },
        {
          label: confirmText,
          onClick: onConfirm,
          variant: 'contained',
          color: 'warning',
        },
      ],
    });
  };

  // Notificación de carga/progreso
  const notifyLoading = (message: string, title: string = 'Procesando...') => {
    return addNotification({
      type: 'info',
      title,
      message,
      autoClose: false,
    });
  };

  return {
    // Métodos básicos
    showSuccess,
    showError,
    showWarning,
    showInfo,
    addNotification,
    removeNotification,
    clearAllNotifications,

    // Métodos de conveniencia
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,

    // Métodos específicos
    notifySaveSuccess,
    notifyDeleteSuccess,
    notifyUpdateSuccess,
    notifyValidationError,
    notifyNetworkError,
    notifyPermissionError,
    notifyWithConfirmation,
    notifyLoading,
  };
};
