import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import NotificationContainer from '@/components/NotificationContainer';
import LoginPage from '@/pages/LoginPage';
import RegistroAlumnoPage from '@/pages/RegistroAlumnoPage';
import Dashboard from '@/pages/Dashboard';
import PersonasPage from '@/pages/PersonasPage';
import { ProgramasEducativosPage } from '@/pages/ProgramasEducativosPage';
import { UnidadesPage } from '@/pages/UnidadesPage';
import { GruposPage } from '@/pages/GruposPage';
import { AtencionesPage } from '@/pages/AtencionesPage';
import AlumnoPage from '@/pages/AlumnoPage';
import CatalogosPage from '@/pages/CatalogosPage';
import CuestionariosCompletadosPage from '@/pages/CuestionariosCompletadosPage';
import ProtectedRoute from '@/components/ProtectedRoute';

function App() {
  return (
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
            path="/atenciones"
            element={
              <ProtectedRoute>
                <AtencionesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/catalogos"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <CatalogosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cuestionarios-completados"
            element={
              <ProtectedRoute allowedRoles={['admin', 'personal']}>
                <CuestionariosCompletadosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/alumno"
            element={
              <ProtectedRoute allowedRoles={['alumno']}>
                <AlumnoPage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
