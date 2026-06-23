<template>
  <section class="mc-page">
    <app-empty-state v-if="statusMessage" :message="statusMessage" />

    <button-bar-base v-model="sectionKey" :buttons="sectionButtons" :grid-columns="3" />

    <field-editor-base
      title="Aceptacion de uso de firma"
      :fields="fields"
      :model-value="model"
      info-text="Gate previo para bloquear edicion, firma de Contrato y operacion de Modulos."
      subdim-ik="MI_CHAMBA_EFIRMA_STATUS"
      subdim-pc="ANTOJO.MI_CHAMBA.EFIRMA"
      code-component="MI_CHAMBA.EFIRMA.STATUS"
      @update:model-value="mergeModel"
    >
      <template #actions>
        <button-bar-base
          v-model="actionKey"
          :buttons="actionButtons"
          :grid-columns="2"
          @action="onAction"
        />
      </template>
    </field-editor-base>

    <entity-grid-base
      :columns="columns"
      :rows="rows"
      row-key="id"
      subdim-ik="MI_CHAMBA_EFIRMA_GRID"
      subdim-pc="ANTOJO.MI_CHAMBA.EFIRMA"
      code-component="MI_CHAMBA.EFIRMA.GRID"
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
import { efirmaService, equipoService, getEfirmaAcceptedUsage } from '@antojados/api/services'

const { session, hydrateSession } = useAuth()

const sectionKey = ref('estado')
const actionKey = ref('aceptar')
const loading = ref(false)
const statusMessage = ref('')
const resolvedInstanceId = ref(null)
const resolvedTenantUserId = ref(null)
const signature = ref(null)
const activation = ref(null)
const acceptedUsage = ref(null)
const model = ref({
  instancia: '',
  tenantUserId: '',
  representantePassword: '',
  activationId: '',
  flujo: 'Registro -> E firma -> Contrato -> Atencion -> Modulos',
})

const sectionButtons = [
  { key: 'estado', label: 'Estado' },
  { key: 'uso', label: 'Uso' },
  { key: 'gt', label: 'GT' },
]

const fields = computed(() => [
  { key: 'instancia', label: 'Instancia', readonly: true },
  { key: 'tenantUserId', label: 'Representante tenant user', readonly: true },
  { key: 'representantePassword', label: 'Contrasena representante', type: 'password' },
  { key: 'activationId', label: 'Activation id' },
  { key: 'flujo', label: 'Flujo habilitado', readonly: true },
])

const actionButtons = computed(() => [
  { key: 'recargar', label: 'Recargar GT', loading: loading.value },
  { key: 'activar', label: 'Enviar activacion', loading: loading.value },
  { key: 'aceptar', label: 'Aceptar uso de firma', loading: loading.value, variant: 'primary' },
  { key: 'contrato', label: 'Bloquear/Firmar Contrato', loading: loading.value },
  { key: 'modulos', label: 'Bloquear/Firmar Modulos', loading: loading.value },
])

const columns = [
  { key: 'item', label: 'Paso' },
  { key: 'status', label: 'Estado' },
  { key: 'action', label: 'Accion' },
]

const signatureState = computed(() => signature.value?.lifecycle_state || 'sin_firma')
const activationState = computed(() => activation.value?.activation_state || 'sin_activacion')
const isUsageAccepted = computed(() => acceptedUsage.value?.accepted === true || signatureState.value === 'active')

const rows = computed(() => [
  {
    id: 'ef1',
    item: 'Tenant aprobado en E firma',
    status: signatureState.value,
    action: signature.value?.signature_id || 'Esperar GT',
  },
  {
    id: 'ef2',
    item: 'Activacion representante',
    status: activationState.value,
    action: activation.value?.activation_id || 'Enviar activacion',
  },
  {
    id: 'ef3',
    item: 'Uso de E firma',
    status: isUsageAccepted.value ? 'Aceptado' : 'Pendiente',
    action: isUsageAccepted.value ? 'Contrato y Modulos habilitados' : 'Requiere contrasena',
  },
  {
    id: 'ef4',
    item: 'Contrato',
    status: isUsageAccepted.value ? 'Listo para autorizacion' : 'Bloqueado',
    action: 'CONTRATO_ACCEPT',
  },
  {
    id: 'ef5',
    item: 'Modulos',
    status: isUsageAccepted.value ? 'Listo para autorizacion' : 'Bloqueado',
    action: 'MODULOS_ACCEPT',
  },
])

