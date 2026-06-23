<template>
  <section class="arre-post-fullscreen-view">
    <feed-fullscreen-base
      :model-value="true"
      stage="S3"
      presentation="inline"
      variant="arre"
      :show-action-rail="true"
      :action-rail-actions="postActions"
      action-rail-density="compact"
      media-fit="cover"
      quick-input-placement="body"
      :post="heroPost"
      :associated-items="associatedMediaItems"
      associated-variant="eventMasonry"
      associated-model="androidMosaic"
      associated-tile-variant="event"
      associated-subdim-ik="ARRE_POST_ASSOCIATED_MASONRY"
      associated-subdim-pc="ANTOJO.ARRE.ARRE_FEED"
      associated-subdim-type="SUB_COMPONENT"
      associated-subdim-applies-to="sponsor"
      associated-code-component="ARRE.POST_ASSOCIATED_MASONRY"
      :show-comments="true"
      :comments="comments"
      comments-variant="arre"
      comments-title="Comentarios del evento"
      comments-placeholder="Pregunta por el evento..."
      comments-empty-message="Pregunta por horarios, acceso o reservacion."
      comments-accent-color="deep-purple-6"
      comments-accent-text-color="white"
      comments-subdim-ik="ARRE_POST_COMMENTS"
      comments-subdim-pc="ANTOJO.ARRE.ARRE_FEED"
      comments-subdim-type="SUB_COMPONENT"
      comments-subdim-applies-to="all"
      comments-code-component="ARRE.POST_COMMENTS"
      subdim-ik="ARRE_POST_FULLSCREEN"
      subdim-pc="ANTOJO.ARRE.ARRE_FEED"
      subdim-type="FULLSCREEN"
      subdim-applies-to="sponsor"
      code-component="ARRE.POST_FULLSCREEN"
      @close="goBack"
      @select-associated="selectAssociated"
      @send-comment="addComment"
    >
      <template #media="{ post: item }">
        <div class="arre-post-fullscreen-view__media-shell">
          <video
            v-if="isVideoPost(item)"
            ref="videoRef"
            :src="item.mediaUrl"
            class="arre-post-fullscreen-view__media"
            :muted="isMuted"
            playsinline
            loop
            autoplay
          />
          <img
            v-else-if="item.mediaUrl"
            :src="item.mediaUrl"
            class="arre-post-fullscreen-view__media"
          />
          <div v-else class="arre-post-fullscreen-view__media arre-post-fullscreen-view__media--empty" />

          <div v-if="isVideoPost(item)" class="arre-post-fullscreen-view__video-controls">
            <q-btn
              flat
              round
              color="white"
              size="md"
              :icon="isMuted ? 'volume_off' : 'volume_up'"
              class="arre-post-fullscreen-view__control-btn"
              @click.stop="toggleMuted"
            />
            <q-btn
              flat
              round
              color="white"
              size="md"
              :icon="isPaused ? 'play_arrow' : 'pause'"
              class="arre-post-fullscreen-view__control-btn"
              @click.stop="togglePaused"
            />
          </div>
        </div>
      </template>

      <template #overlay="{ post: item }">
        <div class="arre-post-fullscreen-view__copy">
          <q-badge color="deep-purple-6" text-color="white">{{ item.postTypeLabel }}</q-badge>
          <h2>{{ item.venueName }}</h2>
          <p>{{ item.caption }}</p>
        </div>
      </template>

      <template #actions>
        <section class="arre-post-fullscreen-view__tickets">
          <div class="arre-post-fullscreen-view__tickets-head">
            <q-icon name="confirmation_number" color="deep-purple-4" size="18px" />
            <strong>Boletos</strong>
          </div>
          <p>Preventa, reservaciones y acceso para este evento.</p>
        </section>
      </template>
    </feed-fullscreen-base>
  </section>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FeedFullscreenBase from '@antojados/ui/base/FeedFullscreenBase.vue'
import { bizFeedService } from '@antojados/api/services'

const route = useRoute()
const router = useRouter()
const publisherId = computed(() => String(route.params.publisher_id || ''))
const post = ref(null)
const associatedMediaItems = ref([])
const localComments = ref([])
const videoRef = ref(null)
const isMuted = ref(false)
const isPaused = ref(false)
const heroPost = computed(() => post.value || {})
const comments = computed(() => [...(post.value?.comments || []), ...localComments.value])
const postActions = computed(() => [
  { key: 'boletos', label: 'Boletos', icon: 'confirmation_number', count: 0 },
  { key: 'chocalas', label: 'Chocalas', icon: 'front_hand', count: post.value?.likesCount || 0 },
  { key: 'pasala', label: 'Pasalo', icon: 'reply', count: post.value?.commentsCount || 0 },
  { key: 'morral', label: 'Morral', icon: 'backpack', count: 0 },
  { key: 'compa', label: 'Tu compa', icon: 'person_add_alt_1', count: 0 },
  { key: 'maps', label: 'Maps', icon: 'map', count: 0 },
])

