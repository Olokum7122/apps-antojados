export interface ApiConfig {
  apiUrl: string
  appEnv: string
  appVersion: string
  apiTimeout: number
  refreshPath: string
}

function parseTimeout(value: string | undefined): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 30000
}

function normalizeUrl(value: string): string {
  return value.trim().replace(/\/+$/, '')
}

export const apiConfig: ApiConfig = {
  apiUrl: normalizeUrl(import.meta.env.VITE_API_URL || ''),
  appEnv: import.meta.env.VITE_APP_ENV || 'development',
  appVersion: import.meta.env.VITE_APP_VERSION || '0.0.0',
  apiTimeout: parseTimeout(import.meta.env.VITE_API_TIMEOUT),
  refreshPath: String(import.meta.env.VITE_AUTH_REFRESH_PATH || '').trim(),
}

export function assertApiConfigured(): void {
  if (!apiConfig.apiUrl.startsWith('http://') && !apiConfig.apiUrl.startsWith('https://')) {
    throw new Error('VITE_API_URL no configurado o invalido')
  }
}
