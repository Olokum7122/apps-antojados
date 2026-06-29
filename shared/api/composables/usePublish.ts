/**
 * usePublish.ts — Composable unificado para publicacion de contenido.
 *
 * Orquesta el flujo completo:
 *   1. Validar sesion
 *   2. Subir media al engine
 *   3. Crear el post (social o biz)
 *   4. Notificar resultado
 *
 * DEBT-016: Elimina codigo duplicado en las 5 vistas de publicacion.
 */

import { ref } from 'vue'
import { useQuasar } from 'quasar'
import { publishService } from '@antojados/api/services'
import { resolveMediaUploadStageLabel, uploadPublishMediaFlow } from '@antojados/api/services/media/media-publish-flow.service'
import { getSharedSession } from '@antojados/api/storage/session.storage'
import type { MediaType } from '@antojados/api/types/publish'

export type PublishTarget = 'social' | 'biz'

export interface SocialPublishConfig {
  target: 'social'
  feedScope: 'barrio' | 'pachanga' | 'que-pex' | 'la-neta' | 'desma'
  venueName?: string | null
  caption?: string | null
  description?: string | null
  cityCode?: string | null
  scopeLevel?: string | null
  scopeCode?: string | null
  redirectSuccess?: (postId: string | null) => string
}

export interface BizPublishConfig {
  target: 'biz'
  channel: 'vas_ir' | 'arre'
  postType: string
  publicationType: string
  title: string
  body?: string | null
  ctaLabel?: string | null
  ctaUrl?: string | null
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
      /** Para override de ruta de redireccion */
      redirectTo?: string
      /** Contexto amigable para errores */
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

      // 2. Validar que haya media cuando es social (biz puede ser opcional)
      if (config.target === 'social' && !media?.base64 && !media?.file) {
        throw new Error('Selecciona una foto o video para publicar.')
      }

      // 3. Subir media al engine
      let mediaUrl: string | undefined
      let uploadedIntakeId: string | undefined

      if (media?.base64 || media?.file) {
        const channel = media?.channel || (config.target === 'social' ? 'feed_post' : 'biz_post')
        const entityId = media?.entityId || (config.target === 'biz' ? session.placeId || undefined : undefined)

        const flowInput: {
          base64: string
          file?: File | null
          mediaType: MediaType
          channel: string
          entityId?: string | null
          entityContext?: string | null
          context: string
          onStage?: (stage: string, detail?: string) => void
        } = {
          base64: media?.base64 || '',
          file: media?.file || null,
          mediaType: media?.mediaType || 'photo',
          channel,
          entityId: entityId || null,
          entityContext: media?.entityContext || null,
          context: options.context || 'publicacion',
          onStage: (stage, detail = '') => {
            updateStage(stage, detail)
            options.onStage?.(stage, detail)
          },
        }

        const result = await uploadPublishMediaFlow(flowInput)
        mediaUrl = result.mediaUrl
        uploadedIntakeId = result.uploaded.intake_id || undefined
      }

      // 4. Crear el post
      if (config.target === 'social') {
        const postId = `${config.feedScope}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

        const result = await publishService.createSocialPost({
          post_id: postId,
          user_id: session.userId,
          feed_scope: config.feedScope,
          venue_name: config.venueName?.trim() || 'Sin ubicacion',
          caption: config.caption?.trim() || null,
          description: config.description?.trim() || null,
          city_code: config.cityCode || session.cityCode || null,
          scope_level: config.scopeLevel || null,
          scope_code: config.scopeCode || null,
          media_url: mediaUrl || null,
          media_type: media?.mediaType || null,
          media_intake_id: uploadedIntakeId || null,
        })

        $q.notify({ type: 'positive', message: 'Publicado.' })

        const redirect = options.redirectTo || config.redirectSuccess?.(result.post_id) || `/red/${config.feedScope}`
        return { postId: result.post_id, success: true }
      }

      // Biz post
      if (!session.placeId) {
        throw new Error('Necesitas un negocio asignado para publicar.')
      }

      const result = await publishService.createBizPost({
        place_id: session.placeId,
        publisher_user_id: session.userId,
        channel: config.channel,
        post_type: config.postType,
        publication_type: config.publicationType,
        title: config.title,
        body: config.body?.trim() || null,
        media_url: mediaUrl || null,
        media_type: media?.mediaType || null,
        cta_label: config.ctaLabel?.trim() || null,
        cta_url: config.ctaUrl?.trim() || null,
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
