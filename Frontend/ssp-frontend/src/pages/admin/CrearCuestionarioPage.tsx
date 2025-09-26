import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Alert,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Assignment as AssignmentIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import CuestionarioForm from '@/components/cuestionarios/CuestionarioForm';
import { cuestionariosAdminApi } from '@/services/api';
import { useNotification } from '@/hooks/useNotification';
import type { CuestionarioAdminCreate } from '@/types/cuestionarios';

/**
 * Página para crear un nuevo cuestionario administrativo
 */
const CrearCuestionarioPage: React.FC = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CuestionarioAdminCreate) => {
    try {
      setLoading(true);
      setError(null);

      // Validar datos antes de enviar
      if (!data.titulo.trim()) {
        throw new Error('El título es obligatorio');
      }

      if (!data.descripcion.trim()) {
        throw new Error('La descripción es obligatoria');
      }

      if (data.preguntas.length === 0) {
        throw new Error('Debe agregar al menos una pregunta');
      }

      if (data.tipos_usuario_asignados.length === 0) {
        throw new Error('Debe asignar el cuestionario a al menos un tipo de usuario');
      }

      // Validar preguntas
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

      // Crear el cuestionario
      const cuestionarioCreado = await cuestionariosAdminApi.create(data);
      
      showNotification(
        `Cuestionario "${data.titulo}" creado exitosamente`,
        'success'
      );

      // Redirigir según el estado
      if (data.estado === 'borrador') {
        navigate(`/admin/cuestionarios/editar/${cuestionarioCreado.id}`);
      } else {
        navigate('/admin/cuestionarios');
      }

    } catch (error: any) {
      console.error('Error al crear cuestionario:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Error al crear el cuestionario';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/cuestionarios');
  };

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
          <AssignmentIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Crear Nuevo Cuestionario
          </Typography>
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
          <Typography color="text.primary">Crear Nuevo</Typography>
        </Breadcrumbs>

        {/* Error general */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Información de ayuda */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Consejos para crear un buen cuestionario:</strong>
          </Typography>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>Use títulos claros y descriptivos</li>
            <li>Escriba preguntas específicas y fáciles de entender</li>
            <li>Ordene las preguntas de manera lógica</li>
            <li>Use diferentes tipos de preguntas para mantener el interés</li>
            <li>Marque como obligatorias solo las preguntas esenciales</li>
            <li>Pruebe el cuestionario con la vista previa antes de publicarlo</li>
          </ul>
        </Alert>

        {/* Formulario principal */}
        <CuestionarioForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      </Box>
    </Box>
  );
};

export default CrearCuestionarioPage;
