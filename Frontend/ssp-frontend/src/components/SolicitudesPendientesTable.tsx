import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  TablePagination,
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Psychology as PsychologyIcon,
  School as SchoolIcon,
  Help as HelpIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';
import type { SolicitudCita, CitaUpdate, EstadoCita, TipoCita } from '@/types';
import { citasApi } from '@/services/api';
import { useNotification } from '@/hooks/useNotification';

interface SolicitudesPendientesTableProps {
  solicitudes: SolicitudCita[];
  loading?: boolean;
  onRefresh: () => void;
}

const SolicitudesPendientesTable: React.FC<SolicitudesPendientesTableProps> = ({
  solicitudes,
  loading = false,
  onRefresh
}) => {
  const { notifySuccess, notifyError } = useNotification();
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Estados para diálogo de confirmación
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudCita | null>(null);
  const [confirmData, setConfirmData] = useState<CitaUpdate>({
    estado: 'confirmada',
    fecha_confirmada: '',
    observaciones_personal: '',
    ubicacion: ''
  });
  const [confirmLoading, setConfirmLoading] = useState(false);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getTipoIcon = (tipo: TipoCita) => {
    switch (tipo) {
      case 'psicologica':
        return <PsychologyIcon color="secondary" fontSize="small" />;
      case 'academica':
        return <SchoolIcon color="primary" fontSize="small" />;
      default:
        return <HelpIcon color="action" fontSize="small" />;
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
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: es });
    } catch {
      return dateString;
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
    try {
      await citasApi.confirmar(solicitud.id_cita, {
        estado: 'cancelada',
        observaciones_personal: 'Cita cancelada por el personal'
      });
      
      onRefresh();
      notifySuccess('Cita cancelada exitosamente');
    } catch (error: any) {
      console.error('Error cancelando cita:', error);
      notifyError(error.response?.data?.detail || 'Error al cancelar la cita');
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
      onRefresh();
      notifySuccess('Cita confirmada exitosamente');
    } catch (error: any) {
      console.error('Error confirmando cita:', error);
      notifyError(error.response?.data?.detail || 'Error al confirmar la cita');
    } finally {
      setConfirmLoading(false);
    }
  };

  // Filtrar solo solicitudes pendientes para la tabla
  const solicitudesPendientes = solicitudes.filter(s => s.estado === 'pendiente');

  return (
    <Paper>
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader aria-label="tabla de solicitudes pendientes">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Estudiante</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Matrícula</TableCell>
              <TableCell>Fecha Solicitud</TableCell>
              <TableCell>Fecha Preferida</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Box py={2}>
                    <Typography variant="body2" color="text.secondary">
                      Cargando solicitudes...
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : solicitudesPendientes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Box py={2}>
                    <Typography variant="body2" color="text.secondary">
                      No hay solicitudes pendientes
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              solicitudesPendientes
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((solicitud) => (
                  <TableRow key={solicitud.id_cita} hover>
                    <TableCell>{solicitud.id_cita}</TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {getTipoIcon(solicitud.tipo_cita)}
                        {getTipoLabel(solicitud.tipo_cita)}
                      </Box>
                    </TableCell>
                    <TableCell>{solicitud.alumno_nombre}</TableCell>
                    <TableCell>{solicitud.alumno_email}</TableCell>
                    <TableCell>{solicitud.alumno_matricula || 'N/A'}</TableCell>
                    <TableCell>{formatDate(solicitud.fecha_solicitud)}</TableCell>
                    <TableCell>
                      {solicitud.fecha_propuesta_alumno 
                        ? formatDate(solicitud.fecha_propuesta_alumno)
                        : 'No especificada'
                      }
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getEstadoLabel(solicitud.estado)}
                        color={getEstadoColor(solicitud.estado)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Confirmar">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleConfirmarCita(solicitud)}
                        >
                          <CheckIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Cancelar">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleCancelarCita(solicitud)}
                        >
                          <CloseIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={solicitudesPendientes.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Filas por página:"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
        }
      />

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
            startIcon={<CheckIcon />}
          >
            {confirmLoading ? 'Confirmando...' : 'Confirmar Cita'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default SolicitudesPendientesTable;
