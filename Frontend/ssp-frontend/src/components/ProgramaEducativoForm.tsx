import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Grid,
  Typography,
} from '@mui/material';
import type { ProgramaEducativo } from '../types/index';
import { useNotification } from '@/hooks/useNotification';

interface ProgramaEducativoFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (programa: any) => void;
  programa?: ProgramaEducativo | null;
  loading?: boolean;
}

export const ProgramaEducativoForm: React.FC<ProgramaEducativoFormProps> = ({
  open,
  onClose,
  onSubmit,
  programa,
  loading = false,
}) => {
  // Hook para notificaciones
  const { notifyValidationError } = useNotification();

  const [formData, setFormData] = useState({
    nombre_programa: '',
    clave_programa: '',
  });

  useEffect(() => {
    if (programa) {
      setFormData({
        nombre_programa: programa.nombre_programa || '',
        clave_programa: programa.clave_programa || '',
      });
    } else {
      // Reset form for new programa
      setFormData({
        nombre_programa: '',
        clave_programa: '',
      });
    }
  }, [programa, open]);

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validación básica
    if (!formData.nombre_programa || !formData.clave_programa) {
      notifyValidationError('Por favor, complete todos los campos requeridos.');
      return;
    }

    onSubmit(formData);
  };

  const isFormValid = () => {
    return formData.nombre_programa && formData.clave_programa;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {programa ? `Editar Programa - ${programa.nombre_programa}` : 'Crear Nuevo Programa Educativo'}
      </DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Información del Programa
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Nombre del Programa"
                value={formData.nombre_programa}
                onChange={handleChange('nombre_programa')}
                placeholder="Ej: Ingeniería en Sistemas"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Clave del Programa"
                value={formData.clave_programa}
                onChange={handleChange('clave_programa')}
                placeholder="Ej: ISC-2024"
                helperText="Clave única que identifica el programa"
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !isFormValid()}
        >
          {loading ? 'Guardando...' : (programa ? 'Actualizar' : 'Crear')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
