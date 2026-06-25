<template>
  <section class="desma-feed-component">
    <feed-filter-bar-base
      :city-label="scopeLabel"
      :search-enabled="false"
      :search-value="searchValue"
      :suggestions="suggestions"
      :scope-options="scopeOptions"
      :active-scope-level="scopeLevel"
      stage="S1"
      variant="socialSearch"
      accent-color="deep-purple-4"
      search-placeholder="Buscar ciudad para Desma"
      subdim-ik="DESMA_FILTER_BAR"
      subdim-pc="ANTOJADOS.EN_EL_DESMA"
      subdim-type="SUB_COMPONENT"
      subdim-applies-to="all"
      code-component="DESMA.FILTER_BAR"
      class="q-mb-sm"
      @select-scope="onSelectScope"
      @open-city="isCityPickerOpen = true"
      @refresh="refreshFeed"
      @update:searchValue="onSearchUpdate"
      @commit-search="commitSearch"
      @select-suggestion="onSelectSuggestion"
    />

    <div ref="streamRef" class="desma-feed-component__stream">
      <article
        v-for="post in posts"
        :key="post.id"
        :ref="(element) => setPostRef(post.id, element)"
        :data-post-id="post.id"
        class="desma-feed-component__short"
        @click="toggleOverlay(post)"
      >
        <video
          v-if="post.mediaType === 'video'"
          :ref="(element) => setVideoRef(post.id, element)"
          :src="post.mediaUrl"
          class="desma-feed-component__media"
          loop
          playsinline
        />
        <img v-else :src="post.mediaUrl" class="desma-feed-component__media" loading="lazy" />
        <div class="desma-feed-component__scrim" />

        <div class="desma-feed-component__top">
          <div class="desma-feed-component__controls" @click.stop>
            <q-btn
              flat
              round
              :icon="isMuted(post) ? 'volume_off' : 'volume_up'"
              color="white"
              size="md"
              aria-label="Mute"
              class="desma-feed-component__control-btn"
              @click.stop="toggleMuted(post)"
            />
            <q-btn
              flat
              round
              :icon="isPaused(post) ? 'play_arrow' : 'pause'"
              color="white"
              size="md"
              aria-label="Pause"
              class="desma-feed-component__control-btn"
              @click.stop="togglePaused(post)"
            />
          </div>
          <div class="desma-feed-component__status">
            <span class="desma-feed-component__duration">{{ post.durationSec }}s</span>
            <span class="desma-feed-component__badge">SHORT</span>
          </div>
        </div>

        <div class="desma-feed-component__meta">
          <strong>{{ post.venueName || post.authorHandle }}</strong>
          <span>{{ post.caption }}</span>
        </div>

        <transition name="slide-right">
          <post-action-rail-base
            v-show="isOverlayVisible(post)"
            layout="slide"
            density="compact"
            :actions="buildActions(post)"
            class="desma-feed-component__rail"
            subdim-ik="DESMA_SHORT_RAIL"
            subdim-pc="ANTOJADOS.EN_EL_DESMA"
            subdim-type="SUB_COMPONENT"
            subdim-applies-to="all"
            code-component="DESMA.SHORT_RAIL"
            @action="(action) => onRailAction(action, post)"
            @click.stop
          />
        </transition>

        <section class="desma-feed-component__comments" @click.stop>
          <div class="desma-feed-component__comment-list">
            <div
              v-for="comment in resolveComments(post).slice(-2)"
              :key="comment.id"
              class="desma-feed-component__comment"
            >
              <strong>@{{ comment.user }}</strong>
              <span>{{ comment.text }}</span>
            </div>
            <div v-if="!resolveComments(post).length" class="desma-feed-component__empty-comments">
              Sin comentarios aun - se el primero
            </div>
          </div>

          <form class="desma-feed-component__input-row" @submit.prevent="submitComment(post)">
            <input
              v-model.trim="commentDrafts[post.id]"
              class="desma-feed-component__input"
              placeholder="Comenta el desma..."
              autocomplete="off"
            />
            <q-btn
              flat
              round
              dense
              icon="send"
              color="deep-purple-3"
              size="sm"
              type="submit"
              :disable="!commentDrafts[post.id]"
            />
          </form>
        </section>
      </article>
    </div>

    <input
      ref="cameraInputRef"
      class="desma-feed-component__native-input"
      type="file"
      accept="video/*"
      capture="environment"
      @change="onVideoSelected"
    />
    <input
      ref="deviceInputRef"
      class="desma-feed-component__native-input"
      type="file"
      accept="video/*"
      @change="onVideoSelected"
    />

    <button
      type="button"
      class="desma-feed-component__fab"
      subdim-ik="DESMA_BTN_PUBLICAR"
      subdim-pc="ANTOJADOS.EN_EL_DESMA"
      subdim-type="BUTTON"
      subdim-applies-to="all"
      data-code-component="DESMA.PUBLICAR"
      aria-label="Publicar desma"
      @click.stop="openPublish"
    >
      <q-icon name="add" size="30px" />
    </button>

    <q-dialog v-model="showPublishDialog" position="bottom">
      <q-card class="desma-feed-component__publish-card">
        <q-card-section>
          <h2>Publicar desma</h2>
          <p>Graba o agrega un video corto para publicarlo en Shorts.</p>
        </q-card-section>

        <q-card-section class="desma-feed-component__publish-actions">
          <button
            v-for="action in publishActions"
            :key="action.key"
            type="button"
            class="desma-feed-component__publish-action"
            @click="selectPublishAction(action.key)"
          >
            <q-icon :name="action.icon" color="deep-purple-3" size="28px" />
            <strong>{{ action.label }}</strong>
            <span>{{ action.help }}</span>
          </button>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showDecisionDialog" position="bottom">
      <q-card class="desma-feed-component__publish-card">
        <q-card-section>
          <h2>Que hacemos con tu desma?</h2>
          <p>{{ selectedVideoName }}</p>
          <p v-if="selectedVideoError" class="desma-feed-component__publish-error">
            {{ selectedVideoError }}
          </p>
        </q-card-section>

        <q-card-section class="desma-feed-component__publish-actions">
          <button
            type="button"
            class="desma-feed-component__publish-action"
            :disabled="publishingVideo"
            @click="finishPublish('published')"
          >
            <q-icon name="public" color="deep-purple-3" size="28px" />
            <strong>Publicar en Shorts</strong>
            <span>Visible para todos, con rail y comentarios.</span>
          </button>
          <button
            type="button"
            class="desma-feed-component__publish-action"
            :disabled="publishingVideo"
            @click="finishPublish('personal')"
          >
            <q-icon name="lock" color="deep-purple-3" size="28px" />
            <strong>Guardar personal</strong>
            <span>Solo visible para ti.</span>
          </button>
          <button
            type="button"
            class="desma-feed-component__publish-action desma-feed-component__publish-action--muted"
            :disabled="publishingVideo"
            @click="finishPublish('discard')"
          >
            <q-icon name="delete_outline" color="grey-5" size="28px" />
            <strong>Descartar</strong>
            <span>Cancelar este video.</span>
          </button>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="publishingVideo" persistent>
      <q-card class="desma-feed-component__publish-card desma-feed-component__processing-card">
        <q-card-section class="row items-center q-gutter-sm">
          <q-spinner-dots color="deep-purple-3" size="34px" />
          <div>
            <h2>{{ publishingStageLabel }}</h2>
            <p>{{ publishingStageDetail || 'No cierres esta pantalla mientras termina el intake.' }}</p>
          </div>
        </q-card-section>
        <q-card-section>
          <q-linear-progress indeterminate color="deep-purple-3" track-color="grey-8" rounded />
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="isCityPickerOpen" position="bottom">
      <q-card class="desma-feed-component__publish-card">
        <q-card-section>
          <h2>Ciudad para Desma</h2>
        </q-card-section>
        <q-card-section class="desma-feed-component__publish-actions">
          <button
            v-for="city in cityOptions"
            :key="city.code"
            type="button"
            class="desma-feed-component__publish-action"
            @click="onSelectCity(city.code)"
          >
            <q-icon name="location_on" color="deep-purple-3" size="28px" />
            <strong>{{ city.label }}</strong>
            <span>{{ city.code }}</span>
          </button>
        </q-card-section>
      </q-card>
    </q-dialog>
  </section>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute } from 'vue-router'
