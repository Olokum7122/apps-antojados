<template>
  <section class="user-s1-page">
    <!-- Filter bar -->
    <feed-filter-bar-base
      :city-label="scopeLabel"
      :search-enabled="false"
      :search-value="searchValue"
      :suggestions="suggestions"
      :scope-options="scopeOptions"
      :active-scope-level="scopeLevel"
      :spots-count="posts.length"
      stage="S1"
      :variant="channelVariant"
      :accent-color="channelAccentColor"
      search-placeholder="Buscar"
      @select-scope="onSelectScope"
      @open-city="onOpenCity"
      @refresh="refreshFeed"
      @open-spots="onOpenSpots"
    />

    <!-- Feed de posts sociales (barrio / pachanga / que_pex) -->
    <div v-if="posts.length" class="user-s1-page__feed">
      <user-s1-base
        v-for="post in filteredPosts"
        :key="post.id"
        :id-post="post.id || ''"
        :id-user="post.publisherUserId || post.documentPackage?.sponsorId || ''"
        :author-handle="post.documentPackage?.authorHandle || 'usuario'"
        :media-url="post.documentPackage?.mediaUrls?.feedUrl || ''"
        :media-urls="post.documentPackage?.mediaItems?.map(m => m.feedUrl || '').filter(Boolean) || []"
        :media-type="post.documentPackage?.mediaItems?.[0]?.mediaType === 'video' ? 'video' : 'photo'"
        :show-chat="hasChat"
        :channel="post.channel || post.documentPackage?.channel || props.channel"
        class="user-s1-page__post"
        @open-chat="onOpenChat"
        @open-s3="onOpenS3"
      />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="user-s1-page__loading">
      <user-s1-base v-for="i in 3" :key="'skel-' + i" :loading="true" class="user-s1-page__post" />
    </div>

    <!-- Empty -->
    <app-empty-state
      v-if="!loading && !posts.length && !error"
      :message="emptyMessage"
    />

    <!-- Error -->
    <app-empty-state v-if="error" :message="error" />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppEmptyState from '@antojados/ui/base/AppEmptyState.vue'
import FeedFilterBarBase from '@antojados/ui/base/FeedFilterBarBase.vue'
import UserS1Base from '@antojados/ui/base/UserS1Base.vue'
import { documentPackageService } from '@antojados/api/services'
import { useLocationScope } from '@antojados/api/composables/useLocationScope'
import type { SponsorPost, Channel } from '@antojados/api/types/document-package'

const props = defineProps({
  /** Canal social: 'barrio' | 'pachanga' | 'que_pex' */
  channel: {
    type: String as () => Channel,
    default: 'barrio',
    validator: (v: string) => ['barrio', 'pachanga', 'que_pex'].includes(v),
  },
})

const router = useRouter()
const posts = ref<SponsorPost[]>([])
const loading = ref(false)
const error = ref('')

const channelConfig: Record<string, { variant: string; accentColor: string; scopeKey: string }> = {
  barrio: { variant: 'social', accentColor: 'secondary', scopeKey: 'barrio' },
  pachanga: { variant: 'socialSearch', accentColor: 'primary', scopeKey: 'pachanga' },
  que_pex: { variant: 'socialSearch', accentColor: 'deep-purple-4', scopeKey: 'que_pex' },
}

const config = computed(() => channelConfig[props.channel] || channelConfig.barrio)
const channelVariant = computed(() => config.value.variant)
const channelAccentColor = computed(() => config.value.accentColor)
const hasChat = computed(() => props.channel === 'pachanga')
const hasUserContent = computed(() => props.channel !== 'que_pex')
const emptyMessage = computed(() => {
  const names: Record<string, string> = { barrio: 'Barrio', pachanga: 'Pachanga', que_pex: 'Qué Pex' }
  return `Sin publicaciones en ${names[props.channel] || 'este feed'} por ahora`
})

const {
  cityCode,
  scopeLevel,
  scopeCode,
  scopeLabel,
  cityOptions,
  scopeOptions,
  searchValue,
  suggestions,
  selectScope,
  selectCityByCode,
  selectSuggestion,
} = useLocationScope(config.value.scopeKey)

const filteredPosts = computed(() => posts.value)

async function loadFeed() {
  loading.value = true
  error.value = ''

  try {
    // Obtener contenido del canal sin filtrar por feed_type
    // (la BD almacena todo con feed_type 'default')
    const result = await documentPackageService.getByChannel({
      channel: props.channel as Channel,
      limit: 30,
    })

    const merged = [...result]
    merged.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return dateB - dateA
    })

    posts.value = merged
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo cargar el feed'
    posts.value = []
  } finally {
    loading.value = false
  }
}

function onOpenChat(postId: string, userId: string) {
  // Navega a S2 (perfil del usuario) en modo Posts para iniciar chat
  router.push({
    path: `/${props.channel}/usuario/${userId}`,
    query: { post_id: postId, tab: 'posts', source: 'user_feed' },
  })
}

function onOpenS3(postId: string, mediaIndex: number, postChannel?: string) {
  // Si el post tiene channel 'la_neta', navegar al S3 legacy de La Neta
  const actualChannel = postChannel || props.channel
  if (actualChannel === 'la_neta') {
    // Buscar el post en la lista para obtener el userId
    const post = posts.value.find(p => p.id === postId)
    const userId = post?.publisherUserId || post?.documentPackage?.sponsorId || ''
    router.push({
      path: `/red/pa-ti/la-neta/usuario/${userId}`,
      query: { post_id: postId, source: 'user_feed' },
    })
  } else {
    router.push({
      path: `/${props.channel}/post/${postId}`,
      query: { mediaIndex: String(mediaIndex), source: 'user_feed' },
    })
  }
}

function onSelectScope(level: string) {
  selectScope(level)
}

function onOpenCity() {
  // TODO: city picker
}

function onOpenSpots() {
  // TODO: open spots
}

function refreshFeed() {
  loadFeed()
}

watch([scopeLevel, scopeCode], () => {
  loadFeed()
})

onMounted(() => {
  loadFeed()
})
</script>

<style scoped>
.user-s1-page {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.user-s1-page__feed {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
  width: 100%;
  max-width: 400px;
}

.user-s1-page__post {
  width: 100%;
}

.user-s1-page__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
  width: 100%;
  max-width: 400px;
}
</style>