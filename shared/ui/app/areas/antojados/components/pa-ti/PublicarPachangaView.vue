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
              @click="selectMediaSource('photo')"
            >
              <q-icon name="photo_camera" color="primary" size="36px" />
              <strong>Tomar foto</strong>
              <span>Abrir camara para foto.</span>
            </button>
            <button
              type="button"
              class="publicar-pachanga-view__media-btn"
              @click="selectMediaSource('video')"
            >
              <q-icon name="videocam" color="primary" size="36px" />
              <strong>Grabar video</strong>
              <span>Abrir camara para video.</span>
            </button>
            <button
              type="button"
              class="publicar-pachanga-view__media-btn"
              @click="selectMediaSource('device')"
            >
              <q-icon name="perm_media" color="primary" size="36px" />
              <strong>Dispositivo</strong>
              <span>Elegir desde galeria.</span>
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

        <!-- P1.5: TIPO (Momento vs Resena) -->
        <section v-else-if="activeStep === 'tipo'" class="publicar-pachanga-view__panel">
          <h2>Tipo de publicacion</h2>
          <div class="publicar-pachanga-view__tipo-actions">
            <button
              type="button"
              class="publicar-pachanga-view__tipo-btn publicar-pachanga-view__tipo-btn--active"
              @click="postType = 'momento'"
            >
              <q-icon name="celebration" color="primary" size="32px" />
              <strong>Momento</strong>
              <span>Publica un momento o experiencia con la comunidad</span>
            </button>
            <button
              type="button"
              class="publicar-pachanga-view__tipo-btn"
              @click="goToResena"
            >
              <q-icon name="rate_review" color="amber-4" size="32px" />
              <strong>Resena</strong>
              <span>Resena y calificacion de un lugar o platillo</span>
            </button>
          </div>
        </section>

        <!-- P2: CONTENIDO (Momento) -->
        <section v-else-if="activeStep === 'contenido'" class="publicar-pachanga-view__panel">
          <h2>Describe tu momento</h2>
          <q-input v-model="description" dark filled autogrow label="¿Que esta pasando?" maxlength="200" counter />
        </section>

        <!-- P3: PREVIEW + ESTILOS -->
        <section v-else class="publicar-pachanga-view__panel">
          <h2>Vista previa</h2>
          <div class="publicar-pachanga-view__preview-card">
            <div class="publicar-pachanga-view__preview-media-area">
              <img v-if="mediaPreview && mediaType === 'photo'" :src="mediaPreview" class="publicar-pachanga-view__preview-img" />
              <video v-else-if="mediaPreview" :src="mediaPreview" class="publicar-pachanga-view__preview-img" muted />
              <div v-else class="publicar-pachanga-view__preview-placeholder">Sin media</div>
            </div>
            <div class="publicar-pachanga-view__preview-info">
              <p>{{ description || 'Momento listo para publicar.' }}</p>
            </div>
          </div>

          <div class="publicar-pachanga-view__style-selector">
            <button
              type="button"
              class="publicar-pachanga-view__style-btn"
              @click="openStylePicker('template')"
            >
              <q-icon name="palette" color="primary" size="24px" />
              <div>
                <strong>Plantilla</strong>
                <span>{{ selectedTemplate?.name || 'Ninguna' }}</span>
              </div>
              <q-icon v-if="selectedTemplate" name="check_circle" color="positive" size="20px" />
            </button>

            <button
              type="button"
              class="publicar-pachanga-view__style-btn"
              @click="openStylePicker('look')"
            >
              <q-icon name="style" color="deep-purple-4" size="24px" />
              <div>
                <strong>Look</strong>
                <span>{{ selectedLook?.name || 'Ninguno' }}</span>
              </div>
              <q-icon v-if="selectedLook" name="check_circle" color="positive" size="20px" />
            </button>

            <button
              type="button"
              class="publicar-pachanga-view__style-btn"
              @click="openStylePicker('filter')"
            >
              <q-icon name="blur_on" color="teal-4" size="24px" />
              <div>
                <strong>Filtro</strong>
                <span>{{ selectedFilter?.name || 'Ninguno' }}</span>
              </div>
              <q-icon v-if="selectedFilter" name="check_circle" color="positive" size="20px" />
            </button>
          </div>

          <q-btn
            unelevated
            no-caps
            color="primary"
            text-color="dark"
            label="Publicar en Pachanga"
            :loading="publishing"
            :disable="!mediaBase64"
            @click="submit"
          />
        </section>
      </template>
    </feed-flow-orchestrator-base>

    <!-- Dialog selector de estilos -->
    <q-dialog v-model="styleDialogOpen" persistent>
      <q-card class="publicar-pachanga-view__style-dialog bg-grey-10 text-white">
        <q-card-section>
          <div class="text-h6">{{ styleDialogTitle }}</div>
        </q-card-section>
        <q-card-section class="publicar-pachanga-view__style-list">
          <div v-if="stylesLoading" class="publicar-pachanga-view__style-loading">
            <q-spinner-dots color="primary" size="24px" />
            <p>Cargando...</p>
          </div>
          <q-item
            v-for="item in styleItems"
            :key="item.code"
            clickable
            :active="isStyleSelected(item)"
            active-class="bg-primary text-dark"
            @click="selectStyleItem(item)"
          >
            <q-item-section avatar>
              <q-icon :name="item.icon || 'check'" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ item.name }}</q-item-label>
              <q-item-label v-if="item.description" caption class="text-grey-5">
                {{ item.description }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-icon v-if="isStyleSelected(item)" name="check_circle" color="positive" />
            </q-item-section>
          </q-item>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat no-caps label="Cerrar" color="grey-5" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
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
  { key: 'tipo', label: 'Tipo' },
  { key: 'contenido', label: 'Contenido' },
  { key: 'preview', label: 'Preview' },
]
const activeStep = ref('media')
const postType = ref('momento')
const description = ref('')
const publishing = ref(false)

// P1: Media
const fileInputRef = ref(null)
const mediaPreview = ref(null)
const mediaBase64 = ref(null)
const mediaType = ref('photo')
const mediaError = ref(null)

function selectMediaSource(source) {
  mediaError.value = null
  if (!fileInputRef.value) return
  if (source === 'photo') {
    fileInputRef.value.accept = 'image/*'
    fileInputRef.value.capture = 'environment'
  } else if (source === 'video') {
    fileInputRef.value.accept = 'video/*'
    fileInputRef.value.capture = 'environment'
  } else {
    fileInputRef.value.accept = 'image/*,video/*'
    fileInputRef.value.removeAttribute('capture')
  }
  fileInputRef.value.click()
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

// P1.5: Ir a Resena
function goToResena() {
  router.push('/red/pa-ti/pachanga/publicar-resena')
}

// P3: Estilos
const styleDialogOpen = ref(false)
const styleDialogType = ref('template')
const stylesLoading = ref(false)
const templateItems = ref([])
const lookItems = ref([])
const filterItems = ref([])
const selectedTemplate = ref(null)
const selectedLook = ref(null)
const selectedFilter = ref(null)

const styleDialogTitle = computed(() => {
  const titles = { template: 'Elige una plantilla', look: 'Elige un look', filter: 'Elige un filtro' }
  return titles[styleDialogType.value] || 'Elige estilo'
})

const styleItems = computed(() => {
  if (styleDialogType.value === 'template') return templateItems.value
  if (styleDialogType.value === 'look') return lookItems.value
  return filterItems.value
})

function isStyleSelected(item) {
  if (styleDialogType.value === 'template') return selectedTemplate.value?.code === item.code
  if (styleDialogType.value === 'look') return selectedLook.value?.code === item.code
  return selectedFilter.value?.code === item.code
}

async function openStylePicker(type) {
  styleDialogType.value = type
  styleDialogOpen.value = true
  stylesLoading.value = true

  try {
    if (type === 'template' && templateItems.value.length === 0) {
      const { data } = await httpClient.get('/api/v1/explorer/templates', { params: { status: 'active' } })
      if (data?.templates) templateItems.value = data.templates.map(t => ({
        code: t.template_code,
        name: t.template_name,
        description: t.template_description,
        icon: t.icon,
      }))
    }
    if (type === 'look' && lookItems.value.length === 0) {
      const { data } = await httpClient.get('/api/v1/explorer/looks', { params: { status: 'active' } })
      if (data?.looks) lookItems.value = data.looks.map(l => ({
        code: l.look_code,
        name: l.look_name,
        description: l.look_description,
        icon: 'style',
      }))
    }
    if (type === 'filter' && filterItems.value.length === 0) {
      const { data } = await httpClient.get('/api/v1/explorer/filters', { params: { status: 'active' } })
      if (data?.filters) filterItems.value = data.filters.map(f => ({
        code: f.filter_code,
        name: f.filter_name,
        description: f.filter_description,
        icon: 'blur_on',
      }))
    }
  } catch (err) {
    console.error('Error loading styles:', err)
    $q.notify({ type: 'negative', message: 'Error al cargar estilos' })
  } finally {
    stylesLoading.value = false
  }
}

function selectStyleItem(item) {
  if (styleDialogType.value === 'template') {
    selectedTemplate.value = item
  } else if (styleDialogType.value === 'look') {
    selectedLook.value = item
  } else {
    selectedFilter.value = item
  }
  styleDialogOpen.value = false
}

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
async function submit() {
  if (publishing.value || !mediaBase64.value) return
  publishing.value = true

  try {
    const session = await getSharedSession()
    if (!session?.userId) throw new Error('Necesitas iniciar sesion para publicar.')

    const channel = 'pachanga'
    const postId = `${channel}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    const source = mediaType.value

    // 1. Media Engine
    const uploaded = await mediaService.uploadMedia({
      base64: mediaBase64.value,
      mediaType: mediaType.value,
      channel: 'feed_post',
      entityId: postId,
      entityContext: `antojados.${channel}.momento.${source}`,
    })

    // 2. Explorer DB
    await httpClient.post(API_ENDPOINTS.publications.create, {
      id_post: postId,
      content_type: 'social',
      id_user: session.userId,
      feed_type: channel,
      channel: channel,
      package_type: 'defaultpackage',
      template_code: selectedTemplate.value?.code || null,
      user_id: session.userId,
      payload_json: {
        title: null,
        body: description.value?.trim() || null,
        channel: channel,
        media_url: uploaded.media_url || null,
        media_type: mediaType.value,
        mediaItems: [{
          mediaAssetId: uploaded.media_asset_id || null,
          mediaType: mediaType.value,
          thumbUrl: uploaded.thumbnail_url || null,
          feedUrl: uploaded.media_url || null,
          fullUrl: uploaded.full_url || null,
        }],
        template_code: selectedTemplate.value?.code || null,
        look_code: selectedLook.value?.code || null,
        filter_code: selectedFilter.value?.code || null,
        body_style_code: 'retro',
        effects: [],
        author_handle: session.displayName || session.userId,
      },
    })

    // 3. Antojados DB
    await httpClient.post(API_ENDPOINTS.socialPosts.create, {
      post_id: postId,
      user_id: session.userId,
      channel: channel,
      feed_type: channel,
      venue_name: null,
      caption: description.value?.trim() || null,
      description: description.value?.trim() || null,
      media_url: uploaded.media_url || null,
      media_thumbnail_url: uploaded.thumbnail_url || null,
      media_type: mediaType.value,
      media_intake_id: uploaded.intake_id || null,
      city_code: null,
      scope_level: null,
      scope_code: null,
    })

    $q.notify({ type: 'positive', message: 'Momento publicado en Pachanga!' })
    router.push(`/red/pa-ti/pachanga/fullscreen/${postId}`)
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
.publicar-pachanga-view__media-actions { 
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}
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
.publicar-pachanga-view__tipo-actions { display: grid; gap: 10px; }
.publicar-pachanga-view__tipo-btn {
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 7px;
  padding: 18px 12px;
  border: 2px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  color: #fff;
  background: #101620;
  text-align: center;
  min-height: 110px;
}
.publicar-pachanga-view__tipo-btn--active {
  border-color: var(--app-primary, #7c3aed);
  background: #1a1f3a;
}
.publicar-pachanga-view__tipo-btn strong { font-size: 15px; }
.publicar-pachanga-view__tipo-btn span { color: rgba(255,255,255,0.6); font-size: 12px; margin-top: 2px; }
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
.publicar-pachanga-view__preview-info {
  padding: 12px; background: #0d0f16;
}
.publicar-pachanga-view__preview-info p { margin: 0; color: rgba(255,255,255,0.7); font-size: 13px; }

/* Style selector */
.publicar-pachanga-view__style-selector { display: grid; gap: 8px; }
.publicar-pachanga-view__style-btn {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 14px 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #fff;
  background: #101620;
  text-align: left;
}
.publicar-pachanga-view__style-btn strong { font-size: 14px; display: block; }
.publicar-pachanga-view__style-btn span { font-size: 11px; color: rgba(255, 255, 255, 0.5); }
.publicar-pachanga-view__style-dialog { border-radius: 14px; min-width: min(92vw, 400px); max-height: 80vh; }
.publicar-pachanga-view__style-list { overflow-y: auto; max-height: 50vh; }
.publicar-pachanga-view__style-loading { padding: 20px; text-align: center; }
</style>