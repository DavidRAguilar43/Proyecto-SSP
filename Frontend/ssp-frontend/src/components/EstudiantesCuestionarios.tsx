import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
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
  Button,
  Divider
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  Assessment as AssessmentIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  FiberNew as FiberNewIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { api } from '@/services/api';
import { notificationService } from '@/services/notificationService';
import { AuthContext } from '@/contexts/AuthContext';
import ReportePsicopedagogico from './ReportePsicopedagogico';

interface EstudianteConCuestionario {
  id: number;
  correo_institucional: string;
  matricula: string;
  nombre_completo: string;
  tiene_cuestionario: boolean;
  fecha_completado: string;
  id_cuestionario: number;
}

interface EstudiantesCuestionariosProps {
  onEstudianteSelect?: (estudiante: EstudianteConCuestionario) => void;
}

const EstudiantesCuestionarios: React.FC<EstudiantesCuestionariosProps> = ({
  onEstudianteSelect
}) => {
  const { user } = useContext(AuthContext);
  const [todosLosEstudiantes, setTodosLosEstudiantes] = useState<EstudianteConCuestionario[]>([]);
  const [estudiantesNoLeidos, setEstudiantesNoLeidos] = useState<EstudianteConCuestionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reporteOpen, setReporteOpen] = useState(false);
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState<EstudianteConCuestionario | null>(null);

  useEffect(() => {
    cargarEstudiantesConCuestionarios();

    // Limpiar cuestionarios antiguos al cargar el componente
    notificationService.limpiarCuestionariosAntiguos();
  }, []);

  const cargarEstudiantesConCuestionarios = async () => {
    try {
      setLoading(true);
      const response = await api.get('/cuestionario-psicopedagogico/estudiantes-con-cuestionarios');
      setTodosLosEstudiantes(response.data);

      // Filtrar solo cuestionarios no leídos para mostrar en el dashboard
      if (user?.id) {
        const noLeidos = response.data.filter((estudiante: EstudianteConCuestionario) =>
          !notificationService.estaLeido(estudiante.id_cuestionario, user.id)
        );
        setEstudiantesNoLeidos(noLeidos);
      }
    } catch (error: any) {
      console.error('Error cargando estudiantes:', error);
      setError(error.response?.data?.detail || 'Error al cargar estudiantes con cuestionarios');
    } finally {
      setLoading(false);
    }
  };

  const handleVerReporte = (estudiante: EstudianteConCuestionario) => {
    setEstudianteSeleccionado(estudiante);
    setReporteOpen(true);
    onEstudianteSelect?.(estudiante);

    // Marcar como leído si no lo estaba antes
    if (user?.id && !notificationService.estaLeido(estudiante.id_cuestionario, user.id)) {
      notificationService.marcarComoLeido(estudiante.id_cuestionario, user.id);

      // Remover inmediatamente del dashboard (filtrar cuestionarios no leídos)
      const nuevosNoLeidos = estudiantesNoLeidos.filter(e => e.id_cuestionario !== estudiante.id_cuestionario);
      setEstudiantesNoLeidos(nuevosNoLeidos);
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
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress />
            <Typography variant="body1" sx={{ ml: 2 }}>
              Cargando estudiantes con cuestionarios...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button onClick={cargarEstudiantesConCuestionarios} variant="outlined">
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Si no hay cuestionarios nuevos, no mostrar nada en el dashboard
  if (!loading && !error && estudiantesNoLeidos.length === 0) {
    return null;
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <NotificationsIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">
              Cuestionarios Nuevos Pendientes de Revisión
            </Typography>
            <Badge
              badgeContent={estudiantesNoLeidos.length}
              color="error"
              sx={{ ml: 2 }}
            >
              <PsychologyIcon />
            </Badge>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {estudiantesNoLeidos.length} cuestionario{estudiantesNoLeidos.length !== 1 ? 's nuevos' : ' nuevo'} pendiente{estudiantesNoLeidos.length !== 1 ? 's' : ''} de revisión
          </Typography>

              <List>
                {estudiantesNoLeidos.map((estudiante, index) => (
                  <React.Fragment key={estudiante.id}>
                    <ListItem
                      sx={{
                        bgcolor: 'action.hover',
                        borderRadius: 1,
                        mb: 1,
                        border: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      <ListItemIcon>
                        <Badge badgeContent="1" color="error">
                          <FiberNewIcon color="error" />
                        </Badge>
                      </ListItemIcon>

                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {estudiante.nombre_completo}
                            </Typography>
                            <Chip
                              label="NUEVO"
                              color="error"
                              size="small"
                              variant="filled"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {estudiante.correo_institucional}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Matrícula: {estudiante.matricula || 'No asignada'}
                            </Typography>
                            <Typography variant="caption" color="success.main">
                              Completado: {formatearFecha(estudiante.fecha_completado)}
                            </Typography>
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
                    
                    {index < estudiantesNoLeidos.length - 1 && <Divider sx={{ my: 1 }} />}
                  </React.Fragment>
                ))}
              </List>
        </CardContent>
      </Card>

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

export default EstudiantesCuestionarios;
