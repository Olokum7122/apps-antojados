import type { AxiosInstance } from 'axios'
import { API_ENDPOINTS } from '@antojados/http/endpoints'
import type {
  GeoBarContextResponse,
  GeoCitySearchItem,
  GeoScopeCatalogItem,
  ScopeLevel,
} from '@antojados/api/types/location'

interface ListScopesParams {
  scopeLevel?: ScopeLevel
  parentScopeCode?: string | null
  q?: string | null
  limit?: number
}

interface SearchCitiesParams {
  q?: string | null
  limit?: number
}

interface ResolveGeoParams {
  lat?: number | null
  lng?: number | null
}

/**
 * Resultado de la resolucion de ubicacion del dispositivo.
 * Contiene la ciudad detectada y el contexto geografico completo.
 */
export interface DeviceLocationResult {
  city: GeoCitySearchItem
  context: GeoBarContextResponse
  /** Latitud obtenida del GPS */
  lat: number
  /** Longitud obtenida del GPS */
  lng: number
}

function dataArray<T>(payload: { data?: T[] } | T[]): T[] {
  return Array.isArray(payload) ? payload : Array.isArray(payload.data) ? payload.data : []
}

/**
 * Obtiene la posición del navegador.
 * DEBT-030: Fallback cuando navigator.geolocation no está disponible.
 * Si no hay GPS, retorna null para que el caller decida (ej. resolver por IP).
 */
async function getBrowserPosition(): Promise<{ lat: number; lng: number } | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return null
  }

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        maximumAge: 300000,
        timeout: 12000,
      })
    })
    return { lat: position.coords.latitude, lng: position.coords.longitude }
  } catch {
    // El usuario rechazó el permiso, timeout, o error del dispositivo
    return null
  }
}

export class GeoService {
  constructor(private readonly http: AxiosInstance) {}

  async listScopes(params: ListScopesParams = {}): Promise<GeoScopeCatalogItem[]> {
    const { data } = await this.http.get<{ data?: GeoScopeCatalogItem[] }>(API_ENDPOINTS.geo.scopes, {
      params: {
        scope_level: params.scopeLevel,
        parent_scope_code: params.parentScopeCode || undefined,
        q: params.q || undefined,
        limit: params.limit,
      },
    })
    return dataArray(data)
  }

  async searchCities(params: SearchCitiesParams = {}): Promise<GeoCitySearchItem[]> {
    const { data } = await this.http.get<{ data?: GeoCitySearchItem[] }>(API_ENDPOINTS.geo.citySearch, {
      params: {
        q: params.q || undefined,
        limit: params.limit,
      },
    })
    return dataArray(data)
  }

  async resolveBarContext(params: ResolveGeoParams = {}): Promise<GeoBarContextResponse> {
    const { data } = await this.http.get<GeoBarContextResponse>(API_ENDPOINTS.geo.resolve, {
      params: {
        lat: params.lat ?? undefined,
        lng: params.lng ?? undefined,
      },
    })
    return data
  }

  /**
   * Resuelve la ubicacion del dispositivo usando GPS + API geo.
   * No persiste ni emite eventos — solo devuelve datos puros.
   * 
   * Steps:
   *   1. Obtiene coordenadas via navigator.geolocation (fallback null si no disponible)
   *   2. Llama a resolveBarContext con esas coordenadas (o sin ellas para resolución por IP)
   *   3. Convierte el contexto a GeoCitySearchItem
   * 
   * DEBT-030: Fallback si navigator.geolocation no está disponible.
   * En ese caso, resuelve sin coordenadas (la API usará IP-based).
   * 
   * @throws Error('location_unresolved') si la API no puede resolver la ubicacion
   */
  async resolveDeviceLocation(): Promise<DeviceLocationResult> {
    const coords = await getBrowserPosition()
    const context = await this.resolveBarContext(coords ?? {})
    const ctx = context.context

    if (!ctx?.cityCode || !ctx.cityScopeCode || !ctx.zoneCode || !ctx.zoneScopeCode) {
      throw new Error('location_unresolved')
    }

    const city: GeoCitySearchItem = {
      cityScopeCode: ctx.cityScopeCode,
      cityCode: ctx.cityCode,
      cityLabel: ctx.cityLabel || ctx.cityCode,
      zoneScopeCode: ctx.zoneScopeCode,
      zoneCode: ctx.zoneCode,
      zoneLabel: ctx.zoneLabel || ctx.zoneCode,
      countryScopeCode: ctx.countryScopeCode,
      countryCode: ctx.countryCode,
      countryLabel: ctx.countryLabel,
    }

    return {
      city,
      context,
      lat: coords?.lat ?? 0,
      lng: coords?.lng ?? 0,
    }
  }
}
