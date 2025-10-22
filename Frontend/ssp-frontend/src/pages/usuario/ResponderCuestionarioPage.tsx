import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  LinearProgress,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Breadcrumbs,
  Link,
  Chip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Send as SendIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  Home as HomeIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { AuthContext } from '@/contexts/AuthContext';
import { cuestionariosUsuarioApi } from '@/services/api';
import { useNotification } from '@/hooks/useNotification';
import VistaPreviaPregunta from '@/components/cuestionarios/VistaPreviaPregunta';
import type { CuestionarioAdmin, RespuestaPregunta, RespuestaCuestionario } from '@/types/cuestionarios';

/**
 * Página para responder un cuestionario asignado
 */
const ResponderCuestionarioPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useContext(AuthContext);
  const { showNotification } = useNotification();

  // Estados principales
  const [cuestionario, setCuestionario] = useState<CuestionarioAdmin | null>(null);
  const [respuestas, setRespuestas] = useState<{ [preguntaId: string]: any }>({});
  const [respuestasGuardadas, setRespuestasGuardadas] = useState<RespuestaCuestionario | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);

  // Estados de navegación
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [modoVisualizacion, setModoVisualizacion] = useState<'paso_a_paso' | 'completo'>('paso_a_paso');

  // Estados de UI
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);

  // Refs para debounce del auto-guardado
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRespuestasRef = useRef<string>('');

  // Cargar cuestionario y respuestas guardadas
  useEffect(() => {
    const cargarDatos = async () => {
      if (!id) return;

      try {
        setLoading(true);

        // Cargar cuestionario (ya incluye respuestas_previas)
        const cuestionarioData = await cuestionariosUsuarioApi.getCuestionarioParaResponder(id);
        console.log('📋 Cuestionario cargado:', {
          titulo: cuestionarioData.titulo,
          totalPreguntas: cuestionarioData.preguntas?.length,
          respuestasPrevias: cuestionarioData.respuestas_previas
        });
        setCuestionario(cuestionarioData);

        // Cargar respuestas previas si existen (vienen en el mismo endpoint)
        // El formato del backend es: {pregunta_id: {valor, texto_otro}}
        // Necesitamos convertirlo a: {pregunta_id: valor}
        if (cuestionarioData.respuestas_previas) {
          // Crear un Set con los IDs de preguntas válidas
          const preguntasValidasIds = new Set(cuestionarioData.preguntas.map((p: any) => p.id));
          console.log('✅ IDs de preguntas válidas:', Array.from(preguntasValidasIds));

          const respuestasFormateadas: { [preguntaId: string]: any } = {};
          Object.entries(cuestionarioData.respuestas_previas).forEach(([preguntaId, data]: [string, any]) => {
            // Solo incluir respuestas que corresponden a preguntas válidas del cuestionario
            if (preguntasValidasIds.has(preguntaId)) {
              const valor = data.valor;

              // Solo incluir respuestas que tienen un valor válido (no vacío)
              // Permitir false, 0, arrays vacíos, pero NO strings vacíos, null o undefined
              const esValorValido = valor !== undefined &&
                                    valor !== null &&
                                    !(typeof valor === 'string' && valor.trim() === '');

              if (esValorValido) {
                respuestasFormateadas[preguntaId] = valor;
                console.log(`✓ Respuesta válida cargada: ${preguntaId} = ${valor}`);
              } else {
                console.log(`⏭️ Respuesta vacía ignorada: ${preguntaId} = "${valor}"`);
              }
            } else {
              console.warn(`⚠️ Respuesta ignorada (pregunta no existe): ${preguntaId}`);
            }
          });
          console.log('📝 Respuestas formateadas:', respuestasFormateadas);
          setRespuestas(respuestasFormateadas);

          // Actualizar la referencia de última respuesta guardada para evitar guardado innecesario
          lastSavedRespuestasRef.current = JSON.stringify(respuestasFormateadas);
        }

        // Si hay un respuesta_id, crear el objeto de respuesta guardada
        if (cuestionarioData.respuesta_id) {
          setRespuestasGuardadas({
            id: cuestionarioData.respuesta_id,
            estado: cuestionarioData.estado_respuesta,
            progreso: cuestionarioData.progreso,
            respuestas: Object.entries(cuestionarioData.respuestas_previas || {}).map(([pregunta_id, data]: [string, any]) => ({
              pregunta_id,
              valor: data.valor,
              texto_otro: data.texto_otro
            }))
          } as any);
        }

      } catch (error: any) {
        console.error('Error al cargar cuestionario:', error);
        showNotification('Error al cargar el cuestionario', 'error');
        navigate('/usuario/cuestionarios');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Auto-guardado con debounce
  const autoGuardarRespuestas = useCallback(async (respuestasActuales: { [preguntaId: string]: any }) => {
    if (!cuestionario || !id) return;

    // Verificar si las respuestas han cambiado
    const respuestasString = JSON.stringify(respuestasActuales);
    if (respuestasString === lastSavedRespuestasRef.current) {
      console.log('⏭️ Auto-guardado omitido: sin cambios');
      return; // No hay cambios, no guardar
    }

    try {
      setAutoSaving(true);

      // Filtrar solo respuestas con valores válidos (no vacíos)
      const respuestasArray: RespuestaPregunta[] = Object.entries(respuestasActuales)
        .filter(([preguntaId, valor]) => {
          // Excluir valores vacíos, null, undefined, y strings vacíos
          if (valor === undefined || valor === null) return false;
          if (typeof valor === 'string' && valor.trim() === '') return false;
          // Incluir todo lo demás (false, 0, arrays vacíos, etc.)
          return true;
        })
        .map(([preguntaId, valor]) => ({
          pregunta_id: preguntaId,
          valor
        }));

      const progreso = calcularProgresoFromRespuestas(respuestasActuales);
      console.log('💾 Auto-guardando respuestas:', {
        totalRespuestas: respuestasArray.length,
        progreso: progreso,
        respuestas: respuestasArray
      });

      await cuestionariosUsuarioApi.guardarRespuestas(id, respuestasArray, 'en_progreso', progreso);
      console.log('✅ Auto-guardado exitoso');

      // Actualizar la referencia de última respuesta guardada
      lastSavedRespuestasRef.current = respuestasString;
    } catch (error) {
      console.error('❌ Error en auto-guardado:', error);
      // No mostrar notificación para no interrumpir al usuario
    } finally {
      setAutoSaving(false);
    }
  }, [cuestionario, id]);

  // Contar respuestas válidas (no vacías)
  const contarRespuestasValidas = (respuestasObj: { [preguntaId: string]: any }) => {
    if (!cuestionario) return 0;

    // Crear un Set con los IDs de preguntas válidas del cuestionario
    const preguntasValidasIds = new Set(cuestionario.preguntas.map(p => p.id));

    // Contar solo respuestas que corresponden a preguntas válidas y no están vacías
    return Object.keys(respuestasObj).filter(
      preguntaId => {
        // Verificar que la pregunta existe en el cuestionario
        if (!preguntasValidasIds.has(preguntaId)) return false;

        // Verificar que la respuesta no esté vacía
        const valor = respuestasObj[preguntaId];
        if (valor === undefined || valor === null) return false;
        if (typeof valor === 'string' && valor.trim() === '') return false;
        return true;
      }
    ).length;
  };

  // Calcular progreso desde un objeto de respuestas
  const calcularProgresoFromRespuestas = (respuestasObj: { [preguntaId: string]: any }) => {
    if (!cuestionario) return 0;
    const preguntasRespondidas = contarRespuestasValidas(respuestasObj);
    return Math.round((preguntasRespondidas / cuestionario.preguntas.length) * 100);
  };

  // Manejar cambio de respuesta con auto-guardado
  const handleRespuestaChange = (preguntaId: string, valor: any, autoAvanzar: boolean = false) => {
    console.log('📝 handleRespuestaChange llamado:', {
      preguntaId,
      valor,
      tipoValor: typeof valor,
      autoAvanzar,
      respuestasActuales: respuestas
    });

    const nuevasRespuestas = {
      ...respuestas,
      [preguntaId]: valor
    };

    console.log('📦 Nuevas respuestas creadas:', nuevasRespuestas);

    setRespuestas(nuevasRespuestas);

    // Cancelar timeout anterior si existe
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Si va a auto-avanzar, guardar inmediatamente
    if (autoAvanzar && modoVisualizacion === 'paso_a_paso') {
      console.log('⏩ Auto-avanzar activado, guardando inmediatamente...');
      // Guardar inmediatamente antes de avanzar
      autoGuardarRespuestas(nuevasRespuestas);

      // Esperar un momento para que el usuario vea su selección
      setTimeout(() => {
        console.log('🚀 Intentando avanzar a siguiente pregunta...');
        // Pasar las nuevas respuestas para validación correcta
        handleSiguientePregunta(nuevasRespuestas);
      }, 500);
    } else {
      // Programar auto-guardado con debounce de 2 segundos para otros casos
      autoSaveTimeoutRef.current = setTimeout(() => {
        autoGuardarRespuestas(nuevasRespuestas);
      }, 2000);
    }
  };

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Calcular progreso (usa la función auxiliar)
  const calcularProgreso = () => {
    return calcularProgresoFromRespuestas(respuestas);
  };

  // Validar pregunta actual (puede recibir respuestas personalizadas para validación)
  const validarPreguntaActual = (respuestasParaValidar?: { [preguntaId: string]: any }) => {
    if (!cuestionario) return true;
    const pregunta = cuestionario.preguntas[preguntaActual];
    if (!pregunta.obligatoria) return true;

    const respuestasAUsar = respuestasParaValidar || respuestas;
    const respuesta = respuestasAUsar[pregunta.id];

    console.log('🔍 Validando pregunta:', {
      preguntaActualIndex: preguntaActual,
      preguntaId: pregunta.id,
      preguntaTexto: pregunta.texto,
      tipo: pregunta.tipo,
      respuesta: respuesta,
      tipoRespuesta: typeof respuesta,
      esArray: Array.isArray(respuesta),
      todasLasRespuestas: respuestasAUsar
    });

    // Validación según el tipo de respuesta
    if (respuesta === undefined || respuesta === null) {
      console.log('❌ Validación falló: respuesta undefined o null');
      return false;
    }

    // Para strings, verificar que no esté vacío
    if (typeof respuesta === 'string' && respuesta.trim() === '') {
      console.log('❌ Validación falló: string vacío');
      return false;
    }

    // Para arrays (checkboxes), verificar que tenga al menos un elemento
    if (Array.isArray(respuesta) && respuesta.length === 0) {
      console.log('❌ Validación falló: array vacío');
      return false;
    }

    console.log('✅ Validación exitosa');
    return true;
  };

  // Navegación entre preguntas (puede recibir respuestas personalizadas para validación)
  const handleSiguientePregunta = (respuestasParaValidar?: { [preguntaId: string]: any }) => {
    if (!cuestionario) return;

    console.log('🚀 handleSiguientePregunta llamado:', {
      tieneRespuestasParaValidar: !!respuestasParaValidar,
      respuestasParaValidar: respuestasParaValidar
    });

    // Solo validar si se proporcionaron respuestas para validar (auto-avance)
    // Si no se proporcionaron, es navegación manual y no validamos
    if (respuestasParaValidar) {
      console.log('⚠️ Validando porque se proporcionaron respuestas...');
      if (!validarPreguntaActual(respuestasParaValidar)) {
        showNotification('Esta pregunta es obligatoria', 'warning');
        return;
      }
    } else {
      console.log('✅ Navegación manual - sin validación');
    }

    if (preguntaActual < cuestionario.preguntas.length - 1) {
      setPreguntaActual(preguntaActual + 1);
    }
  };

  const handlePreguntaAnterior = () => {
    if (preguntaActual > 0) {
      setPreguntaActual(preguntaActual - 1);
    }
  };

  // Guardar progreso
  const guardarProgreso = async () => {
    if (!cuestionario || !id) return;

    try {
      setSaving(true);

      // Filtrar solo respuestas con valores válidos (no vacíos)
      const respuestasArray: RespuestaPregunta[] = Object.entries(respuestas)
        .filter(([preguntaId, valor]) => {
          // Excluir valores vacíos, null, undefined, y strings vacíos
          if (valor === undefined || valor === null) return false;
          if (typeof valor === 'string' && valor.trim() === '') return false;
          return true;
        })
        .map(([preguntaId, valor]) => ({
          pregunta_id: preguntaId,
          valor
        }));

      const progreso = calcularProgreso();
      await cuestionariosUsuarioApi.guardarRespuestas(id, respuestasArray, 'en_progreso', progreso);
      showNotification('Progreso guardado exitosamente', 'success');
    } catch (error) {
      console.error('Error al guardar progreso:', error);
      showNotification('Error al guardar el progreso', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Completar cuestionario
  const completarCuestionario = async () => {
    if (!cuestionario || !id) return;

    // Validar preguntas obligatorias
    const preguntasObligatorias = cuestionario.preguntas.filter(p => p.obligatoria);
    const preguntasSinResponder = preguntasObligatorias.filter(p => {
      const respuesta = respuestas[p.id];
      // Validar que la respuesta no esté vacía
      if (respuesta === undefined || respuesta === null) return true;
      if (typeof respuesta === 'string' && respuesta.trim() === '') return true;
      return false;
    });

    if (preguntasSinResponder.length > 0) {
      showNotification(
        `Faltan ${preguntasSinResponder.length} preguntas obligatorias por responder`,
        'warning'
      );
      return;
    }

    try {
      setSubmitting(true);

      // Filtrar solo respuestas con valores válidos (no vacíos)
      const respuestasArray: RespuestaPregunta[] = Object.entries(respuestas)
        .filter(([preguntaId, valor]) => {
          if (valor === undefined || valor === null) return false;
          if (typeof valor === 'string' && valor.trim() === '') return false;
          return true;
        })
        .map(([preguntaId, valor]) => ({
          pregunta_id: preguntaId,
          valor
        }));

      await cuestionariosUsuarioApi.completarCuestionario(id, respuestasArray, 100);
      showNotification('Cuestionario completado exitosamente', 'success');
      navigate('/usuario/cuestionarios');
    } catch (error) {
      console.error('Error al completar cuestionario:', error);
      showNotification('Error al completar el cuestionario', 'error');
    } finally {
      setSubmitting(false);
      setShowConfirmDialog(false);
    }
  };

  // Manejar salida
  const handleSalir = () => {
    if (Object.keys(respuestas).length > 0) {
      setShowExitDialog(true);
    } else {
      navigate('/usuario/cuestionarios');
    }
  };

  const handleSalirSinGuardar = () => {
    navigate('/usuario/cuestionarios');
  };

  const handleSalirGuardando = async () => {
    await guardarProgreso();
    navigate('/usuario/cuestionarios');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!cuestionario) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Cuestionario no encontrado o no tienes permisos para acceder a él.
        </Alert>
      </Box>
    );
  }

  const progreso = calcularProgreso();
  const preguntaActualData = cuestionario.preguntas[preguntaActual];

  return (
    <Box>
      {/* Header */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton edge="start" onClick={handleSalir} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <AssignmentIcon sx={{ mr: 2 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="div">
              {cuestionario.titulo}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Progreso: {progreso}% ({contarRespuestasValidas(respuestas)}/{cuestionario.preguntas.length})
              </Typography>
              {autoSaving && (
                <Chip
                  label="Guardando..."
                  size="small"
                  color="info"
                  sx={{ height: 20 }}
                />
              )}
            </Box>
          </Box>
          <Chip
            label={modoVisualizacion === 'paso_a_paso' ? 'Paso a paso' : 'Vista completa'}
            onClick={() => setModoVisualizacion(
              modoVisualizacion === 'paso_a_paso' ? 'completo' : 'paso_a_paso'
            )}
            clickable
          />
        </Toolbar>
      </AppBar>

      {/* Barra de progreso */}
      <LinearProgress variant="determinate" value={progreso} />

      <Box sx={{ p: 3 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link
            underline="hover"
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            color="inherit"
            onClick={() => navigate('/usuario/cuestionarios')}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Mis Cuestionarios
          </Link>
          <Typography color="text.primary">
            Responder: {cuestionario.titulo}
          </Typography>
        </Breadcrumbs>

        {/* Información del cuestionario */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            {cuestionario.descripcion}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            <strong>💾 Auto-guardado:</strong> Tus respuestas se guardan automáticamente mientras contestas.
          </Typography>
          {respuestasGuardadas && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>Nota:</strong> Tienes respuestas guardadas previamente. Puedes continuar desde donde lo dejaste.
            </Typography>
          )}
        </Alert>

        {modoVisualizacion === 'paso_a_paso' ? (
          // Vista paso a paso
          <Box>
            {/* Indicador de pregunta */}
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <Typography variant="h6" color="primary">
                Pregunta {preguntaActual + 1} de {cuestionario.preguntas.length}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, mt: 1 }}>
                {cuestionario.preguntas.map((_, index) => (
                  <Box
                    key={index}
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: index === preguntaActual 
                        ? 'primary.main' 
                        : respuestas[cuestionario.preguntas[index].id] !== undefined
                        ? 'success.main'
                        : 'grey.300',
                      cursor: 'pointer'
                    }}
                    onClick={() => setPreguntaActual(index)}
                  />
                ))}
              </Box>
            </Box>

            {/* Pregunta actual */}
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ p: 4 }}>
                <VistaPreviaPregunta
                  pregunta={preguntaActualData}
                  value={respuestas[preguntaActualData.id]}
                  onChange={(valor, autoAvanzar) => handleRespuestaChange(preguntaActualData.id, valor, autoAvanzar)}
                  onSubmit={() => handleSiguientePregunta()}
                  showValidation={preguntaActualData.obligatoria}
                />
              </CardContent>
            </Card>

            {/* Controles de navegación */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Button
                startIcon={<PrevIcon />}
                onClick={handlePreguntaAnterior}
                disabled={preguntaActual === 0}
                variant="outlined"
              >
                Anterior
              </Button>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  startIcon={<SaveIcon />}
                  onClick={guardarProgreso}
                  disabled={saving}
                  variant="outlined"
                >
                  {saving ? 'Guardando...' : 'Guardar Progreso'}
                </Button>
              </Box>

              {preguntaActual === cuestionario.preguntas.length - 1 ? (
                <Button
                  startIcon={<SendIcon />}
                  onClick={() => setShowConfirmDialog(true)}
                  variant="contained"
                  color="success"
                >
                  Completar Cuestionario
                </Button>
              ) : (
                <Button
                  endIcon={<NextIcon />}
                  onClick={() => handleSiguientePregunta()}
                  variant="contained"
                >
                  Siguiente
                </Button>
              )}
            </Box>
          </Box>
        ) : (
          // Vista completa
          <Box>
            {cuestionario.preguntas.map((pregunta, index) => (
              <Card key={pregunta.id} sx={{ mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                    Pregunta {index + 1}
                  </Typography>
                  <VistaPreviaPregunta
                    pregunta={pregunta}
                    value={respuestas[pregunta.id]}
                    onChange={(valor, autoAvanzar) => handleRespuestaChange(pregunta.id, valor, false)} // No auto-avanzar en vista completa
                    showValidation={pregunta.obligatoria}
                  />
                </CardContent>
              </Card>
            ))}

            {/* Botones finales */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
              <Button
                startIcon={<SaveIcon />}
                onClick={guardarProgreso}
                disabled={saving}
                variant="outlined"
                size="large"
              >
                {saving ? 'Guardando...' : 'Guardar Progreso'}
              </Button>
              
              <Button
                startIcon={<SendIcon />}
                onClick={() => setShowConfirmDialog(true)}
                variant="contained"
                color="success"
                size="large"
              >
                Completar Cuestionario
              </Button>
            </Box>
          </Box>
        )}
      </Box>

      {/* Diálogo de confirmación para completar */}
      <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)}>
        <DialogTitle>Completar Cuestionario</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro de que desea completar el cuestionario? 
            Una vez completado, no podrá modificar sus respuestas.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Progreso actual: {progreso}% ({contarRespuestasValidas(respuestas)}/{cuestionario.preguntas.length} preguntas respondidas)
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={completarCuestionario} 
            variant="contained" 
            color="success"
            disabled={submitting}
          >
            {submitting ? 'Completando...' : 'Completar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación para salir */}
      <Dialog open={showExitDialog} onClose={() => setShowExitDialog(false)}>
        <DialogTitle>Salir del Cuestionario</DialogTitle>
        <DialogContent>
          <Typography>
            Tienes respuestas sin guardar. ¿Qué deseas hacer?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExitDialog(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSalirSinGuardar} color="error">
            Salir sin Guardar
          </Button>
          <Button onClick={handleSalirGuardando} variant="contained">
            Guardar y Salir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ResponderCuestionarioPage;
