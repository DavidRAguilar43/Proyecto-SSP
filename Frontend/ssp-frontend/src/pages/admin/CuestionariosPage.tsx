import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  Grid,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  Pagination,
  AppBar,
  Toolbar
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Visibility as ViewIcon,
  Assignment as AssignmentIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as ActivarIcon,
  Cancel as DesactivarIcon
} from '@mui/icons-material';
import { cuestionariosAdminApi } from '@/services/api';
import { useNotification } from '@/hooks/useNotification';
import ConfirmDialog from '@/components/ConfirmDialog';
import type {
  CuestionarioAdmin,
  FiltrosCuestionarios,
  EstadoCuestionario,
  TipoUsuario
} from '@/types/cuestionarios';
import { getTipoUsuarioLabel } from '@/components/cuestionarios/AsignacionUsuarios';

/**
 * Página principal para la gestión de cuestionarios administrativos
 */
const CuestionariosPage: React.FC = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  // Estados principales
  const [cuestionarios, setCuestionarios] = useState<CuestionarioAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Estados de filtros
  const [filtros, setFiltros] = useState<FiltrosCuestionarios>({
    titulo: '',
    estado: undefined,
    tipo_usuario: undefined,
    skip: 0,
    limit
  });

  // Estados de UI
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [cuestionarioSeleccionado, setCuestionarioSeleccionado] = useState<CuestionarioAdmin | null>(null);
  const [cuestionarioToDelete, setCuestionarioToDelete] = useState<CuestionarioAdmin | null>(null);
  const [cuestionarioToActivate, setCuestionarioToActivate] = useState<CuestionarioAdmin | null>(null);
  const [cuestionarioToDeactivate, setCuestionarioToDeactivate] = useState<CuestionarioAdmin | null>(null);

  // Cargar cuestionarios
  const cargarCuestionarios = async () => {
    try {
      setLoading(true);
      const response = await cuestionariosAdminApi.getAll({
        ...filtros,
        skip: (page - 1) * limit,
        limit
      });
      setCuestionarios(response.cuestionarios);
      setTotal(response.total);
    } catch (error) {
      console.error('Error al cargar cuestionarios:', error);
      showNotification('Error al cargar cuestionarios', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Efectos
  useEffect(() => {
    cargarCuestionarios();
  }, [page, filtros]);

  // Handlers
  const handleSearch = (titulo: string) => {
    setFiltros(prev => ({ ...prev, titulo }));
    setPage(1);
  };

  const handleFilterChange = (key: keyof FiltrosCuestionarios, value: any) => {
    setFiltros(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, cuestionario: CuestionarioAdmin) => {
    setMenuAnchor(event.currentTarget);
    setCuestionarioSeleccionado(cuestionario);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setCuestionarioSeleccionado(null);
  };

  const handleView = (cuestionario?: CuestionarioAdmin) => {
    const target = cuestionario || cuestionarioSeleccionado;
    if (target) {
      navigate(`/admin/cuestionarios/ver/${target.id}`);
    }
    handleMenuClose();
  };

  const handleEdit = (cuestionario?: CuestionarioAdmin) => {
    const target = cuestionario || cuestionarioSeleccionado;
    if (target) {
      navigate(`/admin/cuestionarios/editar/${target.id}`);
    }
    handleMenuClose();
  };

  const handleDuplicate = async () => {
    if (!cuestionarioSeleccionado) return;
    
    try {
      await cuestionariosAdminApi.duplicate(
        cuestionarioSeleccionado.id,
        `${cuestionarioSeleccionado.titulo} (Copia)`
      );
      showNotification('Cuestionario duplicado exitosamente', 'success');
      cargarCuestionarios();
    } catch (error) {
      showNotification('Error al duplicar cuestionario', 'error');
    }
    handleMenuClose();
  };

  const handleDeleteClick = (cuestionario: CuestionarioAdmin) => {
    setCuestionarioToDelete(cuestionario);
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (!cuestionarioToDelete) return;

    try {
      await cuestionariosAdminApi.delete(cuestionarioToDelete.id);
      showNotification('Cuestionario eliminado exitosamente', 'success');
      cargarCuestionarios();
    } catch (error) {
      showNotification('Error al eliminar cuestionario', 'error');
    }
    setCuestionarioToDelete(null);
  };

  const handleActivateClick = (cuestionario: CuestionarioAdmin) => {
    setCuestionarioToActivate(cuestionario);
    handleMenuClose();
  };

  const handleActivate = async () => {
    if (!cuestionarioToActivate) return;

    try {
      await cuestionariosAdminApi.cambiarEstado(cuestionarioToActivate.id, 'activo');
      showNotification('Cuestionario activado exitosamente', 'success');
      cargarCuestionarios();
    } catch (error) {
      showNotification('Error al activar cuestionario', 'error');
    }
    setCuestionarioToActivate(null);
  };

  const handleDeactivateClick = (cuestionario: CuestionarioAdmin) => {
    setCuestionarioToDeactivate(cuestionario);
    handleMenuClose();
  };

  const handleDeactivate = async () => {
    if (!cuestionarioToDeactivate) return;

    try {
      await cuestionariosAdminApi.cambiarEstado(cuestionarioToDeactivate.id, 'inactivo');
      showNotification('Cuestionario desactivado exitosamente', 'success');
      cargarCuestionarios();
    } catch (error) {
      showNotification('Error al desactivar cuestionario', 'error');
    }
    setCuestionarioToDeactivate(null);
  };

  const handleChangeStatus = async (estado: EstadoCuestionario) => {
    if (!cuestionarioSeleccionado) return;

    try {
      await cuestionariosAdminApi.cambiarEstado(cuestionarioSeleccionado.id, estado);
      showNotification(`Cuestionario ${estado === 'activo' ? 'activado' : 'desactivado'} exitosamente`, 'success');
      cargarCuestionarios();
    } catch (error) {
      showNotification('Error al cambiar estado del cuestionario', 'error');
    }
    handleMenuClose();
  };

  const getEstadoColor = (estado: EstadoCuestionario) => {
    switch (estado) {
      case 'activo': return 'success';
      case 'inactivo': return 'default';
      case 'borrador': return 'warning';
      default: return 'default';
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Box>
      {/* Header */}
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

          <AssignmentIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Gestión de Cuestionarios
          </Typography>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/admin/cuestionarios/crear')}
            sx={{ backgroundColor: 'white', color: 'primary.main', '&:hover': { backgroundColor: 'grey.100' } }}
          >
            Crear Cuestionario
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        {/* Barra de búsqueda y filtros */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Buscar por título..."
                  value={filtros.titulo || ''}
                  onChange={(e) => handleSearch(e.target.value)}
                  sx={{ minWidth: 200 }}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth sx={{ minWidth: 180 }}>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={filtros.estado || ''}
                    label="Estado"
                    onChange={(e) => handleFilterChange('estado', e.target.value || undefined)}
                    MenuProps={{
                      PaperProps: {
                        sx: { maxHeight: 300 }
                      }
                    }}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="activo">Activo</MenuItem>
                    <MenuItem value="inactivo">Inactivo</MenuItem>
                    <MenuItem value="borrador">Borrador</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth sx={{ minWidth: 180 }}>
                  <InputLabel>Tipo Usuario</InputLabel>
                  <Select
                    value={filtros.tipo_usuario || ''}
                    label="Tipo Usuario"
                    onChange={(e) => handleFilterChange('tipo_usuario', e.target.value || undefined)}
                    MenuProps={{
                      PaperProps: {
                        sx: { maxHeight: 300 }
                      }
                    }}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="alumno">Alumnos</MenuItem>
                    <MenuItem value="docente">Docentes</MenuItem>
                    <MenuItem value="personal">Personal</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Estadísticas rápidas */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {cuestionarios.filter(c => c.estado === 'activo').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Activos
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {cuestionarios.filter(c => c.estado === 'borrador').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Borradores
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="text.secondary">
                  {cuestionarios.filter(c => c.estado === 'inactivo').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Inactivos
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Lista de cuestionarios */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : cuestionarios.length === 0 ? (
          <Alert severity="info">
            No se encontraron cuestionarios. 
            <Button onClick={() => navigate('/admin/cuestionarios/crear')} sx={{ ml: 1 }}>
              Crear el primero
            </Button>
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {cuestionarios.map((cuestionario) => (
              <Grid item xs={12} md={6} lg={4} key={cuestionario.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" component="h3" sx={{ flex: 1, mr: 1 }}>
                        {cuestionario.titulo}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, cuestionario)}
                      >
                        <MoreIcon />
                      </IconButton>
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {cuestionario.descripcion}
                    </Typography>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                      <Chip
                        label={cuestionario.estado}
                        color={getEstadoColor(cuestionario.estado)}
                        size="small"
                      />
                      <Chip
                        label={`${cuestionario.total_preguntas} preguntas`}
                        variant="outlined"
                        size="small"
                      />
                      {cuestionario.tipos_usuario_asignados.map(tipo => (
                        <Chip
                          key={tipo}
                          label={getTipoUsuarioLabel(tipo)}
                          variant="outlined"
                          size="small"
                        />
                      ))}
                    </Box>

                    <Typography variant="caption" color="text.secondary">
                      Creado: {formatearFecha(cuestionario.fecha_creacion)}
                    </Typography>
                    {cuestionario.creado_por_nombre && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Por: {cuestionario.creado_por_nombre}
                      </Typography>
                    )}

                    {/* Botones de acción */}
                    <Box sx={{ display: 'flex', gap: 1, mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleView(cuestionario)}
                        title="Ver detalles"
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEdit(cuestionario)}
                        title="Editar"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      {cuestionario.estado === 'activo' ? (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeactivateClick(cuestionario)}
                          title="Desactivar"
                        >
                          <DesactivarIcon fontSize="small" />
                        </IconButton>
                      ) : (
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleActivateClick(cuestionario)}
                          title="Activar"
                        >
                          <ActivarIcon fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(cuestionario)}
                        title="Eliminar"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Paginación */}
        {total > limit && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={Math.ceil(total / limit)}
              page={page}
              onChange={(_, newPage) => setPage(newPage)}
              color="primary"
            />
          </Box>
        )}
      </Box>

      {/* Menú contextual */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleView()}>
          <ViewIcon sx={{ mr: 1 }} />
          Ver detalles
        </MenuItem>
        <MenuItem onClick={() => handleEdit()}>
          <EditIcon sx={{ mr: 1 }} />
          Editar
        </MenuItem>
        <MenuItem onClick={handleDuplicate}>
          <CopyIcon sx={{ mr: 1 }} />
          Duplicar
        </MenuItem>
        {cuestionarioSeleccionado?.estado === 'activo' ? (
          <MenuItem
            onClick={() => cuestionarioSeleccionado && handleDeactivateClick(cuestionarioSeleccionado)}
            sx={{ color: 'error.main' }}
          >
            <DesactivarIcon sx={{ mr: 1 }} />
            Desactivar
          </MenuItem>
        ) : (
          <MenuItem
            onClick={() => cuestionarioSeleccionado && handleActivateClick(cuestionarioSeleccionado)}
            sx={{ color: 'success.main' }}
          >
            <ActivarIcon sx={{ mr: 1 }} />
            Activar
          </MenuItem>
        )}
        <MenuItem
          onClick={() => cuestionarioSeleccionado && handleDeleteClick(cuestionarioSeleccionado)}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          Eliminar
        </MenuItem>
      </Menu>

      {/* Diálogo de confirmación de eliminación */}
      <ConfirmDialog
        open={cuestionarioToDelete !== null}
        onCancel={() => setCuestionarioToDelete(null)}
        onConfirm={handleDelete}
        title="Eliminar Cuestionario"
        message={`¿Está seguro de que desea eliminar el cuestionario "${cuestionarioToDelete?.titulo}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        severity="error"
      />

      {/* Diálogo de confirmación de activación */}
      <ConfirmDialog
        open={cuestionarioToActivate !== null}
        onCancel={() => setCuestionarioToActivate(null)}
        onConfirm={handleActivate}
        title="Activar Cuestionario"
        message={`¿Está seguro de que desea activar el cuestionario "${cuestionarioToActivate?.titulo}"? Estará disponible para los usuarios asignados.`}
        confirmText="Activar"
        cancelText="Cancelar"
        severity="info"
      />

      {/* Diálogo de confirmación de desactivación */}
      <ConfirmDialog
        open={cuestionarioToDeactivate !== null}
        onCancel={() => setCuestionarioToDeactivate(null)}
        onConfirm={handleDeactivate}
        title="Desactivar Cuestionario"
        message={`¿Está seguro de que desea desactivar el cuestionario "${cuestionarioToDeactivate?.titulo}"? Ya no estará disponible para los usuarios.`}
        confirmText="Desactivar"
        cancelText="Cancelar"
        severity="warning"
      />
    </Box>
  );
};

export default CuestionariosPage;
