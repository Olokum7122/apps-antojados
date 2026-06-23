import { computed, reactive, ref } from 'vue'
import { authService } from '@antojados/api/services'
import { clearTokens, getTokens } from '@antojados/api/storage/token.storage'
import { normalizeApiError, setHttpLogoutHandler } from '@antojados/http/interceptors'
import type { ApiError } from '@antojados/api/types/api'
import type {
  AuthProfileUpdateInput,
  AuthUserProfile,
  EmployeeRegisterInput,
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

// Shared iOS/TestFlight parity: this is the single app auth state used by iOS and Android shells.
const session = ref<TragonSession | null>(null)
const profile = ref<AuthUserProfile | null>(null)
const hydrated = ref(false)

interface RequestState {
  loading: boolean
  success: boolean
  error: ApiError | null
}

function createRequestState(): RequestState {
  return reactive({
    loading: false,
    success: false,
    error: null,
  })
}

async function runRequest<TResult>(
  state: RequestState,
  request: () => Promise<TResult>,
): Promise<TResult> {
  state.loading = true
  state.success = false
  state.error = null

  try {
    const result = await request()
    state.success = true
    return result
  } catch (error) {
    state.error = normalizeApiError(error)
    throw state.error
  } finally {
    state.loading = false
  }
}

function fallbackProfile(nextSession: TragonSession): AuthUserProfile {
  return {
    id: nextSession.userId,
    userId: nextSession.userId,
    email: nextSession.email,
    name: nextSession.displayName || nextSession.email,
    username: nextSession.username || null,
    cityCode: nextSession.cityCode || null,
    avatarUrl: null,
    bio: null,
    instagramHandle: null,
    facebookUrl: null,
    tiktokHandle: null,
    xHandle: null,
    whatsappNumber: null,
    followerCount: 0,
    followingCount: 0,
    reputationLevel: 0,
    verifiedReviewer: false,
    socialAccountRoleCode: null,
    collaborationTypeCode: null,
    corpInstanceId: null,
    programInstanceId: null,
    commissionProfileCode: null,
    economicStatus: null,
    status: null,
    createdAt: null,
  }
}

function setActiveSession(nextSession: TragonSession | null): TragonSession | null {
  session.value = nextSession
  hydrated.value = true
  if (!nextSession) {
    profile.value = null
  }
  return nextSession
}

async function hydrateSession(): Promise<TragonSession | null> {
  return setActiveSession(await authService.getSession())
}

async function refreshProfile(userId?: string): Promise<AuthUserProfile | null> {
  const currentSession = session.value || await hydrateSession()
  const resolvedUserId = userId || currentSession?.userId

  if (!resolvedUserId) {
    profile.value = null
    return null
  }

  const response = await authService.profile(resolvedUserId, currentSession?.email || '')
  profile.value = response.data
  return response.data
}

async function adoptRegisteredSession(nextSession: TragonSession): Promise<TragonSession> {
  setActiveSession(nextSession)
  profile.value = fallbackProfile(nextSession)

  try {
    await refreshProfile(nextSession.userId)
  } catch {
    // The account was already created. Profile hydration can be retried later.
  }

  return nextSession
}

setHttpLogoutHandler(async () => {
  // Shared iOS/TestFlight parity: a failed token refresh must clear the persisted native session too.
  await authService.clearSession()
  setActiveSession(null)
})

export function useAuth() {
  const loginState = createRequestState()
  const socialRegisterState = createRequestState()
  const sponsorRegisterState = createRequestState()
  const employeeRegisterState = createRequestState()
  const profileState = createRequestState()
  const updateProfileState = createRequestState()
  const passwordRecoveryState = createRequestState()
  const passwordVerifyState = createRequestState()
  const passwordResetState = createRequestState()
  const logoutState = createRequestState()

  async function login(input: LoginRequest): Promise<LoginResponse> {
    return runRequest(loginState, async () => {
      const response = await authService.loginShared(input)
      setActiveSession(response.session)
      profile.value = response.user
      return response
    })
  }

  async function registerSocial(input: SocialRegisterInput): Promise<TragonSession> {
    return runRequest(socialRegisterState, async () =>
      adoptRegisteredSession(await authService.registerSocial(input)),
    )
  }

  async function registerSponsor(input: SponsorRegisterInput): Promise<TragonSession> {
    return runRequest(sponsorRegisterState, async () =>
      adoptRegisteredSession(await authService.registerSponsor(input)),
    )
  }

  async function registerEmployee(input: EmployeeRegisterInput): Promise<TragonSession> {
    return runRequest(employeeRegisterState, async () =>
      adoptRegisteredSession(await authService.registerEmployee(input)),
    )
  }

  async function fetchProfile(userId?: string): Promise<AuthUserProfile | null> {
    return runRequest(profileState, () => refreshProfile(userId))
  }

  async function saveProfile(input: AuthProfileUpdateInput): Promise<AuthUserProfile> {
    return runRequest(updateProfileState, async () => {
      const currentSession = session.value || await hydrateSession()
      if (!currentSession?.userId) {
        throw new Error('No hay sesion activa.')
      }

      const response = await authService.updateProfile(currentSession.userId, input)
      profile.value = response.data
      return response.data
    })
  }

  async function requestPasswordRecovery(
    input: PasswordRecoveryRequestInput,
  ): Promise<PasswordRecoveryRequestResult> {
    return runRequest(passwordRecoveryState, async () =>
      (await authService.requestPasswordRecovery(input)).data,
    )
  }

  async function verifyPasswordRecovery(
    input: PasswordRecoveryVerifyInput,
  ): Promise<{ verified: boolean }> {
    return runRequest(passwordVerifyState, async () =>
      (await authService.verifyPasswordRecovery(input)).data,
    )
  }

  async function resetPasswordRecovery(
    input: PasswordRecoveryResetInput,
  ): Promise<{ reset: boolean }> {
    return runRequest(passwordResetState, async () =>
      (await authService.resetPasswordRecovery(input)).data,
    )
  }

  async function logout(): Promise<void> {
    await runRequest(logoutState, async () => {
      await authService.clearSession()
      await clearTokens()
      setActiveSession(null)
    })
  }

  return {
    session,
    profile,
    hydrated,
    isAuthenticated: computed(() => Boolean(session.value?.userId)),
    hydrateSession,
    login,
    registerSocial,
    registerSponsor,
    registerEmployee,
    logout,
    fetchProfile,
    saveProfile,
    requestPasswordRecovery,
    verifyPasswordRecovery,
    resetPasswordRecovery,
    getTokens,
    loginState,
    socialRegisterState,
    sponsorRegisterState,
    employeeRegisterState,
    profileState,
    updateProfileState,
    passwordRecoveryState,
    passwordVerifyState,
    passwordResetState,
    logoutState,
  }
}
