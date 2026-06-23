<template>
  <section class="mc-page">
    <tab-bar-sub-dimension-base v-model="activeTab" :tabs="tabs" :grid-columns="2" />

    <app-empty-state v-if="statusMessage" :message="statusMessage" />

    <template v-if="activeTab === 'usuarios'">
      <button-bar-base
        v-model="usuariosAction"
        :buttons="usuariosButtons"
        :grid-columns="5"
        @action="onUsuariosAction"
      />

      <field-editor-base
        title="Empleado"
        :fields="usuarioFields"
        :model-value="form"
        subdim-ik="MI_CHAMBA_EQUIPO_USUARIOS"
        subdim-pc="ANTOJO.MI_CHAMBA.EQUIPO"
        code-component="MI_CHAMBA.EQUIPO.USUARIOS"
        @update:model-value="mergeForm"
      />

      <entity-grid-base
        :columns="usuariosColumns"
        :rows="employees"
        row-key="id"
        :selected-key="selectedEmployeeId"
        empty-message="Sin empleados"
        subdim-ik="MI_CHAMBA_EQUIPO_GRID"
        subdim-pc="ANTOJO.MI_CHAMBA.EQUIPO"
        code-component="MI_CHAMBA.EQUIPO.GRID"
        @select="selectEmployee"
      >
        <template #cell_item="{ row }">
          <div class="mc-cell">
            <strong>{{ row.item }}</strong>
            <span>{{ row.meta }}</span>
          </div>
        </template>
        <template #cell_action="{ row }">
          <span class="mc-action-text">{{ row.action }}</span>
        </template>
      </entity-grid-base>
    </template>

    <template v-else>
      <button-bar-base
        v-model="asignacionesAction"
        :buttons="asignacionesButtons"
        :grid-columns="5"
        @action="onAsignacionesAction"
      />

      <field-editor-base
        title="Asignaciones"
        :fields="assignmentFields"
        :model-value="assignmentSummary"
        subdim-ik="MI_CHAMBA_EQUIPO_ASIGNACIONES"
        subdim-pc="ANTOJO.MI_CHAMBA.EQUIPO"
        code-component="MI_CHAMBA.EQUIPO.ASIGNACIONES"
      />

      <entity-grid-base
        :columns="asignacionesColumns"
        :rows="assignmentRows"
        row-key="id"
        :selected-key="selectedAssignmentId"
        empty-message="Sin asignaciones"
        subdim-ik="MI_CHAMBA_EQUIPO_RULES"
        subdim-pc="ANTOJO.MI_CHAMBA.EQUIPO"
        code-component="MI_CHAMBA.EQUIPO.RULES"
        @select="selectAssignment"
      >
        <template #cell_item="{ row }">
          <div class="mc-cell">
            <strong>{{ row.item }}</strong>
            <span>{{ row.location }}</span>
          </div>
        </template>
        <template #cell_rule="{ row }">
          <span class="mc-rule-text">{{ row.rule }}</span>
        </template>
        <template #cell_visible="{ row }">
          <span :class="permissionClass(row.visible)">{{ permissionText(row.visible) }}</span>
        </template>
        <template #cell_read="{ row }">
          <span :class="permissionClass(row.read)">{{ permissionText(row.read) }}</span>
        </template>
        <template #cell_edit="{ row }">
          <span :class="permissionClass(row.edit)">{{ permissionText(row.edit) }}</span>
        </template>
      </entity-grid-base>
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import AppEmptyState from '@antojados/ui/base/AppEmptyState.vue'
import ButtonBarBase from '@antojados/ui/base/ButtonBarBase.vue'
import EntityGridBase from '@antojados/ui/base/EntityGridBase.vue'
import FieldEditorBase from '@antojados/ui/base/FieldEditorBase.vue'
import TabBarSubDimensionBase from '@antojados/ui/base/TabBarSubDimensionBase.vue'
import { useAuth } from '@antojados/api/composables/useAuth'
import { equipoService } from '@antojados/api/services'

const { session, hydrateSession } = useAuth()

