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
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Badge,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Grid,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Psychology as PsychologyIcon,
  Assessment as AssessmentIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  CalendarToday as CalendarIcon,
  FiberNew as FiberNewIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { AuthContext } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { notificationService } from '@/services/notificationService';
import ReportePsicopedagogico from '@/components/ReportePsicopedagogico';

interface EstudianteConCuestionario {
  id: number;
  correo_institucional: string;
  matricula: string;
  nombre_completo: string;
  tiene_cuestionario: boolean;
  fecha_completado: string;
  id_cuestionario: number;
}

const CuestionariosCompletadosPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [estudiantes, setEstudiantes] = useState<EstudianteConCuestionario[]>([]);
  const [estudiantesFiltrados, setEstudiantesFiltrados] = useState<EstudianteConCuestionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState<EstudianteConCuestionario | null>(null);
  const [reporteOpen, setReporteOpen] = useState(false);
  const [cuestionariosNoLeidos, setCuestionariosNoLeidos] = useState(0);

  // Estados para filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('todos');

  useEffect(() => {
    cargarEstudiantesConCuestionarios();

    // Limpiar cuestionarios antiguos al cargar el componente
    notificationService.limpiarCuestionariosAntiguos();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [estudiantes, busqueda, filtroFecha]);

  const cargarEstudiantesConCuestionarios = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/cuestionario-psicopedagogico/estudiantes-con-cuestionarios');
      setEstudiantes(response.data);

      // Calcular cuestionarios no leídos
      if (user?.id) {
        const noLeidos = notificationService.contarNoLeidos(response.data, user.id);
        setCuestionariosNoLeidos(noLeidos);
      }
    } catch (error: any) {
      console.error('Error cargando estudiantes:', error);
      setError(error.response?.data?.detail || 'Error al cargar estudiantes con cuestionarios');
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let estudiantesFiltrados = [...estudiantes];

    // Filtro por búsqueda
    if (busqueda.trim()) {
      const busquedaLower = busqueda.toLowerCase();
      estudiantesFiltrados = estudiantesFiltrados.filter(estudiante =>
        estudiante.correo_institucional.toLowerCase().includes(busquedaLower) ||
        estudiante.matricula?.toLowerCase().includes(busquedaLower) ||
        estudiante.nombre_completo.toLowerCase().includes(busquedaLower)
      );
    }

    // Filtro por fecha
    if (filtroFecha !== 'todos') {
      const ahora = new Date();
      const filtrarPor = (dias: number) => {
        const fechaLimite = new Date(ahora.getTime() - dias * 24 * 60 * 60 * 1000);
        return estudiantesFiltrados.filter(estudiante => {
          const fechaCompletado = new Date(estudiante.fecha_completado);
          return fechaCompletado >= fechaLimite;
        });
      };

      switch (filtroFecha) {
        case 'hoy':
          estudiantesFiltrados = filtrarPor(1);
          break;
        case 'semana':
          estudiantesFiltrados = filtrarPor(7);
          break;
        case 'mes':
          estudiantesFiltrados = filtrarPor(30);
          break;
      }
    }

    setEstudiantesFiltrados(estudiantesFiltrados);
  };

  const handleVerReporte = (estudiante: EstudianteConCuestionario) => {
    setEstudianteSeleccionado(estudiante);
    setReporteOpen(true);

    // Marcar como leído si no lo estaba antes
    if (user?.id && !notificationService.estaLeido(estudiante.id_cuestionario, user.id)) {
      notificationService.marcarComoLeido(estudiante.id_cuestionario, user.id);

      // Recalcular cuestionarios no leídos
      const noLeidos = notificationService.contarNoLeidos(estudiantes, user.id);
      setCuestionariosNoLeidos(noLeidos);
    }
  };

  const formatearFecha = (fechaString: string) => {
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
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
            Cuestionarios Completados
          </Typography>

          <Button color="inherit" onClick={logout}>
            Cerrar Sesión
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {/* Información del usuario */}
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Cuestionarios Psicopedagógicos Completados
          </Typography>
          
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Gestiona y revisa los cuestionarios psicopedagógicos completados por los estudiantes.
          </Typography>

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
              Filtros y Búsqueda
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Buscar por correo, matrícula o nombre..."
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
                  <InputLabel>Filtrar por fecha</InputLabel>
                  <Select
                    value={filtroFecha}
                    label="Filtrar por fecha"
                    onChange={(e) => setFiltroFecha(e.target.value)}
                  >
                    <MenuItem value="todos">Todos</MenuItem>
                    <MenuItem value="hoy">Hoy</MenuItem>
                    <MenuItem value="semana">Última semana</MenuItem>
                    <MenuItem value="mes">Último mes</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  onClick={cargarEstudiantesConCuestionarios}
                  fullWidth
                >
                  Actualizar
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Lista de cuestionarios */}
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <PsychologyIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">
                Cuestionarios Completados
              </Typography>
              {cuestionariosNoLeidos > 0 && (
                <Badge
                  badgeContent={cuestionariosNoLeidos}
                  color="error"
                  sx={{ ml: 2 }}
                >
                  <AssessmentIcon />
                </Badge>
              )}
              {cuestionariosNoLeidos === 0 && estudiantes.length > 0 && (
                <AssessmentIcon sx={{ ml: 2, color: 'success.main' }} />
              )}
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {estudiantesFiltrados.length === 0 ? (
              <Alert severity="info">
                {estudiantes.length === 0 
                  ? 'No hay cuestionarios psicopedagógicos completados.'
                  : 'No se encontraron cuestionarios que coincidan con los filtros aplicados.'
                }
              </Alert>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Mostrando {estudiantesFiltrados.length} de {estudiantes.length} cuestionarios completados
                  {cuestionariosNoLeidos > 0 && (
                    <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>
                      {' '}• {cuestionariosNoLeidos} sin revisar
                    </span>
                  )}
                  {cuestionariosNoLeidos === 0 && estudiantes.length > 0 && (
                    <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>
                      {' '}• Todos revisados ✓
                    </span>
                  )}
                </Typography>

                <List>
                  {estudiantesFiltrados.map((estudiante, index) => (
                    <React.Fragment key={estudiante.id}>
                      <ListItem>
                        <ListItemIcon>
                          {user?.id && notificationService.estaLeido(estudiante.id_cuestionario, user.id) ? (
                            <CheckCircleIcon color="success" />
                          ) : (
                            <FiberNewIcon color="error" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="subtitle1">
                                {estudiante.nombre_completo}
                              </Typography>
                              <Chip
                                label={estudiante.matricula}
                                size="small"
                                variant="outlined"
                              />
                              {user?.id && !notificationService.estaLeido(estudiante.id_cuestionario, user.id) && (
                                <Chip
                                  label="NUEVO"
                                  size="small"
                                  color="error"
                                  sx={{ fontSize: '0.7rem', height: '20px' }}
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {estudiante.correo_institucional}
                              </Typography>
                              <Box display="flex" alignItems="center" mt={0.5}>
                                <CalendarIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                <Typography variant="caption" color="text.secondary">
                                  Completado: {formatearFecha(estudiante.fecha_completado)}
                                </Typography>
                              </Box>
                            </Box>
                          }
                        />
                        
                        <ListItemSecondaryAction>
                          <Button
                            variant="contained"
                            color="primary"
                            startIcon={<AssessmentIcon />}
                            onClick={() => handleVerReporte(estudiante)}
                            size="small"
                          >
                            Ver Reporte
                          </Button>
                        </ListItemSecondaryAction>
                      </ListItem>
                      
                      {index < estudiantesFiltrados.length - 1 && <Divider sx={{ my: 1 }} />}
                    </React.Fragment>
                  ))}
                </List>
              </>
            )}
          </CardContent>
        </Card>
      </Container>

      {/* Componente del Reporte */}
      {estudianteSeleccionado && (
        <ReportePsicopedagogico
          open={reporteOpen}
          onClose={() => {
            setReporteOpen(false);
            setEstudianteSeleccionado(null);
          }}
          personaId={estudianteSeleccionado.id}
          personaNombre={estudianteSeleccionado.nombre_completo}
        />
      )}
    </Box>
  );
};

export default CuestionariosCompletadosPage;
