import { httpClient } from '../../../http/client'
import { API_ENDPOINTS } from '../../../http/endpoints'
import { normalizeMediaUrl } from '../../../http/config/normalize-media-url'
import type { ApiResponse } from '../../types/api'
import type {
  AntojoFeedScope,
  AntojadosFeedScope,
  FeedListParams,
  FeedComment,
  FeedItem,
  FeedRatingVerdict,
} from '../../types/feed'

interface RawFeedItem extends Record<string, unknown> {
  id?: string
  post_id?: string
  author_handle?: string
  author?: string
  user_id?: string
  publisher_user_id?: string
  place_id?: string
  caption?: string
  description?: string
  venue_name?: string
  venue?: string
  media_url?: string
  media_thumbnail_url?: string
  media_full_url?: string
  media_type?: string
  video_720_url?: string
  video_1080_url?: string
  likes_count?: number | string
  comments_count?: number | string
  created_at?: string
  published_at?: string
  duration_sec?: number | string
  title?: string
  body?: string
  channel?: string
  moment_tag?: string
  feed_type?: string
  event_group_id?: string
  post_type?: string
  post_type_label?: string
  media_gallery?: unknown
  comments?: unknown
  rating_verdicts?: unknown
}

function normalizeFeedType(value: unknown): string {
  return String(value || '')
    .trim()
    .toLowerCase()
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function buildImageFeedThumb(url: string | null): string | null {
  if (!url) return null

  try {
    const parsed = new URL(url)
    const host = parsed.hostname.toLowerCase()
    if (host.includes('images.pexels.com')) {
      parsed.searchParams.set('auto', 'compress')
      parsed.searchParams.set('cs', 'tinysrgb')
      parsed.searchParams.set('w', '720')
      parsed.searchParams.set('h', '960')
      parsed.searchParams.set('fit', 'crop')
      parsed.searchParams.set('dpr', '1')
      return parsed.toString()
    }
  } catch {
    return url
  }

  return url
}

function normalizeMediaType(rawType: unknown): string | null {
  const value = String(rawType || '')
    .trim()
    .toLowerCase()

  if (!value) return null
  if (value === 'photo' || value.startsWith('image/')) return 'image'
  if (value === 'video' || value.startsWith('video/')) return 'video'
  return value
}

function mapMediaGallery(rawGallery: unknown, fallbackMediaUrl: string | null): string[] {
  if (Array.isArray(rawGallery)) {
    const mediaItems = rawGallery
      .map((item) => {
        if (typeof item === 'string') {
          return normalizeMediaUrl(item)
        }

        if (item && typeof item === 'object') {
          const candidate = item as Record<string, unknown>
          if (typeof candidate.media_url === 'string') {
            return normalizeMediaUrl(candidate.media_url)
          }
          if (typeof candidate.url === 'string') {
            return normalizeMediaUrl(candidate.url)
          }
        }

        return null
      })
      .filter((item): item is string => Boolean(item))

    if (mediaItems.length > 0) {
      return mediaItems
    }
  }

  return fallbackMediaUrl ? [fallbackMediaUrl] : []
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
            : typeof candidate.author_handle === 'string'
              ? candidate.author_handle
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

function mapRatingVerdicts(rawVerdicts: unknown, fallbackCaption: string | null): FeedRatingVerdict[] {
  if (Array.isArray(rawVerdicts)) {
    return rawVerdicts
      .map((rawVerdict) => {
        if (!rawVerdict || typeof rawVerdict !== 'object') {
          return null
        }

        const candidate = rawVerdict as Record<string, unknown>
        const dim = typeof candidate.dim === 'string' ? candidate.dim : 'general'
        const phrase =
          typeof candidate.phrase === 'string'
            ? candidate.phrase
            : typeof candidate.label === 'string'
              ? candidate.label
              : ''

        return phrase ? { dim, phrase } : null
      })
      .filter((verdict): verdict is FeedRatingVerdict => Boolean(verdict))
  }

  return fallbackCaption ? [{ dim: 'general', phrase: fallbackCaption }] : []
}

function mapFeedItem(raw: RawFeedItem): FeedItem {
  const id = String(raw.id || raw.post_id || '')
  if (!id) {
    throw new Error('feed_item_missing_id')
  }

  const caption =
    typeof raw.caption === 'string'
      ? raw.caption
      : typeof raw.description === 'string'
        ? raw.description
        : null
  const mediaUrl = normalizeMediaUrl(raw.media_url)
  const mediaType = normalizeMediaType(raw.media_type)
  const mediaThumbUrl =
    normalizeMediaUrl(raw.media_thumbnail_url) ||
    (mediaType === 'video' ? mediaUrl : buildImageFeedThumb(mediaUrl))

  return {
    id,
    authorHandle: typeof raw.author_handle === 'string' ? raw.author_handle : null,
    author: typeof raw.author === 'string' ? raw.author : null,
    userId: typeof raw.user_id === 'string' ? raw.user_id : null,
    publisherUserId: typeof raw.publisher_user_id === 'string' ? raw.publisher_user_id : null,
    placeId: typeof raw.place_id === 'string' ? raw.place_id : null,
    place_id: typeof raw.place_id === 'string' ? raw.place_id : null,
    caption,
    venueName:
      typeof raw.venue_name === 'string'
        ? raw.venue_name
        : typeof raw.venue === 'string'
          ? raw.venue
          : null,
    venue: typeof raw.venue === 'string' ? raw.venue : null,
    mediaUrl,
    mediaThumbUrl,
    mediaFullUrl: normalizeMediaUrl(raw.media_full_url) || null,
    videoUrl: normalizeMediaUrl(raw.video_720_url) || null,
    video1080Url: normalizeMediaUrl(raw.video_1080_url) || null,
    mediaGallery: mapMediaGallery(raw.media_gallery, mediaUrl),
    mediaType,
    likesCount: toNumber(raw.likes_count, 0),
    commentsCount: toNumber(raw.comments_count, 0),
    createdAt:
      typeof raw.created_at === 'string'
        ? raw.created_at
        : typeof raw.published_at === 'string'
          ? raw.published_at
          : null,
    durationSec: toNumber(raw.duration_sec, 15),
    comments: mapComments(raw.comments),
    momentTag: typeof raw.moment_tag === 'string' ? raw.moment_tag : null,
    body: typeof raw.body === 'string' ? raw.body : null,
    title: typeof raw.title === 'string' ? raw.title : null,
    channel: typeof raw.channel === 'string' ? raw.channel : null,
    postType: typeof raw.post_type === 'string' ? raw.post_type : null,
    postTypeLabel: typeof raw.post_type_label === 'string' ? raw.post_type_label : null,
    feedType: typeof raw.feed_type === 'string' ? raw.feed_type : null,
    eventGroupId: typeof raw.event_group_id === 'string' ? raw.event_group_id : null,
    ratingVerdicts: mapRatingVerdicts(raw.rating_verdicts, caption),
  }
}

function matchesScope(item: FeedItem, scope: AntojadosFeedScope | AntojoFeedScope): boolean {
  const feedType = normalizeFeedType(item.feedType)
  const mediaType = normalizeFeedType(item.mediaType)

  if (scope === 'la-neta') {
    return ['neta', 'la-neta', 'la_neta'].includes(feedType) && mediaType !== 'video'
  }

  if (scope === 'pachanga') {
    return ['pachanga', 'momentos'].includes(feedType)
  }

  if (scope === 'desma') {
    return feedType === 'desma' && mediaType === 'video'
  }

  if (scope === 'barrio') {
    return feedType === 'barrio' && Boolean(item.mediaUrl || item.mediaThumbUrl)
  }

  // No permitir posts sin clasificar en ningún scope
  return false
}

export class SocialFeedService {
  constructor(private readonly http = httpClient) {}

  async list(params: FeedListParams): Promise<FeedItem[]> {
    console.log(`[TRACE:socialFeed.list] scope=${params.scope}, userId=${params.userId}, postId=${params.postId}`)
    const response = await this.http.get<ApiResponse<RawFeedItem[]>>(API_ENDPOINTS.socialPosts.feed, {
      params: {
        page: params.page || 1,
        limit: params.limit || 20,
        city_code: params.cityCode,
        scope_level: params.scopeLevel,
        scope_code: params.scopeCode ?? undefined,
        user_id: params.userId,
        publisher_user_id: params.publisherUserId,
        post_id: params.postId,
        feed_type: params.scope || undefined,
      },
    })

    const rawItems = Array.isArray(response.data.data) ? response.data.data : []
    // Validar canal: solo posts cuyo channel coincida con el scope solicitado
    const filtered = rawItems.filter((raw) => {
      const sourceChannel = raw.channel || raw.feed_type || null
      const requestedChannel = params.scope || null
      if (requestedChannel && sourceChannel && sourceChannel !== requestedChannel) {
        console.warn(`[TRACE:socialFeed.list] channel mismatch: requested=${requestedChannel}, source=${sourceChannel}, postId=${raw.id || raw.post_id}`)
        return false
      }
      return true
    })
    console.log(`[TRACE:socialFeed.list] raw=${rawItems.length}, after channel filter=${filtered.length}`)
    return filtered.map(mapFeedItem)
  }

  async getById(postId: string, scope: AntojadosFeedScope | AntojoFeedScope): Promise<FeedItem | null> {
    const { data } = await this.http.get<RawFeedItem>(API_ENDPOINTS.socialPosts.detail(postId))
    const item = mapFeedItem(data)
    return matchesScope(item, scope) ? item : null
  }

  async delete(postId: string, userId: string, force = false): Promise<void> {
    await this.http.delete(API_ENDPOINTS.socialPosts.detail(postId), {
      data: {
        user_id: userId,
        force,
      },
    })
  }

  async listByUser(userId: string, scope: AntojadosFeedScope | AntojoFeedScope): Promise<FeedItem[]> {
    const response = await this.list({
      scope,
      userId,
      limit: 50,
    })

    return response.filter((item) => matchesScope(item, scope))
  }

  async listAssociated(
    scope: AntojadosFeedScope | AntojoFeedScope,
    options: {
      excludeId?: string
      eventGroupId?: string | null
      placeId?: string | null
      userId?: string | null
      publisherUserId?: string | null
    },
  ): Promise<FeedItem[]> {
    const response = await this.list({
      scope,
      userId: options.userId || undefined,
      publisherUserId: options.publisherUserId || undefined,
      limit: 20,
    })

    return response.filter((item) => {
      if (!matchesScope(item, scope)) {
        return false
      }

      if (options.excludeId && item.id === options.excludeId) {
        return false
      }

      if (options.eventGroupId) {
        return item.eventGroupId === options.eventGroupId
      }

      if (options.placeId) {
        return item.placeId === options.placeId || item.place_id === options.placeId
      }

      if (options.userId) {
        return item.userId === options.userId
      }

      if (options.publisherUserId) {
        return item.publisherUserId === options.publisherUserId
      }

      return true
    })
  }
}