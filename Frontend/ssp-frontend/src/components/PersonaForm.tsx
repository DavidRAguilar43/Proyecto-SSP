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
  Switch,
  Box,
  Typography,
  Chip,
  Autocomplete
} from '@mui/material';
import type { Persona, PersonaCreate, Grupo, ProgramaEducativo } from '../types/index';
import { gruposApi, programasEducativosApi } from '@/services/api';

interface PersonaFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (persona: PersonaCreate) => void;
  persona?: Persona | null;
  loading?: boolean;
}

const PersonaForm = ({ open, onClose, onSubmit, persona, loading = false }: PersonaFormProps) => {
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
    programas_ids: [],
    grupos_ids: [],
  });

  // Estados para cargar grupos y programas
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [programas, setProgramas] = useState<ProgramaEducativo[]>([]);
  const [selectedGrupos, setSelectedGrupos] = useState<Grupo[]>([]);
  const [selectedPrograma, setSelectedPrograma] = useState<ProgramaEducativo | null>(null);

  // Cargar grupos y programas cuando se abra el formulario
  useEffect(() => {
    const loadData = async () => {
      if (open) {
        try {
          const [gruposData, programasData] = await Promise.all([
            gruposApi.getAll(),
            programasEducativosApi.getAll()
          ]);
          setGrupos(gruposData);
          setProgramas(programasData);
        } catch (error) {
          console.error('Error loading grupos and programas:', error);
        }
      }
    };

    loadData();
  }, [open]);

  useEffect(() => {
    if (persona) {
      setFormData({
        tipo_persona: persona.tipo_persona,
        correo_institucional: persona.correo_institucional,
        rol: persona.rol,
        password: '', // No mostrar la contraseña existente
        sexo: persona.sexo || '',
        genero: persona.genero || '',
        edad: persona.edad || 0,
        estado_civil: persona.estado_civil || '',
        religion: persona.religion || '',
        trabaja: persona.trabaja || false,
        lugar_trabajo: persona.lugar_trabajo || '',
        lugar_origen: persona.lugar_origen || '',
        colonia_residencia_actual: persona.colonia_residencia_actual || '',
        celular: persona.celular || '',
        discapacidad: persona.discapacidad || '',
        observaciones: persona.observaciones || '',
        matricula: persona.matricula || '',
        semestre: persona.semestre || 0,
        numero_hijos: persona.numero_hijos || 0,
        grupo_etnico: persona.grupo_etnico || '',
        programas_ids: persona.programas?.map(p => p.id) || [],
        grupos_ids: persona.grupos?.map(g => g.id) || [],
      });

      // Configurar grupos y programas seleccionados
      if (persona.grupos && grupos.length > 0) {
        const personaGrupos = grupos.filter(g => persona.grupos?.some(pg => pg.id === g.id));
        setSelectedGrupos(personaGrupos);
      }

      if (persona.programas && programas.length > 0 && persona.programas.length > 0) {
        const personaPrograma = programas.find(p => persona.programas?.some(pp => pp.id === p.id));
        setSelectedPrograma(personaPrograma || null);
      }
    } else {
      // Reset form for new persona
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
        programas_ids: [],
        grupos_ids: [],
      });
      setSelectedGrupos([]);
      setSelectedPrograma(null);
    }
  }, [persona, open, grupos, programas]);

  const handleChange = (field: keyof PersonaCreate) => (event: any) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Manejar selección de grupos (múltiple para docentes, uno para alumnos)
  const handleGruposChange = (event: any, newValue: Grupo[]) => {
    setSelectedGrupos(newValue);
    setFormData(prev => ({
      ...prev,
      grupos_ids: newValue.map(g => g.id)
    }));
  };

  // Manejar selección de programa educativo (solo uno)
  const handleProgramaChange = (event: any, newValue: ProgramaEducativo | null) => {
    setSelectedPrograma(newValue);
    setFormData(prev => ({
      ...prev,
      programas_ids: newValue ? [newValue.id] : []
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validación básica
    if (!formData.correo_institucional || !formData.celular ||
        !formData.lugar_origen || !formData.colonia_residencia_actual) {
      alert('Por favor, complete todos los campos requeridos.');
      return;
    }

    // Validación de programa educativo para alumnos y docentes (solo en modo creación)
    if (!persona && (formData.tipo_persona === 'alumno' || formData.tipo_persona === 'docente') &&
        (!selectedPrograma)) {
      alert('Por favor, seleccione un programa educativo.');
      return;
    }

    // Validación de grupos para alumnos y docentes (solo en modo creación)
    if (!persona && (formData.tipo_persona === 'alumno' || formData.tipo_persona === 'docente') &&
        selectedGrupos.length === 0) {
      alert('Por favor, seleccione al menos un grupo.');
      return;
    }

    // Para edición, si no hay contraseña, no la incluimos
    const dataToSubmit = { ...formData };
    if (persona && !formData.password) {
      delete dataToSubmit.password;
    }

    // En modo edición, no enviar programas_ids y grupos_ids para preservar las asignaciones existentes
    if (persona) {
      delete dataToSubmit.programas_ids;
      delete dataToSubmit.grupos_ids;
    }

    // Validación de contraseña solo para nuevas personas
    if (!persona && !formData.password) {
      alert('La contraseña es requerida para nuevas personas.');
      return;
    }

    onSubmit(dataToSubmit);
  };

  const isFormValid = () => {
    const basicFieldsValid = formData.correo_institucional &&
                            formData.celular &&
                            formData.lugar_origen &&
                            formData.colonia_residencia_actual &&
                            formData.edad > 0;

    // Validación de programa y grupos para alumnos y docentes (solo en modo creación)
    const academicFieldsValid = (!persona && (formData.tipo_persona === 'alumno' || formData.tipo_persona === 'docente')) ?
      (selectedPrograma && selectedGrupos.length > 0) : true;

    // Para nuevas personas, la contraseña es requerida
    if (!persona) {
      return basicFieldsValid && formData.password && academicFieldsValid;
    }

    // Para editar, la contraseña es opcional
    return basicFieldsValid && academicFieldsValid;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {persona ? `Editar Persona - ${persona.correo_institucional}` : 'Crear Nueva Persona'}
      </DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            {/* Información básica */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Información Básica
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Tipo de Persona</InputLabel>
                <Select
                  value={formData.tipo_persona}
                  onChange={handleChange('tipo_persona')}
                  label="Tipo de Persona"
                >
                  <MenuItem value="alumno">Alumno</MenuItem>
                  <MenuItem value="docente">Docente</MenuItem>
                  <MenuItem value="administrativo">Administrativo</MenuItem>
                  <MenuItem value="otro">Otro</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Rol</InputLabel>
                <Select
                  value={formData.rol}
                  onChange={handleChange('rol')}
                  label="Rol"
                >
                  <MenuItem value="admin">Administrador</MenuItem>
                  <MenuItem value="personal">Personal</MenuItem>
                  <MenuItem value="docente">Docente</MenuItem>
                  <MenuItem value="alumno">Alumno</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Correo Institucional"
                type="email"
                value={formData.correo_institucional}
                onChange={handleChange('correo_institucional')}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Matrícula"
                value={formData.matricula}
                onChange={handleChange('matricula')}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required={!persona}
                label="Contraseña"
                type="password"
                value={formData.password}
                onChange={handleChange('password')}
                helperText={persona ? "Dejar vacío para mantener la contraseña actual" : "Requerida para nuevas personas"}
                placeholder={persona ? "••••••••" : "Ingrese una contraseña"}
              />
            </Grid>

            {/* Asignación de Programa Educativo y Grupos */}
            {(formData.tipo_persona === 'alumno' || formData.tipo_persona === 'docente') && (
              <>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Asignación Académica
                  </Typography>
                </Grid>

                {persona ? (
                  // Modo edición: mostrar información como solo lectura
                  <>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'grey.300' }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Programa Educativo Asignado:
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {selectedPrograma ?
                            `${selectedPrograma.clave_programa} - ${selectedPrograma.nombre_programa}` :
                            'No asignado'
                          }
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Para cambiar el programa educativo, contacte al administrador
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'grey.300' }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          {formData.tipo_persona === 'docente' ? "Grupos Asignados:" : "Grupo Asignado:"}
                        </Typography>
                        {selectedGrupos.length > 0 ? (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {selectedGrupos.map((grupo) => (
                              <Chip
                                key={grupo.id}
                                label={`${grupo.nombre_grupo} (${grupo.tipo_grupo})`}
                                variant="outlined"
                                size="small"
                              />
                            ))}
                          </Box>
                        ) : (
                          <Typography variant="body1">No asignado</Typography>
                        )}
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                          Para cambiar los grupos, contacte al administrador
                        </Typography>
                      </Box>
                    </Grid>
                  </>
                ) : (
                  // Modo creación: mostrar campos editables
                  <>
                    <Grid item xs={12} sm={6}>
                      <Autocomplete
                        options={programas}
                        getOptionLabel={(option) => `${option.clave_programa} - ${option.nombre_programa}`}
                        value={selectedPrograma}
                        onChange={handleProgramaChange}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Programa Educativo"
                            required
                            placeholder="Seleccione un programa educativo..."
                            helperText="Cada persona debe estar asignada a un programa educativo"
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Autocomplete
                        multiple={formData.tipo_persona === 'docente'}
                        options={grupos}
                        getOptionLabel={(option) => `${option.nombre_grupo} (${option.tipo_grupo})`}
                        value={formData.tipo_persona === 'docente' ? selectedGrupos : (selectedGrupos[0] || null)}
                        onChange={(event, newValue) => {
                          if (formData.tipo_persona === 'docente') {
                            handleGruposChange(event, newValue as Grupo[]);
                          } else {
                            handleGruposChange(event, newValue ? [newValue as Grupo] : []);
                          }
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label={formData.tipo_persona === 'docente' ? "Grupos (múltiples)" : "Grupo"}
                            required
                            placeholder={formData.tipo_persona === 'docente' ?
                              "Seleccione uno o más grupos..." :
                              "Seleccione un grupo..."
                            }
                            helperText={formData.tipo_persona === 'docente' ?
                              "Los docentes pueden estar en múltiples grupos" :
                              "Los alumnos deben estar en un grupo"
                            }
                          />
                        )}
                        renderTags={(value, getTagProps) =>
                          formData.tipo_persona === 'docente' ?
                            value.map((option, index) => (
                              <Chip
                                variant="outlined"
                                label={option.nombre_grupo}
                                {...getTagProps({ index })}
                                key={option.id}
                              />
                            )) : null
                        }
                      />
                    </Grid>
                  </>
                )}
              </>
            )}

            {/* Información personal */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Información Personal
              </Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth required>
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

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth required>
                <InputLabel>Género</InputLabel>
                <Select
                  value={formData.genero}
                  onChange={handleChange('genero')}
                  label="Género"
                >
                  <MenuItem value="masculino">Masculino</MenuItem>
                  <MenuItem value="femenino">Femenino</MenuItem>
                  <MenuItem value="no_binario">No Binario</MenuItem>
                  <MenuItem value="otro">Otro</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                label="Edad"
                type="number"
                value={formData.edad}
                onChange={handleChange('edad')}
                inputProps={{ min: 1, max: 120 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
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
                  <MenuItem value="union_libre">Unión Libre</MenuItem>
                  <MenuItem value="otro">Otro</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Religión"
                value={formData.religion}
                onChange={handleChange('religion')}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Celular"
                value={formData.celular}
                onChange={handleChange('celular')}
                placeholder="Ej: 5551234567"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Lugar de Origen"
                value={formData.lugar_origen}
                onChange={handleChange('lugar_origen')}
                placeholder="Ej: Ciudad de México"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Colonia de Residencia Actual"
                value={formData.colonia_residencia_actual}
                onChange={handleChange('colonia_residencia_actual')}
                placeholder="Ej: Centro, Roma Norte, etc."
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.trabaja}
                    onChange={handleChange('trabaja')}
                  />
                }
                label="¿Trabaja actualmente?"
              />
            </Grid>

            {formData.trabaja && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Lugar de Trabajo"
                  value={formData.lugar_trabajo}
                  onChange={handleChange('lugar_trabajo')}
                />
              </Grid>
            )}

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observaciones"
                multiline
                rows={3}
                value={formData.observaciones}
                onChange={handleChange('observaciones')}
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
