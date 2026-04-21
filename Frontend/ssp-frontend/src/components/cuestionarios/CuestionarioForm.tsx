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
import { catalogosApi } from '@/services/api';

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
  const [instruccionSistema, setInstruccionSistema] = useState(cuestionario?.instruccion_sistema || '');
  const [modeloIA, setModeloIA] = useState(cuestionario?.modelo_ia || 'openai/gpt-3.5-turbo');
  const [maxTokens, setMaxTokens] = useState<number>(cuestionario?.max_tokens || 4000);
  const [temperature, setTemperature] = useState<number>(cuestionario?.temperature || 0.7);
  const [preguntas, setPreguntas] = useState<Pregunta[]>(cuestionario?.preguntas || []);

  // Estado para modelos de IA del catálogo
  const [modelosIA, setModelosIA] = useState<any[]>([]);
  const [loadingModelos, setLoadingModelos] = useState(false);

  // Estado para rastrear si las preguntas fueron modificadas
  // Reason: En modo edición, solo enviar preguntas si realmente cambiaron
  // para evitar borrar respuestas de usuarios innecesariamente
  const [preguntasModificadas, setPreguntasModificadas] = useState(false);
  const [tiposUsuario, setTiposUsuario] = useState<TipoUsuario[]>(
    cuestionario?.tipos_usuario_asignados || []
  );
  const [fechaInicio, setFechaInicio] = useState<Date | null>(
    cuestionario?.fecha_inicio ? new Date(cuestionario.fecha_inicio) : null
  );
  const [fechaFin, setFechaFin] = useState<Date | null>(
    cuestionario?.fecha_fin ? new Date(cuestionario.fecha_fin) : null
  );

  /**
   * Convierte una fecha a formato datetime-local (YYYY-MM-DDTHH:mm) en zona horaria local
   * Reason: Evitar problemas de desfase de zona horaria al usar toISOString() que convierte a UTC
   */
  const formatearFechaParaInput = (fecha: Date | null): string => {
    if (!fecha) return '';

    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  /**
   * Extrae la hora en formato 12 horas de una fecha
   */
  const getHora12 = (fecha: Date | null): number => {
    if (!fecha) return 12;
    const hours = fecha.getHours();
    return hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  };

  /**
   * Extrae el periodo AM/PM de una fecha
   */
  const getPeriodo = (fecha: Date | null): 'AM' | 'PM' => {
    if (!fecha) return 'AM';
    return fecha.getHours() >= 12 ? 'PM' : 'AM';
  };

  /**
   * Extrae los minutos redondeados a múltiplos de 10
   */
  const getMinutos = (fecha: Date | null): number => {
    if (!fecha) return 0;
    const minutos = fecha.getMinutes();
    return Math.round(minutos / 10) * 10;
  };

  /**
   * Actualiza la fecha de inicio con nuevos valores
   */
  const actualizarFechaInicio = (
    fecha?: string,
    hora?: number,
    minutos?: number,
    periodo?: 'AM' | 'PM'
  ) => {
    const fechaActual = fechaInicio || new Date();
    const nuevaFecha = new Date(fechaActual);

    if (fecha) {
      const [year, month, day] = fecha.split('-').map(Number);
      nuevaFecha.setFullYear(year);
      nuevaFecha.setMonth(month - 1);
      nuevaFecha.setDate(day);
    }

    if (hora !== undefined && periodo !== undefined) {
      let hours24 = hora;
      if (periodo === 'PM' && hora !== 12) hours24 = hora + 12;
      if (periodo === 'AM' && hora === 12) hours24 = 0;
      nuevaFecha.setHours(hours24);
    }

    if (minutos !== undefined) {
      nuevaFecha.setMinutes(minutos);
    }

    setFechaInicio(nuevaFecha);
  };

  /**
   * Actualiza la fecha de fin con nuevos valores
   */
  const actualizarFechaFin = (
    fecha?: string,
    hora?: number,
    minutos?: number,
    periodo?: 'AM' | 'PM'
  ) => {
    const fechaActual = fechaFin || new Date();
    const nuevaFecha = new Date(fechaActual);

    if (fecha) {
      const [year, month, day] = fecha.split('-').map(Number);
      nuevaFecha.setFullYear(year);
      nuevaFecha.setMonth(month - 1);
      nuevaFecha.setDate(day);
    }

    if (hora !== undefined && periodo !== undefined) {
      let hours24 = hora;
      if (periodo === 'PM' && hora !== 12) hours24 = hora + 12;
      if (periodo === 'AM' && hora === 12) hours24 = 0;
      nuevaFecha.setHours(hours24);
    }

    if (minutos !== undefined) {
      nuevaFecha.setMinutes(minutos);
    }

    setFechaFin(nuevaFecha);
  };
  const [estado, setEstado] = useState<EstadoCuestionario>(
    cuestionario?.estado || 'borrador'
  );

  // Estados de UI
  const [showPreview, setShowPreview] = useState(false);
  const [validacion, setValidacion] = useState<ValidacionCuestionario | null>(null);
  const [guardandoBorrador, setGuardandoBorrador] = useState(false);

  // Cargar modelos de IA del catálogo
  useEffect(() => {
    const cargarModelos = async () => {
      setLoadingModelos(true);
      try {
        const modelos = await catalogosApi.modelosIA.getActivos();
        setModelosIA(modelos);
      } catch (error) {
        logError(error, 'CuestionarioForm.cargarModelos');
        // Si falla, usar lista vacía (el select mostrará el valor actual aunque no esté en la lista)
        setModelosIA([]);
      } finally {
        setLoadingModelos(false);
      }
    };

    cargarModelos();
  }, []);

  // Actualizar estados cuando cambia el cuestionario (modo edición)
  // Reason: En modo edición, el cuestionario se carga async, por lo que los estados
  // inicializados con useState no tienen los valores correctos al montar el componente
  useEffect(() => {
    if (cuestionario) {
      setTitulo(cuestionario.titulo || '');
      setDescripcion(cuestionario.descripcion || '');
      setInstruccionSistema(cuestionario.instruccion_sistema || '');
      setModeloIA(cuestionario.modelo_ia || 'openai/gpt-3.5-turbo');
      setMaxTokens(cuestionario.max_tokens || 4000);
      setTemperature(cuestionario.temperature || 0.7);
      setPreguntas(cuestionario.preguntas || []);
      setTiposUsuario(cuestionario.tipos_usuario_asignados || []);
      setFechaInicio(cuestionario.fecha_inicio ? new Date(cuestionario.fecha_inicio) : null);
      setFechaFin(cuestionario.fecha_fin ? new Date(cuestionario.fecha_fin) : null);
      setEstado(cuestionario.estado || 'borrador');
      // Resetear flag de modificación al cargar el cuestionario
      setPreguntasModificadas(false);
    }
  }, [cuestionario]);

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
    setPreguntasModificadas(true); // Marcar que se modificaron las preguntas
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
    setPreguntasModificadas(true); // Marcar que se modificaron las preguntas
  };

  // Actualizar pregunta
  const actualizarPregunta = (index: number, preguntaActualizada: Pregunta) => {
    const nuevasPreguntas = [...preguntas];
    nuevasPreguntas[index] = preguntaActualizada;
    setPreguntas(nuevasPreguntas);
    setPreguntasModificadas(true); // Marcar que se modificaron las preguntas
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
    setPreguntasModificadas(true); // Marcar que se modificaron las preguntas
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
      setPreguntasModificadas(true); // Marcar que se modificaron las preguntas
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
    setPreguntasModificadas(true); // Marcar que se modificaron las preguntas
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

    const datosFormulario: any = {
      titulo,
      descripcion,
      instruccion_sistema: instruccionSistema || undefined,
      modelo_ia: modeloIA || 'openai/gpt-3.5-turbo',
      max_tokens: maxTokens,
      temperature: temperature,
      fecha_inicio: fechaInicio?.toISOString(),
      fecha_fin: fechaFin?.toISOString(),
      estado
    };

    // PROTECCIÓN: Solo incluir preguntas si:
    // 1. Estamos en modo creación (siempre se necesitan), O
    // 2. Estamos en modo edición Y las preguntas fueron modificadas
    // Reason: Evitar enviar preguntas innecesariamente en edición, lo que podría
    // causar que el backend las procese y afecte respuestas de usuarios
    if (mode === 'create') {
      // Modo creación: siempre enviar preguntas
      if (preguntas.length > 0) {
        datosFormulario.preguntas = preguntas;
      }
    } else if (mode === 'edit' && preguntasModificadas) {
      // Modo edición: solo enviar si fueron modificadas
      datosFormulario.preguntas = preguntas;
    }
    // Si mode === 'edit' y NO se modificaron preguntas, NO se envía el campo

    // Solo incluir tipos de usuario si hay al menos uno
    if (tiposUsuario.length > 0) {
      datosFormulario.tipos_usuario_asignados = tiposUsuario;
    }

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
            </CardContent>
          </Card>

          {/* Configuración de IA para Reportes */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Configuración de IA para Reportes
              </Typography>

              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Personaliza cómo la IA generará los reportes psicopedagógicos para este cuestionario.
                </Typography>
              </Alert>

              <FormControl fullWidth sx={{ mb: 2 }} disabled={loadingModelos}>
                <InputLabel>Modelo de IA</InputLabel>
                <Select
                  value={modeloIA}
                  label="Modelo de IA"
                  onChange={(e) => setModeloIA(e.target.value)}
                >
                  {loadingModelos ? (
                    <MenuItem value={modeloIA}>{modeloIA} (Cargando...)</MenuItem>
                  ) : modelosIA.length === 0 ? (
                    <MenuItem value={modeloIA}>{modeloIA} (Sin modelos disponibles)</MenuItem>
                  ) : (
                    modelosIA.map((modelo) => (
                      <MenuItem key={modelo.id} value={modelo.model_id}>
                        {modelo.titulo}
                        {modelo.recomendado && ' ⭐'}
                        {' - '}
                        {modelo.proveedor}
                        {modelo.categoria === 'premium' && ' (Premium)'}
                        {modelo.categoria === 'budget' && ' (Económico)'}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Instrucción personalizada para la IA (opcional)"
                value={instruccionSistema}
                onChange={(e) => setInstruccionSistema(e.target.value)}
                helperText="Define cómo quieres que la IA analice las respuestas y genere el reporte. Si se deja vacío, se usará la instrucción por defecto."
                multiline
                rows={6}
                placeholder="Ejemplo: Eres un psicólogo educativo especializado en estudiantes universitarios. Analiza las respuestas enfocándote en factores de riesgo académico y emocional..."
                sx={{ mb: 3 }}
              />

              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                Parámetros de Generación
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  type="number"
                  label="Tokens Máximos"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value) || 1000)}
                  inputProps={{ min: 100, max: 10000, step: 100 }}
                  helperText="Máximo de tokens en la respuesta"
                />

                <TextField
                  type="number"
                  label="Temperatura (0.0-1.0)"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value) || 0.0)}
                  inputProps={{ min: 0.0, max: 1.0, step: 0.1 }}
                  helperText="Creatividad de la IA (0.0=preciso, 1.0=creativo)"
                />
              </Box>

              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Max Tokens:</strong> Controla la longitud máxima de la respuesta. 1 token ≈ 0.75 palabras.<br />
                  <strong>Temperatura:</strong> Valores bajos (0.0-0.3) = respuestas más precisas y consistentes. Valores altos (0.7-1.0) = respuestas más creativas y variadas.
                </Typography>
              </Alert>
            </CardContent>
          </Card>

          {/* Fechas de disponibilidad */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Fechas de Disponibilidad
              </Typography>

              {/* Fecha de inicio */}
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                Fecha de inicio
              </Typography>
              <TextField
                fullWidth
                type="date"
                value={formatearFechaParaInput(fechaInicio)}
                onChange={(e) => actualizarFechaInicio(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 1 }}
              />
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <FormControl sx={{ flex: 1 }}>
                  <InputLabel>Hora</InputLabel>
                  <Select
                    value={getHora12(fechaInicio)}
                    label="Hora"
                    onChange={(e) => actualizarFechaInicio(
                      undefined,
                      Number(e.target.value),
                      undefined,
                      getPeriodo(fechaInicio)
                    )}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(h => (
                      <MenuItem key={h} value={h}>{h}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl sx={{ flex: 1 }}>
                  <InputLabel>Min</InputLabel>
                  <Select
                    value={getMinutos(fechaInicio)}
                    label="Min"
                    onChange={(e) => actualizarFechaInicio(
                      undefined,
                      undefined,
                      Number(e.target.value),
                      undefined
                    )}
                  >
                    {[0, 10, 20, 30, 40, 50].map(m => (
                      <MenuItem key={m} value={m}>{String(m).padStart(2, '0')}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl sx={{ flex: 1 }}>
                  <InputLabel>AM/PM</InputLabel>
                  <Select
                    value={getPeriodo(fechaInicio)}
                    label="AM/PM"
                    onChange={(e) => actualizarFechaInicio(
                      undefined,
                      getHora12(fechaInicio),
                      undefined,
                      e.target.value as 'AM' | 'PM'
                    )}
                  >
                    <MenuItem value="AM">AM</MenuItem>
                    <MenuItem value="PM">PM</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Fecha de fin */}
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                Fecha de fin
              </Typography>
              <TextField
                fullWidth
                type="date"
                value={formatearFechaParaInput(fechaFin)}
                onChange={(e) => actualizarFechaFin(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 1 }}
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <FormControl sx={{ flex: 1 }}>
                  <InputLabel>Hora</InputLabel>
                  <Select
                    value={getHora12(fechaFin)}
                    label="Hora"
                    onChange={(e) => actualizarFechaFin(
                      undefined,
                      Number(e.target.value),
                      undefined,
                      getPeriodo(fechaFin)
                    )}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(h => (
                      <MenuItem key={h} value={h}>{h}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl sx={{ flex: 1 }}>
                  <InputLabel>Min</InputLabel>
                  <Select
                    value={getMinutos(fechaFin)}
                    label="Min"
                    onChange={(e) => actualizarFechaFin(
                      undefined,
                      undefined,
                      Number(e.target.value),
                      undefined
                    )}
                  >
                    {[0, 10, 20, 30, 40, 50].map(m => (
                      <MenuItem key={m} value={m}>{String(m).padStart(2, '0')}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl sx={{ flex: 1 }}>
                  <InputLabel>AM/PM</InputLabel>
                  <Select
                    value={getPeriodo(fechaFin)}
                    label="AM/PM"
                    onChange={(e) => actualizarFechaFin(
                      undefined,
                      getHora12(fechaFin),
                      undefined,
                      e.target.value as 'AM' | 'PM'
                    )}
                  >
                    <MenuItem value="AM">AM</MenuItem>
                    <MenuItem value="PM">PM</MenuItem>
                  </Select>
                </FormControl>
              </Box>
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
