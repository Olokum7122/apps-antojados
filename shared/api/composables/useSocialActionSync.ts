import { useAuth } from '@antojados/api/composables/useAuth'
import { socialActionsService } from '@antojados/api/services'

export function useSocialActionSync() {
  const { profile, hydrateSession, fetchProfile } = useAuth()

  async function ensureUserId(): Promise<string | null> {
    if (profile.value?.id) return String(profile.value.id)
    await hydrateSession()
    try {
      await fetchProfile()
    } catch {
      return null
    }
    return profile.value?.id ? String(profile.value.id) : null
  }

  async function pushEvent(event: {
    eventType: string
    postId?: string | null
    targetUserId?: string | null
    scopeLevel?: string | null
    scopeCode?: string | null
    cityCode?: string | null
    feedScope?: string | null
  }): Promise<boolean> {
    const userId = await ensureUserId()
    if (!userId) return false

    try {
      await socialActionsService.syncEvents([
        {
          userId,
          eventType: event.eventType,
          postId: event.postId,
          targetUserId: event.targetUserId,
          scopeLevel: event.scopeLevel,
          scopeCode: event.scopeCode,
          cityCode: event.cityCode,
          feedScope: event.feedScope,
        },
      ])
      return true
    } catch {
      return false
    }
  }

  return {
    pushEvent,
  }
}