watch(
  () => [route.params.publisher_id, route.params.post_id],
  async ([nextPublisherId, nextPostId]) => {
    const resolvedPublisherId = String(nextPublisherId || '')
    const resolvedPostId = String(nextPostId || '')
    localComments.value = []
    const publisherPosts = resolvedPublisherId
      ? await bizFeedService.listByPublisher(resolvedPublisherId, 'arre')
      : []
    post.value =
      publisherPosts.find((item) => item.id === resolvedPostId) ||
      (resolvedPostId && resolvedPublisherId
        ? await bizFeedService.getById(resolvedPostId, 'arre', resolvedPublisherId)
        : null)
    associatedMediaItems.value =
      resolvedPublisherId && post.value
        ? publisherPosts.filter((item) => item.id !== post.value?.id)
        : []
    isMuted.value = false
    isPaused.value = false
    await nextTick()
    syncVideo()
  },
  { immediate: true },
)

watch([isMuted, isPaused, post], async () => {
  await nextTick()
  syncVideo()
})

function isVideoPost(item) {
  return String(item?.mediaType || '')
    .trim()
    .toLowerCase() === 'video'
}

function syncVideo() {
  if (!videoRef.value) return
  videoRef.value.muted = isMuted.value
  if (isPaused.value) {
    videoRef.value.pause()
    return
  }
  void videoRef.value.play().catch(() => undefined)
}

function toggleMuted() {
  isMuted.value = !isMuted.value
}

function togglePaused() {
  isPaused.value = !isPaused.value
}

function selectAssociated(item) {
  if (!item?.id) return
  router.push({
    path: `/antojo/arre/negocio/${publisherId.value}/post/${item.id}`,
    query: { source: 'arre_grid', channel: 'arre' },
  })
}

function goBack() {
  router.push({
    path: `/antojo/arre/negocio/${publisherId.value}`,
    query: { post_id: post.value?.id || '', source: 'arre_grid', channel: 'arre' },
  })
}

function addComment(text) {
  localComments.value.push({
    id: `local-${Date.now()}`,
    user: 'yo',
    text,
  })
}
</script>

<style scoped>
.arre-post-fullscreen-view {
  min-height: 100%;
  background: #000;
}

.arre-post-fullscreen-view__media-shell {
  position: relative;
  width: 100%;
  height: 100%;
}

.arre-post-fullscreen-view__media,
.arre-post-fullscreen-view__media--empty {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.arre-post-fullscreen-view__media--empty {
  background: linear-gradient(135deg, #141824, #06080d);
}

.arre-post-fullscreen-view__video-controls {
  position: absolute;
  top: max(10px, env(safe-area-inset-top));
  left: 72px;
  z-index: 8;
  display: flex;
  gap: 8px;
}

.arre-post-fullscreen-view__control-btn {
  width: 52px;
  height: 52px;
  min-width: 52px;
  min-height: 52px;
  background: rgba(0, 0, 0, 0.42);
  backdrop-filter: blur(8px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.34);
}

.arre-post-fullscreen-view__control-btn :deep(.q-icon) {
  font-size: 28px;
}

.arre-post-fullscreen-view__copy {
  display: grid;
  gap: 6px;
}

.arre-post-fullscreen-view__copy h2 {
  margin: 0;
  font-size: 24px;
}

.arre-post-fullscreen-view__copy p {
  margin: 0;
  color: rgba(255, 255, 255, 0.82);
}

.arre-post-fullscreen-view__tickets {
  margin: 10px 12px 4px;
  padding: 12px;
  border: 1px dashed rgba(124, 58, 237, 0.35);
  border-radius: 8px;
  background: rgba(124, 58, 237, 0.08);
}

.arre-post-fullscreen-view__tickets-head {
  display: flex;
  align-items: center;
  gap: 7px;
  color: rgba(255, 255, 255, 0.9);
}

.arre-post-fullscreen-view__tickets p {
  margin: 6px 0 0;
  color: rgba(255, 255, 255, 0.66);
  font-size: 12px;
}
</style>
