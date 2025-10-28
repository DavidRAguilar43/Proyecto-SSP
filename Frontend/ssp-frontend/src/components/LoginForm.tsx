import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Container,
  Alert,
  Divider,
  Link
} from '@mui/material';
import { AuthContext } from '@/contexts/AuthContext';

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, error } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login({ username, password });
  };

  return (
    <Container maxWidth="sm">
      <Paper
        elevation={3}
        sx={{
          p: 4,
          mt: 8,
          borderRadius: 2,
          backgroundColor: 'background.paper'
        }}
      >
        <Box
          sx={{
            mb: 3,
            p: 2,
            backgroundColor: 'primary.main',
            borderRadius: 1,
            color: 'white'
          }}
        >
          <Typography variant="h4" component="h1" align="center" gutterBottom sx={{ mb: 0 }}>
            Sistema de Seguimiento Psicopedagógico
          </Typography>
        </Box>

        <Typography
          variant="h5"
          component="h2"
          align="center"
          gutterBottom
          sx={{ color: 'text.primary', mb: 3 }}
        >
          Iniciar Sesión
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Correo Institucional o Matrícula"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Contraseña"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            sx={{
              mt: 3,
              mb: 2,
              py: 1.5,
              fontWeight: 600
            }}
            disabled={!username || !password}
          >
            Iniciar Sesión
          </Button>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              ¿No tienes cuenta?
            </Typography>
          </Divider>

          <Button
            fullWidth
            variant="outlined"
            color="secondary"
            size="large"
            onClick={() => navigate('/registro-alumno')}
            sx={{
              mt: 1,
              py: 1.5,
              fontWeight: 600
            }}
          >
            Registrate aquí
          </Button>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              ¿Ya tienes cuenta? Usa tus credenciales institucionales arriba
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginForm;
