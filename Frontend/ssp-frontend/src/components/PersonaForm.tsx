import { useState, useEffect } from 'react';
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
  Box,
  Typography
} from '@mui/material';
import type { Persona, PersonaCreateAdmin } from '../types/index';
import CatalogoSelector from './CatalogoSelector';
import { useNotification } from '@/hooks/useNotification';
import { useAuth } from '@/contexts/AuthContext';

interface PersonaFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (persona: PersonaCreateAdmin) => void;
  persona?: Persona | null;
  loading?: boolean;
}

const PersonaForm = ({ open, onClose, onSubmit, persona, loading = false }: PersonaFormProps) => {
  // Hook para notificaciones
  const { notifyError, notifyValidationError } = useNotification();
  // Hook para obtener el usuario actual
  const { user } = useAuth();
  // Estado para el rol de usuario seleccionado (incluye admin y coordinador para administradores)
  const [tipoUsuario, setTipoUsuario] = useState<'alumno' | 'docente' | 'personal' | 'coordinador' | 'admin'>('alumno');

  const [formData, setFormData] = useState<PersonaCreateAdmin>({
    // Usar solo rol (sin tipo_persona)
    rol: 'alumno',
    correo_institucional: '',
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
    is_active: true,  // Por defecto activo
    cohorte_ano: new Date().getFullYear(), // Reason: Año actual del sistema como valor predeterminado
    cohorte_periodo: 1,
    programas_ids: [],
    grupos_ids: [],
  });

  // Estados para cohorte simplificada (campos separados)
  // Reason: Establecer el año actual del sistema como valor predeterminado
  const [cohorteAno, setCohorteAno] = useState<number | ''>(new Date().getFullYear());
  const [cohortePeriodo, setCohortePeriodo] = useState<number>(1);

  // Estado para confirmación de contraseña
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Función para manejar cambio de rol de usuario (incluye admin y coordinador para administradores)
  const handleTipoUsuarioChange = (tipo: 'alumno' | 'docente' | 'personal' | 'coordinador' | 'admin') => {
    // Validación de seguridad: solo admin puede asignar roles administrativos
    if ((tipo === 'coordinador' || tipo === 'admin') && user?.rol !== 'admin') {
      notifyError('Solo los administradores pueden asignar roles administrativos');
      return;
    }

    setTipoUsuario(tipo);

    // Actualizar formData según el rol seleccionado
    setFormData(prev => ({
      ...prev,
      rol: tipo,
      // Solo limpiar semestre si no es alumno, mantener matrícula para todos
      semestre: tipo === 'alumno' ? prev.semestre : undefined,
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

  useEffect(() => {
    if (persona) {
      // Actualizar tipoUsuario basado en el rol de la persona
      setTipoUsuario(persona.rol as 'alumno' | 'docente' | 'personal' | 'coordinador' | 'admin');

      // Limpiar confirmación de contraseña en modo edición
      setConfirmPassword('');
      setPasswordError('');

      setFormData({
        // SEGURIDAD: Eliminamos tipo_persona, usamos solo rol
        correo_institucional: persona.correo_institucional,
        rol: persona.rol as 'alumno' | 'docente' | 'personal' | 'coordinador' | 'admin',
        password: '', // No mostrar la contraseña existente
        sexo: (persona.sexo as 'no_decir' | 'masculino' | 'femenino' | 'otro') || 'no_decir',
        genero: (persona.genero as 'no_decir' | 'masculino' | 'femenino' | 'no_binario' | 'otro') || 'no_decir',
        edad: persona.edad || 18,
        estado_civil: (persona.estado_civil as 'soltero' | 'casado' | 'divorciado' | 'viudo' | 'union_libre' | 'otro') || 'soltero',
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
        is_active: persona.is_active !== undefined ? persona.is_active : true,
        cohorte_ano: undefined, // Los campos de cohorte se manejan por separado
        cohorte_periodo: 1,
        programas_ids: [],
        grupos_ids: [],
      });
    } else {
      // Reset form for new persona
      const currentYear = new Date().getFullYear(); // Reason: Obtener año actual para reset
      setTipoUsuario('alumno');
      setConfirmPassword('');
      setPasswordError('');
      setCohorteAno(currentYear); // Reason: Establecer año actual en el estado local
      setCohortePeriodo(1);

      setFormData({
        // SEGURIDAD: Eliminamos tipo_persona, usamos solo rol
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
        is_active: true,  // Por defecto activo para nuevas personas
        cohorte_ano: currentYear, // Reason: Año actual del sistema como valor predeterminado
        cohorte_periodo: 1,
        programas_ids: [],
        grupos_ids: [],
      });
    }
  }, [persona, open]);

  const handleChange = (field: keyof PersonaCreateAdmin) => (event: any) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validación básica
    if (!formData.correo_institucional || !formData.celular ||
        !formData.lugar_origen || !formData.colonia_residencia_actual ||
        !formData.matricula) {
      notifyValidationError('Por favor, complete todos los campos requeridos.');
      return;
    }

    // Validación de contraseña
    if (!persona) {
      // Para nuevas personas, la contraseña es obligatoria
      if (!formData.password) {
        notifyValidationError('La contraseña es requerida para nuevas personas.');
        return;
      }

      if (formData.password.length < 8) {
        notifyValidationError('La contraseña debe tener al menos 8 caracteres.');
        return;
      }

      if (formData.password !== confirmPassword) {
        notifyValidationError('Las contraseñas no coinciden.');
        return;
      }
    } else if (formData.password) {
      // Para edición, validar solo si se está cambiando la contraseña
      if (formData.password.length < 8) {
        notifyValidationError('La contraseña debe tener al menos 8 caracteres.');
        return;
      }

      if (formData.password !== confirmPassword) {
        notifyValidationError('Las contraseñas no coinciden.');
        return;
      }
    }

    // Preparar datos para envío
    const dataToSubmit: Partial<PersonaCreateAdmin> = { ...formData };

    // Para edición, si no hay contraseña, no la incluimos
    if (persona && !formData.password) {
      delete dataToSubmit.password;
    }

    // Limpiar campos vacíos opcionales
    Object.keys(dataToSubmit).forEach(key => {
      const value = dataToSubmit[key as keyof PersonaCreateAdmin];
      if (value === '' || value === null || value === undefined) {
        delete dataToSubmit[key as keyof PersonaCreateAdmin];
      }
    });

    console.log('Datos a enviar:', dataToSubmit);
    onSubmit(dataToSubmit as PersonaCreateAdmin);
  };

  const isFormValid = () => {
    const basicFieldsValid = formData.correo_institucional &&
                            formData.celular &&
                            formData.lugar_origen &&
                            formData.colonia_residencia_actual &&
                            formData.matricula &&
                            formData.edad > 0;

    // Para nuevas personas, validar contraseña y confirmación
    if (!persona) {
      return basicFieldsValid &&
             formData.password &&
             formData.password.length >= 8 &&
             confirmPassword &&
             formData.password === confirmPassword &&
             !passwordError;
    }

    // Para editar, validar contraseña solo si se está cambiando
    if (persona && formData.password) {
      return basicFieldsValid &&
             formData.password.length >= 8 &&
             confirmPassword &&
             formData.password === confirmPassword &&
             !passwordError;
    }

    // Para editar sin cambiar contraseña
    return basicFieldsValid;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {persona ? `Editar Persona - ${persona.correo_institucional}` : 'Crear Nueva Persona'}
      </DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <Grid container spacing={3}>

            {/* Selección de rol de usuario */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom>
                Rol
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Rol del usuario</InputLabel>
                <Select
                  value={tipoUsuario}
                  onChange={(e) => handleTipoUsuarioChange(e.target.value as 'alumno' | 'docente' | 'personal' | 'coordinador' | 'admin')}
                  label="Rol del usuario"
                >
                  <MenuItem value="alumno">Estudiante</MenuItem>
                  <MenuItem value="docente">Docente</MenuItem>
                  <MenuItem value="personal">Personal Administrativo</MenuItem>
                  {/* Mostrar coordinador si: es admin O la persona ya es coordinador */}
                  {(user?.rol === 'admin' || tipoUsuario === 'coordinador') && (
                    <MenuItem value="coordinador">Coordinador</MenuItem>
                  )}
                  {/* Mostrar admin si: es admin O la persona ya es admin */}
                  {(user?.rol === 'admin' || tipoUsuario === 'admin') && (
                    <MenuItem value="admin">Administrador</MenuItem>
                  )}
                </Select>
              </FormControl>
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
                required={!persona}
                label="Contraseña"
                type="password"
                value={formData.password}
                onChange={handleChange('password')}
                helperText={persona ? "Dejar vacío para mantener la contraseña actual" : "Mínimo 8 caracteres"}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                required={!persona}
                label="Confirmar contraseña"
                type="password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                error={!!passwordError}
                helperText={passwordError || (persona ? "Dejar vacío para mantener la contraseña actual" : "Repita su contraseña")}
              />
            </Grid>

            {/* Matrícula - para todos los tipos de usuario */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                required
                label="Matrícula"
                value={formData.matricula}
                onChange={handleChange('matricula')}
                helperText={
                  tipoUsuario === 'alumno' ? "Su número de matrícula estudiantil" :
                  tipoUsuario === 'docente' ? "Su número de matrícula como docente" :
                  tipoUsuario === 'coordinador' ? "Su número de matrícula como coordinador" :
                  tipoUsuario === 'admin' ? "Su número de matrícula administrativa" :
                  "Su número de matrícula institucional"
                }
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
                required
                label="Edad"
                type="number"
                value={formData.edad}
                onChange={handleChange('edad')}
                slotProps={{ htmlInput: { min: 15, max: 100 } }}
                helperText="Edad entre 15 y 100 años"
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
                helperText="Campo obligatorio"
              />
            </Grid>

            {/* Campo Estado Activo - Solo para administradores */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.is_active || false}
                    onChange={handleChange('is_active')}
                    color="primary"
                  />
                }
                label="Usuario Activo"
              />
              <Typography variant="caption" display="block" color="text.secondary">
                {formData.is_active ?
                  "El usuario puede acceder al sistema" :
                  "El usuario no puede acceder al sistema"
                }
              </Typography>
            </Grid>

            {/* Información Académica - solo para alumnos */}
            {(tipoUsuario === 'alumno' || formData.rol === 'alumno') && (
              <>
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
              </>
            )}

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
          {loading ? 'Guardando...' : (persona ? 'Actualizar' : 'Crear')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PersonaForm;
