import { httpClient } from '@antojados/http/client'
import { API_ENDPOINTS } from '@antojados/http/endpoints'
import type { ApiResponse } from '@antojados/api/types/api'
import type {
  Reward,
  RewardEligibility,
  RewardEligibilityQuery,
  RewardRedeemInput,
  RewardRedemption,
} from '@antojados/api/types/reward'

interface RawReward extends Record<string, unknown> {
  reward_id?: string
  id?: string
  campaign_id?: string | null
  title?: string | null
  name?: string | null
  description?: string | null
  points_cost?: number | string | null
  points?: number | string | null
  sponsor_id?: string | null
  place_id?: string | null
  starts_at?: string | null
  ends_at?: string | null
  status?: string | null
}

interface RawRewardRedemption extends Record<string, unknown> {
  redemption_id?: string
  id?: string
  reward_id?: string
  campaign_id?: string
  user_id?: string
  code?: string | null
  redemption_code?: string | null
  redeemed_at?: string | null
  created_at?: string | null
  status?: string | null
}

interface RawRewardEligibility extends Record<string, unknown> {
  eligible?: boolean | number
  reason?: string | null
  points_balance?: number | string | null
  points_required?: number | string | null
}

function stringOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const text = String(value).trim()
  return text || null
}

function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

function mapReward(raw: RawReward): Reward {
  return {
    rewardId: String(raw.reward_id || raw.id || ''),
    campaignId: stringOrNull(raw.campaign_id),
    title: stringOrNull(raw.title) || stringOrNull(raw.name) || '',
    description: stringOrNull(raw.description),
    pointsCost: numberOrNull(raw.points_cost ?? raw.points),
    sponsorId: stringOrNull(raw.sponsor_id),
    placeId: stringOrNull(raw.place_id),
    startsAt: stringOrNull(raw.starts_at),
    endsAt: stringOrNull(raw.ends_at),
    status: stringOrNull(raw.status),
  }
}

function mapRedemption(raw: RawRewardRedemption): RewardRedemption {
  return {
    redemptionId: String(raw.redemption_id || raw.id || ''),
    rewardId: String(raw.reward_id || raw.campaign_id || ''),
    userId: String(raw.user_id || ''),
    code: stringOrNull(raw.code) || stringOrNull(raw.redemption_code),
    redeemedAt: stringOrNull(raw.redeemed_at) || stringOrNull(raw.created_at),
    status: stringOrNull(raw.status),
  }
}

function mapEligibility(raw: RawRewardEligibility): RewardEligibility {
  return {
    eligible: raw.eligible === true || Number(raw.eligible || 0) === 1,
    reason: stringOrNull(raw.reason),
    pointsBalance: numberOrNull(raw.points_balance),
    pointsRequired: numberOrNull(raw.points_required),
  }
}

export async function listRewards(): Promise<Reward[]> {
  return listRewardCampaigns()
}

export async function listRewardCampaigns(): Promise<Reward[]> {
  const { data } = await httpClient.get<ApiResponse<RawReward[]>>(API_ENDPOINTS.rewards.campaigns)
  return Array.isArray(data.data) ? data.data.map(mapReward) : []
}

export async function checkRewardEligibility(
  query: RewardEligibilityQuery,
): Promise<RewardEligibility> {
  const { data } = await httpClient.get<ApiResponse<RawRewardEligibility>>(
    API_ENDPOINTS.rewards.eligibility,
    {
      params: {
        user_id: query.userId,
        campaign_id: query.campaignId || query.rewardId,
        place_id: query.placeId,
      },
    },
  )
  const eligibilityData = Array.isArray(data.data) ? data.data[0] : data.data
  return mapEligibility(eligibilityData || {})
}

export async function redeemReward(
  rewardId: string,
  input: RewardRedeemInput = {},
): Promise<RewardRedemption> {
  const { data } = await httpClient.post<ApiResponse<RawRewardRedemption>>(
    API_ENDPOINTS.rewards.redeem,
    {
      user_id: input.userId,
      campaign_id: input.campaignId || rewardId,
      post_id: input.postId,
      place_id: input.placeId,
    },
  )
  return mapRedemption(data.data)
}

export async function listRewardRedemptions(userId: string): Promise<RewardRedemption[]> {
  const { data } = await httpClient.get<ApiResponse<RawRewardRedemption[]>>(
    API_ENDPOINTS.rewards.redemptions(userId),
  )
  return Array.isArray(data.data) ? data.data.map(mapRedemption) : []
}

export async function getRewardHistory(userId: string): Promise<RewardRedemption[]> {
  return listRewardRedemptions(userId)
}
