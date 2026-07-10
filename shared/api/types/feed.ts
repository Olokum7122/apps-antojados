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

/**
 * FeedItem — modelo unificado para el frontend.
 *
 * Viene del feed gateway (feed.md §11.6).
 * biz_posts: los campos se mapean desde doc_json:
 *   doc_json.badge        → postTypeLabel (PROMO, PLATILLO, DESCUENTO, EVENTO)
 *   doc_json.price        → price
 *   doc_json.descripciones → caption, title (primer elemento)
 *   media_url + media[]   → mediaUrl, mediaGallery (thumb/feed/full)
 */
export interface FeedItem {
  id: string
  channel: string | null
  mediaUrl: string | null
  mediaThumbUrl?: string | null
  mediaFullUrl?: string | null
  videoUrl?: string | null
  video1080Url?: string | null
  mediaGallery?: string[]
  mediaType: string | null

  // De doc_json:
  postTypeLabel: string | null   // badge → PROMO, PLATILLO, etc.
  caption: string | null         // descripciones[0]
  title: string | null           // descripciones[0] (alias)
  price: string | null           // doc_json.price
  descripciones?: string[]       // doc_json.descripciones

  likesCount: number
  commentsCount: number
  viewsCount: number
  sharesCount: number
  engagementScore: number
  createdAt: string | null
  durationSec?: number

  hasLiked?: boolean
  comments?: FeedComment[]
  ratingVerdicts?: FeedRatingVerdict[]
  ownerId?: string | null
}

export interface FeedListParams {
  page?: number
  limit?: number
  userId?: string
  postId?: string
  scope?: AntojadosFeedScope | AntojoFeedScope
}

export interface BizFeedParams {
  page?: number
  limit?: number
  userId?: string
  postId?: string
  feedScope: BizFeedScope
  ownerId?: string             // sponsor_id para filtrar por negocio
  cityCode?: string            // city_code para filtro geo (scope_level='ciudad')
  zoneCode?: string            // zone_code para filtro geo (scope_level='zona')
  scopeLevel?: string          // scope_level para filtro geo
  lat?: number | null
  lng?: number | null
}

export interface SocialSyncEvent {
  eventType: string
  userId: string
  postId?: string | null
  targetUserId?: string | null
  scopeLevel?: string | null
  scopeCode?: string | null
  cityCode?: string | null
  feedScope?: string | null
}
