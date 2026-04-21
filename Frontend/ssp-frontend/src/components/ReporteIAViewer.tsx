/**
 * Componente para visualizar reportes generados por IA
 */

import React, { useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Paper,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Menu,
  Tooltip
} from '@mui/material'
import type { Reporte } from '@/types/reporte'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  obtenerReportes,
  obtenerReportesAdmin,
  descargarReporte,
  type ReporteDownloadFormat
} from '@/services/reporteService'
import DownloadIcon from '@mui/icons-material/Download'
import { useNotification } from '@/hooks/useNotification'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'

interface ReporteIAViewerProps {
  open: boolean
  reporte: Reporte | null
  respuestaId?: string | null
  onClose: () => void
  onRegenerate?: () => void
  isRegenerating?: boolean
  isAdmin?: boolean
  onVersionChange?: (reporte: Reporte) => void
}

export const ReporteIAViewer: React.FC<ReporteIAViewerProps> = ({
  open,
  reporte,
  respuestaId,
  onClose,
  onRegenerate,
  isRegenerating = false,
  isAdmin = false,
  onVersionChange
}) => {
  const [reportes, setReportes] = useState<Reporte[]>(() => (reporte ? [reporte] : []))
  const [selectedReporteId, setSelectedReporteId] = useState<string | null>(reporte?.id ?? null)
  const [loadingReportes, setLoadingReportes] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloadAnchorEl, setDownloadAnchorEl] = useState<null | HTMLElement>(null)
  const [downloadingFormat, setDownloadingFormat] = useState<ReporteDownloadFormat | null>(null)
  const { showNotification } = useNotification()

  const selectedReporte = useMemo<Reporte | null>(() => {
    if (!selectedReporteId) return null
    return reportes.find(r => r.id === selectedReporteId) ?? null
  }, [reportes, selectedReporteId])

  useEffect(() => {
    if (!reporte) {
      setReportes(prev => prev.length ? prev : [])
      setSelectedReporteId(prev => prev ?? null)
      return
    }

    setReportes(prev => {
      const existe = prev.some(r => r.id === reporte.id)
      if (existe) {
        return prev.map(r => (r.id === reporte.id ? reporte : r))
      }
      return [reporte, ...prev]
    })
    setSelectedReporteId(reporte.id)
  }, [reporte?.id, reporte])

  useEffect(() => {
    if (!open || !respuestaId) return

    let isMounted = true
    const cargarReportes = async () => {
      setLoadingReportes(true)
      setError(null)
      try {
        const response = isAdmin
          ? await obtenerReportesAdmin(respuestaId)
          : await obtenerReportes(respuestaId)

        if (!isMounted) return

        const reportesArray = Array.isArray(response?.reportes) ? response.reportes : []
        const ordenados = [...reportesArray].sort((a, b) => b.version - a.version)
        setReportes(ordenados)

        const inicial = ordenados[0] ?? reporte ?? null
        setSelectedReporteId(inicial?.id ?? null)

        if (inicial) {
          onVersionChange?.(inicial)
        }
      } catch (err) {
        if (!isMounted) return
        const mensaje =
          err instanceof Error ? err.message : 'Error al cargar las versiones del reporte'
        setError(mensaje)
        if (reporte) {
          setReportes([reporte])
          setSelectedReporteId(reporte.id)
        } else {
          setReportes([])
          setSelectedReporteId(null)
        }
      } finally {
        if (isMounted) {
          setLoadingReportes(false)
        }
      }
    }

    cargarReportes()

    return () => {
      isMounted = false
    }
  }, [open, respuestaId, isAdmin, reporte?.id, onVersionChange])

  const handleVersionChange = (nuevaVersionId: string) => {
    setSelectedReporteId(nuevaVersionId)
    const nuevoReporte = reportes.find(r => r.id === nuevaVersionId)
    if (nuevoReporte) {
      onVersionChange?.(nuevoReporte)
    }
  }

  const handleOpenDownloadMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setDownloadAnchorEl(event.currentTarget)
  }

  const handleCloseDownloadMenu = () => {
    setDownloadAnchorEl(null)
  }

  const handleDownload = async (formato: ReporteDownloadFormat) => {
    if (!respuestaId || !selectedReporte) {
      showNotification('Selecciona un reporte antes de descargar.', 'warning')
      setDownloadAnchorEl(null)
      return
    }

    try {
      setDownloadingFormat(formato)
      const { blob, filename } = await descargarReporte({
        respuestaId,
        reporteId: selectedReporte.id,
        formato,
        isAdmin
      })

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error al descargar reporte:', error)
      showNotification('No fue posible descargar el reporte. Intenta nuevamente.', 'error')
    } finally {
      setDownloadingFormat(null)
      setDownloadAnchorEl(null)
    }
  }

  const formatearFecha = (fecha: string) => {
    try {
      return format(new Date(fecha), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })
    } catch {
      return fecha
    }
  }
  const isReporteActual = selectedReporte?.es_actual ?? false
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Reporte Psicopedagógico</Typography>
          <Chip
            label={selectedReporte ? `Versión ${selectedReporte.version}` : 'Sin versión'}
            color={isReporteActual ? 'primary' : 'default'}
            variant={isReporteActual ? 'filled' : 'outlined'}
          />
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Stack direction={{ xs: 'column', sm: 'row' }} gap={2} alignItems="center" sx={{ mb: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel id="version-reporte-label">Versión del reporte</InputLabel>
            <Select
              labelId="version-reporte-label"
              label="Versión del reporte"
              value={selectedReporteId ?? ''}
              onChange={event => handleVersionChange(event.target.value as string)}
              disabled={loadingReportes || reportes.length === 0}
            >
              {reportes.map(rep => (
                <MenuItem key={rep.id} value={rep.id}>
                  Versión {rep.version} {rep.es_actual ? '(Actual)' : ''}
                </MenuItem>
              ))}
              {reportes.length === 0 && (
                <MenuItem value="" disabled>
                  No hay versiones disponibles
                </MenuItem>
              )}
            </Select>
          </FormControl>
          {loadingReportes && <CircularProgress size={24} />}
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!selectedReporte && !loadingReportes && (
          <Alert severity="info" sx={{ mb: 2 }}>
            No se encontró información para este reporte.
          </Alert>
        )}

        {selectedReporte && (
          <>
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="textSecondary">
                Generado: {formatearFecha(selectedReporte.fecha_generacion)}
              </Typography>
              {selectedReporte.es_actual && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  Esta es la versión actual del reporte
                </Alert>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            <Paper
              sx={{
                p: 3,
                backgroundColor: '#f5f5f5',
                maxHeight: '500px',
                overflowY: 'auto',
                '& h1': {
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  mt: 3,
                  mb: 2,
                  color: 'primary.main',
                  borderBottom: '2px solid',
                  borderColor: 'primary.main',
                  pb: 1
                },
                '& h2': {
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  mt: 3,
                  mb: 1.5,
                  color: 'text.primary'
                },
                '& h3': {
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  mt: 2,
                  mb: 1,
                  color: 'text.primary'
                },
                '& h4': {
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  mt: 1.5,
                  mb: 0.75,
                  color: 'text.primary'
                },
                '& p': {
                  mb: 1.5,
                  lineHeight: 1.7,
                  color: 'text.secondary'
                },
                '& ul, & ol': {
                  mb: 2,
                  pl: 3,
                  '& li': {
                    mb: 0.75,
                    lineHeight: 1.6
                  }
                },
                '& strong': {
                  fontWeight: 700,
                  color: 'text.primary'
                },
                '& em': {
                  fontStyle: 'italic'
                },
                '& blockquote': {
                  borderLeft: '4px solid',
                  borderColor: 'primary.main',
                  pl: 2,
                  ml: 0,
                  my: 2,
                  color: 'text.secondary',
                  fontStyle: 'italic'
                },
                '& code': {
                  backgroundColor: 'rgba(0, 0, 0, 0.05)',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontFamily: 'monospace',
                  fontSize: '0.9em'
                },
                '& pre': {
                  backgroundColor: 'rgba(0, 0, 0, 0.05)',
                  padding: 2,
                  borderRadius: 1,
                  overflowX: 'auto',
                  my: 2,
                  '& code': {
                    backgroundColor: 'transparent',
                    padding: 0
                  }
                },
                '& hr': {
                  my: 3,
                  borderColor: 'divider'
                },
                '& a': {
                  color: 'primary.main',
                  textDecoration: 'underline',
                  '&:hover': {
                    textDecoration: 'none'
                  }
                },
                '& table': {
                  width: '100%',
                  borderCollapse: 'collapse',
                  my: 2,
                  '& th, & td': {
                    border: '1px solid',
                    borderColor: 'divider',
                    padding: 1.5,
                    textAlign: 'left'
                  },
                  '& th': {
                    backgroundColor: 'rgba(0, 0, 0, 0.05)',
                    fontWeight: 600
                  }
                }
              }}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
              >
                {selectedReporte.contenido}
              </ReactMarkdown>
            </Paper>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Tooltip title={respuestaId ? 'Descargar reporte con preguntas' : 'Selecciona un reporte para descargar'}>
          <span>
            <Button
              onClick={handleOpenDownloadMenu}
              startIcon={
                downloadingFormat ? <CircularProgress color="inherit" size={18} /> : <DownloadIcon />
              }
              disabled={!respuestaId || !selectedReporte || downloadingFormat !== null}
              variant="outlined"
            >
              Descargar
            </Button>
          </span>
        </Tooltip>
        <Menu
          anchorEl={downloadAnchorEl}
          open={Boolean(downloadAnchorEl)}
          onClose={handleCloseDownloadMenu}
        >
          <MenuItem onClick={() => handleDownload('pdf')}>PDF</MenuItem>
          <MenuItem onClick={() => handleDownload('word')}>Word</MenuItem>
          <MenuItem onClick={() => handleDownload('excel')}>Excel</MenuItem>
        </Menu>

        {isAdmin && onRegenerate && (
          <Button
            onClick={onRegenerate}
            disabled={isRegenerating}
            variant="contained"
            color="secondary"
            startIcon={isRegenerating ? <CircularProgress size={20} /> : undefined}
          >
            {isRegenerating ? 'Regenerando...' : 'Regenerar Reporte'}
          </Button>
        )}
        <Button onClick={onClose} variant="outlined">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ReporteIAViewer
