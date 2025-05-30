import { createContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '@/services/api';
import type { AuthContextType, LoginCredentials, User } from '@/types';

// Crear el contexto de autenticación
export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  login: async () => {},
  logout: () => {},
  error: null,
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!token);
  const [error, setError] = useState<string | null>(null);

  // Efecto para verificar si hay un token en localStorage al cargar la página
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          // Intentar obtener el usuario actual con el token almacenado
          const userData = await authService.getCurrentUser();
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error al verificar el token:', error);
          // Si hay un error, limpiar el token y el estado
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    };

    // Solo verificar si hay un token
    if (localStorage.getItem('token')) {
      checkAuth();
    }
  }, []);

  // Función para iniciar sesión
  const login = async (credentials: LoginCredentials) => {
    try {
      setError(null);
      const response = await authService.login(credentials);

      // Guardar el token en localStorage y en el estado
      localStorage.setItem('token', response.access_token);
      setToken(response.access_token);

      // Obtener los datos del usuario
      const userData = await authService.getCurrentUser();
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      setError('Credenciales incorrectas. Por favor, inténtalo de nuevo.');
      console.error('Error de inicio de sesión:', error);
    }
  };

  // Función para cerrar sesión
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        login,
        logout,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
