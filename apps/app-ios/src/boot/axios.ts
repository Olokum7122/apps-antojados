import { boot } from 'quasar/wrappers'
import { authService, httpClient, usersService } from '@antojados/api/services'

declare module 'vue' {
  interface ComponentCustomProperties {
    $api: typeof httpClient
    $auth: typeof authService
    $users: typeof usersService
  }
}

export default boot(({ app }) => {
  app.config.globalProperties.$api = httpClient
  app.config.globalProperties.$auth = authService
  app.config.globalProperties.$users = usersService

  app.provide('api', httpClient)
  app.provide('authService', authService)
  app.provide('usersService', usersService)
})

export { authService, httpClient, usersService }
