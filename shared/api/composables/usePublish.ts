/**
 * usePublish.ts — Composable unificado para publicacion de contenido.
 *
 * Orquesta el flujo completo:
 *   1. Validar sesion
 *   2. Subir media al engine
 *   3. Crear el post (social o biz) con los campos exactos de la BD real
 *   4. Notificar resultado
 *
 * Modelo de datos real (DDL SQL):
 *   usp_publish_biz_post: @sponsor_id, @channel, @feed_type, @media_url, @doc_json
 *   usp_publish_soc_post: @user_id,   @channel, @feed_type, @media_url, @doc_json
 *
 * NO existen: place_id, user_id, title, body, post_type,
 *   publication_type, cta_label, cta_url, venue_name, caption, description,
 *   city_code, scope_level, scope_code, media_intake_id
 */

import { ref } from 'vue'
import { useQuasar } from 'quasar'
import { publishService } from '@antojados/api/services'
import { resolveMediaUploadStageLabel, uploadPublishMediaFlow } from '@antojados/api/services/media/media-publish-flow.service'
import { getSharedSession } from '@antojados/api/storage/session.storage'
import { useLocationScope } from '@antojados/api/composables/useLocationScope'
import type { MediaType } from '@antojados/api/types/publish'

export type PublishTarget = 'social' | 'biz'

export interface SocialPublishConfig {
  target: 'social'
  channel: 'barrio' | 'pachanga' | 'que_pex' | 'neta' | 'desma'
  feedType?: string
  docJson?: Record<string, unknown> | null
  redirectSuccess?: (postId: string | null) => string
}

export interface BizPublishConfig {
  target: 'biz'
  sponsorId: string
  channel: 'vas_ir' | 'arre'
  feedType?: string
  docJson?: Record<string, unknown> | null
  redirectSuccess?: (bizPostId: string | null) => string
}

export type PublishConfig = SocialPublishConfig | BizPublishConfig

export interface PublishMediaInput {
  base64: string | null
  file?: File | null
  mediaType: MediaType
  channel: 'feed_post' | 'biz_post'
  entityId?: string | null
  entityContext?: string | null
}

export function usePublish() {
  const $q = useQuasar()
  const publishing = ref(false)
  const publishingStage = ref<string>('idle')
  const publishingStageLabel = ref('Preparando...')
  const publishingStageDetail = ref('')

  function updateStage(stage: string, detail = '') {
    publishingStage.value = stage
    publishingStageDetail.value = detail
    publishingStageLabel.value = resolveMediaUploadStageLabel(stage as Parameters<typeof resolveMediaUploadStageLabel>[0])
  }

  /**
   * Publica contenido con media.
   * Valida sesion, sube media al engine, crea el post y redirige.
   */
  async function publish(
    media: PublishMediaInput | null,
    config: PublishConfig,
    options: {
      redirectTo?: string
      context?: string
      onStage?: (stage: string, detail?: string) => void
    } = {},
  ): Promise<{ postId?: string | null; bizPostId?: string | null; success: boolean }> {
    if (publishing.value) return { success: false }
    publishing.value = true
    updateStage('preparing_media')
    options.onStage?.('preparing_media')

    try {
      // 1. Validar sesion
      const session = await getSharedSession()
      if (!session?.userId) {
        throw new Error('Necesitas iniciar sesion para publicar.')
      }

      // 2. Obtener city_code y zone_code desde el estado geo persistido
      const { cityCode: geoCityCode, zoneScopeCode: geoZoneCode } = useLocationScope(config.channel as any)
      const cityCode = session.cityCode || geoCityCode.value || null
      const zoneCode = geoZoneCode.value || null

      // 3. Subir media al engine (si hay)
      let mediaUrl: string | undefined

      if (media?.base64 || media?.file) {
        const channel = media?.channel || 'feed_post'
        const flowInput = {
          base64: media?.base64 || '',
          file: media?.file || null,
          mediaType: media?.mediaType || 'photo',
          channel,
          entityId: media?.entityId || null,
          entityContext: media?.entityContext || null,
          context: options.context || 'publicacion',
          onStage: (stage: string, detail = '') => {
            updateStage(stage, detail)
            options.onStage?.(stage, detail)
          },
        }

        const result = await uploadPublishMediaFlow(flowInput)
        mediaUrl = result.uploaded.feed_url || result.uploaded.media_url || undefined
      }

      // 3. Construir doc_json solo con campos permitidos en la BD
      const docJson = config.target === 'biz'
        ? (config.docJson ? JSON.stringify(config.docJson) : null)
        : (config.docJson ? JSON.stringify(config.docJson) : null)

      // 4. Crear el post
      if (config.target === 'social') {
        const result = await publishService.createSocialPost({
          user_id: session.userId,
          channel: config.channel,
          feed_type: config.feedType || null,
          media_url: mediaUrl || null,
          doc_json: docJson,
          city_code: cityCode,
          zone_code: zoneCode,
        })

        $q.notify({ type: 'positive', message: 'Publicado.' })
        const redirect = options.redirectTo || config.redirectSuccess?.(result.post_id) || `/red/${config.channel}`
        return { postId: result.post_id, success: true }
      }

      // Biz post
      const result = await publishService.createBizPost({
        sponsor_id: config.sponsorId,
        channel: config.channel,
        feed_type: config.feedType || null,
        media_url: mediaUrl || null,
        doc_json: docJson,
        city_code: cityCode,
        zone_code: zoneCode,
      })

      $q.notify({ type: 'positive', message: 'Publicacion creada.' })
      const redirect = options.redirectTo || config.redirectSuccess?.(result.biz_post_id) || '/antojo'
      return { bizPostId: result.biz_post_id, success: true }
    } catch (error) {
      $q.notify({ type: 'negative', message: error instanceof Error ? error.message : 'No se pudo publicar.' })
      return { success: false }
    } finally {
      publishing.value = false
      updateStage('idle')
    }
  }

  return {
    publishing,
    publishingStage,
    publishingStageLabel,
    publishingStageDetail,
    publish,
    updateStage,
  }
}
