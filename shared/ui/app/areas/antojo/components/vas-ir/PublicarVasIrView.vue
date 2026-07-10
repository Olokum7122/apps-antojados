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
        <!-- P1: TIPO -->
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
              <q-badge :color="type.color" text-color="white">
                {{ type.label }}
              </q-badge>
              <span>{{ typeHelp[type.value] }}</span>
            </button>
          </div>
        </section>

        <!-- P1: MEDIA (multi-archivo) -->
        <section v-else-if="activeStep === 'media'" class="publicar-vasir-view__panel">
          <h2>Agregar media</h2>
          <div class="publicar-vasir-view__media-actions">
            <button
              type="button"
              class="publicar-vasir-view__media-action"
              @click="triggerMultiFilePicker"
            >
              <q-icon name="add_photo_alternate" color="primary" size="32px" />
              <strong>Agregar fotos/video</strong>
              <span>Selecciona 1 o mas archivos</span>
            </button>
          </div>
          <input
            ref="multiInputRef"
            type="file"
            multiple
            accept="image/*,video/*"
            class="publicar-vasir-view__file"
            @change="onMultiFileChange"
          />

          <!-- Lista de media seleccionada -->
          <div v-if="mediaItems.length" class="publicar-vasir-view__media-list">
            <div
              v-for="(item, i) in mediaItems"
              :key="i"
              class="publicar-vasir-view__media-item"
            >
              <img v-if="item.mediaType === 'photo'" :src="item.preview" class="publicar-vasir-view__thumb" />
              <video v-else :src="item.preview" class="publicar-vasir-view__thumb" muted />
              <span class="publicar-vasir-view__media-label">{{ item.fileName }}</span>
              <q-btn flat dense round icon="close" color="grey-5" size="sm" @click="removeMedia(i)" />
            </div>
          </div>

          <div v-if="mediaItems.length" class="publicar-vasir-view__media-ready">
            {{ mediaItems.length }} archivo(s) seleccionado(s)
          </div>
          <div v-if="mediaError" class="publicar-vasir-view__media-error">{{ mediaError }}</div>

          <q-input v-model="caption" dark filled autogrow label="Descripcion de la publicacion" />
        </section>

        <!-- P2: PUBLICITY o GENERAL -->
        <section v-else-if="activeStep === 'tipo-package'" class="publicar-vasir-view__panel">
          <h2>Tipo de package</h2>
          <div class="publicar-vasir-view__package-types">
            <button
              type="button"
              :class="['publicar-vasir-view__package-btn', packageType === 'publicitypackage' && 'publicar-vasir-view__package-btn--active']"
              @click="packageType = 'publicitypackage'"
            >
              <strong>PUBLICITY</strong>
              <span>Contenido promocional con template, look y filtro</span>
            </button>
            <button
              type="button"
              :class="['publicar-vasir-view__package-btn', packageType === 'generalpackage' && 'publicar-vasir-view__package-btn--active']"
              @click="packageType = 'generalpackage'"
            >
              <strong>GENERAL</strong>
              <span>Contenido simple sin personalizacion visual</span>
            </button>
          </div>

          <!-- Campos PUBLICITY -->
          <template v-if="packageType === 'publicitypackage'">
            <h2>Badge</h2>
            <div class="publicar-vasir-view__badge-row">
              <q-chip
                v-for="b in publicityBadges"
                :key="b.value"
                :selected="selectedBadge === b.value"
                :color="b.color"
                text-color="white"
                size="md"
                clickable
                @click="selectedBadge = b.value"
              >
                {{ b.label }}
              </q-chip>
            </div>
            <q-input v-model="pubTitle" dark filled label="Titulo" maxlength="50" counter />
            <q-input v-model="pubDesc" dark filled autogrow label="Descripcion (expand-text en S1)" />
            <q-input v-model="pubPrice" dark filled label="Precio (opcional)" type="number" step="0.01" />
          </template>

          <!-- Campos GENERAL -->
          <template v-if="packageType === 'generalpackage'">
            <q-badge color="blue-5" text-color="white">GENERAL</q-badge>
            <q-input v-model="genTitle" dark filled label="Titulo" />
            <q-input v-model="genDesc1" dark filled autogrow label="Descripcion 1" />
            <q-input v-model="genDesc2" dark filled autogrow label="Descripcion 2 (opcional)" />
            <q-input v-model="genDesc3" dark filled autogrow label="Descripcion 3 (opcional)" />
          </template>
        </section>

        <!-- P3: PREVIEW + ESTILOS -->
        <section v-else class="publicar-vasir-view__panel">
          <h2>Vista previa</h2>
          <article class="publicar-vasir-view__preview">
            <q-badge :color="badgeColor" text-color="white">{{ badgeLabel }}</q-badge>
            <strong>{{ previewTitle }}</strong>
            <p>{{ previewDesc || 'Publicacion lista para publicar.' }}</p>
            <small v-if="selectedDraft">
              Estilo: {{ selectedDraft.styleName || selectedDraft.id_post }}
              · Template: {{ selectedDraft.templateCode || '—' }}
              · Look: {{ selectedDraft.lookCode || '—' }}
              · Filter: {{ selectedDraft.filterCode || '—' }}
            </small>
            <small v-else>
              Sin estilo seleccionado — usa el boton "Estilos" para elegir uno
            </small>
            <div v-if="mediaItems.length" class="publicar-vasir-view__preview-media">
              <img
                v-for="(item, i) in mediaItems.slice(0, 3)"
                :key="i"
                :src="item.preview"
                class="publicar-vasir-view__preview-thumb"
              />
              <span v-if="mediaItems.length > 3" class="publicar-vasir-view__preview-more">+{{ mediaItems.length - 3 }}</span>
            </div>
          </article>

          <!-- BOTÓN ESTILOS: abre selector de drafts -->
          <div class="publicar-vasir-view__p3-buttons">
            <q-btn
              outline
              no-caps
              color="primary"
              icon="palette"
              :label="selectedDraft ? 'Cambiar estilo' : 'Estilos'"
              class="publicar-vasir-view__p3-btn"
              @click="loadDrafts(); styleDialogOpen = true"
            />
          </div>

          <!-- Dialog selector de estilos -->
          <q-dialog v-model="styleDialogOpen" persistent>
            <q-card class="style-selector-card bg-grey-10 text-white" style="min-width: min(92vw, 400px); max-height: 80vh;">
              <q-card-section>
                <div class="text-h6">🎨 Elige un estilo</div>
                <p class="text-caption text-grey-5">
                  Selecciona el template, look y filtro para tu publicacion
                </p>
              </q-card-section>
              <q-card-section class="style-selector-list" style="overflow-y: auto; max-height: 50vh;">
                <div v-if="draftsLoading" style="padding: 20px; text-align: center;">
                  <q-spinner-dots color="primary" size="24px" />
                  <p class="text-caption text-grey-5">Cargando estilos...</p>
                </div>
                <q-item
                  v-for="draft in availableDrafts"
                  :key="draft.id_post"
                  clickable
                  :active="selectedDraft?.id_post === draft.id_post"
                  active-class="bg-primary text-dark"
                  @click="selectDraft(draft)"
                >
                  <q-item-section avatar>
                    <q-icon name="palette" color="primary" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ draft.styleName || draft.id_post }}</q-item-label>
                    <q-item-label caption class="text-grey-5">
                      Template: {{ draft.templateCode || '—' }}
                      · Look: {{ draft.lookCode || '—' }}
                      · Filter: {{ draft.filterCode || '—' }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-icon v-if="selectedDraft?.id_post === draft.id_post" name="check_circle" color="positive" />
                  </q-item-section>
                </q-item>
                <div v-if="!draftsLoading && !availableDrafts.length" style="padding: 20px; text-align: center; color: rgba(255,255,255,0.4);">
                  No hay estilos disponibles para este tipo de publicacion
                </div>
              </q-card-section>
              <q-card-actions align="right">
                <q-btn flat no-caps label="Cancelar" color="grey-5" v-close-popup />
                <q-btn
                  unelevated
                  no-caps
                  color="primary"
                  text-color="dark"
                  label="Aceptar"
                  :disable="!selectedDraft"
                  v-close-popup
                />
              </q-card-actions>
            </q-card>
          </q-dialog>
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
          :disable="!canGoNext"
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
            <div class="text-caption text-grey-5">{{ publishingStageDetail }}</div>
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
import { httpClient, publishService } from '@antojados/api/services'
import { readPublishMediaFile } from '@antojados/api/composables/usePublishMedia'
import { getSharedSession } from '@antojados/api/storage/session.storage'
import { useLocationScope } from '@antojados/api/composables/useLocationScope'

const $q = useQuasar()
const router = useRouter()

// Geo scope para obtener cityCode y zoneCode de la ubicación persistida
const { cityCode: geoCityCode, zoneScopeCode: geoZoneCode } = useLocationScope('vas_ir')

// ─── Steps ──────────────────────────────────────────────────────────────
const steps = [
  { key: 'tipo', label: 'Tipo' },
  { key: 'media', label: 'Media' },
  { key: 'tipo-package', label: 'Package' },
  { key: 'preview', label: 'Preview' },
]
const activeStep = ref('tipo')

// ─── P3: Estilos (Drafts) ──────────────────────────────────────────
const styleDialogOpen = ref(false)
const availableDrafts = ref([])
const selectedDraft = ref(null)
const draftsLoading = ref(false)

async function loadDrafts() {
  draftsLoading.value = true
  try {
    const pkgType = packageType.value === 'publicitypackage' ? 'publicitypackage' : 'generalpackage'
    const { data } = await httpClient.get('/api/v1/explorer/packages/drafts', {
      params: { package_type: pkgType },
    })
    if (Array.isArray(data?.drafts)) {
      availableDrafts.value = data.drafts
    } else if (Array.isArray(data)) {
      availableDrafts.value = data
    } else {
      availableDrafts.value = []
    }
  } catch (err) {
    console.error('Error loading drafts:', err)
    availableDrafts.value = []
    $q.notify({ type: 'negative', message: 'Error al cargar estilos' })
  } finally {
    draftsLoading.value = false
  }
}

function selectDraft(draft) {
  selectedDraft.value = draft
  $q.notify({ type: 'positive', message: 'Estilo "' + (draft.styleName || draft.id_post) + '" seleccionado', timeout: 1500 })
}

// ─── P1: Type ──────────────────────────────────────────────────────────
const selectedType = ref('promo')
const vasIrTypes = [
  { value: 'promo', label: 'Promo', color: 'orange-5' },
  { value: 'new_dish', label: 'Platillo', color: 'amber-4' },
  { value: 'discount', label: 'Descuento', color: 'green-5' },
  { value: 'general', label: 'General', color: 'blue-5' },
]
const typeHelp = {
  promo: 'Oferta temporal del negocio.',
  new_dish: 'Platillo o producto nuevo.',
  discount: 'Descuento directo o paquete.',
  general: 'Aviso o publicacion informativa.',
}

// ─── P1: Multi Media ───────────────────────────────────────────────────
const multiInputRef = ref(null)
const mediaFiles = ref([])       // File[]
const mediaItems = ref([])       // { preview, base64, mediaType, fileName }
const mediaError = ref(null)
const caption = ref('')

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

  // Reset input para poder seleccionar los mismos archivos de nuevo
  input.value = ''
}