const currentUserId = computed(() => session.value?.userId || null)
const currentInstanceId = computed(() => session.value?.instanceId || resolvedInstanceId.value || null)
const currentTenantUserId = computed(() => session.value?.tenantUserId || resolvedTenantUserId.value || null)

function mergeModel(nextValue) {
  model.value = { ...model.value, ...nextValue }
}

async function ensureSession() {
  if (!session.value?.userId) {
    await hydrateSession()
  }
}

async function resolveContext() {
  await ensureSession()
  statusMessage.value = ''

  if (!currentUserId.value) {
    statusMessage.value = 'Inicia sesion en Tragon para usar E firma.'
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
  model.value.instancia = instanceId || ''
  model.value.tenantUserId = tenantUserId || ''

  if (!instanceId || !tenantUserId) {
    statusMessage.value = 'No hay instancia sponsor o representante tenant_user_id vinculado.'
    return false
  }

  acceptedUsage.value = getEfirmaAcceptedUsage(instanceId)
  return true
}

async function loadStatus() {
  const ready = await resolveContext()
  if (!ready) return

  loading.value = true
  try {
    const status = await efirmaService.getStatus(currentInstanceId.value)
    signature.value = status.signature
    activation.value = status.last_activation
    model.value.activationId = activation.value?.activation_id || model.value.activationId
    acceptedUsage.value = getEfirmaAcceptedUsage(currentInstanceId.value)
  } catch (error) {
    statusMessage.value = error instanceof Error ? error.message : 'No se pudo cargar estado E firma.'
  } finally {
    loading.value = false
  }
}

function requirePassword() {
  if (String(model.value.representantePassword || '').trim()) return true
  statusMessage.value = 'Captura la contrasena del representante aprobado.'
  return false
}

async function sendActivation() {
  const ready = await resolveContext()
  if (!ready) return

  loading.value = true
  try {
    const result = await efirmaService.sendActivation({
      instanceId: currentInstanceId.value,
      actorTenantUserId: currentTenantUserId.value,
    })
    activation.value = result.activation
    model.value.activationId = result.activation?.activation_id || model.value.activationId
    statusMessage.value = result.activationToken
      ? `Activacion enviada. Token: ${result.activationToken}`
      : 'Activacion enviada.'
  } catch (error) {
    statusMessage.value = error instanceof Error ? error.message : 'No se pudo enviar activacion.'
  } finally {
    loading.value = false
  }
}

async function acceptUsage() {
  const ready = await resolveContext()
  if (!ready || !requirePassword()) return

  const activationId = String(model.value.activationId || activation.value?.activation_id || '').trim()
  if (!activationId) {
    statusMessage.value = 'Falta activation id para aceptar E firma.'
    return
  }

  loading.value = true
  try {
    const result = await efirmaService.acceptActivation({
      instanceId: currentInstanceId.value,
      activationId,
      actorTenantUserId: currentTenantUserId.value,
      credentialValidated: true,
    })
    signature.value = result.signature
    activation.value = result.activation
    acceptedUsage.value = getEfirmaAcceptedUsage(currentInstanceId.value)
    statusMessage.value = 'Uso de E firma aceptado.'
  } catch (error) {
    statusMessage.value = error instanceof Error ? error.message : 'No se pudo aceptar E firma.'
  } finally {
    loading.value = false
  }
}

async function authorizeResource(actionCode, resourceType) {
  const ready = await resolveContext()
  if (!ready || !requirePassword()) return
  if (!isUsageAccepted.value) {
    statusMessage.value = 'Primero acepta el uso de E firma.'
    return
  }

  loading.value = true
  try {
    const result = await efirmaService.authorizeAction({
      instanceId: currentInstanceId.value,
      requestedByTenantUserId: currentTenantUserId.value,
      actionCode,
      resourceType,
      resourceId: currentInstanceId.value,
      credentialValidated: true,
    })
    statusMessage.value = `${resourceType} autorizado: ${result?.authorization_state || 'ok'}.`
  } catch (error) {
    statusMessage.value = error instanceof Error ? error.message : `No se pudo autorizar ${resourceType}.`
  } finally {
    loading.value = false
  }
}

function onAction({ key }) {
  if (key === 'recargar') void loadStatus()
  if (key === 'activar') void sendActivation()
  if (key === 'aceptar') void acceptUsage()
  if (key === 'contrato') void authorizeResource('CONTRATO_ACCEPT', 'CONTRATO')
  if (key === 'modulos') void authorizeResource('MODULOS_ACCEPT', 'MODULOS')
}

onMounted(() => {
  void loadStatus()
})
</script>

<style scoped>
.mc-page {
  display: grid;
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
</style>
