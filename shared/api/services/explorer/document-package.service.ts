/**
 * Document Package Service V2 — Obtiene packages desde Explorer API vía Gateway.
 *
 * ═══════════════════════════════════════════════════════════════
 * CONTRATO: Único dominio permitido: https://api.antojadosmx.mx
 * El frontend NUNCA hace llamados directos a IP/puerto/HTTP.
 * Las rutas pasan por el Gateway en /api/v1/antojados/publications/*
 * ═══════════════════════════════════════════════════════════════
 */

import { httpClient } from '@antojados/http/client'
import type {
  SponsorPost,
  DocumentPackage,
  PackageType,
  Channel,
  PostComposition,
} from '@antojados/api/types/document-package'

// Publications API base path (Gateway → Explorer DB, mismo dominio)
const PUBLICATIONS_API_BASE = '/api/v1/antojados/publications'

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

  const composicion = (payload.composicion || payload.composition) as unknown as PostComposition | undefined

  const docPackage: DocumentPackage = {
    documentCode: String(payload.document_code || `doc-${idPost}`),
    schemaVersion: String(payload.schema_version || '1.0'),
    projectId: String(payload.project_id || '') || null,
    title: String(payload.title || '') || '',
    packageType: (raw.package_type || raw.packageType || 'userpackage') as PackageType,
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
    sponsorId: raw.id_sponsor || raw.idSponsor || null,
    createdAt: raw.published_at || raw.publishedAt || String(payload.published_at || '') || null,
    mediaItems: Array.isArray(payload.mediaItems) ? payload.mediaItems as DocumentPackage['mediaItems'] : [],
  }

  const sponsorId = raw.id_sponsor || raw.idSponsor || null
  const channel = (raw.channel || 'vas_ir') as string

  return {
    id: idPost,
    documentPackage: docPackage,
    publisherUserId: sponsorId || raw.id_user || raw.idUser || '',
    placeId: String(payload.place_id || '') || null,
    venueName: String(payload.venue_name || payload.title || '') || null,
    businessName: String(payload.business_name || '') || null,
    channel: (channel === 'vas_ir' || channel === 'arre' ? channel : 'vas_ir') as 'vas_ir' | 'arre',
    createdAt: raw.published_at || raw.publishedAt || null,
  }
}

export class DocumentPackageService {
  constructor(private readonly http = httpClient) {}

  async getByChannel(params: GetFeedParams): Promise<SponsorPost[]> {
    const response = await this.http.get<GetFeedResponse>(
      `${PUBLICATIONS_API_BASE}/by-channel/${params.channel}`,
      {
        params: {
          feed_type: params.feedType || undefined,
          page: params.page || 1,
          page_size: params.limit || 20,
        },
      },
    )

    return this._extractAndMap(response.data)
  }

  async getBySponsor(params: GetFeedParams): Promise<SponsorPost[]> {
    const response = await this.http.get<GetFeedResponse>(
      `${PUBLICATIONS_API_BASE}/by-sponsor/${params.sponsorId || ''}`,
      {
        params: {
          channel: params.channel,
          feed_type: params.feedType || undefined,
          page: params.page || 1,
          page_size: params.limit || 20,
        },
      },
    )

    const items = this._extractAndMap(response.data)
    items.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return dateB - dateA
    })

    return items
  }

  async getByPost(idPost: string): Promise<SponsorPost | null> {
    const response = await this.http.get<GetFeedResponse>(
      `${PUBLICATIONS_API_BASE}/by-post/${idPost}`,
    )

    const items = this._extractAndMap(response.data)
    return items?.[0] || null
  }

  private _extractAndMap(response: unknown): SponsorPost[] {
    if (!response) return []

    const data = response as GetFeedResponse
    let raws: ContentRaw[] = []

    if (Array.isArray(data.data)) {
      if ((data.data[0] as SponsorPost)?.documentPackage) {
        return data.data as SponsorPost[]
      }
      raws = data.data as unknown as ContentRaw[]
    } else if (Array.isArray(data.contents)) {
      raws = data.contents
    } else if (Array.isArray(data.items)) {
      if ((data.items[0] as SponsorPost)?.documentPackage) {
        return data.items as SponsorPost[]
      }
      raws = data.items as unknown as ContentRaw[]
    }

    return raws.map(mapContentToSponsorPost).filter((item): item is SponsorPost => item !== null)
  }
}