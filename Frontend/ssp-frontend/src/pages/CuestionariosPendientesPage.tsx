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
  DialogActions
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Psychology as PsychologyIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AuthContext } from '@/contexts/AuthContext';
import { cuestionarioPsicopedagogicoApi } from '@/services/api';
import { useNotification } from '@/hooks/useNotification';
import ReportePsicopedagogico from '@/components/ReportePsicopedagogico';

interface EstudianteConCuestionario {
  id: number;
  correo_institucional: string;
  matricula?: string;
  nombre_completo: string;
  tiene_cuestionario: boolean;
  fecha_completado?: string;
  id_cuestionario?: number;
}

const CuestionariosPendientesPage: React.FC = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { notifySuccess, notifyError } = useNotification();
  
  const [estudiantes, setEstudiantes] = useState<EstudianteConCuestionario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Estados para diálogos
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedEstudiante, setSelectedEstudiante] = useState<EstudianteConCuestionario | null>(null);

  useEffect(() => {
    loadEstudiantes();
  }, []);

  const loadEstudiantes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await cuestionarioPsicopedagogicoApi.getEstudiantesConCuestionarios();
      setEstudiantes(data);
    } catch (error: any) {
      console.error('Error loading estudiantes:', error);
      setError(error.response?.data?.detail || 'Error al cargar estudiantes con cuestionarios');
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

  const handleViewCuestionario = (estudiante: EstudianteConCuestionario) => {
    setSelectedEstudiante(estudiante);
    setViewDialogOpen(true);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No disponible';
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: es });
    } catch {
      return dateString;
    }
  };

  const getNombreCompleto = (estudiante: EstudianteConCuestionario) => {
    return estudiante.nombre_completo || estudiante.correo_institucional.split('@')[0] || 'Sin nombre';
  };

  const getEstadoReporte = (estudiante: EstudianteConCuestionario) => {
    if (!estudiante.tiene_cuestionario || !estudiante.fecha_completado) {
      return { label: 'No completado', color: 'default' as const };
    }
    // Por ahora, todos los cuestionarios completados se consideran pendientes de revisión
    // En el futuro se puede agregar un campo para indicar si ya fue revisado
    return { label: 'Pendiente revisión', color: 'warning' as const };
  };

  // Filtrar solo cuestionarios pendientes de revisión (completados)
  const cuestionariosPendientes = estudiantes.filter(e =>
    e.tiene_cuestionario && e.fecha_completado
  );

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
            Cuestionarios Pendientes de Revisión ({cuestionariosPendientes.length})
          </Typography>
          
          {/* Botón de actualizar */}
          <Tooltip title="Actualizar">
            <IconButton
              color="inherit"
              onClick={loadEstudiantes}
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
            <Table stickyHeader aria-label="tabla de cuestionarios pendientes">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Estudiante</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Matrícula</TableCell>
                  <TableCell>Fecha Completado</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Box py={2}>
                        <CircularProgress />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Cargando cuestionarios...
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : cuestionariosPendientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Box py={2}>
                        <PsychologyIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          No hay cuestionarios pendientes de revisión
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  cuestionariosPendientes
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((estudiante) => {
                      const estado = getEstadoReporte(estudiante);
                      return (
                        <TableRow key={estudiante.id} hover>
                          <TableCell>{estudiante.id}</TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <PersonIcon fontSize="small" color="primary" />
                              {getNombreCompleto(estudiante)}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <EmailIcon fontSize="small" color="action" />
                              {estudiante.correo_institucional}
                            </Box>
                          </TableCell>
                          <TableCell>{estudiante.matricula || 'N/A'}</TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <CalendarIcon fontSize="small" color="action" />
                              {formatDate(estudiante.fecha_completado)}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={estado.label}
                              color={estado.color}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Ver cuestionario">
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewCuestionario(estudiante)}
                                >
                                  <VisibilityIcon />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={cuestionariosPendientes.length}
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

      {/* Diálogo para Ver Cuestionario */}
      <ReportePsicopedagogico
        open={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false);
          setSelectedEstudiante(null);
          // Recargar datos después de cerrar el reporte para actualizar el estado
          loadEstudiantes();
        }}
        personaId={selectedEstudiante?.id || 0}
        personaNombre={selectedEstudiante ? getNombreCompleto(selectedEstudiante) : ''}
      />
    </Box>
  );
};

export default CuestionariosPendientesPage;
