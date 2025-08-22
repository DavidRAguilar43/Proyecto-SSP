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
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Schedule as ScheduleIcon,
  Psychology as PsychologyIcon,
  School as SchoolIcon,
  Help as HelpIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { citasApi } from '@/services/api';
import type { Cita, TipoCita, EstadoCita } from '../types/index';

interface MisCitasProps {
  open: boolean;
  onClose: () => void;
}

const MisCitas: React.FC<MisCitasProps> = ({ open, onClose }) => {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadCitas();
    }
  }, [open]);

  const loadCitas = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await citasApi.getMisCitas();
      setCitas(data);
    } catch (error: any) {
      console.error('Error loading citas:', error);
      setError(error.response?.data?.detail || 'Error al cargar las citas');
    } finally {
      setLoading(false);
    }
  };

  const getTipoIcon = (tipo: TipoCita) => {
    switch (tipo) {
      case 'psicologica':
        return <PsychologyIcon color="secondary" />;
      case 'academica':
        return <SchoolIcon color="primary" />;
      default:
        return <HelpIcon color="action" />;
    }
  };

  const getTipoLabel = (tipo: TipoCita) => {
    switch (tipo) {
      case 'psicologica':
        return 'Psicológica';
      case 'academica':
        return 'Académica';
      default:
        return 'General';
    }
  };

  const getEstadoColor = (estado: EstadoCita): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (estado) {
      case 'pendiente':
        return 'warning';
      case 'confirmada':
        return 'success';
      case 'cancelada':
        return 'error';
      case 'completada':
        return 'info';
      default:
        return 'default';
    }
  };

  const getEstadoLabel = (estado: EstadoCita) => {
    switch (estado) {
      case 'pendiente':
        return 'Pendiente';
      case 'confirmada':
        return 'Confirmada';
      case 'cancelada':
        return 'Cancelada';
      case 'completada':
        return 'Completada';
      default:
        return estado;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es });
    } catch {
      return dateString;
    }
  };

  const formatDateShort = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: es });
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
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
              Mis Citas
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Historial de tus solicitudes de citas con el personal
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

        {!loading && !error && citas.length === 0 && (
          <Alert severity="info">
            No tienes citas solicitadas. ¡Solicita tu primera cita para recibir apoyo del personal!
          </Alert>
        )}

        {!loading && !error && citas.length > 0 && (
          <Box>
            {citas.map((cita) => (
              <Card key={cita.id_cita} sx={{ mb: 2 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box display="flex" alignItems="center">
                      {getTipoIcon(cita.tipo_cita)}
                      <Typography variant="h6" sx={{ ml: 1 }}>
                        Cita {getTipoLabel(cita.tipo_cita)}
                      </Typography>
                    </Box>
                    <Chip 
                      label={getEstadoLabel(cita.estado)} 
                      color={getEstadoColor(cita.estado)}
                      size="small"
                    />
                  </Box>

                  <Typography variant="body1" sx={{ mb: 2 }}>
                    <strong>Motivo:</strong> {cita.motivo}
                  </Typography>

                  <List dense>
                    <ListItem disablePadding>
                      <ListItemIcon>
                        <CalendarIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Fecha de solicitud"
                        secondary={formatDate(cita.fecha_solicitud)}
                      />
                    </ListItem>

                    {cita.fecha_propuesta_alumno && (
                      <ListItem disablePadding>
                        <ListItemIcon>
                          <TimeIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Fecha preferida"
                          secondary={formatDate(cita.fecha_propuesta_alumno)}
                        />
                      </ListItem>
                    )}

                    {cita.fecha_confirmada && (
                      <ListItem disablePadding>
                        <ListItemIcon>
                          <ScheduleIcon fontSize="small" color="success" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Fecha confirmada"
                          secondary={formatDate(cita.fecha_confirmada)}
                        />
                      </ListItem>
                    )}

                    {cita.personal_nombre && (
                      <ListItem disablePadding>
                        <ListItemIcon>
                          <PersonIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Personal asignado"
                          secondary={cita.personal_nombre}
                        />
                      </ListItem>
                    )}

                    {cita.ubicacion && (
                      <ListItem disablePadding>
                        <ListItemIcon>
                          <LocationIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Ubicación"
                          secondary={cita.ubicacion}
                        />
                      </ListItem>
                    )}
                  </List>

                  {cita.observaciones_alumno && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="body2" color="text.secondary">
                        <strong>Tus observaciones:</strong> {cita.observaciones_alumno}
                      </Typography>
                    </>
                  )}

                  {cita.observaciones_personal && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="body2" color="text.secondary">
                        <strong>Observaciones del personal:</strong> {cita.observaciones_personal}
                      </Typography>
                    </>
                  )}
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

export default MisCitas;
