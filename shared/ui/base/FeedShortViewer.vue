<template>
  <section class="feed-short-viewer" :style="containerStyle">
    <!-- Stream de shorts -->
    <div ref="streamRef" class="feed-short-viewer__stream">
      <article
        v-for="item in items"
        :key="item.id"
        :ref="(el) => setItemRef(item.id, el)"
        :data-item-id="item.id"
        class="feed-short-viewer__slide"
        @click="toggleOverlay(item.id)"
      >
        <!-- Media slot: video por defecto, canvas/explorer cuando se use desde Explorer -->
        <slot name="media" :item="item" :active="activeItemId === item.id" :muted="isMuted(item.id)" :paused="isPaused(item.id)">
          <video
            v-if="item.mediaType === 'video'"
            :ref="(el) => setVideoRef(item.id, el)"
            :src="item.mediaUrl || item.media_url"
            class="feed-short-viewer__media"
            loop
            playsinline
          />
          <img
            v-else
            :src="item.mediaUrl || item.media_url || item.mediaFullUrl || item.media_full_url"
            class="feed-short-viewer__media feed-short-viewer__media--image"
            loading="lazy"
          />
        </slot>

        <!-- Scrim -->
        <div class="feed-short-viewer__scrim" />

        <!-- Top controls -->
        <div class="feed-short-viewer__top">
          <div v-if="showControls" class="feed-short-viewer__controls" @click.stop>
            <q-btn
              flat
              round
              :icon="isMuted(item.id) ? 'volume_off' : 'volume_up'"
              color="white"
              size="md"
              aria-label="Mute"
              class="feed-short-viewer__control-btn"
              @click.stop="toggleMuted(item.id)"
            />
            <q-btn
              flat
              round
              :icon="isPaused(item.id) ? 'play_arrow' : 'pause'"
              color="white"
              size="md"
              aria-label="Pause"
              class="feed-short-viewer__control-btn"
              @click.stop="togglePaused(item.id)"
            />
          </div>
          <div v-if="showBadge" class="feed-short-viewer__status">
            <span v-if="item.durationSec" class="feed-short-viewer__duration">{{ item.durationSec }}s</span>
            <span class="feed-short-viewer__badge">{{ badgeLabel }}</span>
          </div>
        </div>

        <!-- Meta info -->
        <div v-if="showMeta" class="feed-short-viewer__meta">
          <strong>{{ item.venueName || item.venue || item.author_handle || item.authorHandle || 'Autor' }}</strong>
          <span>{{ item.caption || item.title || '' }}</span>
        </div>

        <!-- Extra overlay slot (para explorer canvas) -->
        <div v-if="$slots.overlay" class="feed-short-viewer__overlay" @click.stop>
          <slot name="overlay" :item="item" :active="activeItemId === item.id" />
        </div>

        <!-- Action rail -->
        <transition name="slide-right">
          <post-action-rail-base
            v-if="showActionRail && isOverlayVisible(item.id)"
            layout="slide"
            density="compact"
            :actions="actions"
            class="feed-short-viewer__rail"
            :subdim-ik="subdimIk"
            :subdim-pc="subdimPc"
            :subdim-type="'SUB_COMPONENT'"
            :subdim-applies-to="'all'"
            :code-component="codeComponent"
            @action="(action) => onRailAction(action, item)"
            @click.stop
          />
        </transition>

        <!-- Comments section -->
        <section v-if="showComments" class="feed-short-viewer__comments" @click.stop>
          <div class="feed-short-viewer__comment-list">
            <template v-if="$slots.comments">
              <slot name="comments" :item="item" />
            </template>
            <template v-else>
              <div
                v-for="comment in resolveComments(item).slice(-2)"
                :key="comment.id"
                class="feed-short-viewer__comment"
              >
                <strong>@{{ comment.user }}</strong>
                <span>{{ comment.text }}</span>
              </div>
              <div v-if="!resolveComments(item).length" class="feed-short-viewer__empty-comments">
                Sin comentarios aun - se el primero
              </div>
            </template>
          </div>

          <form v-if="$slots.commentInput || showCommentInput" class="feed-short-viewer__input-row" @submit.prevent="onCommentSubmit(item)">
            <slot name="commentInput" :item="item" :draft="commentDrafts[item.id] || ''" :update-draft="(val) => updateDraft(item.id, val)">
              <input
                v-model="commentDrafts[item.id]"
                class="feed-short-viewer__input"
                placeholder="Escribe un comentario..."
                autocomplete="off"
              />
            </slot>
            <q-btn
              flat
              round
              dense
              icon="send"
              :color="accentColor"
              size="sm"
              type="submit"
              :disable="!commentDrafts[item.id]"
            />
          </form>
        </section>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import PostActionRailBase from '@antojados/ui/base/PostActionRailBase.vue'

