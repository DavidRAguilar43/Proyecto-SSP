import React, { useState, useEffect } from 'react';
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  Button,
  Chip,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { catalogosApi } from '../../services/api';
import type { ElementosPendientes } from '../../types';

interface NotificacionesPendientesProps {
  onNavigateToCatalogos?: () => void;
}

const NotificacionesPendientes: React.FC<NotificacionesPendientesProps> = ({
  onNavigateToCatalogos
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [pendientes, setPendientes] = useState<ElementosPendientes | null>(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' 
  });

  useEffect(() => {
    loadPendientes();
    
    // Actualizar cada 5 minutos
    const interval = setInterval(loadPendientes, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadPendientes = async () => {
    try {
      const data = await catalogosApi.getPendientes();
      setPendientes(data);
    } catch (error) {
      console.error('Error loading pending items:', error);
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const activarElemento = async (tipo: 'religiones' | 'grupos_etnicos' | 'discapacidades', id: number) => {
    try {
      setLoading(true);
      
      const elementos = { [tipo]: [id] };
      await catalogosApi.activarMultiples(elementos);
      
      showSnackbar('Elemento activado exitosamente', 'success');
      loadPendientes();
      
    } catch (error: any) {
      showSnackbar(error.response?.data?.detail || 'Error al activar elemento', 'error');
    } finally {
      setLoading(false);
    }
  };

  const activarTodos = async () => {
    if (!pendientes || pendientes.total === 0) return;
    
    try {
      setLoading(true);
      
      const elementos = {
        religiones: pendientes.religiones.map(r => r.id),
        grupos_etnicos: pendientes.grupos_etnicos.map(g => g.id),
        discapacidades: pendientes.discapacidades.map(d => d.id)
      };
      
      await catalogosApi.activarMultiples(elementos);
      
      showSnackbar(`Se activaron ${pendientes.total} elementos exitosamente`, 'success');
      loadPendientes();
      handleClose();
      
    } catch (error: any) {
      showSnackbar(error.response?.data?.detail || 'Error al activar elementos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const verCatalogos = () => {
    handleClose();
    if (onNavigateToCatalogos) {
      onNavigateToCatalogos();
    }
  };

  const totalPendientes = pendientes?.total || 0;
  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        aria-label={`${totalPendientes} elementos pendientes`}
      >
        <Badge badgeContent={totalPendientes} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: { width: 350, maxHeight: 400 }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Elementos Pendientes
          </Typography>
          
          {totalPendientes === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No hay elementos pendientes de activación
            </Typography>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {totalPendientes} elemento{totalPendientes !== 1 ? 's' : ''} esperando revisión
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircleIcon />}
                  onClick={activarTodos}
                  disabled={loading}
                  fullWidth
                  sx={{ mb: 1 }}
                >
                  Activar Todos
                </Button>
                
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<VisibilityIcon />}
                  onClick={verCatalogos}
                  fullWidth
                >
                  Ver Catálogos
                </Button>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              {/* Religiones pendientes */}
              {pendientes && pendientes.religiones.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Religiones ({pendientes.religiones.length})
                  </Typography>
                  {pendientes.religiones.slice(0, 3).map((religion) => (
                    <Box key={religion.id} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ flexGrow: 1, mr: 1 }}>
                        {religion.titulo}
                      </Typography>
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => activarElemento('religiones', religion.id)}
                        disabled={loading}
                      >
                        <CheckCircleIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                  {pendientes.religiones.length > 3 && (
                    <Typography variant="caption" color="text.secondary">
                      +{pendientes.religiones.length - 3} más...
                    </Typography>
                  )}
                </Box>
              )}
              
              {/* Grupos étnicos pendientes */}
              {pendientes && pendientes.grupos_etnicos.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Grupos Étnicos ({pendientes.grupos_etnicos.length})
                  </Typography>
                  {pendientes.grupos_etnicos.slice(0, 3).map((grupo) => (
                    <Box key={grupo.id} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ flexGrow: 1, mr: 1 }}>
                        {grupo.titulo}
                      </Typography>
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => activarElemento('grupos_etnicos', grupo.id)}
                        disabled={loading}
                      >
                        <CheckCircleIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                  {pendientes.grupos_etnicos.length > 3 && (
                    <Typography variant="caption" color="text.secondary">
                      +{pendientes.grupos_etnicos.length - 3} más...
                    </Typography>
                  )}
                </Box>
              )}
              
              {/* Discapacidades pendientes */}
              {pendientes && pendientes.discapacidades.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Discapacidades ({pendientes.discapacidades.length})
                  </Typography>
                  {pendientes.discapacidades.slice(0, 3).map((discapacidad) => (
                    <Box key={discapacidad.id} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ flexGrow: 1, mr: 1 }}>
                        {discapacidad.titulo}
                      </Typography>
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => activarElemento('discapacidades', discapacidad.id)}
                        disabled={loading}
                      >
                        <CheckCircleIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                  {pendientes.discapacidades.length > 3 && (
                    <Typography variant="caption" color="text.secondary">
                      +{pendientes.discapacidades.length - 3} más...
                    </Typography>
                  )}
                </Box>
              )}
            </>
          )}
        </Box>
      </Menu>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default NotificacionesPendientes;
