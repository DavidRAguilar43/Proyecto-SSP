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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import type { Grupo } from '../types/index';
import { useNotification } from '@/hooks/useNotification';

interface GrupoFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (grupo: any) => void;
  grupo?: Grupo | null;
  loading?: boolean;
}

export const GrupoForm: React.FC<GrupoFormProps> = ({
  open,
  onClose,
  onSubmit,
  grupo,
  loading = false,
}) => {
  // Hook para notificaciones
  const { notifyValidationError } = useNotification();

  const [formData, setFormData] = useState({
    nombre_grupo: '',
    tipo_grupo: '',
    observaciones_grupo: '',
    cohorte: '',
  });

  useEffect(() => {
    if (grupo) {
      setFormData({
        nombre_grupo: grupo.nombre_grupo || '',
        tipo_grupo: grupo.tipo_grupo || '',
        observaciones_grupo: grupo.observaciones_grupo || '',
        cohorte: grupo.cohorte || '',
      });
    } else {
      // Reset form for new grupo
      setFormData({
        nombre_grupo: '',
        tipo_grupo: 'academico',
        observaciones_grupo: '',
        cohorte: '',
      });
    }
  }, [grupo, open]);

  const handleChange = (field: string) => (event: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validación básica
    if (!formData.nombre_grupo || !formData.tipo_grupo) {
      notifyValidationError('Por favor, complete todos los campos requeridos.');
      return;
    }

    onSubmit(formData);
  };

  const isFormValid = () => {
    return formData.nombre_grupo && formData.tipo_grupo;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {grupo ? `Editar Grupo - ${grupo.nombre_grupo}` : 'Crear Nuevo Grupo'}
      </DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Información del Grupo
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Nombre del Grupo"
                value={formData.nombre_grupo}
                onChange={handleChange('nombre_grupo')}
                placeholder="Ej: Grupo A, 1er Semestre ISC"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Tipo de Grupo</InputLabel>
                <Select
                  value={formData.tipo_grupo}
                  onChange={handleChange('tipo_grupo')}
                  label="Tipo de Grupo"
                >
                  <MenuItem value="academico">Académico</MenuItem>
                  <MenuItem value="extracurricular">Extracurricular</MenuItem>
                  <MenuItem value="deportivo">Deportivo</MenuItem>
                  <MenuItem value="cultural">Cultural</MenuItem>
                  <MenuItem value="investigacion">Investigación</MenuItem>
                  <MenuItem value="otro">Otro</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Cohorte"
                value={formData.cohorte}
                onChange={handleChange('cohorte')}
                placeholder="Ej: 2024-1, Enero-Junio 2024"
                helperText="Período o generación del grupo"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Observaciones"
                value={formData.observaciones_grupo}
                onChange={handleChange('observaciones_grupo')}
                placeholder="Observaciones adicionales sobre el grupo..."
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
          {loading ? 'Guardando...' : (grupo ? 'Actualizar' : 'Crear')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
