/**
 * Document Package Service V2 — Obtiene packages desde Explorer API vía Gateway proxy.
 *
 * ═══════════════════════════════════════════════════════════════
 * CONTRATO: Único dominio permitido: https://api.antojadosmx.mx
 * El frontend NUNCA hace llamados directos a IP/puerto/HTTP.
 * El Gateway redirige /api/v1/explorer/* al Explorer API (puerto 4101).
 * ═══════════════════════════════════════════════════════════════
 */

import { httpClient } from '@antojados/http/client'
import type {
  SponsorPost,
  DocumentPackage,
  PackageType,
  Channel,
  FeedType,
  ContentType,
  PostComposition,
} from '@antojados/api/types/document-package'

// Explorer API base path (a través del Gateway proxy)
const EXPLORER_API_BASE = '/api/v1/explorer'

interface ContentRaw {
  id_post?: string
  content_type?: string
  id_sponsor?: string | null
  id_user?: string | null
  feed_type?: string
  channel?: string
  package_type?: string
  template_code?: string | null
  payload_json?: string | null
  published_at?: string | null
  idPost?: string
  contentType?: string
  idSponsor?: string | null
  idUser?: string | null
  feedType?: string
  packageType?: string
  templateCode?: string | null
  payload?: Record<string, unknown> | string | null
  publishedAt?: string | null
}

interface GetFeedParams {
  channel: Channel
  sponsorId?: string
  feedType?: string
  scopeLevel?: string
  scopeCode?: string
  page?: number
  limit?: number
}

interface GetFeedResponse {
  ok?: boolean
  data?: SponsorPost[] | ContentRaw[]
  items?: SponsorPost[] | ContentRaw[]
  contents?: ContentRaw[]
  total?: number
}

