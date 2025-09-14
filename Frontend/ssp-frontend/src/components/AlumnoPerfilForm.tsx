import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
import type { Persona, PersonaCreate, Cohorte } from '../types/index';
import { cohortesApi } from '@/services/api';
import { useNotification } from '@/hooks/useNotification';

interface AlumnoPerfilFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (persona: Partial<PersonaCreate>) => void;
  persona: Persona;
  loading?: boolean;
}

const AlumnoPerfilForm = ({ open, onClose, onSubmit, persona, loading = false }: AlumnoPerfilFormProps) => {
  // Hook para notificaciones
  const { notifyValidationError } = useNotification();

  const [formData, setFormData] = useState<Partial<PersonaCreate>>({});
  
  // Estados para cohortes
  const [cohortes, setCohortes] = useState<Cohorte[]>([]);
  const [selectedCohorte, setSelectedCohorte] = useState<Cohorte | null>(null);

  // Estados para campos de cohorte simplificados
  const [cohorteAno, setCohorteAno] = useState<number | ''>('');
  const [cohortePeriodo, setCohortePeriodo] = useState<number>(1);

  // Estado para confirmación de contraseña
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Cargar cohortes cuando se abra el formulario
  useEffect(() => {
    const loadCohortes = async () => {
      if (open) {
        try {
          const cohortesData = await cohortesApi.getActivas();
          setCohortes(cohortesData);
        } catch (error: any) {
          console.error('Error loading cohortes:', error);
          // Silently fail for now, cohortes will be empty
        }
      }
    };

    loadCohortes();
  }, [open]);

  // Inicializar formulario con datos del usuario
  useEffect(() => {
    if (persona && open) {
      // Limpiar confirmación de contraseña
      setConfirmPassword('');
      setPasswordError('');

      // Inicializar campos de cohorte
      setCohorteAno(persona.cohorte_ano || '');
      setCohortePeriodo(persona.cohorte_periodo || 1);

      setFormData({
        sexo: persona.sexo || 'masculino',
        genero: persona.genero || 'masculino',
        edad: persona.edad || 18,
        estado_civil: persona.estado_civil || 'soltero',
        religion: persona.religion || '',
        trabaja: persona.trabaja || false,
        lugar_trabajo: persona.lugar_trabajo || '',
        lugar_origen: persona.lugar_origen || '',
        colonia_residencia_actual: persona.colonia_residencia_actual || '',
        celular: persona.celular || '',
        discapacidad: persona.discapacidad || '',
        observaciones: persona.observaciones || '',
        matricula: persona.matricula || '',
        semestre: persona.semestre || 1,
        numero_hijos: persona.numero_hijos || 0,
        grupo_etnico: persona.grupo_etnico || '',
        cohorte_id: persona.cohorte_id || null,
        cohorte_ano: persona.cohorte_ano || undefined,
        cohorte_periodo: persona.cohorte_periodo || 1,
        password: '', // Siempre vacío para edición
      });

      // Configurar cohorte seleccionada
      if (persona.cohorte && cohortes.length > 0) {
        const personaCohorte = cohortes.find(c => c.id === persona.cohorte?.id);
        setSelectedCohorte(personaCohorte || null);
      }
    }
  }, [persona, open, cohortes]);

  const handleChange = (field: keyof PersonaCreate) => (event: any) => {
    let value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;

    // Convert numeric fields to numbers
    if (event.target.type === 'number' && value !== '') {
      value = parseInt(value, 10);
    }

    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Funciones para manejar cambios en cohorte
  const handleCohorteAnoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value === '' ? '' : parseInt(event.target.value);
    setCohorteAno(value);
    setFormData(prev => ({
      ...prev,
      cohorte_ano: value === '' ? undefined : value
    }));
  };

  const handleCohortePeriodoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    setCohortePeriodo(value);
    setFormData(prev => ({
      ...prev,
      cohorte_periodo: value
    }));
  };

  // Función para manejar confirmación de contraseña
  const handleConfirmPasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setConfirmPassword(value);

    if (value && formData.password && value !== formData.password) {
      setPasswordError('Las contraseñas no coinciden');
    } else {
      setPasswordError('');
    }
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
    if (!formData.celular || !formData.lugar_origen || !formData.colonia_residencia_actual) {
      notifyValidationError('Por favor, complete todos los campos requeridos.');
      return;
    }

    // Validación de contraseña si se proporciona
    if (formData.password) {
      if (formData.password.length < 8) {
        notifyValidationError('La contraseña debe tener al menos 8 caracteres.');
        return;
      }

      if (formData.password !== confirmPassword) {
        notifyValidationError('Las contraseñas no coinciden.');
        return;
      }
    }

    // Filtrar campos vacíos y asegurar tipos correctos
    const cleanData = Object.fromEntries(
      Object.entries(formData).filter(([key, value]) =>
        value !== '' && value !== null && value !== undefined
      )
    );

    // Asegurar que los campos numéricos sean números
    const numericFields = ['edad', 'semestre', 'numero_hijos', 'cohorte_id'];
    numericFields.forEach(field => {
      if (cleanData[field] !== undefined && cleanData[field] !== null) {
        cleanData[field] = parseInt(cleanData[field], 10);
      }
    });

    onSubmit(cleanData);
  };

  const isFormValid = () => {
    const basicFieldsValid = formData.celular &&
                            formData.lugar_origen &&
                            formData.colonia_residencia_actual;

    // Si se está cambiando la contraseña, validar que coincidan
    if (formData.password) {
      return basicFieldsValid &&
             formData.password.length >= 8 &&
             confirmPassword &&
             formData.password === confirmPassword &&
             !passwordError;
    }

    // Si no se está cambiando la contraseña, solo validar campos básicos
    return basicFieldsValid;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h5" component="div">
          Editar Mi Perfil
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Actualice su información personal
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <Grid container spacing={3}>
            
            <Grid size={{ xs: 12 }}>
              <Alert severity="info">
                <strong>Nota:</strong> Solo puede modificar su información personal. Los programas educativos y grupos son asignados por el personal administrativo.
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
                disabled
                label="Correo Institucional"
                value={persona.correo_institucional}
                helperText="No se puede modificar"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Nueva Contraseña (Opcional)"
                type="password"
                value={formData.password || ''}
                onChange={handleChange('password')}
                helperText="Dejar vacío para mantener la actual. Mínimo 8 caracteres"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Confirmar Nueva Contraseña"
                type="password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                error={!!passwordError}
                helperText={passwordError || "Solo si cambió la contraseña arriba"}
                disabled={!formData.password}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Matrícula"
                value={formData.matricula || ''}
                onChange={handleChange('matricula')}
                helperText="Este campo no se puede modificar"
                disabled
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                required
                label="Teléfono Celular"
                value={formData.celular || ''}
                onChange={handleChange('celular')}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Sexo</InputLabel>
                <Select
                  value={formData.sexo || 'masculino'}
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
                  value={formData.genero || 'masculino'}
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
                value={formData.edad || 18}
                onChange={handleChange('edad')}
                inputProps={{ min: 15, max: 100 }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Estado Civil</InputLabel>
                <Select
                  value={formData.estado_civil || 'soltero'}
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
                value={formData.lugar_origen || ''}
                onChange={handleChange('lugar_origen')}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                required
                label="Colonia de Residencia Actual"
                value={formData.colonia_residencia_actual || ''}
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
                value={formData.semestre || 1}
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
                  />
                )}
                noOptionsText="No hay cohortes disponibles"
              />
            </Grid>

            {/* Campos de Cohorte Simplificados */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Año de Cohorte (Opcional)"
                type="number"
                value={cohorteAno === '' ? '' : cohorteAno}
                onChange={handleCohorteAnoChange}
                slotProps={{
                  htmlInput: {
                    min: 1000,
                    max: 9999,
                    step: 1
                  }
                }}
                helperText="Año académico de 4 dígitos (ej: 2024, 2025)"
                placeholder="2024"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                select
                label="Período de Cohorte"
                value={cohortePeriodo}
                onChange={handleCohortePeriodoChange}
                helperText="Período académico (por defecto: 1)"
              >
                <MenuItem value={1}>Período 1</MenuItem>
                <MenuItem value={2}>Período 2</MenuItem>
              </TextField>
            </Grid>

            {/* Información Adicional */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Información Adicional
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Religión"
                value={formData.religion || ''}
                onChange={handleChange('religion')}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Grupo Étnico"
                value={formData.grupo_etnico || ''}
                onChange={handleChange('grupo_etnico')}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.trabaja || false}
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
                  value={formData.lugar_trabajo || ''}
                  onChange={handleChange('lugar_trabajo')}
                />
              </Grid>
            )}

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Número de Hijos"
                type="number"
                value={formData.numero_hijos || 0}
                onChange={handleChange('numero_hijos')}
                inputProps={{ min: 0 }}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Discapacidad"
                value={formData.discapacidad || ''}
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
                value={formData.observaciones || ''}
                onChange={handleChange('observaciones')}
                helperText="Información adicional que considere relevante"
              />
            </Grid>

          </Grid>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!isFormValid() || loading}
        >
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AlumnoPerfilForm;
