import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  Card,
  CardContent,
  IconButton,
  Divider
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Psychology as PsychologyIcon,
  Close as CloseIcon,
  CalendarToday as CalendarIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

interface AppointmentRequestModalProps {
  open: boolean;
  onClose: () => void;
  onRequestAppointment: () => void;
  loading?: boolean;
}

const AppointmentRequestModal: React.FC<AppointmentRequestModalProps> = ({
  open,
  onClose,
  onRequestAppointment,
  loading = false
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <IconButton
            onClick={onClose}
            sx={{ mr: 1 }}
            aria-label="Cerrar"
          >
            <ArrowBackIcon />
          </IconButton>
          <CheckCircleIcon
            color="success"
            sx={{ mr: 2, fontSize: 28 }}
          />
          <Box>
            <Typography variant="h5" component="div" color="success.main">
              ¡Cuestionario Completado!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Gracias por completar el cuestionario psicopedagógico
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>¡Excelente!</strong> Has completado exitosamente el cuestionario psicopedagógico.
              El personal académico revisará tus respuestas para brindarte el mejor apoyo posible.
            </Typography>
          </Alert>

        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent sx={{ pb: 2 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <PsychologyIcon color="primary" sx={{ mr: 2 }} />
              <Typography variant="h6" color="primary">
                ¿Necesitas apoyo personalizado?
              </Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary" paragraph>
              Basándose en tus respuestas, nuestro personal especializado puede ofrecerte:
            </Typography>
            
            <Box component="ul" sx={{ pl: 2, mb: 2 }}>
              <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                Orientación académica personalizada
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                Apoyo psicológico y emocional
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                Estrategias de estudio y organización
              </Typography>
              <Typography component="li" variant="body2">
                Recursos adicionales de apoyo estudiantil
              </Typography>
            </Box>
          </CardContent>
        </Card>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Box display="flex" alignItems="center" mb={1}>
              <CalendarIcon sx={{ mr: 1, fontSize: 20 }} />
              <Typography variant="subtitle2">
                Solicita una cita personalizada
              </Typography>
            </Box>
            <Typography variant="body2">
              Puedes solicitar una cita con nuestro personal especializado para recibir
              apoyo personalizado basado en tus respuestas del cuestionario.
            </Typography>
          </Alert>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={loading}
        >
          Ahora no
        </Button>
        <Button
          onClick={onRequestAppointment}
          variant="contained"
          disabled={loading}
          startIcon={<ScheduleIcon />}
        >
          Solicitar Cita
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AppointmentRequestModal;
