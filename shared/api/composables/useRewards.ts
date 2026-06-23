import { rewardsService } from '@antojados/api/services'

export function useRewards() {
  return {
    listRewards: rewardsService.listRewards,
    listRewardCampaigns: rewardsService.listRewardCampaigns,
    checkRewardEligibility: rewardsService.checkRewardEligibility,
    redeemReward: rewardsService.redeemReward,
    listRewardRedemptions: rewardsService.listRewardRedemptions,
    getRewardHistory: rewardsService.getRewardHistory,
  }
}
