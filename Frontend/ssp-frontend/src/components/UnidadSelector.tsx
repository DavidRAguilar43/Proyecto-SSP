import React, { useState, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  FormHelperText
} from '@mui/material';
import { unidadesApi } from '../services/api';

interface Unidad {
  id: number;
  nombre: string;
}

interface UnidadSelectorProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  fullWidth?: boolean;
}

/**
 * Selector de Unidad Académica/Facultad para formularios.
 * 
 * Obtiene la lista de unidades académicas desde el backend y las muestra
 * ordenadas alfabéticamente en un dropdown.
 * 
 * Args:
 *   label: Etiqueta del campo (por defecto: "Facultad / Unidad Académica")
 *   value: Valor actual del campo (nombre de la unidad)
 *   onChange: Función callback cuando cambia el valor
 *   required: Si el campo es obligatorio
 *   error: Si hay un error de validación
 *   helperText: Texto de ayuda
 *   fullWidth: Si el campo ocupa todo el ancho disponible
 * 
 * Returns:
 *   Componente Select con la lista de unidades académicas
 */
const UnidadSelector: React.FC<UnidadSelectorProps> = ({
  label = "Facultad / Unidad Académica",
  value,
  onChange,
  required = false,
  error = false,
  helperText = "Seleccione su facultad o unidad académica",
  fullWidth = true
}) => {
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    loadUnidades();
  }, []);

  const loadUnidades = async () => {
    try {
      setLoading(true);
      setApiError('');
      
      // Obtener unidades desde el endpoint público (sin autenticación)
      const data = await unidadesApi.getPublico();
      
      // Las unidades ya vienen ordenadas alfabéticamente desde el backend
      setUnidades(data);
      
      // Si no hay unidades disponibles, mostrar advertencia
      if (data.length === 0) {
        setApiError('No hay unidades académicas disponibles en este momento');
      }
    } catch (error) {
      console.error('Error loading unidades:', error);
      setApiError('Error al cargar las unidades académicas. Por favor, intente más tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChange = (selectedValue: string) => {
    onChange(selectedValue);
  };

  if (apiError) {
    return (
      <Alert severity="warning" sx={{ mb: 2 }}>
        {apiError}
      </Alert>
    );
  }

  return (
    <FormControl fullWidth={fullWidth} error={error} required={required}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value || ''}
        onChange={(e) => handleSelectChange(e.target.value)}
        label={label}
        disabled={loading || unidades.length === 0}
        endAdornment={loading ? <CircularProgress size={20} /> : null}
      >
        <MenuItem value="">
          <em>Seleccione una opción</em>
        </MenuItem>
        
        {unidades.map((unidad) => (
          <MenuItem key={unidad.id} value={unidad.nombre}>
            {unidad.nombre}
          </MenuItem>
        ))}
      </Select>
      
      {helperText && (
        <FormHelperText error={error}>
          {helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
};

export default UnidadSelector;

