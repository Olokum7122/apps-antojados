<template>
  <section class="publicar-resena-view">
    <header class="publicar-resena-view__header">
      <q-btn flat round icon="arrow_back" color="white" @click="goBack" />
      <div>
        <h1>Publicar resena</h1>
        <p>Comparte una resena corta con foto sobre un lugar.</p>
      </div>
    </header>

    <feed-flow-orchestrator-base
      :steps="steps"
      :active-step="activeStep"
      stage="S3"
      variant="publish"
      subdim-ik="PACHANGA_PUBLICAR_RESENA_FLOW"
      subdim-pc="ANTOJADOS.PARA_TI.PACHANGA"
      subdim-type="FLOW"
      subdim-applies-to="all"
      code-component="PACHANGA.PUBLICAR_RESENA_FLOW"
      :show-back="activeIndex > 0"
      :show-next="activeIndex < steps.length - 1"
      :next-label="activeIndex === steps.length - 2 ? 'Previsualizar' : 'Siguiente'"
      @back="previousStep"
      @next="nextStep"
    >
      <template #default>
        <!-- P1: MEDIA -->
        <section v-if="activeStep === 'media'" class="publicar-resena-view__panel">
          <h2>Agregar foto</h2>
          <div class="publicar-resena-view__media-actions">
            <button
              v-for="source in mediaSources"
              :key="source.key"
              type="button"
              :class="[
                'publicar-resena-view__media-action',
                selectedMediaSource === source.key && 'publicar-resena-view__media-action--active',
              ]"
              @click="selectMediaSource(source.key)"
            >
              <q-icon :name="source.icon" color="primary" size="32px" />
              <strong>{{ source.label }}</strong>
              <span>{{ source.help }}</span>
            </button>
          </div>
          <input
            ref="photoInputRef"
            type="file"
            accept="image/*"
            capture="environment"
            class="publicar-resena-view__file"
            @change="onFileChange($event, 'photo')"
          />
          <input
            ref="deviceInputRef"
            type="file"
            accept="image/*"
            class="publicar-resena-view__file"
            @change="onFileChange($event, 'device')"
          />
          <div v-if="hasMedia" class="publicar-resena-view__media-ready">
            Media lista para subir
            <q-btn flat dense no-caps color="grey-5" label="Quitar" @click="clearMedia" />
          </div>
          <div v-if="mediaError" class="publicar-resena-view__media-error">
            {{ mediaError }}
          </div>
        </section>

        <!-- P2: TEXTO -->
        <section v-else-if="activeStep === 'texto'" class="publicar-resena-view__panel">
          <h2>Resena</h2>
          <q-input v-model="venueName" dark filled label="Lugar" />
          <q-input v-model="caption" dark filled autogrow label="Que pex del lugar?" />
        </section>

        <!-- P3: PREVIEW + ESTILOS -->
        <section v-else class="publicar-resena-view__panel">
          <h2>Vista previa</h2>
          <article class="publicar-resena-view__preview">
            <q-badge color="primary" text-color="dark">RESENA</q-badge>
            <strong>{{ venueName || 'Lugar' }}</strong>
            <p>{{ caption || 'Resena lista para publicar.' }}</p>
          </article>

          <div class="publicar-resena-view__style-selector">
            <button
              type="button"
              class="publicar-resena-view__style-btn"
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
              class="publicar-resena-view__style-btn"
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
              class="publicar-resena-view__style-btn"
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
            label="Publicar"
            :loading="publishing"
            :disable="!hasMedia"
            @click="submit"
          />
        </section>
      </template>
    </feed-flow-orchestrator-base>

    <!-- Dialog selector de estilos -->
    <q-dialog v-model="styleDialogOpen" persistent>
      <q-card class="publicar-resena-view__style-dialog bg-grey-10 text-white">
        <q-card-section>
          <div class="text-h6">{{ styleDialogTitle }}</div>
        </q-card-section>
        <q-card-section class="publicar-resena-view__style-list">
          <div v-if="stylesLoading" class="publicar-resena-view__style-loading">
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
import { usePublishMedia } from '@antojados/api/composables/usePublishMedia'
import { getSharedSession } from '@antojados/api/storage/session.storage'

const $q = useQuasar()
const router = useRouter()

const steps = [
  { key: 'media', label: 'Media' },
  { key: 'texto', label: 'Texto' },
  { key: 'preview', label: 'Preview' },
]
const activeStep = ref('media')
const selectedMediaSource = ref('photo')
const venueName = ref('')
const caption = ref('')
const publishing = ref(false)

// P1: Media
const {
  photoInputRef,
  deviceInputRef,
  mediaBase64,
  mediaType,
  mediaError,
  selectedSource,
  hasMedia,
  selectedFile,
  triggerFilePicker,
  onFileChange,
  clearMedia,
} = usePublishMedia({ allowedMediaTypes: ['photo'] })

const mediaSources = [
  { key: 'photo', label: 'Foto', icon: 'photo_camera', help: 'Tomar foto ahora.' },
  { key: 'device', label: 'Dispositivo', icon: 'perm_media', help: 'Agregar foto desde galeria.' },
]

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
const activeIndex = computed(() => steps.findIndex((step) => step.key === activeStep.value))

