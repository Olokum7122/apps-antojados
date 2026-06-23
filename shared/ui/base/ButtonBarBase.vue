<template>
  <div :class="classes.root">
    <div :class="classes.actions" :style="actionsStyle">
      <button-base
        v-for="btn in resolvedButtons"
        :key="btn.key"
        :label="btn.label"
        :icon="btn.icon"
        :active="currentValue === btn.key"
        :loading="btn.loading === true"
        :disable="btn.disabled === true"
        :variant="btn.variant || 'flat'"
        no-caps
        :class="[classes.action, currentValue === btn.key ? classes.actionActive : '']"
        v-bind="btn.domAttrs"
        @click="handleAction(btn.key, btn.disabled === true)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { resolveBaseComponentClasses } from '@antojados/ui/services/base/baseComponentsResolver'
import ButtonBase from './ButtonBase.vue'
import { resolveBarItems } from './navigationMetadata'

const props = defineProps({
  modelValue: { type: String, default: '' },
  buttons: { type: Array, default: () => [] },
  scrollable: { type: Boolean, default: true },
  gridColumns: { type: Number, default: 0 },
  level: { type: String, default: 'BUTTON' },
  parentContext: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'action'])

const localValue = ref('')
const resolvedButtons = computed(() =>
  resolveBarItems(props.level || 'BUTTON', props.buttons || [], {
    parentContext: props.parentContext,
    defaultKind: 'button',
  }),
)
const isGridLayout = computed(() => Number(props.gridColumns) > 0)
const effectiveGridColumns = computed(() => {
  if (!isGridLayout.value) return 0
  const configured = Math.max(1, Number(props.gridColumns))
  const buttonCount = Math.max(1, resolvedButtons.value.length)
  return Math.min(configured, buttonCount)
})
const classes = computed(() =>
  resolveBaseComponentClasses('buttonBar', {
    grid: isGridLayout.value,
    scrollable: props.scrollable,
  }),
)
const actionsStyle = computed(() => {
  if (!isGridLayout.value) return null
  return {
    '--bar-grid-columns': String(effectiveGridColumns.value),
  }
})
const firstEnabledKey = computed(() => {
  const found = resolvedButtons.value.find((btn) => btn.disabled !== true && btn.enabled !== false)
  return found?.key || ''
})
const currentValue = computed(() => props.modelValue || localValue.value || firstEnabledKey.value)

watch(
  () => props.buttons,
  () => {
    if (!localValue.value || !resolvedButtons.value.some((btn) => btn.key === localValue.value)) {
      localValue.value = firstEnabledKey.value
    }
  },
  { immediate: true },
)

function handleAction(key, disabled) {
  if (disabled) return
  localValue.value = key
  emit('update:modelValue', key)
  emit('action', { key })
}
</script>

<style scoped>
.buttonbar-base {
  display: block;
  width: 100%;
  min-width: 0;
  max-width: 100%;
}

.buttonbar-base__actions {
  display: flex;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  align-items: stretch;
}

.buttonbar-base__actions--scrollable {
  overflow-x: auto;
}

.buttonbar-base__actions--grid {
  display: grid;
  grid-template-columns: repeat(var(--bar-grid-columns), minmax(0, 1fr));
  width: 100%;
}

.buttonbar-base__action {
  min-width: 0;
  width: 100%;
}
</style>
