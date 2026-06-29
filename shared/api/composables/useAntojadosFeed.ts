import { ref } from 'vue'
import { socialFeedService } from '@antojados/api/services'
import type { AntojadosFeedScope, FeedItem } from '@antojados/api/types/feed'
import {
  getCachedFeedPage,
  setCachedFeedPage,
  invalidateFeedCache,
} from '@antojados/api/services/feed/feed-cache.service'

const CACHE_TTL_MS = 60 * 1000

function normalizeFeedType(feedType: string | null | undefined): string {
  return String(feedType || '').trim().toLowerCase()
}

function normalizeMediaType(mediaType: string | null | undefined): string {
  return String(mediaType || '').trim().toLowerCase()
}

function isPachangaType(feedType: string | null | undefined): boolean {
  return ['pachanga', 'momentos'].includes(normalizeFeedType(feedType))
}

function isLaNetaType(feedType: string | null | undefined): boolean {
  return ['neta', 'la-neta', 'la_neta'].includes(normalizeFeedType(feedType))
}

function isQuePexType(feedType: string | null | undefined): boolean {
  return ['que-pex', 'que_pex', 'neta', 'la-neta', 'la_neta'].includes(normalizeFeedType(feedType))
}

function filterScopePosts(posts: FeedItem[], scope: AntojadosFeedScope): FeedItem[] {
  if (scope === 'barrio') {
    return posts.filter((post) => {
      const feedType = normalizeFeedType(post.feedType)
      const mediaType = normalizeMediaType(post.mediaType)
      const hasMedia = Boolean(post.mediaUrl || post.mediaThumbUrl)
      return (
        hasMedia &&
        (feedType === 'barrio' ||
          isPachangaType(feedType) ||
          (feedType === 'desma' && mediaType === 'video'))
      )
    })
  }

  if (scope === 'pachanga') {
    return posts.filter((post) => isPachangaType(post.feedType))
  }

  if (scope === 'que-pex' || scope === 'la-neta') {
    return posts.filter(
      (post) => isQuePexType(post.feedType) && normalizeMediaType(post.mediaType) !== 'video',
    )
  }

  if (scope === 'desma') {
    return posts.filter(
      (post) =>
        normalizeFeedType(post.feedType) === 'desma' && normalizeMediaType(post.mediaType) === 'video',
    )
  }

  return posts.filter((post) => Boolean(post.mediaUrl || post.mediaThumbUrl))
}

function buildCacheKey(scope: string, opts: Record<string, unknown>) {
  return {
    scope,
    cityCode: opts.cityCode as string | undefined,
    scopeLevel: opts.scopeLevel as string | undefined,
    scopeCode: opts.scopeCode as string | null | undefined,
  }
}

export function useAntojadosFeed(scope: AntojadosFeedScope) {
  const posts = ref<FeedItem[]>([])
  const loading = ref(false)
  const error = ref<string>('')
  const currentPage = ref(1)
  const hasMore = ref(true)
  const isLoadingMore = ref(false)

  let lastOptions: Record<string, unknown> = {}

  async function load(options: Record<string, unknown> = {}): Promise<void> {
    const page = (options.page as number) || 1

    if (!options.forceRefresh) {
      const cached = getCachedFeedPage<FeedItem>(buildCacheKey(scope, options), page, CACHE_TTL_MS)
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
      const allPosts = await socialFeedService.list({
        scope: scope === 'barrio' ? undefined : scope,
        limit: 200,
        page,
        cityCode: scope === 'barrio' && options.scopeLevel !== 'ciudad' ? undefined : (options.cityCode as string),
        scopeLevel: scope === 'barrio' ? (options.scopeLevel === 'ciudad' ? 'ciudad' : 'mexico') : (options.scopeLevel as string),
        scopeCode: options.scopeCode as string | undefined,
      })
      const filtered = filterScopePosts(allPosts, scope)
      posts.value = filtered
      currentPage.value = page
      hasMore.value = filtered.length >= 200

      setCachedFeedPage(buildCacheKey(scope, options), page, filtered)
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
      const cached = getCachedFeedPage<FeedItem>(buildCacheKey(scope, lastOptions), nextPage, CACHE_TTL_MS)
      if (cached) {
        posts.value = [...posts.value, ...cached]
        currentPage.value = nextPage
        return
      }

      const allPosts = await socialFeedService.list({
        scope: scope === 'barrio' ? undefined : scope,
        limit: 200,
        page: nextPage,
        cityCode: scope === 'barrio' && lastOptions.scopeLevel !== 'ciudad' ? undefined : (lastOptions.cityCode as string),
        scopeLevel: scope === 'barrio' ? (lastOptions.scopeLevel === 'ciudad' ? 'ciudad' : 'mexico') : (lastOptions.scopeLevel as string),
        scopeCode: lastOptions.scopeCode as string | undefined,
      })
      const filtered = filterScopePosts(allPosts, scope)
      posts.value = [...posts.value, ...filtered]
      currentPage.value = nextPage
      hasMore.value = filtered.length >= 200

      setCachedFeedPage(buildCacheKey(scope, lastOptions), nextPage, filtered)
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
    loading,
    error,
    hasMore,
    isLoadingMore,
    load,
    loadMore,
    refresh,
  }
}
