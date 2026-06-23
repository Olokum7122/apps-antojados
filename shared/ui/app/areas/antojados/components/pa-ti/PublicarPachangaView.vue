<template>
  <section class="publicar-pachanga-view">
    <header class="publicar-pachanga-view__header">
      <q-btn flat round icon="arrow_back" color="white" @click="goBack" />
      <div>
        <h1>Publicar en Pachanga</h1>
        <p>Comparte fotos y videos del momento para la banda.</p>
      </div>
    </header>

    <feed-flow-orchestrator-base
      :steps="steps"
      :active-step="activeStep"
      stage="S3"
      variant="publish"
      subdim-ik="PACHANGA_PUBLICAR_FLOW"
      subdim-pc="ANTOJADOS.PARA_TI.PACHANGA"
      subdim-type="FLOW"
      subdim-applies-to="all"
      code-component="PACHANGA.PUBLICAR_FLOW"
      :show-back="activeIndex > 0"
      :show-next="activeIndex < steps.length - 1"
      :next-label="activeIndex === steps.length - 2 ? 'Previsualizar' : 'Siguiente'"
      @back="previousStep"
      @next="nextStep"
    >
      <template #default>
        <section v-if="activeStep === 'media'" class="publicar-pachanga-view__panel">
          <h2>Agregar media</h2>
          <div class="publicar-pachanga-view__media-actions">
            <button
              v-for="source in mediaSources"
              :key="source.key"
              type="button"
              :class="[
                'publicar-pachanga-view__media-action',
                selectedMediaSource === source.key && 'publicar-pachanga-view__media-action--active',
              ]"
              @click="selectMediaSource(source.key)"
            >
              <q-icon :name="source.icon" color="primary" size="32px" />
              <strong>{{ source.label }}</strong>
              <span>{{ source.help }}</span>
            </button>
          </div>
          <input
            ref="fileInputRef"
            type="file"
            :accept="accept"
            :capture="capture || undefined"
            class="publicar-pachanga-view__file"
            @change="onFileChange"
          />
          <div v-if="hasMedia" class="publicar-pachanga-view__media-ready">
            Media lista para subir
            <q-btn flat dense no-caps color="grey-5" label="Quitar" @click="clearMedia" />
          </div>
          <div v-if="mediaError" class="publicar-pachanga-view__media-error">
            {{ mediaError }}
          </div>
        </section>

        <section v-else-if="activeStep === 'texto'" class="publicar-pachanga-view__panel">
          <h2>Momento</h2>
          <q-input v-model="venueName" dark filled label="Lugar o pachanga" />
          <q-input v-model="caption" dark filled autogrow label="Texto" />
        </section>

        <section v-else class="publicar-pachanga-view__panel">
          <h2>Vista previa</h2>
          <article class="publicar-pachanga-view__preview">
            <q-badge color="primary" text-color="dark">PACHANGA</q-badge>
            <strong>{{ venueName || 'Pachanga' }}</strong>
            <p>{{ caption || 'Momento listo para publicar.' }}</p>
          </article>
        </section>
      </template>

      <template #actions>
        <q-btn v-if="activeIndex > 0" flat no-caps color="grey-5" label="Atras" @click="previousStep" />
        <q-btn
          v-if="activeIndex < steps.length - 1"
          unelevated
          no-caps
          color="primary"
          text-color="dark"
          :label="activeIndex === steps.length - 2 ? 'Previsualizar' : 'Siguiente'"
          @click="nextStep"
        />
        <q-btn
          v-else
          unelevated
          no-caps
          color="primary"
          text-color="dark"
          label="Publicar"
          :loading="publishing"
          @click="submit"
        />
      </template>
    </feed-flow-orchestrator-base>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import FeedFlowOrchestratorBase from '@antojados/ui/base/FeedFlowOrchestratorBase.vue'
import { useLocationScope } from '@antojados/api/composables/useLocationScope'
import { mediaService, publishService } from '@antojados/api/services'
import { usePublishMedia } from '@antojados/api/composables/usePublishMedia'
import { getSharedSession } from '@antojados/api/storage/session.storage'

