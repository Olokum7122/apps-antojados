import type { AxiosInstance } from 'axios'
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
import { sha256Hex, sha256SecretRef } from '@antojados/api/services/auth/auth-crypto'
import type { ApiResponse } from '@antojados/api/types/api'
import type {
  AuthContextResolution,
  AuthProfileUpdateInput,
  AuthUser,
  AuthUserProfile,
  EmployeeRegisterInput,
  LoginCredentials,
  LoginRequest,
  LoginResponse,
  PasswordRecoveryRequestInput,
  PasswordRecoveryRequestResult,
  PasswordRecoveryResetInput,
  PasswordRecoveryVerifyInput,
  SocialRegisterInput,
  SponsorRegisterInput,
  TragonSession,
} from '@antojados/api/types/auth'
import { clearGtAccessCache, primeGtAccessForSession } from '@antojados/api/services/gt/gt-access.service'

const ACTIVE_SESSION_KEY = 'antojados.session'

interface LoginApiResponse {
  user_id: string
  display_name?: string | null
  username?: string | null
  place_id?: string | null
  city_code?: string | null
  avatar_url?: string | null
  bio?: string | null
  social_account_role_code?: string | null
  collaboration_type_code?: string | null
  corp_instance_id?: string | null
  program_instance_id?: string | null
  commission_profile_code?: string | null
  economic_status?: string | null
  status?: string | null
  access_token?: string | null
  refresh_token?: string | null
}

interface ProfileApiResponse extends LoginApiResponse {
  instagram_handle?: string | null
  facebook_url?: string | null
  tiktok_handle?: string | null
  x_handle?: string | null
  whatsapp_number?: string | null
  follower_count?: number | null
  following_count?: number | null
  reputation_level?: number | null
  verified_reviewer?: boolean | number | null
  created_at?: string | null
}

interface InstanceInfoResponse {
  instance_id?: string | null
  status?: string | null
}

interface MyTenantResponse {
  instance_id?: string | null
  tenant_user_id?: string | null
}

function normalizeEmail(email: string): string {
  return String(email || '').trim().toLowerCase()
}

function deriveUsername(input: string): string | null {
  const normalized = normalizeEmail(input)
  if (!normalized) return null
  return normalized.includes('@') ? null : normalized
}

