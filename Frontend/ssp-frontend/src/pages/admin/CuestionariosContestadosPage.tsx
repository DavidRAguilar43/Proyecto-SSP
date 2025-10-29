import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  CheckCircle as CheckCircleIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Visibility as VisibilityIcon,
  HourglassEmpty as HourglassEmptyIcon,
  PlayArrow as PlayArrowIcon
} from '@mui/icons-material';
import { AuthContext } from '@/contexts/AuthContext';
import { cuestionariosAdminApi } from '@/services/api';
import { useNotification } from '@/hooks/useNotification';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Pregunta {
  id: string;
  texto: string;
  descripcion: string | null;
  tipo: string;
  obligatoria: boolean;
  orden: number;
  configuracion: any;
}

interface RespuestaPregunta {
  id: number;
  pregunta_id: string;
  valor: any;
  texto_otro: string | null;
  created_at: string;
  updated_at: string;
  pregunta?: Pregunta;
}

interface RespuestaCuestionario {
  id: string;
  cuestionario_id: string;
  usuario_id: number;
  estado: string;
  fecha_inicio: string;
  fecha_completado: string | null;
  progreso: number;
  tiempo_total_minutos: number | null;
  created_at: string;
  updated_at: string;
  // Información adicional
  usuario_correo: string;
  usuario_matricula: string;
  usuario_nombre: string;
  cuestionario_titulo: string;
  cuestionario_descripcion: string;
  respuestas_preguntas: RespuestaPregunta[];
}

interface RespuestasData {
  respuestas: RespuestaCuestionario[];
  total: number;
  skip: number;
  limit: number;
}

/**
 * Página para ver todos los cuestionarios contestados por los usuarios.
 * Solo disponible para administradores y coordinadores.
 */
const CuestionariosContestadosPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const { showNotification } = useNotification();

  const [respuestas, setRespuestas] = useState<RespuestaCuestionario[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('completado'); // Por defecto solo mostrar completados

  // Detalle de respuesta
  const [respuestaSeleccionada, setRespuestaSeleccionada] = useState<RespuestaCuestionario | null>(null);
  const [detalleOpen, setDetalleOpen] = useState(false);

  useEffect(() => {
    cargarRespuestas();
  }, [page, rowsPerPage, filtroEstado]);

  const cargarRespuestas = async () => {
    try {
      setLoading(true);
      setError(null);

      const filtros: any = {
        skip: page * rowsPerPage,
        limit: rowsPerPage
      };

      if (filtroEstado !== 'todos') {
        filtros.estado = filtroEstado;
      }

      const data: RespuestasData = await cuestionariosAdminApi.getAllRespuestas(filtros);
      setRespuestas(data.respuestas);
      setTotal(data.total);
    } catch (error: any) {
      console.error('Error cargando respuestas:', error);
      setError(error.response?.data?.detail || 'Error al cargar las respuestas de cuestionarios');
      showNotification('Error al cargar las respuestas', 'error');
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

  const handleVerDetalle = (respuesta: RespuestaCuestionario) => {
    setRespuestaSeleccionada(respuesta);
    setDetalleOpen(true);
  };

  const formatearFecha = (fechaString: string | null) => {
    if (!fechaString) return 'N/A';
    try {
      return format(new Date(fechaString), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es });
    } catch (error) {
      return fechaString;
    }
  };

  const getEstadoChip = (estado: string) => {
    switch (estado) {
      case 'completado':
        return <Chip label="Completado" color="success" size="small" icon={<CheckCircleIcon />} />;
      case 'en_progreso':
        return <Chip label="En Progreso" color="warning" size="small" icon={<PlayArrowIcon />} />;
      case 'pendiente':
        return <Chip label="Pendiente" color="default" size="small" icon={<HourglassEmptyIcon />} />;
      default:
        return <Chip label={estado} size="small" />;
    }
  };

  const renderRespuestaValor = (valor: any, tipoPregunta?: string) => {
    if (valor === null || valor === undefined || valor === '') {
      return <em style={{ color: '#999' }}>Sin respuesta</em>;
    }

    // Si es un array (checkbox, opción múltiple)
    if (Array.isArray(valor)) {
      if (valor.length === 0) {
        return <em style={{ color: '#999' }}>Sin respuesta</em>;
      }
      return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {valor.map((item, idx) => (
            <Chip key={idx} label={item} size="small" color="primary" variant="outlined" />
          ))}
        </Box>
      );
    }

    // Si es un booleano (verdadero/falso)
    if (typeof valor === 'boolean') {
      return valor ? 'Verdadero' : 'Falso';
    }

    // Si es un número (escala, etc.)
    if (typeof valor === 'number') {
      return valor.toString();
    }

    // Si es un string
    return String(valor);
  };

  const respuestasFiltradas = respuestas.filter(respuesta => {
    if (!busqueda.trim()) return true;
    const busquedaLower = busqueda.toLowerCase();
    return (
      respuesta.usuario_correo?.toLowerCase().includes(busquedaLower) ||
      respuesta.usuario_matricula?.toLowerCase().includes(busquedaLower) ||
      respuesta.usuario_nombre?.toLowerCase().includes(busquedaLower) ||
      respuesta.cuestionario_titulo?.toLowerCase().includes(busquedaLower)
    );
  });

  if (loading && respuestas.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
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
            Cuestionarios Contestados
          </Typography>

          <Button color="inherit" onClick={logout}>
            Cerrar Sesión
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Encabezado */}
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Box display="flex" alignItems="center" mb={2}>
            <CheckCircleIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                Cuestionarios Contestados
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Visualiza y gestiona todas las respuestas de cuestionarios administrativos
              </Typography>
            </Box>
          </Box>

          {user && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Usuario:</strong> {user.correo_institucional} ({user.rol})
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Filtros y búsqueda */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <FilterIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Filtros y Búsqueda
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Buscar por usuario, matrícula o cuestionario..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={filtroEstado}
                    label="Estado"
                    onChange={(e) => {
                      setFiltroEstado(e.target.value);
                      setPage(0);
                    }}
                  >
                    <MenuItem value="todos">Todos</MenuItem>
                    <MenuItem value="completado">Completado</MenuItem>
                    <MenuItem value="en_progreso">En Progreso</MenuItem>
                    <MenuItem value="pendiente">Pendiente</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button
                  variant="outlined"
                  startIcon={loading ? <CircularProgress size={20} /> : <FilterIcon />}
                  onClick={cargarRespuestas}
                  fullWidth
                  disabled={loading}
                >
                  Actualizar
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Tabla de respuestas */}
        <Paper elevation={2}>
          {error && (
            <Alert severity="error" sx={{ m: 2 }}>
              {error}
            </Alert>
          )}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Usuario</strong></TableCell>
                  <TableCell><strong>Cuestionario</strong></TableCell>
                  <TableCell><strong>Estado</strong></TableCell>
                  <TableCell><strong>Progreso</strong></TableCell>
                  <TableCell><strong>Fecha Inicio</strong></TableCell>
                  <TableCell><strong>Fecha Completado</strong></TableCell>
                  <TableCell align="center"><strong>Acciones</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <CircularProgress sx={{ my: 2 }} />
                    </TableCell>
                  </TableRow>
                ) : respuestasFiltradas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                        {busqueda ? 'No se encontraron respuestas que coincidan con la búsqueda' : 'No hay respuestas de cuestionarios'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  respuestasFiltradas.map((respuesta) => (
                    <TableRow key={respuesta.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {respuesta.usuario_nombre || 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {respuesta.usuario_correo}
                          </Typography>
                          <br />
                          <Typography variant="caption" color="text.secondary">
                            Mat: {respuesta.usuario_matricula || 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {respuesta.cuestionario_titulo}
                        </Typography>
                      </TableCell>
                      <TableCell>{getEstadoChip(respuesta.estado)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={`${respuesta.progreso}%`} 
                          size="small" 
                          color={respuesta.progreso === 100 ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {formatearFecha(respuesta.fecha_inicio)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {formatearFecha(respuesta.fecha_completado)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleVerDetalle(respuesta)}
                          title="Ver detalle"
                        >
                          <VisibilityIcon />
                        </IconButton>
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
            count={total}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        </Paper>
      </Container>

      {/* Dialog de detalle */}
      <Dialog
        open={detalleOpen}
        onClose={() => setDetalleOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <AssignmentIcon sx={{ mr: 1 }} />
            Detalle de Respuesta
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {respuestaSeleccionada && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {respuestaSeleccionada.cuestionario_titulo}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {respuestaSeleccionada.cuestionario_descripcion}
              </Typography>

              <Divider sx={{ my: 2 }} />

              {/* Información resumida del usuario */}
              <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="primary.main" gutterBottom>
                  <PersonIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                  Respondido por: {respuestaSeleccionada.usuario_nombre}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {respuestaSeleccionada.usuario_correo} | Matrícula: {respuestaSeleccionada.usuario_matricula || 'N/A'}
                </Typography>
              </Box>

              {/* Preguntas y Respuestas */}
              <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
                Preguntas y Respuestas
              </Typography>

              {respuestaSeleccionada.respuestas_preguntas && respuestaSeleccionada.respuestas_preguntas.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {respuestaSeleccionada.respuestas_preguntas
                    .sort((a, b) => (a.pregunta?.orden || 0) - (b.pregunta?.orden || 0))
                    .map((respuestaPregunta, index) => (
                      <Paper
                        key={respuestaPregunta.id}
                        sx={{
                          p: 2,
                          bgcolor: 'grey.50',
                          border: '1px solid',
                          borderColor: 'divider'
                        }}
                      >
                        {/* Pregunta */}
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
                            {index + 1}. {respuestaPregunta.pregunta?.texto || 'Pregunta no disponible'}
                          </Typography>
                          {respuestaPregunta.pregunta?.descripcion && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              {respuestaPregunta.pregunta.descripcion}
                            </Typography>
                          )}
                          <Chip
                            label={respuestaPregunta.pregunta?.tipo || 'N/A'}
                            size="small"
                            sx={{ mt: 1 }}
                            variant="outlined"
                          />
                        </Box>

                        {/* Respuesta */}
                        <Box sx={{ pl: 2, borderLeft: '3px solid', borderColor: 'primary.main' }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Respuesta:
                          </Typography>
                          <Typography variant="body1">
                            {renderRespuestaValor(respuestaPregunta.valor, respuestaPregunta.pregunta?.tipo)}
                          </Typography>
                          {respuestaPregunta.texto_otro && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                              Otro: {respuestaPregunta.texto_otro}
                            </Typography>
                          )}
                        </Box>
                      </Paper>
                    ))}
                </Box>
              ) : (
                <Alert severity="info">
                  No hay respuestas registradas para este cuestionario.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetalleOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CuestionariosContestadosPage;

