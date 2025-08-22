import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  Chip,
  Collapse,
  IconButton
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Info as InfoIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { api } from '@/services/api';

interface ReportePsicopedagogicoProps {
  open: boolean;
  onClose: () => void;
  personaId: number;
  personaNombre?: string;
}

interface CuestionarioReporte {
  id_cuestionario: number;
  respuestas: { [key: string]: string };
  reporte_ia: string;
  fecha_creacion: string;
  fecha_completado: string;
  id_persona: number;
}

const ReportePsicopedagogico: React.FC<ReportePsicopedagogicoProps> = ({
  open,
  onClose,
  personaId,
  personaNombre
}) => {
  const [reporte, setReporte] = useState<CuestionarioReporte | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mostrarDetalles, setMostrarDetalles] = useState(false);

  useEffect(() => {
    if (open && personaId) {
      cargarReporte();
    }
  }, [open, personaId]);

  const cargarReporte = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/cuestionario-psicopedagogico/reporte/${personaId}`);
      setReporte(response.data);
    } catch (error: any) {
      console.error('Error cargando reporte:', error);
      if (error.response?.status === 404) {
        setError('Este estudiante no ha completado el cuestionario psicopedagógico aún.');
      } else {
        setError(error.response?.data?.detail || 'Error al cargar el reporte');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fechaString: string) => {
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatearReporte = (reporteTexto: string) => {
    // Dividir el reporte en secciones basándose en los asteriscos
    const secciones = reporteTexto.split('**').filter(seccion => seccion.trim());
    
    return secciones.map((seccion, index) => {
      const lineas = seccion.split('\n').filter(linea => linea.trim());
      
      if (lineas.length === 0) return null;
      
      const titulo = lineas[0].trim();
      const contenido = lineas.slice(1).join('\n').trim();
      
      // Si es un título (contiene números o palabras clave)
      if (titulo.match(/^\d+\./) || titulo.includes('ANÁLISIS') || titulo.includes('FORTALEZAS') || 
          titulo.includes('ÁREAS') || titulo.includes('RECOMENDACIONES') || titulo.includes('SEGUIMIENTO')) {
        return (
          <Box key={index} sx={{ mb: 3 }}>
            <Typography variant="h6" color="primary" gutterBottom>
              {titulo}
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line', ml: 2 }}>
              {contenido}
            </Typography>
          </Box>
        );
      }
      
      return (
        <Typography key={index} variant="body1" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
          {seccion}
        </Typography>
      );
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" mb={1}>
          <IconButton
            onClick={onClose}
            sx={{ mr: 1 }}
            aria-label="Regresar"
          >
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h5" component="div">
              Reporte Psicopedagógico
            </Typography>
            {personaNombre && (
              <Typography variant="subtitle1" color="text.secondary">
                Estudiante: {personaNombre}
              </Typography>
            )}
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {reporte && !loading && (
          <Box>
            {/* Información del cuestionario */}
            <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Información del Cuestionario</Typography>
                <Chip 
                  label="Completado" 
                  color="success" 
                  size="small"
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                <strong>Fecha de creación:</strong> {formatearFecha(reporte.fecha_creacion)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Fecha de completado:</strong> {formatearFecha(reporte.fecha_completado)}
              </Typography>
            </Paper>

            {/* Respuestas del estudiante - Sección colapsable */}
            <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6" color="primary">
                  Respuestas del Estudiante
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<InfoIcon />}
                  endIcon={mostrarDetalles ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  onClick={() => setMostrarDetalles(!mostrarDetalles)}
                  size="small"
                >
                  {mostrarDetalles ? 'Ocultar Detalles' : 'Información Detallada'}
                </Button>
              </Box>

              <Collapse in={mostrarDetalles}>
                <Divider sx={{ mb: 2 }} />
                {Object.entries(reporte.respuestas).map(([pregunta, respuesta], index) => (
                  <Box key={pregunta} sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Pregunta {index + 1}:
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {pregunta === 'pregunta_1' && '¿Cómo te sientes actualmente con tu rendimiento académico?'}
                      {pregunta === 'pregunta_2' && '¿Qué dificultades principales enfrentas en tus estudios?'}
                      {pregunta === 'pregunta_3' && '¿Qué tipo de apoyo consideras que necesitas para mejorar tu desempeño académico?'}
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="body1">
                        {respuesta}
                      </Typography>
                    </Paper>
                  </Box>
                ))}
              </Collapse>

              {!mostrarDetalles && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Haz clic en "Información Detallada" para ver las respuestas completas del estudiante.
                  </Typography>
                </Alert>
              )}
            </Paper>

            {/* Reporte de IA */}
            <Paper elevation={1} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom color="primary">
                Análisis Psicopedagógico (Generado por IA)
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Box sx={{ '& > *': { mb: 2 } }}>
                {formatearReporte(reporte.reporte_ia)}
              </Box>
            </Paper>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="contained">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReportePsicopedagogico;
