import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Alert,
  Breadcrumbs,
  Link,
  CircularProgress,
  Paper,
  Chip,
  Divider,
  Button,
  Grid
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Assignment as AssignmentIcon,
  Home as HomeIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import VistaPreviaPregunta from '@/components/cuestionarios/VistaPreviaPregunta';
import { getTipoUsuarioLabel } from '@/components/cuestionarios/AsignacionUsuarios';
import { cuestionariosAdminApi } from '@/services/api';
import { useNotification } from '@/hooks/useNotification';
import type { CuestionarioAdmin } from '@/types/cuestionarios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Página para ver los detalles de un cuestionario administrativo (solo lectura)
 */
const VerCuestionarioPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showNotification } = useNotification();

  const [cuestionario, setCuestionario] = useState<CuestionarioAdmin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar cuestionario
  useEffect(() => {
    const cargarCuestionario = async () => {
      if (!id) {
        setError('ID de cuestionario no válido');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const cuestionarioData = await cuestionariosAdminApi.getById(id);
        setCuestionario(cuestionarioData);
      } catch (error: any) {
        console.error('Error al cargar cuestionario:', error);
        const errorMessage = error.response?.data?.detail || 'Error al cargar el cuestionario';
        setError(errorMessage);
        showNotification(errorMessage, 'error');
      } finally {
        setLoading(false);
      }
    };

    cargarCuestionario();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // Solo depende de id, showNotification se omite intencionalmente

  const formatearFecha = (fecha?: string) => {
    if (!fecha) return 'No especificada';
    try {
      return format(new Date(fecha), "dd/MM/yyyy HH:mm", { locale: es });
    } catch {
      return fecha;
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activo':
        return 'success';
      case 'borrador':
        return 'default';
      case 'inactivo':
        return 'error';
      case 'finalizado':
        return 'info';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !cuestionario) {
    return (
      <Box>
        <AppBar position="static" color="default" elevation={1}>
          <Toolbar>
            <IconButton edge="start" onClick={() => navigate('/admin/cuestionarios')} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6">Error al cargar cuestionario</Typography>
          </Toolbar>
        </AppBar>
        <Box sx={{ p: 3 }}>
          <Alert severity="error">{error || 'Cuestionario no encontrado'}</Alert>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton edge="start" onClick={() => navigate('/admin/cuestionarios')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <AssignmentIcon sx={{ mr: 2 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="div">
              Ver Cuestionario
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Detalles del cuestionario
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/admin/cuestionarios/editar/${id}`)}
          >
            Editar
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link
            underline="hover"
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            color="inherit"
            onClick={() => navigate('/dashboard')}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Dashboard
          </Link>
          <Link
            underline="hover"
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            color="inherit"
            onClick={() => navigate('/admin/cuestionarios')}
          >
            <AssignmentIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Cuestionarios
          </Link>
          <Typography color="text.primary">
            Ver: {cuestionario.titulo}
          </Typography>
        </Breadcrumbs>

        {/* Información del cuestionario */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <VisibilityIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h5" component="h1">
              {cuestionario.titulo}
            </Typography>
          </Box>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {cuestionario.descripcion}
          </Typography>

          <Divider sx={{ my: 2 }} />

          {/* Metadatos */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary">
                Estado
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip
                  label={cuestionario.estado}
                  color={getEstadoColor(cuestionario.estado)}
                  size="small"
                />
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary">
                Total de Preguntas
              </Typography>
              <Typography variant="body1" sx={{ mt: 0.5 }}>
                {cuestionario.total_preguntas}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary">
                Respuestas Recibidas
              </Typography>
              <Typography variant="body1" sx={{ mt: 0.5 }}>
                {cuestionario.total_respuestas || 0}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary">
                Creado por
              </Typography>
              <Typography variant="body1" sx={{ mt: 0.5 }}>
                {cuestionario.creado_por_nombre || 'Desconocido'}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" color="text.secondary">
                Fecha de Creación
              </Typography>
              <Typography variant="body1" sx={{ mt: 0.5 }}>
                {formatearFecha(cuestionario.fecha_creacion)}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" color="text.secondary">
                Fecha de Inicio
              </Typography>
              <Typography variant="body1" sx={{ mt: 0.5 }}>
                {formatearFecha(cuestionario.fecha_inicio)}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" color="text.secondary">
                Fecha de Fin
              </Typography>
              <Typography variant="body1" sx={{ mt: 0.5 }}>
                {formatearFecha(cuestionario.fecha_fin)}
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">
                Asignado a
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {cuestionario.tipos_usuario_asignados.map(tipo => (
                  <Chip
                    key={tipo}
                    label={getTipoUsuarioLabel(tipo)}
                    color="secondary"
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Preguntas */}
        <Typography variant="h6" sx={{ mb: 2 }}>
          Preguntas ({cuestionario.preguntas.length})
        </Typography>

        {cuestionario.preguntas.map((pregunta, index) => (
          <Paper key={pregunta.id} sx={{ p: 3, mb: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, color: 'primary.main', fontWeight: 'bold' }}>
              Pregunta {index + 1}
            </Typography>
            <VistaPreviaPregunta pregunta={pregunta} disabled />
          </Paper>
        ))}
      </Box>
    </Box>
  );
};

export default VerCuestionarioPage;

