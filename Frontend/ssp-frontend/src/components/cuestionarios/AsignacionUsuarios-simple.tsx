import React from 'react';
import { Box, Typography } from '@mui/material';

// Definir el tipo directamente aquí para evitar problemas de importación
type TipoUsuario = 'alumno' | 'docente' | 'personal';

interface AsignacionUsuariosSimpleProps {
  tiposSeleccionados: TipoUsuario[];
  onChange: (tipos: TipoUsuario[]) => void;
}

const AsignacionUsuariosSimple: React.FC<AsignacionUsuariosSimpleProps> = ({
  tiposSeleccionados,
  onChange
}) => {
  return (
    <Box>
      <Typography variant="h6">
        Asignación de Usuarios (Versión Simple)
      </Typography>
      <Typography>
        Tipos seleccionados: {tiposSeleccionados.join(', ')}
      </Typography>
    </Box>
  );
};

export default AsignacionUsuariosSimple;
