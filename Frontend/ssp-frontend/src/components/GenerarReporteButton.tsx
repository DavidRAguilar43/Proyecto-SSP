/**
 * Botón para generar/regenerar reportes
 */

import React, { useState } from 'react'
import {
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Box
} from '@mui/material'
import { generarReporte, regenerarReporte } from '@/services/reporteService'
import { useNotification } from '@/hooks/useNotification'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import type {
  GenerarReporteRequestPayload,
  PersonaInfoReportePayload,
  PreguntaRespuestaReportePayload
} from '@/types/reporte'

interface GenerarReporteButtonProps {
  respuestaId: string
  onSuccess?: () => void
  onError?: (error: Error) => void
  isAdmin?: boolean
  disabled?: boolean
  variant?: 'contained' | 'outlined' | 'text'
  size?: 'small' | 'medium' | 'large'
  isRegenerate?: boolean
  preguntasRespuestas?: PreguntaRespuestaReportePayload[]
  instruccionSistema?: string | null
  instruccionSistemaDefault?: string | null
  modeloIA?: string | null
  maxTokens?: number | null
  temperature?: number | null
  personaInfo?: PersonaInfoReportePayload
}

export const GenerarReporteButton: React.FC<GenerarReporteButtonProps> = ({
  respuestaId,
  onSuccess,
  onError,
  isAdmin = false,
  disabled = false,
  variant = 'contained',
  size = 'medium',
  isRegenerate = false,
  preguntasRespuestas,
  instruccionSistema,
  instruccionSistemaDefault,
  modeloIA,
  maxTokens,
  temperature,
  personaInfo
}) => {
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { showNotification } = useNotification()

  const buildPayload = (): GenerarReporteRequestPayload => {
    const preguntas = (preguntasRespuestas ?? []).filter(item => Boolean(item?.pregunta))

    if (preguntas.length === 0) {
      throw new Error('No hay preguntas y respuestas disponibles para generar el reporte.')
    }

    const payload: GenerarReporteRequestPayload = {
      preguntas_respuestas: preguntas
    }

    const instruccionSeleccionada = (instruccionSistema ?? instruccionSistemaDefault)?.trim()
    if (instruccionSeleccionada) {
      payload.instruccion_sistema = instruccionSeleccionada
    }

    if (modeloIA) {
      payload.modelo_ia = modeloIA
    }

    if (maxTokens !== undefined && maxTokens !== null) {
      payload.max_tokens = maxTokens
    }

    if (temperature !== undefined && temperature !== null) {
      payload.temperature = temperature
    }

    if (personaInfo && Object.keys(personaInfo).length > 0) {
      payload.persona_info = personaInfo
    }

    return payload
  }

  const handleGenerarReporte = async () => {
    setLoading(true)
    setError(null)

    try {
      const payload = buildPayload()

      // Determinar qué función usar basado en si es admin y si es regeneración
      let apiCall
      if (isAdmin) {
        // Admin siempre usa regenerarReporte (funciona tanto para generar como regenerar)
        apiCall = regenerarReporte
      } else {
        // Usuario normal usa generarReporte
        apiCall = generarReporte
      }

      const response = await apiCall(respuestaId, payload)

      showNotification(
        response.mensaje || 'Reporte generado exitosamente',
        'success'
      )

      setConfirmOpen(false)
      onSuccess?.()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al generar el reporte'
      setError(errorMessage)
      showNotification(
        errorMessage,
        'error'
      )
      onError?.(err instanceof Error ? err : new Error(errorMessage))
    } finally {
      setLoading(false)
    }
  }

  const buttonLabel = isRegenerate ? 'Regenerar Reporte' : 'Generar Reporte'

  return (
    <>
      <Button
        onClick={() => setConfirmOpen(true)}
        disabled={disabled || loading}
        variant={variant}
        size={size}
        startIcon={loading ? <CircularProgress size={20} /> : <FileDownloadIcon />}
      >
        {loading ? 'Generando...' : buttonLabel}
      </Button>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>
          {isRegenerate ? 'Regenerar Reporte' : 'Generar Reporte'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Alert severity="info">
              {isRegenerate
                ? 'Se generará una nueva versión del reporte. La versión anterior se mantendrá en el historial.'
                : 'Se generará un reporte basado en tus respuestas. Este proceso puede tomar unos momentos.'}
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleGenerarReporte}
            disabled={loading}
            variant="contained"
            color="primary"
          >
            {loading ? 'Generando...' : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default GenerarReporteButton
