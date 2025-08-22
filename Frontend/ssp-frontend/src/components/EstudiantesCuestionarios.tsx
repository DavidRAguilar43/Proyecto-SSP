import React, { useState, useEffect } from 'react';
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
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import { api } from '@/services/api';
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
  const [estudiantes, setEstudiantes] = useState<EstudianteConCuestionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reporteOpen, setReporteOpen] = useState(false);
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState<EstudianteConCuestionario | null>(null);

  useEffect(() => {
    cargarEstudiantesConCuestionarios();
  }, []);

  const cargarEstudiantesConCuestionarios = async () => {
    try {
      setLoading(true);
      const response = await api.get('/cuestionario-psicopedagogico/estudiantes-con-cuestionarios');
      setEstudiantes(response.data);
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

  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <NotificationsIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">
              Cuestionarios Psicopedagógicos Completados
            </Typography>
            <Badge 
              badgeContent={estudiantes.length} 
              color="error" 
              sx={{ ml: 2 }}
            >
              <PsychologyIcon />
            </Badge>
          </Box>

          {estudiantes.length === 0 ? (
            <Alert severity="info">
              No hay cuestionarios psicopedagógicos pendientes de revisión.
            </Alert>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {estudiantes.length} estudiante{estudiantes.length !== 1 ? 's han' : ' ha'} completado el cuestionario psicopedagógico
              </Typography>

              <List>
                {estudiantes.map((estudiante, index) => (
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
                          <PersonIcon color="primary" />
                        </Badge>
                      </ListItemIcon>
                      
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {estudiante.nombre_completo}
                            </Typography>
                            <Chip 
                              label="Nuevo" 
                              color="error" 
                              size="small" 
                              variant="outlined"
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
                    
                    {index < estudiantes.length - 1 && <Divider sx={{ my: 1 }} />}
                  </React.Fragment>
                ))}
              </List>
            </>
          )}
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