const activeTab = ref('usuarios')
const usuariosAction = ref('nuevo')
const asignacionesAction = ref('guardar')
const selectedEmployeeId = ref('')
const selectedAssignmentId = ref('')
const employees = ref([])
const perfiles = ref([])
const assignmentRows = ref([])
const statusMessage = ref('')
const loading = ref(false)
const resolvedInstanceId = ref(null)

const form = ref({
  id: '',
  displayName: '',
  email: '',
  phone: '',
  inviteCode: '',
})

const tabs = [
  { name: 'usuarios', label: 'Usuarios' },
  { name: 'asignaciones', label: 'Asignaciones' },
]

const usuariosButtons = computed(() => [
  { key: 'nuevo', label: 'Nuevo' },
  { key: 'guardar', label: 'Guardar', loading: loading.value },
  { key: 'invitar', label: 'Invitar', loading: loading.value },
  { key: 'admin', label: 'Admin', loading: loading.value },
  { key: 'eliminar', label: 'Eliminar', loading: loading.value },
])

const asignacionesButtons = computed(() => [
  { key: 'visible', label: 'Visible' },
  { key: 'leer', label: 'Leer' },
  { key: 'editar', label: 'Editar' },
  { key: 'guardar', label: 'Guardar', loading: loading.value },
  { key: 'registro', label: 'Ir a registro' },
])

const usuarioFields = [
  { key: 'displayName', label: 'Nombre del empleado' },
  { key: 'email', label: 'Correo' },
  { key: 'phone', label: 'Telefono' },
  { key: 'inviteCode', label: 'Codigo invitado', readonly: true },
]

const usuariosColumns = [
  { key: 'item', label: 'Miembro' },
  { key: 'status', label: 'Estado' },
  { key: 'action', label: 'Accion' },
]

const asignacionesColumns = [
  { key: 'item', label: 'Componente' },
  { key: 'rule', label: 'Rule' },
  { key: 'visible', label: 'Visible' },
  { key: 'read', label: 'Leer' },
  { key: 'edit', label: 'Editar' },
]

const selectedEmployee = computed(() => employees.value.find((item) => item.id === selectedEmployeeId.value) || null)
const selectedAssignment = computed(() => assignmentRows.value.find((item) => item.id === selectedAssignmentId.value) || null)
const currentInstanceId = computed(() => session.value?.instanceId || resolvedInstanceId.value || null)
const currentUserId = computed(() => session.value?.userId || null)
const currentTenantUserId = computed(() => session.value?.tenantUserId || currentUserId.value || null)
const adminProfileId = computed(() => perfiles.value.find((item) => item.type === 'administrador')?.id || null)

const assignmentSummary = computed(() => ({
  empleado: selectedEmployee.value?.item || '',
  perfil: selectedEmployee.value?.meta || '',
  alcance: selectedAssignment.value?.item || 'Selecciona una fila para cambiar permisos',
}))

const assignmentFields = [
  { key: 'empleado', label: 'Empleado activo', readonly: true },
  { key: 'perfil', label: 'Perfil', readonly: true },
  { key: 'alcance', label: 'Alcance', readonly: true },
]

function mergeForm(nextValue) {
  form.value = { ...form.value, ...nextValue }
}

function resetForm() {
  selectedEmployeeId.value = ''
  form.value = {
    id: '',
    displayName: '',
    email: '',
    phone: '',
    inviteCode: '',
  }
}

function mapUserToEmployee(user) {
  return {
    id: user.id,
    tenantUserId: user.tenantUserId,
    userId: user.userId,
    rowType: 'user',
    item: user.displayName,
    meta: user.profileName || user.profileType || 'Sin perfil',
    status: statusLabel(user.status),
    action: user.profileType === 'admin_general' ? 'Titular' : 'Permisos',
    email: user.email || '',
    phone: user.phone || '',
    inviteCode: '',
    profileType: user.profileType,
  }
}

function mapInvitationToEmployee(invitation) {
  return {
    id: invitation.id,
    rowType: 'invitation',
    item: invitation.email || invitation.phone || invitation.inviteCode,
    meta: 'Invitacion pendiente',
    status: statusLabel(invitation.status),
    action: 'Invitar',
    email: invitation.email || '',
    phone: invitation.phone || '',
    inviteCode: invitation.inviteCode,
  }
}

