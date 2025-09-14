import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Snackbar,
  Alert,
  AppBar,
  Toolbar
} from '@mui/material';
import {
  School as SchoolIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import RegistroUsuarioForm from '../components/RegistroUsuarioForm';
import type { PersonaCreate } from '../types/index';
import { personasApi } from '@/services/api';

const RegistroAlumnoPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  // Mostrar notificación
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  // Manejar registro de usuario
  const handleRegistroUsuario = async (userData: PersonaCreate) => {
    try {
      setLoading(true);
      await personasApi.registroAlumno(userData);
      showSnackbar('Registro exitoso. Redirigiendo al login...', 'success');

      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (error: any) {
      console.error('Error en registro:', error);

      let errorMessage = 'Error al procesar el registro';

      if (error.response?.data) {
        const errorData = error.response.data;

        // Si es un error de validación (422), formatear los errores
        if (error.response.status === 422 && Array.isArray(errorData.detail)) {
          const validationErrors = errorData.detail.map((err: any) => {
            const field = err.loc ? err.loc.join('.') : 'campo';
            return `${field}: ${err.msg}`;
          }).join(', ');
          errorMessage = `Errores de validación: ${validationErrors}`;
        }
        // Si es un error con detail string
        else if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        }
        // Si es un error con message
        else if (typeof errorData.message === 'string') {
          errorMessage = errorData.message;
        }
      }

      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* App Bar */}
      <AppBar position="static" sx={{ bgcolor: 'primary.main' }}>
        <Toolbar>
          <Button
            color="inherit"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/login')}
            sx={{ mr: 2 }}
          >
            Volver al Login
          </Button>
          
          <SchoolIcon sx={{ mr: 2 }} />
          
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Sistema SSP - Registro de datos
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Contenido Principal */}
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <SchoolIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" component="h1" gutterBottom>
              Registro de datos
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Complete el formulario para crear su cuenta en el Sistema de Seguimiento Psicopedagógico
            </Typography>
          </Box>

          <RegistroUsuarioForm
            open={true}
            onClose={() => navigate('/login')}
            onSubmit={handleRegistroUsuario}
            loading={loading}
          />
        </Paper>
      </Container>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RegistroAlumnoPage;
