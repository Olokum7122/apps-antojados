<template>
  <section class="publicar-arre-view">
    <header class="publicar-arre-view__header">
      <q-btn flat round icon="arrow_back" color="white" @click="goBack" />
      <div>
        <h1>Publicar en Arre</h1>
        <p>Canal evento: conciertos, noches tematicas, fiestas y experiencias.</p>
      </div>
    </header>

    <feed-flow-orchestrator-base
      :steps="steps"
      :active-step="activeStep"
      stage="S3"
      variant="publish"
      subdim-ik="ARRE_PUBLICAR_FLOW"
      subdim-pc="ANTOJO.ARRE.PUBLICAR"
      subdim-type="FLOW"
      subdim-applies-to="sponsor"
      code-component="ARRE.PUBLICAR_FLOW"
      :show-back="activeIndex > 0"
      :show-next="activeIndex < steps.length - 1"
      :next-label="activeIndex === steps.length - 2 ? 'Previsualizar' : 'Siguiente'"
      @back="previousStep"
      @next="nextStep"
    >
      <template #default>
        <!-- P1: Info del evento (badge fijo) -->
        <section v-if="activeStep === 'evento'" class="publicar-arre-view__panel">
          <h2>Informacion del evento</h2>
          <article class="publicar-arre-view__event-badge">
            <q-badge color="deep-purple-6" text-color="white">EVENTO</q-badge>
            <span>Arre solo publica eventos.</span>
          </article>
          <q-input v-model="eventTitle" dark filled label="Nombre del evento" maxlength="50" counter />
          <q-input v-model="eventDesc1" dark filled autogrow label="Descripcion 1 (fecha/hora)" />
          <q-input v-model="eventDesc2" dark filled autogrow label="Descripcion 2 (ubicacion)" />
          <q-input v-model="eventDesc3" dark filled autogrow label="Descripcion 3 (detalles adicionales)" />
          <q-input v-model="eventPrice" dark filled label="Precio / Donacion (opcional)" type="number" step="0.01" />
        </section>

        <!-- P1: MEDIA (multi-archivo) -->
        <section v-else-if="activeStep === 'media'" class="publicar-arre-view__panel">
          <h2>Agregar media del evento</h2>
          <div class="publicar-arre-view__media-actions">
            <button
              type="button"
              class="publicar-arre-view__media-action"
              @click="triggerMultiFilePicker"
            >
              <q-icon name="add_photo_alternate" color="deep-purple-4" size="32px" />
              <strong>Agregar fotos/video</strong>
              <span>Selecciona 1 o mas archivos</span>
            </button>
          </div>
          <input
            ref="multiInputRef"
            type="file"
            multiple
            accept="image/*,video/*"
            class="publicar-arre-view__file"
            @change="onMultiFileChange"
          />
          <div v-if="mediaItems.length" class="publicar-arre-view__media-list">
            <div v-for="(item, i) in mediaItems" :key="i" class="publicar-arre-view__media-item">
              <img v-if="item.mediaType === 'photo'" :src="item.preview" class="publicar-arre-view__thumb" />
              <video v-else :src="item.preview" class="publicar-arre-view__thumb" muted />
              <span class="publicar-arre-view__media-label">{{ item.fileName }}</span>
              <q-btn flat dense round icon="close" color="grey-5" size="sm" @click="removeMedia(i)" />
            </div>
          </div>
          <div v-if="mediaItems.length" class="publicar-arre-view__media-ready">
            {{ mediaItems.length }} archivo(s) seleccionado(s)
          </div>
          <div v-if="mediaError" class="publicar-arre-view__media-error">{{ mediaError }}</div>
        </section>

        <!-- P2: PUBLICITY / GENERAL -->
        <section v-else-if="activeStep === 'tipo-package'" class="publicar-arre-view__panel">
          <h2>Tipo de package</h2>
          <div class="publicar-arre-view__package-types">
            <button
              type="button"
              :class="['publicar-arre-view__package-btn', packageType === 'publicitypackage' && 'publicar-arre-view__package-btn--active']"
              @click="packageType = 'publicitypackage'"
            >
              <strong>PUBLICITY</strong>
              <span>Contenido promocional con template, look y filtro</span>
            </button>
            <button
              type="button"
              :class="['publicar-arre-view__package-btn', packageType === 'generalpackage' && 'publicar-arre-view__package-btn--active']"
              @click="packageType = 'generalpackage'"
            >
              <strong>GENERAL</strong>
              <span>Contenido simple sin personalizacion visual</span>
            </button>
          </div>
        </section>

        <!-- P3: PREVIEW -->
        <section v-else class="publicar-arre-view__panel">
          <h2>Vista previa</h2>
          <article class="publicar-arre-view__preview">
            <q-badge color="deep-purple-6" text-color="white">EVENTO</q-badge>
            <strong>{{ eventTitle || 'Evento Arre' }}</strong>
            <p>{{ previewDesc || 'Evento listo para publicar.' }}</p>
            <small v-if="packageType === 'publicitypackage'">Template: full-frame | Look: retro | Filter: none</small>
            <small v-else>Package general - sin personalizacion</small>
            <div v-if="mediaItems.length" class="publicar-arre-view__preview-media">
              <img v-for="(item, i) in mediaItems.slice(0, 3)" :key="i" :src="item.preview" class="publicar-arre-view__preview-thumb" />
              <span v-if="mediaItems.length > 3" class="publicar-arre-view__preview-more">+{{ mediaItems.length - 3 }}</span>
            </div>
          </article>
          <div class="publicar-arre-view__p3-buttons">
            <q-btn outline no-caps color="deep-purple-6" label="Template" disable class="publicar-arre-view__p3-btn" />
            <q-btn outline no-caps color="deep-purple-6" label="Look" disable class="publicar-arre-view__p3-btn" />
            <q-btn outline no-caps color="deep-purple-6" label="Filter" disable class="publicar-arre-view__p3-btn" />
          </div>
        </section>
      </template>

      <template #actions>
        <q-btn v-if="activeIndex > 0" flat no-caps color="grey-5" label="Atras" @click="previousStep" />
        <q-btn
          v-if="activeIndex < steps.length - 1"
          unelevated
          no-caps
          color="deep-purple-6"
          text-color="white"
          :disable="!canGoNext"
          :label="activeIndex === steps.length - 2 ? 'Previsualizar' : 'Siguiente'"
          @click="nextStep"
        />
        <q-btn
          v-else
          unelevated
          no-caps
          color="deep-purple-6"
          text-color="white"
          label="Publicar evento"
          :loading="publishing"
          @click="submit"
        />
      </template>
    </feed-flow-orchestrator-base>

    <q-dialog v-model="publishing" persistent>
      <q-card class="publish-processing-card bg-grey-10 text-white">
        <q-card-section class="row items-center q-gutter-sm">
          <q-spinner-dots color="deep-purple-6" size="34px" />
          <div>
            <div class="text-subtitle2">{{ publishingStageLabel }}</div>
            <div class="text-caption text-grey-5">{{ publishingStageDetail }}</div>
          </div>
        </q-card-section>
        <q-card-section>
          <q-linear-progress indeterminate color="deep-purple-6" track-color="grey-8" rounded />
        </q-card-section>
      </q-card>
    </q-dialog>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import FeedFlowOrchestratorBase from '@antojados/ui/base/FeedFlowOrchestratorBase.vue'
