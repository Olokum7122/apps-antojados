import { httpClient } from '../../../http/client'
import { API_ENDPOINTS } from '../../../http/endpoints'
import type {
  BizPostCreateInput,
  BizPostCreateResult,
  SocialPostCreateInput,
  SocialPostCreateResult,
} from '../../types/publish'

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
  // DEBT-039: Enviar solo media_intake_id (NO media_url directo).
  // El Gateway resuelve la URL final via resolvePostMediaFromIntake().
  // DEBT-040: venue_name se pasa tal cual del input; si es null/empty el Gateway lo resuelve.
  const { data } = await httpClient.post<SocialPostCreateResult>(
    API_ENDPOINTS.socialPosts.create,
    {
      post_id: postId,
      user_id: input.user_id,
      venue_name: input.venue_name || null,
      description,
      caption: input.caption || description,
      media_url: null, // Gateway resuelve desde media_intake_id
      media_thumbnail_url: null, // Gateway resuelve desde media_intake_id
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

