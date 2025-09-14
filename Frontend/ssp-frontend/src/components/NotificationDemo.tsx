import React from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Grid,
  Stack,
  Divider,
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useNotification } from '@/hooks/useNotification';

const NotificationDemo: React.FC = () => {
  const {
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
    notifySaveSuccess,
    notifyDeleteSuccess,
    notifyUpdateSuccess,
    notifyValidationError,
    notifyNetworkError,
    notifyPermissionError,
    notifyWithConfirmation,
    notifyLoading,
    clearAllNotifications,
    removeNotification,
  } = useNotification();

  const handleBasicNotifications = () => {
    notifySuccess('Operación exitosa', 'La operación se completó correctamente.');
    
    setTimeout(() => {
      notifyError('Error encontrado', 'Hubo un problema al procesar la solicitud.');
    }, 500);
    
    setTimeout(() => {
      notifyWarning('Advertencia importante', 'Por favor, revise la información antes de continuar.');
    }, 1000);
    
    setTimeout(() => {
      notifyInfo('Información útil', 'Esta es una notificación informativa.');
    }, 1500);
  };

  const handleSpecificNotifications = () => {
    notifySaveSuccess('usuario');
    
    setTimeout(() => {
      notifyDeleteSuccess('documento');
    }, 500);
    
    setTimeout(() => {
      notifyUpdateSuccess('perfil');
    }, 1000);
  };

  const handleErrorNotifications = () => {
    notifyValidationError('Los campos nombre y email son obligatorios.');
    
    setTimeout(() => {
      notifyNetworkError();
    }, 500);
    
    setTimeout(() => {
      notifyPermissionError();
    }, 1000);
  };

  const handleConfirmationNotification = () => {
    notifyWithConfirmation(
      'Confirmar eliminación',
      '¿Está seguro de que desea eliminar este elemento? Esta acción no se puede deshacer.',
      () => {
        notifySuccess('Eliminado', 'El elemento ha sido eliminado correctamente.');
      },
      'Eliminar',
      'Cancelar'
    );
  };

  const handleLoadingNotification = () => {
    const loadingId = notifyLoading('Procesando datos, por favor espere...');
    
    // Simular proceso que toma tiempo
    setTimeout(() => {
      removeNotification(loadingId);
      notifySuccess('Proceso completado', 'Los datos se han procesado correctamente.');
    }, 3000);
  };

  const handleCustomNotification = () => {
    notifyInfo(
      'Notificación personalizada',
      'Esta notificación tiene acciones personalizadas.',
      {
        duration: 10000,
        actions: [
          {
            label: 'Ver detalles',
            onClick: () => notifyInfo('Detalles', 'Aquí están los detalles solicitados.'),
            variant: 'outlined',
            color: 'primary',
          },
          {
            label: 'Descartar',
            onClick: () => {},
            variant: 'text',
          },
        ],
      }
    );
  };

  return (
    <Paper sx={{ p: 3, m: 2 }}>
      <Typography variant="h4" gutterBottom>
        Sistema de Notificaciones - Demo
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Prueba los diferentes tipos de notificaciones disponibles en el sistema.
        Las notificaciones aparecen en la esquina superior derecha y se cierran automáticamente después de 5 segundos.
      </Typography>

      <Grid container spacing={3}>
        {/* Notificaciones Básicas */}
        <Grid item xs={12} md={6}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Notificaciones Básicas
            </Typography>
            <Stack spacing={2}>
              <Button
                variant="contained"
                color="success"
                startIcon={<SuccessIcon />}
                onClick={() => notifySuccess('¡Éxito!', 'Operación completada correctamente.')}
                fullWidth
              >
                Notificación de Éxito
              </Button>
              
              <Button
                variant="contained"
                color="error"
                startIcon={<ErrorIcon />}
                onClick={() => notifyError('Error', 'Algo salió mal en la operación.')}
                fullWidth
              >
                Notificación de Error
              </Button>
              
              <Button
                variant="contained"
                color="warning"
                startIcon={<WarningIcon />}
                onClick={() => notifyWarning('Advertencia', 'Por favor, revise los datos ingresados.')}
                fullWidth
              >
                Notificación de Advertencia
              </Button>
              
              <Button
                variant="contained"
                color="info"
                startIcon={<InfoIcon />}
                onClick={() => notifyInfo('Información', 'Esta es una notificación informativa.')}
                fullWidth
              >
                Notificación de Información
              </Button>
              
              <Button
                variant="outlined"
                onClick={handleBasicNotifications}
                fullWidth
              >
                Mostrar Todas las Básicas
              </Button>
            </Stack>
          </Box>
        </Grid>

        {/* Notificaciones Específicas */}
        <Grid item xs={12} md={6}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Notificaciones Específicas
            </Typography>
            <Stack spacing={2}>
              <Button
                variant="outlined"
                onClick={handleSpecificNotifications}
                fullWidth
              >
                Operaciones CRUD
              </Button>
              
              <Button
                variant="outlined"
                onClick={handleErrorNotifications}
                fullWidth
              >
                Errores Comunes
              </Button>
              
              <Button
                variant="outlined"
                onClick={handleConfirmationNotification}
                fullWidth
              >
                Confirmación
              </Button>
              
              <Button
                variant="outlined"
                onClick={handleLoadingNotification}
                fullWidth
              >
                Proceso con Carga
              </Button>
              
              <Button
                variant="outlined"
                onClick={handleCustomNotification}
                fullWidth
              >
                Notificación Personalizada
              </Button>
            </Stack>
          </Box>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Controles */}
      <Box>
        <Typography variant="h6" gutterBottom>
          Controles
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            color="error"
            onClick={clearAllNotifications}
          >
            Limpiar Todas las Notificaciones
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
};

export default NotificationDemo;
