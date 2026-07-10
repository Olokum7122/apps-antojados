/**
 * mediaEngineClient.ts — Cliente HTTP para ATLX Media Engine V3.
 *
 * Implementa el contrato definido en 06_API_CONTRACT.md del Media Engine.
 *
 * Endpoints:
 *   POST   /api/media/requests              -> createMediaRequest
 *   POST   /api/media/:mediaId/rights-origin -> registerRightsOrigin
 *   POST   /api/media/:mediaId/original      -> uploadOriginal (multipart)
 *   GET    /api/media/:mediaId               -> getMediaInfo
 *   GET    /api/media/:mediaId/ready-payload -> getReadyPayload
 *   GET    /api/media/:mediaId/policy        -> getPolicy
 *   POST   /api/media/:mediaId/cancel        -> cancelMedia
 */

import axios, { type AxiosInstance } from 'axios'

// ─── Config ──────────────────────────────────────────────────────────────────

function getEngineBaseUrl(): string {
  const url =
    import.meta.env.VITE_MEDIA_ENGINE_URL ||
    import.meta.env.VITE_ME_URL ||
    'http://localhost:4100'
  return url.replace(/\/+$/, '')
}

function createClient(): AxiosInstance {
  return axios.create({
    baseURL: getEngineBaseUrl(),
    timeout: 120_000,
    headers: { Accept: 'application/json' },
    maxContentLength: 500 * 1024 * 1024,
    maxBodyLength: 500 * 1024 * 1024,
  })
}

let _client: AxiosInstance | null = null
function getClient(): AxiosInstance {
  if (!_client) _client = createClient()
  return _client
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CreateMediaRequestInput {
  sourceApp: 'android' | 'ios' | 'explorer' | 'web' | 'admin'
  sourceActorType: 'user' | 'sponsor' | 'explorer' | 'employee' | 'admin' | 'system'
  sourceActorId: string
  targetContext:
    | 'post'
    | 'short'
    | 'pachanga'
    | 'profile'
    | 'sponsor'
    | 'event'
    | 'promo'
    | 'cover'
    | 'avatar'
    | 'story'
    | 'gallery'
    | 'fullscreen'
  mediaType: 'image' | 'video'
  externalContextId?: string | null
  externalTraceId?: string | null
  clientReferenceId?: string | null
  processingProfileCode?: string | null
  watermarkProfileCode?: string | null
}

export interface CreateMediaRequestResult {
  mediaId: string
  status: string
  mediaType: string
  createdAt: string
}

export interface RightsOriginInput {
  originType?:
    | 'official_antojados'
    | 'explorer_partner'
    | 'created_in_antojados'
    | 'uploaded_by_owner'
    | 'licensed_content'
    | 'external_platform'
    | 'demo_content'
    | 'unknown'
  originPlatform?: string | null
  ownershipType?:
    | 'company_owned'
    | 'licensed_to_company'
    | 'creator_owned'
    | 'business_owned'
    | 'third_party'
    | 'unknown'
  employmentGenerated?: boolean
  licenseScope?: string | null
  rightsDeclaration?: string | null
  rightsStatus?: 'pending' | 'declared' | 'approved' | 'restricted' | 'rejected'
  licenseType?: string | null
  isDemoContent?: boolean
  allowPublicDisplay?: boolean
  allowDownload?: boolean
  allowShare?: boolean
  allowEngineWatermark?: boolean
}

export interface RightsOriginResult {
  mediaId: string
  originType: string
  rightsStatus: string
  updatedAt: string
}

export interface UploadOriginalResult {
  mediaId: string
  status: string
  originalUrl: string
  sizeBytes: number
  mimeType: string
  sha256Hash: string
}

export interface ReadyPayload {
  mediaId: string
  status: 'received' | 'uploading' | 'uploaded' | 'queued' | 'processing' | 'ready' | 'failed' | 'rejected' | 'canceled' | 'expired'
  ready: boolean
  payload: {
    thumbUrl: string
    gridUrl: string
    feedUrl: string
    fullUrl: string
    coverUrl: string
    videoUrl: string
    videoPreviewUrl: string
    originType: string
    rightsStatus: string
    isDemoContent: boolean
  } | null
}

export interface MediaInfoResult {
  mediaId: string
  status: string
  mediaType: string
  sourceApp: string
  sourceActorType: string
  sourceActorId: string
  targetContext: string
  createdAt: string
}

export interface PolicyResult {
  mediaId: string
  canDisplay: boolean
  canDownload: boolean
  canShare: boolean
  watermarkPolicy: string
  isDemoContent: boolean
  rightsStatus: string
}

// ─── API Methods ─────────────────────────────────────────────────────────────

/** 1. Crear media request */
export async function createMediaRequest(
  input: CreateMediaRequestInput,
): Promise<CreateMediaRequestResult> {
  const { data } = await getClient().post<CreateMediaRequestResult>(
    '/api/media/requests',
    input,
  )
  return data
}

/** 2. Registrar derechos y origen */
export async function registerRightsOrigin(
  mediaId: string,
  input: RightsOriginInput,
): Promise<RightsOriginResult> {
  const { data } = await getClient().post<RightsOriginResult>(
    `/api/media/${encodeURIComponent(mediaId)}/rights-origin`,
    input,
  )
  return data
}

/** 3. Subir archivo original (multipart) */
export async function uploadOriginal(
  mediaId: string,
  file: Blob | File,
  fileName?: string,
): Promise<UploadOriginalResult> {
  const formData = new FormData()
  formData.append('file', file, fileName || 'media')

  const { data } = await getClient().post<UploadOriginalResult>(
    `/api/media/${encodeURIComponent(mediaId)}/original`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  )
  return data
}

/** 4. Obtener info de media (diagnostico) */
export async function getMediaInfo(mediaId: string): Promise<MediaInfoResult> {
  const { data } = await getClient().get<MediaInfoResult>(
    `/api/media/${encodeURIComponent(mediaId)}`,
  )
  return data
}

/** 5. Obtener ready payload */
export async function getReadyPayload(mediaId: string): Promise<ReadyPayload> {
  const { data } = await getClient().get<ReadyPayload>(
    `/api/media/${encodeURIComponent(mediaId)}/ready-payload`,
  )
  return data
}

/** 6. Obtener politica de derechos */
export async function getPolicy(mediaId: string): Promise<PolicyResult> {
  const { data } = await getClient().get<PolicyResult>(
    `/api/media/${encodeURIComponent(mediaId)}/policy`,
  )
  return data
}

/** 7. Cancelar media request */
export async function cancelMedia(
  mediaId: string,
  reason?: string,
): Promise<{ mediaId: string; status: string }> {
  const { data } = await getClient().post<{ mediaId: string; status: string }>(
    `/api/media/${encodeURIComponent(mediaId)}/cancel`,
    { reason },
  )
  return data
}

// ─── High-level helpers ──────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms))
}

