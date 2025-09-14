import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import ConfirmDialog from '../components/ConfirmDialog';
import { unidadesApi } from '@/services/api';
import type { Unidad, UnidadCreate } from '@/types';

interface UnidadFormData {
  nombre: string;
}

export const UnidadesPage = () => {
  const navigate = useNavigate();
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedUnidad, setSelectedUnidad] = useState<Unidad | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  // Estados para diálogo de confirmación
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [unidadToDelete, setUnidadToDelete] = useState<Unidad | null>(null);

  const [formData, setFormData] = useState<UnidadFormData>({
    nombre: ''
  });

  const showSnackbar = (message: string, severity: typeof snackbar.severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const loadUnidades = async () => {
    try {
      setLoading(true);
      const data = await unidadesApi.getAll();
      setUnidades(data);
    } catch (error) {
      console.error('Error loading unidades:', error);
      showSnackbar('Error al cargar las unidades', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUnidades();
  }, []);

  const handleCreate = () => {
    setSelectedUnidad(null);
    setFormData({ nombre: '' });
    setFormOpen(true);
  };

  const handleEdit = (unidad: Unidad) => {
    setSelectedUnidad(unidad);
    setFormData({
      nombre: unidad.nombre
    });
    setFormOpen(true);
  };

  const handleFormSubmit = async (unidadData: UnidadFormData) => {
    try {
      setLoading(true);

      if (selectedUnidad) {
        // Actualizar unidad existente
        const updatedUnidad = await unidadesApi.update(selectedUnidad.id, unidadData);
        setUnidades(prev =>
          prev.map(u => u.id === selectedUnidad.id ? updatedUnidad : u)
        );
        showSnackbar('Unidad actualizada exitosamente', 'success');
      } else {
        // Crear nueva unidad
        const newUnidad = await unidadesApi.create(unidadData);
        setUnidades(prev => [...prev, newUnidad]);
        showSnackbar('Unidad creada exitosamente', 'success');
      }

      setFormOpen(false);
      setSelectedUnidad(null);
      setSearchQuery('');
    } catch (error: any) {
      console.error('Error saving unidad:', error);
      const errorMessage = error.response?.data?.detail || 'Error al guardar la unidad';
      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (unidad: Unidad) => {
    setUnidadToDelete(unidad);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!unidadToDelete) return;

    try {
      setLoading(true);
      await unidadesApi.delete(unidadToDelete.id);
      setUnidades(prev => prev.filter(u => u.id !== unidadToDelete.id));
      showSnackbar('Unidad eliminada exitosamente', 'success');
    } catch (error: any) {
      console.error('Error deleting unidad:', error);
      const errorMessage = error.response?.data?.detail || 'Error al eliminar la unidad';
      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
      setConfirmOpen(false);
      setUnidadToDelete(null);
    }
  };

  const filteredUnidades = unidades.filter(unidad =>
    unidad.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box display="flex" alignItems="center">
          <IconButton
            onClick={() => navigate('/dashboard')}
            sx={{ mr: 2 }}
            aria-label="Regresar al dashboard"
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            Unidades
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
          disabled={loading}
        >
          Nueva Unidad
        </Button>
      </Box>

      {/* Barra de búsqueda */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar unidades..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
          }}
        />
      </Box>

      {/* Tabla de unidades */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredUnidades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  <Typography variant="body2" color="text.secondary">
                    {searchQuery ? 'No se encontraron unidades que coincidan con la búsqueda' : 'No hay unidades registradas'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredUnidades.map((unidad) => (
                <TableRow key={unidad.id}>
                  <TableCell>
                    <Chip label={unidad.id} size="small" />
                  </TableCell>
                  <TableCell>{unidad.nombre}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      onClick={() => handleEdit(unidad)}
                      color="primary"
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(unidad)}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog para crear/editar unidad */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedUnidad ? 'Editar Unidad' : 'Nueva Unidad'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nombre de la Unidad"
            fullWidth
            variant="outlined"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => handleFormSubmit(formData)}
            variant="contained"
            disabled={!formData.nombre.trim() || loading}
          >
            {selectedUnidad ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Diálogo de confirmación para eliminar */}
      <ConfirmDialog
        open={confirmOpen}
        title="Confirmar eliminación"
        message={`¿Estás seguro de que quieres eliminar la unidad "${unidadToDelete?.nombre}"? Esta acción no se puede deshacer.`}
        onConfirm={confirmDelete}
        onCancel={() => {
          setConfirmOpen(false);
          setUnidadToDelete(null);
        }}
        confirmText="Sí, Eliminar"
        cancelText="Cancelar"
        severity="error"
        loading={loading}
      />
    </Box>
  );
};
