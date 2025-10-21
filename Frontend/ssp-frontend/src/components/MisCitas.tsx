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
  ListItemText,
  Tabs,
  Tab
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
  AccessTime as TimeIcon,
  Today as TodayIcon,
  History as HistoryIcon,
  HourglassEmpty as HourglassEmptyIcon,
  CheckCircle as CheckCircleIcon
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

  // Estado para filtro de pestañas temporales
  type FiltroTemporal = 'todas' | 'hoy' | 'pasadas' | 'pendientes' | 'revision';
  const [filtroTemporal, setFiltroTemporal] = useState<FiltroTemporal>('todas');

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
   *     cita: Objeto de cita con estado y fechas
   *
   * Returns:
   *     string: Color en formato hexadecimal o nombre de color de MUI
   */
  const getBarraEstadoColor = (cita: Cita): string => {
    const ahora = new Date();
    const fechaCita = cita.fecha_confirmada
      ? new Date(cita.fecha_confirmada)
      : cita.fecha_propuesta_alumno
        ? new Date(cita.fecha_propuesta_alumno)
        : null;

    // Si la cita está completada (revisada/atendida) -> Amarillo
    if (cita.estado === 'completada') {
      return '#FFC107'; // Amarillo (warning.main)
    }

    // Si la cita está cancelada -> No mostrar barra o usar color neutral
    if (cita.estado === 'cancelada') {
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
      if (cita.estado === 'confirmada' || cita.estado === 'completada') {
        return '#4CAF50'; // Verde (success.main)
      }
      // Si NO fue atendida (pendiente) -> Rojo
      return '#F44336'; // Rojo (error.main)
    }

    // Si la fecha es hoy
    if (citaFecha.getTime() === ahoraFecha.getTime()) {
      // Si está confirmada -> Verde
      if (cita.estado === 'confirmada') {
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
   *     cita: Objeto de cita
   *
   * Returns:
   *     boolean: true si la cita es de hoy
   */
  const esCitaDeHoy = (cita: Cita): boolean => {
    const fechaCita = cita.fecha_confirmada
      ? new Date(cita.fecha_confirmada)
      : cita.fecha_propuesta_alumno
        ? new Date(cita.fecha_propuesta_alumno)
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
   *     cita: Objeto de cita
   *
   * Returns:
   *     boolean: true si la fecha de la cita ya pasó
   */
  const esCitaPasada = (cita: Cita): boolean => {
    const fechaCita = cita.fecha_confirmada
      ? new Date(cita.fecha_confirmada)
      : cita.fecha_propuesta_alumno
        ? new Date(cita.fecha_propuesta_alumno)
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
   *     cita: Objeto de cita
   *
   * Returns:
   *     boolean: true si la fecha de la cita está en el futuro
   */
  const esCitaPendienteFutura = (cita: Cita): boolean => {
    const fechaCita = cita.fecha_confirmada
      ? new Date(cita.fecha_confirmada)
      : cita.fecha_propuesta_alumno
        ? new Date(cita.fecha_propuesta_alumno)
        : null;

    if (!fechaCita) return true; // Sin fecha se considera pendiente

    const ahora = new Date();
    const ahoraFecha = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    const citaFecha = new Date(fechaCita.getFullYear(), fechaCita.getMonth(), fechaCita.getDate());

    return citaFecha > ahoraFecha;
  };

  /**
   * Filtra las citas según el filtro temporal seleccionado.
   *
   * Args:
   *     citas: Array de citas
   *
   * Returns:
   *     Array de citas filtradas
   */
  const filtrarPorEstadoTemporal = (citas: Cita[]): Cita[] => {
    switch (filtroTemporal) {
      case 'hoy':
        return citas.filter(c => esCitaDeHoy(c));
      case 'pasadas':
        return citas.filter(c => esCitaPasada(c) && c.estado !== 'completada');
      case 'pendientes':
        return citas.filter(c => esCitaPendienteFutura(c) && c.estado !== 'completada');
      case 'revision':
        return citas.filter(c => c.estado === 'completada');
      case 'todas':
      default:
        return citas;
    }
  };

  // Aplicar filtro temporal
  const citasFiltradas = filtrarPorEstadoTemporal(citas);

  // Contadores para las pestañas
  const contadorHoy = citas.filter(c => esCitaDeHoy(c)).length;
  const contadorPasadas = citas.filter(c => esCitaPasada(c) && c.estado !== 'completada').length;
  const contadorPendientes = citas.filter(c => esCitaPendienteFutura(c) && c.estado !== 'completada').length;
  const contadorRevision = citas.filter(c => c.estado === 'completada').length;

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

        {/* Barra de pestañas/filtros temporales */}
        {!loading && !error && citas.length > 0 && (
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
                label={`Todas (${citas.length})`}
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
                value="pasadas"
                label={`Pasadas (${contadorPasadas})`}
                icon={<HistoryIcon />}
                iconPosition="start"
                sx={{
                  color: contadorPasadas > 0 ? '#F44336' : 'text.secondary',
                  '&.Mui-selected': {
                    color: '#F44336',
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
            </Tabs>
          </Box>
        )}

        {!loading && !error && citas.length > 0 && (
          <Box>
            {citasFiltradas.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                {filtroTemporal === 'hoy' && 'No tienes citas programadas para hoy.'}
                {filtroTemporal === 'pasadas' && 'No tienes citas pasadas sin atender.'}
                {filtroTemporal === 'pendientes' && 'No tienes citas pendientes con fecha futura.'}
                {filtroTemporal === 'revision' && 'No tienes citas completadas/revisadas.'}
                {filtroTemporal === 'todas' && 'No tienes citas en este momento.'}
              </Alert>
            ) : (
              <>
                {citasFiltradas.map((cita) => {
              const barraColor = getBarraEstadoColor(cita);
              return (
              <Card
                key={cita.id_cita}
                sx={{
                  mb: 2,
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
              );
            })}
              </>
            )}
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
