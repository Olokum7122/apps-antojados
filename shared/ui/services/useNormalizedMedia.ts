/**
 * Composable para normalizar URLs de media en componentes de UI.
 *
 * ═══════════════════════════════════════════════════════════════
 * CONTRATO: Los componentes de UI NUNCA deben usar URLs de media
 * directamente. Siempre deben pasar por normalizeMediaUrl().
 *
 * Este composable garantiza que cualquier URL que se renderice
 * en un <img>, <video>, <source> o background-image pase por
 * el normalizador oficial.
 *
 * @see shared/http/config/normalize-media-url.ts
 * @see docs/14_CONTRATO_INTEGRACION_ANTOJADOS.md
 * @see docs/Refactor_Auditoria_Ecosistema_Antojados_v2.md
 * ═══════════════════════════════════════════════════════════════
 */

import { computed } from 'vue'
import { normalizeMediaUrl } from '@antojados/http/config/normalize-media-url'

/**
 * Normaliza una URL de media para uso seguro en componentes Vue.
 * Retorna una propiedad computada reactiva.
 *
 * @param url - URL cruda (puede ser string, null, undefined, o ref)
 * @returns ComputedRef<string | null> con URL normalizada
 *
 * @example
 * ```vue
 * <script setup>
 * const props = defineProps({ post: Object })
 * const mediaSrc = useNormalizedMedia(() => props.post?.mediaUrl)
 * </script>
 * <template>
 *   <img :src="mediaSrc" />
 * </template>
 * ```
 */
export function useNormalizedMedia(urlSource: () => unknown) {
  return computed(() => normalizeMediaUrl(urlSource()))
}

/**
 * Normaliza múltiples URLs de media de un post para todos los contextos.
 *
 * @param postSource - Función que retorna el objeto post (reactivo)
 * @returns Objeto con todas las URLs normalizadas
 *
 * @example
 * ```vue
 * const { mediaSrc, thumbSrc, fullSrc, videoSrc } = usePostMedia(() => props.post)
 * ```
 */
export function usePostMedia(postSource: () => Record<string, unknown> | null | undefined) {
  const post = computed(() => postSource() || {})

  const mediaSrc = computed(() => normalizeMediaUrl(post.value.mediaUrl ?? post.value.media_url ?? null))
  const thumbSrc = computed(() => normalizeMediaUrl(post.value.mediaThumbUrl ?? post.value.media_thumbnail_url ?? post.value.thumbnailUrl ?? null))
  const fullSrc = computed(() => normalizeMediaUrl(post.value.mediaFullUrl ?? post.value.media_full_url ?? post.value.fullUrl ?? null))
  const gridSrc = computed(() => normalizeMediaUrl(post.value.gridUrl ?? post.value.grid_url ?? null))
  const storySrc = computed(() => normalizeMediaUrl(post.value.storyUrl ?? post.value.story_url ?? null))
  const coverSrc = computed(() => normalizeMediaUrl(post.value.coverUrl ?? post.value.cover_url ?? null))
  const avatarSrc = computed(() => normalizeMediaUrl(post.value.avatarUrl ?? post.value.avatar_url ?? null))
  const videoSrc = computed(() => normalizeMediaUrl(post.value.videoUrl ?? post.value.video_720_url ?? post.value.video_url ?? null))
  const video1080Src = computed(() => normalizeMediaUrl(post.value.video1080Url ?? post.value.video_1080_url ?? null))
  const videoPreviewSrc = computed(() => normalizeMediaUrl(post.value.videoPreviewUrl ?? post.value.video_preview_url ?? null))

  return {
    mediaSrc,
    thumbSrc,
    fullSrc,
    gridSrc,
    storySrc,
    coverSrc,
    avatarSrc,
    videoSrc,
    video1080Src,
    videoPreviewSrc,
  }
}

/**
 * Función directa para normalizar en templates o script setup.
 * Útil cuando no necesitas reactividad computada.
 *
 * @param url - URL a normalizar
 * @returns URL normalizada o null
 */
export function normalize(url: unknown): string | null {
  return normalizeMediaUrl(url)
}