function createId(prefix: string): string {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}_${globalThis.crypto.randomUUID()}`
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function mapProfile(raw: ProfileApiResponse, email: string): AuthUserProfile {
  return {
    id: String(raw.user_id),
    userId: String(raw.user_id),
    email,
    name: String(raw.display_name || '').trim() || email,
    username: raw.username || null,
    cityCode: raw.city_code || null,
    avatarUrl: raw.avatar_url || null,
    bio: raw.bio || null,
    instagramHandle: raw.instagram_handle || null,
    facebookUrl: raw.facebook_url || null,
    tiktokHandle: raw.tiktok_handle || null,
    xHandle: raw.x_handle || null,
    whatsappNumber: raw.whatsapp_number || null,
    followerCount: Number(raw.follower_count || 0),
    followingCount: Number(raw.following_count || 0),
    reputationLevel: Number(raw.reputation_level || 0),
    verifiedReviewer: raw.verified_reviewer === true || Number(raw.verified_reviewer || 0) === 1,
    socialAccountRoleCode: raw.social_account_role_code || null,
    collaborationTypeCode: raw.collaboration_type_code || null,
    corpInstanceId: raw.corp_instance_id || null,
    programInstanceId: raw.program_instance_id || null,
    commissionProfileCode: raw.commission_profile_code || null,
    economicStatus: raw.economic_status || null,
    status: raw.status || null,
    createdAt: raw.created_at || null,
  }
}

function mapAuthUser(profile: AuthUserProfile, session?: TragonSession | null): AuthUser {
  return {
    userId: profile.userId,
    email: profile.email,
    displayName: profile.name,
    username: profile.username,
    avatarUrl: profile.avatarUrl,
    instanceType: session?.instanceType || null,
    instanceId: session?.instanceId || null,
    tenantUserId: session?.tenantUserId || null,
    placeId: session?.placeId || null,
    cityCode: profile.cityCode || session?.cityCode || null,
  }
}

export class AuthService {
  constructor(private readonly http: AxiosInstance = httpClient) {}

  async registerSocial(input: SocialRegisterInput): Promise<TragonSession> {
    return this.registerAccount({
      fullName: input.fullName,
      email: input.email,
      password: input.password,
      confirmPassword: input.confirmPassword,
      instanceType: 'user',
      marketingOptIn: input.marketingOptIn,
      placeId: input.placeId || null,
    })
  }

  async registerSponsor(input: SponsorRegisterInput): Promise<TragonSession> {
    return this.registerAccount({
      fullName: input.fullName,
      email: input.email,
      username: input.username,
      password: input.password,
      confirmPassword: input.confirmPassword,
      instanceType: 'sponsor',
      businessName: input.businessName,
      bizType: input.bizType,
      cityCode: input.cityCode,
      phone: input.phone || null,
      marketingOptIn: input.marketingOptIn,
      placeId: input.placeId || null,
      teamSeed: input.teamSeed || [],
    })
  }

  async registerEmployee(input: EmployeeRegisterInput): Promise<TragonSession> {
    return this.registerAccount({
      fullName: input.fullName,
      email: input.email,
      password: input.password,
      confirmPassword: input.confirmPassword,
      instanceType: 'user',
      inviteCode: input.inviteCode,
      marketingOptIn: input.marketingOptIn,
    })
  }

  async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> {
    const normalizedEmail = normalizeEmail(credentials.email)
    const emailHash = normalizedEmail.includes('@') ? await sha256Hex(normalizedEmail) : null
    const passwordSecretRef = await sha256SecretRef(credentials.password)

    const { data } = await this.http.post<LoginApiResponse>(API_ENDPOINTS.auth.login, {
      email_hash: emailHash,
      login_identifier: normalizedEmail,
      password_secret_ref: passwordSecretRef,
    })

    if (data.access_token || data.refresh_token) {
      await setTokens({
        accessToken: data.access_token || null,
        refreshToken: data.refresh_token || null,
      })
    }

    const session = await this.buildSession({
      userId: data.user_id,
      email: normalizedEmail,
      displayName: data.display_name || null,
      username: data.username || null,
      cityCode: data.city_code || null,
      placeId: data.place_id || null,
    })
    const profile = await this.profile(session.userId, session.email)

    await this.setSession(session)

    return {
      success: true,
      data: {
        session,
        user: profile.data,
        accessToken: data.access_token || null,
        refreshToken: data.refresh_token || null,
      },
    }
  }

  async loginShared(input: LoginRequest): Promise<LoginResponse> {
    const response = await this.login({
      email: input.email || input.loginIdentifier || '',
      password: input.password,
    })
    return response.data
  }

  async profile(userId: string, emailHint?: string): Promise<ApiResponse<AuthUserProfile>> {
    const { data } = await this.http.get<ProfileApiResponse>(API_ENDPOINTS.auth.profile(userId))
    return {
      success: true,
      data: mapProfile(data, emailHint || ''),
    }
  }

  async getProfile(userId: string): Promise<AuthUser> {
    const stored = await this.getSession()
    const response = await this.profile(userId, stored?.email || '')
    return mapAuthUser(response.data, stored)
  }

  async updateProfile(
    userId: string,
    payload: AuthProfileUpdateInput,
  ): Promise<ApiResponse<AuthUserProfile>> {
    await this.http.patch(API_ENDPOINTS.auth.profile(userId), {
      display_name: payload.displayName,
      bio: payload.bio,
      avatar_url: payload.avatarUrl,
    })

    const stored = await this.getSession()
    return this.profile(userId, stored?.email || '')
  }

  async requestPasswordRecovery(
    input: PasswordRecoveryRequestInput,
  ): Promise<ApiResponse<PasswordRecoveryRequestResult>> {
    const emailHash = await sha256Hex(normalizeEmail(input.email))
    const { data } = await this.http.post<{
      recovery_request_id?: string
      expires_at?: string | null
      delivery_channel?: string | null
      delivery_status?: string | null
      delivery_target_masked?: string | null
      message?: string | null
      recovery_code?: string | null
    }>(API_ENDPOINTS.auth.passwordRecoveryRequest, {
      email_hash: emailHash,
      email: normalizeEmail(input.email),
      delivery_channel: input.deliveryChannel || 'email',
    })

    return {
      success: true,
      data: {
        recoveryRequestId: String(data.recovery_request_id || ''),
        expiresAt: data.expires_at || null,
        channel: data.delivery_channel || null,
        deliveryStatus: data.delivery_status || null,
        deliveryTargetMasked: data.delivery_target_masked || null,
        message: data.message || null,
        recoveryCode: data.recovery_code || null,
      },
    }
  }

  async verifyPasswordRecovery(
    input: PasswordRecoveryVerifyInput,
  ): Promise<ApiResponse<{ verified: boolean }>> {
    await this.http.post(API_ENDPOINTS.auth.passwordRecoveryVerify, {
      recovery_request_id: input.recoveryRequestId,
      recovery_code: input.recoveryCode,
    })

    return {
      success: true,
      data: { verified: true },
    }
  }

  async resetPasswordRecovery(
    input: PasswordRecoveryResetInput,
  ): Promise<ApiResponse<{ reset: boolean }>> {
    const passwordSecretRef = await sha256SecretRef(input.password)
    const confirmSecretRef = await sha256SecretRef(input.confirmPassword || input.password)

    await this.http.post(API_ENDPOINTS.auth.passwordRecoveryReset, {
      recovery_request_id: input.recoveryRequestId,
      recovery_code: input.recoveryCode,
      password_secret_ref: passwordSecretRef,
      password_confirm_secret_ref: confirmSecretRef,
    })

    return {
      success: true,
      data: { reset: true },
    }
  }

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

  private async registerAccount(input: {
    fullName: string
    email: string
    password: string
    confirmPassword?: string
    instanceType: 'user' | 'sponsor'
    inviteCode?: string
    marketingOptIn?: boolean
    placeId?: string | null
    username?: string
    businessName?: string
    bizType?: string
    cityCode?: string | null
    phone?: string | null
    teamSeed?: { email?: string | null; phone?: string | null; channel?: string | null }[]
  }): Promise<TragonSession> {
    const normalizedEmail = normalizeEmail(input.email)
    const userId = createId('user')
    const localAccountId = createId('acct')
    const emailHash = await sha256Hex(normalizedEmail)
    const passwordSecretRef = await sha256SecretRef(input.password)
    const passwordConfirmSecretRef = await sha256SecretRef(input.confirmPassword || input.password)
    const inviteCode = String(input.inviteCode || '').trim().toUpperCase() || null
    const endpoint = inviteCode ? API_ENDPOINTS.auth.registerEmployee : API_ENDPOINTS.auth.register

    const payload: Record<string, unknown> = {
      user_id: userId,
      local_account_id: localAccountId,
      email_hash: emailHash,
      display_name: input.fullName,
      username: deriveUsername(input.username || input.email),
      instance_type: inviteCode ? 'user' : input.instanceType,
      password_secret_ref: passwordSecretRef,
      password_confirm_secret_ref: passwordConfirmSecretRef,
      marketing_opt_in: input.marketingOptIn ? 1 : 0,
      invite_code: inviteCode,
    }

    if (!inviteCode) {
      payload.place_id = input.placeId || null

      if (input.instanceType === 'sponsor') {
        payload.business_name = input.businessName || null
        payload.biz_type = input.bizType || null
        payload.city_code = input.cityCode || null
        payload.phone = input.phone || null
        payload.team_seed = Array.isArray(input.teamSeed)
          ? input.teamSeed
            .map((member) => ({
              invitee_email: String(member.email || '').trim() || null,
              invitee_phone_e164: String(member.phone || '').trim() || null,
              channel: String(member.channel || '').trim().toLowerCase() || null,
            }))
            .filter((member) => member.invitee_email || member.invitee_phone_e164)
          : []
      }
    }

    const { data } = await this.http.post<{
      user_id?: string
      instance_id?: string | null
      tenant_user_id?: string | null
      access_token?: string | null
      refresh_token?: string | null
    }>(endpoint, payload)

    if (data.access_token || data.refresh_token) {
      await setTokens({
        accessToken: data.access_token || null,
        refreshToken: data.refresh_token || null,
      })
    }

    const session = await this.buildSession({
      userId: String(data.user_id || userId),
      email: normalizedEmail,
      displayName: input.fullName,
      username: deriveUsername(input.username || input.email),
      cityCode: input.cityCode || null,
      placeId: inviteCode ? null : (input.placeId || null),
      instanceIdHint: data.instance_id || null,
      tenantUserIdHint: data.tenant_user_id || null,
      instanceTypeHint: input.instanceType === 'sponsor' || inviteCode || data.tenant_user_id ? 'sponsor' : 'user',
    })

    await this.setSession(session)
    return session
  }

  private async buildSession(input: {
    userId: string
    email: string
    displayName: string | null
    username: string | null
    cityCode: string | null
    placeId: string | null
    instanceIdHint?: string | null
    tenantUserIdHint?: string | null
    instanceTypeHint?: 'user' | 'sponsor'
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

  private async resolveSessionContext(
    userId: string,
    preferredType?: 'user' | 'sponsor',
  ): Promise<AuthContextResolution> {
    let sponsorInstanceId: string | null = null
    let userInstanceId: string | null = null
    let sponsorWorkspaceInstanceId: string | null = null
    let tenantUserId: string | null = null

    try {
      const { data } = await this.http.get<InstanceInfoResponse>(API_ENDPOINTS.instance.me, {
        params: { user_id: userId, instance_type: 'sponsor' },
      })
      sponsorInstanceId = data.instance_id || null
    } catch {
      sponsorInstanceId = null
    }

    try {
      const { data } = await this.http.get<InstanceInfoResponse>(API_ENDPOINTS.instance.me, {
        params: { user_id: userId, instance_type: 'user' },
      })
      userInstanceId = data.instance_id || null
    } catch {
      userInstanceId = null
    }

    try {
      const { data } = await this.http.get<MyTenantResponse>(API_ENDPOINTS.equipo.myTenant, {
        params: { user_id: userId },
      })
      // Shared iOS/TestFlight parity: this endpoint resolves the app workspace
      // as sponsor instance + tenant_user_id; it does not make tenant the UI axis.
      sponsorWorkspaceInstanceId = data.instance_id || null
      tenantUserId = data.tenant_user_id || null
    } catch {
      sponsorWorkspaceInstanceId = null
      tenantUserId = null
    }

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
}

const sharedAuthService = new AuthService(httpClient)

export async function login(input: LoginRequest): Promise<LoginResponse> {
  return sharedAuthService.loginShared(input)
}

export async function getProfile(userId: string): Promise<AuthUser> {
  return sharedAuthService.getProfile(userId)
}
