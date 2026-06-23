<template>
  <section class="pachanga-component">
    <feed-filter-bar-base
      :city-label="scopeLabel"
      :search-enabled="false"
      :search-value="searchValue"
      :suggestions="suggestions"
      :scope-options="scopeOptions"
      :active-scope-level="scopeLevel"
      stage="S1"
      variant="socialSearch"
      accent-color="primary"
      search-placeholder="Buscar ciudad para Pachanga"
      subdim-ik="PACHANGA_FILTER_BAR"
      subdim-pc="ANTOJADOS.PARA_TI.PACHANGA"
      subdim-type="SUB_COMPONENT"
      subdim-applies-to="all"
      code-component="PACHANGA.FILTER_BAR"
      class="q-mb-sm"
      @select-scope="onSelectScope"
      @open-city="isCityPickerOpen = true"
      @refresh="refreshFeed"
      @update:searchValue="onSearchUpdate"
      @commit-search="commitSearch"
      @select-suggestion="onSelectSuggestion"
    />

    <feed-gallery-base
      :items="posts"
      empty-message="Sin actividad en Pachanga"
      key-field="id"
      stage="S1"
      variant="pachangaMasonry"
      title-field="venueName"
      badge-field="authorHandle"
      subdim-ik="PACHANGA_GRID"
      subdim-pc="ANTOJADOS.PARA_TI"
      subdim-type="SUB_COMPONENT"
      subdim-applies-to="all"
      code-component="PACHANGA.GRID"
      @select="onSelect"
    >
      <template #sponsor>
        <div class="pachanga-component__sponsor">Sponsor Pachanga</div>
      </template>

      <template #empty>
        <app-empty-state message="Aun no hay publicaciones para Pachanga" />
      </template>
    </feed-gallery-base>

    <q-dialog v-model="isCityPickerOpen" position="bottom">
      <q-card class="pachanga-component__sheet bg-grey-10 text-white">
        <q-card-section>
          <div class="pachanga-component__sheet-title">Ciudad para Pachanga</div>
          <div class="pachanga-component__city-list">
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

    <publish-fab-base
      color="primary"
      text-color="dark"
      tooltip="Publicar en Pachanga"
      title="Arma la Pachanga"
      body="Sube fotos y videos del momento: arma una galeria completa o elige directo de tu camara. Lo que pase en la fiesta, aqui se queda."
      confirm-label="Vamos ->"
      guide-icon="celebration"
      image-src="/media/shared/publicar.png"
      subdim-ik="BTN_PUBLICAR"
      subdim-pc="ANTOJADOS.PARA_TI.PACHANGA"
      subdim-type="BUTTON"
      subdim-applies-to="all"
      code-component="PACHANGA.PUBLICAR"
      @confirm="onPublish"
    />
  </section>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppEmptyState from '@antojados/ui/base/AppEmptyState.vue'
import FeedFilterBarBase from '@antojados/ui/base/FeedFilterBarBase.vue'
import FeedGalleryBase from '@antojados/ui/base/FeedGalleryBase.vue'
import PublishFabBase from '@antojados/ui/base/PublishFabBase.vue'
import { useAntojadosFeed } from '@antojados/api/composables/useAntojadosFeed'
import { useLocationScope } from '@antojados/api/composables/useLocationScope'
import { useSocialActionSync } from '@antojados/api/composables/useSocialActionSync'

const router = useRouter()
const isCityPickerOpen = ref(false)
const { posts, load } = useAntojadosFeed('pachanga')
const { pushEvent } = useSocialActionSync()
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
} = useLocationScope('pachanga')

function loadFeed() {
  return load({
    cityCode: cityCode.value,
    scopeLevel: scopeLevel.value,
    scopeCode: scopeCode.value,
  })
}

function onSelect(post) {
  if (post?._sponsor) return
  void pushEvent({
    eventType: 'feed_open',
    postId: post?.id,
    placeId: post?.placeId || post?.place_id,
    targetUserId: post?.userId,
    scopeLevel: scopeLevel.value,
    scopeCode: scopeCode.value,
    cityCode: cityCode.value,
    feedScope: 'pachanga',
    channel: post?.channel || 'social',
  })
  router.push(`/red/pa-ti/pachanga/fullscreen/${post.id}?user_id=${post.userId || ''}`)
}

function onPublish() {
  router.push('/red/pa-ti/pachanga/publicar')
}

function onSelectScope(level) {
  selectScope(level)
}

function onSearchUpdate(value) {
  searchValue.value = value
}

function commitSearch() {
  if (suggestions.value[0]) onSelectSuggestion(suggestions.value[0])
}

function onSelectSuggestion(suggestion) {
  selectSuggestion(suggestion)
  isCityPickerOpen.value = false
}

function onSelectCity(code) {
  selectCityByCode(code)
  isCityPickerOpen.value = false
}

function refreshFeed() {
  void loadFeed()
}

watch([scopeLevel, scopeCode], () => {
  void loadFeed()
})

onMounted(() => {
  void loadFeed()
})
</script>

<style scoped>
.pachanga-component {
  position: relative;
  width: 100%;
  padding-bottom: 84px;
}

.pachanga-component__sponsor {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.9), rgba(239, 163, 0, 0.86));
  color: white;
  font-size: 11px;
  font-weight: 800;
}

.pachanga-component__sheet {
  width: 100vw;
  max-width: 480px;
  border-radius: 18px 18px 0 0;
}

.pachanga-component__sheet-title {
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 850;
}

.pachanga-component__city-list {
  display: grid;
  gap: 8px;
}
</style>
