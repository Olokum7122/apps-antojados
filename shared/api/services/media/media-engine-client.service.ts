import { httpClient } from '../../../http/client'
import { API_ENDPOINTS } from '../../../http/endpoints'
import type { MediaType, MediaUploadInput, MediaUploadResult } from '../../types/publish'

/**
 * Cliente para el Media Engine V3.
 * Flujo:
 *   1. createRequest() → POST /api/media/requests → obtiene mediaId
 *   2. registerRightsOrigin() → POST /api/media/:mediaId/rights-origin → registra derechos
 *   3. uploadOriginal() → POST /api/media/:mediaId/original (multipart) → sube archivo
 *   4. getReadyPayload() → GET /api/media/:mediaId/ready-payload → URLs finales
 *      (polling hasta que status sea 'ready')
 */

export interface CreateRequestInput {
  sourceApp: string
  sourceActorType: string
  sourceActorId: string
  targetContext: string
  mediaType: string
  clientReferenceId?: string
}

export interface CreateRequestResult {
  mediaId: string
  status: string
  mediaType: string
  createdAt: string
}

/** Valores por defecto para el registro de derechos de origen (contrato 02g §5.2) */
export const RIGHTS_DEFAULT = {
  originType: 'created_in_antojados',
  ownershipType: 'creator_owned',
  rightsStatus: 'declared',
  allowPublicDisplay: true,
  allowDownload: false,
  allowShare: true,
  allowEngineWatermark: true,
  isDemoContent: false,
} as const

/**
 * Resuelve el sourceApp segun la plataforma actual.
 * Contrato 02g §5.1: valores permitidos "ios" | "android" | "explorer" | "web" | "admin"
 * En entorno browser (Quasar dev) detecta User-Agent como fallback.
 * En Capacitor (produccion) usa Capacitor.getPlatform().
 */
export function resolveSourceApp(): string {
  if (typeof globalThis !== 'undefined' && (globalThis as any).Capacitor?.getPlatform) {
    const platform = (globalThis as any).Capacitor.getPlatform()
    if (platform === 'ios') return 'ios'
    if (platform === 'android') return 'android'
  }
  // Fallback: detectar desde User-Agent
  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent.toLowerCase()
    if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) return 'ios'
    if (ua.includes('android')) return 'android'
  }
  return 'web'
}

export interface ReadyPayload {
  // ── Identity ──
  productCode: string | null
  mediaType: string | null
  orientation: string | null
  width: number | null
  height: number | null
  mimeType: string | null

  // ── Image Variants ──
  /** 320x320 center crop */
  thumbUrl: string | null
  /** 600x600 center crop */
  gridUrl: string | null
  /** 1080x1350 crop safe — feed cards */
  feedUrl: string | null
  /** Max 1440 long side — fullscreen */
  fullUrl: string | null
  /** 1080x1920 crop safe — story format */
  storyUrl: string | null
  /** 1080x608 crop safe — business cover */
  coverUrl: string | null
  /** 512x512 center crop — avatar */
  avatarUrl: string | null

  // ── Video Variants ──
  /** 720p MP4 H.264/AAC — primary feed playback */
  videoUrl: string | null
  /** 1080p MP4 H.264/AAC — fullscreen high quality */
  video1080Url: string | null
  /** 1080x1920 portrait MP4 — short-form vertical */
  shortUrl: string | null
  /** 1080x1350 or 1080x1920 MP4 — flexible feed video */
  feedVideoUrl: string | null
  /** 1080x1920 portrait MP4 — story video */
  storyVideoUrl: string | null
  /** 720x1280 image preview — video thumbnail */
  videoPreviewUrl: string | null

  // ── Video Metadata ──
  durationMs: number | null
  aspectRatio: string | null

  // ── Rights & Origin ──
  originType: string | null
  rightsStatus: string | null
  isDemoContent: boolean | null
}

export interface ReadyPayloadResponse {
  mediaId: string
  status: string
  ready: boolean
  payload: ReadyPayload | null
}

function stripDataUrl(value: string): string {
  return value.includes(',') ? value.split(',').pop() || '' : value
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteChars = atob(base64)
  const byteArrays: BlobPart[] = []
  for (let offset = 0; offset < byteChars.length; offset += 512) {
    const slice = byteChars.slice(offset, offset + 512)
    const byteNumbers = new Array(slice.length)
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i)
    }
    byteArrays.push(new Uint8Array(byteNumbers))
  }
  return new Blob(byteArrays, { type: mimeType })
}

function mimeTypeForMedia(mediaType: string): string {
  return mediaType === 'video' ? 'video/mp4' : 'image/jpeg'
}

function fileExtension(mediaType: string): string {
  return mediaType === 'video' ? 'mp4' : 'jpg'
}

