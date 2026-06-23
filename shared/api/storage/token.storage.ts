import { secureStorage } from '@antojados/api/storage/secure-storage'

const ACCESS_TOKEN_KEY = 'antojados.auth.accessToken'
const REFRESH_TOKEN_KEY = 'antojados.auth.refreshToken'

export interface AuthTokens {
  accessToken: string | null
  refreshToken: string | null
}

export async function getAccessToken(): Promise<string | null> {
  return secureStorage.get(ACCESS_TOKEN_KEY)
}

export async function getRefreshToken(): Promise<string | null> {
  return secureStorage.get(REFRESH_TOKEN_KEY)
}

export async function getTokens(): Promise<AuthTokens> {
  const [accessToken, refreshToken] = await Promise.all([getAccessToken(), getRefreshToken()])
  return { accessToken, refreshToken }
}

export async function setTokens(tokens: Partial<AuthTokens>): Promise<void> {
  const writes: Promise<void>[] = []
  if (typeof tokens.accessToken === 'string') {
    writes.push(secureStorage.set(ACCESS_TOKEN_KEY, tokens.accessToken))
  }
  if (typeof tokens.refreshToken === 'string') {
    writes.push(secureStorage.set(REFRESH_TOKEN_KEY, tokens.refreshToken))
  }
  await Promise.all(writes)
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    secureStorage.remove(ACCESS_TOKEN_KEY),
    secureStorage.remove(REFRESH_TOKEN_KEY),
  ])
}
