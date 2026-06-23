<template>
  <section class="mc-page">
    <app-empty-state v-if="statusMessage" :message="statusMessage" />

    <tab-bar-sub-dimension-base v-model="activeTab" :tabs="tabs" :grid-columns="3" />

    <field-editor-base
      v-if="activeTab === 'datos_facturacion'"
      title="Datos del negocio y facturacion"
      :fields="datosFields"
      :model-value="form"
      subdim-ik="MI_CHAMBA_REGISTRO_DATOS"
      subdim-pc="ANTOJO.MI_CHAMBA.REGISTRO"
      code-component="MI_CHAMBA.REGISTRO.DATOS"
      @update:model-value="mergeForm"
    >
      <template #actions>
        <button-bar-base
          model-value="guardar"
          :buttons="datosActionButtons"
          :grid-columns="1"
          @action="onDatosAction"
        />
      </template>
    </field-editor-base>

    <field-editor-base
      v-else-if="activeTab === 'representante'"
      title="Representante"
      :fields="representanteFields"
      :model-value="form"
      subdim-ik="MI_CHAMBA_REGISTRO_REPRESENTANTE"
      subdim-pc="ANTOJO.MI_CHAMBA.REGISTRO"
      code-component="MI_CHAMBA.REGISTRO.REPRESENTANTE"
      @update:model-value="mergeForm"
    >
      <template #actions>
        <q-select
          v-model="selectedRepresentativeId"
          filled
          dense
          dark
          emit-value
          map-options
          :options="representativeOptions"
          label="Empleado representante"
          @update:model-value="selectRepresentativeById"
        />
        <entity-grid-base
          :columns="representanteColumns"
          :rows="representativeRows"
          row-key="id"
          :selected-key="form.representativeTenantUserId"
          empty-message="Sin empleados activos"
          subdim-ik="MI_CHAMBA_REGISTRO_REPRESENTANTE_EQUIPO"
          subdim-pc="ANTOJO.MI_CHAMBA.REGISTRO"
          code-component="MI_CHAMBA.REGISTRO.REPRESENTANTE.EQUIPO"
          @select="selectRepresentative"
        />
        <button-bar-base
          model-value="guardar"
          :buttons="representanteActionButtons"
          :grid-columns="2"
          @action="onRepresentanteAction"
        />
      </template>
    </field-editor-base>

    <section v-else class="mc-docs">
      <field-editor-base
        title="Documentacion"
        :fields="documentacionFields"
        :model-value="form"
        subdim-ik="MI_CHAMBA_REGISTRO_DOCUMENTACION"
        subdim-pc="ANTOJO.MI_CHAMBA.REGISTRO"
        code-component="MI_CHAMBA.REGISTRO.DOCUMENTACION"
        @update:model-value="mergeForm"
      >
        <template #actions>
          <div class="mc-files">
            <q-file
              v-model="form.rfcConstanciaFile"
              filled
              dense
              dark
              clearable
              label="Constancia fiscal"
              accept=".pdf,.jpg,.jpeg,.png"
            />
            <q-file
              v-model="form.representativeIdFile"
              filled
              dense
              dark
              clearable
              label="Identificacion del representante"
              accept=".pdf,.jpg,.jpeg,.png"
            />
          </div>
          <button-bar-base
            model-value="enviar"
            :buttons="documentacionActionButtons"
            :grid-columns="2"
            @action="onDocumentacionAction"
          />
        </template>
      </field-editor-base>

      <entity-grid-base
        :columns="documentColumns"
        :rows="documentRows"
        row-key="id"
        empty-message="Sin expediente"
        subdim-ik="MI_CHAMBA_REGISTRO_EXPEDIENTE"
        subdim-pc="ANTOJO.MI_CHAMBA.REGISTRO"
        code-component="MI_CHAMBA.REGISTRO.EXPEDIENTE"
      >
        <template #cell_action="{ row }">
          <span class="mc-action-text">{{ row.action }}</span>
        </template>
      </entity-grid-base>
    </section>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import AppEmptyState from '@antojados/ui/base/AppEmptyState.vue'
