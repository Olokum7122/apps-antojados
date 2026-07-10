import type { GeoCitySearchItem } from '@antojados/api/types/location'
import { authService, geoService } from '@antojados/api/services'
import { secureStorage } from '@antojados/api/storage/secure-storage'
import type { GeoAppState } from '@antojados/api/composables/geo/geo-state'
import { eventBus, GeoEvents } from '@antojados/ui/services/eventBus'

const DEVICE_CITY_KEY = 'antojados.geo.deviceCity'
const GEO_PERMISSION_MESSAGE = 'Usamos tu ubicacion para mostrar publicaciones por ciudad y zona.'
const MIN_DETECTION_INTERVAL_MS = 15000

let deviceLocationPromise: Promise<boolean> | null = null
let lastDeviceLocationAttemptAt = 0

function emitGeoPermissionNotice() {
  eventBus.emit(GeoEvents.PERMISSION_REQUEST, { message: GEO_PERMISSION_MESSAGE })
}

export function onGeoCityChangeRequest(
  handler: (city: GeoCitySearchItem, currentCityCode: string | null, accept: () => Promise<void>) => void,
): () => void {
  return eventBus.on(GeoEvents.CITY_CHANGE_REQUEST, (payload: { city: GeoCitySearchItem; currentCityCode: string | null; accept: () => Promise<void> }) => {
    handler(payload.city, payload.currentCityCode, payload.accept)
  })
}
function emitGeoCityChangeRequest(
  city: GeoCitySearchItem,
  currentCityCode: string | null,
  accept: () => Promise<void>,
) {
  eventBus.emit(GeoEvents.CITY_CHANGE_REQUEST, {
    city,
        currentCityCode,
    accept,
    message: `Detectamos que estas en ${city.cityLabel}.`,
  })
    }

export async function loadPersistedDeviceCity(): Promise<GeoCitySearchItem | null> {
  const raw = await secureStorage.get(DEVICE_CITY_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as GeoCitySearchItem
  } catch {
    await secureStorage.remove(DEVICE_CITY_KEY)
    return null
  }
}

export async function persistDeviceCity(
  city: GeoCitySearchItem,
  updateProfile = true,
): Promise<void> {
  await secureStorage.set(DEVICE_CITY_KEY, JSON.stringify(city))
  if (!updateProfile) return

  try {
    const session = await authService.getSession()
    if (!session?.userId || session.cityCode === city.cityCode) return
    await authService.setSession({ ...session, cityCode: city.cityCode })
    await authService.updateProfile(session.userId, { cityCode: city.cityCode })
  } catch {
    // Device geo must not block feed loading when profile persistence is unavailable.
  }
}

/**
 * Detecta la ubicacion del dispositivo usando GeoService.
 * Orquesta: GPS → API → persistencia → eventos.
 * 
 * Fallback: Si el GPS no esta disponible (geolocation_unavailable),
 * retorna false sin lanzar error para no bloquear la carga del feed.
 * 
 * @returns true si se resolvio y persistio exitosamente
 */
export async function detectDeviceLocation(
  state: GeoAppState,
): Promise<boolean> {
  try {
    const result = await geoService.resolveDeviceLocation()

    // Verificar si la ciudad detectada es diferente a la persistida
    const session = await authService.getSession().catch(() => null)
    const currentCityCode = session?.cityCode || state.persistedDeviceCity?.cityCode || null
    if (currentCityCode && currentCityCode !== result.city.cityCode) {
      emitGeoCityChangeRequest(
        result.city,
        currentCityCode,
        () => acceptDetectedDeviceCity(state, result.city, result.context),
      )
      return false
    }

    await persistDeviceCity(result.city, true)
    state.deviceContext = result.context
    return true
  } catch {
    return false
  }
}

export async function acceptDetectedDeviceCity(
  state: GeoAppState,
  city: GeoCitySearchItem,
  context: import('@antojados/api/types/location').GeoBarContextResponse,
): Promise<void> {
  await persistDeviceCity(city, true)
  state.deviceContext = context
  // Notificar que la ciudad fue aceptada para que los feeds se refresquen
  eventBus.emit(GeoEvents.CITY_CHANGE_ACCEPTED, { city, context })
}

/**
 * Determina si el estado tiene bars de ciudad/zone resueltos
 * por GPS (deviceContext con deviceResolved=true) o solo datos
 * del contexto API sin GPS.
 */
function hasRealBars(state: GeoAppState): boolean {
  const ctx = state.deviceContext?.context
  // Solo consideramos "reales" si el dispositivo fue resuelto por GPS
  const deviceResolved = ctx?.deviceResolved === true
  const hasCodes = Boolean(state.cityScopeCode && state.zoneScopeCode)
  return hasCodes && deviceResolved
}

export async function requestDeviceLocation(
  state: GeoAppState,
  force = false,
  onlyIfMissing = false,
): Promise<boolean> {
  const now = Date.now()
  // Usar hasRealBars en vez de solo verificar existencia de códigos
  const barsResolved = hasRealBars(state)
  if (onlyIfMissing && barsResolved) return false
  if (deviceLocationPromise) return deviceLocationPromise
  if (!force && now - lastDeviceLocationAttemptAt < MIN_DETECTION_INTERVAL_MS) return false

  lastDeviceLocationAttemptAt = now
  emitGeoPermissionNotice()
  deviceLocationPromise = detectDeviceLocation(state)
    .then((resolved) => resolved)
    .catch(() => false)
    .finally(() => { deviceLocationPromise = null })

  return deviceLocationPromise
}

export async function getBrowserPosition(): Promise<{ lat: number; lng: number }> {
  return geoService.resolveDeviceLocation().then((r) => ({ lat: r.lat, lng: r.lng }))
}

export function hasGeoPermission(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.geolocation !== 'undefined'
}

