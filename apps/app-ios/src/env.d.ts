/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_APP_ENV: string
  readonly VITE_APP_VERSION: string
  readonly VITE_API_TIMEOUT?: string
  readonly VITE_AUTH_REFRESH_PATH?: string
  readonly VITE_MEDIA_ENGINE_URL?: string
  readonly VITE_EXPLORER_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
