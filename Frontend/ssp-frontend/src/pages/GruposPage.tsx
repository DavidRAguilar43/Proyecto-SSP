import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  Snackbar,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { GrupoForm } from '../components/GrupoForm';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { gruposApi } from '@/services/api';
import type { Grupo } from '../types/index';

export const GruposPage: React.FC = () => {
  const navigate = useNavigate();
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [selectedGrupo, setSelectedGrupo] = useState<Grupo | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [grupoToDelete, setGrupoToDelete] = useState<Grupo | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info',
  });

  const showSnackbar = (message: string, severity: typeof snackbar.severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const loadGrupos = async () => {
    try {
      setLoading(true);
      const data = await gruposApi.getAll();
      setGrupos(data);
    } catch (error) {
      console.error('Error loading grupos:', error);
      showSnackbar('Error al cargar los grupos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGrupos();
  }, []);

  const handleCreate = () => {
    setSelectedGrupo(null);
    setFormOpen(true);
  };

  const handleEdit = (grupo: Grupo) => {
    setSelectedGrupo(grupo);
    setFormOpen(true);
  };

  const handleDelete = (grupo: Grupo) => {
    setGrupoToDelete(grupo);
    setConfirmOpen(true);
  };

  const handleFormSubmit = async (grupoData: any) => {
    try {
      setLoading(true);

      if (selectedGrupo) {
        // Actualizar grupo existente
        const updatedGrupo = await gruposApi.update(selectedGrupo.id, grupoData);
        setGrupos(prev =>
          prev.map(g => g.id === selectedGrupo.id ? updatedGrupo : g)
        );
        showSnackbar('Grupo actualizado exitosamente', 'success');
      } else {
        // Crear nuevo grupo
        const newGrupo = await gruposApi.create(grupoData);
        setGrupos(prev => [...prev, newGrupo]);
        showSnackbar('Grupo creado exitosamente', 'success');
      }

      setFormOpen(false);
      setSelectedGrupo(null);
      setSearchQuery('');
      setFilterTipo('');

    } catch (error: any) {
      console.error('Error saving grupo:', error);
      let message = 'Error al guardar el grupo';

      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          message = error.response.data.detail.map((err: any) =>
            `${err.loc?.join('.')}: ${err.msg}`
          ).join(', ');
        } else {
          message = error.response.data.detail;
        }
      }

      showSnackbar(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!grupoToDelete) return;

    try {
      setLoading(true);
      await gruposApi.delete(grupoToDelete.id);

      setGrupos(prev =>
        prev.filter(g => g.id !== grupoToDelete.id)
      );

      showSnackbar('Grupo eliminado exitosamente', 'success');
      setConfirmOpen(false);
      setGrupoToDelete(null);
    } catch (error: any) {
      console.error('Error deleting grupo:', error);
      let message = 'Error al eliminar el grupo';

      if (error.response?.status === 403) {
        message = 'No tiene permisos para eliminar grupos';
      } else if (error.response?.data?.detail) {
        message = error.response.data.detail;
      }

      showSnackbar(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredGrupos = grupos.filter(grupo => {
    const matchesSearch = grupo.nombre_grupo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (grupo.cohorte && grupo.cohorte.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = !filterTipo || grupo.tipo_grupo === filterTipo;
    return matchesSearch && matchesFilter;
  });

  const getTipoColor = (tipo: string) => {
    const colors: { [key: string]: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' } = {
      'academico': 'primary',
      'extracurricular': 'secondary',
      'deportivo': 'success',
      'cultural': 'warning',
      'investigacion': 'info',
      'otro': 'error'
    };
    return colors[tipo] || 'primary';
  };

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
            Gestión de Grupos
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
          disabled={loading}
        >
          Nuevo Grupo
        </Button>
      </Box>

      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <TextField
          fullWidth
          placeholder="Buscar por nombre o cohorte..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filtrar por Tipo</InputLabel>
          <Select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            label="Filtrar por Tipo"
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="academico">Académico</MenuItem>
            <MenuItem value="extracurricular">Extracurricular</MenuItem>
            <MenuItem value="deportivo">Deportivo</MenuItem>
            <MenuItem value="cultural">Cultural</MenuItem>
            <MenuItem value="investigacion">Investigación</MenuItem>
            <MenuItem value="otro">Otro</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nombre del Grupo</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Cohorte</TableCell>
              <TableCell>Observaciones</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && grupos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredGrupos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No se encontraron grupos
                </TableCell>
              </TableRow>
            ) : (
              filteredGrupos.map((grupo) => (
                <TableRow key={grupo.id}>
                  <TableCell>{grupo.id}</TableCell>
                  <TableCell>{grupo.nombre_grupo}</TableCell>
                  <TableCell>
                    <Chip
                      label={grupo.tipo_grupo}
                      color={getTipoColor(grupo.tipo_grupo)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{grupo.cohorte || '-'}</TableCell>
                  <TableCell>
                    {grupo.observaciones_grupo ?
                      (grupo.observaciones_grupo.length > 50 ?
                        `${grupo.observaciones_grupo.substring(0, 50)}...` :
                        grupo.observaciones_grupo
                      ) : '-'
                    }
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      onClick={() => handleEdit(grupo)}
                      color="primary"
                      disabled={loading}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(grupo)}
                      color="error"
                      disabled={loading}
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

      {/* Formulario de grupo */}
      <GrupoForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedGrupo(null);
        }}
        onSubmit={handleFormSubmit}
        grupo={selectedGrupo}
        loading={loading}
      />

      {/* Diálogo de confirmación para eliminar */}
      <ConfirmDialog
        open={confirmOpen}
        title="Confirmar Eliminación"
        message={`¿Está seguro de que desea eliminar el grupo "${grupoToDelete?.nombre_grupo}"? Esta acción eliminará permanentemente todos los datos asociados y no se puede deshacer.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setConfirmOpen(false);
          setGrupoToDelete(null);
        }}
        loading={loading}
        confirmText="Sí, Eliminar"
        cancelText="Cancelar"
        severity="error"
      />

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
