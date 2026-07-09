import { httpClient } from '../../../http/client'
import { API_ENDPOINTS } from '../../../http/endpoints'
import { normalizeMediaUrl } from '../../../http/config/normalize-media-url'
import type { BizFeedParams, BizFeedScope, BizPostType, FeedComment, FeedItem, FeedRatingVerdict } from '../../types/feed'

// ─── Interfaz RAW del feed gateway (feed.md §11.6) ─────
interface RawFeedPost {
  id: string
  type: 'biz' | 'soc'
  channel: string
  owner_id: string
  media_url: string | null
  doc_json: string | Record<string, unknown> | null
  views_count: number
  likes_count: number
  comments_count: number
  shares_count: number
  engagement_score: number
  status: string
  created_at: string
  cta_clicks_count?: number
  taps_whatsapp_count?: number
  taps_maps_count?: number
  has_liked?: boolean
  media?: Array<{
    media_id: string
    media_type: string
    media_url: string
    sort_order: number
    thumb_url: string | null
    feed_url: string | null
    full_url: string | null
    asset_id: string | null
  }>
  author?: {
    user_id: string
    display_name: string | null
    avatar_url: string | null
  }
}

interface RawFeedResponse {
  data: RawFeedPost[]
  cursor: { next: string | null; prev: string | null }
  meta: {
    scope_level: string
    city_code: string | null
    feed_scope: string
    has_more: boolean
    geo_filter_applied: boolean
  }
}

function parseDocJson(raw: unknown): Record<string, unknown> | null {
  if (!raw) return null
  if (typeof raw === 'object') return raw as Record<string, unknown>
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) } catch { return null }
  }
  return null
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function toPostTypeLabel(postType: string | null): string | null {
  switch (postType) {
    case 'promo': return 'PROMO'
    case 'new_dish': return 'PLATILLO'
    case 'discount': return 'DESCUENTO'
    case 'general': return 'GENERAL'
    case 'event': return 'EVENTO'
    default: return postType ? postType.toUpperCase() : null
  }
}

/**
 * Extrae post_type del doc_json según feed.md §7.
 * doc_json contiene: { badge, price, descripciones[] }
 * badge es el label visual (PROMO, PLATILLO, DESCUENTO, GENERAL, EVENTO)
 */
function extractPostType(docJson: Record<string, unknown> | null): string | null {
  if (!docJson) return null
  const badge = String(docJson.badge || '').toLowerCase()
  if (!badge) return null
  const map: Record<string, string> = {
    promo: 'promo', platillo: 'new_dish', descuento: 'discount',
    general: 'general', evento: 'event', oferta: 'promo',
  }
  return map[badge] || badge
}

function extractTitle(docJson: Record<string, unknown> | null): string | null {
  if (!docJson) return null
  const desc = docJson.descripciones
  if (Array.isArray(desc) && desc.length > 0) return String(desc[0])
  return null
}

/**
 * Mapea un post del feed gateway (feed.md §11.6) a FeedItem.
 */
function mapBizPost(raw: RawFeedPost): FeedItem {
  const id = String(raw.id || '')
  if (!id) throw new Error('biz_post_missing_id')

  const mediaUrl = normalizeMediaUrl(raw.media_url)
  const docJson = parseDocJson(raw.doc_json)
  const postType = extractPostType(docJson)
  const title = extractTitle(docJson)
  const caption = title

  // Construir mediaGallery desde raw.media[] (feed.md §11.6)
  const mediaGallery: string[] = []
  if (Array.isArray(raw.media) && raw.media.length > 0) {
    raw.media.forEach((m) => {
      const url = m.feed_url || m.media_url
      if (url) mediaGallery.push(normalizeMediaUrl(url))
    })
  }
  if (mediaGallery.length === 0 && mediaUrl) {
    mediaGallery.push(mediaUrl)
  }

  const ratingVerdicts: FeedRatingVerdict[] = caption
    ? [{ dim: 'general', phrase: caption }]
    : []

  return {
    id,
    publisherUserId: raw.owner_id || null,
    channel: raw.channel || null,
    mediaUrl,
    mediaGallery: mediaGallery.length > 0 ? mediaGallery : undefined,
    likesCount: toNumber(raw.likes_count, 0),
    commentsCount: toNumber(raw.comments_count, 0),
    createdAt: raw.created_at || null,
    title,
    caption,
    postType,
    postTypeLabel: toPostTypeLabel(postType),
    ratingVerdicts,
    // defaults
    authorHandle: null,
    author: null,
    userId: null,
    placeId: null,
    place_id: null,
    venueName: null,
    venue: null,
    mediaType: null,
    comments: [],
    body: null,
    viewsCount: toNumber(raw.views_count, 0),
    sharesCount: toNumber(raw.shares_count, 0),
    engagementScore: toNumber(raw.engagement_score, 0),
  }
}

export class BizFeedService {
  constructor(private readonly http = httpClient) {}

  async list(params: BizFeedParams): Promise<FeedItem[]> {
    console.log('[TRACE biz-feed] list() LLAMADO params:', JSON.stringify(params))
    console.log('[TRACE biz-feed] URL endpoint:', API_ENDPOINTS.bizPosts.feed)

    // Solo pasar publisher_user_id si tiene valor (evitar filtro vacío que mata resultados)
    const publisherId = params.publisherUserId?.trim() || undefined
    const postId = params.postId?.trim() || undefined
    const cityCode = params.cityCode?.trim() || undefined
    const scopeLevel = params.scopeLevel?.trim() || undefined

    const response = await this.http.get<RawFeedResponse>(API_ENDPOINTS.bizPosts.feed, {
      params: {
        city_code: cityCode,
        scope_level: scopeLevel,
        post_type: params.postType || undefined,
        limit: params.limit || 20,
        user_id: params.userId?.trim() || undefined,
        publisher_user_id: publisherId,
        biz_post_id: postId,
        feed_scope: params.feedScope,
        lat: params.lat ?? undefined,
        lng: params.lng ?? undefined,
      },
    })

    console.log('[TRACE biz-feed] RESPUESTA status:', response.status)
    // El feedRouter devuelve { data: [...], cursor: {...}, meta: {...} } directamente
    const feedData = response.data
    if (!feedData || !Array.isArray(feedData.data)) {
      console.log('[TRACE biz-feed] feedData.data NO es array')
      return []
    }
    return feedData.data.map(mapBizPost)
  }

  async listByPublisher(
    publisherUserId: string,
    feedScope: BizFeedScope,
    options: { postType?: BizPostType | null; limit?: number } = {},
  ): Promise<FeedItem[]> {
    return this.list({
      feedScope,
      publisherUserId,
      postType: options.postType || undefined,
      limit: options.limit || 50,
    })
  }

  async getById(postId: string, feedScope: BizFeedScope, publisherUserId?: string): Promise<FeedItem | null> {
    const items = await this.list({ feedScope, publisherUserId, postId, limit: 20 })
    return items.find((item) => item.id === postId) || items[0] || null
  }

  async listAssociated(
    feedScope: BizFeedScope,
    options: { excludeId?: string; publisherUserId?: string | null },
  ): Promise<FeedItem[]> {
    const items = await this.list({
      feedScope,
      publisherUserId: options.publisherUserId || undefined,
      limit: 30,
    })
    return items.filter((item) => item.id !== options.excludeId)
  }
}