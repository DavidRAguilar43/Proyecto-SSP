import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Typography,
  Box,
  Autocomplete,
  Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import type { PersonaCreate, Cohorte } from '../types/index';
import { cohortesApi } from '@/services/api';

interface AlumnoRegistroFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (persona: PersonaCreate) => void;
  loading?: boolean;
}

const AlumnoRegistroForm = ({ open, onClose, onSubmit, loading = false }: AlumnoRegistroFormProps) => {
  const [formData, setFormData] = useState<PersonaCreate>({
    tipo_persona: 'alumno',
    correo_institucional: '',
    rol: 'alumno',
    password: '',
    sexo: 'masculino',
    genero: 'masculino',
    edad: 18,
    estado_civil: 'soltero',
    religion: '',
    trabaja: false,
    lugar_trabajo: '',
    lugar_origen: '',
    colonia_residencia_actual: '',
    celular: '',
    discapacidad: '',
    observaciones: '',
    matricula: '',
    semestre: 1,
    numero_hijos: 0,
    grupo_etnico: '',
    cohorte_id: null,
    programas_ids: [],
    grupos_ids: [],
  });

  // Estados para cohortes
  const [cohortes, setCohortes] = useState<Cohorte[]>([]);
  const [selectedCohorte, setSelectedCohorte] = useState<Cohorte | null>(null);

  // Cargar cohortes cuando se abra el formulario
  useEffect(() => {
    const loadCohortes = async () => {
      if (open) {
        try {
          const cohortesData = await cohortesApi.getActivas();
          setCohortes(cohortesData);
        } catch (error) {
          console.error('Error loading cohortes:', error);
        }
      }
    };

    loadCohortes();
  }, [open]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setFormData({
        tipo_persona: 'alumno',
        correo_institucional: '',
        rol: 'alumno',
        password: '',
        sexo: 'masculino',
        genero: 'masculino',
        edad: 18,
        estado_civil: 'soltero',
        religion: '',
        trabaja: false,
        lugar_trabajo: '',
        lugar_origen: '',
        colonia_residencia_actual: '',
        celular: '',
        discapacidad: '',
        observaciones: '',
        matricula: '',
        semestre: 1,
        numero_hijos: 0,
        grupo_etnico: '',
        cohorte_id: null,
        programas_ids: [],
        grupos_ids: [],
      });
      setSelectedCohorte(null);
    }
  }, [open]);

  const handleChange = (field: keyof PersonaCreate) => (event: any) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Manejar selección de cohorte
  const handleCohorteChange = (event: any, newValue: Cohorte | null) => {
    setSelectedCohorte(newValue);
    setFormData(prev => ({
      ...prev,
      cohorte_id: newValue ? newValue.id : null
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validación básica
    if (!formData.correo_institucional || !formData.celular ||
        !formData.lugar_origen || !formData.colonia_residencia_actual ||
        !formData.password) {
      alert('Por favor, complete todos los campos requeridos.');
      return;
    }

    // Validación de contraseña
    if (formData.password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    // Limpiar y preparar los datos antes de enviar
    const cleanedData = {
      ...formData,
      // Asegurar que los campos string vacíos no sean null/undefined
      religion: formData.religion || '',
      lugar_trabajo: formData.lugar_trabajo || '',
      discapacidad: formData.discapacidad || '',
      observaciones: formData.observaciones || '',
      matricula: formData.matricula || '',
      grupo_etnico: formData.grupo_etnico || '',
      // Asegurar que los arrays no sean null/undefined
      programas_ids: formData.programas_ids || [],
      grupos_ids: formData.grupos_ids || [],
      // Asegurar que cohorte_id sea null si no está seleccionado
      cohorte_id: formData.cohorte_id || null
    };

    console.log('Datos a enviar:', cleanedData);
    onSubmit(cleanedData);
  };

  const isFormValid = () => {
    return formData.correo_institucional && 
           formData.celular && 
           formData.lugar_origen && 
           formData.colonia_residencia_actual &&
           formData.password &&
           formData.password.length >= 6;
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
            
            <Grid size={{ xs: 12 }}>
              <Alert severity="info">
                <strong>Información importante:</strong> Los programas educativos y grupos serán asignados por el personal administrativo después del registro.
              </Alert>
            </Grid>

            {/* Información Personal Básica */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom>
                Información Personal
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                required
                label="Correo Institucional"
                type="email"
                value={formData.correo_institucional}
                onChange={handleChange('correo_institucional')}
                helperText="Use su correo institucional oficial"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                required
                label="Contraseña"
                type="password"
                value={formData.password}
                onChange={handleChange('password')}
                helperText="Mínimo 6 caracteres"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Matrícula"
                value={formData.matricula}
                onChange={handleChange('matricula')}
                helperText="Su número de matrícula estudiantil"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                required
                label="Teléfono Celular"
                value={formData.celular}
                onChange={handleChange('celular')}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Sexo</InputLabel>
                <Select
                  value={formData.sexo}
                  onChange={handleChange('sexo')}
                  label="Sexo"
                >
                  <MenuItem value="masculino">Masculino</MenuItem>
                  <MenuItem value="femenino">Femenino</MenuItem>
                  <MenuItem value="otro">Otro</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Género</InputLabel>
                <Select
                  value={formData.genero}
                  onChange={handleChange('genero')}
                  label="Género"
                >
                  <MenuItem value="masculino">Masculino</MenuItem>
                  <MenuItem value="femenino">Femenino</MenuItem>
                  <MenuItem value="no_binario">No binario</MenuItem>
                  <MenuItem value="otro">Otro</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Edad"
                type="number"
                value={formData.edad}
                onChange={handleChange('edad')}
                inputProps={{ min: 15, max: 100 }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Estado Civil</InputLabel>
                <Select
                  value={formData.estado_civil}
                  onChange={handleChange('estado_civil')}
                  label="Estado Civil"
                >
                  <MenuItem value="soltero">Soltero</MenuItem>
                  <MenuItem value="casado">Casado</MenuItem>
                  <MenuItem value="divorciado">Divorciado</MenuItem>
                  <MenuItem value="viudo">Viudo</MenuItem>
                  <MenuItem value="union_libre">Unión libre</MenuItem>
                  <MenuItem value="otro">Otro</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                required
                label="Lugar de Origen"
                value={formData.lugar_origen}
                onChange={handleChange('lugar_origen')}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                required
                label="Colonia de Residencia Actual"
                value={formData.colonia_residencia_actual}
                onChange={handleChange('colonia_residencia_actual')}
              />
            </Grid>

            {/* Información Académica */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Información Académica
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Semestre"
                type="number"
                value={formData.semestre}
                onChange={handleChange('semestre')}
                inputProps={{ min: 1, max: 12 }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                options={cohortes}
                getOptionLabel={(option) => `${option.nombre} - ${option.descripcion || 'Sin descripción'}`}
                value={selectedCohorte}
                onChange={handleCohorteChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Cohorte (Opcional)"
                    placeholder="Seleccione una cohorte..."
                    helperText="Seleccione su cohorte académica si la conoce"
                  />
                )}
                noOptionsText="No hay cohortes disponibles"
              />
            </Grid>

            {/* Información Adicional */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Información Adicional (Opcional)
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Religión"
                value={formData.religion}
                onChange={handleChange('religion')}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Grupo Étnico"
                value={formData.grupo_etnico}
                onChange={handleChange('grupo_etnico')}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.trabaja}
                    onChange={handleChange('trabaja')}
                  />
                }
                label="¿Trabaja actualmente?"
              />
            </Grid>

            {formData.trabaja && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Lugar de Trabajo"
                  value={formData.lugar_trabajo}
                  onChange={handleChange('lugar_trabajo')}
                />
              </Grid>
            )}

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Número de Hijos"
                type="number"
                value={formData.numero_hijos}
                onChange={handleChange('numero_hijos')}
                inputProps={{ min: 0 }}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Discapacidad"
                value={formData.discapacidad}
                onChange={handleChange('discapacidad')}
                helperText="Describa cualquier discapacidad o necesidad especial"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Observaciones"
                multiline
                rows={3}
                value={formData.observaciones}
                onChange={handleChange('observaciones')}
                helperText="Información adicional que considere relevante"
              />
            </Grid>

          <Grid size={{ xs: 12 }} sx={{ mt: 3 }}>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={!isFormValid() || loading}
              sx={{ py: 1.5 }}
            >
              {loading ? 'Registrando...' : 'Registrar Estudiante'}
            </Button>
          </Grid>

        </Grid>
    </Box>
  );
};

export default AlumnoRegistroForm;
