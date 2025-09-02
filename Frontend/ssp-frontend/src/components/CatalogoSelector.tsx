import React, { useState, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import { catalogosApi } from '../services/api';
import type { Religion, GrupoEtnico, Discapacidad } from '../types';

interface CatalogoSelectorProps {
  tipo: 'religion' | 'grupo_etnico' | 'discapacidad';
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  fullWidth?: boolean;
}

const CatalogoSelector: React.FC<CatalogoSelectorProps> = ({
  tipo,
  label,
  value,
  onChange,
  required = false,
  error = false,
  helperText = '',
  fullWidth = true
}) => {
  const [items, setItems] = useState<(Religion | GrupoEtnico | Discapacidad)[]>([]);
  const [loading, setLoading] = useState(false);
  const [showOtroField, setShowOtroField] = useState(false);
  const [otroValue, setOtroValue] = useState('');
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    loadItems();
  }, [tipo]);

  useEffect(() => {
    // Si el valor actual no está en la lista de items y no es vacío, mostrar campo "Otro"
    if (value && !items.find(item => item.titulo === value) && value !== 'otro') {
      setShowOtroField(true);
      setOtroValue(value);
    } else if (value === 'otro') {
      setShowOtroField(true);
      setOtroValue('');
    } else {
      setShowOtroField(false);
      setOtroValue('');
    }
  }, [value, items]);

  const loadItems = async () => {
    try {
      setLoading(true);
      setApiError('');
      
      let data: (Religion | GrupoEtnico | Discapacidad)[] = [];
      
      if (tipo === 'religion') {
        data = await catalogosApi.religiones.getActivas();
      } else if (tipo === 'grupo_etnico') {
        data = await catalogosApi.gruposEtnicos.getActivos();
      } else if (tipo === 'discapacidad') {
        data = await catalogosApi.discapacidades.getActivas();
      }
      
      setItems(data);
    } catch (error) {
      console.error('Error loading catalog items:', error);
      setApiError('Error al cargar opciones');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChange = (selectedValue: string) => {
    if (selectedValue === 'otro') {
      setShowOtroField(true);
      setOtroValue('');
      onChange('otro');
    } else {
      setShowOtroField(false);
      setOtroValue('');
      onChange(selectedValue);
    }
  };

  const handleOtroChange = (otroText: string) => {
    setOtroValue(otroText);

    if (otroText.trim()) {
      // Enviar el valor personalizado al padre
      onChange(otroText.trim());
    } else {
      onChange('otro');
    }
  };

  const getDisplayValue = () => {
    if (showOtroField) {
      return 'otro';
    }
    
    // Si el valor actual está en la lista, devolverlo
    const foundItem = items.find(item => item.titulo === value);
    if (foundItem) {
      return value;
    }
    
    // Si hay un valor pero no está en la lista, es un valor personalizado
    if (value && value !== 'otro') {
      return 'otro';
    }
    
    return value || '';
  };

  if (apiError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {apiError}
      </Alert>
    );
  }

  return (
    <Box>
      <FormControl fullWidth={fullWidth} error={error} required={required}>
        <InputLabel>{label}</InputLabel>
        <Select
          value={getDisplayValue()}
          onChange={(e) => handleSelectChange(e.target.value)}
          label={label}
          disabled={loading}
          endAdornment={loading ? <CircularProgress size={20} /> : null}
        >
          <MenuItem value="">
            <em>Seleccione una opción</em>
          </MenuItem>
          
          {items.map((item) => (
            <MenuItem key={item.id} value={item.titulo}>
              {item.titulo}
            </MenuItem>
          ))}
          
          <MenuItem value="otro">
            Otro (especificar)
          </MenuItem>
        </Select>
        
        {helperText && !showOtroField && (
          <Box component="span" sx={{ 
            color: error ? 'error.main' : 'text.secondary',
            fontSize: '0.75rem',
            mt: 0.5,
            ml: 1.75
          }}>
            {helperText}
          </Box>
        )}
      </FormControl>
      
      {showOtroField && (
        <TextField
          fullWidth={fullWidth}
          label={`Especifique ${label.toLowerCase()}`}
          value={otroValue}
          onChange={(e) => handleOtroChange(e.target.value)}
          margin="normal"
          variant="outlined"
          placeholder={`Escriba ${label.toLowerCase()} personalizada`}
          helperText={helperText || "Su respuesta será enviada para revisión después de completar el formulario"}
          error={error}
        />
      )}
    </Box>
  );
};

export default CatalogoSelector;
