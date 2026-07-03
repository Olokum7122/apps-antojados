<template>
  <section class="publicar-pachanga-view">
    <header class="publicar-pachanga-view__header">
      <q-btn flat round icon="arrow_back" color="white" @click="goBack" />
      <div>
        <h1>Publicar en Pachanga</h1>
        <p>Comparte fotos, videos y conecta con la comunidad.</p>
      </div>
    </header>

    <feed-flow-orchestrator-base
      :steps="steps"
      :active-step="activeStep"
      stage="S3"
      variant="publish"
      subdim-ik="PACHANGA_PUBLICAR_FLOW"
      subdim-pc="ANTOJADOS.PA_TI.PACHANGA"
      subdim-type="FLOW"
      subdim-applies-to="social"
      code-component="PACHANGA.PUBLICAR_FLOW"
      :show-back="activeIndex > 0"
      :show-next="activeIndex < steps.length - 1"
      :next-label="activeIndex === steps.length - 2 ? 'Previsualizar' : 'Siguiente'"
      @back="previousStep"
      @next="nextStep"
    >
      <template #default>
        <!-- P1: MEDIA -->
        <section v-if="activeStep === 'media'" class="publicar-pachanga-view__panel">
          <h2>Agrega una foto o video</h2>
          <div class="publicar-pachanga-view__media-actions">
            <button
              type="button"
              class="publicar-pachanga-view__media-btn"
              @click="triggerFilePicker"
            >
              <q-icon name="add_photo_alternate" color="primary" size="36px" />
              <strong>Seleccionar foto/video</strong>
              <span>1 archivo, desde tu galeria o camara</span>
            </button>
          </div>
          <input
            ref="fileInputRef"
            type="file"
            accept="image/*,video/*"
            capture="environment"
            class="publicar-pachanga-view__file"
            @change="onFileChange"
          />
          <div v-if="mediaPreview" class="publicar-pachanga-view__preview-media">
            <img v-if="mediaType === 'photo'" :src="mediaPreview" class="publicar-pachanga-view__thumb" />
            <video v-else :src="mediaPreview" class="publicar-pachanga-view__thumb" muted />
            <q-btn flat dense round icon="close" color="grey-5" size="sm" @click="clearMedia" />
          </div>
          <div v-if="mediaError" class="publicar-pachanga-view__media-error">{{ mediaError }}</div>
        </section>

        <!-- P2: CONTENIDO -->
        <section v-else-if="activeStep === 'contenido'" class="publicar-pachanga-view__panel">
          <h2>Describe tu publicacion</h2>
          <q-input v-model="title" dark filled label="Titulo" maxlength="50" counter />
          <q-input v-model="description" dark filled autogrow label="Descripcion (expand-text en S1)" maxlength="200" counter />
        </section>

        <!-- P3: PREVIEW + PUBLICAR -->
        <section v-else class="publicar-pachanga-view__panel">
          <h2>Vista previa</h2>
          <div class="publicar-pachanga-view__preview-card">
            <div class="publicar-pachanga-view__preview-media-area">
              <img v-if="mediaPreview && mediaType === 'photo'" :src="mediaPreview" class="publicar-pachanga-view__preview-img" />
              <video v-else-if="mediaPreview" :src="mediaPreview" class="publicar-pachanga-view__preview-img" muted />
              <div v-else class="publicar-pachanga-view__preview-placeholder">Sin media</div>
            </div>
            <div class="publicar-pachanga-view__preview-chat-area">
              <div class="publicar-pachanga-view__preview-actions">
                <span class="publicar-pachanga-view__preview-btn">💬 Chat</span>
                <span class="publicar-pachanga-view__preview-btn">👥 Invitar</span>
                <span class="publicar-pachanga-view__preview-btn">✨ Efectos</span>
              </div>
              <div class="publicar-pachanga-view__preview-emojis">
                😍 👍 😂 😮 😢 😡
              </div>
              <div class="publicar-pachanga-view__preview-info">
                <strong>{{ title || 'Sin titulo' }}</strong>
                <p>{{ description || 'Sin descripcion' }}</p>
              </div>
            </div>
          </div>
          <q-btn
            unelevated
            no-caps
            color="primary"
            text-color="dark"
            label="Publicar en Pachanga"
            :loading="publishing"
            @click="submit"
          />
        </section>
      </template>
    </feed-flow-orchestrator-base>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import FeedFlowOrchestratorBase from '@antojados/ui/base/FeedFlowOrchestratorBase.vue'
import { httpClient, mediaService } from '@antojados/api/services'
import { API_ENDPOINTS } from '@antojados/http/endpoints'
import { readPublishMediaFile } from '@antojados/api/composables/usePublishMedia'
import { getSharedSession } from '@antojados/api/storage/session.storage'

const $q = useQuasar()
const router = useRouter()

const steps = [
  { key: 'media', label: 'Media' },
  { key: 'contenido', label: 'Contenido' },
  { key: 'preview', label: 'Preview' },
]
const activeStep = ref('media')

// P1: Media
const fileInputRef = ref(null)
const mediaPreview = ref(null)
const mediaBase64 = ref(null)
const mediaType = ref('photo')
const mediaError = ref(null)

function triggerFilePicker() {
  mediaError.value = null
  fileInputRef.value?.click()
}

