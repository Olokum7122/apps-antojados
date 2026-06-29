export type ScopeLevel = 'global' | 'mexico' | 'zona' | 'ciudad' | 'municipio'

export type LocationFeedKey =
  | 'vas_ir'
  | 'arre'
  | 'los_chidos'
  | 'barrio'
  | 'pachanga'
  | 'la_neta'
  | 'desma'

export interface CityOption {
  code: string
  label: string
  metroCode: string
  scopeCode?: string | null
  municipalityCode?: string | null
}

export interface ScopeOption {
  level: ScopeLevel
  label: string
  code: string | null
  requiresCitySelection?: boolean
}

export interface GeoScopeCatalogItem {
  scopeCode: string
  scopeLevel: ScopeLevel
  scopeLabel: string
  parentScopeCode: string | null
  countryCode: string | null
  cityCode: string | null
  zoneCode: string | null
  status: 'active' | 'inactive' | string
}

export interface GeoCitySearchItem {
  cityScopeCode: string
  cityCode: string
  cityLabel: string
  zoneScopeCode: string
  zoneCode: string
  zoneLabel: string
  countryScopeCode: string
  countryCode: string
  countryLabel: string
}

export interface GeoBarItem {
  order: number
  scopeLevel: ScopeLevel
  scopeCode: string | null
  scopeLabel: string | null
  enabled: boolean
  isDefault: boolean
}

export interface GeoBarContext {
  deviceResolved: boolean
  deviceInCoverage: boolean
  countryScopeCode: string
  countryCode: string
  countryLabel: string
  zoneScopeCode: string | null
  zoneCode: string | null
  zoneLabel: string | null
  cityScopeCode: string | null
  cityCode: string | null
  cityLabel: string | null
  normalDefaultScopeLevel: ScopeLevel
  normalDefaultScopeCode: string
  barrioDefaultScopeLevel: ScopeLevel
  barrioDefaultScopeCode: string
  globalAvailable: boolean
  searchRequiredForZoneCity: boolean
  deviceDistanceKm: number | null
  detectionConfidence: number | null
  detectionSourceType: string | null
}

export interface GeoBarContextResponse {
  context: GeoBarContext | null
  normalBar: GeoBarItem[]
  barrioBar: GeoBarItem[]
}

export interface LocationSuggestion {
  value: string
  label: string
  description: string
  city_code: string
  scope_code: string
  metro_code: string
}