import { publishService } from '@antojados/api/services'
import { readPublishMediaFile } from '@antojados/api/composables/usePublishMedia'
import { getSharedSession } from '@antojados/api/storage/session.storage'

const $q = useQuasar()
const router = useRouter()

const steps = [
  { key: 'evento', label: 'Evento' },
  { key: 'media', label: 'Media' },
  { key: 'tipo-package', label: 'Package' },
  { key: 'preview', label: 'Preview' },
]
const activeStep = ref('evento')

// P1: Evento
const eventTitle = ref('')
const eventDesc1 = ref('')
const eventDesc2 = ref('')
const eventDesc3 = ref('')
const eventPrice = ref('')

// P1: Multi Media
const multiInputRef = ref(null)
const mediaFiles = ref([])
const mediaItems = ref([])
const mediaError = ref(null)

function triggerMultiFilePicker() {
  mediaError.value = null
  multiInputRef.value?.click()
}

async function onMultiFileChange(event) {
  const input = event.target
  const files = Array.from(input.files || [])
  if (!files.length) return
  for (const file of files) {
    try {
      const selected = await readPublishMediaFile(file)
      mediaItems.value.push(selected)
      mediaFiles.value.push(file)
    } catch (err) {
      mediaError.value = err.message || 'Error al leer archivo'
    }
  }
  input.value = ''
}

