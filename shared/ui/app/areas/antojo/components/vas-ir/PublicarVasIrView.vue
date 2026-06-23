<template>
  <section class="publicar-vasir-view">
    <header class="publicar-vasir-view__header">
      <q-btn flat round icon="arrow_back" color="white" @click="goBack" />
      <div>
        <h1>Publicar en Vas Ir</h1>
        <p>Canal negocio: promociones, platillos, descuentos y avisos.</p>
      </div>
    </header>

    <feed-flow-orchestrator-base
      :steps="steps"
      :active-step="activeStep"
      stage="S3"
      variant="publish"
      subdim-ik="VASIR_PUBLICAR_FLOW"
      subdim-pc="ANTOJO.VAS_IR.PUBLICAR"
      subdim-type="FLOW"
      subdim-applies-to="sponsor"
      code-component="VAS_IR.PUBLICAR_FLOW"
      :show-back="activeIndex > 0"
      :show-next="activeIndex < steps.length - 1"
      :next-label="activeIndex === steps.length - 2 ? 'Previsualizar' : 'Siguiente'"
      @back="previousStep"
      @next="nextStep"
    >
      <template #default>
        <section v-if="activeStep === 'tipo'" class="publicar-vasir-view__panel">
          <h2>Tipo de publicacion</h2>
          <div class="publicar-vasir-view__types">
            <button
              v-for="type in vasIrTypes"
              :key="type.value"
              type="button"
              :class="['publicar-vasir-view__type', selectedType === type.value && 'publicar-vasir-view__type--active']"
              @click="selectedType = type.value"
            >
              <q-badge :color="type.color" :text-color="type.color === 'primary' ? 'dark' : 'white'">
                {{ type.label }}
              </q-badge>
              <span>{{ typeHelp[type.value] }}</span>
            </button>
          </div>
        </section>

        <section v-else-if="activeStep === 'media'" class="publicar-vasir-view__panel">
          <h2>Media y texto</h2>
          <div class="publicar-vasir-view__media-actions">
            <button
              v-for="source in mediaSources"
              :key="source.key"
              type="button"
              :class="['publicar-vasir-view__media-action', selectedMediaSource === source.key && 'publicar-vasir-view__media-action--active']"
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
            class="publicar-vasir-view__file"
            @change="onFileChange"
          />
          <div v-if="hasMedia" class="publicar-vasir-view__media-ready">
            Media lista para subir
            <q-btn flat dense no-caps color="grey-5" label="Quitar" @click="clearMedia" />
          </div>
          <div v-if="mediaError" class="publicar-vasir-view__media-error">
            {{ mediaError }}
          </div>
          <q-input v-model="caption" dark filled autogrow label="Texto de la publicacion" />
        </section>

        <section v-else class="publicar-vasir-view__panel">
          <h2>Vista previa</h2>
          <article class="publicar-vasir-view__preview">
            <q-badge :color="selectedTypeMeta.color" :text-color="selectedTypeMeta.color === 'primary' ? 'dark' : 'white'">
              {{ selectedTypeMeta.label }}
            </q-badge>
            <strong>Tu negocio</strong>
            <p>{{ caption || 'Publicacion de ejemplo para Vas Ir.' }}</p>
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
          :disable="activeStep === 'tipo' && !selectedType"
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
import { VAS_IR_POST_TYPES } from '@antojados/ui/mocks/uiFeeds'
import { mediaService, publishService } from '@antojados/api/services'
import { usePublishMedia } from '@antojados/api/composables/usePublishMedia'
import { getSharedSession } from '@antojados/api/storage/session.storage'

const $q = useQuasar()
const router = useRouter()
const steps = [
  { key: 'tipo', label: 'Tipo' },
  { key: 'media', label: 'Media' },
  { key: 'preview', label: 'Preview' },
]
const activeStep = ref('tipo')
const selectedType = ref('promo')
const selectedMediaSource = ref('photo')
const caption = ref('Promo nueva para que la banda se anime a venir.')
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
const vasIrTypes = VAS_IR_POST_TYPES.filter((type) => type.value)
const mediaSources = [
  { key: 'photo', label: 'Foto', icon: 'photo_camera', help: 'Tomar foto para el negocio.' },
  { key: 'video', label: 'Video', icon: 'videocam', help: 'Grabar video corto.' },
  { key: 'device', label: 'Dispositivo', icon: 'perm_media', help: 'Agregar desde galeria.' },
]
const typeHelp = {
  promo: 'Oferta temporal del negocio.',
  new_dish: 'Platillo o producto nuevo.',
  discount: 'Descuento directo o paquete.',
  general: 'Aviso o publicacion informativa.',
}
const activeIndex = computed(() => steps.findIndex((step) => step.key === activeStep.value))
const selectedTypeMeta = computed(() => vasIrTypes.find((type) => type.value === selectedType.value) || vasIrTypes[0])

