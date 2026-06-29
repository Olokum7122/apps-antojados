import { computed, ref } from 'vue'
import { bizFeedService } from '@antojados/api/services'
import {
  getCachedFeedPage,
  setCachedFeedPage,
  invalidateFeedCache,
} from '@antojados/api/services/feed/feed-cache.service'

const CACHE_TTL_MS = 60 * 1000

function buildCacheKey(scope: string, opts: Record<string, unknown>) {
  return {
    scope,
    cityCode: opts.cityCode as string | undefined,
    scopeLevel: opts.scopeLevel as string | undefined,
    scopeCode: opts.scopeCode as string | null | undefined,
    postType: opts.postType as string | undefined,
  }
}

export function useAntojoFeed(scope: string) {
  const posts = ref<unknown[]>([])
  const loading = ref(false)
  const error = ref('')
  const currentPage = ref(1)
  const hasMore = ref(true)
  const isLoadingMore = ref(false)

  let lastOptions: Record<string, unknown> = {}

  const filteredPosts = computed(() => {
    if (scope === 'arre') {
      return (posts.value as Record<string, unknown>[]).filter(
        (post) => post.channel === 'arre' || post.postType === 'event',
      )
    }
    return (posts.value as Record<string, unknown>[]).filter(
      (post) => post.channel !== 'arre' && post.postType !== 'event',
    )
  })

  async function load(options: Record<string, unknown> = {}): Promise<void> {
    const page = (options.page as number) || 1

    if (!options.forceRefresh) {
      const cached = getCachedFeedPage<unknown>(buildCacheKey(scope, options), page, CACHE_TTL_MS)
      if (cached) {
        posts.value = cached
        currentPage.value = page
        lastOptions = { ...options }
        return
      }
    }

    loading.value = true
    error.value = ''

    try {
      const result = await bizFeedService.list({
        feedScope: scope === 'arre' ? 'arre' : 'vas_ir',
        limit: 30,
        page,
        cityCode: options.cityCode as string | undefined,
        scopeLevel: options.scopeLevel as string | undefined,
        scopeCode: options.scopeCode as string | undefined,
        postType: options.postType as string | undefined,
      })
      posts.value = result as unknown[]
      currentPage.value = page
      hasMore.value = (result as unknown[]).length >= 30

      setCachedFeedPage(buildCacheKey(scope, options), page, result as unknown[])
      lastOptions = { ...options }
    } catch (requestError) {
      posts.value = []
      error.value =
        requestError instanceof Error ? requestError.message : 'No se pudo cargar el feed'
    } finally {
      loading.value = false
    }
  }

  async function loadMore(): Promise<void> {
    if (isLoadingMore.value || !hasMore.value) return
    isLoadingMore.value = true

    try {
      const nextPage = currentPage.value + 1
      const cached = getCachedFeedPage<unknown>(buildCacheKey(scope, lastOptions), nextPage, CACHE_TTL_MS)
      if (cached) {
        posts.value = [...posts.value, ...cached]
        currentPage.value = nextPage
        return
      }

      const result = await bizFeedService.list({
        feedScope: scope === 'arre' ? 'arre' : 'vas_ir',
        limit: 30,
        page: nextPage,
        cityCode: lastOptions.cityCode as string | undefined,
        scopeLevel: lastOptions.scopeLevel as string | undefined,
        scopeCode: lastOptions.scopeCode as string | undefined,
        postType: lastOptions.postType as string | undefined,
      })
      posts.value = [...posts.value, ...(result as unknown[])]
      currentPage.value = nextPage
      hasMore.value = (result as unknown[]).length >= 30

      setCachedFeedPage(buildCacheKey(scope, lastOptions), nextPage, result as unknown[])
    } catch (requestError) {
      error.value =
        requestError instanceof Error ? requestError.message : 'No se pudo cargar mas contenido'
    } finally {
      isLoadingMore.value = false
    }
  }

  async function refresh(): Promise<void> {
    invalidateFeedCache(buildCacheKey(scope, lastOptions))
    await load({ ...lastOptions, forceRefresh: true })
  }

  return {
    posts,
    filteredPosts,
    loading,
    error,
    hasMore,
    isLoadingMore,
    load,
    loadMore,
    refresh,
  }
}
