<template>
  <section class="mc-page">
    <app-empty-state v-if="statusMessage" :message="statusMessage" />

    <button-bar-base v-model="activeMode" :buttons="modeButtons" :grid-columns="3" />

    <field-editor-base
      title="Suscripciones y paquetes"
      :fields="summaryFields"
      :model-value="summaryModel"
      subdim-ik="MI_CHAMBA_MODULOS_SUMMARY"
      subdim-pc="ANTOJO.MI_CHAMBA.MODULOS"
      code-component="MI_CHAMBA.MODULOS.SUMMARY"
      @update:model-value="mergeSummary"
    >
      <template #actions>
        <button-bar-base
          v-model="moduleAction"
          :buttons="actionButtons"
          :grid-columns="2"
          @action="onAction"
        />
      </template>
    </field-editor-base>

    <section v-if="signedOrder.downloadUrl" class="mc-order">
      <div>
        <strong>Orden de servicios contratados</strong>
        <span>{{ signedOrder.fileName }}</span>
      </div>
      <a :href="signedOrder.downloadUrl" :download="signedOrder.fileName">Descargar orden firmada</a>
    </section>

    <section class="mc-modules">
      <article v-for="module in modules" :key="module.id" class="mc-module-card">
        <div class="mc-module-card__head">
          <div class="mc-module-card__title">
            <strong>{{ module.label }}</strong>
            <small>{{ module.itemCode }}</small>
          </div>
          <q-checkbox v-model="module.active" dark color="primary" label="Activo" :disable="module.required" />
        </div>

        <p v-if="module.description" class="mc-module-card__description">{{ module.description }}</p>

        <div class="mc-module-card__body">
          <q-select
            v-model="module.plazo"
            filled
            dense
            dark
            emit-value
            map-options
            :options="module.plazoOptions"
            label="Plazo"
          />
          <q-input v-model="module.dateInicia" filled dense dark type="date" label="Fecha inicia" />
        </div>
      </article>
    </section>

    <entity-grid-base
      :columns="operationColumns"
      :rows="operationRows"
      row-key="id"
      empty-message="Sin operaciones"
      subdim-ik="MI_CHAMBA_MODULOS_GRID"
      subdim-pc="ANTOJO.MI_CHAMBA.MODULOS"
      code-component="MI_CHAMBA.MODULOS.GRID"
    >
      <template #cell_action="{ row }">
        <span class="mc-action-text">{{ row.action }}</span>
      </template>
    </entity-grid-base>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import AppEmptyState from '@antojados/ui/base/AppEmptyState.vue'
import ButtonBarBase from '@antojados/ui/base/ButtonBarBase.vue'
import EntityGridBase from '@antojados/ui/base/EntityGridBase.vue'
import FieldEditorBase from '@antojados/ui/base/FieldEditorBase.vue'
import { useAuth } from '@antojados/api/composables/useAuth'
import {
  buildModuloRequestId,
  efirmaService,
  equipoService,
  getEfirmaAcceptedUsage,
  modulosService,
  readTransversalModuleDraft,
  registroService,
} from '@antojados/api/services'

const { session, hydrateSession } = useAuth()

const activeMode = ref('base')
const moduleAction = ref('firmar')
const loading = ref(false)
const statusMessage = ref('')
const resolvedInstanceId = ref(null)
const resolvedTenantUserId = ref(null)
const modules = ref([])
const operations = ref([])
const draft = ref(null)
const signedOrder = ref({
  downloadUrl: '',
  fileName: '',
  expedienteDocumentId: '',
  storageUrl: '',
})
const summaryModel = ref({
  request: '',
  instancia: '',
  origen: 'GT',
  efirma: 'Pendiente',
  orden: '',
  representantePassword: '',
})

const modeButtons = [
  { key: 'base', label: 'Base' },
  { key: 'transversal', label: 'Transversal' },
  { key: 'operacion', label: 'Operacion' },
]

const actionButtons = computed(() => [
  { key: 'recargar', label: 'Recargar GT', loading: loading.value },
  { key: 'firmar', label: 'Firmar y guardar', loading: loading.value, variant: 'primary' },
  { key: 'auditoria', label: 'Auditoria', loading: loading.value },
  { key: 'atencion', label: 'Ir a atencion' },
])

