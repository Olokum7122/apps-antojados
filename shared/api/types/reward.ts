export interface Reward {
  rewardId: string
  campaignId?: string | null
  title: string
  description?: string | null
  pointsCost?: number | null
  sponsorId?: string | null
  placeId?: string | null
  startsAt?: string | null
  endsAt?: string | null
  status?: string | null
}

export interface RewardRedemption {
  redemptionId: string
  rewardId: string
  userId: string
  code?: string | null
  redeemedAt?: string | null
  status?: string | null
}

export interface RewardEligibilityQuery {
  userId: string
  rewardId?: string
  campaignId?: string
  placeId?: string
}

export interface RewardEligibility {
  eligible: boolean
  reason?: string | null
  pointsBalance?: number | null
  pointsRequired?: number | null
}

export interface RewardRedeemInput {
  userId?: string
  campaignId?: string
  postId?: string
  placeId?: string
}
