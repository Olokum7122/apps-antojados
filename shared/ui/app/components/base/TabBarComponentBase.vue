<template>
  <q-tabs
    v-bind="$attrs"
    :model-value="modelValue"
    :scrollable="isGridLayout ? false : scrollable"
    no-caps
    inline-label
    indicator-color="primary"
    :class="classes.root"
    :style="tabsStyle"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <component
      :is="getTabTarget(tab) ? QRouteTab : QTab"
      v-for="tab in resolvedTabs"
      :key="getTabName(tab)"
      v-bind="{ ...(getTabTarget(tab) ? { to: getTabTarget(tab) } : {}), ...tab.domAttrs }"
      :name="getTabName(tab)"
      :icon="tab.icon"
      :label="tab.label"
      :disable="tab.enabled === false || tab.disabled === true"
      :class="classes.tab"
    />
  </q-tabs>
</template>

<script setup>
import { computed } from 'vue'
import { QRouteTab, QTab } from 'quasar'
import { resolveBaseComponentClasses } from '@antojados/ui/services/base/baseComponentsResolver'
import { resolveBarItems } from './navigationMetadata'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  modelValue: { type: String, default: '' },
  tabs: { type: Array, default: () => [] },
  scrollable: { type: Boolean, default: true },
  gridColumns: { type: Number, default: 0 },
  level: { type: String, default: 'COMPONENT' },
  parentContext: { type: Object, default: null },
})

defineEmits(['update:modelValue'])

const resolvedTabs = computed(() =>
  resolveBarItems(props.level || 'COMPONENT', props.tabs || [], {
    parentContext: props.parentContext,
  }),
)

const isGridLayout = computed(() => Number(props.gridColumns) > 0)
const effectiveGridColumns = computed(() => {
  if (!isGridLayout.value) return 0
  const configured = Math.max(1, Number(props.gridColumns))
  const tabCount = Math.max(1, resolvedTabs.value.length)
  return Math.min(configured, tabCount)
})

const classes = computed(() => resolveBaseComponentClasses('componentTabs', { grid: isGridLayout.value }))

const tabsStyle = computed(() => {
  if (!isGridLayout.value) return null
  return {
    '--bar-grid-columns': String(effectiveGridColumns.value),
  }
})

function getTabName(tab) {
  return tab?.name || tab?.key || ''
}

function getTabTarget(tab) {
  return tab?.to || tab?.route || null
}
</script>
