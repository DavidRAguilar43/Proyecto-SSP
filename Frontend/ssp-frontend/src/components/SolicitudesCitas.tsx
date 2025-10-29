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
  IconButton,
  Tabs,
  Tab,
  Collapse
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
  NotificationImportant as NotificationImportantIcon,
  Today as TodayIcon,
  History as HistoryIcon,
  HourglassEmpty as HourglassEmptyIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  EventAvailable as EventAvailableIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
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

  // Estado para filtro de pestañas temporales
  type FiltroTemporal = 'todas' | 'hoy' | 'confirmadas' | 'pasadas' | 'pendientes' | 'revision' | 'canceladas';
  const [filtroTemporal, setFiltroTemporal] = useState<FiltroTemporal>('todas');

  // Estados para colapsar secciones (empiezan colapsadas)
  const [pendientesExpanded, setPendientesExpanded] = useState(false);
  const [confirmadasExpanded, setConfirmadasExpanded] = useState(false);
  const [otrasExpanded, setOtrasExpanded] = useState(false);

  // Estado para controlar qué textos están expandidos (por id de cita)
  const [expandedTexts, setExpandedTexts] = useState<Record<string | number, boolean>>({});

  // Estado para controlar qué detalles de estudiante están expandidos (empiezan colapsados)
  const [expandedDetails, setExpandedDetails] = useState<Record<string | number, boolean>>({});

  // Función para alternar el estado de un texto
  const toggleText = (citaId: string | number) => {
    setExpandedTexts(prev => ({
      ...prev,
      [citaId]: !prev[citaId]
    }));
  };

  // Función para alternar el estado de detalles de estudiante
  const toggleDetails = (citaId: string | number) => {
    setExpandedDetails(prev => ({
      ...prev,
      [citaId]: !prev[citaId]
    }));
  };

  // Función para truncar texto
  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  useEffect(() => {
    loadSolicitudes();
  }, []);

  const loadSolicitudes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await citasApi.getSolicitudes();

      // Ordenar por fecha de solicitud descendente (más recientes primero)
      const sortedData = data.sort((a, b) => {
        const dateA = new Date(a.fecha_solicitud).getTime();
        const dateB = new Date(b.fecha_solicitud).getTime();
        return dateB - dateA; // Orden descendente
      });

      // Limitar a las últimas 5 citas para el dashboard
      const last5Citas = sortedData.slice(0, 5);
      setSolicitudes(last5Citas);

      // Actualizar badge con solicitudes pendientes (de todas, no solo las 5)
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

  /**
   * Determina el color de la barra de estado basándose en la fecha y estado de la cita.
   *
   * Lógica de colores:
   * - Verde: La fecha de la cita ya llegó (es hoy o ya pasó) y está confirmada/completada
   * - Rojo: La fecha de la cita ya pasó y NO fue atendida/revisada
   * - Gris: Cita pendiente (la fecha aún no llega, está en el futuro)
   * - Amarillo: La cita ya fue revisada/atendida (completada)
   *
   * Args:
   *     solicitud: Objeto de solicitud de cita con estado y fechas
   *
   * Returns:
   *     string: Color en formato hexadecimal o nombre de color de MUI
   */
  const getBarraEstadoColor = (solicitud: SolicitudCita): string => {
    const ahora = new Date();
    const fechaCita = solicitud.fecha_confirmada
      ? new Date(solicitud.fecha_confirmada)
      : solicitud.fecha_propuesta_alumno
        ? new Date(solicitud.fecha_propuesta_alumno)
        : null;

    // Si la cita está completada (revisada/atendida) -> Amarillo
    if (solicitud.estado === 'completada') {
      return '#FFC107'; // Amarillo (warning.main)
    }

    // Si la cita está cancelada -> No mostrar barra o usar color neutral
    if (solicitud.estado === 'cancelada') {
      return '#9E9E9E'; // Gris
    }

    // Si no hay fecha confirmada ni propuesta, usar gris por defecto
    if (!fechaCita) {
      return '#9E9E9E'; // Gris
    }

    // Normalizar fechas para comparación (solo fecha, sin hora)
    const ahoraFecha = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    const citaFecha = new Date(fechaCita.getFullYear(), fechaCita.getMonth(), fechaCita.getDate());

    // Si la fecha de la cita ya pasó
    if (citaFecha < ahoraFecha) {
      // Si está confirmada o completada -> Verde
      if (solicitud.estado === 'confirmada' || solicitud.estado === 'completada') {
        return '#4CAF50'; // Verde (success.main)
      }
      // Si NO fue atendida (pendiente) -> Rojo
      return '#F44336'; // Rojo (error.main)
    }

    // Si la fecha es hoy
    if (citaFecha.getTime() === ahoraFecha.getTime()) {
      // Si está confirmada -> Verde
      if (solicitud.estado === 'confirmada') {
        return '#4CAF50'; // Verde (success.main)
      }
      // Si está pendiente -> Gris
      return '#9E9E9E'; // Gris
    }

    // Si la fecha está en el futuro -> Gris (pendiente)
    return '#9E9E9E'; // Gris
  };

  /**
   * Determina si una cita es de hoy.
   *
   * Args:
   *     solicitud: Objeto de solicitud de cita
   *
   * Returns:
   *     boolean: true si la cita es de hoy
   */
  const esCitaDeHoy = (solicitud: SolicitudCita): boolean => {
    const fechaCita = solicitud.fecha_confirmada
      ? new Date(solicitud.fecha_confirmada)
      : solicitud.fecha_propuesta_alumno
        ? new Date(solicitud.fecha_propuesta_alumno)
        : null;

    if (!fechaCita) return false;

    const ahora = new Date();
    const ahoraFecha = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    const citaFecha = new Date(fechaCita.getFullYear(), fechaCita.getMonth(), fechaCita.getDate());

    return citaFecha.getTime() === ahoraFecha.getTime();
  };

  /**
   * Determina si una cita ya pasó.
   *
   * Args:
   *     solicitud: Objeto de solicitud de cita
   *
   * Returns:
   *     boolean: true si la fecha de la cita ya pasó
   */
  const esCitaPasada = (solicitud: SolicitudCita): boolean => {
    const fechaCita = solicitud.fecha_confirmada
      ? new Date(solicitud.fecha_confirmada)
      : solicitud.fecha_propuesta_alumno
        ? new Date(solicitud.fecha_propuesta_alumno)
        : null;

    if (!fechaCita) return false;

    const ahora = new Date();
    const ahoraFecha = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    const citaFecha = new Date(fechaCita.getFullYear(), fechaCita.getMonth(), fechaCita.getDate());

    return citaFecha < ahoraFecha;
  };

  /**
   * Determina si una cita está pendiente (fecha futura).
   *
   * Args:
   *     solicitud: Objeto de solicitud de cita
   *
   * Returns:
   *     boolean: true si la fecha de la cita está en el futuro
   */
  const esCitaPendienteFutura = (solicitud: SolicitudCita): boolean => {
    const fechaCita = solicitud.fecha_confirmada
      ? new Date(solicitud.fecha_confirmada)
      : solicitud.fecha_propuesta_alumno
        ? new Date(solicitud.fecha_propuesta_alumno)
        : null;

    if (!fechaCita) return true; // Sin fecha se considera pendiente

    const ahora = new Date();
    const ahoraFecha = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    const citaFecha = new Date(fechaCita.getFullYear(), fechaCita.getMonth(), fechaCita.getDate());

    return citaFecha > ahoraFecha;
  };

  /**
   * Filtra las solicitudes según el filtro temporal seleccionado.
   *
   * Args:
   *     solicitudes: Array de solicitudes de citas
   *
   * Returns:
   *     Array de solicitudes filtradas
   */
  const filtrarPorEstadoTemporal = (solicitudes: SolicitudCita[]): SolicitudCita[] => {
    switch (filtroTemporal) {
      case 'hoy':
        // Solo citas de hoy (sin importar el estado)
        return solicitudes.filter(s => esCitaDeHoy(s));
      case 'confirmadas':
        // Solo citas confirmadas
        return solicitudes.filter(s => s.estado === 'confirmada');
      case 'pasadas':
        return solicitudes.filter(s => esCitaPasada(s) && s.estado !== 'completada');
      case 'pendientes':
        // Solo citas con estado pendiente
        return solicitudes.filter(s => s.estado === 'pendiente');
      case 'revision':
        return solicitudes.filter(s => s.estado === 'completada');
      case 'canceladas':
        return solicitudes.filter(s => s.estado === 'cancelada');
      case 'todas':
      default:
        return solicitudes;
    }
  };

  // Aplicar filtro temporal
  const solicitudesFiltradas = filtrarPorEstadoTemporal(solicitudes);

  // Contadores para las pestañas
  const contadorHoy = solicitudes.filter(s => esCitaDeHoy(s)).length;
  const contadorConfirmadas = solicitudes.filter(s => s.estado === 'confirmada').length;
  const contadorPasadas = solicitudes.filter(s => esCitaPasada(s) && s.estado !== 'completada').length;
  const contadorPendientes = solicitudes.filter(s => s.estado === 'pendiente').length;
  const contadorRevision = solicitudes.filter(s => s.estado === 'completada').length;
  const contadorCanceladas = solicitudes.filter(s => s.estado === 'cancelada').length;

  const solicitudesPendientes = solicitudesFiltradas.filter(s => s.estado === 'pendiente');
  const solicitudesConfirmadas = solicitudesFiltradas.filter(s => s.estado === 'confirmada');
  const solicitudesOtras = solicitudesFiltradas.filter(s => !['pendiente', 'confirmada'].includes(s.estado));

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" component="h2">
            Últimas 5 Solicitudes de Citas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Mostrando las citas más recientes
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => window.location.href = '/citas'}
          >
            Ver Todas
          </Button>
          <IconButton onClick={loadSolicitudes} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Box>
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

      {/* Barra de pestañas/filtros temporales */}
      {!loading && !error && solicitudes.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Tabs
            value={filtroTemporal}
            onChange={(_, newValue) => setFiltroTemporal(newValue as FiltroTemporal)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': {
                minHeight: 64,
                textTransform: 'none',
                fontWeight: 600
              }
            }}
          >
            <Tab
              value="todas"
              label={`Todas (${solicitudes.length})`}
              icon={<CalendarIcon />}
              iconPosition="start"
              sx={{
                '&.Mui-selected': {
                  color: 'primary.main'
                }
              }}
            />
            <Tab
              value="hoy"
              label={`Hoy (${contadorHoy})`}
              icon={<TodayIcon />}
              iconPosition="start"
              sx={{
                color: contadorHoy > 0 ? '#4CAF50' : 'text.secondary',
                '&.Mui-selected': {
                  color: '#4CAF50',
                  fontWeight: 700
                }
              }}
            />
            <Tab
              value="confirmadas"
              label={`Confirmadas (${contadorConfirmadas})`}
              icon={<EventAvailableIcon />}
              iconPosition="start"
              sx={{
                color: contadorConfirmadas > 0 ? '#2196F3' : 'text.secondary',
                '&.Mui-selected': {
                  color: '#2196F3',
                  fontWeight: 700
                }
              }}
            />
            <Tab
              value="pasadas"
              label={`Pasadas (${contadorPasadas})`}
              icon={<HistoryIcon />}
              iconPosition="start"
              sx={{
                color: contadorPasadas > 0 ? '#FF9800' : 'text.secondary',
                '&.Mui-selected': {
                  color: '#FF9800',
                  fontWeight: 700
                }
              }}
            />
            <Tab
              value="pendientes"
              label={`Pendientes (${contadorPendientes})`}
              icon={<HourglassEmptyIcon />}
              iconPosition="start"
              sx={{
                color: contadorPendientes > 0 ? '#9E9E9E' : 'text.secondary',
                '&.Mui-selected': {
                  color: '#9E9E9E',
                  fontWeight: 700
                }
              }}
            />
            <Tab
              value="revision"
              label={`Revisión (${contadorRevision})`}
              icon={<CheckCircleIcon />}
              iconPosition="start"
              sx={{
                color: contadorRevision > 0 ? '#FFC107' : 'text.secondary',
                '&.Mui-selected': {
                  color: '#FFC107',
                  fontWeight: 700
                }
              }}
            />
            <Tab
              value="canceladas"
              label={`Canceladas (${contadorCanceladas})`}
              icon={<CancelIcon />}
              iconPosition="start"
              sx={{
                color: contadorCanceladas > 0 ? '#D32F2F' : 'text.secondary',
                '&.Mui-selected': {
                  color: '#D32F2F',
                  fontWeight: 700
                }
              }}
            />
          </Tabs>
        </Box>
      )}

      {!loading && !error && solicitudes.length > 0 && (
        <Box>
          {/* Solicitudes Pendientes */}
          {solicitudesPendientes.length > 0 && (
            <Box mb={4}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'action.hover',
                    borderRadius: 1,
                    transition: 'background-color 0.2s'
                  },
                  p: 1,
                  ml: -1
                }}
                onClick={() => setPendientesExpanded(!pendientesExpanded)}
              >
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <Badge badgeContent={solicitudesPendientes.length} color="warning">
                    <ScheduleIcon sx={{ mr: 1 }} />
                  </Badge>
                  Solicitudes Pendientes
                </Typography>
                <IconButton size="small">
                  {pendientesExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>

              <Collapse in={pendientesExpanded}>
                <Grid container spacing={2}>
                {solicitudesPendientes.map((solicitud) => {
                  const barraColor = getBarraEstadoColor(solicitud);
                  return (
                  <Grid size={{ xs: 12, md: 6 }} key={solicitud.id_cita}>
                    <Card
                      sx={{
                        border: '2px solid',
                        borderColor: 'warning.main',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Barra de estado visual */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '6px',
                          height: '100%',
                          backgroundColor: barraColor,
                          zIndex: 1
                        }}
                      />
                      <CardContent sx={{ pl: 3 }}>
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

                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" component="span">
                            <strong>Motivo:</strong>{' '}
                            {expandedTexts[solicitud.id_cita] || solicitud.motivo.length <= 100
                              ? solicitud.motivo
                              : truncateText(solicitud.motivo, 100)}
                          </Typography>
                          {solicitud.motivo.length > 100 && (
                            <Button
                              size="small"
                              onClick={() => toggleText(solicitud.id_cita)}
                              sx={{
                                ml: 1,
                                textTransform: 'none',
                                minWidth: 'auto',
                                p: 0,
                                fontSize: '0.875rem'
                              }}
                            >
                              {expandedTexts[solicitud.id_cita] ? 'Ver menos' : 'Ver más'}
                            </Button>
                          )}
                        </Box>

                        {/* Fechas fuera del collapse */}
                        <List dense sx={{ mb: 1 }}>
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
                                primary="Fecha preferida del alumno"
                                secondary={formatDate(solicitud.fecha_propuesta_alumno)}
                              />
                            </ListItem>
                          )}
                        </List>

                        {/* Encabezado de detalles del estudiante - colapsable */}
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            '&:hover': {
                              bgcolor: 'action.hover',
                              borderRadius: 1
                            },
                            p: 0.5,
                            mb: 1
                          }}
                          onClick={() => toggleDetails(solicitud.id_cita)}
                        >
                          <Typography variant="body2" fontWeight="bold" color="text.secondary">
                            Detalles del Estudiante
                          </Typography>
                          <IconButton size="small">
                            {expandedDetails[solicitud.id_cita] ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                          </IconButton>
                        </Box>

                        <Collapse in={expandedDetails[solicitud.id_cita]}>
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
                          </List>
                        </Collapse>

                        {solicitud.observaciones_alumno && (
                          <>
                            <Divider sx={{ my: 2 }} />
                            <Box>
                              <Typography variant="body2" color="text.secondary" component="span">
                                <strong>Observaciones del estudiante:</strong>{' '}
                                {expandedTexts[`obs-${solicitud.id_cita}`] || solicitud.observaciones_alumno.length <= 100
                                  ? solicitud.observaciones_alumno
                                  : truncateText(solicitud.observaciones_alumno, 100)}
                              </Typography>
                              {solicitud.observaciones_alumno.length > 100 && (
                                <Button
                                  size="small"
                                  onClick={() => toggleText(`obs-${solicitud.id_cita}` as any)}
                                  sx={{
                                    ml: 1,
                                    textTransform: 'none',
                                    minWidth: 'auto',
                                    p: 0,
                                    fontSize: '0.875rem'
                                  }}
                                >
                                  {expandedTexts[`obs-${solicitud.id_cita}`] ? 'Ver menos' : 'Ver más'}
                                </Button>
                              )}
                            </Box>
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
                  );
                })}
              </Grid>
              </Collapse>
            </Box>
          )}

          {/* Citas Confirmadas */}
          {solicitudesConfirmadas.length > 0 && (
            <Box mb={4}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'action.hover',
                    borderRadius: 1,
                    transition: 'background-color 0.2s'
                  },
                  p: 1,
                  ml: -1
                }}
                onClick={() => setConfirmadasExpanded(!confirmadasExpanded)}
              >
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckIcon sx={{ mr: 1, color: 'success.main' }} />
                  Citas Confirmadas ({solicitudesConfirmadas.length})
                </Typography>
                <IconButton size="small">
                  {confirmadasExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>

              <Collapse in={confirmadasExpanded}>
                <Grid container spacing={2}>
                {solicitudesConfirmadas.map((solicitud) => {
                  const tipoColor = getTipoColor(solicitud.tipo_cita);
                  const barraColor = getBarraEstadoColor(solicitud);
                  return (
                    <Grid size={{ xs: 12, md: 6 }} key={solicitud.id_cita}>
                      <Card
                        sx={{
                          border: '2px solid',
                          borderColor: tipoColor.border,
                          bgcolor: tipoColor.bg,
                          position: 'relative',
                          overflow: 'hidden',
                          '&:hover': {
                            boxShadow: 4,
                            transform: 'translateY(-2px)',
                            transition: 'all 0.3s ease'
                          }
                        }}
                      >
                        {/* Barra de estado visual */}
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '6px',
                            height: '100%',
                            backgroundColor: barraColor,
                            zIndex: 1
                          }}
                        />
                        <CardContent sx={{ pl: 3 }}>
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
              </Collapse>
            </Box>
          )}

          {/* Citas Completadas/Canceladas (solo para tabs revision y canceladas) */}
          {solicitudesOtras.length > 0 && (filtroTemporal === 'revision' || filtroTemporal === 'canceladas') && (
            <Box mb={4}>
              <Box
                onClick={() => setOtrasExpanded(!otrasExpanded)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  p: 1.5,
                  borderRadius: 1,
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.04)'
                  }
                }}
              >
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <Badge badgeContent={solicitudesOtras.length} color={filtroTemporal === 'revision' ? 'success' : 'error'}>
                    {filtroTemporal === 'revision' ? <CheckCircleIcon sx={{ mr: 1 }} /> : <CancelIcon sx={{ mr: 1 }} />}
                  </Badge>
                  {filtroTemporal === 'revision' ? 'Citas Completadas' : 'Citas Canceladas'}
                </Typography>
                <IconButton size="small">
                  {otrasExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
              <Collapse in={otrasExpanded}>
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                {solicitudesOtras.map((solicitud) => {
                  const tipoColor = getTipoColor(solicitud.tipo_cita);
                  const barraColor = getBarraEstadoColor(solicitud);

                  return (
                    <Grid item xs={12} key={solicitud.id_cita}>
                      <Card
                        sx={{
                          position: 'relative',
                          overflow: 'visible',
                          boxShadow: 2,
                          '&:hover': {
                            boxShadow: 4
                          }
                        }}
                      >
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '6px',
                            height: '100%',
                            backgroundColor: barraColor,
                            zIndex: 1
                          }}
                        />
                        <CardContent sx={{ pl: 3 }}>
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
              </Collapse>
            </Box>
          )}

          {/* Mensaje cuando no hay resultados para el filtro */}
          {solicitudesPendientes.length === 0 && solicitudesConfirmadas.length === 0 && solicitudesOtras.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              {filtroTemporal === 'hoy' && 'No hay citas programadas para hoy.'}
              {filtroTemporal === 'pasadas' && 'No hay citas pasadas sin atender.'}
              {filtroTemporal === 'pendientes' && 'No hay citas pendientes con fecha futura.'}
              {filtroTemporal === 'revision' && 'No hay citas completadas/revisadas.'}
              {filtroTemporal === 'confirmadas' && 'No hay citas confirmadas.'}
              {filtroTemporal === 'canceladas' && 'No hay citas canceladas.'}
              {filtroTemporal === 'todas' && 'No hay citas en este momento.'}
            </Alert>
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
