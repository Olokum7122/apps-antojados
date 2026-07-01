import { ref } from 'vue'
import { explorerFeedService } from '../services/explorers/explorer-feed.service'
import type { ExplorerFeedItem, ExplorerFeedParams } from '../types/explorer'

const DEFAULT_TENANT_ID = 'antojados-mx'

/**
 * Composable para consumir feed de publicaciones Explorer (con composicion.blocks[]).
 * Se mezcla con el feed existente de Antojados API para mostrar contenido interactivo.
 */
export function useExplorerFeed() {
  const items = ref<ExplorerFeedItem[]>([])
  const loading = ref(false)
  const error = ref<string>('')
  const hasMore = ref(true)
  const currentOffset = ref(0)
  const isLoadingMore = ref(false)

  const LIMIT = 50

  async function load(params: { feedType: string; tenantId?: string }): Promise<void> {
    const { feedType, tenantId = DEFAULT_TENANT_ID } = params

    loading.value = true
    error.value = ''

    try {
      const response = await explorerFeedService.getFeed({
        tenantId,
        feedType,
        limit: LIMIT,
        offset: 0,
      } as ExplorerFeedParams)

      items.value = response.items || []
      currentOffset.value = response.items?.length || 0
      hasMore.value = (response.total || 0) > currentOffset.value
    } catch (requestError) {
      items.value = []
      error.value =
        requestError instanceof Error ? requestError.message : 'No se pudo cargar el feed Explorer'
    } finally {
      loading.value = false
    }
  }

  async function loadMore(feedType: string, tenantId = DEFAULT_TENANT_ID): Promise<void> {
    if (isLoadingMore.value || !hasMore.value) return
    isLoadingMore.value = true

    try {
      const response = await explorerFeedService.getFeed({
        tenantId,
        feedType,
        limit: LIMIT,
        offset: currentOffset.value,
      } as ExplorerFeedParams)

      const newItems = response.items || []
      items.value = [...items.value, ...newItems]
      currentOffset.value += newItems.length
      hasMore.value = (response.total || 0) > currentOffset.value
    } catch (requestError) {
      error.value =
        requestError instanceof Error ? requestError.message : 'No se pudo cargar mas contenido'
    } finally {
      isLoadingMore.value = false
    }
  }

  return {
    items,
    loading,
    error,
    hasMore,
    isLoadingMore,
    load,
    loadMore,
  }
}