function nextStep() {
  activeStep.value = steps[Math.min(activeIndex.value + 1, steps.length - 1)].key
}

function previousStep() {
  activeStep.value = steps[Math.max(activeIndex.value - 1, 0)].key
}

function goBack() {
  router.push('/antojo/vas-ir/gallery')
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
    if (!session?.userId || !session?.placeId) {
      throw new Error('Necesitas una sesion sponsor con negocio asignado para publicar.')
    }

    let mediaUrl = null
    if (mediaBase64.value) {
      const uploaded = await mediaService.uploadMedia({
        base64: mediaBase64.value,
        mediaType: mediaType.value,
        channel: 'biz_post',
        entityId: session.placeId,
        entityContext: 'antojo.vas_ir',
      })
      mediaUrl = mediaService.resolveUploadedMediaUrl(uploaded)
    }

    const result = await publishService.createBizPost({
      place_id: session.placeId,
      publisher_user_id: session.userId,
      channel: 'vas_ir',
      post_type: selectedType.value,
      publication_type: selectedType.value,
      title: selectedTypeMeta.value.label,
      body: caption.value.trim() || null,
      media_url: mediaUrl,
      media_type: mediaUrl ? mediaType.value : null,
    })

    $q.notify({ type: 'positive', message: 'Publicacion creada.' })
    router.replace(result.biz_post_id ? `/negocio/${session.userId}/post/${result.biz_post_id}` : '/antojo/vas-ir/gallery')
  } catch (error) {
    $q.notify({ type: 'negative', message: error?.message || 'No se pudo publicar.' })
  } finally {
    publishing.value = false
  }
}
</script>

<style scoped>
.publicar-vasir-view {
  min-height: 100%;
  padding: 12px;
  background: #0a0c12;
  color: #fff;
}

.publicar-vasir-view__header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  margin-bottom: 14px;
}

.publicar-vasir-view__header h1 {
  margin: 0;
  font-size: 22px;
  line-height: 1.1;
}

.publicar-vasir-view__header p {
  margin: 4px 0 0;
  color: rgba(255, 255, 255, 0.64);
  font-size: 12px;
}

.publicar-vasir-view__panel {
  display: grid;
  gap: 12px;
}

.publicar-vasir-view__panel h2 {
  margin: 0;
  font-size: 18px;
}

.publicar-vasir-view__types {
  display: grid;
  gap: 9px;
}

.publicar-vasir-view__type {
  display: grid;
  gap: 7px;
  padding: 13px;
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 8px;
  color: #fff;
  background: #111722;
  text-align: left;
}

.publicar-vasir-view__type--active {
  border-color: var(--app-primary);
}

.publicar-vasir-view__type span,
.publicar-vasir-view__preview p {
  color: rgba(255, 255, 255, 0.68);
}

.publicar-vasir-view__media-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.publicar-vasir-view__media-action {
  min-height: 126px;
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 7px;
  padding: 12px 8px;
  border: 1px dashed rgba(245, 158, 11, 0.28);
  border-radius: 8px;
  color: #fff;
  background: #101620;
  text-align: center;
}

.publicar-vasir-view__media-action--active {
  border-style: solid;
  border-color: var(--app-primary);
}

.publicar-vasir-view__media-action strong {
  font-size: 13px;
}

.publicar-vasir-view__media-action span {
  color: rgba(255, 255, 255, 0.62);
  font-size: 11px;
  line-height: 1.2;
}

.publicar-vasir-view__preview {
  display: grid;
  gap: 8px;
  padding: 18px;
  border: 1px dashed rgba(245, 158, 11, 0.36);
  border-radius: 8px;
  background: #101620;
}

.publicar-vasir-view__file {
  display: none;
}

.publicar-vasir-view__media-ready {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: rgba(255, 255, 255, 0.72);
  font-size: 12px;
}

.publicar-vasir-view__media-error {
  color: #fca5a5;
  font-size: 12px;
}
</style>