function removeMedia(index) {
  mediaItems.value.splice(index, 1)
  mediaFiles.value.splice(index, 1)
}

// ─── P2: Package type ──────────────────────────────────────────────────
const packageType = ref('publicitypackage')
const selectedBadge = ref('promo')
const pubTitle = ref('')
const pubDesc = ref('')
const pubPrice = ref('')
const genTitle = ref('')
const genDesc1 = ref('')
const genDesc2 = ref('')
const genDesc3 = ref('')

const publicityBadges = [
  { value: 'new_dish', label: 'Platillo', color: 'amber-4' },
  { value: 'promo', label: 'Promo', color: 'orange-5' },
  { value: 'discount', label: 'Descuento', color: 'green-5' },
]

// ─── Computed ──────────────────────────────────────────────────────────
const activeIndex = computed(() => steps.findIndex((s) => s.key === activeStep.value))

const canGoNext = computed(() => {
  if (activeStep.value === 'tipo') return !!selectedType.value
  if (activeStep.value === 'media') return mediaItems.value.length > 0
  if (activeStep.value === 'tipo-package') {
    if (packageType.value === 'publicitypackage') return !!pubTitle.value || !!selectedBadge.value
    return !!genTitle.value
  }
  return true
})

const badgeLabel = computed(() => {
  if (packageType.value === 'generalpackage') return 'GENERAL'
  const b = publicityBadges.find((x) => x.value === selectedBadge.value)
  return b?.label || 'PROMO'
})