/**
 * Crea un media request en el Media Engine V3.
 */
export async function createRequest(input: CreateRequestInput): Promise<CreateRequestResult> {
  const { data } = await httpClient.post<CreateRequestResult>(
    API_ENDPOINTS.media.v3.requests,
    input,
  )
  return data
}

/**
 * Registra derechos y origen de la media en el Media Engine.
 * DEBE ejecutarse antes de uploadOriginal (contrato 02g §5.2).
 */
export async function registerRightsOrigin(mediaId: string): Promise<void> {
  await httpClient.post(
    API_ENDPOINTS.media.v3.rightsOrigin(mediaId),
    RIGHTS_DEFAULT,
  )
}

/**
 * Sube el archivo original (multipart) a un media request existente.
 */
export async function uploadOriginal(
  mediaId: string,
  base64: string,
  mediaType: string,
): Promise<{ originalUrl: string; status: string }> {
  const cleaned = stripDataUrl(base64)
  const blob = base64ToBlob(cleaned, mimeTypeForMedia(mediaType))
  const ext = fileExtension(mediaType)
  const file = new File([blob], `upload.${ext}`, { type: mimeTypeForMedia(mediaType) })

  const formData = new FormData()
  formData.append('file', file)

  const { data } = await httpClient.post<{ mediaId: string; status: string; originalUrl: string }>(
    API_ENDPOINTS.media.v3.original(mediaId),
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  )
  return { originalUrl: data.originalUrl, status: data.status }
}

/**
 * Obtiene el ready payload de un media (las URLs finales procesadas).
 */
export async function getReadyPayload(mediaId: string): Promise<ReadyPayloadResponse | null> {
  try {
    const { data } = await httpClient.get<ReadyPayloadResponse>(
      API_ENDPOINTS.media.v3.readyPayload(mediaId),
    )
    return data
  } catch {
    return null
  }
}

/**
 * Hace polling del ready payload hasta que esté listo o se agoten los intentos.
 */
export async function waitForReadyPayload(
  mediaId: string,
  options: {
    attempts?: number
    intervalMs?: number
    onStatus?: (payload: ReadyPayloadResponse | null, meta: { attempt: number; attempts: number }) => void
  } = {},
): Promise<ReadyPayload> {
  const attempts = options.attempts ?? 80
  const intervalMs = options.intervalMs ?? 3000

  for (let index = 0; index < attempts; index += 1) {
    if (index > 0) {
      await new Promise((resolve) => globalThis.setTimeout(resolve, intervalMs))
    }
    const payload = await getReadyPayload(mediaId)
    options.onStatus?.(payload, { attempt: index + 1, attempts })
    if (payload?.ready && payload.payload) {
      return payload.payload
    }
  }

  throw new Error('El media no se procesó en el tiempo esperado. Intenta de nuevo.')
}

/**
 * Mapea un string de media type del Engine ('image'|'video') a MediaType ('photo'|'video').
 * El Engine usa 'image' mientras que la app usa 'photo'.
 */
function mapMediaType(raw: string | null | undefined): MediaType | null {
  if (!raw) return null
  if (raw === 'video') return 'video'
  if (raw === 'image') return 'photo'
  return null
}

/**
 * Mapea un ReadyPayloadV3 al formato MediaUploadResult que esperan los consumidores.
 * Ahora incluye TODAS las variantes del Engine V3 (MEDIA_PACKAGE_CONTRACT.md §3).
 */
export function toLegacyUploadResult(payload: ReadyPayload, mediaId: string): MediaUploadResult {
  return {
    intake_id: mediaId,
    status: 'done',
    error_msg: null,

    // Variant URLs (feed.md: biz_posts.media_url, biz_post_media.feed_url/thumb_url)
    media_url: payload.feedUrl || payload.fullUrl || payload.thumbUrl || null,
    media_thumbnail_url: payload.thumbUrl || payload.gridUrl || null,
    // Image Variants
    thumb_url: payload.thumbUrl || null,
    grid_url: payload.gridUrl || null,
    feed_url: payload.feedUrl || null,
    full_url: payload.fullUrl || null,
    story_url: payload.storyUrl || null,
    cover_url: payload.coverUrl || null,
    avatar_url: payload.avatarUrl || null,

    // Video Variants
    video_720_url: payload.videoUrl || null,
    video_1080_url: payload.video1080Url || null,
    short_url: payload.shortUrl || null,
    feed_video_url: payload.feedVideoUrl || null,
    story_video_url: payload.storyVideoUrl || null,
    video_preview_url: payload.videoPreviewUrl || null,

    // Metadata
    media_type: mapMediaType(payload.mediaType),
    duration_ms: payload.durationMs ?? null,
  }
}