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
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { notificacionesApi } from '../../services/api';
import type { NotificacionRegistro, NotificacionesResponse } from '../../types';

interface NotificacionesRegistrosPendientesProps {
  onNavigateToPersonas?: () => void;
}

const NotificacionesRegistrosPendientes: React.FC<NotificacionesRegistrosPendientesProps> = ({
  onNavigateToPersonas
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificaciones, setNotificaciones] = useState<NotificacionesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' 
  });

  // Estados para el diálogo de procesamiento
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedNotificacion, setSelectedNotificacion] = useState<NotificacionRegistro | null>(null);
  const [aprobar, setAprobar] = useState(true);
  const [observaciones, setObservaciones] = useState('');

  useEffect(() => {
    loadNotificaciones();
    
    // Actualizar cada 2 minutos
    const interval = setInterval(loadNotificaciones, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadNotificaciones = async () => {
    try {
      const data = await notificacionesApi.getNotificacionesRegistros({
        solo_pendientes: true,
        limit: 10
      });
      setNotificaciones(data);
    } catch (error: any) {
      console.error('Error loading notificaciones:', error);
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const abrirDialogoProcesamiento = (notificacion: NotificacionRegistro, aprobar: boolean) => {
    setSelectedNotificacion(notificacion);
    setAprobar(aprobar);
    setObservaciones('');
    setDialogOpen(true);
    handleClose();
  };

  const cerrarDialogoProcesamiento = () => {
    setDialogOpen(false);
    setSelectedNotificacion(null);
    setObservaciones('');
  };

  const procesarNotificacion = async () => {
    if (!selectedNotificacion) return;
    
    try {
      setLoading(true);
      
      await notificacionesApi.procesarNotificacion(selectedNotificacion.id, {
        aprobada: aprobar,
        observaciones_admin: observaciones.trim() || undefined
      });
      
      const accion = aprobar ? 'aprobado' : 'rechazado';
      showSnackbar(`Registro ${accion} exitosamente`, 'success');
      
      loadNotificaciones();
      cerrarDialogoProcesamiento();
      
    } catch (error: any) {
      showSnackbar(error.response?.data?.detail || 'Error al procesar la notificación', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const verPersonas = () => {
    handleClose();
    if (onNavigateToPersonas) {
      onNavigateToPersonas();
    }
  };

  const totalPendientes = notificaciones?.pendientes || 0;
  const open = Boolean(anchorEl);

  const getTipoUsuarioTexto = (tipo: string) => {
    switch (tipo) {
      case 'registro_personal_pendiente':
        return 'Personal';
      case 'registro_docente_pendiente':
        return 'Docente';
      default:
        return 'Usuario';
    }
  };

  const getTipoUsuarioColor = (tipo: string) => {
    switch (tipo) {
      case 'registro_personal_pendiente':
        return 'primary';
      case 'registro_docente_pendiente':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        aria-label={`${totalPendientes} registros pendientes`}
      >
        <Badge badgeContent={totalPendientes} color="error">
          <PersonAddIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: { width: 400, maxHeight: 500 }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Registros Pendientes
          </Typography>
          
          {totalPendientes === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No hay registros pendientes de aprobación
            </Typography>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {totalPendientes} registro{totalPendientes !== 1 ? 's' : ''} esperando aprobación
              </Typography>
              
              <Button
                size="small"
                variant="outlined"
                startIcon={<VisibilityIcon />}
                onClick={verPersonas}
                fullWidth
                sx={{ mb: 2 }}
              >
                Ver Gestión de Personas
              </Button>
              
              <Divider sx={{ mb: 2 }} />
              
              {/* Lista de notificaciones */}
              <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                {notificaciones?.notificaciones.slice(0, 5).map((notif) => (
                  <Box key={notif.id} sx={{ mb: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PersonIcon sx={{ mr: 1, fontSize: 16 }} />
                      <Chip 
                        label={getTipoUsuarioTexto(notif.tipo_notificacion)}
                        size="small"
                        color={getTipoUsuarioColor(notif.tipo_notificacion) as any}
                        sx={{ mr: 1 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(notif.fecha_creacion).toLocaleDateString()}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {notif.usuario_solicitante_email}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => abrirDialogoProcesamiento(notif, true)}
                        sx={{ fontSize: '0.7rem', py: 0.5 }}
                      >
                        Aprobar
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        startIcon={<CancelIcon />}
                        onClick={() => abrirDialogoProcesamiento(notif, false)}
                        sx={{ fontSize: '0.7rem', py: 0.5 }}
                      >
                        Rechazar
                      </Button>
                    </Box>
                  </Box>
                ))}
                
                {totalPendientes > 5 && (
                  <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', display: 'block' }}>
                    +{totalPendientes - 5} más...
                  </Typography>
                )}
              </Box>
            </>
          )}
        </Box>
      </Menu>

      {/* Diálogo de procesamiento */}
      <Dialog open={dialogOpen} onClose={cerrarDialogoProcesamiento} maxWidth="sm" fullWidth>
        <DialogTitle>
          {aprobar ? 'Aprobar' : 'Rechazar'} Registro
        </DialogTitle>
        <DialogContent>
          {selectedNotificacion && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Usuario: {selectedNotificacion.usuario_solicitante_email}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Tipo: {getTipoUsuarioTexto(selectedNotificacion.tipo_notificacion)}
              </Typography>
            </Box>
          )}
          
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Observaciones (opcional)"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder={aprobar ? 
              "Comentarios sobre la aprobación..." : 
              "Motivo del rechazo..."
            }
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogoProcesamiento}>
            Cancelar
          </Button>
          <Button 
            onClick={procesarNotificacion}
            variant="contained"
            color={aprobar ? 'success' : 'error'}
            disabled={loading}
          >
            {loading ? 'Procesando...' : (aprobar ? 'Aprobar' : 'Rechazar')}
          </Button>
        </DialogActions>
      </Dialog>

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

export default NotificacionesRegistrosPendientes;
