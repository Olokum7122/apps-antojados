<template>
  <q-btn
    :label="label"
    :icon="icon"
    :loading="loading"
    :disable="disable"
    :no-caps="noCaps"
    :flat="variant === 'flat'"
    :outline="variant === 'outline'"
    :unelevated="variant === 'ghost'"
    :aria-pressed="isPressed ? 'true' : 'false'"
    class="button-base"
    :class="[
      `button-base--${variant}`,
      isPressed && 'button-base--active',
      disable && 'button-base--disabled',
    ]"
    @click="$emit('click', $event)"
  >
    <slot />
  </q-btn>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: { type: String, default: '' },
  icon: { type: String, default: '' },
  variant: {
    type: String,
    default: 'flat',
    validator: (value) => ['primary', 'flat', 'outline', 'ghost'].includes(value),
  },
  loading: { type: Boolean, default: false },
  disable: { type: Boolean, default: false },
  noCaps: { type: Boolean, default: true },
  active: { type: Boolean, default: false },
})

defineEmits(['click'])

const isPressed = computed(() => props.active)
</script>

<style scoped>
.button-base {
  border-radius: 0 !important;
  min-height: 42px;
  height: auto !important;
  width: 100%;
  font-weight: 700;
  letter-spacing: 0.2px;
  color: var(--button-base-text-inverted, var(--buttonbar-text-inverted)) !important;
  border-bottom: 2px solid transparent;
  transition:
    background 140ms ease,
    color 140ms ease,
    border-color 140ms ease;
}

.button-base:hover {
  background: var(--buttonbar-hover-bg-inverted, rgba(255, 255, 255, 0.12)) !important;
}

:deep(.button-base .q-btn__content) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  white-space: normal !important;
  overflow-wrap: anywhere;
  word-break: break-word;
  line-height: 1.15;
  text-align: center;
  padding: 2px 0;
}

.button-base:focus-visible {
  outline: 2px solid var(--buttonbar-focus-ring-inverted, rgba(255, 255, 255, 0.45));
  outline-offset: -2px;
}

.button-base--primary {
  background: var(
    --button-base-primary-bg-inverted,
    var(--buttonbar-active-bg-inverted)
  ) !important;
  color: var(--button-base-primary-text-inverted, var(--buttonbar-text-inverted)) !important;
}

.button-base--outline {
  border-color: var(--button-base-outline-border-inverted, rgba(255, 255, 255, 0.35)) !important;
}

.button-base--ghost {
  background: var(--button-base-ghost-bg-inverted, rgba(255, 255, 255, 0.18)) !important;
}

.button-base--active,
.button-base.is-active {
  background: var(--buttonbar-active-bg-inverted, rgba(255, 255, 255, 0.24)) !important;
  color: var(--buttonbar-active-text-inverted, var(--buttonbar-text-inverted)) !important;
  border-bottom-color: var(--buttonbar-active-indicator-inverted, var(--app-primary));
}

.button-base--disabled {
  opacity: 0.5;
}
</style>