function mapContentToSponsorPost(raw: ContentRaw): SponsorPost | null {
  if (!raw) return null

  const idPost = raw.id_post || raw.idPost || ''
  if (!idPost) return null

  let payload: Record<string, unknown> = {}
  const rawPayload = raw.payload_json || raw.payload
  if (typeof rawPayload === 'string') {
    try { payload = JSON.parse(rawPayload) } catch { payload = {} }
  } else if (typeof rawPayload === 'object' && rawPayload !== null) {
    payload = rawPayload as Record<string, unknown>
  }

  let composicion = (payload.composicion || payload.composition) as unknown as PostComposition | undefined

  // ── Opción B: Poblar mediaUrls faltantes en blocks desde mediaItems ──
  // Cuando un block de tipo image/video no tiene mediaUrls (típico en user posts),
  // se intenta resolver la URL desde los mediaItems del payload.
  // Si no hay mediaItems, se cae a mediaUrls del DocumentPackage como fallback.
  const payloadMediaItems = Array.isArray(payload.mediaItems) ? payload.mediaItems as Array<{ mediaAssetId: string; mediaType: string; thumbUrl?: string; feedUrl?: string; fullUrl?: string }> : []
  const docMediaUrls = (payload.mediaUrls as DocumentPackage['mediaUrls']) || null

  if (composicion?.blocks && composicion.blocks.length > 0) {
    composicion = {
      ...composicion,
      blocks: composicion.blocks.map((block, idx) => {
        if ((block.elementType === 'image' || block.elementType === 'video') && !block.mediaUrls) {
          // Intentar desde mediaItems por índice
          const mediaItem = payloadMediaItems[idx]
          if (mediaItem) {
            return {
              ...block,
              mediaUrls: {
                thumbUrl: mediaItem.thumbUrl || null,
                feedUrl: mediaItem.feedUrl || null,
                fullUrl: mediaItem.fullUrl || null,
                mediaAssetId: mediaItem.mediaAssetId || null,
              },
            }
          }
          // Fallback: mediaUrls del DocumentPackage
          if (docMediaUrls) {
            return {
              ...block,
              mediaUrls: docMediaUrls,
            }
          }
        }
        return block
      }),
    }
  }

  const feedType = (raw.feed_type || raw.feedType || null) as FeedType | null
  const contentType = (raw.content_type || raw.contentType || null) as ContentType | null
  // No fallback sponsor — si la API no entrega channel, el post se descarta
  const rawChannel = raw.channel as Channel | undefined
  if (!rawChannel) return null
  const isSponsor = feedType === 'general' || feedType === 'publicity'
  const idSponsor = raw.id_sponsor || raw.idSponsor || null
  const idUser = raw.id_user || raw.idUser || null

  const docPackage: DocumentPackage = {
    documentCode: String(payload.document_code || `doc-${idPost}`),
    schemaVersion: String(payload.schema_version || '1.0'),
    projectId: String(payload.project_id || '') || null,
    title: String(payload.title || '') || '',
    packageType: (raw.package_type || raw.packageType || 'defaultpackage') as PackageType,
    contentType: contentType,
    idPost: idPost,
    idSponsor: idSponsor,
    idUser: idUser,
    channel: rawChannel,
    feedType: feedType,
    composicion: composicion || { tipoPost: '', tipoContent: '', efectoGlobal: 'retro', blocks: [] },
    mediaAssetId: String(payload.media_asset_id || '') || null,
    mediaUrls: (payload.mediaUrls as DocumentPackage['mediaUrls']) || null,
    templateCode: raw.template_code || raw.templateCode || String(payload.template_code || '') || null,
    bodyStyleCode: String(payload.body_style_code || '') || null,
    mediaLookCode: String(payload.media_look_code || '') || null,
    effects: Array.isArray(payload.effects) ? payload.effects as string[] : [],
    creatorId: String(payload.creator_id || '') || null,
    sourceApp: (payload.source_app === 'antojados' ? 'antojados' : 'explorer'),
    authorHandle: String(payload.author_handle || '') || null,
    sponsorId: idSponsor,
    createdAt: raw.published_at || raw.publishedAt || String(payload.published_at || '') || null,
    mediaItems: Array.isArray(payload.mediaItems) ? payload.mediaItems as DocumentPackage['mediaItems'] : [],
  }

  return {
    id: idPost,
    documentPackage: docPackage,
    publisherUserId: isSponsor ? (idSponsor || '') : (idUser || ''),
    placeId: String(payload.place_id || '') || null,
    venueName: String(payload.venue_name || payload.title || '') || null,
    businessName: String(payload.business_name || '') || null,
    channel: rawChannel,
    feedType: feedType,
    contentType: contentType,
    createdAt: raw.published_at || raw.publishedAt || null,
  }
}

export class DocumentPackageService {
  constructor(private readonly http = httpClient) {}

  async getByChannel(params: GetFeedParams): Promise<SponsorPost[]> {
    console.log(`[TRACE:getByChannel] channel=${params.channel}, feedType=${params.feedType}, scopeLevel=${params.scopeLevel}, scopeCode=${params.scopeCode}, page=${params.page}, limit=${params.limit}`)
    const response = await this.http.get<GetFeedResponse>(
      `${EXPLORER_API_BASE}/contents/by-channel/${params.channel}`,
      {
        params: {
          feed_type: params.feedType || undefined,
          scope_level: params.scopeLevel || undefined,
          scope_code: params.scopeCode || undefined,
          page: params.page || 1,
          page_size: params.limit || 20,
        },
      },
    )

    console.log(`[TRACE:getByChannel] raw response data type=${typeof response.data}, isArray=${Array.isArray(response.data)}`, response.data ? `keys=${Object.keys(response.data as object).join(',')}` : 'null')
    
    const raw = this._extractAndMap(response.data)
    // Filtrar por canal: solo posts que coincidan exactamente con el canal solicitado
    const result = raw.filter((post) => post.channel === params.channel)
    console.log(`[TRACE:getByChannel] mapped ${raw.length} raw, ${result.length} after channel filter`)
    if (result.length > 0) {
      console.log(`[TRACE:getByChannel] first post:`, JSON.stringify({
        id: result[0].id,
        channel: result[0].channel,
        feedType: result[0].feedType,
        contentType: result[0].contentType,
        publisherUserId: result[0].publisherUserId,
        hasDocPackage: !!result[0].documentPackage,
        mediaUrls: result[0].documentPackage?.mediaUrls,
        mediaItems: result[0].documentPackage?.mediaItems?.length,
        mediaAssetId: result[0].documentPackage?.mediaAssetId,
        templateCode: result[0].documentPackage?.templateCode,
        authorHandle: result[0].documentPackage?.authorHandle,
      }))
    }
    return result
  }

