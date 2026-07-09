<template>
  <section class="sponsor-arre-page">
    <feed-filter-bar-base
      v-if="!isS2"
      :city-label="scopeLabel"
      :search-enabled="false"
      :search-value="searchValue"
      :suggestions="suggestions"
      :scope-options="scopeOptions"
      :active-scope-level="scopeLevel"
      :is-filter-open="showTypeFilter"
      :spots-count="cardPosts.length"
      stage="S1"
      variant="business"
      accent-color="primary"
      search-placeholder="Buscar ciudad o code"
      @select-scope="onSelectScope"
      @open-city="onOpenCity"
      @toggle-filter="showTypeFilter = !showTypeFilter"
      @refresh="refreshFeed"
      @open-spots="onOpenSpots"
    />

    <transition name="slide-down">
      <div v-if="showTypeFilter" class="sponsor-arre-page__type-filter">
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

    <div v-if="isS2" class="sponsor-arre-page__sponsor-header">
      <button class="sponsor-arre-page__back-btn" @click="goBackToS1">
        <q-icon name="arrow_back" size="22px" />
      </button>
      <h2 v-if="sponsorName" class="sponsor-arre-page__sponsor-name">{{ sponsorName }}</h2>
    </div>

    <div v-if="cardPosts.length" class="sponsor-arre-page__feed">
      <card-viewport
        v-for="post in filteredCardPosts"
        :key="post.id"
        channel="arre"
        :post="JSON.stringify(post)"
        :stage="isS2 ? 's2' : 's1'"
        class="sponsor-arre-page__post"
        @ver-sponsor="onVerSponsor"
        @open-s3="onOpenS3"
        @open-publish="goToPublish"
        @back-to-s1="goBackToS1"
      />
    </div>

    <div v-if="loading" class="sponsor-arre-page__loading">
      <div v-for="i in 3" :key="'skel-' + i" class="sponsor-arre-page__skeleton" />
    </div>

    <app-empty-state
      v-if="!loading && !cardPosts.length && !error"
      :message="isS2 ? 'Este negocio no tiene publicaciones aun' : 'Sin publicaciones en esta ciudad'"
    />
    <app-empty-state v-if="error" :message="error" />

    <!-- FAB de publicar en S2 (flotante, visible en negocio) -->
    <publish-fab-base
      v-if="isS2"
      color="primary"
      text-color="dark"
      :visible="true"
      :enabled="true"
      tooltip="Publicar en Arre"
      title="Publicar en Arre"
      body="Comparte eventos y actividades de tu negocio."
      confirm-label="Crear publicacion ->"
      guide-icon="event"
      image-src="/shared/publicar.png"
      subdim-ik="BTN_PUBLICAR"
      subdim-pc="ANTOJO.ARRE.BIZ_FEED"
      dim-code="ANTOJO.ARRE.BIZ_FEED.BTN_PUBLICAR"
      subdim-type="BUTTON"
      subdim-applies-to="sponsor"
      code-component="ANTOJO.ARRE.BIZ_FEED.FAB_PUBLICAR"
      @confirm="goToPublish"
    />
    <!-- Rail Vue en S2 sobre el card-viewport -->
    <post-action-rail-base
      v-if="isS2 && cardPosts.length"
      layout="rail"
      mode="themeAuto"
      density="compact"
      :show-counts="false"
      :actions="railActions"
      class="sponsor-arre-page__rail"
      @action="onRailAction"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import PostActionRailBase from '@antojados/ui/base/PostActionRailBase.vue'
import { useRoute, useRouter } from 'vue-router'
import AppEmptyState from '@antojados/ui/base/AppEmptyState.vue'
import FeedFilterBarBase from '@antojados/ui/base/FeedFilterBarBase.vue'
import PublishFabBase from '@antojados/ui/base/PublishFabBase.vue'
import { bizFeedService } from '@antojados/api/services'
import { useLocationScope } from '@antojados/api/composables/useLocationScope'
import { feedItemListToCardViewport } from '@antojados/ui/services/feed/feedItemToCardViewport'
import type { FeedItem } from '@antojados/api/types/feed'

const props = defineProps({
  sponsorId: { type: String, default: '' },
  sponsorName: { type: String, default: '' },
})

const CHANNEL = 'arre'
const router = useRouter()
const route = useRoute()

const isS2 = computed(() => {
  return !!(props.sponsorId || route.params.sponsor_id)
})

const publisherId = computed(() => {
  return props.sponsorId || (route.params.sponsor_id as string) || ''
})

const railActions = [
  { key: 'chocalas', label: 'Chocalas', icon: 'front_hand', count: 0 },
  { key: 'compartir', label: 'Pasala', icon: 'reply', count: 0 },
  { key: 'califica', label: 'Califica', icon: 'star_outline', count: 0 },
  { key: 'maps', label: 'Maps', icon: 'map', count: 0 },
]

