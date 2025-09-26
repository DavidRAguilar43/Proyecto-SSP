import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import {
  TextFields as TextFieldsIcon,
  RadioButtonChecked as RadioIcon,
  CheckBox as CheckBoxIcon,
  ToggleOn as ToggleIcon,
  ArrowDropDown as SelectIcon,
  CheckCircle as CheckCircleIcon,
  LinearScale as ScaleIcon
} from '@mui/icons-material';
import type { TipoPregunta } from '@/types/cuestionarios';

interface TipoPreguntaSelectorProps {
  value: TipoPregunta;
  onChange: (tipo: TipoPregunta) => void;
  disabled?: boolean;
}

/**
 * Configuración de tipos de pregunta con iconos y descripciones
 */
const TIPOS_PREGUNTA = [
  {
    value: 'abierta' as TipoPregunta,
    label: 'Pregunta Abierta',
    description: 'Campo de texto libre para respuestas extensas',
    icon: <TextFieldsIcon />,
    color: 'primary' as const
  },
  {
    value: 'opcion_multiple' as TipoPregunta,
    label: 'Opción Múltiple',
    description: 'Selección única o múltiple entre opciones predefinidas',
    icon: <CheckCircleIcon />,
    color: 'secondary' as const
  },
  {
    value: 'verdadero_falso' as TipoPregunta,
    label: 'Verdadero/Falso',
    description: 'Pregunta con dos opciones: Verdadero o Falso',
    icon: <ToggleIcon />,
    color: 'success' as const
  },
  {
    value: 'select' as TipoPregunta,
    label: 'Lista Desplegable',
    description: 'Selección única desde una lista desplegable',
    icon: <SelectIcon />,
    color: 'info' as const
  },
  {
    value: 'checkbox' as TipoPregunta,
    label: 'Casillas de Verificación',
    description: 'Selección múltiple con casillas independientes',
    icon: <CheckBoxIcon />,
    color: 'warning' as const
  },
  {
    value: 'radio_button' as TipoPregunta,
    label: 'Botones de Opción',
    description: 'Selección única obligatoria entre opciones',
    icon: <RadioIcon />,
    color: 'error' as const
  },
  {
    value: 'escala_likert' as TipoPregunta,
    label: 'Escala de Likert',
    description: 'Escala numérica con etiquetas personalizables',
    icon: <ScaleIcon />,
    color: 'default' as const
  }
];

/**
 * Componente selector de tipo de pregunta con iconos y descripciones
 */
const TipoPreguntaSelector: React.FC<TipoPreguntaSelectorProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const handleChange = (event: SelectChangeEvent<TipoPregunta>) => {
    onChange(event.target.value as TipoPregunta);
  };

  const tipoSeleccionado = TIPOS_PREGUNTA.find(tipo => tipo.value === value);

  return (
    <Box>
      <FormControl fullWidth disabled={disabled}>
        <InputLabel id="tipo-pregunta-label">Tipo de Pregunta</InputLabel>
        <Select
          labelId="tipo-pregunta-label"
          value={value}
          label="Tipo de Pregunta"
          onChange={handleChange}
          renderValue={(selected) => {
            const tipo = TIPOS_PREGUNTA.find(t => t.value === selected);
            return (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {tipo?.icon}
                <Typography variant="body2">{tipo?.label}</Typography>
              </Box>
            );
          }}
        >
          {TIPOS_PREGUNTA.map((tipo) => (
            <MenuItem key={tipo.value} value={tipo.value}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
                  {tipo.icon}
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {tipo.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {tipo.description}
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  size="small"
                  label={tipo.value.replace('_', ' ')}
                  color={tipo.color}
                  variant="outlined"
                />
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Descripción del tipo seleccionado */}
      {tipoSeleccionado && (
        <Box sx={{ mt: 1, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>{tipoSeleccionado.label}:</strong> {tipoSeleccionado.description}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default TipoPreguntaSelector;

/**
 * Hook para obtener información de un tipo de pregunta
 */
export const useTipoPreguntaInfo = (tipo: TipoPregunta) => {
  return TIPOS_PREGUNTA.find(t => t.value === tipo);
};

/**
 * Función utilitaria para obtener todos los tipos de pregunta disponibles
 */
export const getTiposPreguntaDisponibles = () => TIPOS_PREGUNTA;

/**
 * Función para validar si un tipo de pregunta es válido
 */
export const esTipoPreguntaValido = (tipo: string): tipo is TipoPregunta => {
  return TIPOS_PREGUNTA.some(t => t.value === tipo);
};