import ButtonBarBase from '@antojados/ui/base/ButtonBarBase.vue'
import EntityGridBase from '@antojados/ui/base/EntityGridBase.vue'
import FieldEditorBase from '@antojados/ui/base/FieldEditorBase.vue'
import TabBarSubDimensionBase from '@antojados/ui/base/TabBarSubDimensionBase.vue'
import { useAuth } from '@antojados/api/composables/useAuth'
import { equipoService, registroService } from '@antojados/api/services'

const { session, hydrateSession } = useAuth()

const activeTab = ref('datos_facturacion')
const loading = ref(false)
const statusMessage = ref('')
const representativeRows = ref([])
const selectedRepresentativeId = ref('')
const resolvedInstanceId = ref(null)
const resolvedTenantUserId = ref(null)

const tabs = [
  { name: 'datos_facturacion', label: 'Datos/Facturacion' },
  { name: 'representante', label: 'Representante' },
  { name: 'documentacion', label: 'Documentacion' },
]

const form = ref({
  businessName: '',
  businessType: '',
  cityCode: '',
  phone: '',
  description: '',
  rfc: '',
  razonSocial: '',
  billingEmail: '',
  fiscalAddress: '',
  representativeTenantUserId: '',
  representativeName: '',
  representativeRole: '',
  representativeEmail: '',
  representativePhone: '',
  representativeIdType: '',
  representativeIdNumber: '',
  rfcConstancia: '',
  representativeId: '',
  rfcConstanciaFile: null,
  representativeIdFile: null,
})

const datosActionButtons = computed(() => [
  { key: 'guardar', label: 'Guardar borrador', loading: loading.value, variant: 'primary' },
])
const representanteActionButtons = computed(() => [
  { key: 'atras', label: 'Atras' },
  { key: 'guardar', label: 'Guardar borrador', loading: loading.value, variant: 'primary' },
])
const documentacionActionButtons = computed(() => [
  { key: 'atras', label: 'Atras' },
  { key: 'enviar', label: 'Enviar registro', loading: loading.value, variant: 'primary' },
])

const datosFields = [
  { key: 'businessName', label: 'Nombre del negocio' },
  { key: 'businessType', label: 'Tipo de negocio' },
  { key: 'cityCode', label: 'Ciudad' },
  { key: 'phone', label: 'Telefono' },
  { key: 'description', label: 'Descripcion breve' },
  { key: 'rfc', label: 'RFC' },
  { key: 'razonSocial', label: 'Razon social' },
  { key: 'billingEmail', label: 'Email de facturacion' },
  { key: 'fiscalAddress', label: 'Direccion fiscal' },
]

const representanteFields = [
  { key: 'representativeTenantUserId', label: 'Empleado representante', readonly: true },
  { key: 'representativeName', label: 'Nombre completo' },
  { key: 'representativeRole', label: 'Cargo / relacion' },
  { key: 'representativeEmail', label: 'Email' },
  { key: 'representativePhone', label: 'Telefono' },
  { key: 'representativeIdType', label: 'Tipo de identificacion' },
  { key: 'representativeIdNumber', label: 'Numero de identificacion' },
]

const documentacionFields = [
  { key: 'rfcConstancia', label: 'Constancia fiscal', readonly: true },
  { key: 'representativeId', label: 'INE / Pasaporte', readonly: true },
]

const representanteColumns = [
  { key: 'item', label: 'Empleado' },
  { key: 'profile', label: 'Perfil' },
  { key: 'status', label: 'Estado' },
]

const documentColumns = [
  { key: 'item', label: 'Expediente' },
  { key: 'status', label: 'Estado' },
  { key: 'action', label: 'Accion' },
]

