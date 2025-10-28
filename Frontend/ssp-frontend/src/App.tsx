import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import NotificationContainer from './components/NotificationContainer';
import theme from './theme';
import LoginPage from './pages/LoginPage';
import RegistroAlumnoPage from './pages/RegistroAlumnoPage';
import Dashboard from './pages/Dashboard';
import PersonasPage from './pages/PersonasPage';
import { ProgramasEducativosPage } from './pages/ProgramasEducativosPage';
import { UnidadesPage } from './pages/UnidadesPage';
import { GruposPage } from './pages/GruposPage';
import CitasPage from './pages/CitasPage';
import AlumnoPage from './pages/AlumnoPage';
import CatalogosPage from './pages/CatalogosPage';
import CuestionariosCompletadosPage from './pages/CuestionariosCompletadosPage';

import CuestionariosPendientesPage from './pages/CuestionariosPendientesPage';
import ProtectedRoute from './components/ProtectedRoute';

// Páginas de administración de cuestionarios
import CuestionariosPage from './pages/admin/CuestionariosPage';
import CrearCuestionarioPage from './pages/admin/CrearCuestionarioPage';
import EditarCuestionarioPage from './pages/admin/EditarCuestionarioPage';
import VerCuestionarioPage from './pages/admin/VerCuestionarioPage';
import CuestionariosContestadosPage from './pages/admin/CuestionariosContestadosPage';

// Páginas de usuario para cuestionarios
import CuestionariosAsignadosPage from './pages/usuario/CuestionariosAsignadosPage';
import ResponderCuestionarioPage from './pages/usuario/ResponderCuestionarioPage';



function App() {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <NotificationProvider>
          <CssBaseline />
          <NotificationContainer />
          <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro-alumno" element={<RegistroAlumnoPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/personas"
            element={
              <ProtectedRoute>
                <PersonasPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/programas-educativos"
            element={
              <ProtectedRoute>
                <ProgramasEducativosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/unidades"
            element={
              <ProtectedRoute>
                <UnidadesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/grupos"
            element={
              <ProtectedRoute>
                <GruposPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/citas"
            element={
              <ProtectedRoute>
                <CitasPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/catalogos"
            element={
              <ProtectedRoute allowedRoles={['admin', 'coordinador']}>
                <CatalogosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cuestionarios-completados"
            element={
              <ProtectedRoute allowedRoles={['admin', 'coordinador']}>
                <CuestionariosCompletadosPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/cuestionarios-pendientes"
            element={
              <ProtectedRoute allowedRoles={['admin', 'coordinador']}>
                <CuestionariosPendientesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/alumno"
            element={
              <ProtectedRoute allowedRoles={['alumno', 'docente', 'personal']}>
                <AlumnoPage />
              </ProtectedRoute>
            }
          />

          {/* Rutas de administración de cuestionarios */}
          <Route
            path="/admin/cuestionarios"
            element={
              <ProtectedRoute allowedRoles={['admin', 'coordinador']}>
                <CuestionariosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/cuestionarios/crear"
            element={
              <ProtectedRoute allowedRoles={['admin', 'coordinador']}>
                <CrearCuestionarioPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/cuestionarios/ver/:id"
            element={
              <ProtectedRoute allowedRoles={['admin', 'coordinador']}>
                <VerCuestionarioPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/cuestionarios/editar/:id"
            element={
              <ProtectedRoute allowedRoles={['admin', 'coordinador']}>
                <EditarCuestionarioPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/cuestionarios-contestados"
            element={
              <ProtectedRoute allowedRoles={['admin', 'coordinador']}>
                <CuestionariosContestadosPage />
              </ProtectedRoute>
            }
          />

          {/* Rutas de usuario para cuestionarios */}
          <Route
            path="/usuario/cuestionarios"
            element={
              <ProtectedRoute allowedRoles={['alumno', 'docente', 'personal']}>
                <CuestionariosAsignadosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/usuario/cuestionarios/responder/:id"
            element={
              <ProtectedRoute allowedRoles={['alumno', 'docente', 'personal']}>
                <ResponderCuestionarioPage />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
        </Router>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
