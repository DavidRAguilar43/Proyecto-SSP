import React from 'react';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Typography,
  Box,
  Grid
} from '@mui/material';
import type { PersonaCreate } from '../types/index';
import CatalogoSelector from './CatalogoSelector';

interface PersonaFieldsSharedProps {
  formData: PersonaCreate;
  onChange: (field: keyof PersonaCreate) => (event: any) => void;
  showPassword?: boolean;
  passwordRequired?: boolean;
  passwordHelperText?: string;
  showConfirmPassword?: boolean;
  confirmPassword?: string;
  onConfirmPasswordChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  passwordError?: string;
  emailError?: string;
  matriculaError?: string;
  validatingEmail?: boolean;
  validatingMatricula?: boolean;
  showRoleSelection?: boolean;
  isEditing?: boolean;
  userRole?: 'alumno' | 'docente' | 'personal' | 'admin';
  cohorteAno?: number | '';
  cohortePeriodo?: number;
  onCohorteAnoChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCohortePeriodoChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const PersonaFieldsShared: React.FC<PersonaFieldsSharedProps> = ({
  formData,
  onChange,
  showPassword = true,
  passwordRequired = true,
  passwordHelperText = "Mínimo 8 caracteres",
  showConfirmPassword = false,
  confirmPassword = '',
  onConfirmPasswordChange,
  passwordError = '',
  emailError = '',
  matriculaError = '',
  validatingEmail = false,
  validatingMatricula = false,
  showRoleSelection = false,
  isEditing = false,
  userRole = 'alumno',
  cohorteAno = '',
  cohortePeriodo = 1,
  onCohorteAnoChange,
  onCohortePeriodoChange
}) => {
  return (
    <Grid container spacing={2}>
      {/* Información Básica */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Información Básica
        </Typography>
      </Grid>

      {/* Rol - Solo para admin */}
      {showRoleSelection && (
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required>
            <InputLabel>Rol</InputLabel>
            <Select
              value={formData.rol}
              onChange={onChange('rol')}
              label="Rol"
            >
              <MenuItem value="admin">Administrador</MenuItem>
              <MenuItem value="personal">Personal</MenuItem>
              <MenuItem value="docente">Docente</MenuItem>
              <MenuItem value="alumno">Alumno</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      )}

      {/* Correo Institucional */}
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          required
          label="Correo Institucional"
          type="email"
          value={formData.correo_institucional}
          onChange={onChange('correo_institucional')}
          error={!!emailError}
          helperText={emailError || (validatingEmail ? "Verificando disponibilidad..." : "Debe ser un correo institucional válido (@uabc.edu.mx)")}
          disabled={isEditing} // No permitir cambiar email en edición
        />
      </Grid>

      {/* Matrícula */}
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          required
          label="Matrícula"
          value={formData.matricula}
          onChange={onChange('matricula')}
          error={!!matriculaError}
          helperText={matriculaError || (validatingMatricula ? "Verificando disponibilidad..." :
            userRole === 'alumno' ? "Su número de matrícula estudiantil" :
            userRole === 'docente' ? "Su número de matrícula como docente" :
            "Su número de matrícula institucional"
          )}
        />
      </Grid>

      {/* Contraseña */}
      {showPassword && (
        <Grid item xs={12} sm={showConfirmPassword ? 6 : 12}>
          <TextField
            fullWidth
            required={passwordRequired}
            label="Contraseña"
            type="password"
            value={formData.password}
            onChange={onChange('password')}
            helperText={passwordHelperText}
            placeholder={isEditing ? "••••••••" : "Ingrese una contraseña"}
          />
        </Grid>
      )}

      {/* Confirmar Contraseña */}
      {showConfirmPassword && onConfirmPasswordChange && (
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            required
            label="Confirmar contraseña"
            type="password"
            value={confirmPassword}
            onChange={onConfirmPasswordChange}
            error={!!passwordError}
            helperText={passwordError || "Repita su contraseña"}
          />
        </Grid>
      )}

      {/* Teléfono Celular */}
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          required
          label="Teléfono Celular"
          value={formData.celular}
          onChange={onChange('celular')}
        />
      </Grid>

      {/* Sexo */}
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Sexo</InputLabel>
          <Select
            value={formData.sexo}
            onChange={onChange('sexo')}
            label="Sexo"
          >
            <MenuItem value="no_decir">Prefiero no decir</MenuItem>
            <MenuItem value="masculino">Masculino</MenuItem>
            <MenuItem value="femenino">Femenino</MenuItem>
            <MenuItem value="otro">Otro</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      {/* Género */}
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Género</InputLabel>
          <Select
            value={formData.genero}
            onChange={onChange('genero')}
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

      {/* Edad */}
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          required
          label="Edad"
          type="number"
          value={formData.edad}
          onChange={onChange('edad')}
          slotProps={{ htmlInput: { min: 15, max: 100 } }}
          helperText="Edad entre 15 y 100 años"
        />
      </Grid>

      {/* Estado Civil */}
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Estado Civil</InputLabel>
          <Select
            value={formData.estado_civil}
            onChange={onChange('estado_civil')}
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

      {/* Lugar de Origen */}
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          required
          label="Lugar de Origen"
          value={formData.lugar_origen}
          onChange={onChange('lugar_origen')}
        />
      </Grid>

      {/* Colonia de Residencia Actual */}
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          required
          label="Colonia de Residencia Actual"
          value={formData.colonia_residencia_actual}
          onChange={onChange('colonia_residencia_actual')}
          helperText="Campo obligatorio"
        />
      </Grid>

      {/* Información Académica - solo para alumnos */}
      {(userRole === 'alumno' || formData.rol === 'alumno') && (
        <>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Información Académica
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Semestre"
              type="number"
              value={formData.semestre}
              onChange={onChange('semestre')}
              slotProps={{ htmlInput: { min: 1, max: 12 } }}
            />
          </Grid>

          {/* Año de Cohorte */}
          {onCohorteAnoChange && (
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Año de Cohorte (Opcional)"
                type="number"
                value={cohorteAno === '' ? '' : cohorteAno}
                onChange={onCohorteAnoChange}
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
          )}

          {/* Período de Cohorte */}
          {onCohortePeriodoChange && (
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Período de Cohorte (Opcional)"
                value={cohortePeriodo}
                onChange={onCohortePeriodoChange}
                helperText="Período académico (por defecto: 1)"
              >
                <MenuItem value={1}>Período 1</MenuItem>
                <MenuItem value={2}>Período 2</MenuItem>
              </TextField>
            </Grid>
          )}
        </>
      )}

      {/* Información Adicional */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          Información Adicional (Opcional)
        </Typography>
      </Grid>

      {/* Religión */}
      <Grid item xs={12} sm={6}>
        <CatalogoSelector
          tipo="religion"
          label="Religión"
          value={formData.religion || ''}
          onChange={(value) => onChange('religion')({ target: { value } })}
        />
      </Grid>

      {/* Grupo Étnico */}
      <Grid item xs={12} sm={6}>
        <CatalogoSelector
          tipo="grupo_etnico"
          label="Grupo Étnico"
          value={formData.grupo_etnico || ''}
          onChange={(value) => onChange('grupo_etnico')({ target: { value } })}
        />
      </Grid>

      {/* ¿Trabaja? */}
      <Grid item xs={12} sm={6}>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.trabaja}
              onChange={onChange('trabaja')}
            />
          }
          label="¿Trabaja actualmente?"
        />
      </Grid>

      {/* Lugar de Trabajo - Solo si trabaja */}
      {formData.trabaja && (
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Lugar de Trabajo"
            value={formData.lugar_trabajo}
            onChange={onChange('lugar_trabajo')}
          />
        </Grid>
      )}

      {/* Número de Hijos */}
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Número de Hijos"
          type="number"
          value={formData.numero_hijos}
          onChange={onChange('numero_hijos')}
          slotProps={{ htmlInput: { min: 0 } }}
        />
      </Grid>

      {/* Discapacidad */}
      <Grid item xs={12}>
        <CatalogoSelector
          tipo="discapacidad"
          label="Discapacidad"
          value={formData.discapacidad || ''}
          onChange={(value) => onChange('discapacidad')({ target: { value } })}
          helperText="Seleccione si tiene alguna discapacidad o necesidad especial"
        />
      </Grid>

      {/* Observaciones */}
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Observaciones"
          multiline
          rows={3}
          value={formData.observaciones}
          onChange={onChange('observaciones')}
          helperText="Información adicional que considere relevante"
        />
      </Grid>
    </Grid>
  );
};

export default PersonaFieldsShared;
