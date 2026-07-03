<template>
  <section class="negocio-post-fullscreen-view">
    <feed-fullscreen-base
      :model-value="true"
      stage="S3"
      presentation="inline"
      variant="bizPost"
      :show-action-rail="true"
      :action-rail-actions="postActions"
      action-rail-density="compact"
      media-fit="cover"
      quick-input-placement="body"
      :post="heroPost"
      :associated-items="associatedMediaItems"
      associated-variant="businessMasonry"
      associated-model="androidMosaic"
      associated-tile-variant="business"
      associated-subdim-ik="VASIR_POST_ASSOCIATED_MASONRY"
      associated-subdim-pc="ANTOJO.VAS_IR.NEGOCIO_POST"
      associated-subdim-type="SUB_COMPONENT"
      associated-subdim-applies-to="all"
      associated-code-component="NEGOCIO.POST_ASSOCIATED_MASONRY"
      :show-comments="true"
      :comments="comments"
      comments-variant="vasIr"
      comments-title="Comentarios"
      comments-placeholder="Comenta esta publicacion..."
      comments-empty-message="Se el primero en comentar esta publicacion."
      comments-subdim-ik="VASIR_POST_COMMENTS"
      comments-subdim-pc="ANTOJO.VAS_IR.NEGOCIO_POST"
      comments-subdim-type="SUB_COMPONENT"
      comments-subdim-applies-to="all"
      comments-code-component="NEGOCIO.POST_COMMENTS"
      subdim-ik="NEGOCIO_POST_FULLSCREEN"
      subdim-pc="ANTOJO.VAS_IR.NEGOCIO_POST"
      subdim-type="FULLSCREEN"
      subdim-applies-to="all"
      code-component="NEGOCIO.POST_FULLSCREEN"
      @close="goBack"
      @select-associated="selectAssociated"
      @send-comment="addComment"
    >
      <template #media="{ post: item }">
        <div class="negocio-post-fullscreen-view__media-shell">
          <video
            v-if="isVideoPost(item)"
            ref="videoRef"
            :src="getPostVideoSrc(item) || getPostMediaSrc(item)"
            class="negocio-post-fullscreen-view__media"
            :muted="isMuted"
            playsinline
            loop
            autoplay
          />
          <img
            v-else-if="getPostMediaSrc(item)"
            :src="getPostMediaSrc(item)"
            class="negocio-post-fullscreen-view__media"
          />
          <div v-else class="negocio-post-fullscreen-view__media negocio-post-fullscreen-view__media--empty" />

          <div v-if="isVideoPost(item)" class="negocio-post-fullscreen-view__video-controls">
            <q-btn
              flat
              round
              color="white"
              size="md"
              :icon="isMuted ? 'volume_off' : 'volume_up'"
              class="negocio-post-fullscreen-view__control-btn"
              @click.stop="toggleMuted"
            />
            <q-btn
              flat
              round
              color="white"
              size="md"
              :icon="isPaused ? 'play_arrow' : 'pause'"
              class="negocio-post-fullscreen-view__control-btn"
              @click.stop="togglePaused"
            />
          </div>
        </div>
      </template>

      <template #overlay="{ post: item }">
        <div class="negocio-post-fullscreen-view__copy">
          <q-badge color="primary" text-color="dark">{{ item.postTypeLabel }}</q-badge>
          <h2>{{ item.venueName }}</h2>
          <p>{{ item.caption }}</p>
        </div>
      </template>
    </feed-fullscreen-base>
  </section>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FeedFullscreenBase from '@antojados/ui/base/FeedFullscreenBase.vue'
import { usePostMedia } from '@antojados/ui/services/useNormalizedMedia'
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
function getPostMediaSrc(item) {
  return usePostMedia(() => item).mediaSrc.value || ''
}

function getPostVideoSrc(item) {
  return usePostMedia(() => item).videoSrc.value || ''
}

const postActions = computed(() => [
  { key: 'chocalas', label: 'Chocalas', icon: 'front_hand', count: post.value?.likesCount || 0 },
  { key: 'pasala', label: 'Pasala', icon: 'reply', count: post.value?.commentsCount || 0 },
  { key: 'morral', label: 'Morral', icon: 'backpack', count: 0 },
  { key: 'compa', label: 'Tu compa', icon: 'person_add_alt_1', count: 0 },
  { key: 'maps', label: 'Maps', icon: 'map', count: 0 },
  { key: 'whatsapp', label: 'WhatsApp', icon: 'chat', count: 0 },
])

watch(
  () => [route.params.publisher_id, route.params.post_id],
  async ([nextPublisherId, nextPostId]) => {
    const resolvedPublisherId = String(nextPublisherId || '')
    const resolvedPostId = String(nextPostId || '')
    localComments.value = []
    const publisherPosts = resolvedPublisherId
      ? await bizFeedService.listByPublisher(resolvedPublisherId, 'vas_ir')
      : []
    post.value =
      publisherPosts.find((item) => item.id === resolvedPostId) ||
      (resolvedPostId && resolvedPublisherId
        ? await bizFeedService.getById(resolvedPostId, 'vas_ir', resolvedPublisherId)
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
    path: `/negocio/${publisherId.value}/post/${item.id}`,
    query: { source: 'biz_grid' },
  })
}

function goBack() {
  router.push({
    path: `/negocio/${publisherId.value}`,
    query: { post_id: post.value?.id || '', source: 'post_fullscreen' },
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
.negocio-post-fullscreen-view {
  min-height: 100%;
  background: #000;
}

.negocio-post-fullscreen-view__media-shell {
  position: relative;
  width: 100%;
  height: 100%;
}

.negocio-post-fullscreen-view__media,
.negocio-post-fullscreen-view__media--empty {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.negocio-post-fullscreen-view__media--empty {
  background: linear-gradient(135deg, #141824, #06080d);
}

.negocio-post-fullscreen-view__video-controls {
  position: absolute;
  top: max(10px, env(safe-area-inset-top));
  left: 72px;
  z-index: 8;
  display: flex;
  gap: 8px;
}

.negocio-post-fullscreen-view__control-btn {
  width: 52px;
  height: 52px;
  min-width: 52px;
  min-height: 52px;
  background: rgba(0, 0, 0, 0.42);
  backdrop-filter: blur(8px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.34);
}

.negocio-post-fullscreen-view__control-btn :deep(.q-icon) {
  font-size: 28px;
}

.negocio-post-fullscreen-view__copy {
  display: grid;
  gap: 6px;
}

.negocio-post-fullscreen-view__copy h2 {
  margin: 0;
  font-size: 24px;
}

.negocio-post-fullscreen-view__copy p {
  margin: 0;
  color: rgba(255, 255, 255, 0.82);
}
</style>
