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
  Delete as DeleteIcon,
  CheckCircle as ActivarIcon,
  Cancel as DesactivarIcon
} from '@mui/icons-material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
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
  onCambiarEstado?: (nuevoEstado: EstadoCuestionario) => Promise<void>;
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
  onCambiarEstado,
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

  // Configurar sensores para drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Requiere mover 8px antes de activar el drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  // Manejar el fin del drag & drop
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = preguntas.findIndex((p) => p.id === active.id);
      const newIndex = preguntas.findIndex((p) => p.id === over.id);

      const nuevasPreguntas = arrayMove(preguntas, oldIndex, newIndex);

      // Actualizar el orden de todas las preguntas
      const preguntasReordenadas = nuevasPreguntas.map((pregunta, i) => ({
        ...pregunta,
        orden: i + 1
      }));

      setPreguntas(preguntasReordenadas);
    }
  };

  // Manejar cambio manual de orden
  const handleCambioOrdenManual = (index: number, nuevoOrden: number) => {
    // Validar que el nuevo orden esté dentro del rango válido
    if (nuevoOrden < 1 || nuevoOrden > preguntas.length) {
      return;
    }

    const nuevasPreguntas = [...preguntas];
    const preguntaMovida = nuevasPreguntas[index];

    // Remover la pregunta de su posición actual
    nuevasPreguntas.splice(index, 1);

    // Insertar en la nueva posición (nuevoOrden - 1 porque el array es 0-indexed)
    nuevasPreguntas.splice(nuevoOrden - 1, 0, preguntaMovida);

    // Actualizar el orden de todas las preguntas
    const preguntasReordenadas = nuevasPreguntas.map((pregunta, i) => ({
      ...pregunta,
      orden: i + 1
    }));

    setPreguntas(preguntasReordenadas);
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

      {/* Layout de dos columnas con FLEXBOX */}
      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
        {/* COLUMNA IZQUIERDA: Panel lateral con opciones (30% fijo) */}
        <Box
          sx={{
            width: '30%',
            minWidth: '300px',
            flexShrink: 0,
            position: 'sticky',
            top: 16,
            maxHeight: 'calc(100vh - 32px)',
            overflowY: 'auto',
            overflowX: 'hidden',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f1f1',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#888',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: '#555',
            },
          }}
        >
            {/* Información básica */}
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

              <FormControl fullWidth sx={{ mb: 2 }}>
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

              <TextField
                fullWidth
                label="Fecha de inicio"
                type="datetime-local"
                value={fechaInicio ? fechaInicio.toISOString().slice(0, 16) : ''}
                onChange={(e) => setFechaInicio(e.target.value ? new Date(e.target.value) : null)}
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Fecha de fin"
                type="datetime-local"
                value={fechaFin ? fechaFin.toISOString().slice(0, 16) : ''}
                onChange={(e) => setFechaFin(e.target.value ? new Date(e.target.value) : null)}
                InputLabelProps={{ shrink: true }}
              />
            </CardContent>
          </Card>

          {/* Asignación de usuarios */}
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

          {/* Botón agregar pregunta */}
          <Button
            fullWidth
            startIcon={<AddIcon />}
            onClick={agregarPregunta}
            variant="contained"
            disabled={preguntas.length >= 50}
            sx={{ mb: 2 }}
          >
            Agregar Pregunta
          </Button>

          {/* Botones de acción */}
          <Card>
            <CardContent>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                Acciones
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Button
                  fullWidth
                  startIcon={<PreviewIcon />}
                  onClick={() => setShowPreview(true)}
                  variant="outlined"
                  disabled={preguntas.length === 0}
                >
                  Vista Previa
                </Button>

                <Button
                  fullWidth
                  onClick={guardarBorrador}
                  disabled={loading || guardandoBorrador}
                  variant="outlined"
                >
                  Guardar Borrador
                </Button>

                {/* Botones de activar/desactivar solo en modo edición */}
                {mode === 'edit' && onCambiarEstado && cuestionario && (
                  <>
                    <Divider sx={{ my: 1 }} />

                    {estado !== 'activo' ? (
                      <Button
                        fullWidth
                        startIcon={<ActivarIcon />}
                        onClick={() => onCambiarEstado('activo')}
                        variant="contained"
                        color="success"
                        disabled={loading || guardandoBorrador || preguntas.length === 0 || tiposUsuario.length === 0}
                      >
                        Activar Cuestionario
                      </Button>
                    ) : (
                      <Button
                        fullWidth
                        startIcon={<DesactivarIcon />}
                        onClick={() => onCambiarEstado('inactivo')}
                        variant="contained"
                        color="error"
                        disabled={loading || guardandoBorrador}
                      >
                        Desactivar Cuestionario
                      </Button>
                    )}
                  </>
                )}

                <Divider sx={{ my: 1 }} />

                <Button
                  fullWidth
                  startIcon={<SaveIcon />}
                  onClick={handleSubmit}
                  variant="contained"
                  disabled={loading || guardandoBorrador}
                  size="large"
                >
                  {mode === 'create' ? 'Crear Cuestionario' : 'Guardar Cambios'}
                </Button>

                <Button
                  fullWidth
                  onClick={onCancel}
                  disabled={loading || guardandoBorrador}
                  variant="text"
                >
                  Cancelar
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* COLUMNA DERECHA: Lista de preguntas (70% - crece para llenar el espacio) */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Preguntas ({preguntas.length})
                </Typography>
                <Chip
                  label={preguntas.length === 0 ? 'Sin preguntas' : `${preguntas.length} pregunta${preguntas.length !== 1 ? 's' : ''}`}
                  color={preguntas.length === 0 ? 'default' : 'primary'}
                  variant="outlined"
                />
              </Box>

              {preguntas.length === 0 && (
                <Alert severity="info">
                  Agregue al menos una pregunta para completar el cuestionario.
                  <br />
                  Use el botón "Agregar Pregunta" en el panel lateral.
                </Alert>
              )}

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={preguntas.map(p => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {preguntas.map((pregunta, index) => (
                    <PreguntaBuilder
                      key={pregunta.id}
                      pregunta={pregunta}
                      onChange={(preguntaActualizada) => actualizarPregunta(index, preguntaActualizada)}
                      onDelete={() => eliminarPregunta(index)}
                      onDuplicate={() => duplicarPregunta(index)}
                      onCambioOrden={(nuevoOrden) => handleCambioOrdenManual(index, nuevoOrden)}
                      index={index}
                      totalPreguntas={preguntas.length}
                      errors={validacion?.errores_preguntas[pregunta.id]}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </CardContent>
          </Card>
        </Box>
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
