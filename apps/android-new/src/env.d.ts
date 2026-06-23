/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_APP_ENV: string
  readonly VITE_APP_VERSION: string
  readonly VITE_API_TIMEOUT?: string
  readonly VITE_AUTH_REFRESH_PATH?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
