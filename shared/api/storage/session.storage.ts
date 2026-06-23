import { secureStorage } from '@antojados/api/storage/secure-storage'

const ACTIVE_SESSION_KEY = 'antojados.session'

export interface SharedSession {
  userId?: string | null
  displayName?: string | null
  email?: string | null
  instanceType?: 'user' | 'sponsor' | null
  domainContext?: 'user' | 'sponsor' | null
  instanceId?: string | null
  tenantUserId?: string | null
  placeId?: string | null
  cityCode?: string | null
}

export async function getSharedSession(): Promise<SharedSession | null> {
  const value = await secureStorage.get(ACTIVE_SESSION_KEY)
  if (!value) return null

  try {
    return JSON.parse(value) as SharedSession
  } catch {
    return null
  }
}
