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
import { programasEducativosApi } from '../services/api';

interface ProgramaEducativo {
  id: number;
  nombre_programa: string;
  clave_programa: string;
}

interface ProgramaEducativoSelectorProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  fullWidth?: boolean;
}

/**
 * Selector de Programa Educativo para formularios.
 * 
 * Obtiene la lista de programas educativos desde el backend y los muestra
 * ordenados alfabéticamente en un dropdown.
 * 
 * Args:
 *   label: Etiqueta del campo (por defecto: "Programa Educativo / Carrera")
 *   value: Valor actual del campo (nombre del programa)
 *   onChange: Función callback cuando cambia el valor
 *   required: Si el campo es obligatorio
 *   error: Si hay un error de validación
 *   helperText: Texto de ayuda
 *   fullWidth: Si el campo ocupa todo el ancho disponible
 * 
 * Returns:
 *   Componente Select con la lista de programas educativos
 */
const ProgramaEducativoSelector: React.FC<ProgramaEducativoSelectorProps> = ({
  label = "Programa Educativo / Carrera",
  value,
  onChange,
  required = false,
  error = false,
  helperText = "Seleccione su programa educativo o carrera",
  fullWidth = true
}) => {
  const [programas, setProgramas] = useState<ProgramaEducativo[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    loadProgramas();
  }, []);

  const loadProgramas = async () => {
    try {
      setLoading(true);
      setApiError('');
      
      // Obtener programas desde el endpoint público (sin autenticación)
      const data = await programasEducativosApi.getPublico();
      
      // Los programas ya vienen ordenados alfabéticamente desde el backend
      setProgramas(data);
      
      // Si no hay programas disponibles, mostrar advertencia
      if (data.length === 0) {
        setApiError('No hay programas educativos disponibles en este momento');
      }
    } catch (error) {
      console.error('Error loading programas educativos:', error);
      setApiError('Error al cargar los programas educativos. Por favor, intente más tarde.');
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
        disabled={loading || programas.length === 0}
        endAdornment={loading ? <CircularProgress size={20} /> : null}
      >
        <MenuItem value="">
          <em>Seleccione una opción</em>
        </MenuItem>
        
        {programas.map((programa) => (
          <MenuItem key={programa.id} value={programa.nombre_programa}>
            {programa.nombre_programa}
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

export default ProgramaEducativoSelector;