import FeedFilterBarBase from '@antojados/ui/base/FeedFilterBarBase.vue'
import PostActionRailBase from '@antojados/ui/base/PostActionRailBase.vue'
import { useAntojadosFeed } from '@antojados/api/composables/useAntojadosFeed'
import { useLocationScope } from '@antojados/api/composables/useLocationScope'
import { readPublishMediaFile } from '@antojados/api/composables/usePublishMedia'
import { useSocialActionSync } from '@antojados/api/composables/useSocialActionSync'
import { mediaService, publishService } from '@antojados/api/services'
import { getSharedSession } from '@antojados/api/storage/session.storage'

const route = useRoute()
const $q = useQuasar()
const { posts, load } = useAntojadosFeed('desma')
const { pushEvent } = useSocialActionSync()
const activePostId = ref('')
const showPublishDialog = ref(false)
const showDecisionDialog = ref(false)
const isCityPickerOpen = ref(false)
const streamRef = ref(null)
const cameraInputRef = ref(null)
const deviceInputRef = ref(null)
const selectedVideoName = ref('Video listo para publicar o guardar personal.')
const selectedVideoBase64 = ref(null)
const selectedVideoError = ref('')
const selectedVideoSource = ref('record')
const publishingVideo = ref(false)
const publishingStage = ref('idle')
const publishingStageLabel = ref('Preparando video...')
const publishingStageDetail = ref('')
const commentDrafts = reactive({})
const postRefs = reactive({})
const videoRefs = reactive({})
const mutedState = reactive({})
const pausedState = reactive({})
let shortObserver = null
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
} = useLocationScope('desma')
const publishActions = [
  { key: 'record', label: 'Grabar video', icon: 'videocam', help: 'Abrir camara nativa.' },
  { key: 'device', label: 'Agregar video', icon: 'video_library', help: 'Elegir desde el dispositivo.' },
  { key: 'personal', label: 'Guardar personal', icon: 'lock', help: 'Solo visible para ti.' },
]

