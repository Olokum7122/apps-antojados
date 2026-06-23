<template>
  <div
    :class="rootClass"
    :subdim-ik="subdimIk"
    :subdim-pc="subdimPc"
    :subdim-type="subdimType"
    :subdim-applies-to="subdimAppliesTo"
    :data-code-component="codeComponent"
  >
    <div :class="trackClass">
      <div
        v-for="action in resolvedActions"
        :key="action.key"
        :class="[classes.item, `base-post-action-rail__item--${action.key}`]"
      >
        <q-btn flat round dense :class="classes.iconBtn" @click="$emit('action', action.key)">
          <q-icon :name="action.icon" :class="classes.icon" />
        </q-btn>
        <div :class="classes.label">{{ action.label }}</div>
        <div v-if="showCounts" :class="classes.count">{{ formatCount(action.count) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { resolveBaseComponentClasses } from '@antojados/ui/services/base/baseComponentsResolver'
import { getActiveTheme } from '@antojados/ui/theme/themeManager'

const props = defineProps({
  actions: {
    type: Array,
    default: () => [
      { key: 'chocalas', label: 'Chocalas', icon: 'front_hand', count: 0 },
      { key: 'morral', label: 'Morral', icon: 'backpack', count: 0 },
      { key: 'califica', label: 'Califica', icon: 'star_outline', count: 0 },
      { key: 'pasala', label: 'Pasala', icon: 'reply', count: 0 },
      { key: 'maps', label: 'Maps', icon: 'map', count: 0 },
      { key: 'compa', label: 'Tu compa', icon: 'person_add_alt_1', count: 0 },
      { key: 'eliminar', label: 'Eliminar', icon: 'delete_outline', count: 0 },
    ],
  },
  mode: {
    type: String,
    default: 'themeAuto',
    validator: (value) => ['brandGlow', 'monoAccent', 'themeAuto'].includes(value),
  },
  layout: {
    type: String,
    default: 'rail',
    validator: (value) => ['rail', 'slide'].includes(value),
  },
  density: {
    type: String,
    default: 'normal',
    validator: (value) => ['normal', 'compact'].includes(value),
  },
  showCounts: { type: Boolean, default: true },
  subdimIk: { type: String, default: '' },
  subdimPc: { type: String, default: '' },
  subdimType: { type: String, default: 'SUB_COMPONENT' },
  subdimAppliesTo: { type: String, default: 'all' },
  codeComponent: { type: String, default: '' },
})

defineEmits(['action'])

const activeTheme = ref(getActiveTheme())
let bodyClassObserver = null

const classes = computed(() =>
  resolveBaseComponentClasses('postActionRail', {
    mode: resolvedVisualMode.value,
    density: props.density,
  }),
)

const resolvedVisualMode = computed(() => {
  if (props.mode !== 'themeAuto') return props.mode
  return activeTheme.value === 'aqua' ? 'monoAccent' : 'brandGlow'
})

const rootClass = computed(() => [
  classes.value.root,
  props.layout === 'slide' ? 'base-post-action-rail--slide' : '',
])

const trackClass = computed(() => [
  classes.value.track,
  props.layout === 'slide' ? 'base-post-action-rail__track--slide' : '',
])

const resolvedActions = computed(() =>
  (props.actions || []).map((action) => ({
    key: String(action?.key || ''),
    label: String(action?.label || ''),
    icon: String(action?.icon || 'radio_button_unchecked'),
    count: Number(action?.count || 0),
  })),
)

function formatCount(value) {
  if (!Number.isFinite(value)) return '0'
  if (value > 999) return `${Math.round(value / 100) / 10}k`
  return String(value)
}

onMounted(() => {
  if (typeof document === 'undefined' || !document.body) return

  bodyClassObserver = new MutationObserver(() => {
    activeTheme.value = getActiveTheme()
  })

  bodyClassObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ['class'],
  })
})

onBeforeUnmount(() => {
  bodyClassObserver?.disconnect()
})
</script>
