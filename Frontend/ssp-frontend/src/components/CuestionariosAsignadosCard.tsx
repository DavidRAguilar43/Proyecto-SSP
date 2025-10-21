import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
  LinearProgress,
  Alert,
  CircularProgress,
  Grid
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  PlayArrow as StartIcon,
  CheckCircle as CompletedIcon,
  Schedule as PendingIcon,
  Edit as InProgressIcon
} from '@mui/icons-material';
import { AuthContext } from '@/contexts/AuthContext';
import { cuestionariosUsuarioApi } from '@/services/api';
import type { CuestionarioAsignado, EstadoRespuesta } from '@/types/cuestionarios';

/**
 * Componente de tarjeta que muestra los cuestionarios asignados al usuario
 * Se muestra en el dashboard principal del usuario
 */
const CuestionariosAsignadosCard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [cuestionarios, setCuestionarios] = useState<CuestionarioAsignado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar cuestionarios asignados
  useEffect(() => {
    const cargarCuestionarios = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await cuestionariosUsuarioApi.getCuestionariosAsignados();
        setCuestionarios(response.cuestionarios_asignados || []);
      } catch (error: any) {
        console.error('Error al cargar cuestionarios:', error);
        setError('No se pudieron cargar los cuestionarios');
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      cargarCuestionarios();
    }
  }, [user?.id]);

  // Obtener color según el estado
  const getEstadoColor = (estado: EstadoRespuesta): 'warning' | 'info' | 'success' => {
    switch (estado) {
      case 'pendiente':
        return 'warning';
      case 'en_progreso':
        return 'info';
      case 'completado':
        return 'success';
      default:
        return 'warning';
    }
  };

  // Obtener ícono según el estado
  const getEstadoIcon = (estado: EstadoRespuesta) => {
    switch (estado) {
      case 'pendiente':
        return <PendingIcon fontSize="small" />;
      case 'en_progreso':
        return <InProgressIcon fontSize="small" />;
      case 'completado':
        return <CompletedIcon fontSize="small" />;
      default:
        return <PendingIcon fontSize="small" />;
    }
  };

  // Obtener etiqueta del estado
  const getEstadoLabel = (estado: EstadoRespuesta): string => {
    switch (estado) {
      case 'pendiente':
        return 'Pendiente';
      case 'en_progreso':
        return 'En Progreso';
      case 'completado':
        return 'Completado';
      default:
        return estado;
    }
  };

  // Manejar inicio de cuestionario
  const handleIniciarCuestionario = (cuestionarioId: string) => {
    navigate(`/usuario/cuestionarios/responder/${cuestionarioId}`);
  };

  // Manejar continuar cuestionario
  const handleContinuarCuestionario = (cuestionarioId: string) => {
    navigate(`/usuario/cuestionarios/responder/${cuestionarioId}`);
  };

  // Manejar ver respuestas
  const handleVerRespuestas = (cuestionarioId: string) => {
    navigate(`/usuario/cuestionarios/responder/${cuestionarioId}`);
  };

  // Manejar ver todos los cuestionarios
  const handleVerTodos = () => {
    navigate('/usuario/cuestionarios');
  };

  // Filtrar solo cuestionarios activos (pendientes o en progreso)
  const cuestionariosActivos = cuestionarios.filter(
    c => c.estado === 'pendiente' || c.estado === 'en_progreso'
  );

  // Mostrar solo los primeros 3 cuestionarios activos
  const cuestionariosMostrar = cuestionariosActivos.slice(0, 3);

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <AssignmentIcon sx={{ mr: 1, color: 'info.main' }} />
          Mis Cuestionarios
        </Typography>

        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" py={3}>
            <CircularProgress size={32} />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Cargando cuestionarios...
            </Typography>
          </Box>
        )}

        {!loading && error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && cuestionarios.length === 0 && (
          <Alert severity="info">
            No tienes cuestionarios asignados en este momento.
          </Alert>
        )}

        {!loading && !error && cuestionariosActivos.length === 0 && cuestionarios.length > 0 && (
          <Alert severity="success">
            ¡Felicidades! Has completado todos tus cuestionarios asignados.
          </Alert>
        )}

        {!loading && !error && cuestionariosMostrar.length > 0 && (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              📝 Tienes {cuestionariosActivos.length} cuestionario{cuestionariosActivos.length !== 1 ? 's' : ''} activo{cuestionariosActivos.length !== 1 ? 's' : ''}.
            </Alert>

            <Grid container spacing={2}>
              {cuestionariosMostrar.map((cuestionarioAsignado) => {
                const { cuestionario, estado, respuesta } = cuestionarioAsignado;
                const progreso = respuesta?.progreso_porcentaje || 0;

                return (
                  <Grid item xs={12} key={cuestionario.id}>
                    <Box
                      sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        '&:hover': {
                          bgcolor: 'action.hover',
                          borderColor: 'primary.main'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'medium', flex: 1 }}>
                          {cuestionario.titulo}
                        </Typography>
                        <Chip
                          icon={getEstadoIcon(estado)}
                          label={getEstadoLabel(estado)}
                          color={getEstadoColor(estado)}
                          size="small"
                        />
                      </Box>

                      {cuestionario.descripcion && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {cuestionario.descripcion}
                        </Typography>
                      )}

                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        {cuestionario.total_preguntas} pregunta{cuestionario.total_preguntas !== 1 ? 's' : ''}
                      </Typography>

                      {estado === 'en_progreso' && (
                        <Box sx={{ mb: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              Progreso
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {progreso}%
                            </Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={progreso} />
                        </Box>
                      )}

                      <Box sx={{ mt: 2 }}>
                        {estado === 'pendiente' && (
                          <Button
                            startIcon={<StartIcon />}
                            onClick={() => handleIniciarCuestionario(cuestionario.id)}
                            variant="contained"
                            size="small"
                            fullWidth
                            disabled={!cuestionarioAsignado.puede_responder}
                          >
                            Contestar
                          </Button>
                        )}

                        {estado === 'en_progreso' && (
                          <Button
                            startIcon={<InProgressIcon />}
                            onClick={() => handleContinuarCuestionario(cuestionario.id)}
                            variant="contained"
                            color="info"
                            size="small"
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
                            size="small"
                            fullWidth
                          >
                            Ver Respuestas
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        )}
      </CardContent>

      {!loading && !error && cuestionarios.length > 0 && (
        <CardActions sx={{ px: 2, pb: 2 }}>
          <Button
            variant="outlined"
            color="info"
            startIcon={<AssignmentIcon />}
            onClick={handleVerTodos}
            fullWidth
          >
            Ver Todos ({cuestionarios.length})
          </Button>
        </CardActions>
      )}
    </Card>
  );
};

export default CuestionariosAsignadosCard;

