import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Alert,
  Breadcrumbs,
  Link,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Assignment as AssignmentIcon,
  Home as HomeIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import CuestionarioForm from '@/components/cuestionarios/CuestionarioForm';
import { cuestionariosAdminApi } from '@/services/api';
import { useNotification } from '@/hooks/useNotification';
import type { CuestionarioAdmin, CuestionarioAdminUpdate } from '@/types/cuestionarios';

/**
 * Página para editar un cuestionario administrativo existente
 */
const EditarCuestionarioPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showNotification } = useNotification();

  const [cuestionario, setCuestionario] = useState<CuestionarioAdmin | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar cuestionario
  useEffect(() => {
    const cargarCuestionario = async () => {
      if (!id) {
        setError('ID de cuestionario no válido');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const cuestionarioData = await cuestionariosAdminApi.getById(id);
        setCuestionario(cuestionarioData);
      } catch (error: any) {
        console.error('Error al cargar cuestionario:', error);
        const errorMessage = error.response?.data?.detail || 'Error al cargar el cuestionario';
        setError(errorMessage);
        showNotification(errorMessage, 'error');
      } finally {
        setLoading(false);
      }
    };

    cargarCuestionario();
  }, [id, showNotification]);

  const handleSubmit = async (data: CuestionarioAdminUpdate) => {
    if (!id || !cuestionario) return;

    try {
      setSaving(true);
      setError(null);

      // Validar datos antes de enviar
      if (data.titulo && !data.titulo.trim()) {
        throw new Error('El título no puede estar vacío');
      }

      if (data.descripcion && !data.descripcion.trim()) {
        throw new Error('La descripción no puede estar vacía');
      }

      if (data.preguntas && data.preguntas.length === 0) {
        throw new Error('Debe tener al menos una pregunta');
      }

      if (data.tipos_usuario_asignados && data.tipos_usuario_asignados.length === 0) {
        throw new Error('Debe asignar el cuestionario a al menos un tipo de usuario');
      }

      // Validar preguntas si se proporcionan
      if (data.preguntas) {
        for (const pregunta of data.preguntas) {
          if (!pregunta.texto.trim()) {
            throw new Error('Todas las preguntas deben tener texto');
          }

          // Validaciones específicas por tipo de pregunta
          if (['opcion_multiple', 'select', 'checkbox', 'radio_button'].includes(pregunta.tipo)) {
            if (!pregunta.configuracion.opciones || pregunta.configuracion.opciones.length < 2) {
              throw new Error(`La pregunta "${pregunta.texto}" debe tener al menos 2 opciones`);
            }

            const opcionesVacias = pregunta.configuracion.opciones.filter(op => !op.trim()).length;
            if (opcionesVacias > 0) {
              throw new Error(`La pregunta "${pregunta.texto}" tiene opciones vacías`);
            }
          }

          if (pregunta.tipo === 'escala_likert') {
            if (!pregunta.configuracion.puntos_escala || pregunta.configuracion.puntos_escala < 3) {
              throw new Error(`La pregunta "${pregunta.texto}" debe tener al menos 3 puntos en la escala`);
            }
          }
        }
      }

      // Actualizar el cuestionario
      const cuestionarioActualizado = await cuestionariosAdminApi.update(id, data);
      setCuestionario(cuestionarioActualizado);
      
      showNotification(
        `Cuestionario "${cuestionarioActualizado.titulo}" actualizado exitosamente`,
        'success'
      );

      // Redirigir según el estado
      if (data.estado === 'borrador') {
        // Permanecer en la página de edición si es borrador
        showNotification('Borrador guardado', 'info');
      } else {
        navigate('/admin/cuestionarios');
      }

    } catch (error: any) {
      console.error('Error al actualizar cuestionario:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Error al actualizar el cuestionario';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/cuestionarios');
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activo': return 'success';
      case 'inactivo': return 'default';
      case 'borrador': return 'warning';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !cuestionario) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {error}
          <br />
          <Link onClick={() => navigate('/admin/cuestionarios')} sx={{ cursor: 'pointer' }}>
            Volver a la lista de cuestionarios
          </Link>
        </Alert>
      </Box>
    );
  }

  if (!cuestionario) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Cuestionario no encontrado.
          <br />
          <Link onClick={() => navigate('/admin/cuestionarios')} sx={{ cursor: 'pointer' }}>
            Volver a la lista de cuestionarios
          </Link>
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            onClick={handleCancel}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <EditIcon sx={{ mr: 2 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="div">
              Editar Cuestionario
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {cuestionario.titulo}
            </Typography>
          </Box>
          <Chip
            label={cuestionario.estado}
            color={getEstadoColor(cuestionario.estado)}
            size="small"
          />
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link
            underline="hover"
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            color="inherit"
            onClick={() => navigate('/dashboard')}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Dashboard
          </Link>
          <Link
            underline="hover"
            color="inherit"
            sx={{ cursor: 'pointer' }}
            onClick={() => navigate('/admin/cuestionarios')}
          >
            Cuestionarios
          </Link>
          <Typography color="text.primary">
            Editar: {cuestionario.titulo}
          </Typography>
        </Breadcrumbs>

        {/* Error general */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Información del cuestionario */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Información del cuestionario:</strong>
          </Typography>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>Creado: {new Date(cuestionario.fecha_creacion).toLocaleDateString('es-ES')}</li>
            <li>Estado actual: {cuestionario.estado}</li>
            <li>Preguntas: {cuestionario.total_preguntas}</li>
            <li>Tipos de usuario asignados: {cuestionario.tipos_usuario_asignados.join(', ')}</li>
            {cuestionario.total_respuestas !== undefined && (
              <li>Respuestas recibidas: {cuestionario.total_respuestas}</li>
            )}
          </ul>
        </Alert>

        {/* Advertencia si hay respuestas */}
        {cuestionario.total_respuestas && cuestionario.total_respuestas > 0 && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>¡Atención!</strong> Este cuestionario ya tiene {cuestionario.total_respuestas} respuesta(s).
              Los cambios en las preguntas pueden afectar la consistencia de los datos.
              Se recomienda crear una nueva versión del cuestionario para cambios importantes.
            </Typography>
          </Alert>
        )}

        {/* Formulario principal */}
        <CuestionarioForm
          mode="edit"
          cuestionario={cuestionario}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={saving}
        />
      </Box>
    </Box>
  );
};

export default EditarCuestionarioPage;
