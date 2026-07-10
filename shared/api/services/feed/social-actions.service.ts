import { API_ENDPOINTS } from '@antojados/http/endpoints'
import type { SocialSyncEvent } from '@antojados/api/types/feed'

export class SocialActionsService {
  constructor(private readonly http: import('axios').AxiosInstance) {}

  async syncEvents(events: SocialSyncEvent[]): Promise<void> {
    if (!Array.isArray(events) || events.length === 0) return

    const primaryUserId = events[0]?.userId || undefined

    await this.http.post(API_ENDPOINTS.socialPosts.syncEvents, {
      user_id: primaryUserId,
      events: events.map((event) => ({
        event_type: event.eventType,
        user_id: event.userId,
        event_ts: new Date().toISOString(),
        post_id: event.postId || undefined,
        target_user_id: event.targetUserId || undefined,
      })),
    })
  }
}

