export type MediaType = 'photo' | 'video'
export type BizPostChannel = 'vas_ir' | 'arre'
export type SocialPostScope = 'barrio' | 'pachanga' | 'la-neta' | 'desma'

export interface MediaUploadInput {
  base64: string
  mediaType: MediaType
  channel: 'biz_post' | 'feed_post' | 'gallery' | 'avatar' | 'tile'
  entityId?: string | null
  entityContext?: string | null
}

export interface MediaUploadResult {
  intake_id?: string | null
  status?: string | null
  thumb_url?: string | null
  feed_url?: string | null
  full_url?: string | null
  media_url?: string | null
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
  user_id: string
  feed_scope: SocialPostScope
  caption?: string | null
  description?: string | null
  venue_name?: string | null
  media_url?: string | null
  media_type?: MediaType | null
  city_code?: string | null
  scope_level?: string | null
  scope_code?: string | null
}

export interface SocialPostCreateResult {
  post_id: string
}
