/**
 * Document Package — Explorer → Antojados Apps (iOS/Android)
 *
 * Modelo V2: Content gobierna todas las relaciones.
 * id_post → template → look → filters → docJSON
 *
 * Tres tipos de package:
 *   - publicitypackage: sponsor → publicity → vas_ir / arre (4 templates)
 *   - generalpackage: sponsor → general → vas_ir / arre (1 template)
 *   - userpackage: social → user → barrio / pachanga / que_pex (1 template)
 *
 * content_type determina el owner:
 *   - sponsor: id_sponsor obligatorio, id_user NULL
 *   - social: id_user obligatorio, id_sponsor NULL
 *
 * @see docs/14_CONTRATO_INTEGRACION_ANTOJADOS.md
 */

// ── Tipos base ──

export type PackageType = 'publicitypackage' | 'generalpackage' | 'defaultpackage'

export type ContentType = 'sponsor' | 'social'

export type FeedType = 'publicity' | 'general' | 'default'

export type Channel = 'vas_ir' | 'arre' | 'barrio' | 'pachanga' | 'que_pex'

export type SponsorContentType = 'platillo' | 'promo' | 'descuento' | 'evento' | 'general'

export type ElementType =
  | 'image' | 'video'
  | 'title' | 'subtitle' | 'body' | 'text'
  | 'price' | 'rating'
  | 'badge'
  | 'watermark'
  | 'separator'
  | 'author' | 'date' | 'location'

export type EfectoGlobalId =
  | 'retro' | 'dark' | 'clean' | 'vibrant' | 'minimal'
  | 'madera' | 'neon' | 'acuarela' | 'carbon' | 'pastel' | 'oceano'

export type ElementEffectId =
  | 'ninguno' | 'sombra' | 'sombra-fuerte' | 'neon' | 'madera'
  | 'metal' | 'glass' | 'outline' | 'carta' | 'retro'

export type TextPresetId =
  | 'title' | 'subtitle' | 'body' | 'badge' | 'price'
  | 'cita' | 'capital' | 'tiny' | 'mono' | 'display'

// ── Estructura de un bloque ──

export interface GridPosition {
  col: number
  row: number
  colspan: number
  rowspan: number
}

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
  textShadow?: string
  padding?: string
  textAlign?: string
  objectFit?: 'cover' | 'contain'
  filter?: string
  brightness?: number
  contrast?: number
  scaleX?: number
  scaleY?: number
  rotate?: number
  [key: string]: unknown
}

export interface MediaUrls {
  thumbUrl: string | null
  feedUrl: string | null
  fullUrl: string | null
  mediaAssetId: string | null
}

export interface BlockInteraction {
  onTouch: 'fullscreen' | 'zoom-front' | 'expand-text' | 'none'
  fullscreenMedia?: string
  zoomScale?: number
}

export interface Block {
  id: string
  elementType: ElementType
  content: string
  style: ElementStyle
  gridPos: GridPosition
  efectoId?: ElementEffectId
  mediaUrls?: MediaUrls
  locked?: boolean
  interaction?: BlockInteraction
}

// ── Composición del post ──

export interface PostComposition {
  tipoPost: string
  tipoContent: string
  efectoGlobal: EfectoGlobalId
  blocks: Block[]
}

// ── Document Package completo ──

export interface DocumentPackage {
  documentCode: string
  schemaVersion: string
  projectId: string | null
  title: string
  packageType: PackageType
  packageTypeDisplay?: string
  contentType?: ContentType
  idPost?: string
  idSponsor?: string | null
  idUser?: string | null
  channel?: Channel
  feedType?: FeedType
  composicion: PostComposition
  mediaAssetId: string | null
  mediaUrls: MediaUrls | null
  templateCode: string | null
  bodyStyleCode: string | null
  mediaLookCode: string | null
  effects: string[]
  creatorId: string | null
  sourceApp: 'explorer' | 'antojados'
  authorHandle: string | null
  sponsorId: string | null
  createdAt: string | null
  // Media collection for carousel (P1 multiple files)
  mediaItems: MediaPackageItem[]
}

export interface MediaPackageItem {
  mediaAssetId: string
  mediaType: 'image' | 'video'
  thumbUrl: string | null
  feedUrl: string | null
  fullUrl: string | null
  videoUrl: string | null
  videoPreviewUrl: string | null
}

// ── Sponsor Post (para el feed de Vas Ir / Arre) ──

export interface SponsorPost {
  id: string
  documentPackage: DocumentPackage
  publisherUserId: string
  placeId: string | null
  venueName: string | null
  businessName: string | null
  channel: 'vas_ir' | 'arre'
  createdAt: string | null
}

// ── Constantes de grid ──

export const GRID = {
  CANVAS_WIDTH: 380,
  CANVAS_HEIGHT: 640,
  COLS: 24,
  ROWS: 40,
} as const