const props = defineProps({
  items: { type: Array, required: true },
  actions: { type: Array, default: () => [] },
  accentColor: { type: String, default: 'deep-purple-3' },
  badgeLabel: { type: String, default: 'SHORT' },
  showControls: { type: Boolean, default: true },
  showBadge: { type: Boolean, default: true },
  showMeta: { type: Boolean, default: true },
  showActionRail: { type: Boolean, default: true },
  showComments: { type: Boolean, default: true },
  showCommentInput: { type: Boolean, default: true },
  modelValue: { type: String, default: '' },
  initialPostId: { type: String, default: '' },
  height: { type: String, default: 'calc(100dvh - 194px)' },
  subdimIk: { type: String, default: '' },
  subdimPc: { type: String, default: '' },
  codeComponent: { type: String, default: '' },
})

const emit = defineEmits([
  'update:modelValue',
  'rail-action',
  'comment-submit',
  'item-visible',
])

const streamRef = ref(null)
const itemRefs = reactive({})
const videoRefs = reactive({})
const mutedState = reactive({})
const pausedState = reactive({})
const commentDrafts = reactive({})
let shortObserver = null

const activeItemId = computed(() => props.modelValue)

const containerStyle = computed(() => ({
  height: props.height,
}))

function isOverlayVisible(itemId) {
  return activeItemId.value === itemId
}

function toggleOverlay(itemId) {
  const nextId = activeItemId.value === itemId ? '' : itemId
  emit('update:modelValue', nextId)
}

function setItemRef(itemId, element) {
  if (!itemId) return
  if (element) {
    itemRefs[itemId] = element
    if (shortObserver) shortObserver.observe(element)
    return
  }
  const current = itemRefs[itemId]
  if (current && shortObserver) shortObserver.unobserve(current)
  delete itemRefs[itemId]
}

function setVideoRef(itemId, element) {
  if (!itemId) return
  if (element) {
    videoRefs[itemId] = element
    if (mutedState[itemId] === undefined) mutedState[itemId] = false
    if (pausedState[itemId] === undefined) pausedState[itemId] = false
    syncPlayback()
    return
  }
  delete videoRefs[itemId]
}

function isMuted(itemId) {
  return mutedState[itemId] !== false
}

function isPaused(itemId) {
  return pausedState[itemId] === true
}

function syncPlayback() {
  Object.entries(videoRefs).forEach(([itemId, videoElement]) => {
    if (!videoElement) return
    const isActive = itemId === activeItemId.value
    videoElement.currentTime = Number.isFinite(videoElement.currentTime) ? videoElement.currentTime : 0
    videoElement.muted = isActive ? mutedState[itemId] === true : true
    if (!isActive || pausedState[itemId] === true) {
      videoElement.pause()
      return
    }
    void videoElement.play().catch(() => undefined)
  })
}

function setActiveItem(itemId) {
  const normalizedId = String(itemId || '')
  if (!normalizedId || activeItemId.value === normalizedId) {
    syncPlayback()
    return
  }
  emit('update:modelValue', normalizedId)
  syncPlayback()
}

function initializeObserver() {
  if (shortObserver) shortObserver.disconnect()

  shortObserver = new IntersectionObserver(
    (entries) => {
      const visibleEntry = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      const nextId = visibleEntry?.target?.dataset?.itemId
      if (nextId) {
        setActiveItem(nextId)
        emit('item-visible', nextId)
      }
    },
    { root: streamRef.value, threshold: [0.6, 0.75, 0.9] },
  )

  Object.values(itemRefs).forEach((el) => {
    if (el) shortObserver.observe(el)
  })
}

async function focusItem(itemId) {
  const normalizedId = String(itemId || '')
  if (!normalizedId) return
  await nextTick()
  const target = itemRefs[normalizedId]
  if (!target) return
  shortObserver?.disconnect()
  target.scrollIntoView({ block: 'start' })
  setActiveItem(normalizedId)
  requestAnimationFrame(() => {
    initializeObserver()
    syncPlayback()
  })
}

function toggleMuted(itemId) {
  if (!itemId) return
  mutedState[itemId] = !isMuted(itemId)
  const videoEl = videoRefs[itemId]
  if (videoEl) videoEl.muted = mutedState[itemId]
  syncPlayback()
}

function togglePaused(itemId) {
  if (!itemId) return
  pausedState[itemId] = !isPaused(itemId)
  setActiveItem(itemId)
}

function resolveComments(item) {
  return item?.comments || []
}

function updateDraft(itemId, value) {
  commentDrafts[itemId] = value
}

function onCommentSubmit(item) {
  const text = String(commentDrafts[item.id] || '').trim()
  if (!text) return
  emit('comment-submit', item, text)
  commentDrafts[item.id] = ''
}

function onRailAction(action, item) {
  emit('rail-action', action, item)
  if (activeItemId.value !== item.id) {
    emit('update:modelValue', item.id)
  }
}

function getItemIds() {
  return props.items.map((item) => item.id).filter(Boolean)
}

function onKeyDown(event) {
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    const ids = getItemIds()
    if (!ids.length) return
    const currentIndex = activeItemId.value ? ids.indexOf(activeItemId.value) : -1
    let nextIndex
    if (event.key === 'ArrowDown') {
      nextIndex = currentIndex < ids.length - 1 ? currentIndex + 1 : currentIndex
    } else {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : 0
    }
    if (nextIndex !== currentIndex && nextIndex >= 0) {
      event.preventDefault()
      void focusItem(ids[nextIndex])
    }
  }
}

