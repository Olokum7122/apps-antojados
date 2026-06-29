<template>
  <section class="publicar-barrio-view">
    <header class="publicar-barrio-view__header">
      <q-btn flat round icon="arrow_back" color="white" @click="goBack" />
      <div>
        <h1>Publicar en Barrio</h1>
        <p>Comparte fotos y videos de lo que esta pasando en tu zona.</p>
      </div>
    </header>

    <feed-flow-orchestrator-base
      :steps="steps"
      :active-step="activeStep"
      stage="S3"
      variant="publish"
      subdim-ik="BARRIO_PUBLICAR_FLOW"
      subdim-pc="ANTOJADOS.BARRIO"
      subdim-type="FLOW"
      subdim-applies-to="all"
      code-component="BARRIO.PUBLICAR_FLOW"
      :show-back="activeIndex > 0"
      :show-next="activeIndex < steps.length - 1"
      :next-label="activeIndex === steps.length - 2 ? 'Previsualizar' : 'Siguiente'"
      @back="previousStep"
      @next="nextStep"
    >
      <template #default>
        <section v-if="activeStep === 'media'" class="publicar-barrio-view__panel">
          <h2>Agregar media</h2>
          <div class="publicar-barrio-view__media-actions">
            <button
              v-for="source in mediaSources"
              :key="source.key"
              type="button"
              :class="[
                'publicar-barrio-view__media-action',
                selectedMediaSource === source.key && 'publicar-barrio-view__media-action--active',
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
            class="publicar-barrio-view__file"
            @change="onFileChange($event, 'photo')"
          />
          <input
            ref="videoInputRef"
            type="file"
            accept="video/*"
            capture="environment"
            class="publicar-barrio-view__file"
            @change="onFileChange($event, 'video')"
          />
          <input
            ref="deviceInputRef"
            type="file"
            accept="image/*,video/*"
            class="publicar-barrio-view__file"
            @change="onFileChange($event, 'device')"
          />
          <div v-if="hasMedia" class="publicar-barrio-view__media-ready">
            Media lista para subir
            <q-btn flat dense no-caps color="grey-5" label="Quitar" @click="clearMedia" />
          </div>
          <div v-if="mediaError" class="publicar-barrio-view__media-error">
            {{ mediaError }}
          </div>
        </section>

        <section v-else-if="activeStep === 'texto'" class="publicar-barrio-view__panel">
          <h2>Momento</h2>
          <q-input v-model="venueName" dark filled label="Lugar o barrio" />
          <q-input v-model="caption" dark filled autogrow label="Texto" />
        </section>

        <section v-else class="publicar-barrio-view__panel">
          <h2>Vista previa</h2>
          <article class="publicar-barrio-view__preview">
            <q-badge color="primary" text-color="dark">BARRIO</q-badge>
            <strong>{{ venueName || 'Barrio' }}</strong>
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
    <q-dialog v-model="publishing" persistent>
      <q-card class="publish-processing-card bg-grey-10 text-white">
        <q-card-section class="row items-center q-gutter-sm">
          <q-spinner-dots color="primary" size="34px" />
          <div>
            <div class="text-subtitle2">{{ publishingStageLabel }}</div>
            <div class="text-caption text-grey-5">{{ publishingStageDetail || 'No cierres esta pantalla mientras termina el intake.' }}</div>
          </div>
        </q-card-section>
        <q-card-section>
          <q-linear-progress indeterminate color="primary" track-color="grey-8" rounded />
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
import { useLocationScope } from '@antojados/api/composables/useLocationScope'
import { usePublishMedia } from '@antojados/api/composables/usePublishMedia'
import { resolveMediaUploadStageLabel } from '@antojados/api/services/media/media-publish-flow.service'
import { usePublish } from '@antojados/api/composables/usePublish'

