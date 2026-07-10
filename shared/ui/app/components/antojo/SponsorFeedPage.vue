<template>
  <section
    class="sponsor-feed-page"
    :data-channel="resolvedChannel"
    :data-view-id="viewId"
  >
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
      :variant="filterVariant"
      :accent-color="accentColor"
      search-placeholder="Buscar ciudad o code"
      @select-scope="onSelectScope"
      @open-city="onOpenCity"
      @toggle-filter="showTypeFilter = !showTypeFilter"
      @refresh="refreshFeed"
      @open-spots="onOpenSpots"
    />

    <transition name="slide-down">
      <div v-if="showTypeFilter" class="sponsor-feed-page__type-filter">
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

    <div v-if="isS2" class="sponsor-feed-page__sponsor-header">
      <button class="sponsor-feed-page__back-btn" @click="goBackToS1">
        <q-icon name="arrow_back" size="22px" />
      </button>
      <h2 v-if="sponsorName" class="sponsor-feed-page__sponsor-name">{{ sponsorName }}</h2>
    </div>

    <div v-if="cardPosts.length" class="sponsor-feed-page__feed">
      <card-viewport
        v-for="post in filteredCardPosts"
        :key="`${viewId}-${post.id}`"
        :ref="(el) => setCardRef(post.id, el)"
        :channel="resolvedChannel"
        :post="JSON.stringify(post)"
        :stage="isS2 ? 's2' : 's1'"
        :data-view-id="viewId"
        :data-channel="resolvedChannel"
        :data-card-index="cardPosts.indexOf(post)"
        class="sponsor-feed-page__post"
        @ver-sponsor="onVerSponsor"
        @open-s3="onOpenS3"
        @open-publish="goToPublish"
        @back-to-s1="goBackToS1"
      />
    </div>

    <div v-if="loading" class="sponsor-feed-page__loading">
      <div v-for="i in 3" :key="`${viewId}-skel-${i}`" class="sponsor-feed-page__skeleton" />
    </div>

    <app-empty-state
      v-if="!loading && !cardPosts.length && !error"
      :message="isS2 ? 'Este negocio no tiene publicaciones aun' : 'Sin publicaciones en esta ciudad'"
    />
    <app-empty-state v-if="error" :message="error" />

    <!-- FAB de publicar en S2 -->
    <publish-fab-base
      v-if="isS2"
      color="primary"
      text-color="dark"
      :visible="true"
      :enabled="true"
      :tooltip="publishTooltip"
      :title="publishTitle"
      :body="publishBody"
      confirm-label="Crear publicacion ->"
      :guide-icon="publishGuideIcon"
      image-src="/shared/publicar.png"
      subdim-ik="BTN_PUBLICAR"
      :subdim-pc="publishDimPc"
      :dim-code="publishDimCode"
      subdim-type="BUTTON"
      subdim-applies-to="sponsor"
      :code-component="publishCodeComponent"
      @confirm="goToPublish"
    />
    <!-- Rail Vue en S2 -->
    <post-action-rail-base
      v-if="isS2 && cardPosts.length"
      layout="rail"
      mode="themeAuto"
      density="compact"
      :show-counts="false"
      :actions="railActions"
      :key="`rail-${viewId}`"
      class="sponsor-feed-page__rail"
      @action="onRailAction"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import PostActionRailBase from '@antojados/ui/base/PostActionRailBase.vue'
import { useRoute, useRouter } from 'vue-router'
import AppEmptyState from '@antojados/ui/base/AppEmptyState.vue'
import FeedFilterBarBase from '@antojados/ui/base/FeedFilterBarBase.vue'
import PublishFabBase from '@antojados/ui/base/PublishFabBase.vue'
import { useAntojoFeed } from '@antojados/api/composables/useAntojoFeed'
import { useLocationScope } from '@antojados/api/composables/useLocationScope'
import { feedItemListToCardViewport } from '@antojados/ui/services/feed/feedItemToCardViewport'
import type { CardViewportPost } from '@antojados/ui/services/feed/feedItemToCardViewport'

const props = defineProps({
  channel: {
    type: String,
    default: '',
    validator: (v: string) => ['vas_ir', 'arre', ''].includes(v),
  },
  sponsorId: { type: String, default: '' },
  sponsorName: { type: String, default: '' },
})

// ─── Route/Router — DEBE ir antes de cualquier computed que use route ───
const router = useRouter()
const route = useRoute()

// Resolver channel desde props o desde la ruta
const resolvedChannel = computed<'vas_ir' | 'arre'>(() => {
  if (props.channel === 'vas_ir' || props.channel === 'arre') return props.channel
  if (route.path.includes('/antojo/arre/')) return 'arre'
  // Default (para rutas globales /negocio/:sponsor_id, etc.)
  return 'vas_ir'
})

// Alias desde resolvedChannel
const CHANNEL = computed<'vas_ir' | 'arre'>(() => resolvedChannel.value)
const isArre = computed(() => CHANNEL.value === 'arre')

