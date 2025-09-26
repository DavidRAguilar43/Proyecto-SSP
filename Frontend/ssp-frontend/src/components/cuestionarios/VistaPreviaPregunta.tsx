import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  Select,
  MenuItem,
  Slider,
  FormGroup,
  InputLabel,
  FormHelperText
} from '@mui/material';
import type { Pregunta } from '@/types/cuestionarios';

interface VistaPreviaPreguntaProps {
  pregunta: Pregunta;
  value?: any;
  onChange?: (value: any) => void;
  disabled?: boolean;
  showValidation?: boolean;
}

/**
 * Componente que muestra la vista previa de cómo se verá la pregunta para el usuario final
 */
const VistaPreviaPregunta: React.FC<VistaPreviaPreguntaProps> = ({
  pregunta,
  value,
  onChange,
  disabled = false,
  showValidation = false
}) => {
  const [localValue, setLocalValue] = useState<any>(value || '');

  const handleChange = (newValue: any) => {
    setLocalValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  const renderPreguntaContent = () => {
    const { tipo, configuracion } = pregunta;

    switch (tipo) {
      case 'abierta':
        return (
          <TextField
            fullWidth
            multiline
            rows={4}
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            inputProps={{
              maxLength: configuracion.limite_caracteres
            }}
            helperText={
              configuracion.limite_caracteres 
                ? `${localValue.length}/${configuracion.limite_caracteres} caracteres`
                : undefined
            }
            error={showValidation && configuracion.longitud_minima && localValue.length < configuracion.longitud_minima}
          />
        );

      case 'opcion_multiple':
        if (configuracion.seleccion_multiple) {
          return (
            <FormGroup>
              {configuracion.opciones?.map((opcion, index) => (
                <FormControlLabel
                  key={index}
                  control={
                    <Checkbox
                      checked={Array.isArray(localValue) ? localValue.includes(opcion) : false}
                      onChange={(e) => {
                        const currentValues = Array.isArray(localValue) ? localValue : [];
                        if (e.target.checked) {
                          handleChange([...currentValues, opcion]);
                        } else {
                          handleChange(currentValues.filter(v => v !== opcion));
                        }
                      }}
                      disabled={disabled}
                    />
                  }
                  label={opcion}
                />
              ))}
              {configuracion.permitir_otro && (
                <Box sx={{ mt: 1 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={localValue?.includes('__otro__')}
                        onChange={(e) => {
                          const currentValues = Array.isArray(localValue) ? localValue : [];
                          if (e.target.checked) {
                            handleChange([...currentValues, '__otro__']);
                          } else {
                            handleChange(currentValues.filter(v => v !== '__otro__'));
                          }
                        }}
                        disabled={disabled}
                      />
                    }
                    label="Otro:"
                  />
                  {localValue?.includes('__otro__') && (
                    <TextField
                      size="small"
                      placeholder="Especifique..."
                      sx={{ ml: 4, mt: 1 }}
                      disabled={disabled}
                    />
                  )}
                </Box>
              )}
            </FormGroup>
          );
        } else {
          return (
            <FormControl component="fieldset">
              <RadioGroup
                value={localValue}
                onChange={(e) => handleChange(e.target.value)}
              >
                {configuracion.opciones?.map((opcion, index) => (
                  <FormControlLabel
                    key={index}
                    value={opcion}
                    control={<Radio disabled={disabled} />}
                    label={opcion}
                  />
                ))}
                {configuracion.permitir_otro && (
                  <Box>
                    <FormControlLabel
                      value="__otro__"
                      control={<Radio disabled={disabled} />}
                      label="Otro:"
                    />
                    {localValue === '__otro__' && (
                      <TextField
                        size="small"
                        placeholder="Especifique..."
                        sx={{ ml: 4, mt: 1 }}
                        disabled={disabled}
                      />
                    )}
                  </Box>
                )}
              </RadioGroup>
            </FormControl>
          );
        }

      case 'verdadero_falso':
        return (
          <FormControl component="fieldset">
            <RadioGroup
              value={localValue}
              onChange={(e) => handleChange(e.target.value)}
            >
              <FormControlLabel
                value="verdadero"
                control={<Radio disabled={disabled} />}
                label="Verdadero"
              />
              <FormControlLabel
                value="falso"
                control={<Radio disabled={disabled} />}
                label="Falso"
              />
            </RadioGroup>
          </FormControl>
        );

      case 'select':
        return (
          <FormControl fullWidth>
            <InputLabel>Seleccione una opción</InputLabel>
            <Select
              value={localValue}
              onChange={(e) => handleChange(e.target.value)}
              disabled={disabled}
              label="Seleccione una opción"
            >
              {configuracion.opcion_por_defecto && (
                <MenuItem value="" disabled>
                  {configuracion.opcion_por_defecto}
                </MenuItem>
              )}
              {configuracion.opciones?.map((opcion, index) => (
                <MenuItem key={index} value={opcion}>
                  {opcion}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'checkbox':
        return (
          <FormControl component="fieldset">
            <FormGroup>
              {configuracion.opciones?.map((opcion, index) => (
                <FormControlLabel
                  key={index}
                  control={
                    <Checkbox
                      checked={Array.isArray(localValue) ? localValue.includes(opcion) : false}
                      onChange={(e) => {
                        const currentValues = Array.isArray(localValue) ? localValue : [];
                        if (e.target.checked) {
                          handleChange([...currentValues, opcion]);
                        } else {
                          handleChange(currentValues.filter(v => v !== opcion));
                        }
                      }}
                      disabled={disabled}
                    />
                  }
                  label={opcion}
                />
              ))}
            </FormGroup>
            {(configuracion.minimo_selecciones || configuracion.maximo_selecciones) && (
              <FormHelperText>
                {configuracion.minimo_selecciones && `Mínimo: ${configuracion.minimo_selecciones} `}
                {configuracion.maximo_selecciones && `Máximo: ${configuracion.maximo_selecciones}`}
              </FormHelperText>
            )}
          </FormControl>
        );

      case 'radio_button':
        return (
          <FormControl component="fieldset">
            <RadioGroup
              value={localValue}
              onChange={(e) => handleChange(e.target.value)}
            >
              {configuracion.opciones?.map((opcion, index) => (
                <FormControlLabel
                  key={index}
                  value={opcion}
                  control={<Radio disabled={disabled} />}
                  label={opcion}
                />
              ))}
            </RadioGroup>
          </FormControl>
        );

      case 'escala_likert':
        const puntos = configuracion.puntos_escala || 5;
        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {configuracion.etiqueta_minima || 'Mínimo'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {configuracion.etiqueta_maxima || 'Máximo'}
              </Typography>
            </Box>
            <Slider
              value={localValue || 1}
              onChange={(_, value) => handleChange(value)}
              min={1}
              max={puntos}
              step={1}
              marks={configuracion.mostrar_numeros !== false}
              valueLabelDisplay="auto"
              disabled={disabled}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              {Array.from({ length: puntos }, (_, i) => (
                <Typography key={i} variant="caption" color="text.secondary">
                  {i + 1}
                </Typography>
              ))}
            </Box>
          </Box>
        );

      default:
        return (
          <Typography variant="body2" color="text.secondary">
            Vista previa no disponible para este tipo de pregunta.
          </Typography>
        );
    }
  };

  return (
    <Box>
      {/* Título de la pregunta */}
      <Typography variant="h6" component="h4" sx={{ mb: 1 }}>
        {pregunta.texto}
        {pregunta.obligatoria && (
          <Typography component="span" color="error" sx={{ ml: 0.5 }}>
            *
          </Typography>
        )}
      </Typography>

      {/* Descripción si existe */}
      {pregunta.descripcion && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {pregunta.descripcion}
        </Typography>
      )}

      {/* Contenido de la pregunta */}
      {renderPreguntaContent()}
    </Box>
  );
};

export default VistaPreviaPregunta;
