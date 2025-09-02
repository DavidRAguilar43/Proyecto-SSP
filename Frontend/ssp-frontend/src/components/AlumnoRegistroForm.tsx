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
  Alert
} from '@mui/material';

import type { PersonaCreate } from '../types/index';
import { personasApi, catalogosApi } from '@/services/api';
import CatalogoSelector from './CatalogoSelector';

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
    sexo: 'no_decir',
    genero: 'no_decir',
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
    cohorte_ano: undefined,
    cohorte_periodo: 1,
    programas_ids: [],
    grupos_ids: [],
  });

  // Estados para cohorte simplificada (campos separados)
  const [cohorteAno, setCohorteAno] = useState<number | ''>('');
  const [cohortePeriodo, setCohortePeriodo] = useState<number>(1);

  // Estado para confirmación de contraseña
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Estados para validación de duplicados
  const [emailError, setEmailError] = useState('');
  const [matriculaError, setMatriculaError] = useState('');
  const [validatingEmail, setValidatingEmail] = useState(false);
  const [validatingMatricula, setValidatingMatricula] = useState(false);



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
        cohorte_ano: undefined,
        cohorte_periodo: 1,
        programas_ids: [],
        grupos_ids: [],
      });
      setCohorteAno('');
      setCohortePeriodo(1);
      setConfirmPassword('');
      setPasswordError('');
      setEmailError('');
      setMatriculaError('');
    }
  }, [open]);

  const handleChange = (field: keyof PersonaCreate) => (event: any) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Validar contraseñas cuando se cambie el campo password
    if (field === 'password' && confirmPassword) {
      validatePasswordMatch(value, confirmPassword);
    }
  };

  // Effect para validar email con debounce
  useEffect(() => {
    if (formData.correo_institucional) {
      setEmailError('');
      const timeoutId = setTimeout(() => {
        validateEmail(formData.correo_institucional);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setEmailError('');
    }
  }, [formData.correo_institucional]);

  // Effect para validar matrícula con debounce
  useEffect(() => {
    setMatriculaError('');
    const timeoutId = setTimeout(() => {
      validateMatricula(formData.matricula);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.matricula]);

  // Manejar cambio en confirmación de contraseña
  const handleConfirmPasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setConfirmPassword(value);
    validatePasswordMatch(formData.password, value);
  };

  // Validar que las contraseñas coincidan
  const validatePasswordMatch = (password: string, confirmPass: string) => {
    if (confirmPass && password !== confirmPass) {
      setPasswordError('Las contraseñas no coinciden');
    } else {
      setPasswordError('');
    }
  };

  // Validar email en tiempo real
  const validateEmail = async (email: string) => {
    if (!email || !email.includes('@')) {
      setEmailError('');
      return;
    }

    try {
      setValidatingEmail(true);
      const result = await personasApi.validateEmail(email);
      if (!result.available) {
        setEmailError('Este correo electrónico ya está registrado');
      } else {
        setEmailError('');
      }
    } catch (error) {
      console.error('Error validating email:', error);
      setEmailError('');
    } finally {
      setValidatingEmail(false);
    }
  };

  // Validar matrícula en tiempo real
  const validateMatricula = async (matricula: string) => {
    if (!matricula || matricula.trim() === '') {
      setMatriculaError('La matrícula es obligatoria');
      return;
    }

    try {
      setValidatingMatricula(true);
      const result = await personasApi.validateMatricula(matricula);
      if (!result.available) {
        setMatriculaError(result.message || 'Esta matrícula ya está registrada');
      } else {
        setMatriculaError('');
      }
    } catch (error) {
      console.error('Error validating matricula:', error);
      setMatriculaError('');
    } finally {
      setValidatingMatricula(false);
    }
  };

  // Manejar cambio de año de cohorte
  const handleCohorteAnoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const numValue = value === '' ? '' : parseInt(value, 10);
    setCohorteAno(numValue);

    // Actualizar formData directamente
    setFormData(prev => ({
      ...prev,
      cohorte_ano: numValue === '' ? undefined : numValue
    }));
  };

  // Manejar cambio de período de cohorte
  const handleCohortePeriodoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    setCohortePeriodo(value);

    // Actualizar formData directamente
    setFormData(prev => ({
      ...prev,
      cohorte_periodo: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación básica
    if (!formData.correo_institucional || !formData.celular ||
        !formData.lugar_origen || !formData.password || !formData.matricula) {
      alert('Por favor, complete todos los campos requeridos.');
      return;
    }

    // Validación de contraseña
    if (formData.password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    // Validación de confirmación de contraseña
    if (!confirmPassword) {
      alert('Por favor, confirme su contraseña.');
      return;
    }

    if (formData.password !== confirmPassword) {
      alert('Las contraseñas no coinciden.');
      return;
    }

    // Validación de duplicados
    if (emailError) {
      alert('El correo electrónico ya está registrado.');
      return;
    }

    if (matriculaError) {
      alert('La matrícula ya está registrada.');
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
      colonia_residencia_actual: formData.colonia_residencia_actual || '',
      // Asegurar que los arrays no sean null/undefined
      programas_ids: formData.programas_ids || [],
      grupos_ids: formData.grupos_ids || [],
      // Enviar campos de cohorte por separado
      cohorte_ano: formData.cohorte_ano || undefined,
      cohorte_periodo: formData.cohorte_periodo || 1
    };

    console.log('Datos a enviar:', cleanedData);

    // Enviar datos y procesar elementos personalizados después del éxito
    try {
      await onSubmit(cleanedData);

      // Solo después del envío exitoso, procesar elementos personalizados
      await catalogosApi.procesarElementosPersonalizados(cleanedData);

    } catch (error) {
      // Si hay error en el envío, no procesar elementos personalizados
      throw error;
    }
  };

  const isFormValid = () => {
    return formData.correo_institucional &&
           formData.celular &&
           formData.lugar_origen &&
           formData.password &&
           formData.password.length >= 6 &&
           formData.matricula &&
           confirmPassword &&
           formData.password === confirmPassword &&
           !passwordError &&
           !emailError &&
           !matriculaError &&
           !validatingEmail &&
           !validatingMatricula;
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
                error={!!emailError}
                helperText={emailError || (validatingEmail ? "Verificando disponibilidad..." : "Use su correo institucional oficial")}
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
                required
                label="Confirmar contraseña"
                type="password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                error={!!passwordError}
                helperText={passwordError || "Repita su contraseña"}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                required
                label="Matrícula"
                value={formData.matricula}
                onChange={handleChange('matricula')}
                error={!!matriculaError}
                helperText={matriculaError || (validatingMatricula ? "Verificando disponibilidad..." : "Su número de matrícula estudiantil")}
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
                  <MenuItem value="no_decir">Prefiero no decir</MenuItem>
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
                  <MenuItem value="no_decir">Prefiero no decir</MenuItem>
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
                slotProps={{ htmlInput: { min: 15, max: 100 } }}
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
                slotProps={{ htmlInput: { min: 1, max: 12 } }}
              />
            </Grid>

            {/* Año de Cohorte */}
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

            {/* Período de Cohorte */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                select
                label="Período de Cohorte (Opcional)"
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
                Información Adicional (Opcional)
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <CatalogoSelector
                tipo="religion"
                label="Religión"
                value={formData.religion || ''}
                onChange={(value) => setFormData(prev => ({ ...prev, religion: value }))}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <CatalogoSelector
                tipo="grupo_etnico"
                label="Grupo Étnico"
                value={formData.grupo_etnico || ''}
                onChange={(value) => setFormData(prev => ({ ...prev, grupo_etnico: value }))}
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
                slotProps={{ htmlInput: { min: 0 } }}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <CatalogoSelector
                tipo="discapacidad"
                label="Discapacidad"
                value={formData.discapacidad || ''}
                onChange={(value) => setFormData(prev => ({ ...prev, discapacidad: value }))}
                helperText="Seleccione si tiene alguna discapacidad o necesidad especial"
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