function mapAssignment(row) {
  return {
    id: row.locationId,
    item: row.label,
    location: row.componentCode || row.locationId,
    rule: [row.nodeKind, row.nodeLevel].filter(Boolean).join(' / ') || row.code || 'location',
    sortOrder: Number(row.sortOrder || 0),
    visible: row.visible,
    read: row.puedeLeer,
    edit: row.puedeEditar,
  }
}

function selectEmployee(row) {
  selectedEmployeeId.value = row.id
  form.value = {
    id: row.id,
    displayName: row.item,
    email: row.email,
    phone: row.phone,
    inviteCode: row.inviteCode,
  }
}

function selectAssignment(row) {
  selectedAssignmentId.value = row.id
}

async function ensureSession() {
  if (!session.value?.userId) {
    await hydrateSession()
  }
}

async function loadEquipo() {
  await ensureSession()
  statusMessage.value = ''

  if (!currentUserId.value) {
    statusMessage.value = 'Inicia sesion en Tragon para administrar Equipo.'
    return
  }

  let instanceId = currentInstanceId.value
  if (!instanceId) {
    const tenant = await equipoService.getMiTenant(currentUserId.value)
    instanceId = tenant.instanceId
  }
  resolvedInstanceId.value = instanceId

  if (!instanceId) {
    statusMessage.value = 'No hay instancia sponsor vinculada.'
    return
  }

  loading.value = true
  try {
    const [usuarios, invitaciones, nextPerfiles] = await Promise.all([
      equipoService.getUsuarios(instanceId),
      equipoService.getInvitacionesPendientes(instanceId),
      equipoService.getPerfiles(instanceId),
    ])
    perfiles.value = nextPerfiles
    employees.value = [...usuarios.map(mapUserToEmployee), ...invitaciones.map(mapInvitationToEmployee)]
    if (!selectedEmployee.value && employees.value.length > 0) {
      selectEmployee(employees.value[0])
    }
  } catch (error) {
    statusMessage.value = error instanceof Error ? error.message : 'No se pudo cargar Equipo.'
  } finally {
    loading.value = false
  }
}

async function saveEmployee() {
  if (!currentInstanceId.value || !currentTenantUserId.value) {
    statusMessage.value = 'No hay contexto sponsor para guardar.'
    return
  }

  loading.value = true
  try {
    if (selectedEmployee.value?.rowType === 'invitation') {
      await equipoService.updateInvitacion({
        invitationId: selectedEmployee.value.id,
        email: form.value.email,
        phone: form.value.phone,
      })
    } else {
      const invitation = await equipoService.invitar({
        instanceId: currentInstanceId.value,
        createdBy: currentTenantUserId.value,
        email: form.value.email,
        phone: form.value.phone,
      })
      form.value.inviteCode = invitation.inviteCode
    }
    await loadEquipo()
  } catch (error) {
    statusMessage.value = error instanceof Error ? error.message : 'No se pudo guardar el empleado.'
  } finally {
    loading.value = false
  }
}

async function inviteEmployee() {
  if (!form.value.inviteCode) {
    await saveEmployee()
    return
  }
  statusMessage.value = `Codigo listo: ${form.value.inviteCode}`
}

async function deleteEmployee() {
  const selected = selectedEmployee.value
  if (!selected) return

  loading.value = true
  try {
    if (selected.rowType === 'invitation') {
      await equipoService.deleteInvitacion(selected.id)
    } else {
      await equipoService.revocarUsuario(selected.id)
    }
    resetForm()
    await loadEquipo()
  } catch (error) {
    statusMessage.value = error instanceof Error ? error.message : 'No se pudo eliminar.'
  } finally {
    loading.value = false
  }
}

async function assignAdmin() {
  const selected = selectedEmployee.value
  if (!selected || selected.rowType === 'invitation' || !adminProfileId.value) return

  loading.value = true
  try {
    await equipoService.updatePerfil(selected.id, adminProfileId.value)
    await loadEquipo()
  } catch (error) {
    statusMessage.value = error instanceof Error ? error.message : 'No se pudo asignar Administrador.'
  } finally {
    loading.value = false
  }
}

