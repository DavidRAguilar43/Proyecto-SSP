import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  AppBar,
  Toolbar,
  Button,
  Container,
  Paper,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Psychology as PsychologyIcon,
  School as SchoolIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';
import { AuthContext } from '@/contexts/AuthContext';
import { citasApi } from '@/services/api';
import type { SolicitudCita, CitaUpdate, EstadoCita, TipoCita } from '@/types';
import { useNotification } from '@/hooks/useNotification';
import ConfirmDialog from '@/components/ConfirmDialog';

const SolicitudesPendientesPage: React.FC = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { notifySuccess, notifyError } = useNotification();

  const [solicitudes, setSolicitudes] = useState<SolicitudCita[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Estados para diálogos
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudCita | null>(null);

  // Estados para confirmación de cita
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
    } catch (error: any) {
      console.error('Error loading solicitudes:', error);
      setError(error.response?.data?.detail || 'Error al cargar las solicitudes');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewSolicitud = (solicitud: SolicitudCita) => {
    setSelectedSolicitud(solicitud);
    setViewDialogOpen(true);
  };

  const handleEditSolicitud = (solicitud: SolicitudCita) => {
    setSelectedSolicitud(solicitud);
    setConfirmData({
      estado: 'confirmada',
      fecha_confirmada: solicitud.fecha_propuesta_alumno || '',
      observaciones_personal: '',
      ubicacion: 'Oficina de Servicios Estudiantiles'
    });
    setEditDialogOpen(true);
  };

  const handleDeleteSolicitud = (solicitud: SolicitudCita) => {
    setSelectedSolicitud(solicitud);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteSolicitud = async () => {
    if (!selectedSolicitud) return;

    try {
      await citasApi.confirmar(selectedSolicitud.id_cita, {
        estado: 'cancelada',
        observaciones_personal: 'Solicitud eliminada por el personal'
      });

      loadSolicitudes();
      notifySuccess('Solicitud eliminada exitosamente');
    } catch (error: any) {
      console.error('Error eliminando solicitud:', error);
      notifyError(error.response?.data?.detail || 'Error al eliminar la solicitud');
    } finally {
      setDeleteDialogOpen(false);
      setSelectedSolicitud(null);
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedSolicitud) return;

    try {
      setConfirmLoading(true);
      await citasApi.confirmar(selectedSolicitud.id_cita, {
        ...confirmData,
        fecha_confirmada: confirmData.fecha_confirmada
          ? new Date(confirmData.fecha_confirmada).toISOString()
          : undefined
      });

      setEditDialogOpen(false);
      setSelectedSolicitud(null);
      loadSolicitudes();
      notifySuccess('Solicitud actualizada exitosamente');
    } catch (error: any) {
      console.error('Error actualizando solicitud:', error);
      notifyError(error.response?.data?.detail || 'Error al actualizar la solicitud');
    } finally {
      setConfirmLoading(false);
    }
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

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* App Bar */}
      <AppBar position="static">
        <Toolbar>
          <Button
            color="inherit"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/dashboard')}
            sx={{ mr: 2 }}
          >
            Volver
          </Button>

          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Gestión de Solicitudes de Citas ({solicitudes.length})
          </Typography>

          {/* Botón de actualizar */}
          <Tooltip title="Actualizar">
            <IconButton
              color="inherit"
              onClick={loadSolicitudes}
              disabled={loading}
              sx={{ mr: 2 }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          <Button color="inherit" onClick={logout}>
            Cerrar Sesión
          </Button>
        </Toolbar>
      </AppBar>

      {/* Contenido Principal */}
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper>
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader aria-label="tabla de solicitudes de citas">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Estudiante</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Matrícula</TableCell>
                  <TableCell>Motivo</TableCell>
                  <TableCell>Fecha Solicitud</TableCell>
                  <TableCell>Fecha Preferida</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center">
                      <Box py={2}>
                        <CircularProgress />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Cargando solicitudes...
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : solicitudes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center">
                      <Box py={2}>
                        <Typography variant="body2" color="text.secondary">
                          No hay solicitudes de citas registradas
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  solicitudes
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
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {solicitud.motivo}
                          </Typography>
                        </TableCell>
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
                          <Tooltip title="Ver detalles">
                            <IconButton
                              size="small"
                              onClick={() => handleViewSolicitud(solicitud)}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          {solicitud.estado === 'pendiente' && (
                            <>
                              <Tooltip title="Confirmar/Editar">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleEditSolicitud(solicitud)}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Eliminar">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteSolicitud(solicitud)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={solicitudes.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
            }
          />
        </Paper>
      </Container>
      {/* Diálogo para Ver Detalles */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Detalles de la Solicitud #{selectedSolicitud?.id_cita}
        </DialogTitle>
        <DialogContent>
          {selectedSolicitud && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>Información del Estudiante</Typography>
              <Typography><strong>Nombre:</strong> {selectedSolicitud.alumno_nombre}</Typography>
              <Typography><strong>Email:</strong> {selectedSolicitud.alumno_email}</Typography>
              <Typography><strong>Matrícula:</strong> {selectedSolicitud.alumno_matricula || 'N/A'}</Typography>
              {selectedSolicitud.alumno_celular && (
                <Typography><strong>Celular:</strong> {selectedSolicitud.alumno_celular}</Typography>
              )}

              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Información de la Cita</Typography>
              <Typography><strong>Tipo:</strong> {getTipoLabel(selectedSolicitud.tipo_cita)}</Typography>
              <Typography><strong>Estado:</strong> {getEstadoLabel(selectedSolicitud.estado)}</Typography>
              <Typography><strong>Fecha de Solicitud:</strong> {formatDate(selectedSolicitud.fecha_solicitud)}</Typography>
              {selectedSolicitud.fecha_propuesta_alumno && (
                <Typography><strong>Fecha Preferida:</strong> {formatDate(selectedSolicitud.fecha_propuesta_alumno)}</Typography>
              )}

              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Motivo</Typography>
              <Typography>{selectedSolicitud.motivo}</Typography>

              {selectedSolicitud.observaciones_alumno && (
                <>
                  <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Observaciones del Estudiante</Typography>
                  <Typography>{selectedSolicitud.observaciones_alumno}</Typography>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para Editar/Confirmar */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
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
          <Button onClick={() => setEditDialogOpen(false)} disabled={confirmLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmitEdit}
            disabled={confirmLoading || !confirmData.fecha_confirmada}
            variant="contained"
            startIcon={confirmLoading ? <CircularProgress size={20} /> : <CheckIcon />}
          >
            {confirmLoading ? 'Confirmando...' : 'Confirmar Cita'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación para eliminar */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Confirmar eliminación"
        message={`¿Estás seguro de que deseas eliminar la solicitud de cita de ${selectedSolicitud?.alumno_nombre}? Esta acción no se puede deshacer.`}
        onConfirm={confirmDeleteSolicitud}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setSelectedSolicitud(null);
        }}
        confirmText="Sí, Eliminar"
        cancelText="Cancelar"
        severity="error"
        loading={loading}
      />
    </Box>
  );
};

export default SolicitudesPendientesPage;
