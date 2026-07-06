te<template>
  <section class="sponsor-vasir-page">
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
      @open-city="onOpenCity"
      @toggle-filter="showTypeFilter = !showTypeFilter"
      @refresh="refreshFeed"
      @open-spots="onOpenSpots"
    />

    <!-- Type filter chips -->
    <transition name="slide-down">
      <div v-if="showTypeFilter" class="sponsor-vasir-page__type-filter">
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

    <!-- Sponsor name header (S2) con retorno a S1 estilo S3 -->
    <div v-if="effectiveSponsorId" class="sponsor-vasir-page__sponsor-header">
      <button class="sponsor-vasir-page__back-btn" @click="goBackToS1">
        <q-icon name="arrow_back" size="22px" />
      </button>
      <h2 v-if="sponsorName" class="sponsor-vasir-page__sponsor-name">{{ sponsorName }}</h2>
    </div>

    <!-- Feed de posts -->
    <div
      v-if="posts.length"
      class="sponsor-vasir-page__feed"
    >
      <sponsor-s1-base
        v-for="post in filteredPosts"
        :key="post.id"
        :post="post"
        channel="vas_ir"
        :is-s2="!!effectiveSponsorId"
        :sponsor-id="!effectiveSponsorId ? post.publisherUserId : ''"
        class="sponsor-vasir-page__post"
        @ver-sponsor="onVerSponsor"
        @open-s3="onOpenS3"
      />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="sponsor-vasir-page__loading">
      <sponsor-s1-base
        v-for="i in 3"
        :key="'skel-' + i"
        :loading="true"
        class="sponsor-vasir-page__post"
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

  <!-- FAB de publicar en S2 -->
  <publish-fab-base
    v-if="effectiveSponsorId"
    color="primary"
    text-color="dark"
    :visible="fabAccess.visible"
    :enabled="fabAccess.enabled"
    tooltip="Publicar en Vas Ir"
    title="Publicar en Vas Ir"
    body="Comparte lo mejor de tu negocio: platillos, promociones y descuentos especiales.
Tu publicacion llega a antojados de toda la ciudad."
    confirm-label="Crear publicacion ->"
    guide-icon="storefront"
    image-src="/shared/publicar.png"
    subdim-ik="BTN_PUBLICAR"
    subdim-pc="ANTOJO.VAS_IR.BIZ_FEED"
    dim-code="ANTOJO.VAS_IR.BIZ_FEED.BTN_PUBLICAR"
    subdim-type="BUTTON"
    subdim-applies-to="sponsor"
    code-component="ANTOJO.VAS_IR.BIZ_FEED.FAB_PUBLICAR"
    @confirm="goToPublish"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppEmptyState from '@antojados/ui/base/AppEmptyState.vue'
import FeedFilterBarBase from '@antojados/ui/base/FeedFilterBarBase.vue'
import PublishFabBase from '@antojados/ui/base/PublishFabBase.vue'
import SponsorS1Base from '@antojados/ui/base/SponsorS1Base.vue'
import { useFabAccess } from '@antojados/ui/base/useFabAccess'
import { documentPackageService } from '@antojados/api/services'
import { useLocationScope } from '@antojados/api/composables/useLocationScope'
import type { ResolvedSponsorPost } from '@antojados/api/types/document-package'

const props = defineProps({
  /** Si viene, filtra por este sponsor (S2). Si no, usa publisher_id de la ruta */
  sponsorId: { type: String, default: '' },
  /** Nombre del sponsor para mostrar en header S2 */
  sponsorName: { type: String, default: '' },
})

const CHANNEL = 'vas_ir' as const

const router = useRouter()
const route = useRoute()

// Detectar sponsorId desde ruta si no viene por props
const effectiveSponsorId = computed(() => {
  if (props.sponsorId) return props.sponsorId
  return (route.params.publisher_id as string) || ''
})

const fabAccess = useFabAccess({
  subdimIk: 'BTN_PUBLICAR',
  subdimPc: 'ANTOJO.VAS_IR.BIZ_FEED',
  dimCode: 'ANTOJO.VAS_IR.BIZ_FEED.BTN_PUBLICAR',
  subdimType: 'BUTTON',
  subdimAppliesTo: 'sponsor',
  codeComponent: 'ANTOJO.VAS_IR.BIZ_FEED.FAB_PUBLICAR',
})

const showTypeFilter = ref(false)
const selectedType = ref('')
const isCityPickerOpen = ref(false)
const isSpotsOpen = ref(false)
const posts = ref<ResolvedSponsorPost[]>([])
const loading = ref(false)
const error = ref('')

const {
  scopeLevel,
  scopeCode,
  scopeLabel,
  searchValue,
  suggestions,
  scopeOptions,
  selectScope,
  selectCityByCode,
  selectSuggestion,
} = useLocationScope(CHANNEL)

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

  const sponsorId = effectiveSponsorId.value
  const loadPromise = sponsorId
    ? documentPackageService.getBySponsor({ channel: CHANNEL, sponsorId, limit: 30 })
    : documentPackageService.getByChannel({ channel: CHANNEL, limit: 30 })

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
    router.push(`/antojo/vas-ir/negocio/${sponsorId}`)
  }
}

function onOpenS3(postId: string, mediaIndex: number) {
  const sid = effectiveSponsorId.value || ''
  router.push({
    path: `/antojo/vas-ir/negocio/${sid}/post/${postId}`,
    query: { mediaIndex: String(mediaIndex) },
  })
}

/** Retorno de S2 a S1 dentro del canal vas_ir */
function goBackToS1() {
  router.push('/antojo/vas-ir/gallery')
}

/** Navegar a la pantalla de publicar para Vas Ir */
function goToPublish() {
  router.push('/antojo/publicar')
}

function onSelectScope(level: string) {
  selectScope(level as any)
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
.sponsor-vasir-page {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.sponsor-vasir-page__type-filter {
  display: flex;
  gap: 6px;
  padding: 8px 10px;
  overflow-x: auto;
  background: #0d0f16;
  width: 100%;
}

.sponsor-vasir-page__sponsor-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  width: 100%;
  background: #0d0f16;
}

.sponsor-vasir-page__back-btn {
  width: 52px;
  height: 52px;
  min-width: 52px;
  min-height: 52px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.42);
  backdrop-filter: blur(8px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.34);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: manipulation;
}

.sponsor-vasir-page__sponsor-name {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
}

.sponsor-vasir-page__feed {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
  width: 100%;
  max-width: 400px;
}

.sponsor-vasir-page__post {
  width: 100%;
}

.sponsor-vasir-page__loading {
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
