import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box } from '@mui/material';
import LoginForm from '@/components/LoginForm';
import { AuthContext } from '@/contexts/AuthContext';

const LoginPage = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  // Redirigir al dashboard o a la página anterior si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      // Verificar si hay una URL guardada para redirigir después del login
      const redirectPath = localStorage.getItem('redirectAfterLogin');

      if (redirectPath) {
        // Limpiar la URL guardada
        localStorage.removeItem('redirectAfterLogin');
        // Redirigir a la página anterior
        navigate(redirectPath);
      } else {
        // Redirigir al dashboard por defecto
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, navigate]);

  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <LoginForm />
      </Box>
    </Container>
  );
};

export default LoginPage;