watch(
  () => props.items,
  async (nextItems) => {
    nextItems.forEach((item) => {
      if (mutedState[item.id] === undefined) mutedState[item.id] = false
      if (pausedState[item.id] === undefined) pausedState[item.id] = false
    })
    await nextTick()
    initializeObserver()
    syncPlayback()
  },
  { deep: true },
)

watch(activeItemId, () => syncPlayback())

watch(
  () => props.initialPostId,
  async (postId) => {
    if (postId) {
      await focusItem(postId)
    }
  },
  { immediate: true },
)

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)

  // Initialize muted/paused states for initial items
  props.items.forEach((item) => {
    if (mutedState[item.id] === undefined) mutedState[item.id] = false
    if (pausedState[item.id] === undefined) pausedState[item.id] = false
  })

  void nextTick(() => {
    initializeObserver()
    syncPlayback()
    const firstId = props.initialPostId || props.items[0]?.id || ''
    if (firstId && !activeItemId.value) {
      emit('update:modelValue', firstId)
    }
  })
})

onBeforeUnmount(() => {
  if (shortObserver) {
    shortObserver.disconnect()
    shortObserver = null
  }
  window.removeEventListener('keydown', onKeyDown)
})
</script>

<style scoped>
.feed-short-viewer {
  position: relative;
  min-height: 0;
  overflow: hidden;
  background: #0a0010;
  isolation: isolate;
}

.feed-short-viewer__stream {
  height: 100%;
  overflow-y: scroll;
  scroll-snap-type: y mandatory;
  scrollbar-width: none;
}

.feed-short-viewer__stream::-webkit-scrollbar {
  display: none;
}

.feed-short-viewer__slide {
  position: relative;
  height: 100%;
  min-height: 100%;
  flex-shrink: 0;
  overflow: hidden;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  background: #000;
}

.feed-short-viewer__media {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  background: #000;
  pointer-events: none;
}

.feed-short-viewer__media--image {
  object-fit: cover;
}

.feed-short-viewer__scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.84) 0%, transparent 54%);
  pointer-events: none;
}

.feed-short-viewer__top {
  position: absolute;
  top: 10px;
  left: 14px;
  right: 14px;
  z-index: 4;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.feed-short-viewer__controls,
.feed-short-viewer__status {
  display: flex;
  gap: 8px;
  align-items: center;
}

.feed-short-viewer__control-btn {
  width: 52px;
  height: 52px;
  min-width: 52px;
  min-height: 52px;
  background: rgba(0, 0, 0, 0.42);
  backdrop-filter: blur(8px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.34);
  touch-action: manipulation;
}

.feed-short-viewer__control-btn :deep(.q-icon) {
  font-size: 28px;
}

.feed-short-viewer__duration,
.feed-short-viewer__badge {
  width: max-content;
  padding: 4px 10px;
  border-radius: 999px;
  color: white;
  background: rgba(0, 0, 0, 0.55);
  font-size: 12px;
  font-weight: 800;
}

.feed-short-viewer__badge {
  background: rgba(124, 58, 237, 0.78);
}

.feed-short-viewer__meta {
  position: absolute;
  left: 14px;
  right: 104px;
  bottom: 104px;
  z-index: 4;
  display: grid;
  gap: 5px;
  color: white;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.8);
  pointer-events: none;
}

.feed-short-viewer__meta strong,
.feed-short-viewer__meta span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.feed-short-viewer__overlay {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.feed-short-viewer__overlay > * {
  pointer-events: auto;
}

.feed-short-viewer__rail {
  right: 8px;
  top: auto;
  bottom: 154px;
  transform: none;
  z-index: 8;
}

.feed-short-viewer__comments {
  position: absolute;
  left: 8px;
  right: 88px;
  bottom: 8px;
  z-index: 6;
  min-height: 78px;
  max-height: 96px;
  padding: 8px 10px 8px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.82) 64%, transparent);
  border-radius: 14px;
}

.feed-short-viewer__comment-list {
  display: grid;
  gap: 3px;
  min-height: 24px;
  margin-bottom: 6px;
}

.feed-short-viewer__comment,
.feed-short-viewer__empty-comments {
  overflow: hidden;
  color: rgba(255, 255, 255, 0.84);
  font-size: 12px;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.feed-short-viewer__comment strong {
  margin-right: 5px;
  color: #d8b4fe;
}

.feed-short-viewer__input-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 6px;
  align-items: center;
  min-height: 38px;
  padding: 0 6px 0 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
}

.feed-short-viewer__input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  color: #fff;
  background: transparent;
  font-size: 13px;
}

.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.18s ease;
}

.slide-right-enter-from,
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

@media (max-height: 700px) {
  .feed-short-viewer {
    height: calc(100dvh - 184px) !important;
  }

  .feed-short-viewer__meta {
    bottom: 92px;
  }

  .feed-short-viewer__comments {
    min-height: 70px;
    max-height: 84px;
  }

  .feed-short-viewer__rail {
    bottom: 142px;
  }
}
</style>