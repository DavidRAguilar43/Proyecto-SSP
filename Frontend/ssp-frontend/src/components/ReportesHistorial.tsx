/**
 * Componente para mostrar historial de reportes
 */

import React from 'react'
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material'
import type { Reporte } from '@/types/reporte'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import RefreshIcon from '@mui/icons-material/Refresh'
import VisibilityIcon from '@mui/icons-material/Visibility'

interface ReportesHistorialProps {
  reportes: Reporte[]
  onSelectReporte: (reporte: Reporte) => void
  onRegenerate?: () => void
  isRegenerating?: boolean
  isAdmin?: boolean
  loading?: boolean
}

export const ReportesHistorial: React.FC<ReportesHistorialProps> = ({
  reportes,
  onSelectReporte,
  onRegenerate,
  isRegenerating = false,
  isAdmin = false,
  loading = false
}) => {
  const formatearFecha = (fecha: string) => {
    try {
      return format(new Date(fecha), "d MMM yyyy HH:mm", { locale: es })
    } catch {
      return fecha
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    )
  }

  if (!reportes || reportes.length === 0) {
    return (
      <Alert severity="info">
        No hay reportes disponibles. Genera uno para comenzar.
      </Alert>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Historial de Reportes ({reportes.length})
        </Typography>
        {isAdmin && onRegenerate && (
          <Button
            onClick={onRegenerate}
            disabled={isRegenerating}
            variant="contained"
            color="secondary"
            size="small"
            startIcon={isRegenerating ? <CircularProgress size={16} /> : <RefreshIcon />}
          >
            {isRegenerating ? 'Regenerando...' : 'Regenerar'}
          </Button>
        )}
      </Box>

      <Paper variant="outlined">
        <List sx={{ width: '100%' }}>
          {reportes.map((reporte, index) => (
            <React.Fragment key={reporte.id}>
              <ListItem
                disablePadding
                secondaryAction={
                  <Button
                    edge="end"
                    size="small"
                    onClick={() => onSelectReporte(reporte)}
                    startIcon={<VisibilityIcon />}
                  >
                    Ver
                  </Button>
                }
              >
                <ListItemButton onClick={() => onSelectReporte(reporte)}>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" fontWeight="500">
                          Versión {reporte.version}
                        </Typography>
                        {reporte.es_actual && (
                          <Chip
                            label="Actual"
                            size="small"
                            color="primary"
                            variant="filled"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="textSecondary">
                        {formatearFecha(reporte.fecha_generacion)}
                      </Typography>
                    }
                  />
                </ListItemButton>
              </ListItem>
              {index < reportes.length - 1 && <Box component="li" />}
            </React.Fragment>
          ))}
        </List>
      </Paper>
    </Box>
  )
}

export default ReportesHistorial

