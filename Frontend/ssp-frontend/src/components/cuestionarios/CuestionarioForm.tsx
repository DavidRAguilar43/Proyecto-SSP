import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Divider,
  Alert,
  LinearProgress,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Save as SaveIcon,
  Preview as PreviewIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
// import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import PreguntaBuilder from './PreguntaBuilder';
import AsignacionUsuarios from './AsignacionUsuarios';
import VistaPreviaModal from './VistaPreviaModal';
// Importar tipos directamente para evitar problemas de caché
import type {
  CuestionarioAdmin,
  CuestionarioAdminCreate,
  CuestionarioAdminUpdate,
  Pregunta,
  TipoUsuario,
  EstadoCuestionario,
  ValidacionCuestionario
} from '@/types/cuestionarios';
import { validarCuestionario, getConfiguracionPorDefecto } from '@/utils/validacionesCuestionarios';
import { processApiError, logError } from '@/utils/errorHandling';

interface CuestionarioFormProps {
  cuestionario?: CuestionarioAdmin;
  onSubmit: (data: CuestionarioAdminCreate | CuestionarioAdminUpdate) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  mode: 'create' | 'edit';
}

/**
 * Formulario principal para crear y editar cuestionarios administrativos
 */
const CuestionarioForm: React.FC<CuestionarioFormProps> = ({
  cuestionario,
  onSubmit,
  onCancel,
  loading = false,
  mode
}) => {
  // Estados del formulario
  const [titulo, setTitulo] = useState(cuestionario?.titulo || '');
  const [descripcion, setDescripcion] = useState(cuestionario?.descripcion || '');
  const [preguntas, setPreguntas] = useState<Pregunta[]>(cuestionario?.preguntas || []);
  const [tiposUsuario, setTiposUsuario] = useState<TipoUsuario[]>(
    cuestionario?.tipos_usuario_asignados || []
  );
  const [fechaInicio, setFechaInicio] = useState<Date | null>(
    cuestionario?.fecha_inicio ? new Date(cuestionario.fecha_inicio) : null
  );
  const [fechaFin, setFechaFin] = useState<Date | null>(
    cuestionario?.fecha_fin ? new Date(cuestionario.fecha_fin) : null
  );
  const [estado, setEstado] = useState<EstadoCuestionario>(
    cuestionario?.estado || 'borrador'
  );

  // Estados de UI
  const [showPreview, setShowPreview] = useState(false);
  const [validacion, setValidacion] = useState<ValidacionCuestionario | null>(null);
  const [guardandoBorrador, setGuardandoBorrador] = useState(false);

  // Generar ID único para nuevas preguntas
  const generarIdPregunta = () => {
    return `pregunta_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Agregar nueva pregunta
  const agregarPregunta = () => {
    const nuevaPregunta: Pregunta = {
      id: generarIdPregunta(),
      tipo: 'abierta',
      texto: '',
      obligatoria: false,
      orden: preguntas.length + 1,
      configuracion: {}
    };
    setPreguntas([...preguntas, nuevaPregunta]);
  };

  // Eliminar pregunta
  const eliminarPregunta = (index: number) => {
    const nuevasPreguntas = preguntas.filter((_, i) => i !== index);
    // Reordenar las preguntas
    const preguntasReordenadas = nuevasPreguntas.map((pregunta, i) => ({
      ...pregunta,
      orden: i + 1
    }));
    setPreguntas(preguntasReordenadas);
  };

  // Actualizar pregunta
  const actualizarPregunta = (index: number, preguntaActualizada: Pregunta) => {
    const nuevasPreguntas = [...preguntas];
    nuevasPreguntas[index] = preguntaActualizada;
    setPreguntas(nuevasPreguntas);
  };

  // Duplicar pregunta
  const duplicarPregunta = (index: number) => {
    const preguntaOriginal = preguntas[index];
    const preguntaDuplicada: Pregunta = {
      ...preguntaOriginal,
      id: generarIdPregunta(),
      texto: `${preguntaOriginal.texto} (Copia)`,
      orden: preguntas.length + 1
    };
    setPreguntas([...preguntas, preguntaDuplicada]);
  };

  // Validar formulario usando las utilidades
  const validarFormulario = (): ValidacionCuestionario => {
    const datosFormulario = {
      titulo,
      descripcion,
      preguntas,
      tipos_usuario_asignados: tiposUsuario,
      fecha_inicio: fechaInicio?.toISOString(),
      fecha_fin: fechaFin?.toISOString(),
      estado
    };

    return validarCuestionario(datosFormulario);
  };

  // Manejar envío del formulario
  const handleSubmit = async () => {
    const validacionResult = validarFormulario();
    setValidacion(validacionResult);

    if (!validacionResult.es_valido) {
      return;
    }

    const datosFormulario = {
      titulo,
      descripcion,
      preguntas,
      tipos_usuario_asignados: tiposUsuario,
      fecha_inicio: fechaInicio?.toISOString(),
      fecha_fin: fechaFin?.toISOString(),
      estado
    };

    try {
      await onSubmit(datosFormulario);
    } catch (error) {
      logError(error, 'CuestionarioForm.handleSubmit');
      const errorInfo = processApiError(error);
      setValidacion({
        es_valido: false,
        errores_generales: [errorInfo.userMessage],
        errores_preguntas: {}
      });
    }
  };

  // Guardar como borrador
  const guardarBorrador = async () => {
    setGuardandoBorrador(true);
    try {
      const datosFormulario = {
        titulo: titulo || 'Borrador sin título',
        descripcion: descripcion || 'Borrador sin descripción',
        preguntas,
        tipos_usuario_asignados: tiposUsuario,
        fecha_inicio: fechaInicio?.toISOString(),
        fecha_fin: fechaFin?.toISOString(),
        estado: 'borrador' as EstadoCuestionario
      };
      await onSubmit(datosFormulario);
    } catch (error) {
      logError(error, 'CuestionarioForm.guardarBorrador');
      const errorInfo = processApiError(error);
      // Mostrar error pero no bloquear el formulario para borradores
      console.error('Error al guardar borrador:', errorInfo.userMessage);
    } finally {
      setGuardandoBorrador(false);
    }
  };

  // Calcular progreso del formulario
  const calcularProgreso = () => {
    let completado = 0;
    const total = 5; // título, descripción, preguntas, tipos usuario, estado

    if (titulo.trim()) completado++;
    if (descripcion.trim()) completado++;
    if (preguntas.length > 0) completado++;
    if (tiposUsuario.length > 0) completado++;
    if (estado) completado++;

    return (completado / total) * 100;
  };

  const progreso = calcularProgreso();

  return (
    <Box>
      {/* Barra de progreso */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6">
            {mode === 'create' ? 'Crear Cuestionario' : 'Editar Cuestionario'}
          </Typography>
          <Chip 
            label={`${Math.round(progreso)}% completado`} 
            color={progreso === 100 ? 'success' : 'primary'}
            variant="outlined"
          />
        </Box>
        <LinearProgress variant="determinate" value={progreso} />
      </Paper>

      {/* Errores de validación */}
      {validacion && !validacion.es_valido && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Errores encontrados:
          </Typography>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {validacion.errores_generales.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Información básica */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Información Básica
              </Typography>
              
              <TextField
                fullWidth
                label="Título del cuestionario"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                error={!titulo.trim() && validacion !== null}
                helperText={`${titulo.length}/100 caracteres`}
                inputProps={{ maxLength: 100 }}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Descripción"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                error={!descripcion.trim() && validacion !== null}
                helperText={`${descripcion.length}/500 caracteres`}
                inputProps={{ maxLength: 500 }}
                multiline
                rows={3}
                sx={{ mb: 2 }}
              />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Estado</InputLabel>
                    <Select
                      value={estado}
                      label="Estado"
                      onChange={(e) => setEstado(e.target.value as EstadoCuestionario)}
                    >
                      <MenuItem value="borrador">Borrador</MenuItem>
                      <MenuItem value="activo">Activo</MenuItem>
                      <MenuItem value="inactivo">Inactivo</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Fecha de inicio"
                    type="datetime-local"
                    value={fechaInicio ? fechaInicio.toISOString().slice(0, 16) : ''}
                    onChange={(e) => setFechaInicio(e.target.value ? new Date(e.target.value) : null)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Fecha de fin"
                    type="datetime-local"
                    value={fechaFin ? fechaFin.toISOString().slice(0, 16) : ''}
                    onChange={(e) => setFechaFin(e.target.value ? new Date(e.target.value) : null)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Panel lateral */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Asignación de Usuarios
              </Typography>
              <AsignacionUsuarios
                tiposSeleccionados={tiposUsuario}
                onChange={setTiposUsuario}
                error={tiposUsuario.length === 0 && validacion !== null}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Sección de preguntas */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Preguntas ({preguntas.length})
            </Typography>
            <Button
              startIcon={<AddIcon />}
              onClick={agregarPregunta}
              variant="contained"
              disabled={preguntas.length >= 50}
            >
              Agregar Pregunta
            </Button>
          </Box>

          {preguntas.length === 0 && (
            <Alert severity="info">
              Agregue al menos una pregunta para completar el cuestionario.
            </Alert>
          )}

          {preguntas.map((pregunta, index) => (
            <PreguntaBuilder
              key={pregunta.id}
              pregunta={pregunta}
              onChange={(preguntaActualizada) => actualizarPregunta(index, preguntaActualizada)}
              onDelete={() => eliminarPregunta(index)}
              onDuplicate={() => duplicarPregunta(index)}
              index={index}
              totalPreguntas={preguntas.length}
              errors={validacion?.errores_preguntas[pregunta.id]}
            />
          ))}
        </CardContent>
      </Card>

      {/* Botones de acción */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mb: 3 }}>
        <Button
          onClick={onCancel}
          disabled={loading || guardandoBorrador}
        >
          Cancelar
        </Button>
        
        <Button
          onClick={guardarBorrador}
          disabled={loading || guardandoBorrador}
          variant="outlined"
        >
          Guardar Borrador
        </Button>
        
        <Button
          startIcon={<PreviewIcon />}
          onClick={() => setShowPreview(true)}
          variant="outlined"
          disabled={preguntas.length === 0}
        >
          Vista Previa
        </Button>
        
        <Button
          startIcon={<SaveIcon />}
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || guardandoBorrador}
        >
          {mode === 'create' ? 'Crear Cuestionario' : 'Guardar Cambios'}
        </Button>
      </Box>

      {/* Modal de vista previa */}
      <VistaPreviaModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        cuestionario={{
          id: cuestionario?.id || 'preview',
          titulo,
          descripcion,
          preguntas,
          tipos_usuario_asignados: tiposUsuario,
          fecha_creacion: new Date().toISOString(),
          estado,
          creado_por: 'current_user',
          total_preguntas: preguntas.length
        }}
      />
    </Box>
  );
};

export default CuestionarioForm;
