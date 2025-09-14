import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Chip,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  CircularProgress,
  Badge,
  CardActions
} from '@mui/material';
import {
  Person as PersonIcon,
  School as SchoolIcon,
  Group as GroupIcon,
  Psychology as PsychologyIcon,
  Edit as EditIcon,
  Info as InfoIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  CalendarToday as CalendarIcon,
  PersonAdd as PersonAddIcon,
  Schedule as ScheduleIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import type { Persona } from '../types/index';
import CuestionarioPsicopedagogico from './CuestionarioPsicopedagogico';
import SolicitudCitaForm from './SolicitudCitaForm';
import MisCitas from './MisCitas';
import NotificacionesCitas from './NotificacionesCitas';
import AppointmentRequestModal from './AppointmentRequestModal';
import { api, citasApi } from '@/services/api';
import { useNotification } from '@/hooks/useNotification';

interface AlumnoDashboardProps {
  user: Persona;
  onEditProfile: () => void;
}

const AlumnoDashboard = ({ user, onEditProfile }: AlumnoDashboardProps) => {
  const { notifySuccess, notifyError, notifyWarning } = useNotification();
  const [loading, setLoading] = useState(false);
  const [cuestionarioOpen, setCuestionarioOpen] = useState(false);
  const [cuestionarioCompletado, setCuestionarioCompletado] = useState(false);
  const [loadingCuestionario, setLoadingCuestionario] = useState(true);

  // Estados para citas
  const [solicitudCitaOpen, setSolicitudCitaOpen] = useState(false);
  const [misCitasOpen, setMisCitasOpen] = useState(false);
  const [loadingCita, setLoadingCita] = useState(false);
  const [notificacionesOpen, setNotificacionesOpen] = useState(false);
  const [notificacionesBadge, setNotificacionesBadge] = useState(0);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);

  // Función para obtener las iniciales del nombre
  const getInitials = (correo: string) => {
    const name = correo.split('@')[0];
    return name.substring(0, 2).toUpperCase();
  };

  // Función para formatear la información del usuario
  const formatUserInfo = () => {
    const info = [];

    if (user.edad) info.push(`${user.edad} años`);
    if (user.semestre) info.push(`Semestre ${user.semestre}`);
    if (user.matricula) info.push(`Matrícula: ${user.matricula}`);

    return info.join(' • ');
  };

  // Verificar el estado del cuestionario psicopedagógico
  useEffect(() => {
    const verificarCuestionario = async () => {
      try {
        setLoadingCuestionario(true);
        const response = await api.get(`/cuestionario-psicopedagogico/estudiante/${user.id}`);
        setCuestionarioCompletado(response.data.completado);
      } catch (error) {
        console.error('Error verificando cuestionario:', error);
        setCuestionarioCompletado(false);
      } finally {
        setLoadingCuestionario(false);
      }
    };

    if (user.id) {
      verificarCuestionario();
    }
  }, [user.id]);

  // Manejar éxito del cuestionario
  const handleCuestionarioSuccess = () => {
    setCuestionarioCompletado(true);
    setCuestionarioOpen(false);
    // Mostrar modal de solicitud de cita después de completar cuestionario
    setTimeout(() => {
      setShowAppointmentModal(true);
    }, 1000);
  };

  // Manejar solicitud de cita
  const handleSolicitudCita = async (citaData: any) => {
    try {
      setLoadingCita(true);
      await citasApi.solicitar(citaData);
      setSolicitudCitaOpen(false);
      notifySuccess(
        '¡Solicitud de cita enviada exitosamente!',
        'El personal revisará tu solicitud y te contactará pronto.'
      );
    } catch (error: any) {
      console.error('Error solicitando cita:', error);
      notifyError(
        'Error al solicitar la cita',
        error.response?.data?.detail || 'Por favor, inténtalo de nuevo más tarde.'
      );
    } finally {
      setLoadingCita(false);
    }
  };

  // Manejar solicitud de cita desde el modal de cuestionario completado
  const handleAppointmentRequest = () => {
    setShowAppointmentModal(false);
    setSolicitudCitaOpen(true);
  };

  // Cerrar modal de solicitud de cita
  const handleCloseAppointmentModal = () => {
    setShowAppointmentModal(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header del Dashboard */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Mi Perfil Estudiantil
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Bienvenido a tu espacio personal en el Sistema de Seguimiento Psicopedagógico
        </Typography>
      </Box>

      <Grid container spacing={3}>

        {/* Tarjeta de Perfil Principal */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Avatar
                sx={{ 
                  width: 80, 
                  height: 80, 
                  mx: 'auto', 
                  mb: 2,
                  bgcolor: 'primary.main',
                  fontSize: '1.5rem'
                }}
              >
                {getInitials(user.correo_institucional)}
              </Avatar>
              
              <Typography variant="h6" gutterBottom>
                {user.correo_institucional.split('@')[0]}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {user.correo_institucional}
              </Typography>
              
              <Typography variant="body2" sx={{ mb: 2 }}>
                {formatUserInfo()}
              </Typography>
              
              <Chip 
                label="Estudiante" 
                color="primary" 
                variant="outlined"
                sx={{ mb: 2 }}
              />
              
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={onEditProfile}
                  fullWidth
                >
                  Editar Perfil
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Información Académica */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <SchoolIcon sx={{ mr: 1 }} />
                Información Académica
              </Typography>
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Matrícula
                    </Typography>
                    <Typography variant="body1">
                      {user.matricula || 'No asignada'}
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Semestre Actual
                    </Typography>
                    <Typography variant="body1">
                      {user.semestre ? `${user.semestre}° Semestre` : 'No especificado'}
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Programa Educativo
                    </Typography>
                    <Typography variant="body1">
                      {user.programas && user.programas.length > 0
                        ? user.programas[0].nombre_programa
                        : 'Pendiente de asignación'}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Grupo
                    </Typography>
                    <Typography variant="body1">
                      {user.grupos && user.grupos.length > 0
                        ? user.grupos[0].nombre_grupo
                        : 'Pendiente de asignación'}
                    </Typography>
                  </Paper>
                </Grid>

                {user.cohorte && (
                  <Grid size={{ xs: 12 }}>
                    <Paper sx={{ p: 2, bgcolor: 'primary.50' }}>
                      <Typography variant="subtitle2" color="primary.main">
                        Cohorte
                      </Typography>
                      <Typography variant="body1">
                        {user.cohorte.nombre} - {user.cohorte.descripcion}
                      </Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Cuestionario Psicopedagógico */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <PsychologyIcon sx={{ mr: 1, color: 'primary.main' }} />
                Cuestionario Psicopedagógico
              </Typography>

              {loadingCuestionario ? (
                <Box display="flex" justifyContent="center" alignItems="center" py={2}>
                  <CircularProgress size={24} />
                  <Typography variant="body2" sx={{ ml: 2 }}>
                    Verificando estado del cuestionario...
                  </Typography>
                </Box>
              ) : cuestionarioCompletado ? (
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    ✅ Has completado el cuestionario psicopedagógico exitosamente.
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    El personal académico revisará tus respuestas y te contactará si es necesario.
                  </Typography>
                </Alert>
              ) : (
                <Box>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      📋 El cuestionario psicopedagógico nos ayuda a entender mejor tus necesidades académicas y brindarte el apoyo adecuado.
                    </Typography>
                  </Alert>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    • Solo toma unos minutos completarlo
                    • Tus respuestas son confidenciales
                    • Te ayudará a recibir apoyo personalizado
                  </Typography>
                </Box>
              )}
            </CardContent>

            {!loadingCuestionario && !cuestionarioCompletado && (
              <CardActions sx={{ px: 2, pb: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AssignmentIcon />}
                  onClick={() => setCuestionarioOpen(true)}
                  size="large"
                  fullWidth
                >
                  Completar Cuestionario Psicopedagógico
                </Button>
              </CardActions>
            )}

            {!loadingCuestionario && cuestionarioCompletado && (
              <CardActions sx={{ px: 2, pb: 2 }}>
                <Button
                  variant="outlined"
                  color="success"
                  startIcon={<CheckCircleIcon />}
                  disabled
                  size="large"
                  fullWidth
                >
                  Cuestionario Completado
                </Button>
              </CardActions>
            )}
          </Card>

          {/* Citas con Personal */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <CalendarIcon sx={{ mr: 1, color: 'secondary.main' }} />
                Citas con Personal
              </Typography>

              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  🗓️ Solicita citas con el personal para recibir apoyo académico, psicológico o resolver consultas generales.
                </Typography>
              </Alert>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                • Apoyo psicológico para manejo del estrés y ansiedad
                <br />
                • Orientación académica y plan de estudios
                <br />
                • Consultas generales sobre servicios estudiantiles
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<PersonAddIcon />}
                  onClick={() => setSolicitudCitaOpen(true)}
                  size="large"
                  sx={{ flex: 1, minWidth: '180px' }}
                >
                  Solicitar Cita
                </Button>

                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<ScheduleIcon />}
                  onClick={() => setMisCitasOpen(true)}
                  size="large"
                  sx={{ flex: 1, minWidth: '180px' }}
                >
                  Ver Mis Citas
                </Button>

                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={
                    <Badge badgeContent={notificacionesBadge} color="error">
                      <NotificationsIcon />
                    </Badge>
                  }
                  onClick={() => setNotificacionesOpen(true)}
                  size="large"
                  sx={{ flex: 1, minWidth: '180px' }}
                >
                  Notificaciones
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Información Personal */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon sx={{ mr: 1 }} />
                Información Personal
              </Typography>
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Edad
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {user.edad ? `${user.edad} años` : 'No especificada'}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Estado Civil
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {user.estado_civil || 'No especificado'}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Lugar de Origen
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {user.lugar_origen || 'No especificado'}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Residencia Actual
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {user.colonia_residencia_actual || 'No especificada'}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Teléfono
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {user.celular || 'No especificado'}
                  </Typography>
                </Grid>

                {user.trabaja && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Lugar de Trabajo
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {user.lugar_trabajo || 'No especificado'}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Alertas y Notificaciones */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <InfoIcon sx={{ mr: 1 }} />
                Información Importante
              </Typography>
              
              <List>
                {(!user.programas || user.programas.length === 0) && (
                  <ListItem>
                    <ListItemIcon>
                      <SchoolIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Programa Educativo Pendiente"
                      secondary="Su programa educativo será asignado por el personal administrativo. Manténgase al pendiente."
                    />
                  </ListItem>
                )}
                
                {(!user.grupos || user.grupos.length === 0) && (
                  <>
                    <Divider />
                    <ListItem>
                      <ListItemIcon>
                        <GroupIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Grupo Pendiente"
                        secondary="Su grupo será asignado por el personal administrativo. Manténgase al pendiente."
                      />
                    </ListItem>
                  </>
                )}
                
                <Divider />
                <ListItem>
                  <ListItemIcon>
                    <PsychologyIcon color="info" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Servicios de Apoyo Disponibles"
                    secondary="Recuerde que cuenta con servicios de apoyo psicopedagógico. Contacte al personal si necesita ayuda."
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

      </Grid>

      {/* Componente del Cuestionario Psicopedagógico */}
      <CuestionarioPsicopedagogico
        open={cuestionarioOpen}
        onClose={() => setCuestionarioOpen(false)}
        personaId={user.id}
        onSuccess={handleCuestionarioSuccess}
      />

      {/* Componente de Solicitud de Cita */}
      <SolicitudCitaForm
        open={solicitudCitaOpen}
        onClose={() => setSolicitudCitaOpen(false)}
        onSubmit={handleSolicitudCita}
        loading={loadingCita}
      />

      {/* Componente de Mis Citas */}
      <MisCitas
        open={misCitasOpen}
        onClose={() => setMisCitasOpen(false)}
      />

      {/* Componente de Notificaciones de Citas */}
      <NotificacionesCitas
        open={notificacionesOpen}
        onClose={() => setNotificacionesOpen(false)}
        onBadgeUpdate={setNotificacionesBadge}
      />

      {/* Modal de Solicitud de Cita después del Cuestionario */}
      <AppointmentRequestModal
        open={showAppointmentModal}
        onClose={handleCloseAppointmentModal}
        onRequestAppointment={handleAppointmentRequest}
        loading={loadingCita}
      />
    </Box>
  );
};

export default AlumnoDashboard;
