<template>
  <section class="la-neta-component">
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
      search-placeholder="Buscar ciudad para La Neta"
      subdim-ik="LA_NETA_FILTER_BAR"
      subdim-pc="ANTOJADOS.PARA_TI.LA_NETA"
      subdim-type="SUB_COMPONENT"
      subdim-applies-to="all"
      code-component="LA_NETA.FILTER_BAR"
      class="q-mb-sm"
      @select-scope="onSelectScope"
      @open-city="isCityPickerOpen = true"
      @refresh="refreshFeed"
      @update:searchValue="onSearchUpdate"
      @commit-search="commitSearch"
      @select-suggestion="onSelectSuggestion"
    />

    <template v-if="posts.length">
      <feed-post-card
        v-for="post in normalizedPosts"
        :key="post.id"
        :post="post"
        card-class="q-mb-sm"
        subdim-ik="LA_NETA_POST"
        subdim-pc="ANTOJADOS.PARA_TI"
        subdim-type="SUB_COMPONENT"
        subdim-applies-to="all"
        code-component="LA_NETA.POST_CARD"
        @open="onOpenPost"
        @author="onOpenAuthor"
        @venue="onOpenVenue"
      >
        <template #actions="{ post: item }">
          <post-action-rail-base
            :actions="buildActions(item)"
            :show-counts="true"
            mode="themeAuto"
            subdim-ik="LA_NETA_ACTION_RAIL"
            subdim-pc="ANTOJADOS.PARA_TI"
            subdim-type="SUB_COMPONENT"
            subdim-applies-to="all"
            code-component="LA_NETA.ACTIONS"
            @action="(action) => onRailAction(action, item)"
          />
        </template>
      </feed-post-card>
    </template>

    <app-empty-state v-else message="Aun no hay resenas para La Neta" />

    <q-dialog v-model="isCityPickerOpen" position="bottom">
      <q-card class="la-neta-component__sheet bg-grey-10 text-white">
        <q-card-section>
          <div class="la-neta-component__sheet-title">Ciudad para La Neta</div>
          <div class="la-neta-component__city-list">
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
import FeedFilterBarBase from '@antojados/ui/base/FeedFilterBarBase.vue'
import FeedPostCard from '@antojados/ui/base/FeedPostCard.vue'
import PostActionRailBase from '@antojados/ui/base/PostActionRailBase.vue'
import { useAntojadosFeed } from '@antojados/api/composables/useAntojadosFeed'
import { useLocationScope } from '@antojados/api/composables/useLocationScope'
import { useSocialActionSync } from '@antojados/api/composables/useSocialActionSync'

const router = useRouter()
const isCityPickerOpen = ref(false)
const { posts, load } = useAntojadosFeed('la-neta')
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
} = useLocationScope('la_neta')

const normalizedPosts = computed(() =>
  posts.value.map((post) => ({
    ...post,
    author: post.author || post.authorHandle || 'usuario',
    venue: post.venue || post.venueName || '',
    momentTag: post.momentTag || 'LaNeta',
    ratingVerdicts: post.ratingVerdicts || [{ dim: 'taste', phrase: post.caption || 'La neta esta bueno' }],
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
    { key: 'califica', label: 'Califica', icon: 'star', count: 0 },
    { key: 'pasala', label: 'Pasala', icon: 'reply', count: post?.commentsCount || 0 },
    { key: 'morral', label: 'Morral', icon: 'backpack', count: 0 },
  ]
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
    feedScope: 'la-neta',
    channel: post?.channel || 'social',
    payload,
  })
}

function onRailAction(action, post) {
  if (action === 'chocalas') void syncAction('post_like', post)
  if (action === 'califica' && (post?.placeId || post?.place_id)) {
    void syncAction('place_rating', post, {
      source: 'la_neta_card',
      contributes_to_ranking: true,
      contributes_to_sponsor_metrics: true,
      rating_origin: 'user_domain',
    })
  }
  if (action === 'pasala') void syncAction('post_share', post)
  if (action === 'morral') void syncAction('post_save', post)
}

function onOpenPost(post) {
  if (!post?.userId || !post?.id) return
  void syncAction('feed_open', post)
  router.push(`/red/pa-ti/la-neta/usuario/${post.userId}?post_id=${post.id}`)
}

function onOpenAuthor(post) {
  if (!post?.userId) return
  void syncAction('user_open', post)
  router.push(`/red/pa-ti/la-neta/usuario/${post.userId}?post_id=${post.id}`)
}

function onOpenVenue(post) {
  if (post?.place_id) {
    void syncAction('place_open', post)
    router.push(`/negocio/${post.place_id}`)
  } else {
    onOpenAuthor(post)
  }
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
.la-neta-component {
  width: 100%;
}

.la-neta-component__sheet {
  width: 100vw;
  max-width: 480px;
  border-radius: 18px 18px 0 0;
}

.la-neta-component__sheet-title {
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 850;
}

.la-neta-component__city-list {
  display: grid;
  gap: 8px;
}
</style>
