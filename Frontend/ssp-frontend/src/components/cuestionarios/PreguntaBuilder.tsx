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
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TipoPreguntaSelector from './TipoPreguntaSelector';
import ConfiguracionPreguntaComponent from './ConfiguracionPregunta';
import VistaPreviaPregunta from './VistaPreviaPregunta';
import type { Pregunta, TipoPregunta, ConfiguracionPregunta } from '@/types/cuestionarios';

interface PreguntaBuilderProps {
  pregunta: Pregunta;
  onChange: (pregunta: Pregunta) => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  onCambioOrden?: (nuevoOrden: number) => void;
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
  onCambioOrden,
  index,
  totalPreguntas,
  errors = []
}) => {
  const [expanded, setExpanded] = useState(false); // Colapsado por defecto
  const [showPreview, setShowPreview] = useState(false);

  // Hook para drag & drop
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: pregunta.id });

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

  // Colores alternados: azul claro para pares, anaranjado claro para impares
  const backgroundColor = index % 2 === 0
    ? 'rgba(33, 150, 243, 0.08)'  // Azul claro
    : 'rgba(255, 152, 0, 0.08)';   // Anaranjado claro

  // Obtener nombre legible del tipo de pregunta
  const getTipoNombre = (tipo: TipoPregunta): string => {
    const tipos: Record<TipoPregunta, string> = {
      'abierta': 'Texto Abierto',
      'opcion_multiple': 'Opción Múltiple',
      'select': 'Selección',
      'checkbox': 'Casillas de Verificación',
      'radio_button': 'Botones de Radio',
      'escala_likert': 'Escala Likert'
    };
    return tipos[tipo] || tipo;
  };

  // Estilos para drag & drop
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      sx={{
        mb: 2,
        border: hasErrors ? '2px solid' : '1px solid',
        borderColor: hasErrors ? 'error.main' : 'divider',
        bgcolor: backgroundColor,
        '&:hover': {
          boxShadow: 2
        }
      }}
    >
      {/* HEADER COLAPSABLE - Siempre visible */}
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'action.hover'
          }
        }}
      >
        <Box
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          sx={{
            cursor: 'grab',
            display: 'flex',
            alignItems: 'center',
            '&:active': {
              cursor: 'grabbing'
            }
          }}
        >
          <DragIcon sx={{ color: 'grey.400' }} />
        </Box>

        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 'bold' }}>
              Pregunta {index + 1}
            </Typography>
            {pregunta.obligatoria && (
              <Typography variant="caption" color="error" sx={{ fontWeight: 'bold' }}>
                *Obligatoria
              </Typography>
            )}
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            {pregunta.texto || 'Sin texto'}
          </Typography>

          <Typography variant="caption" color="primary" sx={{ fontWeight: 'medium' }}>
            Tipo: {getTipoNombre(pregunta.tipo)}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            color="error"
            disabled={totalPreguntas <= 1}
            title="Eliminar pregunta"
            size="small"
          >
            <DeleteIcon />
          </IconButton>

          <IconButton size="small">
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </Box>

      {/* CONTENIDO EXPANDIBLE */}
      <Collapse in={expanded}>
        <CardContent sx={{ pt: 0 }}>
          <Divider sx={{ mb: 2 }} />

          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
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

          {/* Opciones de la pregunta */}
          <Box sx={{ mt: 3 }}>
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

          {/* Botones de acción */}
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            {onDuplicate && (
              <Button
                onClick={onDuplicate}
                size="small"
                variant="outlined"
              >
                Duplicar
              </Button>
            )}

            <TextField
              label="Orden de pregunta"
              type="number"
              value={index + 1}
              onChange={(e) => {
                const nuevoOrden = parseInt(e.target.value);
                if (onCambioOrden && !isNaN(nuevoOrden)) {
                  onCambioOrden(nuevoOrden);
                }
              }}
              helperText="Posición de la pregunta en el cuestionario"
              inputProps={{ min: 1, max: totalPreguntas }}
              size="small"
              sx={{ maxWidth: 200 }}
            />
          </Box>
        </CardContent>
      </Collapse>
    </Card>
  );
};

export default PreguntaBuilder;
