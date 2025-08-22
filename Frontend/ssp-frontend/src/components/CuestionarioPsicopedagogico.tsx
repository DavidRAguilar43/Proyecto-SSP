import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  CircularProgress,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Paper,
  IconButton
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { api } from '@/services/api';

interface CuestionarioPsicopedagogicoProps {
  open: boolean;
  onClose: () => void;
  personaId: number;
  onSuccess?: () => void;
}

interface Preguntas {
  [key: string]: string;
}

interface Respuestas {
  [key: string]: string;
}

const CuestionarioPsicopedagogico: React.FC<CuestionarioPsicopedagogicoProps> = ({
  open,
  onClose,
  personaId,
  onSuccess
}) => {
  const [preguntas, setPreguntas] = useState<Preguntas>({});
  const [respuestas, setRespuestas] = useState<Respuestas>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [yaCompletado, setYaCompletado] = useState(false);

  // Cargar preguntas cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      cargarPreguntas();
      verificarEstadoCuestionario();
    }
  }, [open, personaId]);

  const cargarPreguntas = async () => {
    try {
      const response = await api.get('/cuestionario-psicopedagogico/preguntas');
      setPreguntas(response.data);
      
      // Inicializar respuestas vacías
      const respuestasIniciales: Respuestas = {};
      Object.keys(response.data).forEach(key => {
        respuestasIniciales[key] = '';
      });
      setRespuestas(respuestasIniciales);
    } catch (error) {
      console.error('Error cargando preguntas:', error);
      setError('Error al cargar las preguntas del cuestionario');
    }
  };

  const verificarEstadoCuestionario = async () => {
    try {
      const response = await api.get(`/cuestionario-psicopedagogico/estudiante/${personaId}`);
      if (response.data.completado) {
        setYaCompletado(true);
      }
    } catch (error) {
      console.error('Error verificando estado del cuestionario:', error);
    }
  };

  const handleRespuestaChange = (pregunta: string, valor: string) => {
    setRespuestas(prev => ({
      ...prev,
      [pregunta]: valor
    }));
  };

  const handleSubmit = async () => {
    // Validar que todas las preguntas estén respondidas
    const preguntasVacias = Object.keys(preguntas).filter(key => !respuestas[key]?.trim());
    if (preguntasVacias.length > 0) {
      setError('Por favor, responde todas las preguntas antes de continuar');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.post('/cuestionario-psicopedagogico/completar', {
        respuestas,
        id_persona: personaId
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
        setSuccess(false);
        setRespuestas({});
      }, 2000);
    } catch (error: any) {
      console.error('Error enviando cuestionario:', error);
      setError(error.response?.data?.detail || 'Error al enviar el cuestionario');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setError(null);
      setSuccess(false);
      setRespuestas({});
    }
  };

  if (yaCompletado) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <IconButton
              onClick={handleClose}
              sx={{ mr: 1 }}
              aria-label="Regresar"
            >
              <ArrowBackIcon />
            </IconButton>
            Cuestionario Psicopedagógico
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info">
            Ya has completado el cuestionario psicopedagógico.
            El personal académico revisará tus respuestas y te contactará si es necesario.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" mb={1}>
          <IconButton
            onClick={handleClose}
            sx={{ mr: 1 }}
            aria-label="Regresar"
          >
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h5" component="div">
              Cuestionario Psicopedagógico
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Este cuestionario nos ayudará a entender mejor tus necesidades académicas y brindarte el apoyo adecuado.
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            ¡Cuestionario enviado exitosamente! El personal académico revisará tus respuestas.
          </Alert>
        )}

        <Box sx={{ mt: 2 }}>
          {Object.entries(preguntas).map(([key, pregunta], index) => (
            <Paper key={key} elevation={1} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Pregunta {index + 1}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {pregunta}
              </Typography>

              {key === 'pregunta_1' ? (
                // Pregunta 1: Opciones múltiples
                <FormControl component="fieldset">
                  <RadioGroup
                    value={respuestas[key] || ''}
                    onChange={(e) => handleRespuestaChange(key, e.target.value)}
                  >
                    <FormControlLabel value="Muy satisfecho" control={<Radio />} label="Muy satisfecho" />
                    <FormControlLabel value="Satisfecho" control={<Radio />} label="Satisfecho" />
                    <FormControlLabel value="Regular" control={<Radio />} label="Regular" />
                    <FormControlLabel value="Insatisfecho" control={<Radio />} label="Insatisfecho" />
                    <FormControlLabel value="Muy insatisfecho" control={<Radio />} label="Muy insatisfecho" />
                  </RadioGroup>
                </FormControl>
              ) : (
                // Preguntas 2 y 3: Texto libre
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  value={respuestas[key] || ''}
                  onChange={(e) => handleRespuestaChange(key, e.target.value)}
                  placeholder="Escribe tu respuesta aquí..."
                  variant="outlined"
                />
              )}
            </Paper>
          ))}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Enviando...' : 'Enviar Cuestionario'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CuestionarioPsicopedagogico;
