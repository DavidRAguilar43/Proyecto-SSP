import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { AuthProvider } from '@/contexts/AuthContext';
import LoginPage from '@/pages/LoginPage';
import Dashboard from '@/pages/Dashboard';
import PersonasPage from '@/pages/PersonasPage';
import { ProgramasEducativosPage } from '@/pages/ProgramasEducativosPage';
import { GruposPage } from '@/pages/GruposPage';
import { AtencionesPage } from '@/pages/AtencionesPage';
import ProtectedRoute from '@/components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
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
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
