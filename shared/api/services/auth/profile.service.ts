import { httpClient } from '@antojados/http/client'
import { API_ENDPOINTS } from '@antojados/http/endpoints'
import type { ApiResponse } from '@antojados/api/types/api'
import type {
  AuthProfileUpdateInput,
  AuthUser,
  AuthUserProfile,
  TragonSession,
} from '@antojados/api/types/auth'

interface ProfileApiResponse {
  user_id?: string
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
    placeId: null,
    cityCode: profile.cityCode || session?.cityCode || null,
  }
}

export class ProfileService {
  constructor(private readonly http = httpClient) {}

  async profile(userId: string, emailHint?: string): Promise<ApiResponse<AuthUserProfile>> {
    const { data } = await this.http.get<ProfileApiResponse>(API_ENDPOINTS.auth.profile(userId))
    return {
      success: true,
      data: mapProfile(data, emailHint || ''),
    }
  }

  async getProfile(userId: string): Promise<AuthUser> {
    const { sharedSessionService } = await import('@antojados/api/services/auth/session.service')
    const stored = await sharedSessionService.getSession()
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
      city_code: payload.cityCode,
    })

    const { sharedSessionService } = await import('@antojados/api/services/auth/session.service')
    const stored = await sharedSessionService.getSession()
    return this.profile(userId, stored?.email || '')
  }
}

export const sharedProfileService = new ProfileService(httpClient)

export async function getProfile(userId: string): Promise<AuthUser> {
  return sharedProfileService.getProfile(userId)
}

