import { geoService } from '@antojados/api/services'
import type { CityOption, GeoCitySearchItem } from '@antojados/api/types/location'
import { mapCity } from '@antojados/api/composables/geo/geo-helpers'
import type { GeoAppState } from '@antojados/api/composables/geo/geo-state'
import { contextFromCity } from '@antojados/api/composables/geo/geo-helpers'
import type { LocationFeedKey, ScopeLevel } from '@antojados/api/types/location'

const citySearchRowsCache: GeoCitySearchItem[] = []

export async function loadCityOptions(
  q: string | null = null,
  limit = 100,
): Promise<GeoCitySearchItem[]> {
  const rows = await geoService.searchCities({ q, limit })
  return rows
}

export function findCityByCode(
  code: string | null | undefined,
  rows?: GeoCitySearchItem[],
): GeoCitySearchItem | null {
  const source = rows || citySearchRowsCache
  return source.find((city) => city.cityCode === code || city.cityScopeCode === code) || null
}

export function applyCity(
  state: GeoAppState,
  city: GeoCitySearchItem,
  feedKey: LocationFeedKey,
  preferredScopeLevel?: ScopeLevel | null,
): void {
  const context = contextFromCity(city)
  state.activeContext = context
  state.cityCode = city.cityCode
  state.cityScopeCode = city.cityScopeCode
  state.cityLabel = city.cityLabel
  state.zoneCode = city.zoneCode
  state.zoneScopeCode = city.zoneScopeCode
  state.zoneLabel = city.zoneLabel

  const feedState = state.feedScopes[feedKey]
  if (feedState) {
    const preferred = preferredScopeLevel || feedState.pendingScopeLevel || 'ciudad'
    feedState.pendingScopeLevel = null
  }

  if (feedKey === 'barrio' && (preferredScopeLevel === 'ciudad' || !preferredScopeLevel)) {
    for (const relatedFeed of ['vas_ir', 'arre', 'los_chidos'] as LocationFeedKey[]) {
      const rs = state.feedScopes[relatedFeed]
      if (rs) rs.pendingScopeLevel = null
    }
  }
}

export function refreshSearchRows(rows: GeoCitySearchItem[]): void {
  citySearchRowsCache.length = 0
  citySearchRowsCache.push(...rows)
}

export function getSearchRows(): GeoCitySearchItem[] {
  return citySearchRowsCache
}
