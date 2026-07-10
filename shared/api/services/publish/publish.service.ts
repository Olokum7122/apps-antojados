import { httpClient } from '../../../http/client'
import { API_ENDPOINTS } from '../../../http/endpoints'
import type {
  BizPostCreateInput,
  BizPostCreateResult,
  SocialPostCreateInput,
  SocialPostCreateResult,
} from '../../types/publish'

export async function createBizPost(input: BizPostCreateInput): Promise<BizPostCreateResult> {
  const { data } = await httpClient.post<BizPostCreateResult>(
    API_ENDPOINTS.bizPosts.create,
    {
      sponsor_id: input.sponsor_id,
      channel: input.channel,
      feed_type: input.feed_type || null,
      media_url: input.media_url || null,
      doc_json: input.doc_json || null,
      city_code: input.city_code || null,
      zone_code: input.zone_code || null,
    },
  )
  return data
}

export async function createSocialPost(
  input: SocialPostCreateInput,
): Promise<SocialPostCreateResult> {
  const { data } = await httpClient.post<SocialPostCreateResult>(
    API_ENDPOINTS.socialPosts.create,
    {
      user_id: input.user_id,
      channel: input.channel,
      feed_type: input.feed_type || null,
      media_url: input.media_url || null,
      doc_json: input.doc_json || null,
      city_code: input.city_code || null,
      zone_code: input.zone_code || null,
    },
  )
  return data
}

