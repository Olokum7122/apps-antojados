import { computed, ref } from 'vue'
import { bizFeedService } from '@antojados/api/services'

export function useAntojoFeed(scope) {
  const posts = ref([])
  const loading = ref(false)
  const error = ref('')

  const filteredPosts = computed(() => {
    if (scope === 'arre') {
      return posts.value.filter((post) => post.channel === 'arre' || post.postType === 'event')
    }

    return posts.value.filter((post) => post.channel !== 'arre' && post.postType !== 'event')
  })

  async function load(options = {}) {
    loading.value = true
    error.value = ''

    try {
      posts.value = await bizFeedService.list({
        feedScope: scope === 'arre' ? 'arre' : 'vas_ir',
        limit: 30,
        cityCode: options.cityCode,
        scopeLevel: options.scopeLevel,
        scopeCode: options.scopeCode,
        postType: options.postType || undefined,
      })
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
    filteredPosts,
    loading,
    error,
    load,
  }
}
