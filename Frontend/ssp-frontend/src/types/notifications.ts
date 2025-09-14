// Tipos para el sistema de notificaciones
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

// Interfaz para acciones en notificaciones
export interface NotificationAction {
  label: string;
  onClick: () => void;
  variant?: 'text' | 'outlined' | 'contained';
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
}

// Interfaz principal para notificaciones
export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number; // en milisegundos, por defecto 5000
  autoClose?: boolean; // por defecto true
  actions?: NotificationAction[];
}

// Interfaz para el contexto de notificaciones
export interface NotificationContextType {
  notifications: NotificationItem[];
  addNotification: (notification: Omit<NotificationItem, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  showSuccess: (title: string, message: string, options?: Partial<NotificationItem>) => string;
  showError: (title: string, message: string, options?: Partial<NotificationItem>) => string;
  showWarning: (title: string, message: string, options?: Partial<NotificationItem>) => string;
  showInfo: (title: string, message: string, options?: Partial<NotificationItem>) => string;
}

// Exportación por defecto para forzar recarga
export default {
  NotificationItem,
  NotificationAction,
  NotificationContextType,
  NotificationType
};
