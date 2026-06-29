import type {
  GeoBarContextResponse,
  GeoBarItem,
  GeoCitySearchItem,
  ScopeLevel,
  ScopeOption,
} from '@antojados/api/types/location'
import { DEFAULT_SCOPE_LABELS } from '@antojados/api/composables/geo/geo-state'

export function normalizeLevel(level: ScopeLevel): ScopeLevel {
  return level
}

export function mapCity(row: GeoCitySearchItem): { code: string; label: string; metroCode: string; scopeCode: string } {
  return {
    code: row.cityCode,
    label: row.cityLabel,
    metroCode: row.zoneCode,
    scopeCode: row.cityScopeCode,
  }
}

export function barForFeedKey(
  context: GeoBarContextResponse | null,
  feedKey: string,
): GeoBarItem[] {
  if (!context) return []

  if (feedKey === 'barrio') {
    const source = context.barrioBar || context.normalBar || []
    const mexico = source.find((item) => normalizeLevel(item.scopeLevel) === 'mexico')
    const ciudad = source.find((item) => normalizeLevel(item.scopeLevel) === 'ciudad')
    const fallbackCode = context.context?.countryScopeCode || 'MX_52'
    const fallbackLabel = context.context?.countryLabel || 'Mexico'
    return [
      mexico
        ? { ...mexico, enabled: true, isDefault: true }
        : { order: 1, scopeLevel: 'mexico' as ScopeLevel, scopeCode: fallbackCode, scopeLabel: fallbackLabel, enabled: true, isDefault: true },
      ...(ciudad ? [{ ...ciudad, enabled: true, isDefault: false }] : []),
    ]
  }

  return context.normalBar || []
}

export function optionFromBarItem(item: GeoBarItem): ScopeOption {
  const level = normalizeLevel(item.scopeLevel)
  const rawLabel = String(item.scopeLabel || '').trim()
  return {
    level,
    label: !rawLabel || rawLabel.toLowerCase() === level
      ? DEFAULT_SCOPE_LABELS[level] || level
      : rawLabel,
    code: item.scopeCode || null,
    requiresCitySelection: !item.enabled && (level === 'zona' || level === 'ciudad' || level === 'municipio'),
  }
}

export function cityFromContext(context: GeoBarContextResponse): GeoCitySearchItem | null {
  const row = context.context
  if (!row?.cityCode || !row.cityScopeCode || !row.zoneCode || !row.zoneScopeCode) return null
  return {
    cityScopeCode: row.cityScopeCode,
    cityCode: row.cityCode,
    cityLabel: row.cityLabel || row.cityCode,
    zoneScopeCode: row.zoneScopeCode,
    zoneCode: row.zoneCode,
    zoneLabel: row.zoneLabel || row.zoneCode,
    countryScopeCode: row.countryScopeCode,
    countryCode: row.countryCode,
    countryLabel: row.countryLabel,
  }
}

export function contextFromCity(city: GeoCitySearchItem): GeoBarContextResponse {
  return {
    context: {
      deviceResolved: true,
      deviceInCoverage: true,
      countryScopeCode: city.countryScopeCode,
      countryCode: city.countryCode,
      countryLabel: city.countryLabel,
      zoneScopeCode: city.zoneScopeCode,
      zoneCode: city.zoneCode,
      zoneLabel: city.zoneLabel,
      cityScopeCode: city.cityScopeCode,
      cityCode: city.cityCode,
      cityLabel: city.cityLabel,
      normalDefaultScopeLevel: 'ciudad',
      normalDefaultScopeCode: city.cityScopeCode,
      barrioDefaultScopeLevel: 'mexico',
      barrioDefaultScopeCode: city.countryScopeCode,
      globalAvailable: true,
      searchRequiredForZoneCity: false,
      deviceDistanceKm: null,
      detectionConfidence: null,
      detectionSourceType: 'persisted_gps',
    },
    normalBar: [
      { order: 1, scopeLevel: 'mexico', scopeCode: city.countryScopeCode, scopeLabel: city.countryLabel, enabled: true, isDefault: false },
      { order: 2, scopeLevel: 'zona', scopeCode: city.zoneScopeCode, scopeLabel: city.zoneLabel, enabled: true, isDefault: false },
      { order: 3, scopeLevel: 'ciudad', scopeCode: city.cityScopeCode, scopeLabel: city.cityLabel, enabled: true, isDefault: true },
    ],
    barrioBar: [
      { order: 0, scopeLevel: 'global', scopeCode: null, scopeLabel: 'Global', enabled: true, isDefault: false },
      { order: 1, scopeLevel: 'mexico', scopeCode: city.countryScopeCode, scopeLabel: city.countryLabel, enabled: true, isDefault: true },
      { order: 2, scopeLevel: 'zona', scopeCode: city.zoneScopeCode, scopeLabel: city.zoneLabel, enabled: true, isDefault: false },
      { order: 3, scopeLevel: 'ciudad', scopeCode: city.cityScopeCode, scopeLabel: city.cityLabel, enabled: true, isDefault: false },
    ],
  }
}

export function uniqueScopeLevels(levels: ScopeLevel[]): ScopeLevel[] {
  return Array.from(new Set(levels.map(normalizeLevel)))
}
