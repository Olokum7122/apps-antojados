import { uploadMedia, waitForUploadedMediaUrl } from '@antojados/api/services/media/media.service'
import type { MediaType, MediaUploadResult } from '@antojados/api/types/publish'

export type MediaUploadStage =
  | 'preparing_media'
  | 'uploading_media'
  | 'processing_video'
  | 'done'

export function resolveMediaUploadStageLabel(stage: MediaUploadStage): string {
  if (stage === 'preparing_media') return 'Preparando video...'
  if (stage === 'uploading_media') return 'Subiendo video...'
  if (stage === 'processing_video') return 'Procesando video...'
  return 'Finalizando...'
}

export async function uploadPublishMediaFlow(input: {
  base64: string
  mediaType: MediaType
  channel: string
  entityId?: string | null
  entityContext?: string | null
  context: string
  onStage?: (stage: MediaUploadStage, detail?: string) => void
}): Promise<{ uploaded: MediaUploadResult; mediaUrl: string }> {
  input.onStage?.('uploading_media')

  const uploaded = await uploadMedia({
    base64: input.base64,
    mediaType: input.mediaType,
    channel: input.channel,
    entityId: input.entityId || null,
    entityContext: input.entityContext || null,
  })

  if (input.mediaType !== 'video') {
    const mediaUrl =
      uploaded.feed_url ||
      uploaded.full_url ||
      uploaded.media_url ||
      uploaded.thumb_url ||
      uploaded.media_thumbnail_url ||
      null

    if (!mediaUrl) {
      throw new Error(`El intake de ${input.context} no devolvio URL normalizada.`)
    }

    input.onStage?.('done')
    return { uploaded, mediaUrl }
  }

  input.onStage?.('processing_video')
  const mediaUrl = await waitForUploadedMediaUrl(uploaded, input.context, {
    onStatus: (status, meta) => {
      const statusLabel = status?.status || 'pending'
      input.onStage?.('processing_video', `Intento ${meta.attempt}/${meta.attempts} - ${statusLabel}`)
    },
  })

  input.onStage?.('done')
  return { uploaded, mediaUrl }
}
