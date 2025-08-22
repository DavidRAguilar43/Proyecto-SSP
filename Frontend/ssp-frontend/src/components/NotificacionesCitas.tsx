import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Badge
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Notifications as NotificationsIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { citasApi } from '@/services/api';
import type { NotificacionCita } from '../types/index';

interface NotificacionesCitasProps {
  open: boolean;
  onClose: () => void;
  onBadgeUpdate?: (count: number) => void;
}

const NotificacionesCitas: React.FC<NotificacionesCitasProps> = ({ 
  open, 
  onClose, 
  onBadgeUpdate 
}) => {
  const [notificaciones, setNotificaciones] = useState<NotificacionCita[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadNotificaciones();
    }
  }, [open]);

  const loadNotificaciones = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await citasApi.getNotificaciones();
      setNotificaciones(data);
      
      // Actualizar badge
      if (onBadgeUpdate) {
        onBadgeUpdate(data.length);
      }
    } catch (error: any) {
      console.error('Error loading notificaciones:', error);
      setError(error.response?.data?.detail || 'Error al cargar las notificaciones');
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (tipo: string) => {
    switch (tipo) {
      case 'cita_confirmada':
        return <CheckCircleIcon color="success" />;
      case 'cita_cancelada':
        return <CancelIcon color="error" />;
      default:
        return <ScheduleIcon color="primary" />;
    }
  };

  const getNotificationColor = (tipo: string): 'success' | 'error' | 'info' => {
    switch (tipo) {
      case 'cita_confirmada':
        return 'success';
      case 'cita_cancelada':
        return 'error';
      default:
        return 'info';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es });
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <IconButton 
            onClick={onClose} 
            sx={{ mr: 1 }}
            aria-label="Cerrar"
          >
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h5" component="div">
              Notificaciones de Citas
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Actualizaciones sobre tus solicitudes de citas
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && notificaciones.length === 0 && (
          <Alert severity="info">
            No tienes notificaciones de citas en este momento.
          </Alert>
        )}

        {!loading && !error && notificaciones.length > 0 && (
          <Box>
            {notificaciones.map((notificacion) => (
              <Card key={notificacion.id_cita} sx={{ mb: 2 }}>
                <CardContent>
                  <Box display="flex" alignItems="flex-start" mb={2}>
                    <Box sx={{ mr: 2, mt: 0.5 }}>
                      {getNotificationIcon(notificacion.tipo_notificacion)}
                    </Box>
                    <Box flex={1}>
                      <Typography variant="h6" gutterBottom>
                        {notificacion.tipo_notificacion === 'cita_confirmada' 
                          ? '✅ Cita Confirmada' 
                          : '❌ Cita Cancelada'
                        }
                      </Typography>
                      
                      <Alert 
                        severity={getNotificationColor(notificacion.tipo_notificacion)} 
                        sx={{ mb: 2 }}
                      >
                        {notificacion.mensaje}
                      </Alert>

                      <List dense>
                        {notificacion.fecha_cita && (
                          <ListItem disablePadding>
                            <ListItemIcon>
                              <CalendarIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText 
                              primary="Fecha de la cita"
                              secondary={formatDate(notificacion.fecha_cita)}
                            />
                          </ListItem>
                        )}

                        {notificacion.ubicacion && (
                          <ListItem disablePadding>
                            <ListItemIcon>
                              <LocationIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText 
                              primary="Ubicación"
                              secondary={notificacion.ubicacion}
                            />
                          </ListItem>
                        )}

                        {notificacion.personal_nombre && (
                          <ListItem disablePadding>
                            <ListItemIcon>
                              <PersonIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText 
                              primary="Personal asignado"
                              secondary={notificacion.personal_nombre}
                            />
                          </ListItem>
                        )}
                      </List>

                      {notificacion.tipo_notificacion === 'cita_confirmada' && (
                        <Alert severity="success" sx={{ mt: 2 }}>
                          <Typography variant="body2">
                            <strong>¡Importante!</strong> Por favor, asiste puntualmente a tu cita. 
                            Si no puedes asistir, contacta al personal con anticipación.
                          </Typography>
                        </Alert>
                      )}

                      {notificacion.tipo_notificacion === 'cita_cancelada' && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                          <Typography variant="body2">
                            Puedes solicitar una nueva cita desde tu dashboard cuando lo necesites.
                          </Typography>
                        </Alert>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NotificacionesCitas;
