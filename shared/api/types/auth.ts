export type AuthInstanceType = 'user' | 'sponsor'

export interface TragonSession {
  userId: string
  email: string
  displayName: string | null
  username: string | null
  instanceType: AuthInstanceType
  domainContext: AuthInstanceType
  instanceId: string | null
  tenantUserId: string | null
  placeId: string | null
  cityCode: string | null
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginRequest {
  email?: string
  loginIdentifier?: string
  password: string
}

export interface SocialRegisterInput {
  fullName: string
  email: string
  password: string
  confirmPassword?: string
  marketingOptIn?: boolean
  placeId?: string | null
}

export interface SponsorTeamSeedItem {
  email?: string | null
  phone?: string | null
  channel?: string | null
}

export interface SponsorRegisterInput {
  fullName: string
  email: string
  username: string
  password: string
  confirmPassword?: string
  businessName: string
  bizType: string
  cityCode?: string | null
  phone?: string | null
  marketingOptIn?: boolean
  placeId?: string | null
  teamSeed?: SponsorTeamSeedItem[]
}

export interface EmployeeRegisterInput {
  fullName: string
  email: string
  password: string
  confirmPassword?: string
  inviteCode: string
  marketingOptIn?: boolean
}

export interface PasswordRecoveryRequestInput {
  email: string
  deliveryChannel?: 'email' | 'sms'
}

export interface PasswordRecoveryRequestResult {
  recoveryRequestId: string
  expiresAt: string | null
  channel: string | null
  deliveryStatus?: string | null
  deliveryTargetMasked?: string | null
  message: string | null
  recoveryCode?: string | null
}

export interface PasswordRecoveryVerifyInput {
  recoveryRequestId: string
  recoveryCode: string
}

export interface PasswordRecoveryResetInput {
  recoveryRequestId: string
  recoveryCode: string
  password: string
  confirmPassword?: string
}

export interface AuthContextResolution {
  domainContext: AuthInstanceType
  instanceType: AuthInstanceType
  instanceId: string | null
  tenantUserId: string | null
}

export interface AuthUserProfile {
  id: string
  userId: string
  email: string
  name: string
  username: string | null
  cityCode: string | null
  avatarUrl: string | null
  bio: string | null
  instagramHandle: string | null
  facebookUrl: string | null
  tiktokHandle: string | null
  xHandle: string | null
  whatsappNumber: string | null
  followerCount: number
  followingCount: number
  reputationLevel: number
  verifiedReviewer: boolean
  socialAccountRoleCode: string | null
  collaborationTypeCode: string | null
  corpInstanceId: string | null
  programInstanceId: string | null
  commissionProfileCode: string | null
  economicStatus: string | null
  status: string | null
  createdAt: string | null
}

export interface AuthUser {
  userId: string
  email?: string | null
  displayName?: string | null
  username?: string | null
  avatarUrl?: string | null
  instanceType?: AuthInstanceType | null
  instanceId?: string | null
  tenantUserId?: string | null
  placeId?: string | null
  cityCode?: string | null
}

export interface AuthProfileUpdateInput {
  displayName?: string
  bio?: string
  avatarUrl?: string
}

export interface LoginResponse {
  session: TragonSession
  user: AuthUserProfile
  accessToken?: string | null
  refreshToken?: string | null
}