  async getBySponsor(params: GetFeedParams): Promise<SponsorPost[]> {
    const response = await this.http.get<GetFeedResponse>(
      `${EXPLORER_API_BASE}/contents/by-sponsor/${params.sponsorId || ''}`,
      {
        params: {
          channel: params.channel,
          feed_type: params.feedType || undefined,
          page: params.page || 1,
          page_size: params.limit || 20,
        },
      },
    )

    let items = this._extractAndMap(response.data)
    // Filtrar por canal en sponsor también por consistencia
    items = items.filter((post) => post.channel === params.channel)
    items.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return dateB - dateA
    })

    return items
  }

  async getByPost(idPost: string): Promise<SponsorPost | null> {
    const response = await this.http.get<GetFeedResponse>(
      `${EXPLORER_API_BASE}/contents/by-post/${idPost}`,
    )

    const items = this._extractAndMap(response.data)
    return items?.[0] || null
  }

  /**
   * Aplica Opción B a todos los posts: poblar mediaUrls faltantes en blocks
   * desde mediaItems, incluso cuando los posts ya vienen mapeados de la API.
   */
  private _applyMediaFallback(posts: SponsorPost[]): SponsorPost[] {
    return posts.map((post) => {
      const doc = post.documentPackage
      if (!doc?.composicion?.blocks) return post
      const payloadMediaItems = doc.mediaItems || []
      const docMediaUrls = doc.mediaUrls || null

      const fixedBlocks = doc.composicion.blocks.map((block, idx) => {
        if ((block.elementType === 'image' || block.elementType === 'video') && !block.mediaUrls) {
          const mediaItem = payloadMediaItems[idx]
          if (mediaItem) {
            return {
              ...block,
              mediaUrls: {
                thumbUrl: mediaItem.thumbUrl || null,
                feedUrl: mediaItem.feedUrl || null,
                fullUrl: mediaItem.fullUrl || null,
                mediaAssetId: mediaItem.mediaAssetId || null,
              },
            }
          }
          if (docMediaUrls) {
            return { ...block, mediaUrls: docMediaUrls }
          }
        }
        return block
      })

      return {
        ...post,
        documentPackage: {
          ...doc,
          composicion: { ...doc.composicion, blocks: fixedBlocks },
        },
      }
    })
  }

  private _extractAndMap(response: unknown): SponsorPost[] {
    if (!response) return []

    const data = response as GetFeedResponse
    let raws: ContentRaw[] = []

    if (Array.isArray(data.data)) {
      if ((data.data[0] as SponsorPost)?.documentPackage) {
        return this._applyMediaFallback(data.data as SponsorPost[])
      }
      raws = data.data as unknown as ContentRaw[]
    } else if (Array.isArray(data.contents)) {
      raws = data.contents
    } else if (Array.isArray(data.items)) {
      if ((data.items[0] as SponsorPost)?.documentPackage) {
        return this._applyMediaFallback(data.items as SponsorPost[])
      }
      raws = data.items as unknown as ContentRaw[]
    }

    return this._applyMediaFallback(
      raws.map(mapContentToSponsorPost).filter((item): item is SponsorPost => item !== null),
    )
  }
}