async function onFileChange(event) {
  const file = event.target.files?.[0]
  if (!file) return
  try {
    const selected = await readPublishMediaFile(file)
    mediaPreview.value = selected.preview
    mediaBase64.value = selected.base64
    mediaType.value = selected.mediaType
    mediaError.value = null
  } catch (err) {
    mediaError.value = err.message || 'Error al leer archivo'
  }
}

function clearMedia() {
  mediaPreview.value = null
  mediaBase64.value = null
  mediaError.value = null
}

// P2: Contenido
const title = ref('')
const description = ref('')

// Navigation
const activeIndex = computed(() => steps.findIndex((s) => s.key === activeStep.value))

function nextStep() {
  activeStep.value = steps[Math.min(activeIndex.value + 1, steps.length - 1)].key
}

function previousStep() {
  activeStep.value = steps[Math.max(activeIndex.value - 1, 0)].key
}

function goBack() {
  router.push('/red/pa-ti/pachanga')
}

// Submit
const publishing = ref(false)

async function submit() {
  if (publishing.value) return
  publishing.value = true

  try {
    const session = await getSharedSession()
    if (!session?.userId) {
      throw new Error('Necesitas iniciar sesion para publicar.')
    }
    if (!mediaBase64.value) {
      throw new Error('Selecciona una foto o video.')
    }

    // Subir media al Engine
    const uploaded = await mediaService.uploadMedia({
      base64: mediaBase64.value,
      mediaType: mediaType.value,
      channel: 'feed_post',
      entityId: session.userId,
      entityContext: 'antojados.pachanga.user',
    })

    // Publicar en Explorer DB via Gateway usando httpClient (normaliza URLs automáticamente)
    await httpClient.post(API_ENDPOINTS.publications.create, {
      id_post: 'pachanga-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      content_type: 'social',
      id_user: session.userId,
      feed_type: 'default',
      channel: 'pachanga',
      package_type: 'defaultpackage',
      template_code: 'user-s1',
      user_id: session.userId,
      payload_json: {
        title: title.value || null,
        body: description.value || null,
        media_url: uploaded.media_url || null,
        media_type: mediaType.value,
        mediaItems: [{
          mediaAssetId: uploaded.media_asset_id || null,
          mediaType: mediaType.value,
          thumbUrl: uploaded.thumbnail_url || null,
          feedUrl: uploaded.media_url || null,
          fullUrl: uploaded.full_url || null,
        }],
        template_code: 'user-s1',
        body_style_code: 'retro',
        effects: [],
        author_handle: session.displayName || session.userId,
      },
    })

    $q.notify({ type: 'positive', message: 'Publicado en Pachanga!' })
    router.push('/red/pa-ti/pachanga')
  } catch (error) {
    $q.notify({ type: 'negative', message: error?.message || 'No se pudo publicar.' })
  } finally {
    publishing.value = false
  }
}
</script>

<style scoped>
.publicar-pachanga-view {
  min-height: 100%;
  padding: 12px;
  background: #0a0c12;
  color: #fff;
}
.publicar-pachanga-view__header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  margin-bottom: 14px;
}
.publicar-pachanga-view__header h1 { margin: 0; font-size: 22px; }
.publicar-pachanga-view__header p { margin: 4px 0 0; color: rgba(255,255,255,0.64); font-size: 12px; }
.publicar-pachanga-view__panel { display: grid; gap: 12px; }
.publicar-pachanga-view__panel h2 { margin: 0; font-size: 18px; }
.publicar-pachanga-view__file { display: none; }
.publicar-pachanga-view__media-actions { display: grid; }
.publicar-pachanga-view__media-btn {
  min-height: 120px;
  display: grid; align-content: center; justify-items: center; gap: 7px;
  border: 1px dashed rgba(245,158,11,0.28); border-radius: 8px;
  color: #fff; background: #101620; cursor: pointer;
}
.publicar-pachanga-view__media-btn strong { font-size: 14px; }
.publicar-pachanga-view__media-btn span { color: rgba(255,255,255,0.6); font-size: 12px; }
.publicar-pachanga-view__preview-media { display: flex; align-items: center; gap: 10px; }
.publicar-pachanga-view__thumb { width: 80px; height: 80px; border-radius: 8px; object-fit: cover; }
.publicar-pachanga-view__media-error { color: #fca5a5; font-size: 12px; }
.publicar-pachanga-view__preview-card {
  border-radius: 12px; overflow: hidden;
  background: #000; max-width: 380px; margin: 0 auto;
}
.publicar-pachanga-view__preview-media-area {
  aspect-ratio: 1 / 1;
  background: #1a1d2e;
}
.publicar-pachanga-view__preview-img {
  width: 100%; height: 100%; object-fit: cover; display: block;
}
.publicar-pachanga-view__preview-placeholder {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  color: rgba(255,255,255,0.3); font-size: 14px;
}
.publicar-pachanga-view__preview-chat-area {
  padding: 12px; background: #0d0f16; display: grid; gap: 10px;
}
.publicar-pachanga-view__preview-actions { display: flex; gap: 8px; }
.publicar-pachanga-view__preview-btn {
  padding: 6px 14px; border-radius: 999px;
  background: rgba(255,255,255,0.1); font-size: 13px;
}
.publicar-pachanga-view__preview-emojis { font-size: 20px; letter-spacing: 4px; }
.publicar-pachanga-view__preview-info strong { font-size: 15px; }
.publicar-pachanga-view__preview-info p { margin: 4px 0 0; color: rgba(255,255,255,0.6); font-size: 12px; }
</style>