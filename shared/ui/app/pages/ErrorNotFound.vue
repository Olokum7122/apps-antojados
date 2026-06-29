<template>
  <div class="fullscreen bg-blue text-white text-center q-pa-md flex flex-center">
    <div>
      <div style="font-size: 30vh">
        404
      </div>

      <div class="text-h2" style="opacity:.4">
        Oops. Nothing here...
      </div>

      <q-btn
        class="q-mt-xl"
        color="white"
        text-color="blue"
        unelevated
        to="/"
        label="Go Home"
        no-caps
      />
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'

/**
 * DEBT-027: Catch-all route con logging de 404s.
 */
const route = useRoute()

onMounted(() => {
  const fullPath = route.fullPath || route.path || '(unknown)'
  console.warn(`[404] Ruta no encontrada: ${fullPath}`)
  // En producción se puede enviar a un servicio de analytics o Sentry:
  // import { captureException } from '@sentry/vue'
  // captureException(new Error(`404: ${fullPath}`))
})
</script>
