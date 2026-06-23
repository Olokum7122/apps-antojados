<template>
  <section class="pachanga-fullscreen-view">
    <feed-fullscreen-base
      :model-value="true"
      stage="S3"
      presentation="inline"
      variant="pachanga"
      :post="post"
      :show-action-rail="true"
      :action-rail-actions="actions"
      action-rail-density="compact"
      media-fit="contain"
      :associated-items="associatedPosts"
      associated-variant="pachangaMasonry"
      associated-model="androidMosaic"
      associated-tile-variant="pachanga"
      associated-subdim-ik="PACHANGA_FULLSCREEN_ASSOCIATED"
      associated-subdim-pc="ANTOJADOS.PARA_TI.PACHANGA"
      associated-subdim-type="SUB_COMPONENT"
      associated-subdim-applies-to="all"
      associated-code-component="PACHANGA.FULLSCREEN_ASSOCIATED"
      :show-comments="true"
      :comments="comments"
      comments-variant="pachanga"
      comments-title="Echa el chisme"
      comments-placeholder="Echa el chisme..."
      comments-empty-message="Se el primero en comentar esta pachanga."
      comments-subdim-ik="PACHANGA_FULLSCREEN_COMMENTS"
      comments-subdim-pc="ANTOJADOS.PARA_TI.PACHANGA"
      comments-subdim-type="SUB_COMPONENT"
      comments-subdim-applies-to="all"
      comments-code-component="PACHANGA.FULLSCREEN_COMMENTS"
      subdim-ik="PACHANGA_FULLSCREEN"
      subdim-pc="ANTOJADOS.PARA_TI.PACHANGA"
      subdim-type="FULLSCREEN"
      subdim-applies-to="all"
      code-component="PACHANGA.FULLSCREEN"
      @close="goBack"
      @rail-action="onRailAction"
      @select-associated="openAssociatedPost"
      @send-comment="addComment"
    >
      <template #overlay="{ post: item }">
        <div class="pachanga-fullscreen-view__copy">
          <q-badge color="deep-purple-6" text-color="white">PACHANGA</q-badge>
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
const { cityCode, scopeLevel, scopeCode } = useLocationScope('pachanga')
const post = ref(null)
const associatedPosts = ref([])
const comments = computed(() => post.value?.comments || [])
const actions = computed(() => [
  { key: 'chocalas', label: 'Chocalas', icon: 'front_hand', count: post.value?.likesCount ?? 0 },
  { key: 'pasala', label: 'Pasala', icon: 'reply', count: post.value?.commentsCount ?? 0 },
  { key: 'morral', label: 'Morral', icon: 'backpack', count: 0 },
  { key: 'eliminar', label: 'Eliminar', icon: 'delete_outline', count: 0 },
])

watch(
  () => [route.params.post_id, route.query.user_id],
  async ([postId, userId]) => {
    const resolvedPostId = String(postId || '')
    const resolvedUserId = String(userId || '')

    if (!resolvedPostId) {
      post.value = null
      associatedPosts.value = []
      return
    }

    const userPosts = resolvedUserId ? await socialFeedService.listByUser(resolvedUserId, 'pachanga') : []
    post.value =
      userPosts.find((item) => item.id === resolvedPostId) ||
      (await socialFeedService.getById(resolvedPostId, 'pachanga'))

    associatedPosts.value = userPosts.filter((item) => item.id !== resolvedPostId)
  },
  { immediate: true },
)

function goBack() {
  router.push('/red/pa-ti/pachanga')
}

function openAssociatedPost(item) {
  if (!item?.id) return
  router.push(`/red/pa-ti/pachanga/fullscreen/${item.id}?user_id=${item.userId || route.query.user_id || ''}`)
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
    feedScope: 'pachanga',
    channel: post.value?.channel || 'social',
    payload,
  })
}

function onRailAction(actionKey) {
  if (actionKey === 'chocalas') void syncAction('post_like')
  if (actionKey === 'pasala') void syncAction('post_share')
  if (actionKey === 'morral') void syncAction('post_save')
  if (actionKey === 'eliminar') void syncAction('post_delete_request')
}

function addComment(text) {
  if (!text) return undefined
  void syncAction('post_comment', { text })
  return undefined
}
</script>

<style scoped>
.pachanga-fullscreen-view {
  min-height: 100%;
  background: #000;
}

.pachanga-fullscreen-view__copy {
  display: grid;
  gap: 6px;
}

.pachanga-fullscreen-view__copy h2 {
  margin: 0;
  font-size: 24px;
}

.pachanga-fullscreen-view__copy p {
  margin: 0;
  color: rgba(255, 255, 255, 0.82);
}
</style>