function removeMedia(index) {
  mediaItems.value.splice(index, 1)
  mediaFiles.value.splice(index, 1)
}

// P2: Package type
const packageType = ref('publicitypackage')

// Computed
const activeIndex = computed(() => steps.findIndex((s) => s.key === activeStep.value))

const canGoNext = computed(() => {
  if (activeStep.value === 'evento') return !!eventTitle.value
  if (activeStep.value === 'media') return mediaItems.value.length > 0
  return true
})

const previewDesc = computed(() => {
  return [eventDesc1.value, eventDesc2.value, eventDesc3.value].filter(Boolean).join(' | ')
})

// Navigation
function nextStep() {
  activeStep.value = steps[Math.min(activeIndex.value + 1, steps.length - 1)].key
}

function previousStep() {
  activeStep.value = steps[Math.max(activeIndex.value - 1, 0)].key
}

function goBack() {
  router.push('/antojo/arre/agenda')
}

// Submit
const publishing = ref(false)
const publishingStageLabel = ref('')
const publishingStageDetail = ref('')

async function submit() {
  if (publishing.value) return
  publishing.value = true
  publishingStageLabel.value = 'Preparando publicacion...'
  publishingStageDetail.value = ''

  try {
    const session = await getSharedSession()
    if (!session?.userId || !session?.placeId) {
      throw new Error('Necesitas una sesion sponsor con negocio asignado para publicar.')
    }

    const mediaUrls = []
    const mediaItemsPayload = []
    let uploadedCount = 0

    for (const [i, item] of mediaItems.value.entries()) {
      publishingStageLabel.value = `Subiendo media ${i + 1} de ${mediaItems.value.length}...`
      const { mediaService } = await import('@antojados/api/services')
      const uploaded = await mediaService.uploadMedia({
        base64: item.base64,
        mediaType: item.mediaType,
        channel: 'biz_post',
        entityId: session.placeId,
        entityContext: `antojo.arre.${item.mediaType}`,
      })
      mediaUrls.push(uploaded.media_url || '')
      mediaItemsPayload.push({
        mediaAssetId: uploaded.media_asset_id || null,
        mediaType: item.mediaType,
        thumbUrl: uploaded.thumbnail_url || null,
        feedUrl: uploaded.media_url || null,
        fullUrl: uploaded.full_url || null,
      })
      uploadedCount++
    }

    if (!uploadedCount) throw new Error('No se pudo subir ningun archivo de media.')

    const feedType = packageType.value === 'publicitypackage' ? 'publicity' : 'general'
    const bodyText = [eventDesc1.value, eventDesc2.value, eventDesc3.value].filter(Boolean).join('\n')

    const contentPayload = {
      tipoContent: 'event',
      title: eventTitle.value || 'Evento Arre',
      body: bodyText || null,
      price: eventPrice.value || null,
      badge: 'EVENTO',
      media_url: mediaUrls[0],
      media_type: mediaItems.value[0]?.mediaType || 'photo',
      mediaItems: mediaItemsPayload,
      template_code: 'full-frame',
      body_style_code: 'retro',
      effects: [],
    }

    const result = await publishService.createBizPost({
      place_id: session.placeId,
      publisher_user_id: session.userId,
      channel: 'arre',
      post_type: 'event',
      publication_type: 'event',
      title: eventTitle.value.trim() || 'Evento Arre',
      body: bodyText || null,
      media_url: mediaUrls[0],
      media_type: mediaItems.value[0]?.mediaType || 'photo',
      content_payload: contentPayload,
      feed_type: feedType,
      package_type: packageType.value,
    })

    $q.notify({ type: 'positive', message: 'Evento publicado.' })
    router.replace(result.biz_post_id ? `/antojo/arre/negocio/${session.userId}/post/${result.biz_post_id}` : '/antojo/arre/agenda')
  } catch (error) {
    $q.notify({ type: 'negative', message: error?.message || 'No se pudo publicar el evento.' })
  } finally {
    publishing.value = false
  }
}
</script>

