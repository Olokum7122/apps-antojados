<template>
  <section class="arre-detalle-view q-pa-md">
    <q-card flat bordered>
      <q-card-section>
        <div class="text-subtitle1">Detalle del evento</div>
        <div class="text-caption text-grey-7">Evento: {{ eventId }}</div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat color="grey-7" label="Volver a agenda" @click="goAgenda" />
        <q-btn flat color="secondary" label="Ver fullscreen" @click="goFullscreen" />
      </q-card-actions>
    </q-card>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const eventId = computed(() => route.params.id || 'demo-event')

function goFullscreen() {
  router.push(`/antojo/arre/fullscreen/${eventId.value}`)
}

function goAgenda() {
  router.push('/antojo/arre/agenda')
}
</script>
