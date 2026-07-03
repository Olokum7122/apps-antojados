import type {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios'
import { Capacitor } from '@capacitor/core'
import { apiConfig } from './config/api'
import type { ApiError, RefreshTokenResponse } from '../api/types/api'
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from '../api/storage/token.storage'

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

type LogoutHandler = () => void | Promise<void>

let logoutHandler: LogoutHandler | null = null
let refreshPromise: Promise<string | null> | null = null

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function pickString(record: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value
  }
  return undefined
}

export function normalizeApiError(error: unknown): ApiError {
  const axiosError = error as AxiosError<unknown>
  const responseData = axiosError.response?.data
  const dataRecord = isRecord(responseData) ? responseData : null

  return {
    status: axiosError.response?.status || 0,
    message:
      (dataRecord && pickString(dataRecord, ['message', 'error', 'detail'])) ||
      axiosError.message ||
      'Unexpected API error',
    code: dataRecord ? pickString(dataRecord, ['code']) : undefined,
    details: dataRecord,
  }
}

export function setHttpLogoutHandler(handler: LogoutHandler | null): void {
  logoutHandler = handler
}

async function notifyLogout(): Promise<void> {
  await clearTokens()
  await logoutHandler?.()
}

function mapRefreshResponse(data: unknown): RefreshTokenResponse | null {
  if (!isRecord(data)) return null
  const payload = isRecord(data.data) ? data.data : data
  const accessToken = pickString(payload, ['accessToken', 'access_token'])
  if (!accessToken) return null

  return {
    accessToken,
    refreshToken: pickString(payload, ['refreshToken', 'refresh_token']) || null,
  }
}

async function refreshAccessToken(http: AxiosInstance): Promise<string | null> {
  if (!apiConfig.refreshPath) return null
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const refreshToken = await getRefreshToken()
    if (!refreshToken) return null

    const response = await http.post<unknown>(
      apiConfig.refreshPath,
      { refresh_token: refreshToken },
      { headers: { Authorization: undefined } },
    )
    const tokens = mapRefreshResponse(response.data)
    if (!tokens?.accessToken) return null

    await setTokens({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || refreshToken,
    })
    return tokens.accessToken
  })().finally(() => {
    refreshPromise = null
  })

  return refreshPromise
}

async function onRequest(config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> {
  const token = await getAccessToken()
  const platform = Capacitor.getPlatform()

  console.log('[TRACE interceptor] onRequest DISPARADO')
  console.log('[TRACE interceptor] method:', config.method)
  console.log('[TRACE interceptor] url:', config.url)
  console.log('[TRACE interceptor] baseURL:', config.baseURL)
  console.log('[TRACE interceptor] platform:', platform)
  console.log('[TRACE interceptor] token exists:', !!token)

  config.headers.set('Accept', 'application/json')
  config.headers.set('X-App-Version', apiConfig.appVersion)
  config.headers.set('X-App-Env', apiConfig.appEnv)
  config.headers.set('X-Device-Platform', platform)

  const method = String(config.method || 'get').toLowerCase()
  if (['post', 'put', 'patch', 'delete'].includes(method)) {
    config.headers.set('Content-Type', 'application/json')
  }

  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }

  return config
}

function onResponse(response: AxiosResponse): AxiosResponse {
  console.log('[TRACE interceptor] onResponse DISPARADO status:', response.status)
  return response
}

async function onResponseError(http: AxiosInstance, error: AxiosError): Promise<AxiosResponse> {
  const status = error.response?.status || 0
  const originalRequest = error.config as RetriableRequestConfig | undefined

  console.log('[TRACE interceptor] onResponseError DISPARADO status:', status)
  console.log('[TRACE interceptor] error message:', error.message)

  if (status !== 401 || !originalRequest || originalRequest._retry) {
    throw normalizeApiError(error)
  }

  originalRequest._retry = true
  const token = await refreshAccessToken(http)

  if (!token) {
    await notifyLogout()
    throw normalizeApiError(error)
  }

  if (originalRequest.headers) {
    originalRequest.headers.set('Authorization', `Bearer ${token}`)
  }
  return http.request(originalRequest)
}

export function setupHttpInterceptors(http: AxiosInstance): AxiosInstance {
  http.interceptors.request.use(onRequest, (error: unknown) =>
    Promise.reject(normalizeApiError(error)),
  )
  http.interceptors.response.use(onResponse, (error: AxiosError) => onResponseError(http, error))
  return http
}

