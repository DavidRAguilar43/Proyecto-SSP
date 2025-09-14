import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { NotificationItem, NotificationContextType } from '../types/notifications';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const generateId = useCallback(() => {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const addNotification = useCallback((notification: Omit<NotificationItem, 'id'>) => {
    const id = generateId();
    const newNotification: NotificationItem = {
      id,
      duration: 5000,
      autoClose: true,
      ...notification,
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove notification if autoClose is true
    if (newNotification.autoClose && newNotification.duration) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, [generateId]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const showSuccess = useCallback((title: string, message: string, options?: Partial<NotificationItem>) => {
    return addNotification({
      type: 'success',
      title,
      message,
      ...options,
    });
  }, [addNotification]);

  const showError = useCallback((title: string, message: string, options?: Partial<NotificationItem>) => {
    return addNotification({
      type: 'error',
      title,
      message,
      duration: 7000, // Errores duran más tiempo por defecto
      ...options,
    });
  }, [addNotification]);

  const showWarning = useCallback((title: string, message: string, options?: Partial<NotificationItem>) => {
    return addNotification({
      type: 'warning',
      title,
      message,
      duration: 6000, // Advertencias duran un poco más
      ...options,
    });
  }, [addNotification]);

  const showInfo = useCallback((title: string, message: string, options?: Partial<NotificationItem>) => {
    return addNotification({
      type: 'info',
      title,
      message,
      ...options,
    });
  }, [addNotification]);

  const value: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
