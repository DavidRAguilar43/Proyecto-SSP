/**
 * Servicio para gestionar reportes generados por IA
 */

import { api } from './api'
import type {
  Reporte,
  ReportesResponse,
  GenerarReporteResponse,
  GenerarReporteRequestPayload
} from '@/types/reporte'

export type { Reporte, ReportesResponse, GenerarReporteResponse }

/**
 * Generar un nuevo reporte para una respuesta de cuestionario
 * @param respuestaId - ID de la respuesta del cuestionario
 * @param payload - Datos para generar el reporte
 * @param timeoutMs - Timeout en milisegundos (default: 60000 = 60 segundos)
 * @returns Reporte generado
 */
export const generarReporte = async (
  respuestaId: string,
  payload?: GenerarReporteRequestPayload,
  timeoutMs: number = 60000
): Promise<GenerarReporteResponse> => {
  const response = await api.post(
    `/cuestionarios-usuario/${respuestaId}/generar-reporte`,
    payload ?? {},
    {
      timeout: timeoutMs
    }
  )
  return response.data
}

/**
 * Obtener todos los reportes de una respuesta
 * @param respuestaId - ID de la respuesta del cuestionario
 * @returns Lista de reportes con historial de versiones
 */
export const obtenerReportes = async (respuestaId: string): Promise<ReportesResponse> => {
  const response = await api.get(`/cuestionarios-usuario/${respuestaId}/reportes`)
  return response.data
}

/**
 * Obtener el reporte actual (más reciente) de una respuesta
 * @param respuestaId - ID de la respuesta del cuestionario
 * @returns Reporte actual
 */
export const obtenerReporteActual = async (respuestaId: string): Promise<Reporte> => {
  const response = await api.get(`/cuestionarios-usuario/${respuestaId}/reporte-actual`)
  return response.data
}

/**
 * Regenerar un reporte (solo para admin/coordinador)
 * @param respuestaId - ID de la respuesta del cuestionario
 * @returns Nuevo reporte generado
 */
export const regenerarReporte = async (
  respuestaId: string,
  payload?: GenerarReporteRequestPayload
): Promise<GenerarReporteResponse> => {
  const response = await api.post(
    `/cuestionarios-admin/respuestas/${respuestaId}/regenerar-reporte`,
    payload ?? {}
  )
  return response.data
}

/**
 * Obtener todos los reportes de una respuesta (admin)
 * @param respuestaId - ID de la respuesta del cuestionario
 * @returns Lista de reportes con historial de versiones
 */
export const obtenerReportesAdmin = async (respuestaId: string): Promise<ReportesResponse> => {
  const response = await api.get(`/cuestionarios-admin/respuestas/${respuestaId}/reportes`)
  return response.data
}

export type ReporteDownloadFormat = 'pdf' | 'word' | 'excel'

export interface DescargarReporteOptions {
  respuestaId: string
  reporteId: string
  formato: ReporteDownloadFormat
  isAdmin?: boolean
}

const FORMATO_TO_PATH: Record<ReporteDownloadFormat, string> = {
  pdf: 'pdf',
  word: 'word',
  excel: 'excel'
}

const DEFAULT_FILENAMES: Record<ReporteDownloadFormat, string> = {
  pdf: 'reporte_psicopedagogico.pdf',
  word: 'reporte_psicopedagogico.docx',
  excel: 'reporte_psicopedagogico.xlsx'
}

const parseFilenameFromHeader = (contentDisposition?: string, formato?: ReporteDownloadFormat) => {
  if (!contentDisposition) {
    return formato ? DEFAULT_FILENAMES[formato] : 'reporte_psicopedagogico'
  }

  const match = contentDisposition.match(/filename\*=UTF-8''([^;]+)|filename=\"?([^\";]+)\"?/i)
  const filename = match?.[1] || match?.[2]
  return filename ? decodeURIComponent(filename) : (formato ? DEFAULT_FILENAMES[formato] : 'reporte_psicopedagogico')
}

export const descargarReporte = async ({
  respuestaId,
  reporteId,
  formato,
  isAdmin = false
}: DescargarReporteOptions): Promise<{ blob: Blob; filename: string }> => {
  const formatoPath = FORMATO_TO_PATH[formato]
  const basePath = isAdmin ? '/cuestionarios-admin/respuestas' : '/cuestionarios-usuario'
  const url = `${basePath}/${respuestaId}/reportes/${reporteId}/download/${formatoPath}`

  const response = await api.get<Blob>(url, {
    responseType: 'blob'
  })

  const filename = parseFilenameFromHeader(response.headers['content-disposition'], formato)
  return {
    blob: response.data,
    filename
  }
}
