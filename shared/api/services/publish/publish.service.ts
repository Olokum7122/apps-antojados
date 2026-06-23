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
  const { data } = await httpClient.post<SocialPostCreateResult>(
    API_ENDPOINTS.socialPosts.create,
    input,
  )
  return data
}