const summaryFields = [
  { key: 'request', label: 'Ultimo request', readonly: true },
  { key: 'instancia', label: 'Instancia', readonly: true },
  { key: 'origen', label: 'Origen Transversal', readonly: true },
  { key: 'efirma', label: 'E firma', readonly: true },
  { key: 'orden', label: 'Orden firmada', readonly: true },
  { key: 'representantePassword', label: 'Contrasena representante', type: 'password' },
]

const operationColumns = [
  { key: 'item', label: 'Modulo' },
  { key: 'status', label: 'Estado' },
  { key: 'action', label: 'Accion' },
]

const currentUserId = computed(() => session.value?.userId || null)
const currentInstanceId = computed(() => session.value?.instanceId || resolvedInstanceId.value || null)
const currentTenantUserId = computed(() => session.value?.tenantUserId || resolvedTenantUserId.value || null)

const operationRows = computed(() => {
  const moduleRows = modules.value.map((module) => ({
    id: `module_${module.id}`,
    item: module.itemCode,
    status: module.active ? `Activo ${module.plazo} meses` : 'Inactivo',
    action: module.locationId || module.sourceComponentCode || 'Pendiente transversal',
  }))

  const historyRows = operations.value.slice(0, 5).map((operation) => ({
    id: operation.id,
    item: operation.requestId || operation.id,
    status: operation.operationState || 'registrado',
    action: operation.operationAt || operation.createdAt || operation.operationBy || 'GT',
  }))

  return [...moduleRows, ...historyRows]
})