const $q = useQuasar()
const router = useRouter()
const { cityCode, scopeLevel, scopeCode } = useLocationScope('pachanga')
const steps = [
  { key: 'media', label: 'Media' },
  { key: 'texto', label: 'Texto' },
  { key: 'preview', label: 'Preview' },
]
const activeStep = ref('media')
const selectedMediaSource = ref('photo')
const venueName = ref('Demo Venue Pachanga')
const caption = ref('Pachanga en vivo con la banda.')
const publishing = ref(false)
const {
  fileInputRef,
  mediaBase64,
  mediaType,
  accept,
  capture,
  mediaError,
  hasMedia,
  triggerFilePicker,
  onFileChange,
  clearMedia,
} = usePublishMedia()
const mediaSources = [
  { key: 'photo', label: 'Foto', icon: 'photo_camera', help: 'Tomar foto ahora.' },
  { key: 'video', label: 'Video', icon: 'videocam', help: 'Grabar video corto.' },
  { key: 'device', label: 'Dispositivo', icon: 'perm_media', help: 'Agregar desde galeria.' },
]
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

async function submit() {
  if (publishing.value) return
  publishing.value = true
  try {
    const session = await getSharedSession()
    if (!session?.userId) throw new Error('Necesitas iniciar sesion para publicar.')

    let mediaUrl = null
    if (mediaBase64.value) {
      const uploaded = await mediaService.uploadMedia({
        base64: mediaBase64.value,
        mediaType: mediaType.value,
        channel: 'feed_post',
        entityId: session.userId,
        entityContext: 'antojados.pachanga',
      })
      mediaUrl = mediaService.resolveUploadedMediaUrl(uploaded)
    }

    const result = await publishService.createSocialPost({
      user_id: session.userId,
      feed_scope: 'pachanga',
      venue_name: venueName.value.trim() || null,
      caption: caption.value.trim() || null,
      description: caption.value.trim() || null,
      city_code: cityCode.value || session.cityCode || null,
      scope_level: scopeLevel.value || null,
      scope_code: scopeCode.value || null,
      media_url: mediaUrl,
      media_type: mediaUrl ? mediaType.value : null,
    })

    $q.notify({ type: 'positive', message: 'Pachanga publicada.' })
    router.replace(result.post_id ? `/red/pa-ti/pachanga/fullscreen/${result.post_id}` : '/red/pa-ti/pachanga')
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

.publicar-pachanga-view__header h1 {
  margin: 0;
  font-size: 22px;
  line-height: 1.1;
}

.publicar-pachanga-view__header p {
  margin: 4px 0 0;
  color: rgba(255, 255, 255, 0.64);
  font-size: 12px;
}

.publicar-pachanga-view__panel {
  display: grid;
  gap: 12px;
}

.publicar-pachanga-view__panel h2 {
  margin: 0;
  font-size: 18px;
}

.publicar-pachanga-view__media-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.publicar-pachanga-view__media-action {
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

.publicar-pachanga-view__media-action--active {
  border-style: solid;
  border-color: var(--app-primary);
}

.publicar-pachanga-view__media-action strong {
  font-size: 13px;
}

.publicar-pachanga-view__media-action span,
.publicar-pachanga-view__preview p {
  color: rgba(255, 255, 255, 0.64);
  font-size: 11px;
  line-height: 1.2;
}

.publicar-pachanga-view__preview {
  display: grid;
  gap: 8px;
  padding: 14px;
  border: 1px solid rgba(245, 158, 11, 0.34);
  border-radius: 8px;
  background: #111722;
}

.publicar-pachanga-view__file {
  display: none;
}

.publicar-pachanga-view__media-ready {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: rgba(255, 255, 255, 0.72);
  font-size: 12px;
}

.publicar-pachanga-view__media-error {
  color: #fca5a5;
  font-size: 12px;
}
</style>
