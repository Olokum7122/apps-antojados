#!/usr/bin/env node
/**
 * BizPostService — Consume el endpoint directo de biz/posts/:id
 * desde el Gateway (GET /api/v1/antojados/biz/posts/:biz_post_id).
 *
 * ═══════════════════════════════════════════════════════════════
 * CONTRATO: Único dominio permitido: https://api.antojadosmx.mx
 * ═══════════════════════════════════════════════════════════════
 *
 * SOLO campos del modelo feed.md Sección 1:
 *   biz_post_id, sponsor_id, channel, feed_type, media_url, doc_json,
 *   views_count, likes_count, comments_count, shares_count,
 *   cta_clicks_count, taps_whatsapp_count, taps_maps_count,
 *   engagement_score, status, created_at
 *
 * PROHIBIDO: place_id, user_id, post_type, publication_type,
 *            title, body, cta_label, cta_url, starts_at, ends_at,
 *            sponsored, sponsored_priority, venue_name, media_intake_id
 */
import { httpClient } from '@antojados/http/client'
import { normalizeMediaUrl } from '@antojados/http/config/normalize-media-url'
import type { ApiResponse } from '@antojados/api/types/api'

// ─── Interfaces (solo campos de feed.md) ─────────────────────────

export interface BizMediaDetail {
  media_id: string
  post_id: string
  media_url: string | null
  media_type: string | null
  sort_order: number
  thumb_url: string | null
  feed_url: string | null
  full_url: string | null
  grid_url: string | null
  story_url: string | null
  cover_url: string | null
  avatar_url: string | null
  video_720_url: string | null
  video_1080_url: string | null
  short_url: string | null
  feed_video_url: string | null
  story_video_url: string | null
  video_preview_url: string | null
  orientation: string | null
  aspect_ratio: string | null
  duration_ms: number | null
}

export interface BizPostRaw {
  biz_post_id: string
  sponsor_id: string | null
  channel: string | null
  feed_type: string | null
  media_url: string | null
  doc_json: string | null
  media_urls: string[]
  media_details: BizMediaDetail[]
  views_count: number
  likes_count: number
  comments_count: number
  shares_count: number
  cta_clicks_count: number
  taps_whatsapp_count: number
  taps_maps_count: number
  engagement_score: number
  status: string | null
  created_at: string | null
}

export interface BizPostCard {
  id: string
  sponsorId: string | null
  channel: string | null
  feedType: string | null
  docJson: Record<string, unknown> | null
  mediaUrls: string[]
  mediaDetails: BizMediaDetail[]
  likesCount: number
  commentsCount: number
  createdAt: string | null
}

// ─── Mapper ──────────────────────────────────────────────────────

function mapBizPost(raw: BizPostRaw): BizPostCard {
  // Parsear doc_json si viene como string
  let docJson: Record<string, unknown> | null = null
  if (raw.doc_json && typeof raw.doc_json === 'string') {
    try {
      docJson = JSON.parse(raw.doc_json)
    } catch {
      console.warn(`[BizPostService] doc_json inválido para post ${raw.biz_post_id}`)
    }
  } else if (raw.doc_json && typeof raw.doc_json === 'object') {
    docJson = raw.doc_json as Record<string, unknown>
  }

  // Normalizar URLs de media
  const mediaUrls = (raw.media_urls || [])
    .map((url) => normalizeMediaUrl(url))
    .filter((url): url is string => Boolean(url))

  const mediaDetails = (raw.media_details || []).map((m) => ({
    ...m,
    media_url: normalizeMediaUrl(m.media_url),
    thumb_url: normalizeMediaUrl(m.thumb_url),
    feed_url: normalizeMediaUrl(m.feed_url),
    full_url: normalizeMediaUrl(m.full_url),
    grid_url: normalizeMediaUrl(m.grid_url),
    story_url: normalizeMediaUrl(m.story_url),
    cover_url: normalizeMediaUrl(m.cover_url),
    avatar_url: normalizeMediaUrl(m.avatar_url),
    video_720_url: normalizeMediaUrl(m.video_720_url),
    video_1080_url: normalizeMediaUrl(m.video_1080_url),
    short_url: normalizeMediaUrl(m.short_url),
    feed_video_url: normalizeMediaUrl(m.feed_video_url),
    story_video_url: normalizeMediaUrl(m.story_video_url),
    video_preview_url: normalizeMediaUrl(m.video_preview_url),
  }))

  return {
    id: raw.biz_post_id,
    sponsorId: raw.sponsor_id,
    channel: raw.channel,
    feedType: raw.feed_type,
    docJson,
    mediaUrls,
    mediaDetails,
    likesCount: raw.likes_count || 0,
    commentsCount: raw.comments_count || 0,
    createdAt: raw.created_at,
  }
}

// ─── Service ─────────────────────────────────────────────────────

export class BizPostService {
  constructor(private readonly http = httpClient) {}

  /**
   * Obtiene un biz post individual.
   * GET /api/v1/antojados/biz/posts/:biz_post_id
   */
  async getById(bizPostId: string): Promise<BizPostCard | null> {
    try {
      const response = await this.http.get<ApiResponse<BizPostRaw>>(
        `/api/v1/antojados/biz/posts/${encodeURIComponent(bizPostId)}`,
      )
      const raw = response.data?.data || response.data
      if (!raw || !(raw as BizPostRaw).biz_post_id) return null
      return mapBizPost(raw as BizPostRaw)
    } catch (err) {
      console.error(`[BizPostService] Error fetching post ${bizPostId}:`, err)
      return null
    }
  }

  /**
   * Obtiene media detallado de un biz post.
   * GET /api/v1/antojados/biz/posts/:biz_post_id/media
   */
  async getMediaById(bizPostId: string): Promise<BizMediaDetail[]> {
    try {
      const response = await this.http.get<ApiResponse<BizMediaDetail[]>>(
        `/api/v1/antojados/biz/posts/${encodeURIComponent(bizPostId)}/media`,
      )
      const raw = response.data?.data || response.data
      if (!Array.isArray(raw)) return []
      return raw.map((m: BizMediaDetail) => ({
        ...m,
        media_url: normalizeMediaUrl(m.media_url),
        thumb_url: normalizeMediaUrl(m.thumb_url),
        feed_url: normalizeMediaUrl(m.feed_url),
        full_url: normalizeMediaUrl(m.full_url),
      }))
    } catch (err) {
      console.error(`[BizPostService] Error fetching media for post ${bizPostId}:`, err)
      return []
    }
  }
}