/**
 * Hace polling al ready-payload hasta que este listo o falle.
 */
export async function waitForReadyPayload(
  mediaId: string,
  options: {
    attempts?: number
    intervalMs?: number
    onStatus?: (payload: ReadyPayload, meta: { attempt: number; attempts: number }) => void
  } = {},
): Promise<ReadyPayload> {
  const attempts = options.attempts ?? 80
  const intervalMs = options.intervalMs ?? 3000

  for (let i = 0; i < attempts; i++) {
    if (i > 0) await delay(intervalMs)

    const payload = await getReadyPayload(mediaId)
    options.onStatus?.(payload, { attempt: i + 1, attempts })

    if (payload.status === 'ready' && payload.ready && payload.payload) {
      return payload
    }

    if (payload.status === 'failed' || payload.status === 'rejected') {
      throw new Error(`Media Engine: media ${mediaId} termino en estado "${payload.status}"`)
    }
  }

  throw new Error(
    `Media Engine: media ${mediaId} no se completo despues de ${attempts} intentos. ` +
    `Ultimo estado: "${(await getReadyPayload(mediaId)).status}"`,
  )
}

/**
 * Convierte base64 a Blob para subir al engine.
 */
export function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteChars = atob(base64)
  const byteArrays: Uint8Array[] = []
  let slice = 0
  const chunkSize = 512 * 1024

  while (slice < byteChars.length) {
    const end = Math.min(slice + chunkSize, byteChars.length)
    const chunk = byteChars.slice(slice, end)
    const array = new Uint8Array(chunk.length)
    for (let i = 0; i < chunk.length; i++) {
      array[i] = chunk.charCodeAt(i)
    }
    byteArrays.push(array)
    slice = end
  }

  return new Blob(byteArrays, { type: mimeType })
}

/**
 * Mapea ReadyPayload al formato MediaUploadResult (compatibilidad).
 */
export function mapReadyPayloadToMediaResult(payload: ReadyPayload): {
  intake_id?: string | null
  status?: string | null
  thumb_url?: string | null
  feed_url?: string | null
  full_url?: string | null
  media_url?: string | null
  media_thumbnail_url?: string | null
  video_720_url?: string | null
  video_1080_url?: string | null
  error_msg?: string | null
} {
  const p = payload.payload
  if (!p) {
    return {
      intake_id: payload.mediaId,
      status: payload.status,
    }
  }

  return {
    intake_id: payload.mediaId,
    status: payload.status,
    thumb_url: p.thumbUrl,
    feed_url: p.feedUrl,
    full_url: p.fullUrl,
    media_url: p.feedUrl || p.thumbUrl || null,
    media_thumbnail_url: p.thumbUrl || null,
    video_720_url: p.videoUrl || null,
    error_msg: null,
  }
}
