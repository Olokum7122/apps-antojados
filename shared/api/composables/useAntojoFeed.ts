import { computed, ref } from 'vue'
import { bizFeedService } from '../services'
import type { BizFeedParams } from '../types/feed'

export function useAntojoFeed(scope: string) {
  const posts = ref<import('../types/feed').FeedItem[]>([])
  const loading = ref(false)
  const error = ref('')

  // filteredPosts eliminado — postType no existe en FeedItem (legacy).
  // El filtrado se hace vía load() con el feedScope correcto.

  async function load(options: Partial<BizFeedParams> = {}) {
    loading.value = true
    error.value = ''

    const feedScope = scope === 'arre' ? 'arre' : 'vas_ir'

    try {
      const result = await bizFeedService.list({
        feedScope,
        limit: options.limit || 30,
        cityCode: options.cityCode,
        zoneCode: options.zoneCode,
        scopeLevel: options.scopeLevel as string | undefined,
        ownerId: options.ownerId,
      })
      posts.value = result
    } catch (requestError) {
      posts.value = []
      error.value =
        requestError instanceof Error ? requestError.message : 'No se pudo cargar el feed'
    } finally {
      loading.value = false
    }
  }

  function refresh(options: Partial<BizFeedParams> = {}) {
    return load(options)
  }

  return {
    posts,
    loading,
    error,
    load,
    refresh,
  }
}
