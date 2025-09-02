import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  AppBar,
  Toolbar,
  Button,
  Paper,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { AuthContext } from '@/contexts/AuthContext';
import CatalogosAdmin from '@/components/admin/CatalogosAdmin';
import NotificacionesPendientes from '@/components/admin/NotificacionesPendientes';

const CatalogosPage: React.FC = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Verificar que el usuario sea administrador
  if (user?.rol !== 'admin') {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            Acceso Denegado
          </Typography>
          <Typography variant="body1" color="text.secondary">
            No tienes permisos para acceder a esta sección.
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/dashboard')}
            sx={{ mt: 2 }}
          >
            Volver al Dashboard
          </Button>
        </Paper>
      </Container>
    );
  }

  const handleNavigateToCatalogos = () => {
    // Ya estamos en la página de catálogos, no necesitamos navegar
    console.log('Ya estamos en la página de catálogos');
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
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
            Administración de Catálogos
          </Typography>
          
          {/* Notificaciones de elementos pendientes */}
          <NotificacionesPendientes onNavigateToCatalogos={handleNavigateToCatalogos} />
          
          <Button color="inherit" onClick={logout} sx={{ ml: 2 }}>
            Cerrar Sesión
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
          <Link
            color="inherit"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate('/dashboard');
            }}
            sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Dashboard
          </Link>
          <Typography color="text.primary">Catálogos</Typography>
        </Breadcrumbs>

        {/* Información del usuario */}
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Administración de Catálogos
          </Typography>
          
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Gestiona los catálogos de religiones, grupos étnicos y discapacidades del sistema.
          </Typography>

          {user && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Usuario:</strong> {user.correo_institucional} ({user.rol})
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Componente principal de administración de catálogos */}
        <CatalogosAdmin />
      </Container>
    </Box>
  );
};

export default CatalogosPage;
