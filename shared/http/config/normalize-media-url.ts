/**
 * Centralized media URL normalizer.
 *
 * Normalizes all media URLs to public HTTPS URLs.
 * This is the ONLY place where media URLs should be transformed.
 *
 * Transformations:
 *   http://185.187.235.253:8010/uploads/*  → https://api.antojadosmx.mx/uploads/*
 *   http://185.187.235.253:4100/media/*     → https://api.antojadosmx.mx/media/*
 *   http://localhost:4100/media/*            → https://api.antojadosmx.mx/media/*
 *   http://127.0.0.1:4100/media/*           → https://api.antojadosmx.mx/media/*
 *   https://localhost:4100/media/*           → https://api.antojadosmx.mx/media/*
 *   /uploads/*                               → https://api.antojadosmx.mx/uploads/*
 *   /media/*                                 → https://api.antojadosmx.mx/media/*
 *
 * Preserves:
 *   https://api.antojadosmx.mx/*             → unchanged
 *   https://images.pexels.com/*              → unchanged
 *
 * ═══════════════════════════════════════════════════════════════
 * CONTRATO: Este archivo es el ÚNICO normalizador de URLs de
 * media en todo el ecosistema Antojados Apps.
 *
 * Los componentes de UI NUNCA deben construir URLs manualmente.
 * Siempre usar normalizeMediaUrl().
 *
 * @see docs/14_CONTRATO_INTEGRACION_ANTOJADOS.md
 * @see docs/Refactor_Auditoria_Ecosistema_Antojados_v2.md
 * ═══════════════════════════════════════════════════════════════
 */

const ANTOJADOS_API_BASE = 'https://api.antojadosmx.mx'

/** Pattern for Engine V3 media paths: /media/{yyyy}/{mm}/{id}/{variant}.ext */
const ENGINE_MEDIA_PATTERN = /^\/media\//

/** Pattern for legacy upload paths: /uploads/{filename} */
const LEGACY_UPLOADS_PATTERN = /^\/uploads\//

/**
 * Internal IPs and ports that must never reach the client.
 */
const INTERNAL_PATTERNS = [
  /^https?:\/\/185\.187\.235\.253(?::\d+)?\/(.+)$/,
  /^https?:\/\/localhost(?::\d+)?\/(.+)$/,
  /^https?:\/\/127\.0\.0\.1(?::\d+)?\/(.+)$/,
]

/**
 * If the URL starts with a known internal host, extract the path and
 * rebuild as https://api.antojadosmx.mx/<path>
 */
function rebuildFromInternal(url: string): string | null {
  for (const pattern of INTERNAL_PATTERNS) {
    const match = url.match(pattern)
    if (match) {
      const path = match[1]
      console.warn(
        `[normalizeMediaUrl] URL interna detectada y normalizada: "${url}" → "${ANTOJADOS_API_BASE}/${path}". ` +
        'Esto indica que una fuente de datos (API, DB, componente) está devolviendo URLs internas ' +
        'en lugar de públicas. Revisar origen de datos.',
      )
      return `${ANTOJADOS_API_BASE}/${path}`
    }
  }
  return null
}

/**
 * Normalize a media URL to a public HTTPS URL.
 *
 * @param url - Raw URL from API response, database, or other source.
 * @returns Normalized HTTPS URL, or null if input is invalid.
 */
