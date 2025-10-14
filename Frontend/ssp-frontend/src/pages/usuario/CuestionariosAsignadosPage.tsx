import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  LinearProgress,
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  Badge,
  IconButton
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  PlayArrow as StartIcon,
  CheckCircle as CompletedIcon,
  Schedule as PendingIcon,
  Edit as InProgressIcon,
  Info as InfoIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { AuthContext } from '@/contexts/AuthContext';
import { cuestionariosUsuarioApi } from '@/services/api';
import { useNotification } from '@/hooks/useNotification';
import type { CuestionarioAsignado, EstadoRespuesta } from '@/types/cuestionarios';

/**
 * Página para que los usuarios finales vean sus cuestionarios asignados
 */
const CuestionariosAsignadosPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { showNotification } = useNotification();

  const [cuestionarios, setCuestionarios] = useState<CuestionarioAsignado[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  // Cargar cuestionarios asignados
  useEffect(() => {
    const cargarCuestionarios = async () => {
      try {
        setLoading(true);
        const response = await cuestionariosUsuarioApi.getCuestionariosAsignados();
        setCuestionarios(response.cuestionarios_asignados);
      } catch (error) {
        console.error('Error al cargar cuestionarios:', error);
        showNotification('Error al cargar cuestionarios asignados', 'error');
      } finally {
        setLoading(false);
      }
    };

    cargarCuestionarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Sin dependencias, solo se ejecuta al montar

  // Filtrar cuestionarios por estado
  const cuestionariosPendientes = cuestionarios.filter(c => c.estado === 'pendiente');
  const cuestionariosEnProgreso = cuestionarios.filter(c => c.estado === 'en_progreso');
  const cuestionariosCompletados = cuestionarios.filter(c => c.estado === 'completado');

  const handleIniciarCuestionario = (cuestionarioId: string) => {
    navigate(`/usuario/cuestionarios/responder/${cuestionarioId}`);
  };

  const handleContinuarCuestionario = (cuestionarioId: string) => {
    navigate(`/usuario/cuestionarios/responder/${cuestionarioId}`);
  };

  const handleVerRespuestas = (cuestionarioId: string) => {
    navigate(`/usuario/cuestionarios/ver/${cuestionarioId}`);
  };

  const getEstadoIcon = (estado: EstadoRespuesta) => {
    switch (estado) {
      case 'pendiente': return <PendingIcon />;
      case 'en_progreso': return <InProgressIcon />;
      case 'completado': return <CompletedIcon />;
      default: return <InfoIcon />;
    }
  };

  const getEstadoColor = (estado: EstadoRespuesta) => {
    switch (estado) {
      case 'pendiente': return 'warning';
      case 'en_progreso': return 'info';
      case 'completado': return 'success';
      default: return 'default';
    }
  };

  const formatearFecha = (fecha?: string) => {
    if (!fecha) return 'No especificada';
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calcularDiasRestantes = (fechaLimite?: string) => {
    if (!fechaLimite) return null;
    const hoy = new Date();
    const limite = new Date(fechaLimite);
    const diferencia = limite.getTime() - hoy.getTime();
    const dias = Math.ceil(diferencia / (1000 * 3600 * 24));
    return dias;
  };

  const renderCuestionarioCard = (cuestionarioAsignado: CuestionarioAsignado) => {
    const { cuestionario, estado, fecha_limite, respuesta } = cuestionarioAsignado;
    const diasRestantes = calcularDiasRestantes(fecha_limite);
    const progreso = respuesta?.progreso_porcentaje || 0;

    return (
      <Grid item xs={12} md={6} lg={4} key={cuestionario.id}>
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="h6" component="h3" sx={{ flex: 1, mr: 1 }}>
                {cuestionario.titulo}
              </Typography>
              <Chip
                icon={getEstadoIcon(estado)}
                label={estado.replace('_', ' ')}
                color={getEstadoColor(estado)}
                size="small"
              />
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {cuestionario.descripcion}
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">
                {cuestionario.total_preguntas} preguntas
              </Typography>
              {estado === 'en_progreso' && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Progreso: {progreso}%
                  </Typography>
                  <LinearProgress variant="determinate" value={progreso} sx={{ mt: 0.5 }} />
                </Box>
              )}
            </Box>

            {fecha_limite && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Fecha límite: {formatearFecha(fecha_limite)}
                </Typography>
                {diasRestantes !== null && diasRestantes <= 7 && diasRestantes > 0 && (
                  <Chip
                    label={`${diasRestantes} días restantes`}
                    color="warning"
                    size="small"
                    sx={{ ml: 1 }}
                  />
                )}
                {diasRestantes !== null && diasRestantes <= 0 && (
                  <Chip
                    label="Vencido"
                    color="error"
                    size="small"
                    sx={{ ml: 1 }}
                  />
                )}
              </Box>
            )}

            {estado === 'completado' && respuesta?.fecha_completado && (
              <Typography variant="caption" color="text.secondary">
                Completado: {formatearFecha(respuesta.fecha_completado)}
              </Typography>
            )}
          </CardContent>

          <CardActions>
            {estado === 'pendiente' && (
              <Button
                startIcon={<StartIcon />}
                onClick={() => handleIniciarCuestionario(cuestionario.id)}
                variant="contained"
                fullWidth
                disabled={!cuestionarioAsignado.puede_responder}
              >
                Iniciar Cuestionario
              </Button>
            )}
            
            {estado === 'en_progreso' && (
              <Button
                startIcon={<InProgressIcon />}
                onClick={() => handleContinuarCuestionario(cuestionario.id)}
                variant="contained"
                color="info"
                fullWidth
              >
                Continuar ({progreso}%)
              </Button>
            )}
            
            {estado === 'completado' && (
              <Button
                startIcon={<CompletedIcon />}
                onClick={() => handleVerRespuestas(cuestionario.id)}
                variant="outlined"
                fullWidth
              >
                Ver Respuestas
              </Button>
            )}
          </CardActions>
        </Card>
      </Grid>
    );
  };

  const renderTabContent = () => {
    let cuestionariosFiltrados: CuestionarioAsignado[] = [];
    
    switch (tabValue) {
      case 0: // Todos
        cuestionariosFiltrados = cuestionarios;
        break;
      case 1: // Pendientes
        cuestionariosFiltrados = cuestionariosPendientes;
        break;
      case 2: // En progreso
        cuestionariosFiltrados = cuestionariosEnProgreso;
        break;
      case 3: // Completados
        cuestionariosFiltrados = cuestionariosCompletados;
        break;
    }

    if (cuestionariosFiltrados.length === 0) {
      const mensajes = [
        'No tienes cuestionarios asignados.',
        'No tienes cuestionarios pendientes.',
        'No tienes cuestionarios en progreso.',
        'No has completado ningún cuestionario aún.'
      ];
      
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          {mensajes[tabValue]}
        </Alert>
      );
    }

    return (
      <Grid container spacing={2} sx={{ mt: 1 }}>
        {cuestionariosFiltrados.map(renderCuestionarioCard)}
      </Grid>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton
            color="inherit"
            onClick={() => navigate('/dashboard')}
            sx={{ mr: 2 }}
            aria-label="Regresar al dashboard"
          >
            <ArrowBackIcon />
          </IconButton>
          <AssignmentIcon sx={{ mr: 2 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="div">
              Mis Cuestionarios
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Cuestionarios asignados para {user?.rol}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        {/* Estadísticas rápidas */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color="primary">
                  {cuestionarios.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color="warning.main">
                  {cuestionariosPendientes.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pendientes
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color="info.main">
                  {cuestionariosEnProgreso.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  En Progreso
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color="success.main">
                  {cuestionariosCompletados.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completados
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs para filtrar */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="Todos" />
            <Tab 
              label={
                <Badge badgeContent={cuestionariosPendientes.length} color="warning">
                  Pendientes
                </Badge>
              } 
            />
            <Tab 
              label={
                <Badge badgeContent={cuestionariosEnProgreso.length} color="info">
                  En Progreso
                </Badge>
              } 
            />
            <Tab 
              label={
                <Badge badgeContent={cuestionariosCompletados.length} color="success">
                  Completados
                </Badge>
              } 
            />
          </Tabs>
        </Box>

        {/* Contenido de las tabs */}
        {renderTabContent()}
      </Box>
    </Box>
  );
};

export default CuestionariosAsignadosPage;
