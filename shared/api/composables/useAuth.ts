import { clearTokens, getTokens } from '@antojados/api/storage/token.storage'
import { authService } from '@antojados/api/services'
import type { LoginRequest, LoginResponse } from '@antojados/api/types/auth'

export function useAuth() {
  async function login(input: LoginRequest): Promise<LoginResponse> {
    return authService.login(input)
  }

  return {
    login,
    logout: clearTokens,
    getTokens,
  }
}