function isOverlayVisible(post) {
  return activePostId.value === post?.id
}

function toggleOverlay(post) {
  activePostId.value = activePostId.value === post?.id ? '' : post.id
}

function setPostRef(postId, element) {
  if (!postId) return
  if (element) {
    postRefs[postId] = element
    if (shortObserver) shortObserver.observe(element)
    return
  }

  const current = postRefs[postId]
  if (current && shortObserver) shortObserver.unobserve(current)
  delete postRefs[postId]
}

function setVideoRef(postId, element) {
  if (!postId) return
  if (element) {
    videoRefs[postId] = element
    if (mutedState[postId] === undefined) mutedState[postId] = false
    if (pausedState[postId] === undefined) pausedState[postId] = false
    syncPlayback()
    return
  }

  delete videoRefs[postId]
}

function isMuted(post) {
  return mutedState[post?.id] !== false
}

function isPaused(post) {
  return pausedState[post?.id] === true
}

function syncPlayback() {
  Object.entries(videoRefs).forEach(([postId, videoElement]) => {
    if (!videoElement) return

    const isActive = postId === activePostId.value
    videoElement.currentTime = Number.isFinite(videoElement.currentTime) ? videoElement.currentTime : 0
    videoElement.muted = isActive ? mutedState[postId] === true : true

    if (!isActive || pausedState[postId] === true) {
      videoElement.pause()
      return
    }

    void videoElement.play().catch(() => undefined)
  })
}

function setActivePost(postId) {
  const normalizedPostId = String(postId || '')
  if (!normalizedPostId || activePostId.value === normalizedPostId) {
    syncPlayback()
    return
  }

  activePostId.value = normalizedPostId
  syncPlayback()
}

function initializeShortObserver() {
  if (shortObserver) {
    shortObserver.disconnect()
  }

  shortObserver = new IntersectionObserver(
    (entries) => {
      const visibleEntry = entries
        .filter((entry) => entry.isIntersecting)
        .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0]

      const nextPostId = visibleEntry?.target?.dataset?.postId
      if (nextPostId) {
        setActivePost(nextPostId)
      }
    },
    {
      root: streamRef.value,
      threshold: [0.6, 0.75, 0.9],
    },
  )

  Object.entries(postRefs).forEach(([, element]) => {
    if (element) shortObserver.observe(element)
  })
}

async function focusSelectedPost(postId) {
  const normalizedPostId = String(postId || '')
  if (!normalizedPostId) return

  await nextTick()
  const selectedPost = postRefs[normalizedPostId]
  if (!selectedPost) return

  shortObserver?.disconnect()
  selectedPost.scrollIntoView({ block: 'start' })
  setActivePost(normalizedPostId)

  requestAnimationFrame(() => {
    initializeShortObserver()
    syncPlayback()
  })
}

