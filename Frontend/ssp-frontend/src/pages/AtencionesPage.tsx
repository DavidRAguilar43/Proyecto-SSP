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
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AtencionForm } from '../components/AtencionForm';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { atencionesApi } from '@/services/api';
import type { Atencion } from '../types/index';

export const AtencionesPage: React.FC = () => {
  const navigate = useNavigate();
  const [atenciones, setAtenciones] = useState<Atencion[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAtendido, setFilterAtendido] = useState('');
  const [filterSeguimiento, setFilterSeguimiento] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [selectedAtencion, setSelectedAtencion] = useState<Atencion | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [atencionToDelete, setAtencionToDelete] = useState<Atencion | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info',
  });

  const showSnackbar = (message: string, severity: typeof snackbar.severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const loadAtenciones = async () => {
    try {
      setLoading(true);
      const data = await atencionesApi.getAll();
      setAtenciones(data);
    } catch (error) {
      console.error('Error loading atenciones:', error);
      showSnackbar('Error al cargar las atenciones', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAtenciones();
  }, []);

  const handleCreate = () => {
    setSelectedAtencion(null);
    setFormOpen(true);
  };

  const handleEdit = (atencion: Atencion) => {
    setSelectedAtencion(atencion);
    setFormOpen(true);
  };

  const handleDelete = (atencion: Atencion) => {
    setAtencionToDelete(atencion);
    setConfirmOpen(true);
  };

  const handleFormSubmit = async (atencionData: any) => {
    try {
      setLoading(true);

      if (selectedAtencion) {
        // Actualizar atención existente
        const updatedAtencion = await atencionesApi.update(selectedAtencion.id, atencionData);
        setAtenciones(prev =>
          prev.map(a => a.id === selectedAtencion.id ? updatedAtencion : a)
        );
        showSnackbar('Atención actualizada exitosamente', 'success');
      } else {
        // Crear nueva atención
        const newAtencion = await atencionesApi.create(atencionData);
        setAtenciones(prev => [...prev, newAtencion]);
        showSnackbar('Atención creada exitosamente', 'success');
      }

      setFormOpen(false);
      setSelectedAtencion(null);
      setSearchQuery('');
      setFilterAtendido('');
      setFilterSeguimiento('');

    } catch (error: any) {
      console.error('Error saving atencion:', error);
      let message = 'Error al guardar la atención';

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
    if (!atencionToDelete) return;

    try {
      setLoading(true);
      await atencionesApi.delete(atencionToDelete.id);

      setAtenciones(prev =>
        prev.filter(a => a.id !== atencionToDelete.id)
      );

      showSnackbar('Atención eliminada exitosamente', 'success');
      setConfirmOpen(false);
      setAtencionToDelete(null);
    } catch (error: any) {
      console.error('Error deleting atencion:', error);
      let message = 'Error al eliminar la atención';

      if (error.response?.status === 403) {
        message = 'No tiene permisos para eliminar atenciones';
      } else if (error.response?.data?.detail) {
        message = error.response.data.detail;
      }

      showSnackbar(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredAtenciones = atenciones.filter(atencion => {
    const matchesSearch = atencion.observaciones?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         atencion.persona?.correo_institucional?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         atencion.fecha_atencion.includes(searchQuery);

    const matchesAtendido = !filterAtendido ||
                           (filterAtendido === 'true' && atencion.atendido) ||
                           (filterAtendido === 'false' && !atencion.atendido);

    const matchesSeguimiento = !filterSeguimiento ||
                              (filterSeguimiento === 'true' && atencion.requiere_seguimiento) ||
                              (filterSeguimiento === 'false' && !atencion.requiere_seguimiento);

    return matchesSearch && matchesAtendido && matchesSeguimiento;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const getMotivos = (atencion: Atencion) => {
    const motivos = [];
    if (atencion.motivo_psicologico) motivos.push('Psicológico');
    if (atencion.motivo_academico) motivos.push('Académico');
    if (atencion.salud_en_general) motivos.push('Salud General');
    return motivos;
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
            Gestión de Atenciones
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
          disabled={loading}
        >
          Nueva Atención
        </Button>
      </Box>

      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          sx={{ flexGrow: 1, minWidth: 300 }}
          placeholder="Buscar por observaciones, correo o fecha..."
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

        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Estado</InputLabel>
          <Select
            value={filterAtendido}
            onChange={(e) => setFilterAtendido(e.target.value)}
            label="Estado"
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="true">Atendido</MenuItem>
            <MenuItem value="false">Pendiente</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Seguimiento</InputLabel>
          <Select
            value={filterSeguimiento}
            onChange={(e) => setFilterSeguimiento(e.target.value)}
            label="Seguimiento"
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="true">Requiere</MenuItem>
            <MenuItem value="false">No requiere</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Persona</TableCell>
              <TableCell>Motivos</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Seguimiento</TableCell>
              <TableCell>Observaciones</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && atenciones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredAtenciones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No se encontraron atenciones
                </TableCell>
              </TableRow>
            ) : (
              filteredAtenciones.map((atencion) => (
                <TableRow key={atencion.id}>
                  <TableCell>{atencion.id}</TableCell>
                  <TableCell>{formatDate(atencion.fecha_atencion)}</TableCell>
                  <TableCell>
                    {atencion.persona?.correo_institucional || `ID: ${atencion.id_persona}`}
                  </TableCell>
                  <TableCell>
                    {getMotivos(atencion).map((motivo, index) => (
                      <Chip
                        key={index}
                        label={motivo}
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={atencion.atendido ? <CheckCircleIcon /> : <ScheduleIcon />}
                      label={atencion.atendido ? 'Atendido' : 'Pendiente'}
                      color={atencion.atendido ? 'success' : 'warning'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {atencion.requiere_seguimiento ? (
                      <Chip label="Sí" color="info" variant="outlined" />
                    ) : (
                      <Chip label="No" color="default" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell>
                    {atencion.observaciones ?
                      (atencion.observaciones.length > 50 ?
                        `${atencion.observaciones.substring(0, 50)}...` :
                        atencion.observaciones
                      ) : '-'
                    }
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      onClick={() => handleEdit(atencion)}
                      color="primary"
                      disabled={loading}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(atencion)}
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

      {/* Formulario de atención */}
      <AtencionForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedAtencion(null);
        }}
        onSubmit={handleFormSubmit}
        atencion={selectedAtencion}
        loading={loading}
      />

      {/* Diálogo de confirmación para eliminar */}
      <ConfirmDialog
        open={confirmOpen}
        title="Confirmar Eliminación"
        message={`¿Está seguro de que desea eliminar la atención del ${atencionToDelete ? formatDate(atencionToDelete.fecha_atencion) : ''}? Esta acción eliminará permanentemente todos los datos asociados y no se puede deshacer.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setConfirmOpen(false);
          setAtencionToDelete(null);
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
