import { httpClient } from '../../../http/client'
import { API_ENDPOINTS } from '../../../http/endpoints'
import { uploadMedia } from '../media/media.service'
import type {
  Sponsor,
  SponsorDocumentUploadInput,
  SponsorInstanceStatus,
  SponsorListQuery,
} from '../../types/sponsor'

interface RawSponsor extends Record<string, unknown> {
  sponsor_id?: string
  id?: string
  user_id?: string | null
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

    placeId: null,
    businessName: stringOrNull(raw.business_name) || stringOrNull(raw.name) || '',
    category: stringOrNull(raw.category),
    cityCode: stringOrNull(raw.city_code),
    status: stringOrNull(raw.status),
  }
}

function resolveMediaUrl(apiBaseUrl: string | undefined, value: unknown): string {
  const url = String(value || '').trim()
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (url.startsWith('/') && apiBaseUrl) return `${apiBaseUrl.replace(/\/$/, '')}${url}`
  return url
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result || '')
      const base64 = result.includes(',') ? result.split(',')[1] : result
      if (!base64) {
        reject(new Error('Archivo vacio o formato invalido.'))
        return
      }
      resolve(base64)
    }
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'))
    reader.readAsDataURL(file)
  })
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

export async function uploadSponsorDocument(
  input: SponsorDocumentUploadInput,
): Promise<Record<string, unknown>> {
  const mediaBase64 = await fileToBase64(input.file)
  await uploadMedia({
    base64: mediaBase64,
    mediaType: input.file.type?.startsWith('video') ? 'video' : 'photo',
    channel: 'feed_post',
    entityId: input.userId,
  })

  const { data } = await httpClient.post<Record<string, unknown>>(
    API_ENDPOINTS.sponsors.expedienteUpload(input.instanceId),
    {
      user_id: input.userId,
      uploaded_by_tenant_user_id: input.uploadedByTenantUserId,
      doc_type: input.docType,
      file_name: input.file.name || 'documento',
      mime_type: input.file.type || 'application/octet-stream',
      size_bytes: Number(input.file.size || 0),
    },
  )
  return data
}
