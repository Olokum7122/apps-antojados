<template>
  <section class="user-barrio-page">
    <feed-filter-bar-base
      :city-label="scopeLabel"
      :search-enabled="false"
      :search-value="searchValue"
      :suggestions="suggestions"
      :scope-options="scopeOptions"
      :active-scope-level="scopeLevel"
      :spots-count="posts.length"
      stage="S1"
      variant="social"
      accent-color="secondary"
      search-placeholder="Buscar"
      @select-scope="onSelectScope"
      @open-city="onOpenCity"
      @refresh="refreshFeed"
      @open-spots="onOpenSpots"
    />

    <div v-if="posts.length" class="user-barrio-page__feed">
      <user-s1-base
        v-for="post in posts"
        :key="post.id"
        :post="post"
        :show-chat="false"
        class="user-barrio-page__post"
        @open-s3="onOpenS3"
      />
    </div>

    <div v-if="loading" class="user-barrio-page__loading">
      <user-s1-base v-for="i in 3" :key="'skel-' + i" :loading="true" class="user-barrio-page__post" />
    </div>

    <app-empty-state
      v-if="!loading && !posts.length && !error"
      message="Sin publicaciones en Barrio por ahora"
    />

    <app-empty-state v-if="error" :message="error" />
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppEmptyState from '@antojados/ui/base/AppEmptyState.vue'
import FeedFilterBarBase from '@antojados/ui/base/FeedFilterBarBase.vue'
import UserS1Base from '@antojados/ui/base/UserS1Base.vue'
import { documentPackageService } from '@antojados/api/services'
import { useLocationScope } from '@antojados/api/composables/useLocationScope'
import type { SponsorPost } from '@antojados/api/types/document-package'
import type { ScopeLevel } from '@antojados/api/types/location'

const router = useRouter()
const posts = ref<SponsorPost[]>([])
const loading = ref(false)
const error = ref('')

const {
  scopeLevel,
  scopeCode,
  scopeLabel,
  scopeOptions,
  searchValue,
  suggestions,
  selectScope,
  selectCityByCode,
  selectSuggestion,
} = useLocationScope('barrio')

async function loadFeed() {
  loading.value = true
  error.value = ''
  try {
    // Barrio consume feed social mixto: pachanga + que_pex (contenido social horizontal)
    const [pachangaPosts, quePexPosts] = await Promise.all([
      documentPackageService.getByChannel({
        channel: 'pachanga',
        feedType: 'default',
        scopeLevel: scopeLevel.value,
        scopeCode: scopeCode.value,
        limit: 10,
      }),
      documentPackageService.getByChannel({
        channel: 'que_pex',
        feedType: 'default',
        scopeLevel: scopeLevel.value,
        scopeCode: scopeCode.value,
        limit: 10,
      }),
    ])

    const allPosts = [...pachangaPosts, ...quePexPosts]
    allPosts.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return dateB - dateA
    })
    posts.value = allPosts
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo cargar el feed'
    posts.value = []
  } finally {
    loading.value = false
  }
}

function onOpenS3(postId: string) {
  router.push({
    path: `/red/barrio/fullscreen/${postId}`,
    query: { source: 'user_feed' },
  })
}

function onSelectScope(level: string) { selectScope(level as ScopeLevel) }
function onOpenCity() {}
function onOpenSpots() {}
function refreshFeed() { loadFeed() }

watch([scopeLevel, scopeCode], () => { loadFeed() })
onMounted(() => { loadFeed() })
</script>

<style scoped>
.user-barrio-page { width: 100%; min-height: 100vh; display: flex; flex-direction: column; align-items: center; }
.user-barrio-page__feed { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 16px 0; width: 100%; max-width: 400px; }
.user-barrio-page__post { width: 100%; }
.user-barrio-page__loading { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 16px 0; width: 100%; max-width: 400px; }
</style>

