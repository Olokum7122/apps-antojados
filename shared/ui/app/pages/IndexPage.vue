<template>
  <q-page class="q-pa-md page-bg">
    <div class="container q-mx-auto">
      <q-card flat bordered class="q-pa-md q-pa-lg-md">
        <q-card-section>
          <div class="text-h5 text-weight-bold">AntojadosMX iOS</div>
          <div class="text-subtitle2 text-grey-7 q-mt-xs">
            Validacion de backend desde web local
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <div class="text-body2"><strong>API Base:</strong> {{ apiBaseUrl }}</div>
          <div class="text-body2 q-mt-sm"><strong>Estado:</strong> {{ statusLabel }}</div>
          <div v-if="serverTimestamp" class="text-body2 q-mt-sm">
            <strong>Timestamp:</strong> {{ serverTimestamp }}
          </div>
          <div v-if="errorMessage" class="text-negative q-mt-md">{{ errorMessage }}</div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            color="primary"
            :loading="isLoading"
            label="Probar conexion"
            @click="runHealthCheck"
          />
        </q-card-actions>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import { apiConfig } from '@antojados/http/config/api'
import { systemService } from '@antojados/api/services'

const $q = useQuasar()

const isLoading = ref(false)
const status = ref('Pendiente')
const serverTimestamp = ref(null)
const errorMessage = ref('')

const apiBaseUrl = apiConfig.apiUrl

const statusLabel = computed(() => status.value)

async function runHealthCheck() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const health = await systemService.getHealth()
    status.value = health.status
    serverTimestamp.value = health.timestamp
    $q.notify({ type: 'positive', message: 'Conexion con backend OK' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error de conexion no identificado'
    status.value = 'Error'
    serverTimestamp.value = null
    errorMessage.value = message
    $q.notify({ type: 'negative', message })
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.page-bg {
  background: linear-gradient(145deg, #f6f8ff 0%, #edf2ff 100%);
  min-height: 100%;
}

.container {
  max-width: 720px;
}
</style>