const $q = useQuasar()
const router = useRouter()
const { cityCode, scopeLevel, scopeCode } = useLocationScope('barrio')
const steps = [
  { key: 'media', label: 'Media' },
  { key: 'texto', label: 'Texto' },
  { key: 'preview', label: 'Preview' },
]
const activeStep = ref('media')
const selectedMediaSource = ref('photo')
const venueName = ref('Barrio Centro')
const caption = ref('Algo se esta armando en el barrio.')
const publishing = ref(false)
const publishingStageLabel = ref('Preparando video...')
const publishingStageDetail = ref('')
const { publish } = usePublish()
const {
  photoInputRef,
  videoInputRef,
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
  router.push('/red/barrio')
}

function selectMediaSource(sourceKey) {
  selectedMediaSource.value = sourceKey
  triggerFilePicker(sourceKey)
}

async function submit() {
  if (publishing.value) return
  publishing.value = true
  publishingStageLabel.value = 'Preparando...'
  publishingStageDetail.value = ''

  const { postId } = await publish(
    {
      base64: mediaBase64.value,
      file: selectedFile.value,
      mediaType: mediaType.value,
      channel: 'feed_post',
      entityId: `barrio-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      entityContext: `antojados.barrio.${selectedSource.value}`,
    },
    {
      target: 'social',
      feedScope: 'barrio',
      venueName: venueName.value,
      caption: caption.value,
      description: caption.value,
      cityCode: cityCode.value,
      scopeLevel: scopeLevel.value,
      scopeCode: scopeCode.value,
      redirectSuccess: (id) => id ? `/red/barrio/fullscreen/${id}` : '/red/barrio',
    },
    {
      context: 'barrio',
      onStage: (stage, detail = '') => {
        publishingStageLabel.value = resolveMediaUploadStageLabel(stage)
        publishingStageDetail.value = detail
      },
    },
  )
  if (postId) router.replace(`/red/barrio/fullscreen/${postId}`)
  publishing.value = false
  publishingStageLabel.value = 'Preparando...'
  publishingStageDetail.value = ''
}
</script>

<style scoped>
.publicar-barrio-view {
  min-height: 100%;
  padding: 12px;
  background: #0a0c12;
  color: #fff;
}

.publicar-barrio-view__header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  margin-bottom: 14px;
}

.publicar-barrio-view__header h1 {
  margin: 0;
  font-size: 22px;
  line-height: 1.1;
}

.publicar-barrio-view__header p {
  margin: 4px 0 0;
  color: rgba(255, 255, 255, 0.64);
  font-size: 12px;
}

.publicar-barrio-view__panel {
  display: grid;
  gap: 12px;
}

.publicar-barrio-view__panel h2 {
  margin: 0;
  font-size: 18px;
}

.publicar-barrio-view__media-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.publicar-barrio-view__media-action {
  min-height: 126px;
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 7px;
  padding: 12px 8px;
  border: 1px dashed rgba(20, 184, 166, 0.34);
  border-radius: 8px;
  color: #fff;
  background: #101620;
  text-align: center;
}

.publicar-barrio-view__media-action--active {
  border-style: solid;
  border-color: var(--app-primary);
}

.publicar-barrio-view__media-action strong {
  font-size: 13px;
}

.publicar-barrio-view__media-action span,
.publicar-barrio-view__preview p {
  color: rgba(255, 255, 255, 0.64);
  font-size: 11px;
  line-height: 1.2;
}

.publicar-barrio-view__preview {
  display: grid;
  gap: 8px;
  padding: 14px;
  border: 1px solid rgba(20, 184, 166, 0.34);
  border-radius: 8px;
  background: #111722;
}

.publicar-barrio-view__file {
  display: none;
}

.publicar-barrio-view__media-ready {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: rgba(255, 255, 255, 0.72);
  font-size: 12px;
}

.publicar-barrio-view__media-error {
  color: #fca5a5;
  font-size: 12px;
}

.publish-processing-card {
  min-width: min(92vw, 360px);
  border-radius: 16px;
}
</style>
