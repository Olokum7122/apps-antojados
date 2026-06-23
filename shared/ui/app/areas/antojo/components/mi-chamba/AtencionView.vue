<template>
  <section class="mc-page">
    <app-empty-state v-if="statusMessage" :message="statusMessage" />

    <button-bar-base v-model="activeFilter" :buttons="buttons" :grid-columns="4" @action="onAction" />
    <field-editor-base
      title="Bandeja de seguimiento"
      :fields="fields"
      :model-value="summaryModel"
      info-text="Seguimiento operativo construido con estado real de Registro, E firma y Modulos."
      subdim-ik="MI_CHAMBA_ATENCION_SUMMARY"
      subdim-pc="ANTOJO.MI_CHAMBA.ATENCION"
      code-component="MI_CHAMBA.ATENCION.SUMMARY"
    />
    <entity-grid-base
      :columns="columns"
      :rows="visibleRows"
      row-key="id"
      empty-message="Sin pendientes de atencion"
      subdim-ik="MI_CHAMBA_ATENCION_GRID"
      subdim-pc="ANTOJO.MI_CHAMBA.ATENCION"
      code-component="MI_CHAMBA.ATENCION.GRID"
    >
      <template #cell_item="{ row }">
        <div class="mc-cell">
          <strong>{{ row.item }}</strong>
          <span>{{ row.detail }}</span>
        </div>
      </template>
      <template #cell_priority="{ row }">
        <span :class="priorityClass(row.priority)">{{ row.priority }}</span>
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
  efirmaService,
  equipoService,
  getEfirmaAcceptedUsage,
  modulosService,
  registroService,
} from '@antojados/api/services'

const { session, hydrateSession } = useAuth()

const activeFilter = ref('acciones')
const loading = ref(false)
const statusMessage = ref('')
const rows = ref([])
const resolvedInstanceId = ref(null)
const resolvedTenantUserId = ref(null)
const summaryModel = ref({
  instancia: '',
  cta: '',
  prioridad: '',
})

const buttons = computed(() => [
  { key: 'acciones', label: 'Acciones', loading: loading.value },
  { key: 'nuevas', label: 'Nuevas', loading: loading.value },
  { key: 'resueltas', label: 'Resueltas', loading: loading.value },
  { key: 'recargar', label: 'Recargar', loading: loading.value, variant: 'primary' },
])
const fields = [
  { key: 'instancia', label: 'Instancia', readonly: true },
  { key: 'cta', label: 'CTA principal', readonly: true },
  { key: 'prioridad', label: 'Prioridad', readonly: true },
]
const columns = [
  { key: 'item', label: 'Notificacion' },
  { key: 'status', label: 'Estado' },
  { key: 'priority', label: 'Prioridad' },
  { key: 'action', label: 'CTA' },
]

const currentUserId = computed(() => session.value?.userId || null)
const currentInstanceId = computed(() => session.value?.instanceId || resolvedInstanceId.value || null)
const currentTenantUserId = computed(() => session.value?.tenantUserId || resolvedTenantUserId.value || null)

const visibleRows = computed(() => {
  if (activeFilter.value === 'resueltas') {
    return rows.value.filter((row) => !row.needsAction)
  }
  if (activeFilter.value === 'nuevas') {
    return rows.value.filter((row) => row.priority === 'Alta' || row.priority === 'Media')
  }
  return rows.value.filter((row) => row.needsAction)
})

function normalizeStatus(value) {
  return String(value || '').trim().toLowerCase()
}

function isApprovedStatus(value) {
  return ['approved', 'active', 'accepted', 'authorized', 'complete', 'completed'].includes(normalizeStatus(value))
}

function humanStatus(value, fallback = 'Pendiente') {
  const status = normalizeStatus(value)
  if (!status) return fallback
  if (status === 'pending_review') return 'En revision GT'
  if (status === 'approved') return 'Aprobado'
  if (status === 'active') return 'Activo'
  if (status === 'accepted') return 'Aceptado'
  if (status === 'authorized') return 'Autorizado'
  if (status === 'complete' || status === 'completed') return 'Completo'
  if (status === 'rejected') return 'Rechazado'
  return status.replace(/_/g, ' ')
}

function priorityClass(priority) {
  const level = String(priority || '').toLowerCase()
  return level === 'alta' ? 'mc-priority mc-priority--high' : 'mc-priority'
}

async function ensureSession() {
  if (!session.value?.userId) {
    await hydrateSession()
  }
}

