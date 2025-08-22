import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Badge,
  IconButton
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Psychology as PsychologyIcon,
  School as SchoolIcon,
  Help as HelpIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';
import { citasApi } from '@/services/api';
import type { SolicitudCita, CitaUpdate, EstadoCita, TipoCita } from '../types/index';

interface SolicitudesCitasProps {
  onBadgeUpdate?: (count: number) => void;
}

const SolicitudesCitas: React.FC<SolicitudesCitasProps> = ({ onBadgeUpdate }) => {
  const [solicitudes, setSolicitudes] = useState<SolicitudCita[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudCita | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmData, setConfirmData] = useState<CitaUpdate>({
    estado: 'confirmada',
    fecha_confirmada: '',
    observaciones_personal: '',
    ubicacion: ''
  });
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    loadSolicitudes();
  }, []);

  const loadSolicitudes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await citasApi.getSolicitudes();
      setSolicitudes(data);
      
      // Actualizar badge con solicitudes pendientes
      const pendientes = data.filter(s => s.estado === 'pendiente').length;
      if (onBadgeUpdate) {
        onBadgeUpdate(pendientes);
      }
    } catch (error: any) {
      console.error('Error loading solicitudes:', error);
      setError(error.response?.data?.detail || 'Error al cargar las solicitudes');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmarCita = (solicitud: SolicitudCita) => {
    setSelectedSolicitud(solicitud);
    setConfirmData({
      estado: 'confirmada',
      fecha_confirmada: solicitud.fecha_propuesta_alumno || '',
      observaciones_personal: '',
      ubicacion: 'Oficina de Servicios Estudiantiles'
    });
    setConfirmDialogOpen(true);
  };

  const handleCancelarCita = async (solicitud: SolicitudCita) => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar esta cita?')) {
      return;
    }

    try {
      setLoading(true);
      await citasApi.confirmar(solicitud.id_cita, {
        estado: 'cancelada',
        observaciones_personal: 'Cita cancelada por el personal'
      });
      
      await loadSolicitudes();
      alert('Cita cancelada exitosamente');
    } catch (error: any) {
      console.error('Error cancelando cita:', error);
      alert(error.response?.data?.detail || 'Error al cancelar la cita');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitConfirmacion = async () => {
    if (!selectedSolicitud) return;

    try {
      setConfirmLoading(true);
      await citasApi.confirmar(selectedSolicitud.id_cita, {
        ...confirmData,
        fecha_confirmada: confirmData.fecha_confirmada 
          ? new Date(confirmData.fecha_confirmada).toISOString()
          : undefined
      });
      
      setConfirmDialogOpen(false);
      setSelectedSolicitud(null);
      await loadSolicitudes();
      alert('Cita confirmada exitosamente');
    } catch (error: any) {
      console.error('Error confirmando cita:', error);
      alert(error.response?.data?.detail || 'Error al confirmar la cita');
    } finally {
      setConfirmLoading(false);
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

  const solicitudesPendientes = solicitudes.filter(s => s.estado === 'pendiente');
  const solicitudesConfirmadas = solicitudes.filter(s => s.estado === 'confirmada');
  const solicitudesOtras = solicitudes.filter(s => !['pendiente', 'confirmada'].includes(s.estado));

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2">
          Solicitudes de Citas
        </Typography>
        <IconButton onClick={loadSolicitudes} disabled={loading}>
          <RefreshIcon />
        </IconButton>
      </Box>

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

      {!loading && !error && solicitudes.length === 0 && (
        <Alert severity="info">
          No hay solicitudes de citas en este momento.
        </Alert>
      )}

      {!loading && !error && solicitudes.length > 0 && (
        <Box>
          {/* Solicitudes Pendientes */}
          {solicitudesPendientes.length > 0 && (
            <Box mb={4}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Badge badgeContent={solicitudesPendientes.length} color="warning">
                  <ScheduleIcon sx={{ mr: 1 }} />
                </Badge>
                Solicitudes Pendientes
              </Typography>
              
              <Grid container spacing={2}>
                {solicitudesPendientes.map((solicitud) => (
                  <Grid size={{ xs: 12, md: 6 }} key={solicitud.id_cita}>
                    <Card sx={{ border: '2px solid', borderColor: 'warning.main' }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                          <Box display="flex" alignItems="center">
                            {getTipoIcon(solicitud.tipo_cita)}
                            <Typography variant="h6" sx={{ ml: 1 }}>
                              Cita {getTipoLabel(solicitud.tipo_cita)}
                            </Typography>
                          </Box>
                          <Chip 
                            label={getEstadoLabel(solicitud.estado)} 
                            color={getEstadoColor(solicitud.estado)}
                            size="small"
                          />
                        </Box>

                        <Typography variant="body2" sx={{ mb: 2 }}>
                          <strong>Motivo:</strong> {solicitud.motivo}
                        </Typography>

                        <List dense>
                          <ListItem disablePadding>
                            <ListItemIcon>
                              <PersonIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText 
                              primary="Estudiante"
                              secondary={solicitud.alumno_nombre}
                            />
                          </ListItem>

                          <ListItem disablePadding>
                            <ListItemIcon>
                              <EmailIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText 
                              primary="Email"
                              secondary={solicitud.alumno_email}
                            />
                          </ListItem>

                          {solicitud.alumno_celular && (
                            <ListItem disablePadding>
                              <ListItemIcon>
                                <PhoneIcon fontSize="small" />
                              </ListItemIcon>
                              <ListItemText 
                                primary="Celular"
                                secondary={solicitud.alumno_celular}
                              />
                            </ListItem>
                          )}

                          {solicitud.alumno_matricula && (
                            <ListItem disablePadding>
                              <ListItemIcon>
                                <BadgeIcon fontSize="small" />
                              </ListItemIcon>
                              <ListItemText 
                                primary="Matrícula"
                                secondary={solicitud.alumno_matricula}
                              />
                            </ListItem>
                          )}

                          <ListItem disablePadding>
                            <ListItemIcon>
                              <CalendarIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText 
                              primary="Fecha de solicitud"
                              secondary={formatDate(solicitud.fecha_solicitud)}
                            />
                          </ListItem>

                          {solicitud.fecha_propuesta_alumno && (
                            <ListItem disablePadding>
                              <ListItemIcon>
                                <ScheduleIcon fontSize="small" />
                              </ListItemIcon>
                              <ListItemText 
                                primary="Fecha preferida"
                                secondary={formatDate(solicitud.fecha_propuesta_alumno)}
                              />
                            </ListItem>
                          )}
                        </List>

                        {solicitud.observaciones_alumno && (
                          <>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="body2" color="text.secondary">
                              <strong>Observaciones del estudiante:</strong> {solicitud.observaciones_alumno}
                            </Typography>
                          </>
                        )}

                        <Box display="flex" gap={1} mt={2}>
                          <Button
                            variant="contained"
                            color="success"
                            startIcon={<CheckIcon />}
                            onClick={() => handleConfirmarCita(solicitud)}
                            size="small"
                            fullWidth
                          >
                            Confirmar
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            startIcon={<CloseIcon />}
                            onClick={() => handleCancelarCita(solicitud)}
                            size="small"
                            fullWidth
                          >
                            Cancelar
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Citas Confirmadas */}
          {solicitudesConfirmadas.length > 0 && (
            <Box mb={4}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckIcon sx={{ mr: 1, color: 'success.main' }} />
                Citas Confirmadas ({solicitudesConfirmadas.length})
              </Typography>
              
              <Grid container spacing={2}>
                {solicitudesConfirmadas.map((solicitud) => (
                  <Grid size={{ xs: 12, md: 6 }} key={solicitud.id_cita}>
                    <Card>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                          <Box display="flex" alignItems="center">
                            {getTipoIcon(solicitud.tipo_cita)}
                            <Typography variant="h6" sx={{ ml: 1 }}>
                              {solicitud.alumno_nombre}
                            </Typography>
                          </Box>
                          <Chip 
                            label={getEstadoLabel(solicitud.estado)} 
                            color={getEstadoColor(solicitud.estado)}
                            size="small"
                          />
                        </Box>

                        <Typography variant="body2" color="text.secondary">
                          Cita {getTipoLabel(solicitud.tipo_cita)} • {solicitud.alumno_email}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Box>
      )}

      {/* Dialog de Confirmación */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Confirmar Cita - {selectedSolicitud?.alumno_nombre}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
              <DateTimePicker
                label="Fecha y Hora de la Cita"
                value={confirmData.fecha_confirmada ? new Date(confirmData.fecha_confirmada) : null}
                onChange={(newValue) => setConfirmData(prev => ({
                  ...prev,
                  fecha_confirmada: newValue?.toISOString() || ''
                }))}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    sx: { mb: 3 }
                  }
                }}
                minDateTime={new Date()}
              />
            </LocalizationProvider>

            <TextField
              fullWidth
              label="Ubicación"
              value={confirmData.ubicacion}
              onChange={(e) => setConfirmData(prev => ({
                ...prev,
                ubicacion: e.target.value
              }))}
              sx={{ mb: 3 }}
              placeholder="Ej: Oficina de Servicios Estudiantiles, Cubículo 3"
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Observaciones (Opcional)"
              value={confirmData.observaciones_personal}
              onChange={(e) => setConfirmData(prev => ({
                ...prev,
                observaciones_personal: e.target.value
              }))}
              placeholder="Información adicional sobre la cita..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} disabled={confirmLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmitConfirmacion}
            disabled={confirmLoading || !confirmData.fecha_confirmada}
            variant="contained"
            startIcon={confirmLoading ? <CircularProgress size={20} /> : <CheckIcon />}
          >
            {confirmLoading ? 'Confirmando...' : 'Confirmar Cita'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SolicitudesCitas;
