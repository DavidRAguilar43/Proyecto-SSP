import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Container,
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  AccountCircle,
  ExitToApp as LogoutIcon
} from '@mui/icons-material';
import AlumnoDashboard from '../components/AlumnoDashboard';
import AlumnoPerfilForm from '../components/AlumnoPerfilForm';
import type { Persona } from '../types/index';
import { personasApi } from '@/services/api';
import { AuthContext } from '@/contexts/AuthContext';

interface AlumnoPageProps {
  user?: Persona;
  onLogout?: () => void;
}

const AlumnoPage = ({ user: propUser, onLogout: propOnLogout }: AlumnoPageProps) => {
  const { user: contextUser, logout: contextLogout } = useContext(AuthContext);

  // Usar el usuario del contexto si no se pasa como prop
  const initialUser = propUser || contextUser;
  const onLogout = propOnLogout || contextLogout;

  const [user, setUser] = useState<Persona | null>(initialUser);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Si no hay usuario, mostrar loading o redirigir
  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  const [editProfileOpen, setEditProfileOpen] = useState(false);
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

  // Manejar menú de usuario
  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Manejar actualización de perfil
  const handleUpdateProfile = async (profileData: any) => {
    try {
      setLoading(true);
      const updatedUser = await personasApi.updateMiPerfil(profileData);
      setUser(updatedUser);
      setEditProfileOpen(false);
      showSnackbar('Perfil actualizado exitosamente', 'success');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      let errorMessage = 'Error al actualizar el perfil';

      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          // Si es un array de errores de validación, tomar el primer mensaje
          errorMessage = error.response.data.detail[0]?.msg || errorMessage;
        } else if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        }
      }

      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* App Bar */}
      <AppBar position="static" sx={{ bgcolor: 'primary.main' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Sistema SSP - Portal de Usuario
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ mr: 2 }}>
              {user.correo_institucional.split('@')[0]}
            </Typography>
            
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <AccountCircle />
            </IconButton>
            
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={() => {
                handleClose();
                setEditProfileOpen(true);
              }}>
                Editar Perfil
              </MenuItem>
              <MenuItem onClick={() => {
                handleClose();
                onLogout();
              }}>
                <LogoutIcon sx={{ mr: 1 }} />
                Cerrar Sesión
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Contenido Principal */}
      <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <AlumnoDashboard 
            user={user} 
            onEditProfile={() => setEditProfileOpen(true)}
          />
        )}
      </Container>

      {/* Formulario de Edición de Perfil */}
      <AlumnoPerfilForm
        open={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        onSubmit={handleUpdateProfile}
        persona={user}
        loading={loading}
      />

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

export default AlumnoPage;
