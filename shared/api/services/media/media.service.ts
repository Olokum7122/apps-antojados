import { httpClient } from '@antojados/http/client'
import { API_ENDPOINTS } from '@antojados/http/endpoints'
import type { MediaUploadInput, MediaUploadResult } from '@antojados/api/types/publish'

function stripDataUrl(value: string): string {
  return value.includes(',') ? value.split(',').pop() || '' : value
}

export async function uploadMedia(input: MediaUploadInput): Promise<MediaUploadResult> {
  if (!input.base64) throw new Error('uploadMedia: base64 requerido')

  const { data } = await httpClient.post<MediaUploadResult>(API_ENDPOINTS.media.upload, {
    media_data_base64: stripDataUrl(input.base64),
    media_type: input.mediaType,
    channel: input.channel,
    entity_id: input.entityId || null,
    entity_context: input.entityContext || null,
  })

  return data
}

export function resolveUploadedMediaUrl(result: MediaUploadResult): string | null {
  return result.media_url || result.feed_url || result.full_url || result.thumb_url || null
}
