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
  FormControlLabel,
  Checkbox,
  Autocomplete,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import type { Atencion, Persona } from '../types/index';
import { personasApi } from '@/services/api';

interface AtencionFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (atencion: any) => void;
  atencion?: Atencion | null;
  loading?: boolean;
}

export const AtencionForm: React.FC<AtencionFormProps> = ({
  open,
  onClose,
  onSubmit,
  atencion,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    fecha_atencion: new Date(),
    motivo_psicologico: false,
    motivo_academico: false,
    salud_en_general: false,
    requiere_seguimiento: false,
    requiere_canalizacion_externa: false,
    estatus_canalizacion_externa: '',
    observaciones: '',
    fecha_proxima_sesion: null as Date | null,
    id_persona: null as number | null,
    atendido: false,
    ultima_fecha_contacto: null as Date | null,
  });

  const [estudiantes, setEstudiantes] = useState<Persona[]>([]);
  const [selectedEstudiante, setSelectedEstudiante] = useState<Persona | null>(null);
  const [estudiantesLoading, setEstudiantesLoading] = useState(false);

  useEffect(() => {
    const loadEstudiantes = async () => {
      try {
        setEstudiantesLoading(true);
        const data = await personasApi.getEstudiantes();
        setEstudiantes(data);
      } catch (error) {
        console.error('Error loading estudiantes:', error);
      } finally {
        setEstudiantesLoading(false);
      }
    };

    if (open) {
      loadEstudiantes();
    }
  }, [open]);

  useEffect(() => {
    if (atencion) {
      setFormData({
        fecha_atencion: atencion.fecha_atencion ? new Date(atencion.fecha_atencion) : new Date(),
        motivo_psicologico: atencion.motivo_psicologico || false,
        motivo_academico: atencion.motivo_academico || false,
        salud_en_general: atencion.salud_en_general || false,
        requiere_seguimiento: atencion.requiere_seguimiento || false,
        requiere_canalizacion_externa: atencion.requiere_canalizacion_externa || false,
        estatus_canalizacion_externa: atencion.estatus_canalizacion_externa || '',
        observaciones: atencion.observaciones || '',
        fecha_proxima_sesion: atencion.fecha_proxima_sesion ? new Date(atencion.fecha_proxima_sesion) : null,
        id_persona: atencion.id_persona || null,
        atendido: atencion.atendido || false,
        ultima_fecha_contacto: atencion.ultima_fecha_contacto ? new Date(atencion.ultima_fecha_contacto) : null,
      });

      if (atencion.id_persona) {
        const estudiante = estudiantes.find(p => p.id === atencion.id_persona);
        setSelectedEstudiante(estudiante || null);
      }
    } else {
      // Reset form for new atencion
      setFormData({
        fecha_atencion: new Date(),
        motivo_psicologico: false,
        motivo_academico: false,
        salud_en_general: false,
        requiere_seguimiento: false,
        requiere_canalizacion_externa: false,
        estatus_canalizacion_externa: '',
        observaciones: '',
        fecha_proxima_sesion: null,
        id_persona: null,
        atendido: false,
        ultima_fecha_contacto: null,
      });
      setSelectedEstudiante(null);
    }
  }, [atencion, open, estudiantes]);

  const handleChange = (field: string) => (event: any) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDateChange = (field: string) => (date: Date | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: date
    }));
  };

  const handleEstudianteChange = (event: any, newValue: Persona | null) => {
    setSelectedEstudiante(newValue);
    setFormData(prev => ({
      ...prev,
      id_persona: newValue ? newValue.id : null
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validación básica
    if (!formData.id_persona) {
      alert('Por favor, seleccione una persona para la atención.');
      return;
    }

    // Preparar datos para envío
    const dataToSubmit = {
      ...formData,
      fecha_atencion: formData.fecha_atencion.toISOString().split('T')[0],
      fecha_proxima_sesion: formData.fecha_proxima_sesion ?
        formData.fecha_proxima_sesion.toISOString().split('T')[0] : null,
      ultima_fecha_contacto: formData.ultima_fecha_contacto ?
        formData.ultima_fecha_contacto.toISOString().split('T')[0] : null,
    };

    onSubmit(dataToSubmit);
  };

  const isFormValid = () => {
    return formData.fecha_atencion &&
           formData.id_persona && // Estudiante es obligatorio
           (formData.motivo_psicologico || formData.motivo_academico || formData.salud_en_general);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {atencion ? `Editar Atención #${atencion.id}` : 'Crear Nueva Atención'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Información de la Atención
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={estudiantes}
                  getOptionLabel={(option) => `${option.correo_institucional} - ${option.matricula || 'Sin matrícula'}`}
                  value={selectedEstudiante}
                  onChange={handleEstudianteChange}
                  loading={estudiantesLoading}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Estudiante Atendido"
                      required
                      placeholder="Buscar estudiante por correo o matrícula..."
                      helperText={estudiantes.length === 0 && !estudiantesLoading ?
                        "No hay estudiantes registrados. Registre un estudiante primero." :
                        "Seleccione el estudiante que recibió la atención"}
                      error={estudiantes.length === 0 && !estudiantesLoading}
                    />
                  )}
                  noOptionsText={estudiantesLoading ? "Cargando estudiantes..." : "No hay estudiantes registrados"}
                />
              </Grid>

              {selectedEstudiante && (
                <Grid item xs={12}>
                  <Box sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 1, border: '1px solid', borderColor: 'primary.200' }}>
                    <Typography variant="subtitle2" color="primary.main" gutterBottom>
                      Estudiante Seleccionado:
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {selectedEstudiante.correo_institucional}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Matrícula: {selectedEstudiante.matricula || 'Sin matrícula'} |
                      Semestre: {selectedEstudiante.semestre || 'No especificado'}
                    </Typography>
                  </Box>
                </Grid>
              )}

              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Fecha de Atención"
                  value={formData.fecha_atencion}
                  onChange={handleDateChange('fecha_atencion')}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                  Motivos de la Atención
                </Typography>
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.motivo_psicologico}
                      onChange={handleChange('motivo_psicologico')}
                    />
                  }
                  label="Motivo Psicológico"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.motivo_academico}
                      onChange={handleChange('motivo_academico')}
                    />
                  }
                  label="Motivo Académico"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.salud_en_general}
                      onChange={handleChange('salud_en_general')}
                    />
                  }
                  label="Salud en General/Vulnerable"
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                  Seguimiento
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.requiere_seguimiento}
                      onChange={handleChange('requiere_seguimiento')}
                    />
                  }
                  label="Requiere Seguimiento"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.requiere_canalizacion_externa}
                      onChange={handleChange('requiere_canalizacion_externa')}
                    />
                  }
                  label="Requiere Canalización Externa"
                />
              </Grid>

              {formData.requiere_canalizacion_externa && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Estatus Canalización Externa</InputLabel>
                    <Select
                      value={formData.estatus_canalizacion_externa}
                      onChange={handleChange('estatus_canalizacion_externa')}
                      label="Estatus Canalización Externa"
                    >
                      <MenuItem value="pendiente">Pendiente</MenuItem>
                      <MenuItem value="en_proceso">En Proceso</MenuItem>
                      <MenuItem value="completada">Completada</MenuItem>
                      <MenuItem value="cancelada">Cancelada</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {formData.requiere_seguimiento && (
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Fecha Próxima Sesión"
                    value={formData.fecha_proxima_sesion}
                    onChange={handleDateChange('fecha_proxima_sesion')}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>
              )}

              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Última Fecha de Contacto"
                  value={formData.ultima_fecha_contacto}
                  onChange={handleDateChange('ultima_fecha_contacto')}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.atendido}
                      onChange={handleChange('atendido')}
                    />
                  }
                  label="Atendido"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Observaciones"
                  value={formData.observaciones}
                  onChange={handleChange('observaciones')}
                  placeholder="Observaciones detalladas sobre la atención..."
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
            {loading ? 'Guardando...' : (atencion ? 'Actualizar' : 'Crear')}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};