function onRailAction(action: string) {
  console.log('[rail] action:', action)
}

const showTypeFilter = ref(false)
const selectedType = ref('')
const isCityPickerOpen = ref(false)
const isSpotsOpen = ref(false)
const posts = ref<FeedItem[]>([])
const loading = ref(false)
const error = ref('')

const {
  scopeLevel, scopeCode, scopeLabel, searchValue, suggestions,
  scopeOptions, selectScope, selectCityByCode, selectSuggestion,
} = useLocationScope(CHANNEL)

const postTypes = [
  { value: 'promo', label: 'Promo', color: 'orange-5' },
  { value: 'new_dish', label: 'Platillo', color: 'amber-4' },
  { value: 'discount', label: 'Descuento', color: 'green-5' },
  { value: 'general', label: 'General', color: 'blue-5' },
  { value: 'event', label: 'Evento', color: 'purple-5' },
]

const cardPosts = computed(() => feedItemListToCardViewport(posts.value))

const filteredCardPosts = computed(() => {
  if (!selectedType.value) return cardPosts.value
  return cardPosts.value.filter((post) => {
    const badgeLower = (post.docJson.badge || '').toLowerCase()
    return badgeLower === selectedType.value || badgeLower === selectedType.value.replace('_', '')
  })
})

function loadFeed() {
  loading.value = true
  error.value = ''
  const sponsorId = publisherId.value
  const feedScope = CHANNEL as 'arre'
  const loadPromise = sponsorId
    ? bizFeedService.listByPublisher(sponsorId, feedScope, { limit: 30 })
    : bizFeedService.list({ feedScope, limit: 30, cityCode: scopeCode.value || undefined, scopeLevel: scopeLevel.value || undefined })
  loadPromise
    .then((result) => { posts.value = result })
    .catch((err) => {
      error.value = err instanceof Error ? err.message : 'No se pudo cargar el feed'
      posts.value = []
    })
    .finally(() => { loading.value = false })
}

function onVerSponsor(event: CustomEvent) {
  const sponsorId = event.detail?.sponsorId
  if (sponsorId) router.push(`/antojo/arre/negocio/${sponsorId}`)
}

function onOpenS3(postId: string) {
  const sid = publisherId.value
  router.push({ path: `/antojo/arre/negocio/${sid}/post/${postId}` })
}

function goBackToS1() { router.push('/antojo/arre/agenda') }
function goToPublish() { router.push('/antojo/arre/publicar') }
function onSelectScope(level: string) { selectScope(level as any) }
function onOpenCity() { isCityPickerOpen.value = true }
function onOpenSpots() { isSpotsOpen.value = true }
function refreshFeed() { loadFeed() }
function onSelectType(type: string) { selectedType.value = selectedType.value === type ? '' : type }
function onSelectCity(code: string) { selectCityByCode(code); isCityPickerOpen.value = false }

watch([scopeLevel, scopeCode, selectedType, publisherId], () => { loadFeed() })
onMounted(() => { loadFeed() })
</script>

<style scoped>
.sponsor-arre-page { width: 100%; min-height: 100vh; display: flex; flex-direction: column; align-items: center; }
.sponsor-arre-page__type-filter { display: flex; gap: 6px; padding: 8px 10px; overflow-x: auto; background: #0d0f16; width: 100%; }
.sponsor-arre-page__sponsor-header { display: flex; align-items: center; gap: 12px; padding: 12px 16px; width: 100%; background: #0d0f16; }
.sponsor-arre-page__back-btn { width: 52px; height: 52px; min-width: 52px; min-height: 52px; border-radius: 50%; border: none; background: rgba(0,0,0,0.42); backdrop-filter: blur(8px); box-shadow: 0 8px 20px rgba(0,0,0,0.34); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; touch-action: manipulation; }
.sponsor-arre-page__sponsor-name { font-size: 18px; font-weight: 700; margin: 0; }
.sponsor-arre-page__feed { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 16px 0; width: 100%; max-width: 400px; }
.sponsor-arre-page__post { width: 100%; }
.sponsor-arre-page__loading { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 16px 0; width: 100%; max-width: 400px; }
.sponsor-arre-page__skeleton { width: 100%; height: 350px; border-radius: 28px; background: linear-gradient(90deg,#1a1d2e 0%,#2a2d3e 50%,#1a1d2e 100%); background-size: 200% 100%; animation: skeletonPulse 1000ms ease-in-out infinite; }
@keyframes skeletonPulse { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.slide-down-enter-active, .slide-down-leave-active { transition: all 0.18s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-6px); }
</style>