async function resolveContext() {
  await ensureSession()

  if (!currentUserId.value) {
    statusMessage.value = 'Inicia sesion en Tragon para ver Atencion.'
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

  if (!instanceId) {
    statusMessage.value = 'No hay instancia sponsor vinculada.'
    return false
  }

  return true
}

function buildRows({ instancia, efirma, operations }) {
  const registroStatus = instancia?.status || ''
  const registroReady = isApprovedStatus(registroStatus)
  const acceptedUsage = getEfirmaAcceptedUsage(currentInstanceId.value)
  const signatureState = efirma.signature?.lifecycle_state
    || efirma.last_activation?.activation_state
    || (acceptedUsage ? 'accepted' : '')
  const efirmaReady = acceptedUsage?.accepted === true || isApprovedStatus(signatureState)
  const latestOperation = [...operations].sort((left, right) =>
    String(right.operationAt || right.createdAt || '').localeCompare(String(left.operationAt || left.createdAt || '')),
  )[0] || null

  return [
    {
      id: 'registro',
      item: 'Registro sponsor',
      detail: instancia?.instanceId || currentInstanceId.value || 'Sin instancia',
      status: humanStatus(registroStatus, 'Sin registro GT'),
      priority: registroReady ? 'Baja' : 'Alta',
      action: registroReady ? 'Sin accion' : normalizeStatus(registroStatus) === 'pending_review' ? 'Esperar GT' : 'Completar registro',
      needsAction: !registroReady,
    },
    {
      id: 'efirma',
      item: 'E firma',
      detail: efirma.signature?.signature_id || efirma.last_activation?.activation_id || 'Sin activacion aceptada',
      status: humanStatus(signatureState, 'Pendiente'),
      priority: efirmaReady ? 'Baja' : 'Alta',
      action: efirmaReady ? 'Sin accion' : 'Activar E firma',
      needsAction: !efirmaReady,
    },
    {
      id: 'contrato',
      item: 'Contrato marco',
      detail: 'Requiere registro aprobado y E firma aceptada',
      status: registroReady && efirmaReady ? 'Listo para firma' : 'Bloqueado por gates',
      priority: registroReady && efirmaReady ? 'Media' : 'Alta',
      action: registroReady && efirmaReady ? 'Firmar contrato' : 'Completar gates',
      needsAction: true,
    },
    {
      id: 'modulos',
      item: 'Modulos GT',
      detail: latestOperation?.requestId || latestOperation?.id || 'Sin operaciones firmadas',
      status: humanStatus(latestOperation?.operationState, 'Sin operaciones'),
      priority: latestOperation ? 'Baja' : 'Media',
      action: latestOperation ? 'Revisar auditoria' : 'Firmar modulos',
      needsAction: !latestOperation,
    },
  ]
}

async function loadAtencion() {
  const ready = await resolveContext()
  if (!ready) return

  loading.value = true
  statusMessage.value = ''
  try {
    // Shared iOS/TestFlight parity: Atencion must be API-backed; only accepted debt stays mock.
    const [instancia, efirma, operations] = await Promise.all([
      registroService.getInstanciaStatus(currentUserId.value),
      efirmaService.getStatus(currentInstanceId.value),
      modulosService.getOperations(currentInstanceId.value),
    ])
    rows.value = buildRows({ instancia, efirma, operations })
    const firstAction = rows.value.find((row) => row.needsAction) || rows.value[0]
    summaryModel.value = {
      instancia: currentInstanceId.value || '',
      cta: firstAction?.action || 'Sin acciones',
      prioridad: firstAction?.priority || 'Baja',
    }
  } catch (error) {
    statusMessage.value = error instanceof Error ? error.message : 'No se pudo cargar Atencion.'
  } finally {
    loading.value = false
  }
}

function onAction({ key }) {
  if (key === 'recargar') {
    activeFilter.value = 'acciones'
    void loadAtencion()
  }
}

onMounted(() => {
  void loadAtencion()
})
</script>

<style scoped>
.mc-page { display: grid; gap: 10px; }

.mc-cell {
  display: grid;
  gap: 2px;
}

.mc-cell span {
  color: rgba(255, 255, 255, 0.62);
  font-size: 12px;
}

.mc-priority {
  color: rgba(255, 255, 255, 0.68);
  font-weight: 700;
}

.mc-priority--high {
  color: rgba(255, 191, 87, 0.96);
}
</style>
