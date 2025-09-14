import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Alert,
  Snackbar,
  Paper,
  Toolbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Backdrop,
  IconButton
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { personasService } from '@/services/api';
import PersonasTable from '@/components/PersonasTable';
import PersonaForm from '@/components/PersonaForm';
import ConfirmDialog from '@/components/ConfirmDialog';
import CuestionarioPsicopedagogico from '@/components/CuestionarioPsicopedagogico';
import ReportePsicopedagogico from '@/components/ReportePsicopedagogico';
import NotificacionesRegistrosPendientes from '@/components/admin/NotificacionesRegistrosPendientes';
import type { Persona, PersonaCreateAdmin } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

const PersonasPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRol, setFilterRol] = useState('');

  // Estados para modales
  const [formOpen, setFormOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [personaToDelete, setPersonaToDelete] = useState<Persona | null>(null);

  // Estados para cuestionario psicopedagógico
  const [cuestionarioOpen, setCuestionarioOpen] = useState(false);
  const [reporteOpen, setReporteOpen] = useState(false);
  const [personaCuestionario, setPersonaCuestionario] = useState<Persona | null>(null);

  // Estados para notificaciones
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  // Cargar personas al montar el componente
  useEffect(() => {
    loadPersonas();
  }, []);

  const loadPersonas = async () => {
    try {
      setLoading(true);
      const data = await personasService.getAll({
        rol: filterRol || undefined
      });
      setPersonas(data);
    } catch (error) {
      showSnackbar('Error al cargar las personas', 'error');
      console.error('Error loading personas:', error);
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Handlers para CRUD operations
  const handleCreate = () => {
    setSelectedPersona(null);
    setFormOpen(true);
  };

  const handleEdit = (persona: Persona) => {
    setSelectedPersona(persona);
    setFormOpen(true);
  };

  const handleDelete = (persona: Persona) => {
    setPersonaToDelete(persona);
    setConfirmOpen(true);
  };

  const handleBulkDelete = (ids: number[]) => {
    // Implementar eliminación masiva
    console.log('Bulk delete:', ids);
  };

  const handleFormSubmit = async (personaData: PersonaCreateAdmin) => {
    try {
      setLoading(true);

      if (selectedPersona) {
        // Actualizar persona existente
        const updatedPersona = await personasService.update(selectedPersona.id, personaData);
        showSnackbar('Persona actualizada correctamente', 'success');

        // Actualizar la persona en la lista local
        setPersonas(prevPersonas =>
          prevPersonas.map(p => p.id === selectedPersona.id ? updatedPersona : p)
        );
      } else {
        // Crear nueva persona
        const newPersona = await personasService.create(personaData);
        showSnackbar('Persona creada correctamente', 'success');

        // Agregar la nueva persona a la lista local
        setPersonas(prevPersonas => [newPersona, ...prevPersonas]);
      }

      setFormOpen(false);
      setSelectedPersona(null);

      // Limpiar filtros de búsqueda para mostrar la nueva persona
      setSearchQuery('');
      setFilterRol('');

    } catch (error: any) {
      console.error('Error saving persona:', error);
      let message = 'Error al guardar la persona';

      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          // Errores de validación de Pydantic
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
    if (!personaToDelete) return;

    try {
      setLoading(true);
      await personasService.delete(personaToDelete.id);
      showSnackbar('Persona eliminada correctamente', 'success');

      // Eliminar la persona de la lista local
      setPersonas(prevPersonas =>
        prevPersonas.filter(p => p.id !== personaToDelete.id)
      );

      setConfirmOpen(false);
      setPersonaToDelete(null);
    } catch (error: any) {
      console.error('Error deleting persona:', error);
      let message = 'Error al eliminar la persona';

      if (error.response?.status === 403) {
        message = 'No tiene permisos para eliminar personas';
      } else if (error.response?.data?.detail) {
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

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadPersonas();
      return;
    }

    try {
      setLoading(true);
      const data = await personasService.search(searchQuery);
      setPersonas(data);
    } catch (error) {
      showSnackbar('Error al buscar personas', 'error');
      console.error('Error searching personas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Funciones para cuestionario psicopedagógico
  const handleCuestionario = (persona: Persona) => {
    setPersonaCuestionario(persona);
    setCuestionarioOpen(true);
  };

  const handleVerReporte = (persona: Persona) => {
    setPersonaCuestionario(persona);
    setReporteOpen(true);
  };

  const handleCuestionarioSuccess = () => {
    showSnackbar('Cuestionario completado exitosamente', 'success');
    // Recargar personas para actualizar el estado
    loadPersonas();
  };

  // Filtrar personas localmente
  const filteredPersonas = personas.filter(persona => {
    const matchesSearch = !searchQuery ||
      persona.correo_institucional.toLowerCase().includes(searchQuery.toLowerCase()) ||
      persona.matricula?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      persona.celular?.includes(searchQuery);

    const matchesRol = !filterRol || persona.rol === filterRol;

    return matchesSearch && matchesRol;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" alignItems="center" mb={2}>
        <IconButton
          onClick={() => navigate('/dashboard')}
          sx={{ mr: 2 }}
          aria-label="Regresar al dashboard"
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Gestión de Personas
        </Typography>
      </Box>

      {/* Barra de herramientas */}
      <Paper sx={{ mb: 2 }}>
        <Toolbar>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
            <TextField
              size="small"
              placeholder="Buscar por correo, matrícula o celular..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 300 }}
            />

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Rol</InputLabel>
              <Select
                value={filterRol}
                onChange={(e) => setFilterRol(e.target.value)}
                label="Rol"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="personal">Personal</MenuItem>
                <MenuItem value="docente">Docente</MenuItem>
                <MenuItem value="alumno">Alumno</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              onClick={handleSearch}
              startIcon={<SearchIcon />}
            >
              Buscar
            </Button>
          </Box>

          {/* Notificaciones para administradores */}
          {user?.rol === 'admin' && (
            <NotificacionesRegistrosPendientes />
          )}

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
          >
            Nueva Persona
          </Button>
        </Toolbar>
      </Paper>

      {/* Tabla de personas */}
      <PersonasTable
        personas={filteredPersonas}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBulkDelete={handleBulkDelete}
        onCuestionario={handleCuestionario}
        onVerReporte={handleVerReporte}
        currentUserRole={user?.rol}
      />

      {/* Formulario de persona */}
      <PersonaForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedPersona(null);
        }}
        onSubmit={handleFormSubmit}
        persona={selectedPersona}
        loading={loading}
      />

      {/* Diálogo de confirmación para eliminar */}
      <ConfirmDialog
        open={confirmOpen}
        title="Confirmar Eliminación"
        message={`¿Está seguro de que desea eliminar a la persona con correo "${personaToDelete?.correo_institucional}"${personaToDelete?.matricula ? ` y matrícula "${personaToDelete.matricula}"` : ''}? Esta acción eliminará permanentemente todos los datos asociados y no se puede deshacer.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setConfirmOpen(false);
          setPersonaToDelete(null);
        }}
        loading={loading}
        confirmText="Sí, Eliminar"
        cancelText="Cancelar"
        severity="error"
      />

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.severity === 'success' ? 4000 : 6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{
            width: '100%',
            '& .MuiAlert-message': {
              fontSize: '1rem',
              fontWeight: snackbar.severity === 'success' ? 'bold' : 'normal'
            }
          }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Cuestionario Psicopedagógico */}
      <CuestionarioPsicopedagogico
        open={cuestionarioOpen}
        onClose={() => {
          setCuestionarioOpen(false);
          setPersonaCuestionario(null);
        }}
        personaId={personaCuestionario?.id || 0}
        onSuccess={handleCuestionarioSuccess}
      />

      {/* Reporte Psicopedagógico */}
      <ReportePsicopedagogico
        open={reporteOpen}
        onClose={() => {
          setReporteOpen(false);
          setPersonaCuestionario(null);
        }}
        personaId={personaCuestionario?.id || 0}
        personaNombre={personaCuestionario?.correo_institucional}
      />

      {/* Indicador de carga global */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  );
};

export default PersonasPage;
