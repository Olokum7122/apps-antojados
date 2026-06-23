<template>
  <section class="mc-page">
    <button-bar-base model-value="subir" :buttons="buttons" :grid-columns="3" />
    <field-editor-base
      title="Tile seleccionado"
      :fields="fields"
      :model-value="model"
      info-text="Android prioriza CTA de subir tile y grid visual de piezas."
    />
    <entity-grid-base :columns="columns" :rows="rows" row-key="id" />
  </section>
</template>

<script setup>
import ButtonBarBase from '@antojados/ui/base/ButtonBarBase.vue'
import EntityGridBase from '@antojados/ui/base/EntityGridBase.vue'
import FieldEditorBase from '@antojados/ui/base/FieldEditorBase.vue'

const buttons = [
  { key: 'subir', label: 'Subir tile' },
  { key: 'revision', label: 'Revision' },
  { key: 'rechazados', label: 'Rechazados' },
]
const fields = [
  { key: 'pieza', label: 'Pieza' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'progreso', label: 'Carga' },
]
const model = { pieza: 'Promo tacos 2x1', tipo: 'JPG', progreso: 'Listo para subir' }
const columns = [
  { key: 'item', label: 'Tile' },
  { key: 'status', label: 'Estado' },
  { key: 'action', label: 'Accion' },
]
const rows = [
  { id: 't1', item: 'Hero verano', status: 'Aprobado', action: 'Ver' },
  { id: 't2', item: 'Combo tarde', status: 'Pendiente', action: 'Esperar' },
  { id: 't3', item: 'Banner rojo', status: 'Rechazado', action: 'Eliminar' },
]
</script>

<style scoped>
.mc-page { display: grid; gap: 10px; }
</style>
