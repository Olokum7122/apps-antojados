import type { AxiosInstance } from 'axios'
import { API_ENDPOINTS } from '@antojados/http/endpoints'
import { apiConfig } from '@antojados/http/config/api'
import type { ApiResponse } from '@antojados/api/types/api'
import type { BizFeedParams, BizFeedScope, BizPostType, FeedComment, FeedItem, FeedRatingVerdict } from '@antojados/api/types/feed'

interface RawBizPost extends Record<string, unknown> {
  biz_post_id?: string
  publisher_user_id?: string
  place_id?: string
  title?: string
  body?: string
  caption?: string
  venue_name?: string
  place_name?: string
  media_url?: string
  media_type?: string
  media_full_url?: unknown
  video_1080_url?: unknown
  likes_count?: number | string
  comments_count?: number | string
  created_at?: string
  post_type?: string
  channel?: string
  comments?: unknown
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function resolveMediaUrl(url: unknown): string | null {
  if (typeof url !== 'string' || !url) return null
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (url.startsWith('/')) {
    const baseUrl = apiConfig.apiUrl
    return baseUrl ? `${baseUrl}${url}` : url
  }
  return url
}

function mapComments(rawComments: unknown): FeedComment[] {
  if (!Array.isArray(rawComments)) {
    return []
  }

  return rawComments
    .map((rawComment, index) => {
      if (!rawComment || typeof rawComment !== 'object') {
        return null
      }

      const candidate = rawComment as Record<string, unknown>
      const id = String(candidate.id || candidate.comment_id || `comment-${index}`)
      const user =
        typeof candidate.user === 'string'
          ? candidate.user
          : typeof candidate.author === 'string'
            ? candidate.author
            : 'usuario'
      const text =
        typeof candidate.text === 'string'
          ? candidate.text
          : typeof candidate.comment === 'string'
            ? candidate.comment
            : typeof candidate.body === 'string'
              ? candidate.body
              : ''

      return text ? { id, user, text } : null
    })
    .filter((comment): comment is FeedComment => Boolean(comment))
}

function toPostTypeLabel(postType: string | null): string | null {
  switch (postType) {
    case 'promo':
      return 'PROMO'
    case 'new_dish':
      return 'PLATILLO'
    case 'discount':
      return 'DESCUENTO'
    case 'general':
      return 'GENERAL'
    case 'event':
      return 'EVENTO'
    default:
      return postType ? postType.toUpperCase() : null
  }
}

function mapBizPost(raw: RawBizPost): FeedItem {
  const id = String(raw.biz_post_id || '')
  if (!id) {
    throw new Error('biz_post_missing_id')
  }

  const mediaUrl = resolveMediaUrl(raw.media_url)
  const mediaFullUrl = resolveMediaUrl(raw.media_full_url)
  const video1080Url = resolveMediaUrl(raw.video_1080_url)
  const postType = typeof raw.post_type === 'string' ? raw.post_type : null
  const caption =
    typeof raw.caption === 'string'
      ? raw.caption
      : typeof raw.body === 'string'
        ? raw.body
        : null

  const ratingVerdicts: FeedRatingVerdict[] = caption ? [{ dim: 'general', phrase: caption }] : []

  return {
    id,
    authorHandle: null,
    author: null,
    userId: null,
    publisherUserId: typeof raw.publisher_user_id === 'string' ? raw.publisher_user_id : null,
    placeId: typeof raw.place_id === 'string' ? raw.place_id : null,
    place_id: typeof raw.place_id === 'string' ? raw.place_id : null,
    caption,
    venueName:
      typeof raw.venue_name === 'string'
        ? raw.venue_name
        : typeof raw.place_name === 'string'
          ? raw.place_name
          : null,
    venue:
      typeof raw.venue_name === 'string'
        ? raw.venue_name
        : typeof raw.place_name === 'string'
          ? raw.place_name
          : null,
    mediaUrl,
    mediaFullUrl,
    video1080Url,
    mediaType: typeof raw.media_type === 'string' ? raw.media_type : null,
    likesCount: toNumber(raw.likes_count, 0),
    commentsCount: toNumber(raw.comments_count, 0),
    createdAt: typeof raw.created_at === 'string' ? raw.created_at : null,
    comments: mapComments(raw.comments),
    title: typeof raw.title === 'string' ? raw.title : null,
    body: typeof raw.body === 'string' ? raw.body : null,
    channel: typeof raw.channel === 'string' ? raw.channel : null,
    postType,
    postTypeLabel: toPostTypeLabel(postType),
    ratingVerdicts,
  }
}

export class BizFeedService {
  constructor(private readonly http: AxiosInstance) {}

  async list(params: BizFeedParams): Promise<FeedItem[]> {
    const response = await this.http.get<ApiResponse<RawBizPost[]>>(API_ENDPOINTS.bizPosts.feed, {
      params: {
        city_code: params.cityCode,
        scope_level: params.scopeLevel,
        scope_code: params.scopeCode ?? undefined,
        post_type: params.postType || undefined,
        limit: params.limit || 20,
        page: params.page || 1,
        user_id: params.userId,
        publisher_user_id: params.publisherUserId,
        biz_post_id: params.postId,
        community_depth: params.communityDepth || undefined,
        feed_scope: params.feedScope,
        lat: params.lat ?? undefined,
        lng: params.lng ?? undefined,
      },
    })

    return Array.isArray(response.data.data) ? response.data.data.map(mapBizPost) : []
  }

  async listByPublisher(
    publisherUserId: string,
    feedScope: BizFeedScope,
    options: {
      postType?: BizPostType | null
      limit?: number
    } = {},
  ): Promise<FeedItem[]> {
    return this.list({
      feedScope,
      publisherUserId,
      postType: options.postType || undefined,
      limit: options.limit || 50,
    })
  }

  async getById(postId: string, feedScope: BizFeedScope, publisherUserId?: string): Promise<FeedItem | null> {
    const items = await this.list({
      feedScope,
      publisherUserId,
      postId,
      limit: 20,
    })

    return items.find((item) => item.id === postId) || items[0] || null
  }

  async listAssociated(
    feedScope: BizFeedScope,
    options: {
      excludeId?: string
      publisherUserId?: string | null
    },
  ): Promise<FeedItem[]> {
    const items = await this.list({
      feedScope,
      publisherUserId: options.publisherUserId || undefined,
      limit: 30,
    })

    return items.filter((item) => item.id !== options.excludeId)
  }
}
