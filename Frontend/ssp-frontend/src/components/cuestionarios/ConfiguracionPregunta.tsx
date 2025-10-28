import React, { useState } from 'react';
import {
  Box,
  TextField,
  FormControlLabel,
  Switch,
  Typography,
  Chip,
  IconButton,
  Button,
  Slider,
  Collapse,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import type { TipoPregunta, ConfiguracionPregunta } from '@/types/cuestionarios';

interface ConfiguracionPreguntaProps {
  tipo: TipoPregunta;
  configuracion: ConfiguracionPregunta;
  onChange: (configuracion: ConfiguracionPregunta) => void;
}

/**
 * Componente para configurar las opciones específicas de cada tipo de pregunta
 */
const ConfiguracionPreguntaComponent: React.FC<ConfiguracionPreguntaProps> = ({
  tipo,
  configuracion,
  onChange
}) => {
  const [expanded, setExpanded] = useState(false);
  const updateConfig = (updates: Partial<ConfiguracionPregunta>) => {
    onChange({ ...configuracion, ...updates });
  };

  const agregarOpcion = () => {
    const opciones = configuracion.opciones || [];
    updateConfig({ opciones: [...opciones, ''] });
  };

  const eliminarOpcion = (index: number) => {
    const opciones = configuracion.opciones || [];
    updateConfig({ opciones: opciones.filter((_, i) => i !== index) });
  };

  const actualizarOpcion = (index: number, valor: string) => {
    const opciones = configuracion.opciones || [];
    const nuevasOpciones = [...opciones];
    nuevasOpciones[index] = valor;
    updateConfig({ opciones: nuevasOpciones });
  };

  // Renderizado específico según el tipo de pregunta
  const renderConfiguracion = () => {
    switch (tipo) {
      case 'abierta':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
             <TextField
              label="Longitud mínima"
              type="number"
              value={configuracion.longitud_minima || ''}
              onChange={(e) => updateConfig({ longitud_minima: parseInt(e.target.value) || undefined })}
              helperText="Mínimo número de caracteres requeridos"
              inputProps={{ min: 0, max: 1000 }}
            />
            <TextField
              label="Límite de caracteres"
              type="number"
              value={configuracion.limite_caracteres || ''}
              onChange={(e) => updateConfig({ limite_caracteres: parseInt(e.target.value) || undefined })}
              helperText="Máximo número de caracteres permitidos (opcional)"
              inputProps={{ min: 1, max: 5000 }}
            />
          </Box>
        );

      case 'opcion_multiple':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={configuracion.seleccion_multiple || false}
                  onChange={(e) => updateConfig({ seleccion_multiple: e.target.checked })}
                />
              }
              label="Permitir selección múltiple"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={configuracion.permitir_otro || false}
                  onChange={(e) => updateConfig({ permitir_otro: e.target.checked })}
                />
              }
              label="Incluir opción 'Otro' con campo de texto"
            />
            {renderOpcionesEditor()}
          </Box>
        );

      case 'verdadero_falso':
        return (
          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Las preguntas de Verdadero/Falso no requieren configuración adicional.
              Se mostrarán automáticamente dos opciones: "Verdadero" y "Falso".
            </Typography>
          </Box>
        );

      case 'select':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Opción por defecto"
              value={configuracion.opcion_por_defecto || ''}
              onChange={(e) => updateConfig({ opcion_por_defecto: e.target.value })}
              helperText="Texto que se mostrará como opción por defecto (opcional)"
              placeholder="Seleccione una opción..."
            />
            {renderOpcionesEditor()}
          </Box>
        );

      case 'checkbox':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Mínimo de selecciones"
              type="number"
              value={configuracion.minimo_selecciones || ''}
              onChange={(e) => updateConfig({ minimo_selecciones: parseInt(e.target.value) || undefined })}
              helperText="Número mínimo de opciones que debe seleccionar el usuario"
              inputProps={{ min: 0, max: 10 }}
            />
            <TextField
              label="Máximo de selecciones"
              type="number"
              value={configuracion.maximo_selecciones || ''}
              onChange={(e) => updateConfig({ maximo_selecciones: parseInt(e.target.value) || undefined })}
              helperText="Número máximo de opciones que puede seleccionar el usuario"
              inputProps={{ min: 1, max: 15 }}
            />
            {renderOpcionesEditor()}
          </Box>
        );

      case 'radio_button':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Los botones de opción permiten selección única obligatoria.
            </Typography>
            {renderOpcionesEditor()}
          </Box>
        );

      case 'escala_likert':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography gutterBottom>Puntos de la escala: {configuracion.puntos_escala || 5}</Typography>
              <Slider
                value={configuracion.puntos_escala || 5}
                onChange={(_, value) => updateConfig({ puntos_escala: value as number })}
                min={3}
                max={10}
                step={1}
                marks
                valueLabelDisplay="auto"
              />
            </Box>
            <TextField
              label="Etiqueta mínima"
              value={configuracion.etiqueta_minima || ''}
              onChange={(e) => updateConfig({ etiqueta_minima: e.target.value })}
              helperText="Texto para el valor mínimo de la escala"
              placeholder="Muy en desacuerdo"
            />
            <TextField
              label="Etiqueta máxima"
              value={configuracion.etiqueta_maxima || ''}
              onChange={(e) => updateConfig({ etiqueta_maxima: e.target.value })}
              helperText="Texto para el valor máximo de la escala"
              placeholder="Muy de acuerdo"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={configuracion.mostrar_numeros !== false}
                  onChange={(e) => updateConfig({ mostrar_numeros: e.target.checked })}
                />
              }
              label="Mostrar números en la escala"
            />
          </Box>
        );

      default:
        return (
          <Typography variant="body2" color="text.secondary">
            Seleccione un tipo de pregunta para ver las opciones de configuración.
          </Typography>
        );
    }
  };

  const renderOpcionesEditor = () => {
    const opciones = configuracion.opciones || [];
    const tipoRequiereOpciones = ['opcion_multiple', 'select', 'checkbox', 'radio_button'].includes(tipo);
    
    if (!tipoRequiereOpciones) return null;

    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle2">
            Opciones ({opciones.length})
          </Typography>
          <Button
            startIcon={<AddIcon />}
            onClick={agregarOpcion}
            size="small"
            disabled={opciones.length >= (tipo === 'select' ? 15 : 10)}
          >
            Agregar Opción
          </Button>
        </Box>

        {opciones.length === 0 && (
          <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 1, mb: 2 }}>
            <Typography variant="body2">
              Debe agregar al menos 2 opciones para este tipo de pregunta.
            </Typography>
          </Box>
        )}

        {opciones.map((opcion, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <DragIcon sx={{ color: 'grey.400', cursor: 'grab' }} />
            <TextField
              fullWidth
              size="small"
              value={opcion}
              onChange={(e) => actualizarOpcion(index, e.target.value)}
              placeholder={`Escriba aquí opción ${index + 1}`}
              error={!opcion.trim()}
              helperText={!opcion.trim() ? 'La opción no puede estar vacía' : ''}
            />
            <IconButton
              onClick={() => eliminarOpcion(index)}
              disabled={opciones.length <= 2}
              color="error"
              size="small"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        ))}

        {opciones.length < 2 && (
          <Typography variant="caption" color="error">
            Se requieren al menos 2 opciones
          </Typography>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ mt: 2 }}>
      {/* Header colapsable */}
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          bgcolor: 'grey.50',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'grey.100'
          }
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              Configuración
            </Typography>
            <Chip size="small" label={tipo.replace('_', ' ')} variant="outlined" />
          </Box>
          <IconButton size="small">
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </Paper>

      {/* Contenido colapsable */}
      <Collapse in={expanded}>
        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
          {renderConfiguracion()}
        </Box>
      </Collapse>
    </Box>
  );
};

export default ConfiguracionPreguntaComponent;
