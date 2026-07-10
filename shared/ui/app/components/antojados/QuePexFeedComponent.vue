<template>
  <section class="que-pex-component">
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
      search-placeholder="Buscar ciudad para Que Pex"
      subdim-ik="QUE_PEX_FILTER_BAR"
      subdim-pc="ANTOJADOS.PARA_TI.QUE_PEX"
      subdim-type="SUB_COMPONENT"
      subdim-applies-to="all"
      code-component="QUE_PEX.FILTER_BAR"
      class="q-mb-sm"
      @select-scope="onSelectScope"
      @open-city="isCityPickerOpen = true"
      @refresh="refreshFeed"
      @update:searchValue="onSearchUpdate"
      @commit-search="commitSearch"
      @select-suggestion="onSelectSuggestion"
    />

    <template v-if="loading && !posts.length">
      <feed-skeleton-card
        v-for="i in 5"
        :key="`skel-${i}`"
        :style="{ animationDelay: `${(i - 1) * 80}ms` }"
      />
    </template>

    <template v-else-if="posts.length">
      <template v-for="post in normalizedPosts" :key="post.id">
        <!-- Explorer post con composicion.blocks → tap abre short fullscreen -->
        <feed-explorer-card
          v-if="isExplorerPost(post)"
          :post="post"
          class="q-mb-sm"
          @block-tap="(block) => onExplorerBlockTap(block, post)"
        >
          <template #actions>
            <post-action-rail-base
              :actions="buildActions(post)"
              :show-counts="true"
              mode="themeAuto"
              subdim-ik="QUE_PEX_ACTION_RAIL"
              subdim-pc="ANTOJADOS.PARA_TI"
              subdim-type="SUB_COMPONENT"
              subdim-applies-to="all"
              code-component="QUE_PEX.ACTION_RAIL"
              @action="(key) => onRailAction(key, post)"
            />
          </template>
        </feed-explorer-card>

        <!-- Post legacy (sin composicion) -->
        <feed-post-card
          v-else
          :post="post"
          stage="S2"
          card-class="q-mb-sm"
          subdim-ik="QUE_PEX_POST"
          subdim-pc="ANTOJADOS.PARA_TI"
          subdim-type="SUB_COMPONENT"
          subdim-applies-to="all"
          code-component="QUE_PEX.POST_CARD"
          @open="onOpenPost"
          @author="onOpenAuthor"
          @venue="onOpenVenue"
        >
          <template #actions="{ post: item }">
            <post-action-rail-base
              :actions="buildActions(item)"
              :show-counts="true"
              mode="themeAuto"
              subdim-ik="QUE_PEX_ACTION_RAIL"
              subdim-pc="ANTOJADOS.PARA_TI"
              subdim-type="SUB_COMPONENT"
              subdim-applies-to="all"
              code-component="QUE_PEX.ACTION_RAIL"
              @action="(key) => onRailAction(key, item)"
            />
          </template>
        </feed-post-card>
      </template>
    </template>

    <app-empty-state v-else-if="!loading" message="Aun no hay publicaciones para Que Pex" />

    <!-- Explorer Short Dialog: fullscreen tipo Shorts para posts con composicion -->
    <explorer-short-dialog
      v-model="showExplorerShort"
      :items="explorerFeedItems"
      :initial-post-id="selectedExplorerPostId"
      badge-label="EXPLORER"
      accent-color="primary"
      subdim-ik="QUE_PEX_EXPLORER_SHORT"
      subdim-pc="ANTOJADOS.PARA_TI"
      code-component="QUE_PEX.EXPLORER_SHORT"
      @rail-action="onExplorerRailAction"
      @comment-submit="onExplorerComment"
    />

    <q-dialog v-model="isCityPickerOpen" position="bottom">
      <q-card class="que-pex-component__sheet bg-grey-10 text-white">
        <q-card-section>
          <div class="que-pex-component__sheet-title">Ciudad para Que Pex</div>
          <div class="que-pex-component__city-list">
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
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppEmptyState from '@antojados/ui/base/AppEmptyState.vue'
import ExplorerShortDialog from '@antojados/ui/base/ExplorerShortDialog.vue'
import FeedExplorerCard from '@antojados/ui/base/FeedExplorerCard.vue'
import FeedFilterBarBase from '@antojados/ui/base/FeedFilterBarBase.vue'
import FeedPostCard from '@antojados/ui/base/FeedPostCard.vue'
import FeedSkeletonCard from '@antojados/ui/base/FeedSkeletonCard.vue'
import PostActionRailBase from '@antojados/ui/base/PostActionRailBase.vue'
import { useAntojadosFeed } from '@antojados/api/composables/useAntojadosFeed'
import { useLocationScope } from '@antojados/api/composables/useLocationScope'
import { useSocialActionSync } from '@antojados/api/composables/useSocialActionSync'

