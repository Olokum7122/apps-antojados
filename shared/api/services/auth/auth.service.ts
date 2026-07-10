import { httpClient } from '@antojados/http/client'
import { API_ENDPOINTS } from '@antojados/http/endpoints'
import { setTokens } from '@antojados/api/storage/token.storage'
import { sharedSessionService } from '@antojados/api/services/auth/session.service'
import { sharedProfileService } from '@antojados/api/services/auth/profile.service'
import { sha256Hex, sha256SecretRef } from '@antojados/api/services/auth/auth-crypto'
import type { ApiResponse } from '@antojados/api/types/api'
import type {
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

interface LoginApiResponse {
  user_id?: string
  display_name?: string | null
  username?: string | null
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

interface RegisterApiResponse {
  user_id?: string
  instance_id?: string | null
  tenant_user_id?: string | null
  access_token?: string | null
  refresh_token?: string | null
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

export class AuthService {
  constructor(private readonly http = httpClient) {}

  // ─── Register ─────────────────────────────────────────────────────────────

  async registerSocial(input: SocialRegisterInput): Promise<TragonSession> {
    const normalizedEmail = normalizeEmail(input.email)
    const userId = createId('user')

    const payload: Record<string, unknown> = {
      user_id: userId,
      local_account_id: createId('acct'),
      email_hash: await sha256Hex(normalizedEmail),
      display_name: input.fullName,
      username: deriveUsername(input.email),
      instance_type: 'user',
      password_secret_ref: await sha256SecretRef(input.password),
      password_confirm_secret_ref: await sha256SecretRef(input.confirmPassword || input.password),
      marketing_opt_in: input.marketingOptIn ? 1 : 0,
    }

    const { data } = await this.http.post<RegisterApiResponse>(API_ENDPOINTS.auth.register, payload)
    await this.handleTokens(data)

    const session = await sharedSessionService.buildSession({
      userId: String(data.user_id || userId),
      email: normalizedEmail,
      displayName: input.fullName,
      username: deriveUsername(input.email),
      cityCode: null,
    })

    await sharedSessionService.setSession(session)
    return session
  }

  async registerSponsor(input: SponsorRegisterInput): Promise<TragonSession> {
    const normalizedEmail = normalizeEmail(input.email)
    const userId = createId('user')

    const payload: Record<string, unknown> = {
      user_id: userId,
      local_account_id: createId('acct'),
      email_hash: await sha256Hex(normalizedEmail),
      display_name: input.fullName,
      username: deriveUsername(input.username || input.email),
      instance_type: 'sponsor',
      password_secret_ref: await sha256SecretRef(input.password),
      password_confirm_secret_ref: await sha256SecretRef(input.confirmPassword || input.password),
      marketing_opt_in: input.marketingOptIn ? 1 : 0,
      business_name: input.businessName || null,
      biz_type: input.bizType || null,
      city_code: input.cityCode || null,
      phone: input.phone || null,
      team_seed: Array.isArray(input.teamSeed)
        ? input.teamSeed
            .map((member) => ({
              invitee_email: String(member.email || '').trim() || null,
              invitee_phone_e164: String(member.phone || '').trim() || null,
              channel: String(member.channel || '').trim().toLowerCase() || null,
            }))
            .filter((member) => member.invitee_email || member.invitee_phone_e164)
        : [],
    }

    const { data } = await this.http.post<RegisterApiResponse>(API_ENDPOINTS.auth.register, payload)
    await this.handleTokens(data)

    const session = await sharedSessionService.buildSession({
      userId: String(data.user_id || userId),
      email: normalizedEmail,
      displayName: input.fullName,
      username: deriveUsername(input.username || input.email),
      cityCode: input.cityCode || null,
      instanceIdHint: data.instance_id || null,
      tenantUserIdHint: data.tenant_user_id || null,
      instanceTypeHint: 'sponsor',
    })

    await sharedSessionService.setSession(session)
    return session
  }

  async registerEmployee(input: EmployeeRegisterInput): Promise<TragonSession> {
    const normalizedEmail = normalizeEmail(input.email)
    const userId = createId('user')
    const inviteCode = String(input.inviteCode || '').trim().toUpperCase() || null

    const payload: Record<string, unknown> = {
      user_id: userId,
      local_account_id: createId('acct'),
      email_hash: await sha256Hex(normalizedEmail),
      display_name: input.fullName,
      username: deriveUsername(input.email),
      instance_type: 'user',
      password_secret_ref: await sha256SecretRef(input.password),
      password_confirm_secret_ref: await sha256SecretRef(input.confirmPassword || input.password),
      marketing_opt_in: input.marketingOptIn ? 1 : 0,
      invite_code: inviteCode,
    }

    const { data } = await this.http.post<RegisterApiResponse>(API_ENDPOINTS.auth.registerEmployee, payload)
    await this.handleTokens(data)

    const session = await sharedSessionService.buildSession({
      userId: String(data.user_id || userId),
      email: normalizedEmail,
      displayName: input.fullName,
      username: deriveUsername(input.email),
      cityCode: null,
      instanceIdHint: data.instance_id || null,
      tenantUserIdHint: data.tenant_user_id || null,
      instanceTypeHint: data.tenant_user_id ? 'sponsor' : 'user',
    })

    await sharedSessionService.setSession(session)
    return session
  }

  // ─── Login ────────────────────────────────────────────────────────────────

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

    const session = await sharedSessionService.buildSession({
      userId: String(data.user_id),
      email: normalizedEmail,
      displayName: data.display_name || null,
      username: data.username || null,
      cityCode: data.city_code || null,
    })

    const profileResponse = await sharedProfileService.profile(session.userId, session.email)
    await sharedSessionService.setSession(session)

    return {
      success: true,
      data: {
        session,
        user: profileResponse.data,
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

  // ─── Password Recovery ────────────────────────────────────────────────────

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
    return { success: true, data: { verified: true } }
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
    return { success: true, data: { reset: true } }
  }

  // ─── Session delegation ───────────────────────────────────────────────────

  async setSession(session: TragonSession): Promise<void> {
    return sharedSessionService.setSession(session)
  }

  async clearSession(): Promise<void> {
    return sharedSessionService.clearSession()
  }

  async getSession(): Promise<TragonSession | null> {
    return sharedSessionService.getSession()
  }

  async getAccessToken(): Promise<string | null> {
    return sharedSessionService.getAccessToken()
  }

  async getRefreshToken(): Promise<string | null> {
    return sharedSessionService.getRefreshToken()
  }

  async getTokens(): Promise<{ accessToken: string | null; refreshToken: string | null }> {
    return sharedSessionService.getTokens()
  }

  // ─── Profile delegation ───────────────────────────────────────────────────

  async profile(userId: string, emailHint?: string): Promise<ApiResponse<AuthUserProfile>> {
    return sharedProfileService.profile(userId, emailHint)
  }

  async getProfile(userId: string): Promise<AuthUser> {
    return sharedProfileService.getProfile(userId)
  }

  async updateProfile(
    userId: string,
    payload: AuthProfileUpdateInput,
  ): Promise<ApiResponse<AuthUserProfile>> {
    return sharedProfileService.updateProfile(userId, payload)
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async handleTokens(data: RegisterApiResponse): Promise<void> {
    if (data.access_token || data.refresh_token) {
      await setTokens({
        accessToken: data.access_token || null,
        refreshToken: data.refresh_token || null,
      })
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
