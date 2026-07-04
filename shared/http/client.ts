import axios from 'axios'
import { apiConfig, assertApiConfigured } from '@antojados/http/config/api'
import { setupHttpInterceptors } from '@antojados/http/interceptors'

console.log('[TRACE client.ts] Antes de assertApiConfigured()')

assertApiConfigured()

console.log('[TRACE client.ts] assertApiConfigured() PASÓ')

console.log('[TRACE client.ts] Creando axios con baseURL:', apiConfig.apiUrl)

export const httpClient = setupHttpInterceptors(
  axios.create({
    baseURL: apiConfig.apiUrl,
    timeout: apiConfig.apiTimeout,
    headers: {
      Accept: 'application/json',
    },
  }),
)

console.log('[TRACE client.ts] httpClient CREADO exitosamente')
