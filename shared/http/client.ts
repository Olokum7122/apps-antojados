import axios from 'axios'
import { apiConfig, assertApiConfigured } from '@antojados/http/config/api'
import { setupHttpInterceptors } from '@antojados/http/interceptors'

assertApiConfigured()

export const httpClient = setupHttpInterceptors(
  axios.create({
    baseURL: apiConfig.apiUrl,
    timeout: apiConfig.apiTimeout,
    headers: {
      Accept: 'application/json',
    },
  }),
)
