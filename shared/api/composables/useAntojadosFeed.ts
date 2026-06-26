import { ref } from 'vue'
import { socialFeedService } from '@antojados/api/services'
import type { AntojadosFeedScope, FeedItem } from '@antojados/api/types/feed'

function normalizeFeedType(feedType: string | null | undefined): string {
  return String(feedType || '')
    .trim()
    .toLowerCase()
}

function normalizeMediaType(mediaType: string | null | undefined): string {
  return String(mediaType || '')
    .trim()
    .toLowerCase()
}

function isPachangaType(feedType: string | null | undefined): boolean {
  const normalized = normalizeFeedType(feedType)
  return normalized === 'pachanga' || normalized === 'momentos'
}

function isLaNetaType(feedType: string | null | undefined): boolean {
  const normalized = normalizeFeedType(feedType)
  return normalized === 'neta' || normalized === 'la-neta' || normalized === 'la_neta'
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

  if (scope === 'la-neta') {
    return posts.filter(
      (post) => isLaNetaType(post.feedType) && normalizeMediaType(post.mediaType) !== 'video',
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

export function useAntojadosFeed(scope: AntojadosFeedScope) {
  const posts = ref<FeedItem[]>([])
  const loading = ref(false)
  const error = ref<string>('')

  async function load(options: { cityCode?: string; scopeLevel?: string; scopeCode?: string | null } = {}): Promise<void> {
    loading.value = true
    error.value = ''

    try {
      const allPosts = await socialFeedService.list({
        scope: scope === 'barrio' ? undefined : scope,
        limit: 200,
        cityCode: scope === 'barrio' && options.scopeLevel !== 'ciudad' ? undefined : options.cityCode,
        scopeLevel: scope === 'barrio' ? (options.scopeLevel === 'ciudad' ? 'ciudad' : 'mexico') : options.scopeLevel,
        scopeCode: options.scopeCode,
      })
      posts.value = filterScopePosts(allPosts, scope)
    } catch (requestError) {
      posts.value = []
      error.value =
        requestError instanceof Error ? requestError.message : 'No se pudo cargar el feed'
    } finally {
      loading.value = false
    }
  }

  return {
    posts,
    loading,
    error,
    load,
  }
}
