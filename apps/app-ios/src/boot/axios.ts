import { boot } from 'quasar/wrappers'
import { authService, httpClient, usersService } from '@antojados/api/services'

console.log('[TRACE boot/axios.ts] boot de axios INICIANDO')
console.log('[TRACE boot/axios.ts] httpClient existe:', !!httpClient)
console.log('[TRACE boot/axios.ts] authService existe:', !!authService)

declare module 'vue' {
  interface ComponentCustomProperties {
    $api: typeof httpClient
    $auth: typeof authService
    $users: typeof usersService
  }
}

export default boot(({ app }) => {
  console.log('[TRACE boot/axios.ts] boot callback EJECUTÁNDOSE')

  app.config.globalProperties.$api = httpClient
  app.config.globalProperties.$auth = authService
  app.config.globalProperties.$users = usersService

  app.provide('api', httpClient)
  app.provide('authService', authService)
  app.provide('usersService', usersService)

  console.log('[TRACE boot/axios.ts] boot COMPLETADO')
})

export { authService, httpClient, usersService }
