import { computed } from 'vue'
import { httpClient } from '@antojados/http/client'
import {
  authService,
  rankingsService,
  rewardsService,
  sponsorsService,
  usersService,
} from '@antojados/api/services'

export function useApi() {
  return {
    api: httpClient,
    auth: authService,
    users: usersService,
    sponsors: sponsorsService,
    rankings: rankingsService,
    rewards: rewardsService,
    isReady: computed(() => Boolean(httpClient)),
  }
}
