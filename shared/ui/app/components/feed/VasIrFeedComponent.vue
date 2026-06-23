<template>
  <section class="vasir-feed-component">
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
      variant="business"
      accent-color="primary"
      search-placeholder="Buscar ciudad o code"
      subdim-ik="VASIR_FILTER_BAR"
      subdim-pc="ANTOJO.VAS_IR.BIZ_FEED"
      subdim-type="SUB_COMPONENT"
      subdim-applies-to="all"
      code-component="VASIR.FILTER_BAR"
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
      <div v-if="showTypeFilter" class="vasir-feed-component__type-filter">
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

    <feed-gallery-base
      :items="filteredPosts"
      :loading="loading"
      empty-message="Sin publicaciones para este filtro"
      key-field="id"
      stage="S1"
      variant="businessMasonry"
      subdim-ik="VASIR_GALLERY"
      subdim-pc="ANTOJO.VAS_IR.BIZ_FEED"
      subdim-type="SUB_COMPONENT"
      subdim-applies-to="all"
      code-component="VASIR.GALLERY"
      @select="onSelectPost"
    >
      <template #item="{ item }">
        <media-grid-cell-base
          :post="item"
          stage="S1"
          variant="business"
          :title="item.venueName"
          :badge="item.authorHandle"
          :actions="tileActions"
          subdim-ik="VASIR.MEDIA_CELL"
          subdim-pc="ANTOJO.VAS_IR.BIZ_FEED"
          subdim-type="SUB_COMPONENT"
          subdim-applies-to="all"
          code-component="VASIR.MEDIA_CELL"
          @action="onTileAction"
        >
          <template #overlay>
            <q-badge :color="typeColor(item.postType)" text-color="dark" class="vasir-feed-component__badge">
              {{ item.postTypeLabel }}
            </q-badge>
          </template>
        </media-grid-cell-base>
      </template>

      <template #empty>
        <app-empty-state :message="error || 'Sin publicaciones en Vas Ir por ahora'" />
      </template>
    </feed-gallery-base>

    <q-dialog v-model="isCityPickerOpen" position="bottom">
      <q-card class="vasir-feed-component__sheet bg-grey-10 text-white">
        <q-card-section>
          <div class="vasir-feed-component__sheet-title">Ubicacion Vas Ir</div>
          <div class="vasir-feed-component__city-list">
            <q-btn
              v-for="city in cityOptions"
              :key="city.code"
              no-caps
              unelevated
              :color="cityCode === city.code ? 'primary' : 'grey-9'"
              :text-color="cityCode === city.code ? 'dark' : 'white'"
              :label="city.label"
              @click="onSelectCity(city.code)"
            />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="isSpotsOpen" position="bottom">
      <q-card class="vasir-feed-component__sheet bg-grey-10 text-white">
        <q-card-section>
          <div class="vasir-feed-component__sheet-title">Mis Spots</div>
          <div class="vasir-feed-component__spots">
            <article v-for="spot in savedSpots" :key="spot.id" class="vasir-feed-component__spot">
              <img :src="spot.mediaUrl" alt="" />
              <div>
                <strong>{{ spot.venueName }}</strong>
                <small>{{ spot.caption }}</small>
              </div>
              <q-btn flat round dense icon="chevron_right" color="primary" @click="onSelectPost(spot)" />
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
const showTypeFilter = ref(false)
const selectedType = ref('')
const isCityPickerOpen = ref(false)
const isSpotsOpen = ref(false)
const { filteredPosts: apiPosts, loading, error, load } = useAntojoFeed('vas-ir')
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
} = useLocationScope('vas_ir')

const postTypes = [
  { value: 'promo', label: 'Promo', color: 'orange-5' },
  { value: 'new_dish', label: 'Platillo', color: 'amber-4' },
  { value: 'discount', label: 'Descuento', color: 'green-5' },
  { value: 'general', label: 'General', color: 'blue-5' },
]

const tileActions = [
  { key: 'open', label: 'Abrir', icon: 'open_in_full' },
  { key: 'maps', label: 'Maps', icon: 'map' },
]

const filteredPosts = computed(() => {
  if (!selectedType.value) return apiPosts.value
  return apiPosts.value.filter((post) => post.postType === selectedType.value)
})
const spotsCount = computed(() => filteredPosts.value.length)
const savedSpots = computed(() => filteredPosts.value.slice(0, 4))

function typeColor(type) {
  return postTypes.find((item) => item.value === type)?.color || 'grey-7'
}

function loadFeed() {
  return load({
    cityCode: cityCode.value,
    scopeLevel: scopeLevel.value,
    scopeCode: scopeCode.value,
    postType: selectedType.value || undefined,
  })
}

function onSelectScope(level) {
  selectScope(level)
}

function onOpenCity() {
  isCityPickerOpen.value = true
}

function onOpenSpots() {
  isSpotsOpen.value = true
}

function refreshFeed() {
  void loadFeed()
}

function onSelectType(type) {
  selectedType.value = selectedType.value === type ? '' : type
}

function onSelectPost(post) {
  if (!post?.publisherUserId || post?.channel === 'arre' || post?.postType === 'event') return
  router.push({
    path: `/negocio/${post.publisherUserId}`,
    query: { post_id: post.id, source: 'biz_grid' },
  })
}

function onTileAction(actionKey, post) {
  if (actionKey === 'open') onSelectPost(post)
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

watch([scopeLevel, scopeCode, selectedType], () => {
  void loadFeed()
})

onMounted(() => {
  void loadFeed()
})
</script>

<style scoped>
.vasir-feed-component {
  width: 100%;
}

.vasir-feed-component__type-filter {
  display: flex;
  gap: 6px;
  padding: 8px 10px;
  overflow-x: auto;
  background: #0d0f16;
}

.vasir-feed-component__badge {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.3px;
}

.vasir-feed-component__sheet {
  width: 100vw;
  max-width: 480px;
  border-radius: 18px 18px 0 0;
}

.vasir-feed-component__sheet-title {
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 850;
}

.vasir-feed-component__city-list {
  display: grid;
  gap: 8px;
}

.vasir-feed-component__spots {
  display: grid;
  gap: 10px;
}

.vasir-feed-component__spot {
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
}

.vasir-feed-component__spot img {
  width: 54px;
  height: 54px;
  border-radius: 8px;
  object-fit: cover;
}

.vasir-feed-component__spot div {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.vasir-feed-component__spot strong,
.vasir-feed-component__spot small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vasir-feed-component__spot small {
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
