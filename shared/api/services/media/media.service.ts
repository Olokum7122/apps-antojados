import type { MediaUploadInput, MediaUploadResult } from '../../types/publish'
import {
  createRequest,
  registerRightsOrigin,
  uploadOriginal,
  getReadyPayload,
  waitForReadyPayload,
  toLegacyUploadResult,
  resolveSourceApp,
} from './media-engine-client.service'

/**
 * Media service migrado al Media Engine V3.
 * Flujo:
 *   1. createRequest() → POST /api/media/requests → mediaId
 *   2. registerRightsOrigin() → POST /api/media/:mediaId/rights-origin → registra derechos
 *   3. uploadOriginal() → POST /api/media/:mediaId/original (multipart) → archivo
 *   4. Imágenes: ready-payload inmediato → URLs
 *   5. Videos: polling de ready-payload hasta que esté listo
 *
 * La interfaz exportada (uploadMedia, getIntakeStatus, waitForUploadedMediaUrl)
 * se mantiene igual para no afectar consumidores.
 */

function stripDataUrl(value: string): string {
  return value.includes(',') ? value.split(',').pop() || '' : value
}

/**
 * Mapea channel de apps a targetContext del engine segun contrato 02g §6.
 * @see https://github.com/AntojadosMX/docs/blob/main/02g_MEDIA_ENGINE_INTEGRATION_CONTRACT.md#6-mapeo-de-tipos
 */
function mapTargetContext(channel: string | undefined): string {
  switch (channel) {
    case 'feed_post': return 'post'
    case 'biz_post': return 'post'
    case 'avatar': return 'avatar'
    case 'gallery': return 'gallery'
    case 'tile': return 'cover'
    default: return 'post'
  }
}

/**
 * Genera un clientReferenceId idempotente segun contrato 02g §4.
 * Formato: {channel}-{entityId}-{timestamp}
 */
function buildClientReferenceId(channel: string | undefined, entityId: string | null | undefined): string {
  const ch = channel || 'unknown'
  const id = entityId || 'anon'
  const ts = Date.now()
  return `${ch}-${id}-${ts}`
}

export async function uploadMedia(input: MediaUploadInput): Promise<MediaUploadResult> {
  if (!input.base64) throw new Error('uploadMedia: base64 requerido')

  // 1. Crear media request en el V3
  const request = await createRequest({
    sourceApp: resolveSourceApp(),
    sourceActorType: 'user',
    sourceActorId: input.entityId || 'unknown',
    targetContext: mapTargetContext(input.channel),
    mediaType: input.mediaType || 'image',
    clientReferenceId: buildClientReferenceId(input.channel, input.entityId),
  })

  // 2. Registrar derechos y origen (DEBE ir antes de uploadOriginal, contrato 02g §5.2)
  await registerRightsOrigin(request.mediaId)

  // 3. Subir archivo original (multipart)
  await uploadOriginal(request.mediaId, input.base64, input.mediaType || 'image')

  // 3. Obtener ready payload (para imágenes es inmediato, para video puede tardar)
  const cleanBase64 = stripDataUrl(input.base64)

  // Si el media es foto, intentar obtener el payload directo
  const payload = await waitForReadyPayload(request.mediaId, {
    attempts: input.mediaType === 'video' ? 80 : 5,
    intervalMs: input.mediaType === 'video' ? 3000 : 1000,
  })

  return toLegacyUploadResult(payload, request.mediaId)
}

export async function getIntakeStatus(intakeId: string): Promise<MediaUploadResult | null> {
  if (!intakeId) return null
  const payload = await waitForReadyPayload(intakeId, {
    attempts: 1,
    intervalMs: 0,
  }).catch(() => null)
  if (!payload) return null
  return toLegacyUploadResult(payload, intakeId)
}

export function resolveUploadedMediaUrl(result: MediaUploadResult): string | null {
  return result.video_720_url ||
    result.video_1080_url ||
    result.feed_url ||
    result.full_url ||
        result.media_url ||
      result.thumb_url ||
      null
}

export function requireUploadedMediaUrl(result: MediaUploadResult, context = 'media'): string {
  const mediaUrl = resolveUploadedMediaUrl(result)
  if (!mediaUrl) {
    throw new Error(`El intake de ${context} no devolvio URL normalizada.`)
  }
  return mediaUrl
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms)
  })
}

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

  const intakeId = result.intake_id
  if (!intakeId) {
    throw new Error(`El intake de ${context} no devolvio URL normalizada.`)
  }

  const attempts = options.attempts ?? 80
  const intervalMs = options.intervalMs ?? 3000

  for (let index = 0; index < attempts; index += 1) {
    if (index > 0) await delay(intervalMs)
    const payload = await getReadyPayload(intakeId)
    options.onStatus?.(
      payload ? toLegacyUploadResult(payload.payload!, intakeId) : null,
      { attempt: index + 1, attempts },
    )
    if (!payload || !payload.ready) continue
    const url = resolveUploadedMediaUrl(toLegacyUploadResult(payload.payload!, intakeId))
    if (url) return url
  }

  throw new Error(`El intake de ${context} sigue procesando el video. Intenta de nuevo en unos minutos.`)
}


