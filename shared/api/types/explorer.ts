export interface Explorer {
  userId: string
  displayName?: string | null
  username?: string | null
  cityCode?: string | null
  status?: string | null
  raw: Record<string, unknown>
}

export interface ExplorerAssociation {
  associationId: string
  userId: string
  targetType?: string | null
  associatedInstanceId?: string | null
  status?: string | null
  raw: Record<string, unknown>
}

/* ===== Explorer Feed Types (composicion.blocks[]) ===== */

export type EfectoGlobalId =
  | 'retro'
  | 'dark'
  | 'clean'
  | 'vibrant'
  | 'minimal'
  | 'madera'
  | 'neon'
  | 'acuarela'
  | 'carbon'
  | 'pastel'
  | 'oceano'

export type ElementType =
  | 'image'
  | 'title'
  | 'subtitle'
  | 'body'
  | 'text'
  | 'price'
  | 'rating'
  | 'badge'
  | 'watermark'
  | 'separator'
  | 'author'
  | 'date'
  | 'location'

export type FeedType = 'que-pex' | 'pachanga' | 'sponsor'

export interface ElementStyle {
  fontSize?: number
  fontWeight?: string
  fontFamily?: string
  color?: string
  bgColor?: string
  bgGradient?: string
  border?: string
  borderRadius?: string
  boxShadow?: string
  opacity?: number
  padding?: string
  textAlign?: string
  objectFit?: 'cover' | 'contain'
  filter?: string
  brightness?: number
  contrast?: number
  scaleX?: number
  scaleY?: number
  rotate?: number
}

export interface GridPosition {
  col: number
  row: number
  colspan: number
  rowspan: number
  offsetX?: number
  offsetY?: number
}

export interface ExplorerBlock {
  id?: string
  elementType: ElementType
  content: string
  style?: ElementStyle
  gridPos: GridPosition
  efectoId?: string
}

export interface EfectoGlobal {
  id: EfectoGlobalId
  name: string
  bgColor: string
  bgGradient?: string
  fontFamily: string
  textColor: string
  accentColor: string
  borderColor: string
}

export interface Composicion {
  version?: string
  tipoPost: string
  tipoContent: string
  efectoGlobal: EfectoGlobalId | string
  blocks: ExplorerBlock[]
}

export interface ExplorerFeedItem {
  id: string
  feed_type: string
  feedType?: string
  destination_id?: string
  published_at: string
  composicion: Composicion
  title: string
  media_url?: string
  media_feed_url?: string
  media_full_url?: string
  media_type?: string
  author_handle?: string
  author_avatar_url?: string | null
  authorHandle?: string
  authorAvatarUrl?: string | null
}

export interface ExplorerFeedResponse {
  ok: boolean
  items: ExplorerFeedItem[]
  total: number
}

export interface ExplorerPublicationResponse {
  ok: boolean
  publication: ExplorerFeedItem
}

export interface ExplorerFeedParams {
  tenantId: string
  feedType: FeedType | string
  limit?: number
  offset?: number
}
