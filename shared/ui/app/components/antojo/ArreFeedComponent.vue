<template>
  <section class="arre-feed-component">
    <feed-filter-bar-base
      :city-label="scopeLabel"
      :search-enabled="false"
      :search-value="searchValue"
      :suggestions="suggestions"
      :scope-options="scopeOptions"
      :active-scope-level="scopeLevel"
      :is-filter-open="showTypeFilter"
      :spots-count="spotsCount"
      stage="S1"
      variant="event"
      accent-color="deep-purple-4"
      search-placeholder="Buscar ciudad o code"
      subdim-ik="ARRE_FILTER_BAR"
      subdim-pc="ANTOJO.ARRE.ARRE_FEED"
      subdim-type="SUB_COMPONENT"
      subdim-applies-to="all"
      code-component="ARRE.FILTER_BAR"
      class="q-mb-sm"
      @select-scope="onSelectScope"
      @open-city="onOpenCity"
      @toggle-filter="showTypeFilter = !showTypeFilter"
      @refresh="refreshFeed"
      @open-spots="onOpenSpots"
      @update:searchValue="onSearchUpdate"
      @commit-search="commitSearch"
      @select-suggestion="onSelectSuggestion"
    />

    <transition name="slide-down">
      <div v-if="showTypeFilter" class="arre-feed-component__type-filter">
        <q-chip selected color="deep-purple-6" text-color="white" size="sm">EVENTO</q-chip>
      </div>
    </transition>

    <feed-gallery-base
      :items="eventPosts"
      empty-message="Sin eventos en Arre por ahora"
      key-field="id"
      stage="S1"
      variant="eventMasonry"
      subdim-ik="ARRE_GALLERY"
      subdim-pc="ANTOJO.ARRE.ARRE_FEED"
      subdim-type="SUB_COMPONENT"
      subdim-applies-to="all"
      code-component="ARRE.GALLERY"
      @select="onSelectPost"
    >
      <template #item="{ item }">
        <media-grid-cell-base
          :post="item"
          stage="S1"
          variant="event"
          :title="item.venueName"
          :badge="item.authorHandle"
          :actions="tileActions"
          subdim-ik="ARRE.MEDIA_CELL"
          subdim-pc="ANTOJO.ARRE.ARRE_FEED"
          subdim-type="SUB_COMPONENT"
          subdim-applies-to="all"
          code-component="ARRE.MEDIA_CELL"
          @action="onTileAction"
        >
          <template #overlay>
            <q-badge color="deep-purple-6" text-color="white" class="arre-feed-component__badge">
              {{ item.postTypeLabel }}
            </q-badge>
          </template>
        </media-grid-cell-base>
      </template>

      <template #empty>
        <app-empty-state message="Aun no hay eventos en Arre para este filtro" />
      </template>
    </feed-gallery-base>

    <q-dialog v-model="isCityPickerOpen" position="bottom">
      <q-card class="arre-feed-component__sheet bg-grey-10 text-white">
        <q-card-section>
          <div class="arre-feed-component__sheet-title">Ubicacion Arre</div>
          <div class="arre-feed-component__city-list">
            <q-btn
              v-for="city in cityOptions"
              :key="city.code"
              no-caps
              unelevated
              :color="cityCode === city.code ? 'deep-purple-6' : 'grey-9'"
              text-color="white"
              :label="city.label"
              @click="onSelectCity(city.code)"
            />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="isSpotsOpen" position="bottom">
      <q-card class="arre-feed-component__sheet bg-grey-10 text-white">
        <q-card-section>
          <div class="arre-feed-component__sheet-title">Mis eventos</div>
          <div class="arre-feed-component__spots">
            <article v-for="spot in savedSpots" :key="spot.id" class="arre-feed-component__spot">
              <img :src="spot.mediaUrl" alt="" />
              <div>
                <strong>{{ spot.venueName }}</strong>
                <small>{{ spot.caption }}</small>
              </div>
              <q-btn flat round dense icon="chevron_right" color="deep-purple-4" @click="onSelectPost(spot)" />
            </article>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppEmptyState from '@antojados/ui/base/AppEmptyState.vue'
import FeedFilterBarBase from '@antojados/ui/base/FeedFilterBarBase.vue'
import FeedGalleryBase from '@antojados/ui/base/FeedGalleryBase.vue'
import MediaGridCellBase from '@antojados/ui/base/MediaGridCellBase.vue'
import { useAntojoFeed } from '@antojados/api/composables/useAntojoFeed'
import { useLocationScope } from '@antojados/api/composables/useLocationScope'

const router = useRouter()
const { filteredPosts: eventPosts, load } = useAntojoFeed('arre')
const spotsCount = ref(2)
const showTypeFilter = ref(false)
const isCityPickerOpen = ref(false)
const isSpotsOpen = ref(false)
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
} = useLocationScope('arre')

const tileActions = [
  { key: 'open', label: 'Abrir', icon: 'open_in_full' },
  { key: 'maps', label: 'Maps', icon: 'map' },
]
const savedSpots = computed(() => eventPosts.value.slice(0, 4))

function loadFeed() {
  return load({
    cityCode: cityCode.value,
    scopeLevel: scopeLevel.value,
    scopeCode: scopeCode.value,
  })
}

function onSelectPost(post) {
  if (!post?.publisherUserId || post?.channel !== 'arre' || post?.postType !== 'event') return
  router.push({
    path: `/antojo/arre/negocio/${post.publisherUserId}`,
    query: { post_id: post.id, source: 'arre_grid', channel: 'arre' },
  })
}

function onTileAction(actionKey, post) {
  if (actionKey === 'open') onSelectPost(post)
}

function onSelectScope(level) {
  selectScope(level)
}

function onOpenCity() {
  isCityPickerOpen.value = true
}

function onOpenSpots() {
  spotsCount.value = 2
  isSpotsOpen.value = true
}

function refreshFeed() {
  void loadFeed()
}

function onSelectCity(code) {
  selectCityByCode(code)
  isCityPickerOpen.value = false
}

function commitSearch() {
  if (suggestions.value[0]) {
    onSelectSuggestion(suggestions.value[0])
  }
}

function onSearchUpdate(value) {
  searchValue.value = value
}

function onSelectSuggestion(suggestion) {
  selectSuggestion(suggestion)
  isCityPickerOpen.value = false
}

watch([scopeLevel, scopeCode], () => {
  void loadFeed()
})

onMounted(() => {
  void loadFeed()
})
</script>

<style scoped>
.arre-feed-component {
  width: 100%;
}

.arre-feed-component__type-filter {
  display: flex;
  gap: 6px;
  padding: 8px 10px;
  overflow-x: auto;
  background: #0d0f16;
}

.arre-feed-component__badge {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.3px;
}

.arre-feed-component__sheet {
  width: 100vw;
  max-width: 480px;
  border-radius: 18px 18px 0 0;
}

.arre-feed-component__sheet-title {
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 850;
}

.arre-feed-component__city-list,
.arre-feed-component__spots {
  display: grid;
  gap: 8px;
}

.arre-feed-component__spot {
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
}

.arre-feed-component__spot img {
  width: 54px;
  height: 54px;
  border-radius: 8px;
  object-fit: cover;
}

.arre-feed-component__spot div {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.arre-feed-component__spot strong,
.arre-feed-component__spot small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.arre-feed-component__spot small {
  color: rgba(255, 255, 255, 0.62);
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