function toggleMuted(post) {
  const postId = post?.id
  if (!postId) return

  const nextMuted = !isMuted(post)
  mutedState[postId] = nextMuted
  const videoElement = videoRefs[postId]
  if (videoElement) {
    videoElement.muted = nextMuted
  }

  syncPlayback()
}

function togglePaused(post) {
  const postId = post?.id
  if (!postId) return

  const nextPaused = !isPaused(post)
  pausedState[postId] = nextPaused
  setActivePost(postId)
}

function resolveComments(post) {
  return post?.comments || []
}

function buildActions(post) {
  return [
    { key: 'like', label: 'Chocalas', icon: 'favorite_border', count: post?.likesCount || 0 },
    { key: 'comentar', label: 'Comentar', icon: 'chat_bubble', count: post?.commentsCount || 0 },
    { key: 'morral', label: 'Morral', icon: 'backpack', count: 0 },
    { key: 'compa', label: 'Compa', icon: 'person_add_alt_1', count: 0 },
    { key: 'compartir', label: 'Pasalo', icon: 'reply', count: 0 },
  ]
}

function syncAction(eventType, post, payload) {
  return pushEvent({
    eventType,
    postId: post?.id,
    placeId: post?.placeId || post?.place_id,
    targetUserId: post?.userId,
    scopeLevel: scopeLevel.value,
    scopeCode: scopeCode.value,
    cityCode: cityCode.value,
    feedScope: 'desma',
    channel: post?.channel || 'social',
    payload,
  })
}

function onRailAction(action, post) {
  activePostId.value = post.id
  if (action === 'like') {
    post.likesCount = Number(post.likesCount || 0) + 1
    void syncAction('post_like', post)
    return
  }
  if (action === 'comentar') {
    commentDrafts[post.id] = commentDrafts[post.id] || ''
    void syncAction('comment_open', post)
    return
  }
  if (action === 'morral') void syncAction('post_save', post)
  if (action === 'compa') void syncAction('user_follow', post)
  if (action === 'compartir') void syncAction('post_share', post)
}

function submitComment(post) {
  const text = String(commentDrafts[post.id] || '').trim()
  if (!text) return
  post.comments = [...(post.comments || []), { id: `local-${Date.now()}`, user: 'yo', text }]
  post.commentsCount = Number(post.commentsCount || 0) + 1
  commentDrafts[post.id] = ''
  void syncAction('post_comment', post, { text })
}

function openPublish() {
  showPublishDialog.value = true
}

function selectPublishAction(action) {
  showPublishDialog.value = false
  if (action === 'record') {
    selectedVideoSource.value = 'record'
    cameraInputRef.value?.click()
    return
  }
  if (action === 'device') {
    selectedVideoSource.value = 'device'
    deviceInputRef.value?.click()
    return
  }
  selectedVideoSource.value = 'device'
  deviceInputRef.value?.click()
}

async function onVideoSelected(event) {
  const input = event?.target
  const file = input?.files?.[0]
  if (input) input.value = ''
  if (!file) return

  try {
    const selected = await readPublishMediaFile(file)
    if (selected.mediaType !== 'video') {
      throw new Error('Selecciona un video para publicar en Desma.')
    }
    selectedVideoName.value = selected.fileName
    selectedVideoBase64.value = selected.base64
    selectedVideoError.value = ''
    showDecisionDialog.value = true
  } catch (error) {
    selectedVideoBase64.value = null
    selectedVideoError.value = error?.message || 'No se pudo cargar el video.'
    $q.notify({ type: 'negative', message: selectedVideoError.value })
  }
}

function updatePublishingStage(stage, detail = '') {
  publishingStage.value = stage
  publishingStageDetail.value = detail
  if (stage === 'preparing_media') publishingStageLabel.value = 'Preparando video...'
  else if (stage === 'uploading_media') publishingStageLabel.value = 'Subiendo video...'
  else if (stage === 'processing_video') publishingStageLabel.value = 'Procesando video...'
  else if (stage === 'creating_post') publishingStageLabel.value = 'Creando publicacion...'
  else if (stage === 'done') publishingStageLabel.value = 'Finalizando...'
  else publishingStageLabel.value = 'Preparando video...'
}

function resetSelectedVideo() {
  selectedVideoName.value = 'Video listo para publicar o guardar personal.'
  selectedVideoBase64.value = null
  selectedVideoError.value = ''
  publishingStage.value = 'idle'
  publishingStageLabel.value = 'Preparando video...'
  publishingStageDetail.value = ''
}

