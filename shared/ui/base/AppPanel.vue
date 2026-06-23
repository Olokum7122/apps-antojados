<template>
  <q-card flat bordered :class="[classes.root, panelClass]">
    <q-card-section>
      <div :class="['text-h6', 'text-weight-bold', classes.title]">{{ title }}</div>
      <div v-if="subtitle" :class="['text-body2', classes.subtitle]">{{ subtitle }}</div>
    </q-card-section>

    <q-separator v-if="$slots.default || $slots.actions" />

    <q-card-section v-if="$slots.default" :class="classes.content">
      <slot />
    </q-card-section>

    <q-card-actions v-if="$slots.actions" :align="actionsAlign" :class="classes.actions">
      <slot name="actions" />
    </q-card-actions>
  </q-card>
</template>

<script setup>
import { computed } from 'vue'
import { resolveBaseComponentClasses } from '@antojados/ui/services/base/baseComponentsResolver'

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: '',
  },
  actionsAlign: {
    type: String,
    default: 'right',
  },
  panelClass: {
    type: [String, Array, Object],
    default: '',
  },
  tone: {
    type: String,
    default: 'default',
  },
})

const classes = computed(() => resolveBaseComponentClasses('panel', { tone: props.tone }))
</script>