const badgeColor = computed(() => {
  if (packageType.value === 'generalpackage') return 'blue-5'
  return publicityBadges.find((x) => x.value === selectedBadge.value)?.color || 'primary'
})

const previewTitle = computed(() => {
  if (packageType.value === 'publicitypackage') return pubTitle.value || 'Sin titulo'
  return genTitle.value || 'Sin titulo'
})

const previewDesc = computed(() => {
  if (packageType.value === 'publicitypackage') return pubDesc.value || ''
  return [genDesc1.value, genDesc2.value, genDesc3.value].filter(Boolean).join(' | ')
})

// ─── Navigation ────────────────────────────────────────────────────────
function nextStep() {
  activeStep.value = steps[Math.min(activeIndex.value + 1, steps.length - 1)].key
}

function previousStep() {
  activeStep.value = steps[Math.max(activeIndex.value - 1, 0)].key
}

function goBack() {
  router.push('/antojo/vas-ir/gallery')
}

// ─── Submit ────────────────────────────────────────────────────────────
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
    if (!session?.userId) {
      throw new Error('Necesitas iniciar sesion para publicar.')
    }

    // Subir media al Engine (1 o N archivos) y obtener feed_url
    let mediaUrl = null
    const mediaItemsPayload = []
    let uploadedCount = 0

    for (const [i, item] of mediaItems.value.entries()) {
      publishingStageLabel.value = `Subiendo media ${i + 1} de ${mediaItems.value.length}...`
      const file = mediaFiles.value[i]
      if (!file) continue

      const { mediaService } = await import('@antojados/api/services')
      const uploaded = await mediaService.uploadMedia({
        base64: item.base64,
        mediaType: item.mediaType,
        channel: 'biz_post',
        entityId: session.userId,
        entityContext: `antojo.vas_ir.${item.mediaType}`,
      })

      if (i === 0) mediaUrl = uploaded.feed_url || uploaded.media_url || null
      mediaItemsPayload.push({
        mediaType: item.mediaType,
        thumbUrl: uploaded.thumb_url || null,
        feedUrl: uploaded.feed_url || null,
        fullUrl: uploaded.full_url || null,
      })
      uploadedCount++
    }

    if (!uploadedCount) throw new Error('No se pudo subir ningun archivo de media.')

    // Construir doc_json solo con los campos permitidos en biz_posts:
    // badge, price, descripciones[] (según DDL real y regla de negocio #2)
    const docJson = JSON.stringify({
      badge: badgeLabel.value,
      price: packageType.value === 'publicitypackage' ? (pubPrice.value || null) : null,
      descripciones: [
        previewTitle.value,
        ...(previewDesc.value ? [previewDesc.value] : []),
      ].filter(Boolean),
    })

    // Obtener city_code y zone_code desde el estado geo persistido
    const cityCode = session.cityCode || geoCityCode.value || null
    const zoneCode = session.zoneCode || geoZoneCode.value || null

    const result = await publishService.createBizPost({
      sponsor_id: session.userId,
      channel: 'vas_ir',
      feed_type: selectedType.value || null,
      media_url: mediaUrl,
      doc_json: docJson,
      city_code: cityCode,
      zone_code: zoneCode,
    })

    $q.notify({ type: 'positive', message: 'Publicacion creada.' })
    router.replace(result.biz_post_id ? `/antojo/vas-ir/gallery` : '/antojo/vas-ir/gallery')
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

