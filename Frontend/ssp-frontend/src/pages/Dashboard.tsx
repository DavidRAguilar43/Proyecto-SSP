import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  AppBar,
  Toolbar,
  Card,
  CardContent,
  CardActions,
  Grid
} from '@mui/material';
import {
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Group as GroupIcon,
  School as SchoolIcon,
  Category as CategoryIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
  Psychology as PsychologyIcon
} from '@mui/icons-material';
import { AuthContext } from '@/contexts/AuthContext';
import AlumnoPage from './AlumnoPage';
import EstudiantesCuestionarios from '@/components/EstudiantesCuestionarios';
import SolicitudesCitas from '@/components/SolicitudesCitas';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [citasPendientes, setCitasPendientes] = useState(0);

  // Redirigir usuarios finales (alumnos, docentes, personal) a la interfaz unificada
  useEffect(() => {
    if (user?.rol === 'alumno' || user?.rol === 'docente' || user?.rol === 'personal') {
      navigate('/alumno', { replace: true });
    }
  }, [user, navigate]);

  // Si es usuario final, mostrar la interfaz unificada
  if (user?.rol === 'alumno' || user?.rol === 'docente' || user?.rol === 'personal') {
    return <AlumnoPage user={user} onLogout={logout} />;
  }

  const menuItems = [
    {
      title: 'Gestión de Personas',
      description: 'Administrar estudiantes, docentes y personal',
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      path: '/personas',
      roles: ['admin', 'coordinador']
    },
    {
      title: 'Atenciones',
      description: 'Ver, editar y eliminar solicitudes de citas',
      icon: <AssignmentIcon sx={{ fontSize: 40 }} />,
      path: '/atenciones',
      roles: ['admin', 'coordinador']
    },
    {
      title: 'Grupos',
      description: 'Administrar grupos y cohortes',
      icon: <GroupIcon sx={{ fontSize: 40 }} />,
      path: '/grupos',
      roles: ['admin', 'coordinador']
    },
    {
      title: 'Programas Educativos',
      description: 'Gestionar programas educativos',
      icon: <SchoolIcon sx={{ fontSize: 40 }} />,
      path: '/programas-educativos',
      roles: ['admin', 'coordinador']
    },
    {
      title: 'Unidades',
      description: 'Gestionar unidades organizacionales',
      icon: <BusinessIcon sx={{ fontSize: 40 }} />,
      path: '/unidades',
      roles: ['admin', 'coordinador']
    },

    {
      title: 'Cuestionarios Pendientes',
      description: 'Ver, revisar y gestionar cuestionarios nuevos',
      icon: <PsychologyIcon sx={{ fontSize: 40 }} />,
      path: '/cuestionarios-pendientes',
      roles: ['admin', 'coordinador']
    },
    {
      title: 'Catálogos',
      description: 'Administrar catálogos de religiones, grupos étnicos y discapacidades',
      icon: <CategoryIcon sx={{ fontSize: 40 }} />,
      path: '/catalogos',
      roles: ['admin', 'coordinador']
    },
    {
      title: 'Gestión de Cuestionarios',
      description: 'Crear, editar y administrar cuestionarios para usuarios',
      icon: <AssignmentIcon sx={{ fontSize: 40 }} />,
      path: '/admin/cuestionarios',
      roles: ['admin', 'coordinador']
    },
    {
      title: 'Mis Cuestionarios',
      description: 'Ver y responder cuestionarios asignados',
      icon: <PsychologyIcon sx={{ fontSize: 40 }} />,
      path: '/usuario/cuestionarios',
      roles: ['alumno', 'docente', 'personal']
    }
  ];

  const availableItems = menuItems.filter(item =>
    item.roles.includes(user?.rol || '')
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Sistema de Seguimiento Psicopedagógico
          </Typography>
          <Button color="inherit" onClick={logout}>
            Cerrar Sesión
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {/* Información del usuario */}
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Bienvenido al Dashboard
          </Typography>

          {user && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1">
                <strong>Correo:</strong> {user.correo_institucional}
              </Typography>
              {user.matricula && (
                <Typography variant="body1">
                  <strong>Matrícula:</strong> {user.matricula}
                </Typography>
              )}
              <Typography variant="body1">
                <strong>Rol:</strong> {user.rol}
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Notificaciones de Cuestionarios (solo para admin y coordinador) */}
        {(user?.rol === 'admin' || user?.rol === 'coordinador') && (
          <Box sx={{ mb: 4 }}>
            <EstudiantesCuestionarios />
          </Box>
        )}

        {/* Solicitudes de Citas (solo para admin y personal) */}
        {(user?.rol === 'admin' || user?.rol === 'personal') && (
          <Box sx={{ mb: 4 }}>
            <SolicitudesCitas onBadgeUpdate={setCitasPendientes} />
          </Box>
        )}

        {/* Menú de funcionalidades */}
        <Typography variant="h5" gutterBottom>
          Funcionalidades Disponibles
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {availableItems.map((item, index) => (
            <Box key={index} sx={{ flex: '1 1 300px', maxWidth: '400px' }}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  '&:hover': {
                    elevation: 8,
                    transform: 'translateY(-2px)',
                    transition: 'all 0.3s ease-in-out'
                  }
                }}
                onClick={() => navigate(item.path)}
              >
                <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                  <Box sx={{ color: 'primary.main', mb: 2 }}>
                    {item.icon}
                  </Box>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                  <Button size="small" variant="outlined">
                    Acceder
                  </Button>
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>

        {availableItems.length === 0 && (
          <Paper elevation={1} sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No hay funcionalidades disponibles para tu rol actual.
            </Typography>
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default Dashboard;
