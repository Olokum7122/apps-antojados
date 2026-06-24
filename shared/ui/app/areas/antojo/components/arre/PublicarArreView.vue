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
        <section v-if="activeStep === 'evento'" class="publicar-arre-view__panel">
          <h2>Tipo de publicacion</h2>
          <article class="publicar-arre-view__event-type">
            <q-badge color="deep-purple-6" text-color="white">EVENTO</q-badge>
            <span>Arre solo publica eventos. No acepta promo, platillo, descuento ni general.</span>
          </article>
          <q-input v-model="eventTitle" dark filled label="Nombre del evento" />
        </section>

        <section v-else-if="activeStep === 'media'" class="publicar-arre-view__panel">
          <h2>Media y texto</h2>
          <div class="publicar-arre-view__media-actions">
            <button
              v-for="source in mediaSources"
              :key="source.key"
              type="button"
              :class="['publicar-arre-view__media-action', selectedMediaSource === source.key && 'publicar-arre-view__media-action--active']"
              @click="selectMediaSource(source.key)"
            >
              <q-icon :name="source.icon" color="deep-purple-4" size="32px" />
              <strong>{{ source.label }}</strong>
              <span>{{ source.help }}</span>
            </button>
          </div>
          <input
            ref="photoInputRef"
            type="file"
            accept="image/*"
            capture="environment"
            class="publicar-arre-view__file"
            @change="onFileChange($event, 'photo')"
          />
          <input
            ref="videoInputRef"
            type="file"
            accept="video/*"
            capture="environment"
            class="publicar-arre-view__file"
            @change="onFileChange($event, 'video')"
          />
          <input
            ref="deviceInputRef"
            type="file"
            accept="image/*,video/*"
            class="publicar-arre-view__file"
            @change="onFileChange($event, 'device')"
          />
          <div v-if="hasMedia" class="publicar-arre-view__media-ready">
            Media lista para subir
            <q-btn flat dense no-caps color="grey-5" label="Quitar" @click="clearMedia" />
          </div>
          <div v-if="mediaError" class="publicar-arre-view__media-error">
            {{ mediaError }}
          </div>
          <q-input v-model="caption" dark filled autogrow label="Descripcion del evento" />
        </section>

        <section v-else-if="activeStep === 'boletos'" class="publicar-arre-view__panel">
          <h2>Boletos y acceso</h2>
          <q-input v-model="ticketLabel" dark filled label="CTA boletos / reservacion" />
          <q-input v-model="eventAccess" dark filled label="Acceso, cover o reservacion" />
        </section>

        <section v-else class="publicar-arre-view__panel">
          <h2>Vista previa</h2>
          <article class="publicar-arre-view__preview">
            <q-badge color="deep-purple-6" text-color="white">EVENTO</q-badge>
            <strong>{{ eventTitle || 'Evento Arre' }}</strong>
            <p>{{ caption || 'Evento listo para publicar en Arre.' }}</p>
            <small>{{ ticketLabel }} / {{ eventAccess }}</small>
          </article>
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
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import FeedFlowOrchestratorBase from '@antojados/ui/base/FeedFlowOrchestratorBase.vue'
import { mediaService, publishService } from '@antojados/api/services'
import { usePublishMedia } from '@antojados/api/composables/usePublishMedia'
import { getSharedSession } from '@antojados/api/storage/session.storage'

const $q = useQuasar()
const router = useRouter()
const steps = [
  { key: 'evento', label: 'Evento' },
  { key: 'media', label: 'Media' },
  { key: 'boletos', label: 'Boletos' },
  { key: 'preview', label: 'Preview' },
]
const activeStep = ref('evento')
const selectedMediaSource = ref('photo')
const eventTitle = ref('Noche tematica')
const caption = ref('Musica, ambiente y reservaciones abiertas.')
const ticketLabel = ref('Reservar boletos')
const eventAccess = ref('Acceso antes de las 10 PM')
const publishing = ref(false)
const {
  photoInputRef,
  videoInputRef,
  deviceInputRef,
  mediaBase64,
  mediaType,
  mediaError,
  selectedSource,
  hasMedia,
  triggerFilePicker,
  onFileChange,
  clearMedia,
} = usePublishMedia()
const mediaSources = [
  { key: 'photo', label: 'Foto', icon: 'photo_camera', help: 'Tomar foto del evento.' },
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
  router.push('/antojo/arre/agenda')
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
    if (!mediaBase64.value) throw new Error('Selecciona una foto o video para publicar en Arre.')

    const uploaded = await mediaService.uploadMedia({
      base64: mediaBase64.value,
      mediaType: mediaType.value,
      channel: 'biz_post',
      entityId: session.placeId,
      entityContext: `antojo.arre.${selectedSource.value}`,
    })
    const mediaUrl = mediaService.requireUploadedMediaUrl(uploaded, 'arre')

    const result = await publishService.createBizPost({
      place_id: session.placeId,
      publisher_user_id: session.userId,
      channel: 'arre',
      post_type: 'event',
      publication_type: 'event',
      title: eventTitle.value.trim() || 'Evento Arre',
      body: [caption.value.trim(), ticketLabel.value.trim(), eventAccess.value.trim()]
        .filter(Boolean)
        .join('\n'),
      cta_label: ticketLabel.value.trim() || null,
      media_url: mediaUrl,
      media_type: mediaType.value,
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

.publicar-arre-view__header h1 {
  margin: 0;
  font-size: 22px;
  line-height: 1.1;
}

.publicar-arre-view__header p {
  margin: 4px 0 0;
  color: rgba(255, 255, 255, 0.64);
  font-size: 12px;
}

.publicar-arre-view__panel {
  display: grid;
  gap: 12px;
}

.publicar-arre-view__panel h2 {
  margin: 0;
  font-size: 18px;
}

.publicar-arre-view__event-type,
.publicar-arre-view__preview {
  display: grid;
  gap: 8px;
  padding: 14px;
  border: 1px solid rgba(124, 58, 237, 0.35);
  border-radius: 8px;
  background: #111722;
}

.publicar-arre-view__event-type span,
.publicar-arre-view__preview p,
.publicar-arre-view__preview small {
  color: rgba(255, 255, 255, 0.68);
}

.publicar-arre-view__media-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.publicar-arre-view__media-action {
  min-height: 126px;
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 7px;
  padding: 12px 8px;
  border: 1px dashed rgba(124, 58, 237, 0.32);
  border-radius: 8px;
  color: #fff;
  background: #101620;
  text-align: center;
}

.publicar-arre-view__media-action--active {
  border-style: solid;
  border-color: #7c3aed;
}

.publicar-arre-view__media-action strong {
  font-size: 13px;
}

.publicar-arre-view__media-action span {
  color: rgba(255, 255, 255, 0.62);
  font-size: 11px;
  line-height: 1.2;
}

.publicar-arre-view__file {
  display: none;
}

.publicar-arre-view__media-ready {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: rgba(255, 255, 255, 0.72);
  font-size: 12px;
}

.publicar-arre-view__media-error {
  color: #fca5a5;
  font-size: 12px;
}
</style>
