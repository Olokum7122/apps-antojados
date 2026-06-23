<template>
  <section class="mi-chamba-section">
    <header class="mi-chamba-section__header">
      <div>
        <p class="mi-chamba-section__eyebrow">{{ eyebrow }}</p>
        <h2>{{ title }}</h2>
        <p>{{ subtitle }}</p>
      </div>
    </header>

    <button-bar-base
      :model-value="activeAction"
      :buttons="buttonItems"
      :grid-columns="buttonColumns"
      @update:model-value="activeAction = $event"
    />

    <field-editor-base
      :title="editorTitle"
      :fields="fields"
      :model-value="formState"
      :info-text="infoText"
      @update:model-value="formState = $event"
    />

    <entity-grid-base
      :columns="columns"
      :rows="rows"
      row-key="id"
      :empty-message="emptyMessage"
    >
      <template v-if="showStatusPill" #cell-status="{ value }">
        <div :class="['status-pill', statusTone(value)]">{{ value }}</div>
      </template>
      <template v-if="showActionPill" #cell-action="{ value }">
        <div class="status-pill status-pill--neutral">{{ value }}</div>
      </template>
    </entity-grid-base>

    <button-base
      v-if="showEfirmaButton"
      label="Firmar con E firma"
      variant="primary"
      class="mi-chamba-section__efirma"
    />
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import ButtonBarBase from '@antojados/ui/base/ButtonBarBase.vue'
import ButtonBase from '@antojados/ui/base/ButtonBase.vue'
import EntityGridBase from '@antojados/ui/base/EntityGridBase.vue'
import FieldEditorBase from '@antojados/ui/base/FieldEditorBase.vue'

const props = defineProps({
  eyebrow: { type: String, default: '' },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  editorTitle: { type: String, default: '' },
  infoText: { type: String, default: '' },
  buttons: { type: Array, default: () => [] },
  buttonColumns: { type: Number, default: 3 },
  fields: { type: Array, default: () => [] },
  initialModel: { type: Object, default: () => ({}) },
  columns: { type: Array, default: () => [] },
  rows: { type: Array, default: () => [] },
  emptyMessage: { type: String, default: 'Sin registros' },
  showEfirmaButton: { type: Boolean, default: false },
  showStatusPill: { type: Boolean, default: true },
  showActionPill: { type: Boolean, default: true },
})

const buttonItems = computed(() => props.buttons)
const activeAction = ref(props.buttons?.[0]?.key || '')
const formState = ref({ ...(props.initialModel || {}) })

function statusTone(value) {
  const normalized = String(value || '').toLowerCase()
  if (normalized.includes('activo') || normalized.includes('aprob')) return 'status-pill--positive'
  if (normalized.includes('pend') || normalized.includes('revision')) return 'status-pill--warning'
  if (normalized.includes('bloq') || normalized.includes('rechaz')) return 'status-pill--negative'
  return 'status-pill--neutral'
}
</script>

<style scoped>
.mi-chamba-section {
  display: grid;
  gap: 14px;
  padding: 16px;
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
}

.mi-chamba-section__header h2,
.mi-chamba-section__header p {
  margin: 0;
}

.mi-chamba-section__eyebrow {
  margin: 0 0 6px;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(239, 163, 0, 0.84);
}

.mi-chamba-section__header p {
  margin-top: 6px;
  color: rgba(255, 255, 255, 0.66);
}

.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.status-pill--neutral {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.78);
}

.status-pill--positive {
  background: rgba(34, 197, 94, 0.16);
  color: rgba(187, 247, 208, 0.96);
}

.status-pill--warning {
  background: rgba(245, 158, 11, 0.16);
  color: rgba(253, 230, 138, 0.96);
}

.status-pill--negative {
  background: rgba(239, 68, 68, 0.16);
  color: rgba(254, 202, 202, 0.96);
}

.mi-chamba-section__efirma {
  width: 100%;
}
</style>
