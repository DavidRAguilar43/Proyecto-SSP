import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  TextField,
  FormControlLabel,
  Switch,
  IconButton,
  Button,
  Box,
  Typography,
  Collapse,
  Alert,
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Visibility as PreviewIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import TipoPreguntaSelector from './TipoPreguntaSelector';
import ConfiguracionPreguntaComponent from './ConfiguracionPregunta';
import VistaPreviaPregunta from './VistaPreviaPregunta';
import type { Pregunta, TipoPregunta, ConfiguracionPregunta } from '@/types/cuestionarios';

interface PreguntaBuilderProps {
  pregunta: Pregunta;
  onChange: (pregunta: Pregunta) => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  index: number;
  totalPreguntas: number;
  errors?: string[];
}

/**
 * Componente para construir y editar una pregunta individual
 */
const PreguntaBuilder: React.FC<PreguntaBuilderProps> = ({
  pregunta,
  onChange,
  onDelete,
  onDuplicate,
  index,
  totalPreguntas,
  errors = []
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const updatePregunta = (updates: Partial<Pregunta>) => {
    onChange({ ...pregunta, ...updates });
  };

  const handleTipoChange = (tipo: TipoPregunta) => {
    // Limpiar configuración cuando cambia el tipo
    const nuevaConfiguracion: ConfiguracionPregunta = {};
    
    // Configuración por defecto según el tipo
    switch (tipo) {
      case 'opcion_multiple':
        nuevaConfiguracion.opciones = ['Opción 1', 'Opción 2'];
        nuevaConfiguracion.seleccion_multiple = false;
        break;
      case 'select':
        nuevaConfiguracion.opciones = ['Opción 1', 'Opción 2'];
        break;
      case 'checkbox':
        nuevaConfiguracion.opciones = ['Opción 1', 'Opción 2'];
        nuevaConfiguracion.minimo_selecciones = 1;
        break;
      case 'radio_button':
        nuevaConfiguracion.opciones = ['Opción 1', 'Opción 2'];
        break;
      case 'escala_likert':
        nuevaConfiguracion.puntos_escala = 5;
        nuevaConfiguracion.etiqueta_minima = 'Muy en desacuerdo';
        nuevaConfiguracion.etiqueta_maxima = 'Muy de acuerdo';
        nuevaConfiguracion.mostrar_numeros = true;
        break;
      case 'abierta':
        nuevaConfiguracion.limite_caracteres = 500;
        break;
    }

    updatePregunta({ tipo, configuracion: nuevaConfiguracion });
  };

  const handleConfiguracionChange = (configuracion: ConfiguracionPregunta) => {
    updatePregunta({ configuracion });
  };

  const hasErrors = errors.length > 0;

  return (
    <Card 
      sx={{ 
        mb: 2, 
        border: hasErrors ? '2px solid' : '1px solid',
        borderColor: hasErrors ? 'error.main' : 'divider',
        '&:hover': {
          boxShadow: 2
        }
      }}
    >
      <CardContent>
        {/* Header con información básica */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
          <DragIcon sx={{ color: 'grey.400', cursor: 'grab', mt: 1 }} />
          
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="h6" component="h3">
                Pregunta {index + 1}
              </Typography>
              {pregunta.obligatoria && (
                <Typography variant="caption" color="error" sx={{ fontWeight: 'bold' }}>
                  *Obligatoria
                </Typography>
              )}
            </Box>

            {/* Campo de texto de la pregunta */}
            <TextField
              fullWidth
              label="Texto de la pregunta"
              value={pregunta.texto}
              onChange={(e) => updatePregunta({ texto: e.target.value })}
              error={!pregunta.texto.trim()}
              helperText={!pregunta.texto.trim() ? 'El texto de la pregunta es obligatorio' : ''}
              multiline
              rows={2}
              sx={{ mb: 2 }}
            />

            {/* Descripción opcional */}
            <TextField
              fullWidth
              label="Descripción (opcional)"
              value={pregunta.descripcion || ''}
              onChange={(e) => updatePregunta({ descripcion: e.target.value })}
              helperText="Información adicional para ayudar al usuario a responder"
              multiline
              rows={1}
              sx={{ mb: 2 }}
            />

            {/* Selector de tipo de pregunta */}
            <TipoPreguntaSelector
              value={pregunta.tipo}
              onChange={handleTipoChange}
            />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <IconButton
              onClick={() => setShowPreview(!showPreview)}
              color={showPreview ? 'primary' : 'default'}
              title="Vista previa"
            >
              <PreviewIcon />
            </IconButton>
            <IconButton
              onClick={onDelete}
              color="error"
              disabled={totalPreguntas <= 1}
              title="Eliminar pregunta"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Errores de validación */}
        {hasErrors && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Errores en esta pregunta:
            </Typography>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {errors.map((error, idx) => (
                <li key={idx}>
                  <Typography variant="body2">{error}</Typography>
                </li>
              ))}
            </ul>
          </Alert>
        )}

        {/* Vista previa de la pregunta */}
        <Collapse in={showPreview}>
          <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Vista Previa:
            </Typography>
            <VistaPreviaPregunta pregunta={pregunta} />
          </Box>
        </Collapse>

        {/* Configuración específica del tipo de pregunta */}
        <ConfiguracionPreguntaComponent
          tipo={pregunta.tipo}
          configuracion={pregunta.configuracion}
          onChange={handleConfiguracionChange}
        />
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Box>
          <FormControlLabel
            control={
              <Switch
                checked={pregunta.obligatoria}
                onChange={(e) => updatePregunta({ obligatoria: e.target.checked })}
              />
            }
            label="Pregunta obligatoria"
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            startIcon={<ExpandMoreIcon />}
            onClick={() => setExpanded(!expanded)}
            size="small"
          >
            {expanded ? 'Menos opciones' : 'Más opciones'}
          </Button>
          
          {onDuplicate && (
            <Button
              onClick={onDuplicate}
              size="small"
              variant="outlined"
            >
              Duplicar
            </Button>
          )}
        </Box>
      </CardActions>

      {/* Opciones avanzadas */}
      <Collapse in={expanded}>
        <Box sx={{ px: 2, pb: 2 }}>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Opciones Avanzadas
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Orden"
              type="number"
              value={pregunta.orden}
              onChange={(e) => updatePregunta({ orden: parseInt(e.target.value) || index + 1 })}
              helperText="Posición de la pregunta en el cuestionario"
              inputProps={{ min: 1, max: totalPreguntas }}
              size="small"
              sx={{ maxWidth: 200 }}
            />
            
            <Typography variant="body2" color="text.secondary">
              ID de la pregunta: {pregunta.id}
            </Typography>
          </Box>
        </Box>
      </Collapse>
    </Card>
  );
};

export default PreguntaBuilder;
