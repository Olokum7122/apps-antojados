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

    <template v-if="hasExplorerPosts">
      <!-- Vista en lista para explorer posts (necesitan canvas completo) -->
      <feed-explorer-card
        v-for="post in explorerPosts"
        :key="post.id"
        :post="post"
        class="q-mb-sm"
        @block-tap="(block) => onExplorerBlockTap(block, post)"
      >
        <template #actions>
          <post-action-rail-base
            :actions="buildActions(post)"
            :show-counts="true"
            mode="themeAuto"
            subdim-ik="PACHANGA_ACTION_RAIL"
            subdim-pc="ANTOJADOS.PARA_TI"
            subdim-type="SUB_COMPONENT"
            subdim-applies-to="all"
            code-component="PACHANGA.ACTION_RAIL"
            @action="(key) => onRailAction(key, post)"
          />
        </template>
      </feed-explorer-card>
    </template>

    <feed-grid-base
      :items="legacyPosts"
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
    </feed-grid-base>

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
      title="Que quieres publicar?"
      body="Elige entre un momento de Pachanga o una resena de un lugar."
      confirm-label="Publicar momento"
      guide-icon="celebration"
      image-src="/media/shared/publicar.png"
      subdim-ik="BTN_PUBLICAR"
      subdim-pc="ANTOJADOS.PARA_TI.PACHANGA"
      subdim-type="BUTTON"
      subdim-applies-to="all"
      code-component="PACHANGA.PUBLICAR"
      @confirm="onPublish"
    >
      <template #extra-actions>
        <q-btn
          unelevated
          rounded
          no-caps
          color="secondary"
          text-color="dark"
          label="Publicar resena"
          size="md"
          @click="onPublishResena"
        />
      </template>
    </publish-fab-base>

    <!-- Explorer Short Dialog -->
    <explorer-short-dialog
      v-model="showExplorerShort"
      :items="explorerPosts"
      :initial-post-id="selectedExplorerPostId"
      badge-label="FOODIE"
      accent-color="primary"
      subdim-ik="PACHANGA_EXPLORER_SHORT"
      subdim-pc="ANTOJADOS.PARA_TI"
      code-component="PACHANGA.EXPLORER_SHORT"
      @rail-action="onExplorerRailAction"
      @comment-submit="onExplorerComment"
    />
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppEmptyState from '@antojados/ui/base/AppEmptyState.vue'
import ExplorerShortDialog from '@antojados/ui/base/ExplorerShortDialog.vue'
import FeedExplorerCard from '@antojados/ui/base/FeedExplorerCard.vue'
import FeedFilterBarBase from '@antojados/ui/base/FeedFilterBarBase.vue'
import FeedGridBase from '@antojados/ui/base/FeedGridBase.vue'
import PostActionRailBase from '@antojados/ui/base/PostActionRailBase.vue'
import PublishFabBase from '@antojados/ui/base/PublishFabBase.vue'
import { useAntojadosFeed } from '@antojados/api/composables/useAntojadosFeed'
import { useLocationScope } from '@antojados/api/composables/useLocationScope'
import { useSocialActionSync } from '@antojados/api/composables/useSocialActionSync'

const router = useRouter()
const isCityPickerOpen = ref(false)
const showExplorerShort = ref(false)
const selectedExplorerPostId = ref('')
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

function isExplorerPost(post) {
  const composicion = post?.composicion
  return !!(composicion && Array.isArray(composicion.blocks) && composicion.blocks.length > 0)
}

const explorerPosts = computed(() => posts.value.filter(isExplorerPost))
const legacyPosts = computed(() => posts.value.filter((p) => !isExplorerPost(p)))
const hasExplorerPosts = computed(() => explorerPosts.value.length > 0)

function buildActions(post) {
  return [
    { key: 'chocalas', label: 'Chocalas', icon: 'front_hand', count: post?.likesCount || 0 },
    { key: 'pasala', label: 'Pasala', icon: 'reply', count: post?.commentsCount || 0 },
    { key: 'morral', label: 'Morral', icon: 'backpack', count: 0 },
  ]
}

function onRailAction(action, post) {
  if (action === 'chocalas') void syncAction('post_like', post)
  if (action === 'pasala') void syncAction('post_share', post)
  if (action === 'morral') void syncAction('post_save', post)
}

function onExplorerBlockTap(block, post) {
  selectedExplorerPostId.value = post.id
  showExplorerShort.value = true
  void syncAction('feed_open', { ...post, id: post.id })
}

function onExplorerRailAction(action, post) {
  if (action === 'chocalas') void syncAction('post_like', post)
  if (action === 'comentar') void syncAction('comment_open', post)
  if (action === 'morral') void syncAction('post_save', post)
  if (action === 'compartir') void syncAction('post_share', post)
}

function onExplorerComment(post, text) {
  post.comments = [...(post.comments || []), { id: `local-${Date.now()}`, user: 'yo', text }]
  post.commentsCount = Number(post.commentsCount || 0) + 1
  void syncAction('post_comment', post, { text })
}

function onSelect(post) {
  if (post?._sponsor) return
  void syncAction('feed_open', post)
  router.push(`/red/pa-ti/pachanga/fullscreen/${post.id}?user_id=${post.userId || ''}`)
}

function syncAction(eventType, post, payload) {
  return pushEvent({
    eventType,
    postId: post?.id,
    placeId: post?.placeId || post?.place_id,
    publisherUserId: post?.publisherUserId,
    targetUserId: post?.userId,
    scopeLevel: scopeLevel.value,
    scopeCode: scopeCode.value,
    cityCode: cityCode.value,
    feedScope: 'pachanga',
    channel: post?.channel || 'social',
    payload,
  })
}

function onPublish() {
  router.push('/red/pa-ti/pachanga/publicar')
}

function onPublishResena() {
  router.push('/red/pa-ti/pachanga/publicar-resena')
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
