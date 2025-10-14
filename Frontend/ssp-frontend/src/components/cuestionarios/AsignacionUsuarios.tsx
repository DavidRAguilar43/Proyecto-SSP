import React from 'react';
import {
  Box,
  Typography,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Alert,
  Chip,
  Paper,
  Grid
} from '@mui/material';
import {
  School as AlumnoIcon,
  Person as DocenteIcon,
  Work as PersonalIcon
} from '@mui/icons-material';
import type { TipoUsuario } from '@/types/cuestionarios';

interface AsignacionUsuariosProps {
  tiposSeleccionados: TipoUsuario[];
  onChange: (tipos: TipoUsuario[]) => void;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
}

/**
 * Configuración de tipos de usuario con iconos y descripciones
 */
const TIPOS_USUARIO = [
  {
    value: 'alumno' as TipoUsuario,
    label: 'Alumnos',
    description: 'Estudiantes matriculados en la institución',
    icon: <AlumnoIcon />,
    color: 'primary' as const
  },
  {
    value: 'docente' as TipoUsuario,
    label: 'Docentes',
    description: 'Profesores y personal académico',
    icon: <DocenteIcon />,
    color: 'secondary' as const
  },
  {
    value: 'personal' as TipoUsuario,
    label: 'Personal',
    description: 'Personal administrativo y de apoyo',
    icon: <PersonalIcon />,
    color: 'success' as const
  }
];

/**
 * Componente para seleccionar los tipos de usuario a los que se asignará el cuestionario
 */
const AsignacionUsuarios: React.FC<AsignacionUsuariosProps> = ({
  tiposSeleccionados,
  onChange,
  disabled = false,
  error = false,
  helperText
}) => {
  const handleTipoChange = (tipo: TipoUsuario, checked: boolean) => {
    if (checked) {
      // Agregar tipo si no está seleccionado
      if (!tiposSeleccionados.includes(tipo)) {
        onChange([...tiposSeleccionados, tipo]);
      }
    } else {
      // Remover tipo si está seleccionado
      onChange(tiposSeleccionados.filter(t => t !== tipo));
    }
  };

  const todosSeleccionados = tiposSeleccionados.length === TIPOS_USUARIO.length;
  const algunoSeleccionado = tiposSeleccionados.length > 0;

  return (
    <Box>
      <FormControl component="fieldset" error={error} disabled={disabled} sx={{ width: '100%' }}>
        <FormLabel component="legend" sx={{ mb: 2 }}>
          <Typography variant="subtitle1" component="span">
            Asignar cuestionario a:
          </Typography>
        </FormLabel>

        {/* Opciones de selección */}
        <Grid container spacing={2}>
          {TIPOS_USUARIO.map((tipoInfo) => (
            <Grid item xs={12} sm={6} md={4} key={tipoInfo.value}>
              <Paper
                sx={{
                  p: 2,
                  border: '2px solid',
                  borderColor: tiposSeleccionados.includes(tipoInfo.value) 
                    ? `${tipoInfo.color}.main` 
                    : 'divider',
                  backgroundColor: tiposSeleccionados.includes(tipoInfo.value)
                    ? `${tipoInfo.color}.light`
                    : 'background.paper',
                  opacity: disabled ? 0.6 : 1,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': disabled ? {} : {
                    boxShadow: 2,
                    borderColor: `${tipoInfo.color}.main`
                  }
                }}
                onClick={() => !disabled && handleTipoChange(
                  tipoInfo.value, 
                  !tiposSeleccionados.includes(tipoInfo.value)
                )}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={tiposSeleccionados.includes(tipoInfo.value)}
                      onChange={(e) => handleTipoChange(tipoInfo.value, e.target.checked)}
                      disabled={disabled}
                      color={tipoInfo.color}
                    />
                  }
                  label={
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        {tipoInfo.icon}
                        <Typography variant="subtitle2" component="span">
                          {tipoInfo.label}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {tipoInfo.description}
                      </Typography>
                    </Box>
                  }
                  sx={{ 
                    m: 0, 
                    width: '100%',
                    '& .MuiFormControlLabel-label': {
                      width: '100%'
                    }
                  }}
                />
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Opciones rápidas */}
        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label="Seleccionar todos"
            variant={todosSeleccionados ? "filled" : "outlined"}
            color="primary"
            size="small"
            onClick={() => !disabled && onChange(TIPOS_USUARIO.map(t => t.value))}
            disabled={disabled || todosSeleccionados}
            clickable
          />
          <Chip
            label="Limpiar selección"
            variant="outlined"
            color="default"
            size="small"
            onClick={() => !disabled && onChange([])}
            disabled={disabled || !algunoSeleccionado}
            clickable
          />
        </Box>

        {/* Resumen de selección - Con altura mínima para evitar desplazamiento */}
        <Box sx={{ mt: 2 }}>
          {algunoSeleccionado ? (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Tipos seleccionados ({tiposSeleccionados.length}):
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {tiposSeleccionados.map(tipo => {
                  const tipoInfo = TIPOS_USUARIO.find(t => t.value === tipo);
                  return (
                    <Chip
                      key={tipo}
                      label={tipoInfo?.label}
                      color={tipoInfo?.color}
                      size="small"
                      icon={tipoInfo?.icon}
                    />
                  );
                })}
              </Box>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              Seleccione al menos un tipo de usuario
            </Typography>
          )}
        </Box>

        {/* Mensaje de error o ayuda */}
        {error && !algunoSeleccionado && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Debe seleccionar al menos un tipo de usuario para asignar el cuestionario.
          </Alert>
        )}

        {helperText && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {helperText}
          </Typography>
        )}
      </FormControl>
    </Box>
  );
};

export default AsignacionUsuarios;

/**
 * Hook para obtener información de los tipos de usuario
 */
export const useTiposUsuarioInfo = () => {
  return TIPOS_USUARIO;
};

/**
 * Función utilitaria para obtener el label de un tipo de usuario
 */
export const getTipoUsuarioLabel = (tipo: TipoUsuario): string => {
  const tipoInfo = TIPOS_USUARIO.find(t => t.value === tipo);
  return tipoInfo?.label || tipo;
};

/**
 * Función para validar la selección de tipos de usuario
 */
export const validarTiposUsuario = (tipos: TipoUsuario[]): { esValido: boolean; error?: string } => {
  if (tipos.length === 0) {
    return {
      esValido: false,
      error: 'Debe seleccionar al menos un tipo de usuario'
    };
  }

  const tiposValidos = TIPOS_USUARIO.map(t => t.value);
  const tiposInvalidos = tipos.filter(t => !tiposValidos.includes(t));
  
  if (tiposInvalidos.length > 0) {
    return {
      esValido: false,
      error: `Tipos de usuario inválidos: ${tiposInvalidos.join(', ')}`
    };
  }

  return { esValido: true };
};