async function loadAssignments() {
  const selected = selectedEmployee.value
  if (!selected || selected.rowType === 'invitation') {
    assignmentRows.value = []
    return
  }

  loading.value = true
  try {
    let rows = await equipoService.getAsignaciones(selected.id)
    if (!rows.length) {
      await equipoService.seedAsignaciones(selected.id, true)
      rows = await equipoService.getAsignaciones(selected.id)
    }
    assignmentRows.value = rows
      .map(mapAssignment)
      .sort((left, right) => left.sortOrder - right.sortOrder || left.item.localeCompare(right.item))
    selectedAssignmentId.value = assignmentRows.value[0]?.id || ''
  } catch (error) {
    statusMessage.value = error instanceof Error ? error.message : 'No se pudieron cargar asignaciones.'
  } finally {
    loading.value = false
  }
}

async function saveAssignments() {
  const selected = selectedEmployee.value
  if (!selected || selected.rowType === 'invitation') return

  loading.value = true
  try {
    await equipoService.setAsignaciones(
      selected.id,
      assignmentRows.value.map((row) => ({
        locationId: row.id,
        componentCode: row.location,
        label: row.item,
        visible: row.visible,
        puedeLeer: row.read,
        puedeEditar: row.edit,
      })),
    )
    statusMessage.value = 'Asignaciones guardadas.'
  } catch (error) {
    statusMessage.value = error instanceof Error ? error.message : 'No se pudieron guardar asignaciones.'
  } finally {
    loading.value = false
  }
}

function toggleSelectedAssignment(key) {
  const row = selectedAssignment.value
  if (!row) return

  if (key === 'visible') {
    row.visible = !row.visible
    if (!row.visible) {
      row.read = false
      row.edit = false
    }
  }

  if (key === 'read') {
    row.read = !row.read
    if (row.read) row.visible = true
    else row.edit = false
  }

  if (key === 'edit') {
    row.edit = !row.edit
    if (row.edit) {
      row.visible = true
      row.read = true
    }
  }
}

function onUsuariosAction({ key }) {
  if (key === 'nuevo') resetForm()
  if (key === 'guardar') void saveEmployee()
  if (key === 'invitar') void inviteEmployee()
  if (key === 'eliminar') void deleteEmployee()
  if (key === 'admin') void assignAdmin()
}

function onAsignacionesAction({ key }) {
  if (key === 'visible' || key === 'leer' || key === 'editar') {
    const map = { visible: 'visible', leer: 'read', editar: 'edit' }
    toggleSelectedAssignment(map[key])
  }
  if (key === 'guardar') void saveAssignments()
  if (key === 'registro') activeTab.value = 'usuarios'
}

function permissionText(value) {
  return value ? 'Si' : 'No'
}

function permissionClass(value) {
  return value ? 'mc-permission mc-permission--on' : 'mc-permission'
}

function statusLabel(status) {
  const value = String(status || '').toLowerCase()
  if (value === 'active') return 'Activo'
  if (value === 'revoked') return 'Revocado'
  return 'Pendiente'
}

watch(activeTab, (nextTab) => {
  if (nextTab === 'asignaciones') void loadAssignments()
})

watch(selectedEmployeeId, () => {
  if (activeTab.value === 'asignaciones') void loadAssignments()
})

onMounted(() => {
  void loadEquipo()
})
</script>

<style scoped>
.mc-page {
  display: grid;
  gap: 12px;
}

.mc-cell {
  display: grid;
  gap: 2px;
}

.mc-cell span {
  color: rgba(255, 255, 255, 0.62);
  font-size: 12px;
}

.mc-action-text {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  color: rgba(137, 245, 255, 0.96);
  font-size: 12px;
  font-weight: 700;
}

.mc-rule-text {
  color: rgba(255, 255, 255, 0.62);
  font-size: 12px;
  font-weight: 700;
}

.mc-permission {
  display: inline-flex;
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  font-weight: 700;
}

.mc-permission--on {
  color: rgba(137, 245, 255, 0.96);
}
</style>
