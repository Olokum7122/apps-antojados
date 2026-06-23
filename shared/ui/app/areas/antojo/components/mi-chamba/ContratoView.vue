<template>
  <section class="mc-page">
    <app-empty-state v-if="statusMessage" :message="statusMessage" />

    <button-bar-base v-model="activeDocumentId" :buttons="documentButtons" :grid-columns="2" />

    <field-editor-base
      title="Lectura contractual"
      :fields="fields"
      :model-value="model"
      info-text="La firma requiere Registro aprobado, uso de E firma aceptado y aceptacion de contrato marco/anexos."
      subdim-ik="MI_CHAMBA_CONTRATO_LECTURA"
      subdim-pc="ANTOJO.MI_CHAMBA.CONTRATO"
      code-component="MI_CHAMBA.CONTRATO.LECTURA"
      @update:model-value="mergeModel"
    >
      <template #actions>
        <button-bar-base
          v-model="actionKey"
          :buttons="actionButtons"
          :grid-columns="3"
          @action="onAction"
        />
      </template>
    </field-editor-base>

    <section class="mc-document">
      <header class="mc-document__head">
        <strong>{{ activeDocument.label }}</strong>
        <span>{{ activeDocument.source }}</span>
      </header>
      <pre class="mc-document__body">{{ activeDocument.content || 'Cargando documento...' }}</pre>
    </section>

    <entity-grid-base
      :columns="columns"
      :rows="rows"
      row-key="id"
      subdim-ik="MI_CHAMBA_CONTRATO_GRID"
      subdim-pc="ANTOJO.MI_CHAMBA.CONTRATO"
      code-component="MI_CHAMBA.CONTRATO.GRID"
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
import { loadLegalDocumentText } from '@antojados/api/services/legal-documents/legal-documents.service'
import { efirmaService, equipoService, getEfirmaAcceptedUsage, registroService } from '@antojados/api/services'

const APPROVED_STATUSES = new Set(['approved', 'active', 'aprobado'])
const publicBase = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/')
const { session, hydrateSession } = useAuth()

const loading = ref(false)
const statusMessage = ref('')
const actionKey = ref('aceptar')
const activeDocumentId = ref('master')
const acceptedDocs = ref({})
const resolvedInstanceId = ref(null)
const resolvedTenantUserId = ref(null)
const instanciaStatus = ref('')
const model = ref({
  documento: 'Contrato marco sponsor',
  fuente: 'Legal markdown',
  gate: 'Bloqueado hasta aceptar E firma',
  representantePassword: '',
  authorizationId: '',
})

const legalDocuments = ref([
  {
    id: 'master',
    shortLabel: 'Contrato marco',
    label: 'Contrato Marco de Servicios para Sponsors V1',
    source: 'ANTOJADOS_SPONSOR_SERVICES_MASTER_AGREEMENT_DRAFT_V1.md',
    path: `${publicBase}legal/ANTOJADOS_SPONSOR_SERVICES_MASTER_AGREEMENT_DRAFT_V1.md`,
    content: '',
    loaded: false,
  },
  {
    id: 'annexes',
    shortLabel: 'Anexos',
    label: 'Modelo de Anexos de Servicios Sponsor V1',
    source: 'SPONSOR_SERVICES_ANNEX_MODEL_V1.md',
    path: `${publicBase}legal/SPONSOR_SERVICES_ANNEX_MODEL_V1.md`,
    content: '',
    loaded: false,
  },
])

const fields = [
  { key: 'documento', label: 'Documento activo', readonly: true },
  { key: 'fuente', label: 'Fuente legal', readonly: true },
  { key: 'gate', label: 'Gate E firma', readonly: true },
  { key: 'representantePassword', label: 'Contrasena representante', type: 'password' },
  { key: 'authorizationId', label: 'Authorization id', readonly: true },
]

const columns = [
  { key: 'item', label: 'Documento' },
  { key: 'status', label: 'Estado' },
  { key: 'action', label: 'Aceptacion' },
]

const currentUserId = computed(() => session.value?.userId || null)
const currentInstanceId = computed(() => session.value?.instanceId || resolvedInstanceId.value || null)
const currentTenantUserId = computed(() => session.value?.tenantUserId || resolvedTenantUserId.value || null)
const activeDocument = computed(
  () => legalDocuments.value.find((doc) => doc.id === activeDocumentId.value) || legalDocuments.value[0],
)
const documentButtons = computed(() =>
  legalDocuments.value.map((doc) => ({ key: doc.id, label: doc.shortLabel, loading: loading.value && !doc.loaded })),
)
const allDocsAccepted = computed(() =>
  legalDocuments.value.every((doc) => doc.loaded && acceptedDocs.value[doc.id] === true),
)
const isEfirmaAccepted = computed(() => Boolean(currentInstanceId.value && getEfirmaAcceptedUsage(currentInstanceId.value)))
const isRegistroApproved = computed(() => APPROVED_STATUSES.has(String(instanciaStatus.value || '').toLowerCase()))
const canSign = computed(() => allDocsAccepted.value && isEfirmaAccepted.value && isRegistroApproved.value)

const actionButtons = computed(() => [
  { key: 'recargar', label: 'Recargar', loading: loading.value },
  {
    key: 'aceptar',
    label: acceptedDocs.value[activeDocumentId.value] ? 'Quitar aceptacion' : 'Aceptar documento',
    disabled: !activeDocument.value.loaded,
  },
  { key: 'firmar', label: 'Firmar y Validar', loading: loading.value, disabled: !canSign.value, variant: 'primary' },
])