.publicar-vasir-view__header h1 { margin: 0; font-size: 22px; line-height: 1.1; }
.publicar-vasir-view__header p { margin: 4px 0 0; color: rgba(255,255,255,0.64); font-size: 12px; }
.publicar-vasir-view__panel { display: grid; gap: 12px; }
.publicar-vasir-view__panel h2 { margin: 0; font-size: 18px; }

.publicar-vasir-view__types { display: grid; gap: 9px; }
.publicar-vasir-view__type {
  display: grid; gap: 7px; padding: 13px;
  border: 1px solid rgba(255,255,255,0.09); border-radius: 8px;
  color: #fff; background: #111722; text-align: left;
}
.publicar-vasir-view__type--active { border-color: var(--app-primary); }
.publicar-vasir-view__type span { color: rgba(255,255,255,0.68); }
.publicar-vasir-view__file { display: none; }

.publicar-vasir-view__media-actions { display: grid; grid-template-columns: 1fr; gap: 8px; }
.publicar-vasir-view__media-action {
  min-height: 100px;
  display: grid; align-content: center; justify-items: center; gap: 7px;
  padding: 12px 8px;
  border: 1px dashed rgba(245,158,11,0.28); border-radius: 8px;
  color: #fff; background: #101620; text-align: center;
}
.publicar-vasir-view__media-action strong { font-size: 13px; }
.publicar-vasir-view__media-action span { color: rgba(255,255,255,0.62); font-size: 11px; }

