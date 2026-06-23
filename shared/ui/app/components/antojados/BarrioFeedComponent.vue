<template>
  <section class="barrio-feed-component">
    <feed-filter-bar-base
      :city-label="scopeLabel"
      :scope-options="scopeOptions"
      :active-scope-level="scopeLevel"
      :is-filter-open="showVisualFilter"
      :spots-count="spotsCount"
      stage="S1"
      variant="barrio"
      accent-color="primary"
      subdim-ik="BARRIO_FILTER_BAR"
      subdim-pc="ANTOJADOS.BARRIO"
      subdim-type="SUB_COMPONENT"
      subdim-applies-to="all"
      code-component="BARRIO.FILTER_BAR"
      class="q-mb-sm"
      @select-scope="onSelectScope"
      @open-city="onOpenCity"
      @toggle-filter="showVisualFilter = !showVisualFilter"
      @refresh="refreshFeed"
      @open-spots="onOpenSpots"
    />

    <feed-gallery-base
      :items="posts"
      :loading="loading"
      empty-message="Sin publicaciones de Barrio"
      key-field="id"
      stage="S1"
      variant="barrioMasonry"
      title-field="venueName"
      badge-field="authorHandle"
      subdim-ik="BARRIO_GALLERY"
      subdim-pc="ANTOJADOS.BARRIO"
      subdim-type="SUB_COMPONENT"
      subdim-applies-to="all"
      code-component="BARRIO.GALLERY"
      @select="onSelectPost"
    >
      <template #sponsor>
        <div class="barrio-feed-component__sponsor">Patrocinador local</div>
      </template>

      <template #empty>
        <app-empty-state :message="error || 'Aun no hay actividad en Barrio'" />
      </template>
    </feed-gallery-base>

    <q-dialog v-model="isCityPickerOpen" position="bottom">
      <q-card class="barrio-feed-component__sheet bg-grey-10 text-white">
        <q-card-section>
          <div class="barrio-feed-component__sheet-title">Ciudad para Barrio</div>
          <div class="barrio-feed-component__city-list">
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
      color="teal-7"
      text-color="white"
      tooltip="Publicar en Barrio"
      title="Muestra tu barrio"
      body="Sube fotos y videos de lo que esta pasando en tu zona: rincones, antojitos, eventos callejeros y lo que encuentres en la calle."
      confirm-label="A la calle ->"
      guide-icon="location_city"
      image-src="/media/shared/publicar.png"
      subdim-ik="BTN_PUBLICAR"
      subdim-pc="ANTOJADOS.BARRIO"
      subdim-type="BUTTON"
      subdim-applies-to="all"
      code-component="BARRIO.PUBLICAR"
      @confirm="onPublish"
    />
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppEmptyState from '@antojados/ui/base/AppEmptyState.vue'
import FeedFilterBarBase from '@antojados/ui/base/FeedFilterBarBase.vue'
import FeedGalleryBase from '@antojados/ui/base/FeedGalleryBase.vue'
import PublishFabBase from '@antojados/ui/base/PublishFabBase.vue'
import { useAntojadosFeed } from '@antojados/api/composables/useAntojadosFeed'
import { useLocationScope } from '@antojados/api/composables/useLocationScope'

const router = useRouter()
const { posts, loading, error, load } = useAntojadosFeed('barrio')
const showVisualFilter = ref(false)
const isCityPickerOpen = ref(false)
const spotsCount = computed(() => posts.value.length)
const {
  cityCode,
  scopeLevel,
  scopeCode,
  scopeLabel,
  cityOptions,
  scopeOptions,
  selectScope,
  selectCityByCode,
} = useLocationScope('barrio')

function loadFeed() {
  return load({
    cityCode: cityCode.value,
    scopeLevel: scopeLevel.value,
    scopeCode: scopeCode.value,
  })
}

function onSelectPost(post) {
  if (post?._sponsor) return
  if (String(post?.feedType || '').trim().toLowerCase() === 'desma') {
    router.push({
      path: '/red/en-el-desma',
      query: { post_id: post.id },
    })
    return
  }
  router.push(`/red/barrio/fullscreen/${post.id}?user_id=${post.userId || ''}`)
}

function onSelectScope(level) {
  selectScope(level)
}

function onOpenCity() {
  isCityPickerOpen.value = true
}

function refreshFeed() {
  void loadFeed()
}

function onOpenSpots() {
}

function onPublish() {
  router.push('/red/barrio/publicar')
}

function onSelectCity(code) {
  selectCityByCode(code)
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
.barrio-feed-component {
  position: relative;
  width: 100%;
  padding-bottom: 84px;
}

.barrio-feed-component__sponsor {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  padding: 8px;
  background: linear-gradient(135deg, rgba(239, 163, 0, 0.92), rgba(15, 23, 42, 0.92));
  color: #111827;
  font-size: 11px;
  font-weight: 800;
  text-align: center;
}

.barrio-feed-component__sheet {
  width: 100vw;
  max-width: 480px;
  border-radius: 18px 18px 0 0;
}

.barrio-feed-component__sheet-title {
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 850;
}

.barrio-feed-component__city-list {
  display: grid;
  gap: 8px;
}
</style>