// ─── View ID único por instancia ───
const viewId = `feed-${resolvedChannel.value}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

// ─── Referencias de card-viewport por post id ───
const cardRefs = new Map<string, any>()

function setCardRef(postId: string, el: any) {
  if (el) {
    cardRefs.set(`${viewId}-${postId}`, el)
  } else {
    cardRefs.delete(`${viewId}-${postId}`)
  }
}

// ─── Configuración por canal ───
const channelConfig = computed(() => {
  if (isArre) {
    return {
      filterVariant: 'event' as const,
      accentColor: 'purple-5',
      publishTooltip: 'Publicar en Arre',
      publishTitle: 'Publicar en Arre',
      publishBody: 'Comparte eventos y actividades de tu negocio.',
      publishGuideIcon: 'event',
      publishDimPc: 'ANTOJO.ARRE.ARRE_FEED',
      publishDimCode: 'ANTOJO.ARRE.ARRE_FEED.BTN_PUBLICAR',
      publishCodeComponent: 'ANTOJO.ARRE.ARRE_FEED.FAB_PUBLICAR',
      s1Route: '/antojo/arre/agenda',
      sponsorRoute: '/antojo/arre/negocio',
      publishRoute: '/antojo/arre/publicar',
      postTypes: [
        { value: 'promo', label: 'Promo', color: 'orange-5' },
        { value: 'event', label: 'Evento', color: 'purple-5' },
        { value: 'discount', label: 'Descuento', color: 'green-5' },
        { value: 'general', label: 'General', color: 'blue-5' },
      ],
    }
  }
  return {
    filterVariant: 'business' as const,
    accentColor: 'primary',
    publishTooltip: 'Publicar en Vas Ir',
    publishTitle: 'Publicar en Vas Ir',
    publishBody: 'Comparte lo mejor de tu negocio: platillos, promociones y descuentos especiales.\nTu publicacion llega a antojados de toda la ciudad.',
    publishGuideIcon: 'storefront',
    publishDimPc: 'ANTOJO.VAS_IR.BIZ_FEED',
    publishDimCode: 'ANTOJO.VAS_IR.BIZ_FEED.BTN_PUBLICAR',
    publishCodeComponent: 'ANTOJO.VAS_IR.BIZ_FEED.FAB_PUBLICAR',
    s1Route: '/antojo/vas-ir/gallery',
    sponsorRoute: '/antojo/vas-ir/negocio',
    publishRoute: '/antojo/publicar',
    postTypes: [
      { value: 'promo', label: 'Promo', color: 'orange-5' },
      { value: 'new_dish', label: 'Platillo', color: 'amber-4' },
      { value: 'discount', label: 'Descuento', color: 'green-5' },
      { value: 'general', label: 'General', color: 'blue-5' },
      { value: 'event', label: 'Evento', color: 'purple-5' },
    ],
  }
})

const filterVariant = computed(() => channelConfig.value.filterVariant)
const accentColor = computed(() => channelConfig.value.accentColor)
const publishTooltip = computed(() => channelConfig.value.publishTooltip)
const publishTitle = computed(() => channelConfig.value.publishTitle)
const publishBody = computed(() => channelConfig.value.publishBody)
const publishGuideIcon = computed(() => channelConfig.value.publishGuideIcon)
const publishDimPc = computed(() => channelConfig.value.publishDimPc)
const publishDimCode = computed(() => channelConfig.value.publishDimCode)
const publishCodeComponent = computed(() => channelConfig.value.publishCodeComponent)

// ─── S2 state ───
const isS2 = computed(() => {
  return !!(props.sponsorId || route.params.sponsor_id)
})

const publisherId = computed(() => {
  return (props.sponsorId || route.params.sponsor_id as string || '').trim()
})

// ─── Rail actions ───
const railActions = [
  { key: 'chocalas', label: 'Chocalas', icon: 'front_hand', count: 0 },
  { key: 'compartir', label: 'Pasala', icon: 'reply', count: 0 },
  { key: 'califica', label: 'Califica', icon: 'star_outline', count: 0 },
  { key: 'maps', label: 'Maps', icon: 'map', count: 0 },
]

function onRailAction(_action: string) {
  // Future: handle like, share, maps, etc.
}

// ─── Feed state via useAntojoFeed composable ───
const showTypeFilter = ref(false)
const selectedType = ref('')
const isCityPickerOpen = ref(false)
const isSpotsOpen = ref(false)

// ─── Location scope (singleton pero con feedKey propio) ───
const {
  scopeLevel, scopeCode, scopeLabel, searchValue, suggestions,
  scopeOptions, selectScope, selectCityByCode, selectSuggestion,
  zoneScopeCode,
} = useLocationScope(CHANNEL.value)

const antojoFeed = useAntojoFeed(CHANNEL.value)
const posts = antojoFeed.posts
const loading = antojoFeed.loading
const error = antojoFeed.error

const postTypes = computed(() => channelConfig.value.postTypes)

const cardPosts = computed(() => feedItemListToCardViewport(posts.value))

const filteredCardPosts = computed(() => {
  if (!selectedType.value) return cardPosts.value
  return cardPosts.value.filter((post) => {
    const badgeLower = (post.docJson.badge || '').toLowerCase()
    return badgeLower === selectedType.value || badgeLower === selectedType.value.replace('_', '')
  })
})

// ─── Route path guard (específico por canal) ───
const routeGuardPrefix = computed(() => {
  if (route.path.includes('/antojo/arre/')) return '/antojo/arre/'
  if (route.path.includes('/antojo/vas-ir/')) return '/antojo/vas-ir/'
  if (route.path.startsWith('/negocio/')) return '/negocio/'
  return '/antojo/vas-ir/'
})

function loadFeed() {
  const prefix = routeGuardPrefix.value
  if (!route.path.startsWith(prefix)) return

  const sid = publisherId.value

  const feedOptions: Record<string, string | undefined> = {
    cityCode: undefined,
    zoneCode: undefined,
    scopeLevel: scopeLevel.value || undefined,
    ownerId: sid || undefined,
  }

  if (scopeLevel.value === 'zona') {
    feedOptions.zoneCode = zoneScopeCode.value || undefined
  } else if (scopeLevel.value !== 'mexico' && scopeLevel.value !== 'global') {
    feedOptions.cityCode = scopeCode.value || undefined
  }

  antojoFeed.load(feedOptions)
}

// ─── Navegación ───
function onVerSponsor(event: CustomEvent) {
  const sponsorId = event.detail?.sponsorId
  const fromChannel = event.detail?.channel
  if (sponsorId) {
    // Si el evento viene con channel explícito (del Web Component),
    // navegar a la ruta específica de ese canal
    if (fromChannel === 'arre') {
      router.push(`/antojo/arre/negocio/${sponsorId}`)
    } else if (fromChannel === 'vas_ir') {
      router.push(`/antojo/vas-ir/negocio/${sponsorId}`)
    } else {
      // Fallback: ruta interna del canal de esta página
      router.push(`${channelConfig.value.sponsorRoute}/${sponsorId}`)
    }
  }
}

function onOpenS3(postId: string) {
  const sid = publisherId.value
  router.push({ path: `${channelConfig.value.sponsorRoute}/${sid}/post/${postId}` })
}

function goBackToS1() {
  router.push(channelConfig.value.s1Route)
}

function goToPublish() {
  router.push(channelConfig.value.publishRoute)
}

function onSelectScope(level: string) { selectScope(level as any) }
function onOpenCity() { isCityPickerOpen.value = true }
function onOpenSpots() { isSpotsOpen.value = true }
function refreshFeed() { loadFeed() }
function onSelectType(type: string) { selectedType.value = selectedType.value === type ? '' : type }
function onSelectCity(code: string) { selectCityByCode(code); isCityPickerOpen.value = false }

// ─── Watchers ───
const stopWatch = watch(
  [scopeLevel, scopeCode, zoneScopeCode, selectedType, publisherId],
  () => { loadFeed() },
)

onMounted(() => { loadFeed() })

onBeforeUnmount(() => {
  stopWatch()
  cardRefs.clear()
})
</script>

<style scoped>
.sponsor-feed-page {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.sponsor-feed-page__type-filter {
  display: flex;
  gap: 6px;
  padding: 8px 10px;
  overflow-x: auto;
  background: #0d0f16;
  width: 100%;
}
.sponsor-feed-page__sponsor-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  width: 100%;
  background: #0d0f16;
}
.sponsor-feed-page__back-btn {
  width: 52px;
  height: 52px;
  min-width: 52px;
  min-height: 52px;
  border-radius: 50%;
  border: none;
  background: rgba(0,0,0,0.42);
  backdrop-filter: blur(8px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.34);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: manipulation;
}
.sponsor-feed-page__sponsor-name {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
}
.sponsor-feed-page__feed {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
  width: 100%;
  max-width: 400px;
}
.sponsor-feed-page__post {
  width: 100%;
}
.sponsor-feed-page__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
  width: 100%;
  max-width: 400px;
}
.sponsor-feed-page__skeleton {
  width: 100%;
  height: 350px;
  border-radius: 28px;
  background: linear-gradient(90deg,#1a1d2e 0%,#2a2d3e 50%,#1a1d2e 100%);
  background-size: 200% 100%;
  animation: skeletonPulse 1000ms ease-in-out infinite;
}
@keyframes skeletonPulse {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
.sponsor-feed-page__rail {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2500;
  width: auto;
  max-width: calc(100% - 32px);
}
.slide-down-enter-active, .slide-down-leave-active {
  transition: all 0.18s ease;
}
.slide-down-enter-from, .slide-down-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
