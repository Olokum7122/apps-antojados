<template>
  <q-card flat bordered :class="classes.root">
    <q-card-section :class="classes.message">{{ message }}</q-card-section>
  </q-card>
</template>

<script setup>
import { resolveBaseComponentClasses } from '@antojados/ui/services/base/baseComponentsResolver'

const classes = resolveBaseComponentClasses('emptyState')

defineProps({
  message: {
    type: String,
    default: 'Sin resultados para mostrar.',
  },
})
</script>
