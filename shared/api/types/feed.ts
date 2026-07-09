export type AntojadosFeedScope = 'barrio' | 'pachanga' | 'la-neta' | 'desma'
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
  mediaUrl: string | null
  mediaThumbUrl?: string | null
  // DEBT-038: Variantes de media según Client Consumption Spec §5
  mediaFullUrl?: string | null    // 1920px para fullscreen
  videoUrl?: string | null        // 720p para reproducción en feed
  video1080Url?: string | null    // 1080p para fullscreen
  mediaGallery?: string[]
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
  // Campos del feed gateway (feed.md §11.6)
  viewsCount?: number
  sharesCount?: number
  engagementScore?: number
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

