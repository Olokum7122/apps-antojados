import { uploadMedia } from './media.service'
import type { MediaType, MediaUploadInput, MediaUploadResult } from '../../types/publish'

export type MediaUploadStage =
  | 'preparing_media'
  | 'uploading_media'
  | 'processing_image'
  | 'processing_video'
  | 'done'

export function resolveMediaUploadStageLabel(stage: MediaUploadStage): string {
  const labels: Record<MediaUploadStage, string> = {
    preparing_media: 'Preparando archivo...',
    uploading_media: 'Subiendo archivo...',
    processing_image: 'Procesando imagen...',
    processing_video: 'Procesando video...',
    done: 'Finalizando...',
  }
  return labels[stage] || 'Procesando...'
}

/**
 * Sube media al Engine y retorna el resultado de upload (sin esperar URL final).
 * DEBT-039: El Gateway resuelve la URL desde media_intake_id via resolvePostMediaFromIntake().
 * Los components ya no deben llamar waitForUploadedMediaUrl().
 *
 * @see MEDIA_PACKAGE_CONTRACT.md for delivery format
 * @see MEDIA_ENGINE_INTEGRATION_CONTRACT.md §3 for flow
 */
export async function uploadPublishMediaFlow(input: {
  base64: string
  mediaType: MediaType
  channel: MediaUploadInput['channel']
  entityId?: string | null
  entityContext?: string | null
  context: string
  onStage?: (stage: MediaUploadStage, detail?: string) => void
}): Promise<{ uploaded: MediaUploadResult }> {
  input.onStage?.('uploading_media')

  const uploaded = await uploadMedia({
    base64: input.base64,
    mediaType: input.mediaType,
    channel: input.channel,
    entityId: input.entityId || null,
    entityContext: input.entityContext || null,
  })

    input.onStage?.('done')
  return { uploaded }
}

/**
 * Returns the best URL from a MediaUploadResult for a given context.
 * Implements the fallback chain from MEDIA_PACKAGE_CONTRACT.md §4.
 *
 * @param result - The upload result from the Engine
 * @param context - Rendering context
 * @returns The best matching URL or null
 */
export function resolveMediaFromResult(
  result: MediaUploadResult,
  context: 'thumb' | 'grid' | 'feed' | 'full' | 'story' | 'cover' | 'avatar' | 'video' | 'video_1080' | 'video_preview',
): string | null {
  switch (context) {
    case 'thumb':
      return result.thumb_url || result.grid_url || result.feed_url || null
    case 'grid':
      return result.grid_url || result.thumb_url || null
    case 'feed':
      return result.feed_url || result.grid_url || result.thumb_url || null
    case 'full':
      return result.full_url || result.feed_url || null
    case 'story':
      return result.story_url || result.full_url || null
    case 'cover':
      return result.cover_url || result.feed_url || null
    case 'avatar':
      return result.avatar_url || result.thumb_url || null
    case 'video':
      return result.video_720_url || result.feed_video_url || null
    case 'video_1080':
      return result.video_1080_url || result.video_720_url || null
    case 'video_preview':
      return result.video_preview_url || result.thumb_url || null
    default:
      return result.feed_url || result.full_url || null
  }
}

