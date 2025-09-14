import React from 'react';
import {
  Box,
  Alert,
  AlertTitle,
  IconButton,
  Button,
  Stack,
  Slide,
  Collapse,
  Typography,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useNotifications } from '@/contexts/NotificationContext';
import type { NotificationItem, NotificationType } from '../types/notifications';

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return <SuccessIcon />;
    case 'error':
      return <ErrorIcon />;
    case 'warning':
      return <WarningIcon />;
    case 'info':
      return <InfoIcon />;
    default:
      return <InfoIcon />;
  }
};

const getNotificationSeverity = (type: NotificationType): 'success' | 'error' | 'warning' | 'info' => {
  return type;
};

interface NotificationCardProps {
  notification: NotificationItem;
  onClose: (id: string) => void;
}

const NotificationCard: React.FC<NotificationCardProps> = ({ notification, onClose }) => {
  const { id, type, title, message, actions } = notification;

  return (
    <Slide direction="down" in={true} mountOnEnter unmountOnExit>
      <Alert
        severity={getNotificationSeverity(type)}
        icon={getNotificationIcon(type)}
        action={
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={() => onClose(id)}
          >
            <CloseIcon fontSize="inherit" />
          </IconButton>
        }
        sx={{
          mb: 1,
          minWidth: 400,
          maxWidth: 600,
          boxShadow: 3,
          '& .MuiAlert-message': {
            width: '100%',
          },
        }}
      >
        <AlertTitle sx={{ fontWeight: 'bold' }}>{title}</AlertTitle>
        <Typography variant="body2" sx={{ mb: actions && actions.length > 0 ? 1 : 0 }}>
          {message}
        </Typography>
        
        {actions && actions.length > 0 && (
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            {actions.map((action, index) => (
              <Button
                key={index}
                size="small"
                variant={action.variant || 'text'}
                color={action.color || 'inherit'}
                onClick={() => {
                  action.onClick();
                  onClose(id); // Cerrar notificación después de ejecutar la acción
                }}
              >
                {action.label}
              </Button>
            ))}
          </Stack>
        )}
      </Alert>
    </Slide>
  );
};

const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 9999,
        maxHeight: 'calc(100vh - 32px)',
        overflow: 'auto',
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '3px',
        },
      }}
    >
      <Stack spacing={1}>
        {notifications.map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            onClose={removeNotification}
          />
        ))}
      </Stack>
    </Box>
  );
};

export default NotificationContainer;