const documentRows = computed(() => [
  {
    id: 'doc-1',
    item: 'Constancia de situacion fiscal',
    status: form.value.rfcConstanciaFile || form.value.rfcConstancia ? 'Cargado' : 'Pendiente',
    action: 'Aprobacion GT',
  },
  {
    id: 'doc-2',
    item: 'Identificacion del representante',
    status:
      form.value.representativeIdFile || form.value.representativeId ? 'Cargado' : 'Pendiente',
    action: 'Aprobacion GT',
  },
])

const currentUserId = computed(() => session.value?.userId || null)
const currentInstanceId = computed(() => session.value?.instanceId || resolvedInstanceId.value || null)
const currentTenantUserId = computed(() => session.value?.tenantUserId || resolvedTenantUserId.value || null)
const representativeOptions = computed(() =>
  representativeRows.value.map((item) => ({
    label: `${item.item} - ${item.profile}`,
    value: item.id,
  })),
)

function mergeForm(nextValue) {
  form.value = { ...form.value, ...nextValue }
}

function missingForDatos() {
  return [
    ['businessName', 'nombre del negocio'],
    ['businessType', 'tipo de negocio'],
    ['cityCode', 'ciudad'],
    ['rfc', 'RFC'],
    ['razonSocial', 'razon social'],
    ['billingEmail', 'email de facturacion'],
    ['fiscalAddress', 'direccion fiscal'],
  ].filter(([key]) => !form.value[key]).map(([, label]) => label)
}

function missingForRepresentante() {
  return [
    ['representativeTenantUserId', 'empleado representante'],
    ['representativeName', 'nombre del representante'],
    ['representativeEmail', 'email del representante'],
    ['representativePhone', 'telefono del representante'],
    ['representativeIdType', 'tipo de identificacion'],
    ['representativeIdNumber', 'numero de identificacion'],
  ].filter(([key]) => !form.value[key]).map(([, label]) => label)
}

function requireReady(missing) {
  if (!missing.length) return true
  statusMessage.value = `Faltan datos: ${missing.join(', ')}.`
  return false
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
    statusMessage.value = 'Inicia sesion en Tragon para completar Registro.'
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

  if (!instanceId) {
    statusMessage.value = 'No hay instancia sponsor vinculada.'
    return false
  }

  return true
}

async function loadRegistro() {
  try {
    const ready = await resolveContext()
    if (!ready || !currentInstanceId.value || !currentUserId.value) return

    const [instancia, usuarios] = await Promise.all([
      registroService.getInstanciaStatus(currentUserId.value),
      equipoService.getUsuarios(currentInstanceId.value),
    ])

    resolvedInstanceId.value = instancia?.instanceId || currentInstanceId.value
    if (instancia?.status === 'pending_review') {
      statusMessage.value = 'Solicitud en revision. El expediente ya fue enviado a GT.'
    }

    representativeRows.value = usuarios
      .filter((item) => item.status === 'active')
      .map((item) => ({
        id: item.id,
        item: item.displayName || item.userId || 'Empleado',
        profile: item.profileName || item.profileType || 'Sin perfil',
        status: 'Activo',
        email: item.email || '',
        phone: item.phone || '',
        userId: item.userId || '',
        profileType: item.profileType || '',
      }))

    if (!form.value.representativeTenantUserId && currentTenantUserId.value) {
      const selfRow = representativeRows.value.find((item) => item.id === currentTenantUserId.value)
      if (selfRow) selectRepresentative(selfRow)
    }
  } catch (error) {
    statusMessage.value = error instanceof Error ? error.message : 'No se pudo cargar Registro.'
  }
}

function selectRepresentative(row) {
  selectedRepresentativeId.value = row.id
  form.value = {
    ...form.value,
    representativeTenantUserId: row.id,
    representativeName: row.item || form.value.representativeName,
    representativeEmail: row.email || form.value.representativeEmail,
    representativePhone: row.phone || form.value.representativePhone,
    representativeRole: form.value.representativeRole || 'Representante legal',
  }
}

