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
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  NotificationImportant as NotificationImportantIcon
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';
import { citasApi } from '@/services/api';
import type { SolicitudCita, CitaUpdate, EstadoCita, TipoCita } from '../types/index';
import { useNotification } from '@/hooks/useNotification';
import ConfirmDialog from './ConfirmDialog';

interface SolicitudesCitasProps {
  onBadgeUpdate?: (count: number) => void;
}

const SolicitudesCitas: React.FC<SolicitudesCitasProps> = ({ onBadgeUpdate }) => {
  // Hook para notificaciones
  const { notifySuccess, notifyError } = useNotification();

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

  // Estados para diálogo de confirmación de cancelación
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [solicitudToCancel, setSolicitudToCancel] = useState<SolicitudCita | null>(null);

  // Estado para diálogo de detalles de cita confirmada
  const [detallesDialogOpen, setDetallesDialogOpen] = useState(false);
  const [citaDetalles, setCitaDetalles] = useState<SolicitudCita | null>(null);

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

  const handleCancelarCita = (solicitud: SolicitudCita) => {
    setSolicitudToCancel(solicitud);
    setCancelConfirmOpen(true);
  };

  const confirmCancelCita = async () => {
    if (!solicitudToCancel) return;

    try {
      setLoading(true);
      await citasApi.confirmar(solicitudToCancel.id_cita, {
        estado: 'cancelada',
        observaciones_personal: 'Cita cancelada por el personal'
      });

      await loadSolicitudes();
      notifySuccess('Cita cancelada exitosamente');
    } catch (error: any) {
      console.error('Error cancelando cita:', error);
      notifyError(error.response?.data?.detail || 'Error al cancelar la cita');
    } finally {
      setLoading(false);
      setCancelConfirmOpen(false);
      setSolicitudToCancel(null);
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
      notifySuccess('Cita confirmada exitosamente');
    } catch (error: any) {
      console.error('Error confirmando cita:', error);
      notifyError(error.response?.data?.detail || 'Error al confirmar la cita');
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

  const getTipoColor = (tipo: TipoCita) => {
    switch (tipo) {
      case 'psicologica':
        return {
          bg: 'rgba(156, 39, 176, 0.08)', // Morado claro
          border: '#9c27b0'
        };
      case 'academica':
        return {
          bg: 'rgba(33, 150, 243, 0.08)', // Azul claro
          border: '#2196f3'
        };
      default:
        return {
          bg: 'rgba(158, 158, 158, 0.08)', // Gris claro
          border: '#9e9e9e'
        };
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
                {solicitudesConfirmadas.map((solicitud) => {
                  const tipoColor = getTipoColor(solicitud.tipo_cita);
                  return (
                    <Grid size={{ xs: 12, md: 6 }} key={solicitud.id_cita}>
                      <Card
                        sx={{
                          border: '2px solid',
                          borderColor: tipoColor.border,
                          bgcolor: tipoColor.bg,
                          position: 'relative',
                          '&:hover': {
                            boxShadow: 4,
                            transform: 'translateY(-2px)',
                            transition: 'all 0.3s ease'
                          }
                        }}
                      >
                        <CardContent>
                          {/* Icono de atención en la esquina superior derecha */}
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 8,
                              right: 8
                            }}
                          >
                            <NotificationImportantIcon
                              sx={{
                                color: tipoColor.border,
                                fontSize: 28
                              }}
                            />
                          </Box>

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

                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Cita {getTipoLabel(solicitud.tipo_cita)} • {solicitud.alumno_email}
                          </Typography>

                          {solicitud.fecha_confirmada && (
                            <Box display="flex" alignItems="center" mb={1}>
                              <CalendarIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {format(new Date(solicitud.fecha_confirmada), "dd/MM/yyyy HH:mm", { locale: es })}
                              </Typography>
                            </Box>
                          )}

                          {solicitud.ubicacion && (
                            <Box display="flex" alignItems="center" mb={2}>
                              <LocationIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {solicitud.ubicacion}
                              </Typography>
                            </Box>
                          )}

                          {/* Botón Ver */}
                          <Button
                            fullWidth
                            variant="contained"
                            startIcon={<VisibilityIcon />}
                            onClick={() => {
                              setCitaDetalles(solicitud);
                              setDetallesDialogOpen(true);
                            }}
                            sx={{
                              bgcolor: tipoColor.border,
                              '&:hover': {
                                bgcolor: tipoColor.border,
                                filter: 'brightness(0.9)'
                              }
                            }}
                          >
                            Ver Detalles
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
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

      {/* Diálogo de confirmación para cancelar cita */}
      <ConfirmDialog
        open={cancelConfirmOpen}
        title="Confirmar cancelación"
        message="¿Estás seguro de que deseas cancelar esta cita? Esta acción no se puede deshacer."
        onConfirm={confirmCancelCita}
        onCancel={() => {
          setCancelConfirmOpen(false);
          setSolicitudToCancel(null);
        }}
        confirmText="Sí, Cancelar"
        cancelText="No, Mantener"
        severity="warning"
        loading={loading}
      />

      {/* Diálogo de detalles de cita confirmada */}
      <Dialog
        open={detallesDialogOpen}
        onClose={() => {
          setDetallesDialogOpen(false);
          setCitaDetalles(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: citaDetalles ? getTipoColor(citaDetalles.tipo_cita).bg : 'transparent' }}>
          <Box display="flex" alignItems="center">
            {citaDetalles && getTipoIcon(citaDetalles.tipo_cita)}
            <Typography variant="h6" sx={{ ml: 1 }}>
              Detalles de la Cita
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {citaDetalles && (
            <Box sx={{ mt: 2 }}>
              {/* Información del alumno */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Información del Alumno
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Box display="flex" alignItems="center" mb={1}>
                  <PersonIcon sx={{ fontSize: 20, mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body1">
                    <strong>Nombre:</strong> {citaDetalles.alumno_nombre}
                  </Typography>
                </Box>

                <Box display="flex" alignItems="center" mb={1}>
                  <EmailIcon sx={{ fontSize: 20, mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body1">
                    <strong>Email:</strong> {citaDetalles.alumno_email}
                  </Typography>
                </Box>

                {citaDetalles.alumno_telefono && (
                  <Box display="flex" alignItems="center" mb={1}>
                    <PhoneIcon sx={{ fontSize: 20, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body1">
                      <strong>Teléfono:</strong> {citaDetalles.alumno_telefono}
                    </Typography>
                  </Box>
                )}

                {citaDetalles.alumno_matricula && (
                  <Box display="flex" alignItems="center">
                    <BadgeIcon sx={{ fontSize: 20, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body1">
                      <strong>Matrícula:</strong> {citaDetalles.alumno_matricula}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Información de la cita */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Información de la Cita
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    Tipo de Cita
                  </Typography>
                  <Chip
                    label={getTipoLabel(citaDetalles.tipo_cita)}
                    color="primary"
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    Estado
                  </Typography>
                  <Chip
                    label={getEstadoLabel(citaDetalles.estado)}
                    color={getEstadoColor(citaDetalles.estado)}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Box>

                {citaDetalles.fecha_confirmada && (
                  <Box display="flex" alignItems="center" mb={2}>
                    <CalendarIcon sx={{ fontSize: 20, mr: 1, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Fecha y Hora
                      </Typography>
                      <Typography variant="body1">
                        {format(new Date(citaDetalles.fecha_confirmada), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {citaDetalles.ubicacion && (
                  <Box display="flex" alignItems="center" mb={2}>
                    <LocationIcon sx={{ fontSize: 20, mr: 1, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Ubicación
                      </Typography>
                      <Typography variant="body1">
                        {citaDetalles.ubicacion}
                      </Typography>
                    </Box>
                  </Box>
                )}

                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Motivo
                  </Typography>
                  <Typography variant="body1">
                    {citaDetalles.motivo}
                  </Typography>
                </Box>

                {citaDetalles.observaciones_personal && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Observaciones del Personal
                    </Typography>
                    <Typography variant="body1">
                      {citaDetalles.observaciones_personal}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDetallesDialogOpen(false);
              setCitaDetalles(null);
            }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SolicitudesCitas;
