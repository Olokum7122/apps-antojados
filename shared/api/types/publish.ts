export type MediaType = 'photo' | 'video'
export type BizPostChannel = 'vas_ir' | 'arre'
export type SocialPostScope = 'barrio' | 'pachanga' | 'la-neta' | 'desma'

export interface MediaUploadInput {
  /**
   * Archivo directamente del picker. Preferido sobre base64.
   * Si se proporciona, se sube directo sin conversion base64.
   */
  file?: File | null

  /**
   * @deprecated Desde DEBT-015. Usar `file` en su lugar.
   * Mantenido por compatibilidad — se convertira a Blob internamente si file no esta presente.
   */
  base64?: string | null

  mediaType: MediaType
  channel: 'biz_post' | 'feed_post' | 'gallery' | 'avatar' | 'tile'
  entityId?: string | null
  entityContext?: string | null
}

export interface MediaUploadResult {
  // ── Identity ──
  intake_id?: string | null
  status?: string | null
  error_msg?: string | null

  // ── Legacy fields (backward compat) ──
  media_url?: string | null
  media_thumbnail_url?: string | null

  // ── Image Variants ──
  thumb_url?: string | null
  grid_url?: string | null
  feed_url?: string | null
  full_url?: string | null
  story_url?: string | null
  cover_url?: string | null
  avatar_url?: string | null

  // ── Video Variants ──
  video_720_url?: string | null
  video_1080_url?: string | null
  short_url?: string | null
  feed_video_url?: string | null
  story_video_url?: string | null
  video_preview_url?: string | null

  // ── Metadata ──
  media_type?: MediaType | null
  duration_ms?: number | null
}

export interface BizPostCreateInput {
  place_id: string
  publisher_user_id: string
  channel: BizPostChannel
  post_type: string
  publication_type: string
  title: string
  body?: string | null
  media_url?: string | null
  media_type?: MediaType | null
  cta_label?: string | null
  cta_url?: string | null
  starts_at?: string | null
  ends_at?: string | null
}

export interface BizPostCreateResult {
  biz_post_id: string
}

export interface SocialPostCreateInput {
  post_id?: string | null
  user_id: string
  feed_scope: SocialPostScope
  caption?: string | null
  description?: string | null
  venue_name?: string | null
  media_url?: string | null
  media_thumbnail_url?: string | null
  media_type?: MediaType | null
  media_intake_id?: string | null
  city_code?: string | null
  scope_level?: string | null
  scope_code?: string | null
}

export interface SocialPostCreateResult {
  post_id: string
}