<style scoped>
.publicar-arre-view {
  min-height: 100%;
  padding: 12px;
  background: #0a0c12;
  color: #fff;
}
.publicar-arre-view__header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  margin-bottom: 14px;
}
.publicar-arre-view__header h1 { margin: 0; font-size: 22px; line-height: 1.1; }
.publicar-arre-view__header p { margin: 4px 0 0; color: rgba(255,255,255,0.64); font-size: 12px; }
.publicar-arre-view__panel { display: grid; gap: 12px; }
.publicar-arre-view__panel h2 { margin: 0; font-size: 18px; }
.publicar-arre-view__event-badge {
  display: grid; gap: 6px; padding: 14px;
  border: 1px solid rgba(124,58,237,0.35); border-radius: 8px; background: #111722;
}
.publicar-arre-view__event-badge span { color: rgba(255,255,255,0.68); font-size: 13px; }
.publicar-arre-view__file { display: none; }
.publicar-arre-view__media-actions { display: grid; grid-template-columns: 1fr; gap: 8px; }
.publicar-arre-view__media-action {
  min-height: 100px;
  display: grid; align-content: center; justify-items: center; gap: 7px;
  padding: 12px 8px;
  border: 1px dashed rgba(124,58,237,0.32); border-radius: 8px;
  color: #fff; background: #101620; text-align: center;
}
.publicar-arre-view__media-action strong { font-size: 13px; }
.publicar-arre-view__media-action span { color: rgba(255,255,255,0.62); font-size: 11px; }
.publicar-arre-view__media-list { display: grid; gap: 8px; max-height: 200px; overflow-y: auto; }
.publicar-arre-view__media-item {
  display: flex; align-items: center; gap: 10px;
  padding: 6px; border-radius: 8px; background: #111722;
}
.publicar-arre-view__thumb { width: 48px; height: 48px; border-radius: 6px; object-fit: cover; }
.publicar-arre-view__media-label { flex: 1; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.publicar-arre-view__media-ready { color: rgba(255,255,255,0.72); font-size: 12px; }
.publicar-arre-view__media-error { color: #fca5a5; font-size: 12px; }

.publicar-arre-view__package-types { display: grid; gap: 9px; }
.publicar-arre-view__package-btn {
  display: grid; gap: 6px; padding: 16px;
  border: 2px solid rgba(255,255,255,0.1); border-radius: 12px;
  color: #fff; background: #111722; text-align: left;
}
.publicar-arre-view__package-btn--active { border-color: #7c3aed; background: #1a1f3a; }
.publicar-arre-view__package-btn strong { font-size: 16px; }
.publicar-arre-view__package-btn span { color: rgba(255,255,255,0.6); font-size: 12px; }

.publicar-arre-view__preview {
  display: grid; gap: 8px; padding: 18px;
  border: 1px solid rgba(124,58,237,0.35); border-radius: 8px; background: #101620;
}
.publicar-arre-view__preview p { color: rgba(255,255,255,0.68); }
.publicar-arre-view__preview small { color: rgba(255,255,255,0.5); font-size: 11px; }
.publicar-arre-view__preview-media { display: flex; gap: 6px; align-items: center; }
.publicar-arre-view__preview-thumb { width: 56px; height: 56px; border-radius: 6px; object-fit: cover; }
.publicar-arre-view__preview-more { font-size: 12px; color: rgba(255,255,255,0.5); }
.publicar-arre-view__p3-buttons { display: flex; gap: 8px; justify-content: center; }
.publicar-arre-view__p3-btn { flex: 1; }
.publish-processing-card { min-width: min(92vw, 360px); border-radius: 16px; }
</style>