export function normalizeMediaUrl(url: unknown): string | null {
  if (typeof url !== 'string' || !url) {
    return null
  }

  const trimmed = url.trim()
  if (!trimmed) {
    return null
  }

  // Already the correct public URL — return as-is
  if (trimmed.startsWith(`${ANTOJADOS_API_BASE}/`)) {
    return trimmed
  }

  // Already a public HTTPS URL not on our domain — return as-is (e.g. pexels.com)
  if (trimmed.startsWith('https://')) {
    return trimmed
  }

  // Rebuild from known internal hosts (IP, localhost, 127.0.0.1)
  const rebuilt = rebuildFromInternal(trimmed)
  if (rebuilt) {
    return rebuilt
  }

  // Engine V3 path: /media/{yyyy}/{mm}/{id}/{variant}.ext
  if (ENGINE_MEDIA_PATTERN.test(trimmed)) {
    return `${ANTOJADOS_API_BASE}${trimmed}`
  }

  // Legacy uploads path: /uploads/{filename}
  if (LEGACY_UPLOADS_PATTERN.test(trimmed)) {
    return `${ANTOJADOS_API_BASE}${trimmed}`
  }

  // Absolute path (starts with /) — prefix with public base
  if (trimmed.startsWith('/')) {
    return `${ANTOJADOS_API_BASE}${trimmed}`
  }

  // Unrecognized HTTP URL — upgrade to HTTPS on our domain
  if (trimmed.startsWith('http://')) {
    return trimmed.replace(/^http:\/\//, 'https://')
  }

  // ⚠️ URL sin protocolo (ej. "test.com/img.jpg" o "cdn.example.com/photo.jpg")
  // Esto indica que la fuente de datos no está devolviendo URLs canónicas.
  // Para evitar ERR_NAME_NOT_RESOLVED, se antepone https://
  if (!trimmed.startsWith('https://') && !trimmed.startsWith('http://') && !trimmed.startsWith('/')) {
    console.warn(
      `[normalizeMediaUrl] URL sin protocolo detectada: "${trimmed}". Se antepone https://. ` +
      'Revisar origen de datos — las URLs deben incluir protocolo.',
    )
    return `https://${trimmed}`
  }

  return trimmed
}

/**
 * Type guard: checks if a URL is a valid Engine V3 media path.
 *
 * @example
 * ```typescript
 * isEngineMediaUrl('/media/2026/07/a1b2c3d4/feed.jpg')
 * // → true
 *
 * isEngineMediaUrl('https://api.antojadosmx.mx/media/2026/07/a1b2c3d4/feed.jpg')
 * // → true (absolute variant)
 * ```
 */
export function isEngineMediaUrl(url: string): boolean {
  const normalized = normalizeMediaUrl(url)
  if (!normalized) return false
  return ANTOJADOS_API_BASE + '/media/' === normalized.substring(0, ANTOJADOS_API_BASE.length + 7)
}

/**
 * Resolves the variant name from an Engine V3 media URL.
 *
 * @example
 * ```typescript
 * resolveVariantFromUrl('/media/2026/07/a1b2c3d4/feed.jpg')
 * // → 'feed'
 *
 * resolveVariantFromUrl('https://api.antojadosmx.mx/media/2026/07/a1b2c3d4/video.mp4')
 * // → 'video'
 * ```
 */
export function resolveVariantFromUrl(url: string): string | null {
  const normalized = normalizeMediaUrl(url)
  if (!normalized) return null

  // Extract variant name: /media/{yyyy}/{mm}/{id}/{variant}.ext
  const match = normalized.match(/\/media\/\d{4}\/\d{2}\/[^/]+\/([^.]+)\./)
  if (match?.[1]) {
    return match[1]
  }

  return null
}

/**
 * Builds an Engine V3 media URL for a specific variant.
 * Useful when you know the media_id and need to construct a URL manually.
 * NOTE: Per contract, prefer using URLs from Media Package instead of building.
 *
 * @param mediaId - Engine UUID for the media
 * @param variant - Variant name (thumb, grid, feed, full, etc.)
 * @param ext - File extension (jpg for images, mp4 for video)
 * @param date - Optional date object (defaults to now)
 *
 * @example
 * ```typescript
 * buildEngineMediaUrl('a1b2c3d4', 'feed', 'jpg')
 * // → 'https://api.antojadosmx.mx/media/2026/07/a1b2c3d4/feed.jpg'
 * ```
 */
export function buildEngineMediaUrl(
  mediaId: string,
  variant: string,
  ext: 'jpg' | 'mp4' | 'png' | 'webp' = 'jpg',
  date: Date = new Date(),
): string {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  return `${ANTOJADOS_API_BASE}/media/${yyyy}/${mm}/${mediaId}/${variant}.${ext}`
}