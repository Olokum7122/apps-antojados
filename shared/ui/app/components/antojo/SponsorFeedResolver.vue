<template>
  <SponsorFeedPage
    :channel="resolvedChannel"
    :sponsor-id="route.params.sponsor_id as string"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import SponsorFeedPage from './SponsorFeedPage.vue'

const route = useRoute()

/**
 * Resuelve el canal desde el query param ?channel=
 * Para rutas globales /negocio/:sponsor_id que no están bajo
 * /antojo/vas-ir/negocio/ o /antojo/arre/negocio/
 *
 * Default: vas_ir (backwards compatible)
 */
const resolvedChannel = computed<'vas_ir' | 'arre'>(() => {
  const ch = route.query.channel as string | undefined
  if (ch === 'arre' || ch === 'vas_ir') return ch
  // Detección por referrer/prev path no es confiable,
  // así que default es vas_ir
  return 'vas_ir'
})
</script>
