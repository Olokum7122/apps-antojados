<template>
  <section
    :class="classes.root"
    :subdim-ik="subdimIk"
    :subdim-pc="subdimPc"
    :subdim-type="subdimType"
    :subdim-applies-to="subdimAppliesTo"
    :data-code-component="codeComponent"
  >
    <header :class="classes.header" :style="gridStyle">
      <div v-for="column in columns" :key="column.key" :class="classes.cell">
        {{ column.label }}
      </div>
    </header>

    <div :class="classes.body">
      <template v-if="rows.length">
        <div
          v-for="row in rows"
          :key="resolveRowKey(row)"
          :class="[classes.row, isSelected(row) && classes.rowSelected]"
          :style="gridStyle"
          @click="$emit('select', row)"
        >
          <div
            v-for="column in columns"
            :key="`${resolveRowKey(row)}-${column.key}`"
            :class="classes.cell"
          >
            <slot :name="`cell-${column.key}`" :row="row" :value="row[column.key]">
              {{ row[column.key] ?? '-' }}
            </slot>
          </div>
        </div>
      </template>

      <div v-else :class="classes.empty">
        <slot name="empty">{{ emptyMessage }}</slot>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { resolveBaseComponentClasses } from '@antojados/ui/services/base/baseComponentsResolver'

const props = defineProps({
  columns: { type: Array, default: () => [] },
  rows: { type: Array, default: () => [] },
  selectedKey: { type: [String, Number], default: '' },
  rowKey: { type: String, default: 'id' },
  emptyMessage: { type: String, default: 'Sin elementos para mostrar' },
  subdimIk: { type: String, default: '' },
  subdimPc: { type: String, default: '' },
  subdimType: { type: String, default: 'SUB_COMPONENT' },
  subdimAppliesTo: { type: String, default: 'all' },
  codeComponent: { type: String, default: '' },
})

defineEmits(['select'])

const classes = resolveBaseComponentClasses('entityGrid')

const gridStyle = computed(() => {
  const validColumns = Math.max(1, props.columns.length)
  return {
    gridTemplateColumns: `repeat(${validColumns}, minmax(0, 1fr))`,
  }
})

function resolveRowKey(row) {
  return row?.[props.rowKey] ?? JSON.stringify(row)
}

function isSelected(row) {
  return String(resolveRowKey(row)) === String(props.selectedKey)
}
</script>

<style scoped>
.base-entity-grid {
  display: grid;
  gap: 0;
  border-radius: var(--app-radius-md, 14px);
  overflow: hidden;
  border: 1px solid var(--app-border);
  background: var(--app-bg-surface);
  min-width: 0;
  max-width: 100%;
}

.base-entity-grid__header,
.base-entity-grid__row {
  display: grid;
}

.base-entity-grid__header {
  background: rgba(255, 255, 255, 0.04);
}

.base-entity-grid__body {
  display: grid;
  min-width: 0;
}

.base-entity-grid__row {
  border-top: 1px solid var(--app-border);
}

.base-entity-grid__row--selected {
  background: rgba(255, 255, 255, 0.05);
}

.base-entity-grid__cell {
  min-width: 0;
  max-width: 100%;
  padding: 12px 10px;
  color: var(--app-text-primary);
  font-size: 12px;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.base-entity-grid__header .base-entity-grid__cell {
  color: var(--app-text-secondary);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.base-entity-grid__empty {
  padding: 16px 12px;
  color: var(--app-text-secondary);
  font-size: 12px;
}
</style>
