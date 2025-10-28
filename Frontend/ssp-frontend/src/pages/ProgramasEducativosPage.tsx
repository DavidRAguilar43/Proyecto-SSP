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
  TextField,
  InputAdornment,
  Chip,
  Snackbar,
  Alert,
  CircularProgress,
  AppBar,
  Toolbar,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ProgramaEducativoForm } from '../components/ProgramaEducativoForm';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { programasEducativosApi } from '@/services/api';
import type { ProgramaEducativo } from '../types/index';

export const ProgramasEducativosPage: React.FC = () => {
  const navigate = useNavigate();
  const [programas, setProgramas] = useState<ProgramaEducativo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [selectedPrograma, setSelectedPrograma] = useState<ProgramaEducativo | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [programaToDelete, setProgramaToDelete] = useState<ProgramaEducativo | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info',
  });

  const showSnackbar = (message: string, severity: typeof snackbar.severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const loadProgramas = async () => {
    try {
      setLoading(true);
      const data = await programasEducativosApi.getAll();
      setProgramas(data);
    } catch (error) {
      console.error('Error loading programas:', error);
      showSnackbar('Error al cargar los programas educativos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProgramas();
  }, []);

  const handleCreate = () => {
    setSelectedPrograma(null);
    setFormOpen(true);
  };

  const handleEdit = (programa: ProgramaEducativo) => {
    setSelectedPrograma(programa);
    setFormOpen(true);
  };

  const handleDelete = (programa: ProgramaEducativo) => {
    setProgramaToDelete(programa);
    setConfirmOpen(true);
  };

  const handleFormSubmit = async (programaData: any) => {
    try {
      setLoading(true);

      if (selectedPrograma) {
        // Actualizar programa existente
        const updatedPrograma = await programasEducativosApi.update(selectedPrograma.id, programaData);
        setProgramas(prev =>
          prev.map(p => p.id === selectedPrograma.id ? updatedPrograma : p)
        );
        showSnackbar('Programa educativo actualizado exitosamente', 'success');
      } else {
        // Crear nuevo programa
        const newPrograma = await programasEducativosApi.create(programaData);
        setProgramas(prev => [...prev, newPrograma]);
        showSnackbar('Programa educativo creado exitosamente', 'success');
      }

      setFormOpen(false);
      setSelectedPrograma(null);
      setSearchQuery('');

    } catch (error: any) {
      console.error('Error saving programa:', error);
      let message = 'Error al guardar el programa educativo';

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
    if (!programaToDelete) return;

    try {
      setLoading(true);
      await programasEducativosApi.delete(programaToDelete.id);

      setProgramas(prev =>
        prev.filter(p => p.id !== programaToDelete.id)
      );

      showSnackbar('Programa educativo eliminado exitosamente', 'success');
      setConfirmOpen(false);
      setProgramaToDelete(null);
    } catch (error: any) {
      console.error('Error deleting programa:', error);
      let message = 'Error al eliminar el programa educativo';

      if (error.response?.status === 403) {
        message = 'No tiene permisos para eliminar programas educativos';
      } else if (error.response?.data?.detail) {
        message = error.response.data.detail;
      }

      showSnackbar(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredProgramas = programas.filter(programa =>
    programa.nombre_programa.toLowerCase().includes(searchQuery.toLowerCase()) ||
    programa.clave_programa.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* App Bar */}
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
            Programas Educativos
          </Typography>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
            disabled={loading}
            sx={{ backgroundColor: 'white', color: 'primary.main', '&:hover': { backgroundColor: 'grey.100' } }}
          >
            Nuevo Programa
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Buscar por nombre o clave..."
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
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow
              sx={{
                '& .MuiTableCell-head': {
                  backgroundColor: 'background.secondary',
                  fontWeight: 600,
                  color: 'text.primary',
                  whiteSpace: 'nowrap',
                  minWidth: 'fit-content'
                }
              }}
            >
              <TableCell sx={{ minWidth: 60 }}>ID</TableCell>
              <TableCell sx={{ minWidth: 250 }}>Nombre del Programa</TableCell>
              <TableCell sx={{ minWidth: 120 }}>Clave</TableCell>
              <TableCell align="center" sx={{ minWidth: 150 }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && programas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredProgramas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No se encontraron programas educativos
                </TableCell>
              </TableRow>
            ) : (
              filteredProgramas.map((programa) => (
                <TableRow key={programa.id}>
                  <TableCell>{programa.id}</TableCell>
                  <TableCell>{programa.nombre_programa}</TableCell>
                  <TableCell>
                    <Chip label={programa.clave_programa} variant="outlined" />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      onClick={() => handleEdit(programa)}
                      color="primary"
                      disabled={loading}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(programa)}
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

      {/* Formulario de programa educativo */}
      <ProgramaEducativoForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedPrograma(null);
        }}
        onSubmit={handleFormSubmit}
        programa={selectedPrograma}
        loading={loading}
      />

      {/* Diálogo de confirmación para eliminar */}
      <ConfirmDialog
        open={confirmOpen}
        title="Confirmar Eliminación"
        message={`¿Está seguro de que desea eliminar el programa "${programaToDelete?.nombre_programa}" con clave "${programaToDelete?.clave_programa}"? Esta acción no se puede deshacer.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setConfirmOpen(false);
          setProgramaToDelete(null);
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
    </Box>
  );
};