async function uploadSelectedDesmaVideo(result) {
  if (!selectedVideoBase64.value) {
    throw new Error('Primero graba o selecciona un video.')
  }

  const session = await getSharedSession()
  if (!session?.userId) {
    throw new Error('Necesitas iniciar sesion para publicar.')
  }

  const postId = `desma-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  const uploaded = await mediaService.uploadMedia({
    base64: selectedVideoBase64.value,
    mediaType: 'video',
    channel: result === 'personal' ? 'gallery' : 'feed_post',
    entityId: result === 'personal' ? session.userId : postId,
    entityContext:
      result === 'personal'
        ? `antojados.desma.personal.${selectedVideoSource.value}`
        : `antojados.desma.${selectedVideoSource.value}`,
  })
  const mediaUrl = await mediaService.waitForUploadedMediaUrl(uploaded, 'desma')

  if (result === 'published') {
    const created = await publishService.createSocialPost({
      post_id: postId,
      user_id: session.userId,
      feed_scope: 'desma',
      venue_name: 'En el Desma',
      caption: selectedVideoName.value,
      description: selectedVideoName.value,
      city_code: cityCode.value || session.cityCode || null,
      scope_level: scopeLevel.value || null,
      scope_code: scopeCode.value || null,
      media_url: mediaUrl,
      media_type: 'video',
      media_intake_id: uploaded.intake_id || null,
    })
    return { session, uploaded, mediaUrl, postId: created.post_id || null }
  }

  return { session, uploaded, mediaUrl, postId: null }
}

async function finishPublish(result) {
  if (publishingVideo.value) return
  if (result === 'discard') {
    showDecisionDialog.value = false
    resetSelectedVideo()
    return
  }

  publishingVideo.value = true
  updatePublishingStage('preparing_media')
  try {
    const outcome = await uploadSelectedDesmaVideo(result)
    await pushEvent({
      eventType: result === 'published' ? 'desma_publish' : 'desma_save_personal',
      postId: outcome.postId,
      scopeLevel: scopeLevel.value,
      scopeCode: scopeCode.value,
      cityCode: cityCode.value,
      feedScope: 'desma',
      channel: 'desma',
      payload: {
        video_name: selectedVideoName.value,
        result,
        source: selectedVideoSource.value,
        media_url: outcome.mediaUrl,
        intake_id: outcome.uploaded?.intake_id || null,
      },
    })
    showDecisionDialog.value = false
    $q.notify({
      type: 'positive',
      message: result === 'published' ? 'Desma publicado.' : 'Desma guardado.',
    })
    resetSelectedVideo()
    if (result === 'published') await loadFeed()
  } catch (error) {
    selectedVideoError.value = error?.message || 'No se pudo publicar el video.'
    $q.notify({ type: 'negative', message: selectedVideoError.value })
  } finally {
    publishingVideo.value = false
    publishingStage.value = 'idle'
    publishingStageDetail.value = ''
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

async function loadFeed() {
  await load({
    cityCode: cityCode.value,
    scopeLevel: scopeLevel.value,
    scopeCode: scopeCode.value,
  })
}

function refreshFeed() {
  void loadFeed()
}

onMounted(async () => {
  await loadFeed()
  posts.value.forEach((post) => {
    if (mutedState[post.id] === undefined) mutedState[post.id] = false
    if (pausedState[post.id] === undefined) pausedState[post.id] = false
  })
  activePostId.value = String(route.query.post_id || posts.value[0]?.id || '')
  await nextTick()
  initializeShortObserver()
  await focusSelectedPost(activePostId.value)
})

watch([scopeLevel, scopeCode], async () => {
  await loadFeed()
})

watch(
  () => route.query.post_id,
  async (postId) => {
    activePostId.value = String(postId || posts.value[0]?.id || '')
    await focusSelectedPost(activePostId.value)
  },
)

watch(
  posts,
  async (nextPosts) => {
    nextPosts.forEach((post) => {
      if (mutedState[post.id] === undefined) mutedState[post.id] = false
      if (pausedState[post.id] === undefined) pausedState[post.id] = false
    })
    await nextTick()
    initializeShortObserver()
    syncPlayback()
  },
  { deep: true },
)

watch(activePostId, () => {
  syncPlayback()
})

onBeforeUnmount(() => {
  if (shortObserver) {
    shortObserver.disconnect()
    shortObserver = null
  }
})
</script>

<style scoped>
.desma-feed-component {
  position: relative;
  height: calc(100dvh - 194px);
  min-height: 0;
  overflow: hidden;
  background: #0a0010;
  isolation: isolate;
}

.desma-feed-component__stream {
  height: 100%;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  scrollbar-width: none;
}

.desma-feed-component__stream::-webkit-scrollbar {
  display: none;
}

.desma-feed-component__short {
  position: relative;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  background: #000;
}

.desma-feed-component__media {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.desma-feed-component__scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.84) 0%, transparent 54%);
  pointer-events: none;
}

.desma-feed-component__top {
  position: absolute;
  top: 10px;
  left: 14px;
  right: 14px;
  z-index: 4;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.desma-feed-component__controls,
.desma-feed-component__status {
  display: flex;
  gap: 8px;
  align-items: center;
}

.desma-feed-component__control-btn {
  width: 52px;
  height: 52px;
  min-width: 52px;
  min-height: 52px;
  background: rgba(0, 0, 0, 0.42);
  backdrop-filter: blur(8px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.34);
  touch-action: manipulation;
}

.desma-feed-component__control-btn :deep(.q-icon) {
  font-size: 28px;
}

.desma-feed-component__duration,
.desma-feed-component__badge {
  width: max-content;
  padding: 4px 10px;
  border-radius: 999px;
  color: white;
  background: rgba(0, 0, 0, 0.55);
  font-size: 12px;
  font-weight: 800;
}

.desma-feed-component__badge {
  background: rgba(124, 58, 237, 0.78);
}

.desma-feed-component__meta {
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

.desma-feed-component__meta strong,
.desma-feed-component__meta span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.desma-feed-component__rail {
  right: 8px;
  top: auto;
  bottom: 154px;
  transform: none;
  z-index: 8;
}

.desma-feed-component__comments {
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

.desma-feed-component__comment-list {
  display: grid;
  gap: 3px;
  min-height: 24px;
  margin-bottom: 6px;
}

.desma-feed-component__comment,
.desma-feed-component__empty-comments {
  overflow: hidden;
  color: rgba(255, 255, 255, 0.84);
  font-size: 12px;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.desma-feed-component__comment strong {
  margin-right: 5px;
  color: #d8b4fe;
}

.desma-feed-component__input-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 6px;
  align-items: center;
  min-height: 38px;
  padding: 0 6px 0 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
}

.desma-feed-component__input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  color: #fff;
  background: transparent;
  font-size: 13px;
}

.desma-feed-component__fab {
  position: absolute;
  right: 18px;
  bottom: 42px;
  z-index: 9;
  width: 54px;
  height: 54px;
  display: inline-grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  color: white;
  background: #7c3aed;
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.38);
  cursor: pointer;
}

.desma-feed-component__native-input {
  display: none;
}

.desma-feed-component__publish-card {
  width: 100%;
  border-radius: 18px 18px 0 0;
  background: #0e1018;
  color: #fff;
}

.desma-feed-component__publish-card h2 {
  margin: 0;
  font-size: 20px;
}

.desma-feed-component__publish-card p {
  margin: 6px 0 0;
  color: rgba(255, 255, 255, 0.64);
  font-size: 12px;
}

.desma-feed-component__publish-error {
  color: #fca5a5;
}

.desma-feed-component__publish-actions {
  display: grid;
  gap: 8px;
}

.desma-feed-component__publish-action {
  width: 100%;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  column-gap: 12px;
  align-items: center;
  padding: 12px;
  border: 1px solid rgba(124, 58, 237, 0.28);
  border-radius: 8px;
  color: #fff;
  background: rgba(255, 255, 255, 0.06);
  text-align: left;
}

.desma-feed-component__publish-action strong,
.desma-feed-component__publish-action span {
  grid-column: 2;
}

.desma-feed-component__publish-action span {
  color: rgba(255, 255, 255, 0.62);
  font-size: 12px;
}

.desma-feed-component__publish-action--muted {
  border-color: rgba(255, 255, 255, 0.14);
}

.desma-feed-component__publish-action:disabled {
  opacity: 0.58;
}

.desma-feed-component__processing-card {
  min-width: min(92vw, 360px);
  border-radius: 16px;
}

@media (max-height: 700px) {
  .desma-feed-component {
    height: calc(100dvh - 184px);
  }

  .desma-feed-component__meta {
    bottom: 92px;
  }

  .desma-feed-component__comments {
    min-height: 70px;
    max-height: 84px;
  }

  .desma-feed-component__rail {
    bottom: 142px;
  }
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
</style>

