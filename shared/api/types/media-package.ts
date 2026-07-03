/**
 * Media Package Contract — Engine V3 → Clients
 *
 * This is the formal delivery type that Media Engine V3 produces.
 * All clients (Android, iOS, Explorer, Web) consume this format.
 *
 * @see MEDIA_PACKAGE_CONTRACT.md for full specification
 * @see MEDIA_ENGINE_V3/05_CLIENT_CONSUMPTION_SPEC.md for rendering rules
 */

/** Processing status for a MediaPackage */
export type MediaPackageStatus =
  | 'processing'
  | 'ready'
  | 'failed'
  | 'rejected'
  | 'canceled'

/** Resolved media type */
export type MediaPackageMediaType = 'image' | 'video'

/** Detected orientation */
export type MediaPackageOrientation = 'landscape' | 'portrait' | 'square' | null

/** Origin type per Engine rights/origin spec */
export type MediaPackageOriginType =
  | 'created_in_antojados'
  | 'explorer_partner'
  | 'external_platform'
  | 'official_antojados'
  | 'employee_generated'

/** Rights status per Engine policy */
export type MediaPackageRightsStatus =
  | 'declared'
  | 'approved'
  | 'restricted'
  | 'takedown'

/**
 * The payload containing all generated variants plus metadata.
 * null when the package is not yet 'ready'.
 */
export interface MediaPayload {
  // ── Identity ──
  /** Product/request code from upstream system */
  productCode: string
  /** Resolved media type */
  mediaType: MediaPackageMediaType
  /** Detected orientation: 'landscape' | 'portrait' | 'square' | null */
  orientation: MediaPackageOrientation
  /** Original width in pixels */
  width: number
  /** Original height in pixels */
  height: number
  /** MIME type of the original file */
  mimeType: string

  // ── Image Variants ──
  /** 320x320 center crop — thumbnails, avatars, pre-listeners */
  thumbUrl: string | null
  /** 600x600 center crop — grid layouts, masonry cells */
  gridUrl: string | null
  /** 1080x1350 crop safe — feed cards, social scroll (S1/S2) */
  feedUrl: string | null
  /** Max 1440 long side — fullscreen, detail view (S3) */
  fullUrl: string | null
  /** 1080x1920 crop safe — story/highlight format */
  storyUrl: string | null
  /** 1080x608 crop safe — business cover, tile background */
  coverUrl: string | null
  /** 512x512 center crop — user/explorer avatar */
  avatarUrl: string | null
  /** Public URL of the original file (NOT for client consumption) */
  originalUrl: string | null

  // ── Video Variants ──
  /** 720p MP4 H.264/AAC — primary feed playback */
  videoUrl: string | null
  /** 1080p MP4 H.264/AAC — fullscreen, high quality */
  video1080Url: string | null
  /** 1080x1920 portrait MP4 — short-form vertical video */
  shortUrl: string | null
  /** 1080x1350 or 1080x1920 MP4 — flexible feed video */
  feedVideoUrl: string | null
  /** 1080x1920 portrait MP4 — story format video */
  storyVideoUrl: string | null
  /** 720x1280 image preview — video thumbnail before playback */
  videoPreviewUrl: string | null

  // ── Video Metadata ──
  /** Duration in milliseconds (null for images) */
  durationMs: number | null
  /** Aspect ratio string (e.g., '16:9', '4:3', '9:16') */
  aspectRatio: string | null

  // ── Rights & Origin ──
  /** Origin type classification */
  originType: MediaPackageOriginType
  /** Rights processing status */
  rightsStatus: MediaPackageRightsStatus
  /** Whether this is demo/sample content */
  isDemoContent: boolean

  // ── Delivery ──
  /** Payload format version for forward compatibility */
  payloadVersion: string
  /** ISO 8601 timestamp when variants were completed */
  readyAt: string
}

/**
 * The Media Package — envelope for Engine V3 delivery.
 * Every media processed by the Engine is returned as this structure.
 */
export interface MediaPackage {
  /** Engine-assigned media identifier (UUID v4). Maps to media_intake_id in apps. */
  mediaId: string
  /** Package format version. Clients MUST validate compatibility. */
  version: string
  /**
   * Processing status. Clients consume ONLY 'ready' payloads.
   * - 'processing': Engine is generating variants. Poll again.
   * - 'ready': All required variants exist. Payload is complete.
   * - 'failed': Processing error. Check error_msg.
   * - 'rejected': Rights/policy violation. Media cannot be published.
   * - 'canceled': User or system canceled the request.
   */
  status: MediaPackageStatus
  /** Error message when status is 'failed' or 'rejected'. */
  errorMsg: string | null
  /** The media payload with all generated variants. null when not ready. */
  payload: MediaPayload | null
}

/**
 * Legacy MediaUploadResult mapping from MediaPackage.
 * Bridge type for backward compatibility with existing publish flow.
 *
 * Maps MediaPayload fields → MediaUploadResult fields.
 *
 * @see toLegacyUploadResult() in media-engine-client.service.ts
 */
export interface MediaUploadResult {
  intakeId: string
  status: string
  errorMsg: string | null
  // Legacy fields (from original media.service.ts interface)
  mediaUrl: string | null
  mediaThumbnailUrl: string | null
  thumbUrl: string | null
  feedUrl: string | null
  fullUrl: string | null
  video720Url: string | null
  video1080Url: string | null
  // New fields completing the Engine V3 variant set
  gridUrl: string | null
  storyUrl: string | null
  coverUrl: string | null
  avatarUrl: string | null
  shortUrl: string | null
  feedVideoUrl: string | null
  storyVideoUrl: string | null
  videoPreviewUrl: string | null
  // Metadata
  mediaType: MediaPackageMediaType | null
  durationMs: number | null
}

/**
 * Resolves the best image URL for a given context.
 * Implements the fallback chain from MEDIA_PACKAGE_CONTRACT.md §4.
 */
export function resolveMediaUrl(
  payload: MediaPayload,
  context: 'thumb' | 'grid' | 'feed' | 'full' | 'story' | 'cover' | 'avatar',
): string | null {
  switch (context) {
    case 'thumb':
      return payload.thumbUrl || payload.gridUrl || payload.feedUrl || null
    case 'grid':
      return payload.gridUrl || payload.thumbUrl || null
    case 'feed':
      return payload.feedUrl || payload.gridUrl || payload.thumbUrl || null
    case 'full':
      return payload.fullUrl || payload.feedUrl || null
    case 'story':
      return payload.storyUrl || payload.fullUrl || null
    case 'cover':
      return payload.coverUrl || payload.feedUrl || null
    case 'avatar':
      return payload.avatarUrl || payload.thumbUrl || null
    default:
      return payload.feedUrl || payload.fullUrl || null
  }
}

/**
 * Resolves the best video URL for a given context.
 */
export function resolveVideoUrl(
  payload: MediaPayload,
  context: 'feed' | 'fullscreen' | 'short' | 'preview',
): string | null {
  switch (context) {
    case 'feed':
      return payload.videoUrl || payload.feedVideoUrl || null
    case 'fullscreen':
      return payload.video1080Url || payload.videoUrl || null
    case 'short':
      return payload.shortUrl || payload.videoUrl || null
    case 'preview':
      return payload.videoPreviewUrl || payload.thumbUrl || null
    default:
      return payload.videoUrl || null
  }
}
