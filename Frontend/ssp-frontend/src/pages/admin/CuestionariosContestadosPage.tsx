import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Tooltip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  CheckCircle as CheckCircleIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Visibility as VisibilityIcon,
  HourglassEmpty as HourglassEmptyIcon,
  PlayArrow as PlayArrowIcon,
  FileDownload as FileDownloadIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { AuthContext } from '@/contexts/AuthContext';
import { cuestionariosAdminApi } from '@/services/api';
import { useNotification } from '@/hooks/useNotification';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import GenerarReporteButton from '@/components/GenerarReporteButton';
import ReporteIAViewer from '@/components/ReporteIAViewer';
import GenericTableWithBulkDelete from '@/components/GenericTableWithBulkDelete';
import type { Reporte } from '@/types/reporte';
import type { PersonaInfoReportePayload, PreguntaRespuestaReportePayload } from '@/types/reporte';
import type { TableColumn } from '@/types';
import { Cancel as CancelIcon } from '@mui/icons-material';

interface Pregunta {
  id: string;
  texto: string;
  descripcion: string | null;
  tipo: string;
  obligatoria: boolean;
  orden: number;
  configuracion: any;
}

interface RespuestaPregunta {
  id: number;
  pregunta_id: string;
  valor: any;
  texto_otro: string | null;
  created_at: string;
  updated_at: string;
  pregunta?: Pregunta;
}

interface RespuestaCuestionario {
  id: string;
  cuestionario_id: string;
  usuario_id: number;
  estado: string;
  fecha_inicio: string;
  fecha_completado: string | null;
  progreso: number;
  tiempo_total_minutos: number | null;
  created_at: string;
  updated_at: string;
  // Información adicional
  usuario_correo: string;
  usuario_matricula: string;
  usuario_nombre: string;
  cuestionario_titulo: string;
  cuestionario_descripcion: string;
  respuestas_preguntas: RespuestaPregunta[];
  cuestionario_instruccion_sistema?: string | null;
  cuestionario_modelo_ia?: string | null;
  instruccion_sistema_default?: string | null;
}

interface RespuestasData {
  respuestas: RespuestaCuestionario[];
  total: number;
  skip: number;
  limit: number;
}

/**
 * Página para ver todos los cuestionarios contestados por los usuarios.
 * Solo disponible para administradores y coordinadores.
 */
const CuestionariosContestadosPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const { showNotification } = useNotification();

  const [respuestas, setRespuestas] = useState<RespuestaCuestionario[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('completado'); // Por defecto solo mostrar completados

  // Detalle de respuesta
  const [respuestaSeleccionada, setRespuestaSeleccionada] = useState<RespuestaCuestionario | null>(null);
  const [detalleOpen, setDetalleOpen] = useState(false);

  // Reportes IA
  const [reporteActual, setReporteActual] = useState<Reporte | null>(null);
  const [reporteViewerOpen, setReporteViewerOpen] = useState(false);
  const [cargandoReporte, setCargandoReporte] = useState(false);
  const [regenerandoReporte, setRegenerandoReporte] = useState(false);

  // Modal de confirmación de borrado
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [respuestaABorrar, setRespuestaABorrar] = useState<RespuestaCuestionario | null>(null);
  const [borrando, setBorrando] = useState(false);

  const preguntasRespuestasPayload = useMemo<PreguntaRespuestaReportePayload[]>(() => {
    if (!respuestaSeleccionada || !respuestaSeleccionada.respuestas_preguntas) {
      return [];
    }

    return respuestaSeleccionada.respuestas_preguntas
      .filter(rp => {
        const textoPregunta = rp.pregunta?.texto ?? '';
        return textoPregunta.trim().length > 0;
      })
      .map((rp): PreguntaRespuestaReportePayload => ({
        pregunta_id: rp.pregunta_id,
        pregunta: rp.pregunta?.texto || 'Pregunta sin texto',
        respuesta: rp.valor ?? undefined,
        texto_otro: rp.texto_otro,
        tipo: rp.pregunta?.tipo,
        orden: rp.pregunta?.orden
      }));
  }, [respuestaSeleccionada]);

  // PROTECCIÓN DE DATOS:
  // - Se envían: edad, género, semestre (datos demográficos útiles)
  // - NO se envían: nombres, correos, teléfonos, direcciones
  // - Matrícula: comentada temporalmente para pruebas
  const personaInfoPayload = useMemo<PersonaInfoReportePayload | undefined>(() => {
    if (!respuestaSeleccionada) return undefined;

    const payload: PersonaInfoReportePayload = {
      // COMENTADO TEMPORALMENTE PARA PRUEBAS
      // matricula: respuestaSeleccionada.usuario_matricula || undefined

      // Datos demográficos útiles para el análisis
      edad: respuestaSeleccionada.usuario_edad || undefined,
      genero: respuestaSeleccionada.usuario_genero || undefined,
      semestre: respuestaSeleccionada.usuario_semestre || undefined
    };

    const tieneDatos = Object.values(payload).some(valor => Boolean(valor));
    return tieneDatos ? payload : undefined;
  }, [respuestaSeleccionada]);

  const instruccionSistemaSeleccionada = respuestaSeleccionada?.cuestionario_instruccion_sistema ?? null;
  const instruccionSistemaDefault = respuestaSeleccionada?.instruccion_sistema_default ?? null;
  const modeloIASeleccionado = respuestaSeleccionada?.cuestionario_modelo_ia ?? null;
  const maxTokensSeleccionado = respuestaSeleccionada?.cuestionario?.max_tokens ?? null;
  const temperatureSeleccionado = respuestaSeleccionada?.cuestionario?.temperature ?? null;

  useEffect(() => {
    cargarRespuestas();
  }, [page, rowsPerPage, filtroEstado]);

  const cargarRespuestas = async () => {
    try {
      setLoading(true);
      setError(null);

      const filtros: any = {
        skip: page * rowsPerPage,
        limit: rowsPerPage
      };

      if (filtroEstado !== 'todos') {
        filtros.estado = filtroEstado;
      }

      const data: RespuestasData = await cuestionariosAdminApi.getAllRespuestas(filtros);
      setRespuestas(data.respuestas);
      setTotal(data.total);
    } catch (error: any) {
      console.error('Error cargando respuestas:', error);
      setError(error.response?.data?.detail || 'Error al cargar las respuestas de cuestionarios');
      showNotification('Error al cargar las respuestas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleVerDetalle = (respuesta: RespuestaCuestionario) => {
    setRespuestaSeleccionada(respuesta);
    setDetalleOpen(true);
    // Cargar reporte si existe
    cargarReporte(respuesta.id);
  };

  const handleContestarCuestionario = (cuestionarioId: string) => {
    // Navegar a la página de responder cuestionario
    navigate(`/usuario/cuestionarios/responder/${cuestionarioId}`);
  };

  const handleOpenDeleteDialog = (respuesta: RespuestaCuestionario) => {
    setRespuestaABorrar(respuesta);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setRespuestaABorrar(null);
  };

  const handleConfirmDelete = async () => {
    if (!respuestaABorrar) return;

    try {
      setBorrando(true);
      await cuestionariosAdminApi.eliminarRespuesta(respuestaABorrar.id);
      showNotification('Respuesta eliminada correctamente', 'success');
      handleCloseDeleteDialog();
      // Recargar la lista
      cargarRespuestas();
    } catch (error: any) {
      console.error('Error al eliminar respuesta:', error);
      showNotification(
        error.response?.data?.detail || 'Error al eliminar la respuesta',
        'error'
      );
    } finally {
      setBorrando(false);
    }
  };

  const handleBulkCancel = async (ids: string[]) => {
    try {
      const result = await cuestionariosAdminApi.bulkCancelRespuestas(ids);

      if (result.total_cancelled > 0) {
        showNotification(
          `${result.total_cancelled} respuesta(s) cancelada(s) exitosamente`,
          'success'
        );
      }

      if (result.errors && result.errors.length > 0) {
        showNotification(
          `Algunas respuestas no pudieron cancelarse: ${result.errors.join(', ')}`,
          'warning'
        );
      }

      await cargarRespuestas();
    } catch (error: any) {
      console.error('Error en batch cancel:', error);
      showNotification(
        error.response?.data?.detail || 'Error al cancelar respuestas',
        'error'
      );
      throw error;
    }
  };

  const cargarReporte = async (respuestaId: string) => {
    try {
      setCargandoReporte(true);
      const response = await cuestionariosAdminApi.obtenerReporteActual(respuestaId);
      if (response && response.reporte) {
        setReporteActual(response.reporte);
      } else {
        setReporteActual(null);
      }
    } catch (error: any) {
      console.error('Error cargando reporte:', error);
      setReporteActual(null);
    } finally {
      setCargandoReporte(false);
    }
  };

  const handleRegenerarReporte = async () => {
    if (!respuestaSeleccionada) return;

    try {
      setRegenerandoReporte(true);
      await cuestionariosAdminApi.regenerarReporte(respuestaSeleccionada.id);
      showNotification('Reporte regenerado exitosamente', 'success');
      // Recargar el reporte
      await cargarReporte(respuestaSeleccionada.id);
    } catch (error: any) {
      console.error('Error regenerando reporte:', error);
      showNotification('Error al regenerar el reporte', 'error');
    } finally {
      setRegenerandoReporte(false);
    }
  };

  const formatearFecha = (fechaString: string | null) => {
    if (!fechaString) return 'N/A';
    try {
      return format(new Date(fechaString), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es });
    } catch (error) {
      return fechaString;
    }
  };

  const getEstadoChip = (estado: string) => {
    switch (estado) {
      case 'completado':
        return <Chip label="Completado" color="success" size="small" icon={<CheckCircleIcon />} />;
      case 'en_progreso':
        return <Chip label="En Progreso" color="warning" size="small" icon={<PlayArrowIcon />} />;
      case 'pendiente':
        return <Chip label="Pendiente" color="default" size="small" icon={<HourglassEmptyIcon />} />;
      default:
        return <Chip label={estado} size="small" />;
    }
  };

  const renderRespuestaValor = (valor: any, tipoPregunta?: string) => {
    if (valor === null || valor === undefined || valor === '') {
      return <em style={{ color: '#999' }}>Sin respuesta</em>;
    }

    // Si es un array (checkbox, opción múltiple)
    if (Array.isArray(valor)) {
      if (valor.length === 0) {
        return <em style={{ color: '#999' }}>Sin respuesta</em>;
      }
      return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {valor.map((item, idx) => (
            <Chip key={idx} label={item} size="small" color="primary" variant="outlined" />
          ))}
        </Box>
      );
    }

    // Si es un booleano (verdadero/falso)
    if (typeof valor === 'boolean') {
      return valor ? 'Verdadero' : 'Falso';
    }

    // Si es un número (escala, etc.)
    if (typeof valor === 'number') {
      return valor.toString();
    }

    // Si es un string
    return String(valor);
  };

  const respuestasFiltradas = respuestas.filter(respuesta => {
    if (!busqueda.trim()) return true;
    const busquedaLower = busqueda.toLowerCase();
    return (
      respuesta.usuario_correo?.toLowerCase().includes(busquedaLower) ||
      respuesta.usuario_matricula?.toLowerCase().includes(busquedaLower) ||
      respuesta.usuario_nombre?.toLowerCase().includes(busquedaLower) ||
      respuesta.cuestionario_titulo?.toLowerCase().includes(busquedaLower)
    );
  });

  // Definir columnas para la tabla
  const columns: TableColumn<RespuestaCuestionario>[] = [
    {
      id: 'usuario',
      label: 'Usuario',
      render: (respuesta) => (
        <Box>
          <Typography variant="body2" fontWeight="bold">
            {respuesta.usuario_nombre || 'N/A'}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            {respuesta.usuario_correo}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Mat: {respuesta.usuario_matricula || 'N/A'}
          </Typography>
        </Box>
      )
    },
    {
      id: 'cuestionario',
      label: 'Cuestionario',
      render: (respuesta) => (
        <Typography variant="body2" fontWeight="medium">
          {respuesta.cuestionario_titulo}
        </Typography>
      )
    },
    {
      id: 'estado',
      label: 'Estado',
      render: (respuesta) => getEstadoChip(respuesta.estado)
    },
    {
      id: 'progreso',
      label: 'Progreso',
      render: (respuesta) => (
        <Chip
          label={`${respuesta.progreso}%`}
          size="small"
          color={respuesta.progreso === 100 ? 'success' : 'default'}
        />
      )
    },
    {
      id: 'fecha_inicio',
      label: 'Fecha Inicio',
      render: (respuesta) => (
        <Typography variant="caption">
          {formatearFecha(respuesta.fecha_inicio)}
        </Typography>
      )
    },
    {
      id: 'fecha_completado',
      label: 'Fecha Completado',
      render: (respuesta) => (
        <Typography variant="caption">
          {formatearFecha(respuesta.fecha_completado)}
        </Typography>
      )
    }
  ];

  // Definir acciones adicionales para cada fila
  const actions = [
    {
      icon: <VisibilityIcon />,
      tooltip: 'Ver detalle',
      onClick: (respuesta: RespuestaCuestionario) => handleVerDetalle(respuesta),
      color: 'primary' as const
    }
  ];

  if (loading && respuestas.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Button
            color="inherit"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/dashboard')}
            sx={{ mr: 2 }}
          >
            Volver
          </Button>

          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Cuestionarios Contestados
          </Typography>

          <Button color="inherit" onClick={logout}>
            Cerrar Sesión
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Encabezado */}
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Box display="flex" alignItems="center" mb={2}>
            <CheckCircleIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                Cuestionarios Contestados
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Visualiza y gestiona todas las respuestas de cuestionarios administrativos
              </Typography>
            </Box>
          </Box>

          {user && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Usuario:</strong> {user.correo_institucional} ({user.rol})
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Filtros y búsqueda */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <FilterIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Filtros y Búsqueda
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Buscar por usuario, matrícula o cuestionario..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={filtroEstado}
                    label="Estado"
                    onChange={(e) => {
                      setFiltroEstado(e.target.value);
                      setPage(0);
                    }}
                  >
                    <MenuItem value="todos">Todos</MenuItem>
                    <MenuItem value="completado">Completado</MenuItem>
                    <MenuItem value="en_progreso">En Progreso</MenuItem>
                    <MenuItem value="pendiente">Pendiente</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button
                  variant="outlined"
                  startIcon={loading ? <CircularProgress size={20} /> : <FilterIcon />}
                  onClick={cargarRespuestas}
                  fullWidth
                  disabled={loading}
                >
                  Actualizar
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Tabla de respuestas */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <GenericTableWithBulkDelete
          data={respuestasFiltradas}
          columns={columns}
          getItemId={(respuesta) => respuesta.id}
          onDelete={(respuesta) => handleOpenDeleteDialog(respuesta)}
          onBulkDelete={handleBulkCancel}
          actions={actions}
          loading={loading}
          entityName="respuestas"
          currentUserRole={user?.rol}
          allowBulkDelete={user?.rol === 'admin' || user?.rol === 'coordinador'}
          bulkDeleteWarning="Se cancelarán todas las respuestas seleccionadas. El estado cambiará a 'cancelado'."
          emptyMessage={busqueda ? 'No se encontraron respuestas que coincidan con la búsqueda' : 'No hay respuestas de cuestionarios'}
          bulkActionLabel="Cancelar"
          bulkActionDialogTitle="Confirmar Cancelación Masiva"
        />
      </Container>

      {/* Dialog de detalle */}
      <Dialog
        open={detalleOpen}
        onClose={() => setDetalleOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <AssignmentIcon sx={{ mr: 1 }} />
            Detalle de Respuesta
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {respuestaSeleccionada && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {respuestaSeleccionada.cuestionario_titulo}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {respuestaSeleccionada.cuestionario_descripcion}
              </Typography>

              <Divider sx={{ my: 2 }} />

              {/* Información resumida del usuario */}
              <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="primary.main" gutterBottom>
                  <PersonIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                  Respondido por: {respuestaSeleccionada.usuario_nombre}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {respuestaSeleccionada.usuario_correo} | Matrícula: {respuestaSeleccionada.usuario_matricula || 'N/A'}
                </Typography>
              </Box>

              {/* Preguntas y Respuestas */}
              <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
                Preguntas y Respuestas
              </Typography>

              {respuestaSeleccionada.respuestas_preguntas && respuestaSeleccionada.respuestas_preguntas.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {respuestaSeleccionada.respuestas_preguntas
                    .sort((a, b) => (a.pregunta?.orden || 0) - (b.pregunta?.orden || 0))
                    .map((respuestaPregunta, index) => (
                      <Paper
                        key={respuestaPregunta.id}
                        sx={{
                          p: 2,
                          bgcolor: 'grey.50',
                          border: '1px solid',
                          borderColor: 'divider'
                        }}
                      >
                        {/* Pregunta */}
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle1" fontWeight="bold" color={respuestaPregunta.pregunta ? "primary.main" : "warning.dark"}>
                            {index + 1}. {respuestaPregunta.pregunta?.texto || 'Pregunta no disponible'}
                          </Typography>
                          {!respuestaPregunta.pregunta && (
                            <Typography variant="caption" color="warning.dark" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic' }}>
                              Esta pregunta fue modificada o eliminada después de que se respondió el cuestionario.
                            </Typography>
                          )}
                          {respuestaPregunta.pregunta?.descripcion && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              {respuestaPregunta.pregunta.descripcion}
                            </Typography>
                          )}
                          <Chip
                            label={respuestaPregunta.pregunta?.tipo || 'Tipo desconocido'}
                            size="small"
                            sx={{ mt: 1 }}
                            variant="outlined"
                            color={respuestaPregunta.pregunta ? "default" : "warning"}
                          />
                        </Box>

                        {/* Respuesta */}
                        <Box sx={{ pl: 2, borderLeft: '3px solid', borderColor: 'primary.main' }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Respuesta:
                          </Typography>
                          <Typography variant="body1">
                            {renderRespuestaValor(respuestaPregunta.valor, respuestaPregunta.pregunta?.tipo)}
                          </Typography>
                          {respuestaPregunta.texto_otro && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                              Otro: {respuestaPregunta.texto_otro}
                            </Typography>
                          )}
                        </Box>
                      </Paper>
                    ))}
                </Box>
              ) : (
                <Alert severity="info">
                  No hay respuestas registradas para este cuestionario.
                </Alert>
              )}

              {/* Sección de Reportes IA */}
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
                Reporte Psicopedagógico
              </Typography>

              {cargandoReporte ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={30} />
                </Box>
              ) : reporteActual ? (
                <Paper sx={{ p: 2, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle2" color="success.main" gutterBottom>
                        ✓ Reporte Generado
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Versión {reporteActual.version} - {formatearFecha(reporteActual.fecha_generacion)}
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setReporteViewerOpen(true)}
                    >
                      Ver Reporte
                    </Button>
                  </Box>
                </Paper>
              ) : (
                <Alert severity="info">
                  No hay reporte generado aún. Haz clic en "Generar Reporte" para crear uno.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ gap: 1 }}>
          {respuestaSeleccionada && (
            <>
              <GenerarReporteButton
                respuestaId={respuestaSeleccionada.id}
                isAdmin={true}
                isRegenerate={!!reporteActual}
                variant="contained"
                size="small"
                preguntasRespuestas={preguntasRespuestasPayload}
                instruccionSistema={instruccionSistemaSeleccionada}
                instruccionSistemaDefault={instruccionSistemaDefault}
                modeloIA={modeloIASeleccionado}
                maxTokens={maxTokensSeleccionado}
                temperature={temperatureSeleccionado}
                personaInfo={personaInfoPayload}
                onSuccess={() => cargarReporte(respuestaSeleccionada.id)}
              />
              {reporteActual && (
                <Tooltip title="Ver reporte actual">
                  <Button
                    onClick={() => setReporteViewerOpen(true)}
                    variant="outlined"
                    size="small"
                    startIcon={<FileDownloadIcon />}
                  >
                    Ver Reporte
                  </Button>
                </Tooltip>
              )}
            </>
          )}
          <Button onClick={() => setDetalleOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Visor de Reporte IA */}
      <ReporteIAViewer
        open={reporteViewerOpen}
        reporte={reporteActual}
        respuestaId={respuestaSeleccionada?.id}
        onClose={() => setReporteViewerOpen(false)}
        onRegenerate={handleRegenerarReporte}
        isRegenerating={regenerandoReporte}
        isAdmin={true}
      />

      {/* Modal de confirmación de borrado */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Confirmar Eliminación
        </DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar esta respuesta?
          </Typography>
          {respuestaABorrar && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Cuestionario:</strong> {respuestaABorrar.cuestionario_titulo}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Usuario:</strong> {respuestaABorrar.usuario_correo}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Matrícula:</strong> {respuestaABorrar.usuario_matricula}
              </Typography>
              <Typography variant="body2">
                <strong>Fecha:</strong> {formatearFecha(respuestaABorrar.fecha_completado)}
              </Typography>
            </Box>
          )}
          <Alert severity="warning" sx={{ mt: 2 }}>
            Esta acción no se puede deshacer. Se eliminarán todas las respuestas y reportes asociados.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseDeleteDialog}
            disabled={borrando}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={borrando}
            startIcon={borrando ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {borrando ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CuestionariosContestadosPage;
