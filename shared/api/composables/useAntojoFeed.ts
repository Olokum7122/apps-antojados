import { computed, ref } from 'vue'
import { bizFeedService } from '../services'

export function useAntojoFeed(scope: string) {
  const posts = ref<Array<Record<string, unknown>>>([])
  const loading = ref(false)
  const error = ref('')

  const filteredPosts = computed(() => {
    if (scope === 'arre') {
      return posts.value.filter((post: Record<string, unknown>) => post.channel === 'arre' || post.postType === 'event')
    }

    return posts.value.filter((post: Record<string, unknown>) => post.channel !== 'arre' && post.postType !== 'event')
  })

  async function load(options: Record<string, string | undefined> = {}) {
    loading.value = true
    error.value = ''

    console.log('[TRACE useAntojoFeed] load() INICIADO scope:', scope)
    console.log('[TRACE useAntojoFeed] options:', JSON.stringify(options))

    try {
      console.log('[TRACE useAntojoFeed] llamando bizFeedService.list()...')
      const result = await bizFeedService.list({
        feedScope: scope === 'arre' ? 'arre' : 'vas_ir',
        limit: 30,
        cityCode: options.cityCode,
        scopeLevel: options.scopeLevel,
        scopeCode: options.scopeCode as string | undefined,
        postType: options.postType || undefined,
      })
      console.log('[TRACE useAntojoFeed] RESULTADO:', result?.length, 'items')
      posts.value = result
    } catch (requestError) {
      console.log('[TRACE useAntojoFeed] ERROR capturado:', requestError instanceof Error ? requestError.message : String(requestError))
      posts.value = []
      error.value =
        requestError instanceof Error ? requestError.message : 'No se pudo cargar el feed'
    } finally {
      console.log('[TRACE useAntojoFeed] load() FINALIZADO, posts:', posts.value.length)
      loading.value = false
    }
  }

  return {
    posts,
    filteredPosts,
    loading,
    error,
    load,
  }
}

