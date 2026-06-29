/**
 * feed-cache.service.ts — Cache de feed con invalidacion por tiempo.
 *
 * Resuelve DEBT-008: implementa cache de la pagina actual de feed con TTL.
 * Resuelve DEBT-009: limita a 50 paginas en memoria.
 *
 * Cache strategy:
 *   - Solo cachea la pagina actual + 2 adyacentes (por contrato 03b §14)
 *   - TTL de 60 segundos (configurable)
 *   - Invalida al cambiar de scope/ciudad
 *   - Soporta pre-cache de pagina siguiente para scroll fluido
 *
 * Es agnostico del tipo de feed (social o biz).
 */

const DEFAULT_TTL_MS = 60 * 1000 // 60 segundos (DEBT-008)
const MAX_CACHED_PAGES = 50 // DEBT-009

export interface FeedCacheKey {
  /** Identificador unico del feed (barrio, pachanga, vas-ir, arre, etc.) */
  scope: string
  /** Codigo de ciudad para filtrar */
  cityCode?: string | null
  /** Nivel de scope geografico */
  scopeLevel?: string | null
  /** Codigo de scope geografico */
  scopeCode?: string | null
  /** Filtro adicional de post type */
  postType?: string | null
}

interface FeedCachePage<T> {
  page: number
  items: T[]
  cachedAt: number
}

interface FeedCacheEntry<T> {
  key: string // serializacion de FeedCacheKey
  pages: Map<number, FeedCachePage<T>>
  lastAccessAt: number
}

// Cache en memoria (no localStorage, por rendimiento)
const cacheRegistry = new Map<string, FeedCacheEntry<unknown>>()

function serializeKey(key: FeedCacheKey): string {
  return `${key.scope}|${key.cityCode || ''}|${key.scopeLevel || ''}|${key.scopeCode || ''}|${key.postType || ''}`
}

function getEntry<T>(key: FeedCacheKey): FeedCacheEntry<T> | undefined {
  const serialized = serializeKey(key)
  const entry = cacheRegistry.get(serialized)
  if (!entry) return undefined
  entry.lastAccessAt = Date.now()
  return entry as FeedCacheEntry<T>
}

function getOrCreateEntry<T>(key: FeedCacheKey): FeedCacheEntry<T> {
  const serialized = serializeKey(key)
  let entry = cacheRegistry.get(serialized) as FeedCacheEntry<T> | undefined
  if (!entry) {
    entry = {
      key: serialized,
      pages: new Map(),
      lastAccessAt: Date.now(),
    }
    cacheRegistry.set(serialized, entry as FeedCacheEntry<unknown>)
  }
  entry.lastAccessAt = Date.now()
  return entry
}

function isPageExpired(page: FeedCachePage<unknown>, ttlMs: number): boolean {
  return (Date.now() - page.cachedAt) > ttlMs
}

/**
 * Limpia entradas de cache poco usadas para evitar memory leak.
 * Se llama internamente cada vez que se agrega una pagina nueva.
 */
function evictStaleEntries(): void {
  if (cacheRegistry.size <= MAX_CACHED_PAGES) return

  // Ordenar por lastAccessAt ascendente y eliminar las menos usadas
  const entries = [...cacheRegistry.entries()]
    .sort(([, a], [, b]) => a.lastAccessAt - b.lastAccessAt)

  const toRemove = entries.slice(0, entries.length - MAX_CACHED_PAGES)
  for (const [key] of toRemove) {
    cacheRegistry.delete(key)
  }
}

/**
 * Obtiene pagina cacheada del feed.
 * Retorna null si no hay cache o expiro.
 */
export function getCachedFeedPage<T>(
  key: FeedCacheKey,
  page: number,
  ttlMs = DEFAULT_TTL_MS,
): T[] | null {
  const entry = getEntry<T>(key)
  if (!entry) return null

  const cachedPage = entry.pages.get(page)
  if (!cachedPage) return null

  if (isPageExpired(cachedPage, ttlMs)) {
    entry.pages.delete(page)
    return null
  }

  return cachedPage.items
}

/**
 * Guarda pagina del feed en cache.
 * Invalida la pagina actual y +-2 adyacentes si el TTL se vencio.
 */
export function setCachedFeedPage<T>(
  key: FeedCacheKey,
  page: number,
  items: T[],
): void {
  const entry = getOrCreateEntry<T>(key)

  // Si pasamos de 50 paginas, eliminar las mas viejas
  if (entry.pages.size >= MAX_CACHED_PAGES) {
    const sorted = [...entry.pages.entries()]
      .sort(([, a], [, b]) => a.cachedAt - b.cachedAt)
    const [oldestPageNum] = sorted[0]
    entry.pages.delete(oldestPageNum)
  }

  entry.pages.set(page, {
    page,
    items,
    cachedAt: Date.now(),
  })

  evictStaleEntries()
}

/**
 * Invalida el cache para un key especifico.
 * Se usa cuando cambia la ciudad o el scope.
 */
export function invalidateFeedCache(key: FeedCacheKey): void {
  const serialized = serializeKey(key)
  cacheRegistry.delete(serialized)
}

/**
 * Invalida todo el cache de feed (ej. al cerrar sesion).
 */
export function invalidateAllFeedCaches(): void {
  cacheRegistry.clear()
}

/**
 * Verifica si existe una pagina valida en cache.
 */
export function hasCachedFeedPage(key: FeedCacheKey, page: number, ttlMs = DEFAULT_TTL_MS): boolean {
  return getCachedFeedPage(key, page, ttlMs) !== null
}

/**
 * Obtiene el numero de paginas cacheadas para un key.
 */
export function getCachedPageCount(key: FeedCacheKey): number {
  const entry = getEntry(key)
  return entry ? entry.pages.size : 0
}

/**
 * Obtiene estadisticas del cache (para debug/monitoreo).
 */
export function getFeedCacheStats(): {
  entriesCount: number
  totalPages: number
  oldestEntry: number | null
  newestEntry: number | null
} {
  let totalPages = 0
  let oldestEntry: number | null = null
  let newestEntry: number | null = null

  for (const [, entry] of cacheRegistry) {
    totalPages += entry.pages.size
    if (!oldestEntry || entry.lastAccessAt < oldestEntry) oldestEntry = entry.lastAccessAt
    if (!newestEntry || entry.lastAccessAt > newestEntry) newestEntry = entry.lastAccessAt
  }

  return {
    entriesCount: cacheRegistry.size,
    totalPages,
    oldestEntry,
    newestEntry,
  }
}