.publicar-vasir-view__media-list { display: grid; gap: 8px; max-height: 200px; overflow-y: auto; }
.publicar-vasir-view__media-item {
  display: flex; align-items: center; gap: 10px;
  padding: 6px; border-radius: 8px; background: #111722;
}
.publicar-vasir-view__thumb { width: 48px; height: 48px; border-radius: 6px; object-fit: cover; }
.publicar-vasir-view__media-label { flex: 1; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.publicar-vasir-view__media-ready { color: rgba(255,255,255,0.72); font-size: 12px; }
.publicar-vasir-view__media-error { color: #fca5a5; font-size: 12px; }

.publicar-vasir-view__package-types { display: grid; gap: 9px; }
.publicar-vasir-view__package-btn {
  display: grid; gap: 6px; padding: 16px;
  border: 2px solid rgba(255,255,255,0.1); border-radius: 12px;
  color: #fff; background: #111722; text-align: left;
}
.publicar-vasir-view__package-btn--active { border-color: var(--app-primary); background: #1a1f3a; }
.publicar-vasir-view__package-btn strong { font-size: 16px; }
.publicar-vasir-view__package-btn span { color: rgba(255,255,255,0.6); font-size: 12px; }

.publicar-vasir-view__badge-row { display: flex; gap: 6px; flex-wrap: wrap; }

.publicar-vasir-view__preview {
  display: grid; gap: 8px; padding: 18px;
  border: 1px dashed rgba(245,158,11,0.36); border-radius: 8px; background: #101620;
}
.publicar-vasir-view__preview p { color: rgba(255,255,255,0.68); }
.publicar-vasir-view__preview small { color: rgba(255,255,255,0.5); font-size: 11px; }
.publicar-vasir-view__preview-media { display: flex; gap: 6px; align-items: center; }
.publicar-vasir-view__preview-thumb { width: 56px; height: 56px; border-radius: 6px; object-fit: cover; }
.publicar-vasir-view__preview-more { font-size: 12px; color: rgba(255,255,255,0.5); }

.publicar-vasir-view__p3-buttons { display: flex; gap: 8px; justify-content: center; }
.publicar-vasir-view__p3-btn { flex: 1; }

.publish-processing-card { min-width: min(92vw, 360px); border-radius: 16px; }
</style>