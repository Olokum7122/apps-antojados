import { httpClient } from '@antojados/http/client'
import { API_ENDPOINTS } from '@antojados/http/endpoints'
import {
  createMediaRequest,
  registerRightsOrigin,
  uploadOriginal,
  waitForReadyPayload,
} from '@antojados/api/services/media-engine/mediaEngineClient'
import type {
  Sponsor,
  SponsorDocumentUploadInput,
  SponsorInstanceStatus,
  SponsorListQuery,
} from '@antojados/api/types/sponsor'

interface RawSponsor extends Record<string, unknown> {
  sponsor_id?: string
  id?: string
  user_id?: string | null
  place_id?: string | null
  business_name?: string | null
  name?: string | null
  category?: string | null
  city_code?: string | null
  status?: string | null
}

function stringOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const text = String(value).trim()
  return text || null
}

function mapSponsor(raw: RawSponsor): Sponsor {
  return {
    sponsorId: String(raw.sponsor_id || raw.id || ''),
    userId: stringOrNull(raw.user_id),
    placeId: stringOrNull(raw.place_id),
    businessName: stringOrNull(raw.business_name) || stringOrNull(raw.name) || '',
    category: stringOrNull(raw.category),
    cityCode: stringOrNull(raw.city_code),
    status: stringOrNull(raw.status),
  }
}

export async function listSponsors(
  params: SponsorListQuery = {},
): Promise<Sponsor[]> {
  void params
  throw new Error('sponsors_list_endpoint_not_available')
}

export async function getSponsor(sponsorId: string): Promise<Sponsor> {
  void sponsorId
  throw new Error('sponsors_detail_endpoint_not_available')
}

export async function getSponsorInstanceStatus(userId: string): Promise<SponsorInstanceStatus | null> {
  const { data } = await httpClient.get<Record<string, unknown>>(API_ENDPOINTS.sponsors.myInstance, {
    params: { user_id: userId, instance_type: 'sponsor' },
  })

  const instanceId = stringOrNull(data.instance_id)
  if (!instanceId) return null

  return {
    instanceId,
    status: stringOrNull(data.status),
  }
}

export async function setupSponsorBusiness(
  instanceId: string,
  userId: string,
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const { data } = await httpClient.patch<Record<string, unknown>>(
    API_ENDPOINTS.sponsors.setupBusiness(instanceId),
    {
      user_id: userId,
      ...payload,
    },
  )
  return data
}

export async function setupSponsorBilling(
  instanceId: string,
  userId: string,
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const { data } = await httpClient.patch<Record<string, unknown>>(
    API_ENDPOINTS.sponsors.setupBilling(instanceId),
    {
      user_id: userId,
      ...payload,
    },
  )
  return data
}

export async function setupSponsorRepresentative(
  instanceId: string,
  userId: string,
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const { data } = await httpClient.patch<Record<string, unknown>>(
    API_ENDPOINTS.sponsors.setupRepresentative(instanceId),
    {
      user_id: userId,
      ...payload,
    },
  )
  return data
}

/**
 * Sube un documento de expediente al Media Engine V3.
 * DEBT-004: Migrado desde endpoint media.upload legacy.
 *
 * Flujo:
 *   1. createMediaRequest — declara metadata con targetContext 'sponsor'
 *   2. registerRightsOrigin — registra derechos como documento de negocio
 *   3. uploadOriginal — sube el archivo (multipart), acepta PDFs e imágenes
 *   4. waitForReadyPayload — polling hasta que el engine tenga el media listo
 *   5. Guarda en expediente con el mediaId del engine
 */
export async function uploadSponsorDocument(
  input: SponsorDocumentUploadInput,
): Promise<Record<string, unknown>> {
  const mimeType = input.file.type || 'application/octet-stream'
  const mediaType: 'image' | 'video' = mimeType === 'video/mp4' ? 'video' : 'image'

  const request = await createMediaRequest({
    sourceApp: 'ios',
    sourceActorType: 'sponsor',
    sourceActorId: input.userId,
    targetContext: 'sponsor',
    mediaType,
    clientReferenceId: `expediente-${input.instanceId}-${Date.now()}`,
  })

  const mediaId = request.mediaId

  await registerRightsOrigin(mediaId, {
    originType: 'business_owned',
    ownershipType: 'business_owned',
    rightsDeclaration: 'business_authorized',
    rightsStatus: 'declared',
    licenseType: 'business_provided',
    licenseScope: 'internal_only',
    allowPublicDisplay: false,
    allowDownload: true,
    allowShare: false,
    allowEngineWatermark: false,
    isDemoContent: false,
  })

  await uploadOriginal(mediaId, input.file, input.file.name || 'documento')

  const payload = await waitForReadyPayload(mediaId, {
    onStatus: (p, meta) => {
      console.log(`[sponsors] expediente ${mediaId} intento ${meta.attempt}/${meta.attempts}: ${p.status}`)
    },
  })

  const storageUrl = payload.payload?.feedUrl
    || payload.payload?.thumbUrl
    || payload.payload?.fullUrl
    || ''

  if (!storageUrl) {
    throw new Error('El Media Engine no devolvio URL para el documento.')
  }

  const { data } = await httpClient.post<Record<string, unknown>>(
    API_ENDPOINTS.sponsors.expedienteUpload(input.instanceId),
    {
      user_id: input.userId,
      uploaded_by_tenant_user_id: input.uploadedByTenantUserId,
      doc_type: input.docType,
      file_name: input.file.name || 'documento',
      storage_url: storageUrl,
      mime_type: mimeType,
      size_bytes: Number(input.file.size || 0),
      media_engine_id: mediaId,
    },
  )
  return data
}

