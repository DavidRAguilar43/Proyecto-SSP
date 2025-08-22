import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Alert,
  CircularProgress,
  IconButton
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Schedule as ScheduleIcon,
  Psychology as PsychologyIcon,
  School as SchoolIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import type { CitaCreate, TipoCita } from '../types/index';

interface SolicitudCitaFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CitaCreate) => void;
  loading?: boolean;
}

const SolicitudCitaForm: React.FC<SolicitudCitaFormProps> = ({
  open,
  onClose,
  onSubmit,
  loading = false
}) => {
  const [formData, setFormData] = useState<CitaCreate>({
    tipo_cita: 'general',
    motivo: '',
    fecha_propuesta_alumno: undefined,
    observaciones_alumno: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof CitaCreate, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.motivo.trim()) {
      newErrors.motivo = 'El motivo es requerido';
    } else if (formData.motivo.trim().length < 10) {
      newErrors.motivo = 'El motivo debe tener al menos 10 caracteres';
    } else if (formData.motivo.trim().length > 500) {
      newErrors.motivo = 'El motivo no puede exceder 500 caracteres';
    }

    if (formData.observaciones_alumno && formData.observaciones_alumno.length > 500) {
      newErrors.observaciones_alumno = 'Las observaciones no pueden exceder 500 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Preparar datos para envío
    const submitData: CitaCreate = {
      ...formData,
      fecha_propuesta_alumno: formData.fecha_propuesta_alumno 
        ? new Date(formData.fecha_propuesta_alumno).toISOString()
        : undefined
    };

    onSubmit(submitData);
  };

  const handleClose = () => {
    setFormData({
      tipo_cita: 'general',
      motivo: '',
      fecha_propuesta_alumno: undefined,
      observaciones_alumno: ''
    });
    setErrors({});
    onClose();
  };

  const getTipoIcon = (tipo: TipoCita) => {
    switch (tipo) {
      case 'psicologica':
        return <PsychologyIcon />;
      case 'academica':
        return <SchoolIcon />;
      default:
        return <HelpIcon />;
    }
  };

  const getTipoDescription = (tipo: TipoCita) => {
    switch (tipo) {
      case 'psicologica':
        return 'Apoyo emocional, manejo del estrés, ansiedad, etc.';
      case 'academica':
        return 'Orientación académica, plan de estudios, materias, etc.';
      default:
        return 'Consultas generales y otros temas';
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <IconButton 
            onClick={handleClose} 
            sx={{ mr: 1 }}
            aria-label="Cerrar"
          >
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h5" component="div">
              Solicitar Cita con Personal
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Completa el formulario para solicitar una cita con el personal de servicios estudiantiles.
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            <strong>Información importante:</strong> Tu solicitud será revisada por el personal y recibirás una confirmación con la fecha y ubicación de tu cita.
          </Alert>

          {/* Tipo de Cita */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Tipo de Cita</InputLabel>
            <Select
              value={formData.tipo_cita}
              label="Tipo de Cita"
              onChange={(e) => handleChange('tipo_cita', e.target.value as TipoCita)}
            >
              <MenuItem value="general">
                <Box display="flex" alignItems="center">
                  <HelpIcon sx={{ mr: 1 }} />
                  General
                </Box>
              </MenuItem>
              <MenuItem value="psicologica">
                <Box display="flex" alignItems="center">
                  <PsychologyIcon sx={{ mr: 1 }} />
                  Psicológica
                </Box>
              </MenuItem>
              <MenuItem value="academica">
                <Box display="flex" alignItems="center">
                  <SchoolIcon sx={{ mr: 1 }} />
                  Académica
                </Box>
              </MenuItem>
            </Select>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              {getTipoDescription(formData.tipo_cita)}
            </Typography>
          </FormControl>

          {/* Motivo */}
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Motivo de la Cita"
            value={formData.motivo}
            onChange={(e) => handleChange('motivo', e.target.value)}
            error={!!errors.motivo}
            helperText={errors.motivo || `${formData.motivo.length}/500 caracteres`}
            placeholder="Describe detalladamente el motivo de tu solicitud de cita..."
            sx={{ mb: 3 }}
            required
          />

          {/* Fecha Propuesta */}
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <DateTimePicker
              label="Fecha y Hora Preferida (Opcional)"
              value={formData.fecha_propuesta_alumno ? new Date(formData.fecha_propuesta_alumno) : null}
              onChange={(newValue) => handleChange('fecha_propuesta_alumno', newValue?.toISOString())}
              slotProps={{
                textField: {
                  fullWidth: true,
                  sx: { mb: 3 },
                  helperText: "Indica tu fecha y hora preferida. El personal confirmará la disponibilidad."
                }
              }}
              minDateTime={new Date()}
            />
          </LocalizationProvider>

          {/* Observaciones */}
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Observaciones Adicionales (Opcional)"
            value={formData.observaciones_alumno}
            onChange={(e) => handleChange('observaciones_alumno', e.target.value)}
            error={!!errors.observaciones_alumno}
            helperText={errors.observaciones_alumno || `${(formData.observaciones_alumno || '').length}/500 caracteres`}
            placeholder="Información adicional que consideres relevante..."
            sx={{ mb: 2 }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={handleClose} 
          disabled={loading}
          variant="outlined"
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={loading || !formData.motivo.trim()}
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <ScheduleIcon />}
        >
          {loading ? 'Enviando...' : 'Solicitar Cita'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SolicitudCitaForm;