const rows = computed(() =>
  legalDocuments.value.map((doc) => ({
    id: doc.id,
    item: doc.label,
    status: doc.loaded ? (acceptedDocs.value[doc.id] ? 'Aceptado' : 'Pendiente') : 'No cargado',
    action: doc.loaded ? 'Leer y aceptar' : 'Recargar',
  })).concat([
    {
      id: 'gate-registro',
      item: 'Registro Corp',
      status: isRegistroApproved.value ? 'Aprobado' : (instanciaStatus.value || 'Pendiente'),
      action: 'Precondicion',
    },
    {
      id: 'gate-efirma',
      item: 'E firma',
      status: isEfirmaAccepted.value ? 'Aceptada' : 'Pendiente',
      action: 'Precondicion',
    },
  ]),
)

function mergeModel(nextValue) {
  model.value = { ...model.value, ...nextValue }
}

function syncActiveDocumentModel() {
  model.value.documento = activeDocument.value?.label || ''
  model.value.fuente = activeDocument.value?.source || ''
  model.value.gate = isEfirmaAccepted.value ? 'E firma aceptada' : 'Bloqueado hasta aceptar E firma'
}

async function ensureSession() {
  if (!session.value?.userId) await hydrateSession()
}

async function resolveContext() {
  await ensureSession()
  if (!currentUserId.value) {
    statusMessage.value = 'Inicia sesion en Tragon para firmar contrato.'
    return false
  }

  let instanceId = currentInstanceId.value
  let tenantUserId = currentTenantUserId.value
  if (!instanceId || !tenantUserId) {
    const tenant = await equipoService.getMiTenant(currentUserId.value)
    instanceId = tenant.instanceId
    tenantUserId = tenant.tenantUserId
  }

  resolvedInstanceId.value = instanceId
  resolvedTenantUserId.value = tenantUserId

  if (!instanceId || !tenantUserId) {
    statusMessage.value = 'No hay instancia sponsor o tenant_user_id para firmar.'
    return false
  }

  const instancia = await registroService.getInstanciaStatus(currentUserId.value)
  instanciaStatus.value = instancia?.status || ''
  syncActiveDocumentModel()
  return true
}

async function loadLegalDocuments() {
  loading.value = true
  try {
    const loaded = await Promise.all(
      legalDocuments.value.map(async (doc) => {
        return {
          ...doc,
          content: await loadLegalDocumentText(doc.path, doc.source),
          loaded: true,
        }
      }),
    )
    legalDocuments.value = loaded
    syncActiveDocumentModel()
  } catch (error) {
    statusMessage.value = error instanceof Error ? error.message : 'No se pudieron cargar documentos legales.'
  } finally {
    loading.value = false
  }
}

function toggleActiveAcceptance() {
  acceptedDocs.value = {
    ...acceptedDocs.value,
    [activeDocumentId.value]: acceptedDocs.value[activeDocumentId.value] !== true,
  }
}

function requirePassword() {
  if (String(model.value.representantePassword || '').trim()) return true
  statusMessage.value = 'Captura la contrasena del representante aprobado.'
  return false
}

async function signContract() {
  statusMessage.value = ''
  if (!allDocsAccepted.value) {
    statusMessage.value = 'Debes aceptar contrato marco y anexos.'
    return
  }
  if (!isRegistroApproved.value) {
    statusMessage.value = 'Contrato bloqueado: Registro Corp aun no aprueba el tenant.'
    return
  }
  if (!isEfirmaAccepted.value) {
    statusMessage.value = 'Contrato bloqueado: primero acepta uso de E firma.'
    return
  }
  if (!requirePassword()) return
  if (!(await resolveContext())) return

  loading.value = true
  try {
    const result = await efirmaService.authorizeAction({
      instanceId: currentInstanceId.value,
      requestedByTenantUserId: currentTenantUserId.value,
      actionCode: 'CONTRATO_ACCEPT',
      resourceType: 'CONTRATO',
      resourceId: currentInstanceId.value,
      credentialValidated: true,
    })
    model.value.authorizationId = result?.authorization_id || ''
    statusMessage.value = `Contrato firmado y validado: ${result?.authorization_state || 'ok'}.`
  } catch (error) {
    statusMessage.value = error instanceof Error ? error.message : 'No se pudo firmar contrato con E firma.'
  } finally {
    loading.value = false
  }
}

function onAction({ key }) {
  if (key === 'recargar') {
    void Promise.all([resolveContext(), loadLegalDocuments()])
  }
  if (key === 'aceptar') toggleActiveAcceptance()
  if (key === 'firmar') void signContract()
}

onMounted(async () => {
  await Promise.all([resolveContext(), loadLegalDocuments()])
})
</script>

<style scoped>
.mc-page {
  display: grid;
  gap: 10px;
}

.mc-document {
  display: grid;
  border: 1px solid var(--app-border);
  border-radius: 12px;
  background: var(--app-bg-surface);
  overflow: hidden;
}

.mc-document__head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid var(--app-border);
  color: var(--app-text-primary);
}

.mc-document__head span {
  color: var(--app-text-secondary);
  font-size: 12px;
  overflow-wrap: anywhere;
}

.mc-document__body {
  max-height: 420px;
  overflow: auto;
  margin: 0;
  padding: 12px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  color: var(--app-text-secondary);
  font-size: 12px;
  line-height: 1.55;
}

.mc-action-text {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  color: rgba(137, 245, 255, 0.96);
  font-size: 12px;
  font-weight: 700;
}
</style>
