import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  Chip,
  Paper,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  Close as CloseIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import VistaPreviaPregunta from './VistaPreviaPregunta';
import { getTipoUsuarioLabel } from './AsignacionUsuarios';
import type { CuestionarioAdmin } from '@/types/cuestionarios';

interface VistaPreviaModalProps {
  open: boolean;
  onClose: () => void;
  cuestionario: CuestionarioAdmin;
}

/**
 * Modal para mostrar la vista previa completa del cuestionario
 */
const VistaPreviaModal: React.FC<VistaPreviaModalProps> = ({
  open,
  onClose,
  cuestionario
}) => {
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [modoVisualizacion, setModoVisualizacion] = useState<'completo' | 'paso_a_paso'>('completo');

  const handleSiguientePregunta = () => {
    if (preguntaActual < cuestionario.preguntas.length - 1) {
      setPreguntaActual(preguntaActual + 1);
    }
  };

  const handlePreguntaAnterior = () => {
    if (preguntaActual > 0) {
      setPreguntaActual(preguntaActual - 1);
    }
  };

  const formatearFecha = (fecha?: string) => {
    if (!fecha) return 'No especificada';
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VisibilityIcon />
            <Typography variant="h6">Vista Previa del Cuestionario</Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Información del cuestionario */}
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
          <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
            {cuestionario.titulo}
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {cuestionario.descripcion}
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            <Chip 
              label={`${cuestionario.preguntas.length} preguntas`} 
              color="primary" 
              variant="outlined" 
            />
            <Chip 
              label={cuestionario.estado} 
              color={cuestionario.estado === 'activo' ? 'success' : 'default'}
              variant="outlined" 
            />
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

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Fecha de inicio:
              </Typography>
              <Typography variant="body2">
                {formatearFecha(cuestionario.fecha_inicio)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Fecha de fin:
              </Typography>
              <Typography variant="body2">
                {formatearFecha(cuestionario.fecha_fin)}
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Controles de visualización */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant={modoVisualizacion === 'completo' ? 'contained' : 'outlined'}
              onClick={() => setModoVisualizacion('completo')}
              size="small"
            >
              Vista Completa
            </Button>
            <Button
              variant={modoVisualizacion === 'paso_a_paso' ? 'contained' : 'outlined'}
              onClick={() => setModoVisualizacion('paso_a_paso')}
              size="small"
            >
              Paso a Paso
            </Button>
          </Box>
        </Box>

        {/* Contenido según el modo de visualización */}
        {modoVisualizacion === 'completo' ? (
          // Vista completa - todas las preguntas
          <Box>
            {cuestionario.preguntas.map((pregunta, index) => (
              <Paper key={pregunta.id} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 1, color: 'primary.main' }}>
                  Pregunta {index + 1}
                </Typography>
                <VistaPreviaPregunta pregunta={pregunta} disabled />
              </Paper>
            ))}
          </Box>
        ) : (
          // Vista paso a paso - una pregunta a la vez
          <Box>
            {/* Indicador de progreso */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Pregunta {preguntaActual + 1} de {cuestionario.preguntas.length}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {cuestionario.preguntas.map((_, index) => (
                  <Box
                    key={index}
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: index === preguntaActual ? 'primary.main' : 'grey.300',
                      cursor: 'pointer'
                    }}
                    onClick={() => setPreguntaActual(index)}
                  />
                ))}
              </Box>
            </Box>

            {/* Pregunta actual */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <VistaPreviaPregunta 
                pregunta={cuestionario.preguntas[preguntaActual]} 
                disabled 
              />
            </Paper>

            {/* Controles de navegación */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button
                startIcon={<PrevIcon />}
                onClick={handlePreguntaAnterior}
                disabled={preguntaActual === 0}
                variant="outlined"
              >
                Anterior
              </Button>
              
              <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
                {preguntaActual + 1} / {cuestionario.preguntas.length}
              </Typography>
              
              <Button
                endIcon={<NextIcon />}
                onClick={handleSiguientePregunta}
                disabled={preguntaActual === cuestionario.preguntas.length - 1}
                variant="outlined"
              >
                Siguiente
              </Button>
            </Box>
          </Box>
        )}

        {/* Información adicional */}
        <Paper sx={{ p: 2, mt: 3, bgcolor: 'info.light', color: 'info.contrastText' }}>
          <Typography variant="body2">
            <strong>Nota:</strong> Esta es una vista previa de cómo verán el cuestionario los usuarios finales.
            Las respuestas no se guardarán en esta vista previa.
          </Typography>
        </Paper>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Cerrar Vista Previa
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VistaPreviaModal;