function nextStep() {
  activeStep.value = steps[Math.min(activeIndex.value + 1, steps.length - 1)].key
}

function previousStep() {
  activeStep.value = steps[Math.max(activeIndex.value - 1, 0)].key
}

function goBack() {
  router.push('/red/pa-ti/pachanga')
}

function selectMediaSource(sourceKey) {
  selectedMediaSource.value = sourceKey
  triggerFilePicker(sourceKey)
}

// ─── SUBMIT: Publicar en los 3 dominios ───
async function submit() {
  if (publishing.value || !mediaBase64.value) return
  publishing.value = true

  try {
    // Validar sesion
    const session = await getSharedSession()
    if (!session?.userId) throw new Error('Necesitas iniciar sesion para publicar.')

    const postId = `neta-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    const channel = 'neta'

    // ─── 1. Media Engine: subir foto ───
    const uploaded = await mediaService.uploadMedia({
      base64: mediaBase64.value,
      mediaType: mediaType.value,
      channel: 'feed_post',
      entityId: postId,
      entityContext: `antojados.${channel}.resena.${selectedSource.value}`,
    })

    // ─── 2. Explorer DB: crear content con payload y codigos ───
    const payloadJson = {
      title: venueName.value?.trim() || 'Resena',
      body: caption.value?.trim() || null,
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
    }

    await httpClient.post(API_ENDPOINTS.publications.create, {
      id_post: postId,
      content_type: 'social',
      id_user: session.userId,
      feed_type: channel,
      channel: channel,
      package_type: 'defaultpackage',
      template_code: selectedTemplate.value?.code || null,
      user_id: session.userId,
      payload_json: payloadJson,
    })

    // ─── 3. Antojados DB: crear soc_post via Gateway ───
    await httpClient.post(API_ENDPOINTS.socialPosts.create, {
      post_id: postId,
      user_id: session.userId,
      channel: channel,
      feed_type: channel,
      venue_name: venueName.value?.trim() || 'Sin ubicacion',
      caption: caption.value?.trim() || null,
      description: caption.value?.trim() || null,
      media_url: uploaded.media_url || null,
      media_thumbnail_url: uploaded.thumbnail_url || null,
      media_type: mediaType.value,
      media_intake_id: uploaded.intake_id || null,
      city_code: null,
      scope_level: null,
      scope_code: null,
    })

    $q.notify({ type: 'positive', message: 'Resena publicada!' })
    router.push(`/red/pa-ti/pachanga/fullscreen/${postId}`)
  } catch (error) {
    $q.notify({ type: 'negative', message: error?.message || 'No se pudo publicar.' })
  } finally {
    publishing.value = false
  }
}
</script>

<style scoped>
.publicar-resena-view {
  min-height: 100%;
  padding: 12px;
  background: #0a0c12;
  color: #fff;
}

.publicar-resena-view__header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  margin-bottom: 14px;
}

.publicar-resena-view__header h1 {
  margin: 0;
  font-size: 22px;
  line-height: 1.1;
}

.publicar-resena-view__header p {
  margin: 4px 0 0;
  color: rgba(255, 255, 255, 0.64);
  font-size: 12px;
}

.publicar-resena-view__panel {
  display: grid;
  gap: 12px;
}

.publicar-resena-view__panel h2 {
  margin: 0;
  font-size: 18px;
}

.publicar-resena-view__media-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.publicar-resena-view__media-action {
  min-height: 126px;
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 7px;
  padding: 12px 8px;
  border: 1px dashed rgba(245, 158, 11, 0.32);
  border-radius: 8px;
  color: #fff;
  background: #101620;
  text-align: center;
}

.publicar-resena-view__media-action--active {
  border-style: solid;
  border-color: var(--app-primary);
}

.publicar-resena-view__media-action strong {
  font-size: 13px;
}

.publicar-resena-view__media-action span,
.publicar-resena-view__preview p {
  color: rgba(255, 255, 255, 0.64);
  font-size: 11px;
  line-height: 1.2;
}

.publicar-resena-view__preview {
  display: grid;
  gap: 8px;
  padding: 14px;
  border: 1px solid rgba(245, 158, 11, 0.34);
  border-radius: 8px;
  background: #111722;
}

/* Style selector */
.publicar-resena-view__style-selector {
  display: grid;
  gap: 8px;
}

.publicar-resena-view__style-btn {
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

.publicar-resena-view__style-btn strong {
  font-size: 14px;
  display: block;
}

.publicar-resena-view__style-btn span {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

.publicar-resena-view__style-dialog {
  border-radius: 14px;
  min-width: min(92vw, 400px);
  max-height: 80vh;
}

.publicar-resena-view__style-list {
  overflow-y: auto;
  max-height: 50vh;
}

.publicar-resena-view__style-loading {
  padding: 20px;
  text-align: center;
}

.publicar-resena-view__file {
  display: none;
}

.publicar-resena-view__media-ready {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: rgba(255, 255, 255, 0.72);
  font-size: 12px;
}

.publicar-resena-view__media-error {
  color: #fca5a5;
  font-size: 12px;
}
</style>