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

function dataArray<T>(payload: { data?: T[] } | T[]): T[] {
  return Array.isArray(payload) ? payload : Array.isArray(payload.data) ? payload.data : []
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
}