const router = useRouter()
const isCityPickerOpen = ref(false)
const showExplorerShort = ref(false)
const selectedExplorerPostId = ref('')
const explorerFeedItems = computed(() => posts.value.filter(isExplorerPost))
const { posts, loading, load } = useAntojadosFeed('que-pex')
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
} = useLocationScope('que_pex')

const normalizedPosts = computed(() =>
  posts.value.map((post) => ({
    ...post,
    author: post.author || post.authorHandle || 'usuario',
    venue: post.venue || post.venueName || '',
    momentTag: post.momentTag || 'QuePex',
    // Que Pex no tiene calificacion — es contenido editorial
    ratingVerdicts: [],
  })),
)

function loadFeed() {
  return load({
    cityCode: cityCode.value,
    scopeLevel: scopeLevel.value,
    scopeCode: scopeCode.value,
  })
}

function buildActions(post) {
  return [
    { key: 'chocalas', label: 'Chocalas', icon: 'front_hand', count: post?.likesCount || 0 },
    { key: 'pasala', label: 'Pasala', icon: 'reply', count: post?.commentsCount || 0 },
    { key: 'morral', label: 'Morral', icon: 'backpack', count: 0 },
  ]
}

function syncAction(eventType, post, payload) {
  return pushEvent({
    eventType,
    postId: post?.id,
    placeId: post?.placeId || post?.place_id,
    userId: post?.userId,
    targetUserId: post?.userId,
    scopeLevel: scopeLevel.value,
    scopeCode: scopeCode.value,
    cityCode: cityCode.value,
    feedScope: 'que-pex',
    channel: post?.channel || 'social',
    payload,
  })
}

function onRailAction(action, post) {
  if (action === 'chocalas') void syncAction('post_like', post)
  if (action === 'pasala') void syncAction('post_share', post)
  if (action === 'morral') void syncAction('post_save', post)
}

function onOpenPost(post) {
  if (!post?.userId || !post?.id) return
  void syncAction('feed_open', post)
  router.push(`/red/que-pex/usuario/${post.userId}?post_id=${post.id}`)
}

function onOpenAuthor(post) {
  if (!post?.userId) return
  void syncAction('user_open', post)
  router.push(`/red/que-pex/usuario/${post.userId}?post_id=${post.id}`)
}

function onOpenVenue(post) {
  if (post?.place_id) {
    void syncAction('place_open', post)
    router.push(`/negocio/${post.place_id}`)
  } else {
    onOpenAuthor(post)
  }
}

function isExplorerPost(post) {
  const composicion = post?.composicion
  return !!(composicion && Array.isArray(composicion.blocks) && composicion.blocks.length > 0)
}

function onExplorerBlockTap(block, post) {
  // Tap en cualquier bloque abre el short fullscreen
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
.que-pex-component {
  width: 100%;
}

.que-pex-component__sheet {
  width: 100vw;
  max-width: 480px;
  border-radius: 18px 18px 0 0;
}

.que-pex-component__sheet-title {
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 850;
}

.que-pex-component__city-list {
  display: grid;
  gap: 8px;
}
</style>
