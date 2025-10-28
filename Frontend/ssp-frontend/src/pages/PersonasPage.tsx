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
  AppBar
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { personasService } from '../services/api';
import PersonasTable from '../components/PersonasTable';
import PersonaForm from '../components/PersonaForm';
import ConfirmDialog from '../components/ConfirmDialog';
import CuestionarioPsicopedagogico from '../components/CuestionarioPsicopedagogico';
import ReportePsicopedagogico from '../components/ReportePsicopedagogico';
import NotificacionesRegistrosPendientes from '../components/admin/NotificacionesRegistrosPendientes';
import type { Persona, PersonaCreate } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { logAuthDiagnostic, enableRequestDebugging } from '../utils/authDiagnostic';
import '../utils/testDeletePersonal'; // Importar funciones de prueba para consola

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

  const handleBulkDelete = async (ids: number[]) => {
    try {
      setLoading(true);
      await personasService.bulkDelete(ids);

      // Actualizar la lista de personas
      setPersonas(prev => prev.filter(persona => !ids.includes(persona.id)));
      showSnackbar(`${ids.length} persona(s) eliminada(s) exitosamente`, 'success');
    } catch (error: any) {
      console.error('Error en bulk delete:', error);
      let message = 'Error al eliminar las personas seleccionadas';

      if (error.response?.status === 403) {
        message = 'No tiene permisos para eliminar personas';
      } else if (error.response?.data?.detail) {
        message = error.response.data.detail;
      }

      showSnackbar(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (personaData: PersonaCreate) => {
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

      // 🔍 DIAGNÓSTICO DETALLADO ANTES DE ELIMINAR
      console.group(`🗑️ INTENTANDO ELIMINAR PERSONA: ${personaToDelete.correo_institucional} (ID: ${personaToDelete.id})`);
      console.log('👤 Persona a eliminar:', personaToDelete);
      console.log('🔑 Usuario actual:', user);

      // Ejecutar diagnóstico de autenticación
      await logAuthDiagnostic();

      // Activar debugging de requests temporalmente
      const disableDebugging = enableRequestDebugging();

      try {
        await personasService.delete(personaToDelete.id);
        showSnackbar('Persona eliminada correctamente', 'success');

        // Eliminar la persona de la lista local
        setPersonas(prevPersonas =>
          prevPersonas.filter(p => p.id !== personaToDelete.id)
        );

        setConfirmOpen(false);
        setPersonaToDelete(null);
        console.log('✅ ELIMINACIÓN EXITOSA');
      } finally {
        // Desactivar debugging
        disableDebugging();
        console.groupEnd();
      }

    } catch (error: any) {
      console.error('❌ ERROR AL ELIMINAR PERSONA:', error);

      // Diagnóstico detallado del error
      console.group('🔍 ANÁLISIS DEL ERROR');
      console.log('Status Code:', error.response?.status);
      console.log('Response Data:', error.response?.data);
      console.log('Response Headers:', error.response?.headers);
      console.log('Request Config:', error.config);
      console.groupEnd();

      let message = 'Error al eliminar la persona';

      if (error.response?.status === 403) {
        message = 'No tiene permisos para eliminar personas';
        console.warn('🚫 ERROR 403: Verificar token de autenticación y permisos de usuario');
      } else if (error.response?.status === 401) {
        message = 'Sesión expirada. Por favor, inicie sesión nuevamente';
        console.warn('🔐 ERROR 401: Token inválido o expirado');
      } else if (error.response?.status === 404) {
        message = 'La persona no fue encontrada';
      } else if (error.response?.status === 500) {
        message = 'Error interno del servidor. Contacte al administrador';
        console.error('🔥 ERROR 500: Problema en el servidor backend');
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
            Gestión de Personas
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
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
              sx={{ minWidth: 320, flexGrow: 1, maxWidth: 400 }}
            />

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Rol</InputLabel>
              <Select
                value={filterRol}
                onChange={(e) => setFilterRol(e.target.value)}
                label="Rol"
                MenuProps={{
                  PaperProps: {
                    sx: { maxHeight: 300 }
                  }
                }}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="coordinador">Coordinador</MenuItem>
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

          {/* Botón de diagnóstico para debugging (solo para admin) */}
          {user?.rol === 'admin' && (
            <Button
              variant="outlined"
              color="info"
              onClick={async () => {
                console.clear();
                await logAuthDiagnostic();
                console.log('🔧 Para activar debugging de requests, ejecuta en consola: enableRequestDebugging()');
              }}
              sx={{ ml: 1 }}
            >
              🔍 Diagnóstico Auth
            </Button>
          )}
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
    </Box>
  );
};

export default PersonasPage;
