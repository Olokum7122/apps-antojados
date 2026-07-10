import { httpClient } from '@antojados/http/client'
import { API_ENDPOINTS } from '@antojados/http/endpoints'
import {
  clearTokens,
  getAccessToken as readAccessToken,
  getRefreshToken as readRefreshToken,
  getTokens as readTokens,
  setTokens,
} from '@antojados/api/storage/token.storage'
import type { AuthTokens } from '@antojados/api/storage/token.storage'
import { secureStorage } from '@antojados/api/storage/secure-storage'
import { primeGtAccessForSession, clearGtAccessCache } from '@antojados/api/services/gt/gt-cache.service'
import type { AuthContextResolution, AuthInstanceType, TragonSession } from '@antojados/api/types/auth'

const ACTIVE_SESSION_KEY = 'antojados.session'

interface InstanceInfoResponse {
  instance_id?: string | null
  status?: string | null
}

interface MyTenantResponse {
  instance_id?: string | null
  tenant_user_id?: string | null
}

export class SessionService {
  constructor() {}

  async setSession(session: TragonSession): Promise<void> {
    await secureStorage.set(ACTIVE_SESSION_KEY, JSON.stringify(session))
    await primeGtAccessForSession(session)
  }

  async clearSession(): Promise<void> {
    await Promise.all([
      secureStorage.remove(ACTIVE_SESSION_KEY),
      clearTokens(),
    ])
    clearGtAccessCache()
  }

  async getSession(): Promise<TragonSession | null> {
    const value = await secureStorage.get(ACTIVE_SESSION_KEY)
    if (!value) return null

    try {
      const session = JSON.parse(value) as TragonSession
      await primeGtAccessForSession(session)
      return session
    } catch {
      return null
    }
  }

  async getAccessToken(): Promise<string | null> {
    return readAccessToken()
  }

  async getRefreshToken(): Promise<string | null> {
    return readRefreshToken()
  }

  async getTokens(): Promise<AuthTokens> {
    return readTokens()
  }

  async resolveSessionContext(
    userId: string,
    preferredType?: AuthInstanceType,
  ): Promise<AuthContextResolution> {
    // DEBT-006: Las 3 llamadas son independientes, se ejecutan en paralelo
    const results = await Promise.allSettled([
      httpClient.get<InstanceInfoResponse>(API_ENDPOINTS.instance.me, {
        params: { user_id: userId, instance_type: 'sponsor' },
      }),
      httpClient.get<InstanceInfoResponse>(API_ENDPOINTS.instance.me, {
        params: { user_id: userId, instance_type: 'user' },
      }),
      httpClient.get<MyTenantResponse>(API_ENDPOINTS.equipo.myTenant, {
        params: { user_id: userId },
      }),
    ])

    const sponsorInstanceId =
      results[0].status === 'fulfilled' ? results[0].value.data.instance_id || null : null

    const userInstanceId =
      results[1].status === 'fulfilled' ? results[1].value.data.instance_id || null : null

    const sponsorWorkspaceInstanceId =
      results[2].status === 'fulfilled' ? results[2].value.data.instance_id || null : null

    const tenantUserId =
      results[2].status === 'fulfilled' ? results[2].value.data.tenant_user_id || null : null

    if (preferredType === 'sponsor' && sponsorWorkspaceInstanceId) {
      return {
        domainContext: 'sponsor',
        instanceType: 'sponsor',
        instanceId: sponsorWorkspaceInstanceId,
        tenantUserId,
      }
    }

    if (preferredType === 'sponsor' && sponsorInstanceId) {
      return {
        domainContext: 'sponsor',
        instanceType: 'sponsor',
        instanceId: sponsorInstanceId,
        tenantUserId,
      }
    }

    if (preferredType === 'user' && userInstanceId) {
      return {
        domainContext: 'user',
        instanceType: 'user',
        instanceId: userInstanceId,
        tenantUserId: null,
      }
    }

    if (userInstanceId) {
      return {
        domainContext: 'user',
        instanceType: 'user',
        instanceId: userInstanceId,
        tenantUserId: null,
      }
    }

    if (sponsorWorkspaceInstanceId) {
      return {
        domainContext: 'sponsor',
        instanceType: 'sponsor',
        instanceId: sponsorWorkspaceInstanceId,
        tenantUserId,
      }
    }

    if (sponsorInstanceId) {
      return {
        domainContext: 'sponsor',
        instanceType: 'sponsor',
        instanceId: sponsorInstanceId,
        tenantUserId,
      }
    }

    return {
      domainContext: preferredType === 'sponsor' ? 'sponsor' : 'user',
      instanceType: preferredType === 'sponsor' ? 'sponsor' : 'user',
      instanceId: null,
      tenantUserId: null,
    }
  }

  async buildSession(input: {
    userId: string
    email: string
    displayName: string | null
    username: string | null
    cityCode: string | null
    
    instanceIdHint?: string | null
    tenantUserIdHint?: string | null
    instanceTypeHint?: AuthInstanceType
  }): Promise<TragonSession> {
    const resolved = await this.resolveSessionContext(input.userId, input.instanceTypeHint)

    return {
      userId: input.userId,
      email: input.email,
      displayName: input.displayName || null,
      username: input.username || null,
      instanceType: resolved.instanceType,
      domainContext: resolved.domainContext,
      instanceId: resolved.instanceId || input.instanceIdHint || null,
      tenantUserId: resolved.tenantUserId || input.tenantUserIdHint || null,
      placeId: input.placeId || null,
      cityCode: input.cityCode || null,
    }
  }
}

export const sharedSessionService = new SessionService()
