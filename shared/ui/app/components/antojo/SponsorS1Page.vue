<template>
  <section class="sponsor-s1-page">
    <!-- Filter bar (solo S1) -->
    <feed-filter-bar-base
      v-if="!effectiveSponsorId"
      :city-label="scopeLabel"
      :search-enabled="false"
      :search-value="searchValue"
      :suggestions="suggestions"
      :scope-options="scopeOptions"
      :active-scope-level="scopeLevel"
      :is-filter-open="showTypeFilter"
      :spots-count="posts.length"
      stage="S1"
      variant="business"
      accent-color="primary"
      search-placeholder="Buscar ciudad o code"
      @select-scope="onSelectScope"
      @open-city="onOpenCpity"
      @toggle-filter="showTypeFilter = !showTypeFilter"
      @refresh="refreshFeed"
      @open-spots="onOpenSpots"
    />

    <!-- Type filter chips -->
    <transition name="slide-down">
      <div v-if="showTypeFilter" class="sponsor-s1-page__type-filter">
        <q-chip
          v-for="type in postTypes"
          :key="type.value"
          :selected="selectedType === type.value"
          :color="selectedType === type.value ? type.color : 'grey-9'"
          text-color="white"
          size="sm"
          clickable
          @click="onSelectType(type.value)"
        >
          {{ type.label }}
        </q-chip>
      </div>
    </transition>

    <!-- Sponsor name header (S2) -->
    <div v-if="effectiveSponsorId && sponsorName" class="sponsor-s1-page__sponsor-header">
      <button class="sponsor-s1-page__back-btn" @click="$router.back()">‹</button>
      <h2 class="sponsor-s1-page__sponsor-name">{{ sponsorName }}</h2>
    </div>

    <!-- Feed de posts -->
    <div
      v-if="posts.length"
      class="sponsor-s1-page__feed"
    >
      <sponsor-s1-base
        v-for="post in filteredPosts"
        :key="post.id"
        :post="post"
        :sponsor-id="!effectiveSponsorId ? post.publisherUserId : ''"
        class="sponsor-s1-page__post"
        @ver-sponsor="onVerSponsor"
        @open-s3="onOpenS3"
      />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="sponsor-s1-page__loading">
      <sponsor-s1-base
        v-for="i in 3"
        :key="'skel-' + i"
        :loading="true"
        class="sponsor-s1-page__post"
      />
    </div>

    <!-- Empty -->
    <app-empty-state
      v-if="!loading && !posts.length && !error"

      :message="effectiveSponsorId ? 'Este negocio no tiene publicaciones aún' : 'Sin publicaciones en esta ciudad'"
    />

    <!-- Error -->
    <app-empty-state v-if="error" :message="error" />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppEmptyState from '@antojados/ui/base/AppEmptyState.vue'
import FeedFilterBarBase from '@antojados/ui/base/FeedFilterBarBase.vue'
import SponsorS1Base from '@antojados/ui/base/SponsorS1Base.vue'
import { documentPackageService } from '@antojados/api/services'
import { useLocationScope } from '@antojados/api/composables/useLocationScope'
import type { SponsorPost, SponsorChannel } from '@antojados/api/types/document-package'

const props = defineProps({
  /** Si viene, filtra por este sponsor (S2). Si no, usa publisher_id de la ruta */
  sponsorId: { type: String, default: '' },
  /** Nombre del sponsor para mostrar en header S2 */
  sponsorName: { type: String, default: '' },
  /** Canal: 'vas_ir' | 'arre' */
  channel: { type: String, default: 'vas_ir' },
})

const router = useRouter()
const route = useRoute()

// Detectar sponsorId desde ruta si no viene por props
const effectiveSponsorId = computed(() => {
  if (props.sponsorId) return props.sponsorId
  return (route.params.publisher_id as string) || ''
})

// Detectar canal desde query params si no viene por props
const effectiveChannel = computed<SponsorChannel>(() => {
  if (props.channel) return props.channel as SponsorChannel
  return (route.query.channel as SponsorChannel) || 'vas_ir'
})

const showTypeFilter = ref(false)
const selectedType = ref('')
const isCityPickerOpen = ref(false)
const isSpotsOpen = ref(false)
const posts = ref<SponsorPost[]>([])
const loading = ref(false)
const error = ref('')

const scopeChannel = computed(() => {
  if (effectiveChannel.value === 'arre') return 'arre'
  return 'vas_ir'
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
} = useLocationScope(scopeChannel.value)

const postTypes = [
  { value: 'promo', label: 'Promo', color: 'orange-5' },
  { value: 'new_dish', label: 'Platillo', color: 'amber-4' },
  { value: 'discount', label: 'Descuento', color: 'green-5' },
  { value: 'general', label: 'General', color: 'blue-5' },
  { value: 'event', label: 'Evento', color: 'purple-5' },
]

const filteredPosts = computed(() => {
  if (!selectedType.value) return posts.value
  return posts.value.filter((post) => {
    const postType = post.documentPackage?.composicion?.tipoContent
    return postType === selectedType.value
  })
})

function loadFeed() {
  loading.value = true
  error.value = ''

  const channel = effectiveChannel.value
  const sponsorId = effectiveSponsorId.value

  const loadPromise = sponsorId
    ? documentPackageService.getBySponsor({ channel, sponsorId, limit: 30 })
    : documentPackageService.getByChannel({ channel, limit: 30 })

  loadPromise
    .then((result) => {
      posts.value = result
    })
    .catch((err) => {
      error.value = err instanceof Error ? err.message : 'No se pudo cargar el feed'
      posts.value = []
    })
    .finally(() => {
      loading.value = false
    })
}

function onVerSponsor(sponsorId: string) {
  if (sponsorId) {
    router.push({
      path: `/negocio/${sponsorId}`,
      query: { channel: effectiveChannel.value, source: 'sponsor_feed' },
    })
  }
}

function onOpenS3(postId: string, mediaIndex: number) {
  const sid = effectiveSponsorId.value || (route.query.sponsorId as string) || ''
  router.push({
    path: `/negocio/${sid}/post/${postId}`,
    query: { mediaIndex: String(mediaIndex) },
  })
}

function onSelectScope(level: string) {
  selectScope(level)
}

function onOpenCity() {
  isCityPickerOpen.value = true
}

function onOpenSpots() {
  isSpotsOpen.value = true
}

function refreshFeed() {
  loadFeed()
}

function onSelectType(type: string) {
  selectedType.value = selectedType.value === type ? '' : type
}

function onSelectCity(code: string) {
  selectCityByCode(code)
  isCityPickerOpen.value = false
}

watch([scopeLevel, scopeCode, selectedType, effectiveSponsorId], () => {
  loadFeed()
})

onMounted(() => {
  loadFeed()
})
</script>

<style scoped>
.sponsor-s1-page {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.sponsor-s1-page__type-filter {
  display: flex;
  gap: 6px;
  padding: 8px 10px;
  overflow-x: auto;
  background: #0d0f16;
  width: 100%;
}

.sponsor-s1-page__sponsor-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  width: 100%;
  background: #0d0f16;
}

.sponsor-s1-page__back-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(255,255,255,0.1);
  color: #fff;
  font-size: 22px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sponsor-s1-page__sponsor-name {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
}

.sponsor-s1-page__feed {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
  width: 100%;
  max-width: 400px;
}

.sponsor-s1-page__post {
  width: 100%;
}

.sponsor-s1-page__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
  width: 100%;
  max-width: 400px;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.18s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
