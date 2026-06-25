<template>
  <section class="barrio-fullscreen-view">
    <feed-fullscreen-base
      :model-value="true"
      stage="S3"
      presentation="inline"
      variant="barrio"
      :post="post"
      :show-action-rail="true"
      :action-rail-actions="actions"
      action-rail-density="compact"
      media-fit="contain"
      :associated-items="associatedPosts"
      associated-variant="barrioMasonry"
      associated-model="androidMosaic"
      associated-tile-variant="barrio"
      associated-subdim-ik="BARRIO_FULLSCREEN_ASSOCIATED"
      associated-subdim-pc="ANTOJADOS.BARRIO"
      associated-subdim-type="SUB_COMPONENT"
      associated-subdim-applies-to="all"
      associated-code-component="BARRIO.FULLSCREEN_ASSOCIATED"
      :show-comments="true"
      :comments="comments"
      comments-variant="barrio"
      comments-title="Barrio responde"
      comments-placeholder="Comenta esta publicacion..."
      comments-empty-message="Se el primero en comentar en Barrio."
      comments-subdim-ik="BARRIO_FULLSCREEN_COMMENTS"
      comments-subdim-pc="ANTOJADOS.BARRIO"
      comments-subdim-type="SUB_COMPONENT"
      comments-subdim-applies-to="all"
      comments-code-component="BARRIO.FULLSCREEN_COMMENTS"
      subdim-ik="BARRIO_FULLSCREEN"
      subdim-pc="ANTOJADOS.BARRIO"
      subdim-type="FULLSCREEN"
      subdim-applies-to="all"
      code-component="BARRIO.FULLSCREEN"
      @close="goBack"
      @rail-action="onRailAction"
      @select-associated="openAssociatedPost"
      @send-comment="addComment"
    >
      <template #overlay="{ post: item }">
        <div class="barrio-fullscreen-view__copy">
          <q-badge color="primary" text-color="dark">BARRIO</q-badge>
          <h2>{{ item.venueName }}</h2>
          <p>{{ item.caption }}</p>
        </div>
      </template>
    </feed-fullscreen-base>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FeedFullscreenBase from '@antojados/ui/base/FeedFullscreenBase.vue'
import { useLocationScope } from '@antojados/api/composables/useLocationScope'
import { useSocialActionSync } from '@antojados/api/composables/useSocialActionSync'
import { socialFeedService } from '@antojados/api/services'

const route = useRoute()
const router = useRouter()
const { pushEvent } = useSocialActionSync()
const { cityCode, scopeLevel, scopeCode } = useLocationScope('barrio')
const post = ref(null)
const associatedPosts = ref([])
const comments = computed(() => post.value?.comments || [])
const actions = computed(() => [
  { key: 'chocalas', label: 'Chocalas', icon: 'front_hand', count: post.value?.likesCount ?? 0 },
  { key: 'pasala', label: 'Pasala', icon: 'reply', count: post.value?.commentsCount ?? 0 },
  { key: 'morral', label: 'Morral', icon: 'backpack', count: 0 },
  { key: 'maps', label: 'Maps', icon: 'map', count: 0 },
])

watch(
  () => [route.params.post_id, route.query.user_id, route.query.feed_type],
  async ([postId, userId, feedType]) => {
    const resolvedPostId = String(postId || '')
    const resolvedUserId = String(userId || '')
    const resolvedScope = resolveFullscreenScope(feedType)

    if (!resolvedPostId) {
      post.value = null
      associatedPosts.value = []
      return
    }

    const userPosts = resolvedUserId ? await socialFeedService.listByUser(resolvedUserId, resolvedScope) : []
    post.value =
      userPosts.find((item) => item.id === resolvedPostId) ||
      (await socialFeedService.getById(resolvedPostId, resolvedScope))

    associatedPosts.value = userPosts.filter((item) => item.id !== resolvedPostId)
  },
  { immediate: true },
)

function goBack() {
  const returnTo = typeof route.query.return_to === 'string' ? route.query.return_to : '/red/barrio'
  router.replace(returnTo.startsWith('/red/barrio') ? returnTo : '/red/barrio')
}

function openAssociatedPost(item) {
  if (!item?.id) return
  router.push({
    path: `/red/barrio/fullscreen/${item.id}`,
    query: {
      user_id: item.userId || route.query.user_id || '',
      feed_type: String(item.feedType || route.query.feed_type || '').trim().toLowerCase(),
      return_to: route.query.return_to || '/red/barrio',
    },
  })
}

function resolveFullscreenScope(feedType) {
  const normalized = String(feedType || '').trim().toLowerCase()
  if (normalized === 'pachanga' || normalized === 'momentos') return 'pachanga'
  return 'barrio'
}

function syncAction(eventType, payload) {
  return pushEvent({
    eventType,
    postId: post.value?.id,
    placeId: post.value?.placeId || post.value?.place_id,
    targetUserId: post.value?.userId,
    scopeLevel: scopeLevel.value,
    scopeCode: scopeCode.value,
    cityCode: cityCode.value,
    feedScope: 'barrio',
    channel: post.value?.channel || 'social',
    payload,
  })
}

function onRailAction(actionKey) {
  if (actionKey === 'chocalas') void syncAction('post_like')
  if (actionKey === 'pasala') void syncAction('post_share')
  if (actionKey === 'morral') void syncAction('post_save')
  if (actionKey === 'maps') void syncAction('place_open')
}

function addComment(text) {
  if (!text) return undefined
  void syncAction('post_comment', { text })
  return undefined
}
</script>

<style scoped>
.barrio-fullscreen-view {
  min-height: 100%;
  background: #000;
}

.barrio-fullscreen-view__copy {
  display: grid;
  gap: 6px;
}

.barrio-fullscreen-view__copy h2 {
  margin: 0;
  font-size: 24px;
}

.barrio-fullscreen-view__copy p,
.barrio-fullscreen-view__copy span {
  margin: 0;
  color: rgba(255, 255, 255, 0.82);
}
</style>
