import React, { useState, useEffect, useContext } from 'react';
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

  // Estados de navegación
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [modoVisualizacion, setModoVisualizacion] = useState<'paso_a_paso' | 'completo'>('paso_a_paso');

  // Estados de UI
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);

  // Cargar cuestionario y respuestas guardadas
  useEffect(() => {
    const cargarDatos = async () => {
      if (!id) return;

      try {
        setLoading(true);

        // Cargar cuestionario (ya incluye respuestas_previas)
        const cuestionarioData = await cuestionariosUsuarioApi.getCuestionarioParaResponder(id);
        setCuestionario(cuestionarioData);

        // Cargar respuestas previas si existen (vienen en el mismo endpoint)
        if (cuestionarioData.respuestas_previas) {
          setRespuestas(cuestionarioData.respuestas_previas);
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

  // Manejar cambio de respuesta
  const handleRespuestaChange = (preguntaId: string, valor: any) => {
    setRespuestas(prev => ({
      ...prev,
      [preguntaId]: valor
    }));
  };

  // Calcular progreso
  const calcularProgreso = () => {
    if (!cuestionario) return 0;
    const preguntasRespondidas = Object.keys(respuestas).filter(
      preguntaId => respuestas[preguntaId] !== undefined && respuestas[preguntaId] !== ''
    ).length;
    return Math.round((preguntasRespondidas / cuestionario.preguntas.length) * 100);
  };

  // Validar pregunta actual
  const validarPreguntaActual = () => {
    if (!cuestionario) return true;
    const pregunta = cuestionario.preguntas[preguntaActual];
    if (!pregunta.obligatoria) return true;
    
    const respuesta = respuestas[pregunta.id];
    return respuesta !== undefined && respuesta !== '' && respuesta !== null;
  };

  // Navegación entre preguntas
  const handleSiguientePregunta = () => {
    if (!cuestionario) return;
    
    if (!validarPreguntaActual()) {
      showNotification('Esta pregunta es obligatoria', 'warning');
      return;
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

      const respuestasArray: RespuestaPregunta[] = Object.entries(respuestas).map(([preguntaId, valor]) => ({
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
      return respuesta === undefined || respuesta === '' || respuesta === null;
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

      const respuestasArray: RespuestaPregunta[] = Object.entries(respuestas).map(([preguntaId, valor]) => ({
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
            <Typography variant="body2" color="text.secondary">
              Progreso: {progreso}% ({Object.keys(respuestas).length}/{cuestionario.preguntas.length})
            </Typography>
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
                  onChange={(valor) => handleRespuestaChange(preguntaActualData.id, valor)}
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
                  onClick={handleSiguientePregunta}
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
                    onChange={(valor) => handleRespuestaChange(pregunta.id, valor)}
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
            Progreso actual: {progreso}% ({Object.keys(respuestas).length}/{cuestionario.preguntas.length} preguntas respondidas)
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
