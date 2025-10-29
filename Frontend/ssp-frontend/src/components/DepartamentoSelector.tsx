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
import { departamentosApi } from '../services/api';

interface Departamento {
  id: number;
  nombre: string;
  activo: boolean;
}

interface DepartamentoSelectorProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  fullWidth?: boolean;
}

/**
 * Selector de Departamento para formularios.
 * 
 * Obtiene la lista de departamentos activos desde el backend y los muestra
 * ordenados alfabéticamente en un dropdown.
 * 
 * Args:
 *   label: Etiqueta del campo (por defecto: "Departamento")
 *   value: Valor actual del campo (nombre del departamento)
 *   onChange: Función callback cuando cambia el valor
 *   required: Si el campo es obligatorio
 *   error: Si hay un error de validación
 *   helperText: Texto de ayuda
 *   fullWidth: Si el campo ocupa todo el ancho disponible
 * 
 * Returns:
 *   Componente Select con la lista de departamentos activos
 */
const DepartamentoSelector: React.FC<DepartamentoSelectorProps> = ({
  label = "Departamento",
  value,
  onChange,
  required = false,
  error = false,
  helperText = "Seleccione el departamento al que pertenece",
  fullWidth = true
}) => {
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    loadDepartamentos();
  }, []);

  const loadDepartamentos = async () => {
    try {
      setLoading(true);
      setApiError('');
      
      // Obtener departamentos activos desde el endpoint público (sin autenticación)
      const data = await departamentosApi.getPublico();
      
      // Los departamentos ya vienen ordenados alfabéticamente y filtrados (solo activos) desde el backend
      setDepartamentos(data);
      
      // Si no hay departamentos disponibles, mostrar advertencia
      if (data.length === 0) {
        setApiError('No hay departamentos disponibles en este momento');
      }
    } catch (error) {
      console.error('Error loading departamentos:', error);
      setApiError('Error al cargar los departamentos. Por favor, intente más tarde.');
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
        disabled={loading || departamentos.length === 0}
        endAdornment={loading ? <CircularProgress size={20} /> : null}
      >
        <MenuItem value="">
          <em>Seleccione una opción</em>
        </MenuItem>
        
        {departamentos.map((departamento) => (
          <MenuItem key={departamento.id} value={departamento.nombre}>
            {departamento.nombre}
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

export default DepartamentoSelector;

