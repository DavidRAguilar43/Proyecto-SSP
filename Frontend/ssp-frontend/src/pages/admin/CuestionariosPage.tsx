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
  FilterList as FilterIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Visibility as ViewIcon,
  Assignment as AssignmentIcon
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

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

  const handleEdit = () => {
    if (cuestionarioSeleccionado) {
      navigate(`/admin/cuestionarios/editar/${cuestionarioSeleccionado.id}`);
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

  const handleDelete = async () => {
    if (!cuestionarioSeleccionado) return;

    try {
      await cuestionariosAdminApi.delete(cuestionarioSeleccionado.id);
      showNotification('Cuestionario eliminado exitosamente', 'success');
      cargarCuestionarios();
    } catch (error) {
      showNotification('Error al eliminar cuestionario', 'error');
    }
    setShowDeleteDialog(false);
    handleMenuClose();
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
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <AssignmentIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Gestión de Cuestionarios
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/admin/cuestionarios/crear')}
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
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={filtros.estado || ''}
                    label="Estado"
                    onChange={(e) => handleFilterChange('estado', e.target.value || undefined)}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="activo">Activo</MenuItem>
                    <MenuItem value="inactivo">Inactivo</MenuItem>
                    <MenuItem value="borrador">Borrador</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Tipo Usuario</InputLabel>
                  <Select
                    value={filtros.tipo_usuario || ''}
                    label="Tipo Usuario"
                    onChange={(e) => handleFilterChange('tipo_usuario', e.target.value || undefined)}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="alumno">Alumnos</MenuItem>
                    <MenuItem value="docente">Docentes</MenuItem>
                    <MenuItem value="personal">Personal</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Button
                    startIcon={<FilterIcon />}
                    onClick={() => setShowFilters(!showFilters)}
                    variant={showFilters ? 'contained' : 'outlined'}
                  >
                    Filtros
                  </Button>
                </Box>
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
        <MenuItem onClick={() => navigate(`/admin/cuestionarios/ver/${cuestionarioSeleccionado?.id}`)}>
          <ViewIcon sx={{ mr: 1 }} />
          Ver detalles
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1 }} />
          Editar
        </MenuItem>
        <MenuItem onClick={handleDuplicate}>
          <CopyIcon sx={{ mr: 1 }} />
          Duplicar
        </MenuItem>
        {cuestionarioSeleccionado?.estado === 'activo' ? (
          <MenuItem onClick={() => handleChangeStatus('inactivo')}>
            Desactivar
          </MenuItem>
        ) : (
          <MenuItem onClick={() => handleChangeStatus('activo')}>
            Activar
          </MenuItem>
        )}
        <MenuItem onClick={() => setShowDeleteDialog(true)} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Eliminar
        </MenuItem>
      </Menu>

      {/* Diálogo de confirmación de eliminación */}
      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Eliminar Cuestionario"
        message={`¿Está seguro de que desea eliminar el cuestionario "${cuestionarioSeleccionado?.titulo}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        severity="error"
      />
    </Box>
  );
};

export default CuestionariosPage;
