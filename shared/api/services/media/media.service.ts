import type { MediaUploadInput, MediaUploadResult } from '@antojados/api/types/publish'
import {
  createMediaRequest,
  registerRightsOrigin,
  uploadOriginal,
  waitForReadyPayload,
  mapReadyPayloadToMediaResult,
} from '@antojados/api/services/media-engine/mediaEngineClient'

/**
 * Sube media usando ATLX Media Engine V3.
 *
 * Flujo:
 *   1. createMediaRequest  → declara metadata
 *   2. registerRightsOrigin → registra derechos/origen
 *   3. uploadOriginal       → sube el binario (multipart)
 *   4. waitForReadyPayload  → polling hasta ready
 *   5. Mapea a MediaUploadResult para mantener compatibilidad
 */
export async function uploadMedia(input: MediaUploadInput): Promise<MediaUploadResult> {
  if (!input.base64 && !input.file) throw new Error('uploadMedia: base64 o file requerido')

  const mediaType = input.mediaType === 'video' ? 'video' : 'image'
  const targetContext = _resolveTargetContext(input.channel)

  const request = await createMediaRequest({
    sourceApp: 'ios',
    sourceActorType: 'user',
    sourceActorId: input.entityId || 'unknown',
    targetContext,
    mediaType,
    clientReferenceId: input.entityId
      ? `${input.channel}-${input.entityId}-${Date.now()}`
      : undefined,
  })

  const mediaId = request.mediaId

  await registerRightsOrigin(mediaId, {
    originType: 'created_in_antojados',
    ownershipType: 'creator_owned',
    rightsDeclaration: 'i_am_author',
    rightsStatus: 'declared',
    licenseType: 'user_generated',
    licenseScope: 'platform_public',
    allowPublicDisplay: true,
    allowDownload: false,
    allowShare: true,
    allowEngineWatermark: true,
    isDemoContent: false,
  })

  // Subir archivo: directo si es File (preferido), o desde base64 (fallback legacy)
  if (input.file) {
    const fileName = input.file.name || `media-${mediaId}.${mediaType === 'video' ? 'mp4' : 'jpg'}`
    await uploadOriginal(mediaId, input.file, fileName)
  } else if (input.base64) {
    const { base64ToBlob } = await import('@antojados/api/services/media-engine/mediaEngineClient')
    const mimeType = input.mediaType === 'video' ? 'video/mp4' : 'image/jpeg'
    const blob = base64ToBlob(input.base64, mimeType)
    const ext = input.mediaType === 'video' ? 'mp4' : 'jpg'
    await uploadOriginal(mediaId, blob, `media-${mediaId}.${ext}`)
  }

  const payload = await waitForReadyPayload(mediaId, {
    onStatus: (p, meta) => {
      console.log(`[media] ${mediaId} intento ${meta.attempt}/${meta.attempts}: ${p.status}`)
    },
  })

  return mapReadyPayloadToMediaResult(payload)
}

/**
 * Verifica el estado de un intake de media.
 * Usa el engine directamente, no endpoints legacy.
 */
export async function getIntakeStatus(mediaId: string): Promise<MediaUploadResult | null> {
  if (!mediaId) return null
  try {
    const { getReadyPayload } = await import('@antojados/api/services/media-engine/mediaEngineClient')
    const payload = await getReadyPayload(mediaId)
    return mapReadyPayloadToMediaResult(payload)
  } catch {
    return null
  }
}

export function resolveUploadedMediaUrl(result: MediaUploadResult): string | null {
  return result.video_720_url ||
    result.video_1080_url ||
    result.feed_url ||
    result.full_url ||
    result.media_url ||
    result.thumb_url ||
    result.media_thumbnail_url ||
    null
}

export function requireUploadedMediaUrl(result: MediaUploadResult, context = 'media'): string {
  const mediaUrl = resolveUploadedMediaUrl(result)
  if (!mediaUrl) {
    throw new Error(`El intake de ${context} no devolvio URL normalizada.`)
  }
  return mediaUrl
}

/**
 * Espera a que una URL de media esté disponible.
 * Puede hacer polling si el resultado inicial no tiene URL.
 */
export async function waitForUploadedMediaUrl(
  result: MediaUploadResult,
  context = 'media',
  options: {
    attempts?: number
    intervalMs?: number
    onStatus?: (status: MediaUploadResult | null, meta: { attempt: number; attempts: number }) => void
  } = {},
): Promise<string> {
  const immediateUrl = resolveUploadedMediaUrl(result)
  if (immediateUrl) return immediateUrl

  const mediaId = result.intake_id
  if (!mediaId) {
    throw new Error(`El intake de ${context} no devolvio URL normalizada.`)
  }

  try {
    const payload = await waitForReadyPayload(mediaId, {
      attempts: options.attempts,
      intervalMs: options.intervalMs,
      onStatus: (p, meta) => {
        options.onStatus?.(
          mapReadyPayloadToMediaResult(p),
          meta,
        )
      },
    })
    const url = resolveUploadedMediaUrl(mapReadyPayloadToMediaResult(payload))
    if (url) return url
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(`El intake de ${context} fallo: ${err.message}`)
    }
    throw err
  }

  throw new Error(`El intake de ${context} sigue procesando. Intenta de nuevo en unos minutos.`)
}

function _resolveTargetContext(channel: string): 'post' | 'avatar' | 'gallery' | 'story' | 'cover' {
  switch (channel) {
    case 'avatar':
      return 'avatar'
    case 'gallery':
      return 'gallery'
    case 'tile':
      return 'cover'
    default:
      return 'post'
  }
}