function mergeSummary(nextValue) {
  summaryModel.value = { ...summaryModel.value, ...nextValue }
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function normalizeOptions(options) {
  return options.map((value) => ({ label: `${value} mes${String(value) === '1' ? '' : 'es'}`, value }))
}

function mapCatalogToModule(item) {
  const active = item.required || item.requestedEnabled || item.defaultActive
  return {
    id: item.id,
    itemCode: item.itemCode,
    label: item.label,
    description: item.description,
    active,
    required: item.required,
    plazo: item.defaultPlazo || '1',
    plazoOptions: normalizeOptions(item.plazoOptions || [item.defaultPlazo || '1']),
    dateInicia: todayIso(),
    locationId: item.locationId,
    subLocationId: item.subLocationId,
    sourceComponentCode: item.sourceComponentCode,
    sourceSubCode: item.sourceSubCode,
  }
}

function mergeTransversalDraft(catalogModules) {
  draft.value = null

  let nextDraft = null
  try {
    nextDraft = readTransversalModuleDraft()
  } catch (error) {
    statusMessage.value = error instanceof Error ? error.message : 'Draft transversal invalido.'
    return catalogModules
  }

  if (!nextDraft || nextDraft.instance_id !== currentInstanceId.value) {
    return catalogModules
  }

  draft.value = nextDraft
  summaryModel.value.origen = `${nextDraft.source} (${nextDraft.items.length})`

  const nextModules = [...catalogModules]
  nextDraft.items.forEach((item, index) => {
    const match = nextModules.find((module) => (
      (item.location_id && module.locationId === item.location_id)
      || (item.component_code && module.sourceComponentCode === item.component_code)
      || (item.template_location_id && module.subLocationId === item.template_location_id)
    ))

    if (match) {
      match.active = item.enabled || match.active
      match.locationId = match.locationId || item.location_id
      match.sourceComponentCode = match.sourceComponentCode || item.component_code
      return
    }

    nextModules.push({
      id: `draft_${index + 1}`,
      itemCode: item.component_code || item.dimension_code || `DRAFT_${index + 1}`,
      label: item.subscription_label,
      description: item.dimension_code,
      active: item.enabled,
      required: false,
      plazo: '1',
      plazoOptions: normalizeOptions(['1', '3', '6', '12']),
      dateInicia: todayIso(),
      locationId: item.location_id,
      subLocationId: item.template_location_id,
      sourceComponentCode: item.component_code,
      sourceSubCode: item.dimension_code,
    })
  })

  return nextModules
}

async function ensureSession() {
  if (!session.value?.userId) {
    await hydrateSession()
  }
}

async function resolveContext() {
  await ensureSession()

  if (!currentUserId.value) {
    statusMessage.value = 'Inicia sesion en Tragon para operar Modulos.'
    return false
  }

  let instanceId = currentInstanceId.value
  let tenantUserId = currentTenantUserId.value
  if (!instanceId || !tenantUserId) {
    const workspace = await equipoService.getSponsorWorkspace(currentUserId.value)
    instanceId = workspace.instanceId
    tenantUserId = workspace.tenantUserId
  }

  resolvedInstanceId.value = instanceId
  resolvedTenantUserId.value = tenantUserId
  summaryModel.value.instancia = instanceId || ''

  if (!instanceId || !tenantUserId) {
    statusMessage.value = 'No hay instancia sponsor o usuario de instancia representante vinculado.'
    return false
  }

  const accepted = getEfirmaAcceptedUsage(instanceId)
  summaryModel.value.efirma = accepted?.accepted ? `Aceptada ${accepted.accepted_at}` : 'Pendiente'
  return true
}

async function loadModules() {
  const ready = await resolveContext()
  if (!ready) return

  loading.value = true
  statusMessage.value = ''
  try {
    const [catalog, latestOperations] = await Promise.all([
      modulosService.getCatalog(currentInstanceId.value),
      modulosService.getOperations(currentInstanceId.value),
    ])
    const catalogModules = catalog.map(mapCatalogToModule)
    modules.value = mergeTransversalDraft(catalogModules)
    operations.value = latestOperations
    if (modules.value.length === 0) {
      statusMessage.value = 'GT aun no tiene suscripciones producidas para esta instancia.'
    }
  } catch (error) {
    statusMessage.value = error instanceof Error ? error.message : 'No se pudieron cargar modulos GT.'
  } finally {
    loading.value = false
  }
}

function requirePassword() {
  if (String(summaryModel.value.representantePassword || '').trim()) return true
  statusMessage.value = 'Captura la contrasena del representante aprobado.'
  return false
}

function buildPayload(requestId) {
  return {
    request_id: requestId,
    operation_by: currentTenantUserId.value,
    operation_at: new Date().toISOString(),
    operation: {
      summary: 'Operacion de suscripciones y paquetes desde Mi Chamba iOS',
      items: modules.value.map((module) => ({
        item_code: module.itemCode,
        source_component_code: module.sourceComponentCode,
        source_sub_code: module.sourceSubCode,
        location_id: module.locationId,
        sub_location_id: module.subLocationId,
        requested_visible: module.active,
        requested_enabled: module.active,
        plazo: module.plazo,
        date_inicia: module.dateInicia,
      })),
    },
  }
}

function buildSignedOrderDocument(requestId, authorization, operation) {
  const now = new Date().toISOString()
  const lines = [
    'ANTOJADOS MX',
    'ORDEN DE SERVICIOS CONTRATADOS',
    '',
    `Request ID: ${requestId}`,
    `Instancia sponsor: ${currentInstanceId.value}`,
    `Usuario de instancia representante: ${currentTenantUserId.value}`,
    `Fecha de emision: ${now}`,
    `Autorizacion E firma: ${authorization?.authorization_id || 'pendiente'}`,
    `Estado autorizacion: ${authorization?.authorization_state || 'authorized'}`,
    `Operacion GT: ${operation?.id || operation?.requestId || requestId}`,
    '',
    'Servicios, paquetes y suscripciones:',
    ...modules.value.map((module, index) => [
      `${index + 1}. ${module.label}`,
      `   Codigo: ${module.itemCode}`,
      `   Estado contratado: ${module.active ? 'Activo' : 'Inactivo'}`,
      `   Plazo: ${module.plazo} mes${String(module.plazo) === '1' ? '' : 'es'}`,
      `   Fecha inicia: ${module.dateInicia}`,
      `   Location ID: ${module.locationId || 'N/A'}`,
      `   Source component: ${module.sourceComponentCode || 'N/A'}`,
    ].join('\n')),
    '',
    'Declaracion:',
    'El representante legal autorizado acepta digitalmente la contratacion de los servicios descritos en esta orden mediante E firma Antojados MX.',
    '',
    `Firma digital representante: ${authorization?.authorization_id || requestId}`,
    `Sello temporal: ${authorization?.authorized_at || now}`,
  ]

  return lines.join('\n')
}

async function saveSignedOrderToExpediente(requestId, authorization, operation) {
  const content = buildSignedOrderDocument(requestId, authorization, operation)
  const fileName = `orden-servicios-contratados-${requestId}.txt`
  const file = new File([content], fileName, { type: 'text/plain;charset=utf-8' })

  if (signedOrder.value.downloadUrl) {
    URL.revokeObjectURL(signedOrder.value.downloadUrl)
  }

  signedOrder.value = {
    downloadUrl: URL.createObjectURL(file),
    fileName,
    expedienteDocumentId: '',
    storageUrl: '',
  }

  const expedienteDoc = await registroService.uploadSponsorDocument({
    instanceId: currentInstanceId.value,
    userId: currentUserId.value,
    uploadedByTenantUserId: currentTenantUserId.value,
    file,
    docType: 'orden_servicios_contratados',
  })

  signedOrder.value = {
    ...signedOrder.value,
    expedienteDocumentId: expedienteDoc.id || '',
    storageUrl: expedienteDoc.storage_url || '',
  }
  summaryModel.value.orden = expedienteDoc.id ? `Expediente ${expedienteDoc.id}` : 'Orden guardada en expediente'
}

async function signAndSubmit() {
  const ready = await resolveContext()
  if (!ready || !requirePassword()) return

  if (!getEfirmaAcceptedUsage(currentInstanceId.value)) {
    statusMessage.value = 'Primero acepta el uso de E firma para poder firmar Modulos.'
    return
  }

  if (modules.value.length === 0) {
    statusMessage.value = 'No hay suscripciones o paquetes para firmar.'
    return
  }

  const requestId = buildModuloRequestId(currentInstanceId.value)
  loading.value = true
  try {
    const authorization = await efirmaService.authorizeAction({
      instanceId: currentInstanceId.value,
      requestedByTenantUserId: currentTenantUserId.value,
      actionCode: 'MODULOS_ACCEPT',
      resourceType: 'MODULOS',
      resourceId: requestId,
      credentialValidated: true,
    })
    const operation = await modulosService.submitOperation(currentInstanceId.value, buildPayload(requestId))
    await saveSignedOrderToExpediente(requestId, authorization, operation)
    summaryModel.value.request = requestId
    statusMessage.value = `Modulos firmados, orden generada y expediente actualizado: ${operation?.operationState || 'registrado'}.`
    operations.value = await modulosService.getOperations(currentInstanceId.value)
  } catch (error) {
    statusMessage.value = error instanceof Error ? error.message : 'No se pudo firmar y guardar Modulos.'
  } finally {
    loading.value = false
  }
}

async function loadAudit() {
  const ready = await resolveContext()
  if (!ready) return

  loading.value = true
  try {
    operations.value = await modulosService.getAudit(currentInstanceId.value)
    statusMessage.value = 'Auditoria de Modulos cargada.'
  } catch (error) {
    statusMessage.value = error instanceof Error ? error.message : 'No se pudo cargar auditoria.'
  } finally {
    loading.value = false
  }
}

function onAction({ key }) {
  if (key === 'recargar') void loadModules()
  if (key === 'firmar') void signAndSubmit()
  if (key === 'auditoria') void loadAudit()
  if (key === 'atencion') statusMessage.value = 'Atencion queda habilitado cuando GT reciba la operacion firmada.'
}

onMounted(() => {
  void loadModules()
})
</script>

<style scoped>
.mc-page {
  display: grid;
  gap: 10px;
}

.mc-modules {
  display: grid;
  gap: 10px;
}

.mc-order {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background: var(--app-bg-surface);
  border: 1px solid var(--app-border);
}

.mc-order div {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.mc-order span {
  color: rgba(238, 247, 255, 0.72);
  font-size: 12px;
  overflow-wrap: anywhere;
}

.mc-order a {
  flex: 0 0 auto;
  color: rgba(137, 245, 255, 0.96);
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
}

.mc-module-card {
  display: grid;
  gap: 10px;
  padding: 12px;
  border-radius: 8px;
  background: var(--app-bg-surface);
  border: 1px solid var(--app-border);
}

.mc-module-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.mc-module-card__title {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.mc-module-card__title strong,
.mc-module-card__title small {
  overflow-wrap: anywhere;
}

.mc-module-card__title small,
.mc-module-card__description {
  margin: 0;
  color: rgba(238, 247, 255, 0.72);
  font-size: 12px;
}

.mc-module-card__body {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.mc-action-text {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  color: rgba(137, 245, 255, 0.96);
  font-size: 12px;
  font-weight: 700;
}

@media (max-width: 640px) {
  .mc-order,
  .mc-module-card__head,
  .mc-module-card__body {
    grid-template-columns: 1fr;
  }

  .mc-order,
  .mc-module-card__head {
    display: grid;
  }
}
</style>
