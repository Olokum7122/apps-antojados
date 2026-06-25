import { httpClient } from '@antojados/http/client'
import { API_ENDPOINTS } from '@antojados/http/endpoints'
import type {
  BizPostCreateInput,
  BizPostCreateResult,
  SocialPostCreateInput,
  SocialPostCreateResult,
} from '@antojados/api/types/publish'

export async function createBizPost(input: BizPostCreateInput): Promise<BizPostCreateResult> {
  const { data } = await httpClient.post<BizPostCreateResult>(API_ENDPOINTS.bizPosts.create, input)
  return data
}

export async function createSocialPost(
  input: SocialPostCreateInput,
): Promise<SocialPostCreateResult> {
  const postId = input.post_id || `post-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  const feedType =
    input.feed_scope === 'la-neta'
      ? 'neta'
      : input.feed_scope === 'barrio'
        ? 'momentos'
        : input.feed_scope
  const description = input.description || input.caption || ''
  const venueName = input.venue_name || (input.feed_scope === 'desma' ? 'En el Desma' : 'Sin ubicacion')
  const { data } = await httpClient.post<SocialPostCreateResult>(
    API_ENDPOINTS.socialPosts.create,
    {
      post_id: postId,
      user_id: input.user_id,
      venue_name: venueName,
      description,
      caption: input.caption || description,
      media_url: input.media_url || null,
      media_thumbnail_url: input.media_thumbnail_url || null,
      media_type: input.media_type,
      media_intake_id: input.media_intake_id || null,
      feed_type: feedType,
      city_code: input.city_code || null,
      scope_level: input.scope_level || null,
      scope_code: input.scope_code || null,
    },
  )
  return data
}
