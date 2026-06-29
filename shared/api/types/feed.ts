export type AntojadosFeedScope = 'barrio' | 'pachanga' | 'que-pex' | 'desma'
export type AntojoFeedScope = 'vas-ir' | 'arre'
export type BizFeedScope = 'vas_ir' | 'arre'
export type BizPostType = 'promo' | 'new_dish' | 'discount' | 'general' | 'event'

export interface FeedComment {
  id: string
  user: string
  text: string
}

export interface FeedRatingVerdict {
  dim: string
  phrase: string
}

export interface FeedItem {
  id: string
  authorHandle: string | null
  author?: string | null
  userId?: string | null
  publisherUserId?: string | null
  placeId?: string | null
  place_id?: string | null
  caption: string | null
  venueName: string | null
  venue?: string | null
  /** URL para S2 (feed card, 1080px WebP). Mapeado desde feed_url del engine. */
  mediaUrl: string | null
  /** URL para S1 (thumbnail grid, 400px WebP). Mapeado desde thumb_url del engine. */
  mediaThumbUrl?: string | null
  /** URL para S3 (fullscreen, 1920px WebP). Mapeado desde full_url del engine. */
  mediaFullUrl?: string | null
  /** URL para video 1080p (fullscreen). Mapeado desde video_1080_url del engine. */
  video1080Url?: string | null
  mediaType: string | null
  likesCount: number
  commentsCount: number
  createdAt: string | null
  durationSec?: number
  comments?: FeedComment[]
  momentTag?: string | null
  body?: string | null
  title?: string | null
  channel?: string | null
  postType?: string | null
  postTypeLabel?: string | null
  feedType?: string | null
  eventGroupId?: string | null
  ratingVerdicts?: FeedRatingVerdict[]
}

export interface FeedListParams {
  page?: number
  limit?: number
  cityCode?: string
  scopeLevel?: string
  scopeCode?: string | null
  userId?: string
  publisherUserId?: string
  postId?: string
  scope?: AntojadosFeedScope | AntojoFeedScope
}

export interface BizFeedParams {
  cityCode?: string
  scopeLevel?: string
  scopeCode?: string | null
  postType?: BizPostType | null
  page?: number
  limit?: number
  userId?: string
  publisherUserId?: string
  postId?: string
  communityDepth?: number | null
  feedScope: BizFeedScope
  lat?: number | null
  lng?: number | null
}

export interface SocialSyncEvent {
  eventType: string
  userId: string
  postId?: string | null
  placeId?: string | null
  publisherUserId?: string | null
  targetUserId?: string | null
  scopeLevel?: string | null
  scopeCode?: string | null
  cityCode?: string | null
  feedScope?: string | null
  channel?: string | null
  payload?: Record<string, unknown>
}

