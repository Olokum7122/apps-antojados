/**
 * Mapa de errores técnicos del Media Engine a mensajes amigables para el usuario.
 *
 * DEBT-016: Mensajes de error amigables para fallos del engine.
 *
 * Úsalo en composables o componentes que manejen upload/reprocesamiento de media.
 * Ejemplo:
 *   import { toUserFriendlyMediaError } from '@antojados/api/services/media/media-error-map'
 *   try { ... } catch (err) { showError(toUserFriendlyMediaError(err)) }
 */

const ENGINE_ERROR_MAP: Record<string, string> = {
  // Timeouts
  'request timed out': 'El servidor tardó demasiado en responder. Revisa tu conexión e inténtalo de nuevo.',
  'network timeout': 'La conexión se interrumpió. Verifica tu conexión a internet.',
  'exceeded max retries': 'El servidor no está respondiendo. Intenta de nuevo en unos minutos.',
  'polling exhausted': 'El procesamiento del archivo está tomando más de lo esperado. Vuelve a intentar más tarde.',

  // Upload failures
  'upload failed': 'No se pudo subir el archivo. Revisa tu conexión y vuelve a intentarlo.',
  'file too large': 'El archivo es demasiado grande. Máximo 20 MB para fotos y 200 MB para videos.',
  'invalid file type': 'El formato del archivo no es compatible. Usa imágenes JPG/PNG o videos MP4.',
  'empty file': 'El archivo está vacío. Selecciona un archivo válido.',
  'corrupt file': 'El archivo parece estar dañado. Intenta con otro archivo.',

  // Media Engine errors
  'create media request': 'No se pudo iniciar la subida. Intenta de nuevo.',
  'register rights origin': 'Error de registro de derechos de la imagen. Intenta de nuevo.',
  'engine rejected': 'El archivo no cumple con los requisitos mínimos de calidad.',
  'engine timed out': 'El motor de procesamiento no respondió a tiempo. Intenta de nuevo.',

  // Generic
  'no url': 'El archivo se procesó pero no se pudo obtener la URL. Contacta a soporte.',
  'intake not found': 'El archivo no se encontró en el servidor. Sube el archivo nuevamente.',
  'unknown': 'Ocurrió un error inesperado. Intenta de nuevo o contacta a soporte.',
}

const FALLBACK_MESSAGE = 'Ocurrió un error al procesar tu archivo. Intenta de nuevo.'

/**
 * Convierte un error técnico del Media Engine en un mensaje amigable para el usuario.
 */
export function toUserFriendlyMediaError(error: unknown): string {
  if (!error) return FALLBACK_MESSAGE

  const message = typeof error === 'string'
    ? error
    : error instanceof Error
      ? error.message
      : String(error)

  const lower = message.toLowerCase()

  for (const [pattern, friendly] of Object.entries(ENGINE_ERROR_MAP)) {
    if (lower.includes(pattern)) return friendly
  }

  // Si no hay match, devolvemos el mensaje original truncado + fallback
  if (message.length > 80) {
    return `${message.slice(0, 77)}...`
  }

  return message || FALLBACK_MESSAGE
}
