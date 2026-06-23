<template>
  <section class="mc-page">
    <button-bar-base model-value="saldo" :buttons="buttons" :grid-columns="2" />
    <field-editor-base
      title="Snapshot economico"
      :fields="fields"
      :model-value="model"
      info-text="Android expone saldo, KPIs y breakdown por placement."
    />
    <entity-grid-base :columns="columns" :rows="rows" row-key="id" />
  </section>
</template>

<script setup>
import ButtonBarBase from '@antojados/ui/base/ButtonBarBase.vue'
import EntityGridBase from '@antojados/ui/base/EntityGridBase.vue'
import FieldEditorBase from '@antojados/ui/base/FieldEditorBase.vue'

// Accepted test debt: Metricas remains mock for iOS/TestFlight parity until KPI API is ready.
const buttons = [
  { key: 'saldo', label: 'Saldo' },
  { key: 'placements', label: 'Placements' },
]
const fields = [
  { key: 'saldo', label: 'Saldo disponible' },
  { key: 'usuarios', label: 'Usuarios unicos' },
  { key: 'crecimiento', label: 'Crecimiento MoM' },
]
const model = { saldo: '$2,500', usuarios: '547', crecimiento: '+15%' }
const columns = [
  { key: 'item', label: 'Placement' },
  { key: 'status', label: 'Saldo' },
  { key: 'action', label: 'Lectura' },
]
const rows = [
  { id: 'mt1', item: 'Galeria', status: '$1,200', action: 'OK' },
  { id: 'mt2', item: 'Catalogo', status: '$800', action: 'OK' },
  { id: 'mt3', item: 'Arre', status: '$500', action: 'OK' },
]
</script>

<style scoped>
.mc-page { display: grid; gap: 10px; }
</style>
