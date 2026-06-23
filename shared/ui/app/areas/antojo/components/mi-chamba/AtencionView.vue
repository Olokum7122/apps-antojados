<template>
  <section class="mc-page">
    <button-bar-base model-value="nuevas" :buttons="buttons" :grid-columns="3" />
    <field-editor-base
      title="Bandeja de seguimiento"
      :fields="fields"
      :model-value="model"
      info-text="Android muestra una lista de notificaciones con CTA y dismiss."
    />
    <entity-grid-base :columns="columns" :rows="rows" row-key="id" />
  </section>
</template>

<script setup>
import ButtonBarBase from '@antojados/ui/base/ButtonBarBase.vue'
import EntityGridBase from '@antojados/ui/base/EntityGridBase.vue'
import FieldEditorBase from '@antojados/ui/base/FieldEditorBase.vue'

const buttons = [
  { key: 'nuevas', label: 'Nuevas' },
  { key: 'leidas', label: 'Leidas' },
  { key: 'acciones', label: 'Acciones' },
]
const fields = [
  { key: 'instancia', label: 'Instancia' },
  { key: 'cta', label: 'CTA principal' },
  { key: 'prioridad', label: 'Prioridad' },
]
const model = { instancia: 'Sponsor demo', cta: 'Ver contrato', prioridad: 'Alta' }
const columns = [
  { key: 'item', label: 'Notificacion' },
  { key: 'status', label: 'Estado' },
  { key: 'action', label: 'CTA' },
]
const rows = [
  { id: 'a1', item: 'Contrato listo para firma', status: 'No leida', action: 'Abrir' },
  { id: 'a2', item: 'Revision de expediente', status: 'Leida', action: 'Ver atencion' },
  { id: 'a3', item: 'Cobro pendiente', status: 'No leida', action: 'Ir a cuenta' },
]
</script>

<style scoped>
.mc-page { display: grid; gap: 10px; }
</style>
