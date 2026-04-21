import React, { useState, useEffect } from 'react';
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
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Paper,
  Grid
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { cuestionariosUsuarioApi } from '@/services/api';
import { useNotification } from '@/hooks/useNotification';
import VistaPreviaPregunta from '@/components/cuestionarios/VistaPreviaPregunta';
import type { RespuestaCuestionario, CuestionarioAdmin } from '@/types/cuestionarios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

/**
 * Página para visualizar las respuestas completadas de un cuestionario
 */
const VerRespuestasCuestionarioPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showNotification } = useNotification();

  // Estados
  const [loading, setLoading] = useState(true);
  const [respuesta, setRespuesta] = useState<RespuestaCuestionario | null>(null);
  const [cuestionario, setCuestionario] = useState<CuestionarioAdmin | null>(null);

  // Cargar respuesta del cuestionario
  useEffect(() => {
    if (!id) {
      showNotification('ID de cuestionario no válido', 'error');
      navigate('/usuario/cuestionarios');
      return;
    }

    loadRespuesta();
  }, [id]);

  const loadRespuesta = async () => {
    try {
      setLoading(true);
      const data = await cuestionariosUsuarioApi.getRespuestasGuardadas(id!);
      setRespuesta(data);
      setCuestionario(data.cuestionario);
    } catch (error: any) {
      console.error('Error al cargar respuesta:', error);
      showNotification(
        error.response?.data?.detail || 'Error al cargar las respuestas',
        'error'
      );
      navigate('/usuario/cuestionarios');
    } finally {
      setLoading(false);
    }
  };

  const handleVolver = () => {
    navigate('/usuario/cuestionarios');
  };

  const formatearFecha = (fecha: string | null) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calcularTiempoTranscurrido = () => {
    if (!respuesta?.fecha_inicio || !respuesta?.fecha_completado) return 'N/A';
    
    const inicio = new Date(respuesta.fecha_inicio);
    const fin = new Date(respuesta.fecha_completado);
    const diffMs = fin.getTime() - inicio.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} minutos`;
    } else {
      const horas = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${horas}h ${mins}m`;
    }
  };

  const obtenerRespuestaPregunta = (preguntaId: string) => {
    return respuesta?.respuestas_preguntas?.find(r => r.pregunta_id === preguntaId);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!respuesta || !cuestionario) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">No se encontraron las respuestas del cuestionario</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* AppBar */}
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar>
          <IconButton edge="start" onClick={handleVolver} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" noWrap>
              Respuestas del Cuestionario
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {cuestionario.titulo}
            </Typography>
          </Box>
          <Chip
            icon={<CheckCircleIcon />}
            label="Completado"
            color="success"
            size="small"
          />
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
        {/* Información del cuestionario */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              {cuestionario.titulo}
            </Typography>
            {cuestionario.descripcion && (
              <Typography variant="body2" color="text.secondary" paragraph>
                {cuestionario.descripcion}
              </Typography>
            )}
            
            <Divider sx={{ my: 2 }} />

            {/* Estadísticas de respuesta */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.50' }}>
                  <Typography variant="caption" color="text.secondary">
                    Fecha de Inicio
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {formatearFecha(respuesta.fecha_inicio)}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.50' }}>
                  <Typography variant="caption" color="text.secondary">
                    Fecha de Completado
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {formatearFecha(respuesta.fecha_completado)}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.50' }}>
                  <Typography variant="caption" color="text.secondary">
                    Tiempo Total
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {calcularTiempoTranscurrido()}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.50' }}>
                  <Typography variant="caption" color="text.secondary">
                    Preguntas Respondidas
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {respuesta.respuestas_preguntas?.length || 0} / {cuestionario.preguntas?.length || 0}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Preguntas y Respuestas */}
        <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
          Tus Respuestas
        </Typography>

        {/* Mostrar respuestas basadas en respuestas_preguntas */}
        {respuesta?.respuestas_preguntas?.map((respuestaPregunta, index) => {
          // Buscar la pregunta correspondiente en el cuestionario
          const pregunta = cuestionario.preguntas?.find(p => p.id === respuestaPregunta.pregunta_id);

          // Si la pregunta existe, mostrarla normalmente
          if (pregunta) {
            return (
              <Card key={respuestaPregunta.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <Chip
                      label={`${index + 1}`}
                      size="small"
                      color="primary"
                      sx={{ mr: 2, minWidth: 40 }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                        {pregunta.texto}
                      </Typography>
                      {pregunta.descripcion && (
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                          {pregunta.descripcion}
                        </Typography>
                      )}

                      <VistaPreviaPregunta
                        pregunta={pregunta}
                        respuesta={respuestaPregunta.valor}
                        textoOtro={respuestaPregunta.texto_otro}
                        readOnly={true}
                        hideTitle={true}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          }

          // Si la pregunta no existe (fue eliminada/modificada), usar pregunta_texto preservado
          // PROTECCIÓN: Mostrar pregunta_texto preservado si está disponible
          const preguntaTextoPreservado = respuestaPregunta.pregunta_texto;

          return (
            <Card key={respuestaPregunta.id} sx={{ mb: 2, bgcolor: 'grey.50', borderLeft: '4px solid', borderColor: 'grey.400' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <Chip
                    label={`${index + 1}`}
                    size="small"
                    color="default"
                    sx={{ mr: 2, minWidth: 40 }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                      {preguntaTextoPreservado || 'Pregunta no disponible'}
                    </Typography>
                    {preguntaTextoPreservado && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2, fontStyle: 'italic' }}>
                        ℹ️ Esta pregunta fue modificada o eliminada después de que respondiste
                      </Typography>
                    )}

                    <Box sx={{ pl: 2, borderLeft: '3px solid', borderColor: 'grey.400', mt: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Tu respuesta:
                      </Typography>
                      <Typography variant="body1">
                        {typeof respuestaPregunta.valor === 'object'
                          ? JSON.stringify(respuestaPregunta.valor)
                          : String(respuestaPregunta.valor)}
                      </Typography>
                      {respuestaPregunta.texto_otro && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                          Otro: {respuestaPregunta.texto_otro}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          );
        })}

        {/* Reportes IA (si existen) */}
        {respuesta.reportes_ia && respuesta.reportes_ia.length > 0 && (
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Reporte de IA
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {respuesta.reportes_ia
                .filter(r => r.es_actual)
                .map(reporte => (
                  <Box key={reporte.id}>
                    <Paper
                      sx={{
                        p: 3,
                        backgroundColor: '#f5f5f5',
                        '& h1': {
                          fontSize: '1.75rem',
                          fontWeight: 700,
                          mt: 3,
                          mb: 2,
                          color: 'primary.main',
                          borderBottom: '2px solid',
                          borderColor: 'primary.main',
                          pb: 1
                        },
                        '& h2': {
                          fontSize: '1.5rem',
                          fontWeight: 600,
                          mt: 3,
                          mb: 1.5,
                          color: 'text.primary'
                        },
                        '& h3': {
                          fontSize: '1.25rem',
                          fontWeight: 600,
                          mt: 2,
                          mb: 1,
                          color: 'text.primary'
                        },
                        '& h4': {
                          fontSize: '1.1rem',
                          fontWeight: 600,
                          mt: 1.5,
                          mb: 0.75,
                          color: 'text.primary'
                        },
                        '& p': {
                          mb: 1.5,
                          lineHeight: 1.7,
                          color: 'text.secondary'
                        },
                        '& ul, & ol': {
                          mb: 2,
                          pl: 3,
                          '& li': {
                            mb: 0.75,
                            lineHeight: 1.6
                          }
                        },
                        '& strong': {
                          fontWeight: 700,
                          color: 'text.primary'
                        },
                        '& em': {
                          fontStyle: 'italic'
                        },
                        '& blockquote': {
                          borderLeft: '4px solid',
                          borderColor: 'primary.main',
                          pl: 2,
                          ml: 0,
                          my: 2,
                          color: 'text.secondary',
                          fontStyle: 'italic'
                        },
                        '& code': {
                          backgroundColor: 'rgba(0, 0, 0, 0.05)',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          fontFamily: 'monospace',
                          fontSize: '0.9em'
                        },
                        '& pre': {
                          backgroundColor: 'rgba(0, 0, 0, 0.05)',
                          padding: 2,
                          borderRadius: 1,
                          overflowX: 'auto',
                          my: 2,
                          '& code': {
                            backgroundColor: 'transparent',
                            padding: 0
                          }
                        },
                        '& hr': {
                          my: 3,
                          borderColor: 'divider'
                        },
                        '& a': {
                          color: 'primary.main',
                          textDecoration: 'underline',
                          '&:hover': {
                            textDecoration: 'none'
                          }
                        },
                        '& table': {
                          width: '100%',
                          borderCollapse: 'collapse',
                          my: 2,
                          '& th, & td': {
                            border: '1px solid',
                            borderColor: 'divider',
                            padding: 1.5,
                            textAlign: 'left'
                          },
                          '& th': {
                            backgroundColor: 'rgba(0, 0, 0, 0.05)',
                            fontWeight: 600
                          }
                        }
                      }}
                    >
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                      >
                        {reporte.contenido}
                      </ReactMarkdown>
                    </Paper>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                      Generado el: {formatearFecha(reporte.fecha_generacion)}
                    </Typography>
                  </Box>
                ))}
            </CardContent>
          </Card>
        )}

        {/* Botón para volver */}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleVolver}
            size="large"
          >
            Volver a Mis Cuestionarios
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default VerRespuestasCuestionarioPage;