function selectRepresentativeById(tenantUserId) {
  const row = representativeRows.value.find((item) => item.id === tenantUserId)
  if (row) selectRepresentative(row)
}

async function saveDatos(nextTab) {
  if (!requireReady(missingForDatos())) return
  if (!(await resolveContext())) return

  loading.value = true
  try {
    await registroService.setupSponsorBusiness(currentInstanceId.value, currentUserId.value, {
      business_name: form.value.businessName,
      biz_type: form.value.businessType,
      city_code: form.value.cityCode,
      phone: form.value.phone || null,
      description: form.value.description || null,
    })
    await registroService.setupSponsorBilling(currentInstanceId.value, currentUserId.value, {
      billing_email: form.value.billingEmail,
      razon_social: form.value.razonSocial,
      rfc: form.value.rfc,
      fiscal_address: form.value.fiscalAddress,
    })
    statusMessage.value = 'Datos y facturacion guardados.'
    activeTab.value = nextTab
  } catch (error) {
    statusMessage.value = error instanceof Error ? error.message : 'No se pudieron guardar datos.'
  } finally {
    loading.value = false
  }
}

async function saveRepresentante(nextTab) {
  if (!requireReady(missingForRepresentante())) return
  if (!(await resolveContext())) return

  loading.value = true
  try {
    await registroService.setupSponsorRepresentative(currentInstanceId.value, currentUserId.value, {
      tenant_user_id: form.value.representativeTenantUserId,
      display_name: form.value.representativeName,
      representative_email: form.value.representativeEmail || null,
      phone_e164: form.value.representativePhone,
    })
    statusMessage.value = 'Representante legal designado.'
    activeTab.value = nextTab
  } catch (error) {
    statusMessage.value = error instanceof Error ? error.message : 'No se pudo designar representante.'
  } finally {
    loading.value = false
  }
}

async function submitDocumentacion() {
  if (!requireReady(missingForDatos()) || !requireReady(missingForRepresentante())) return
  if (!form.value.rfcConstanciaFile || !form.value.representativeIdFile) {
    statusMessage.value = 'Faltan documentos de aprobacion.'
    return
  }
  if (!(await resolveContext())) return

  loading.value = true
  try {
    await saveDatos('documentacion')
    await saveRepresentante('documentacion')
    await Promise.all([
      registroService.uploadSponsorDocument({
        instanceId: currentInstanceId.value,
        userId: currentUserId.value,
        uploadedByTenantUserId: currentTenantUserId.value,
        file: form.value.rfcConstanciaFile,
        docType: 'constancia_fiscal',
      }),
      registroService.uploadSponsorDocument({
        instanceId: currentInstanceId.value,
        userId: currentUserId.value,
        uploadedByTenantUserId: currentTenantUserId.value,
        file: form.value.representativeIdFile,
        docType: 'identificacion_oficial',
      }),
    ])
    form.value.rfcConstancia = form.value.rfcConstanciaFile.name || 'constancia_fiscal'
    form.value.representativeId = form.value.representativeIdFile.name || 'identificacion_oficial'
    statusMessage.value = 'Expediente enviado a aprobacion.'
  } catch (error) {
    statusMessage.value = error instanceof Error ? error.message : 'No se pudo enviar el expediente.'
  } finally {
    loading.value = false
  }
}

function onDatosAction({ key }) {
  if (key === 'guardar') void saveDatos('representante')
}

function onRepresentanteAction({ key }) {
  if (key === 'atras') activeTab.value = 'datos_facturacion'
  if (key === 'guardar') void saveRepresentante('documentacion')
}

function onDocumentacionAction({ key }) {
  if (key === 'atras') activeTab.value = 'representante'
  if (key === 'enviar') void submitDocumentacion()
}

onMounted(() => {
  void loadRegistro()
})
</script>

<style scoped>
.mc-page {
  display: grid;
  gap: 12px;
}

.mc-docs {
  display: grid;
  gap: 12px;
}

.mc-files {
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
