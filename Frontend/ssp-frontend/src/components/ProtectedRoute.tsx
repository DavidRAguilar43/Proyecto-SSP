import { useContext } from 'react';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useContext(AuthContext);

  if (!isAuthenticated) {
    // Redirigir al login si no está autenticado
    return <Navigate to="/login" replace />;
  }

  // Si se especifican roles permitidos, verificar que el usuario tenga uno de ellos
  if (allowedRoles && allowedRoles.length > 0) {
    if (!user || !allowedRoles.includes(user.rol)) {
      // Redirigir según el rol del usuario
      if (user?.rol === 'alumno' || user?.rol === 'docente' || user?.rol === 'personal') {
        // Usuarios finales van a la interfaz unificada
        return <Navigate to="/alumno" replace />;
      } else {
        return <Navigate to="/dashboard" replace />;
      }
    }
  }

  return children;
};

export default ProtectedRoute;
