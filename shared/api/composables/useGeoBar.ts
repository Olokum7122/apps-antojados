import { computed, ref } from 'vue'
import { geoService } from '@antojados/api/services'
import type {
  GeoBarContextResponse,
  GeoBarItem,
  GeoCitySearchItem,
  ScopeLevel,
} from '@antojados/api/types/location'

export type GeoFeedKind = 'normal' | 'barrio'

interface ResolveDeviceParams {
  lat?: number | null
  lng?: number | null
}

interface SelectedGeoScope {
  scopeLevel: ScopeLevel
  scopeCode: string | null
  scopeLabel: string | null
}

function defaultSelection(items: GeoBarItem[]): SelectedGeoScope | null {
  const item = items.find((candidate) => candidate.isDefault && candidate.enabled) || items.find((candidate) => candidate.enabled)
  if (!item) return null
  return {
    scopeLevel: item.scopeLevel,
    scopeCode: item.scopeCode,
    scopeLabel: item.scopeLabel,
  }
}

function cityToBars(city: GeoCitySearchItem, barrioGlobalAvailable: boolean): Pick<GeoBarContextResponse, 'normalBar' | 'barrioBar'> {
  const mexico: GeoBarItem = {
    order: 1,
    scopeLevel: 'mexico',
    scopeCode: city.countryScopeCode,
    scopeLabel: city.countryLabel,
    enabled: true,
    isDefault: false,
  }
  const zona: GeoBarItem = {
    order: 2,
    scopeLevel: 'zona',
    scopeCode: city.zoneScopeCode,
    scopeLabel: city.zoneLabel,
    enabled: true,
    isDefault: false,
  }
  const ciudad: GeoBarItem = {
    order: 3,
    scopeLevel: 'ciudad',
    scopeCode: city.cityScopeCode,
    scopeLabel: city.cityLabel,
    enabled: true,
    isDefault: true,
  }

  return {
    normalBar: [mexico, zona, ciudad],
    barrioBar: [
      {
        order: 0,
        scopeLevel: 'global',
        scopeCode: null,
        scopeLabel: 'Global',
        enabled: barrioGlobalAvailable,
        isDefault: false,
      },
      { ...mexico, isDefault: true },
      { ...zona, isDefault: false },
      { ...ciudad, isDefault: false },
    ],
  }
}

export function useGeoBar() {
  const deviceContext = ref<GeoBarContextResponse | null>(null)
  const activeContext = ref<GeoBarContextResponse | null>(null)
  const feedKind = ref<GeoFeedKind>('normal')
  const selectedScope = ref<SelectedGeoScope | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const barItems = computed(() => {
    const context = activeContext.value
    if (!context) return []
    return feedKind.value === 'barrio' ? context.barrioBar : context.normalBar
  })

  function setFeedKind(kind: GeoFeedKind) {
    feedKind.value = kind
    selectedScope.value = defaultSelection(barItems.value)
  }

  function selectScope(item: GeoBarItem) {
    if (!item.enabled) return
    selectedScope.value = {
      scopeLevel: item.scopeLevel,
      scopeCode: item.scopeCode,
      scopeLabel: item.scopeLabel,
    }
  }

  async function resolveDevice(params: ResolveDeviceParams = {}) {
    loading.value = true
    error.value = null
    try {
      const resolved = await geoService.resolveBarContext(params)
      deviceContext.value = resolved
      activeContext.value = resolved
      selectedScope.value = defaultSelection(barItems.value)
      return resolved
    } catch (caught) {
      error.value = caught instanceof Error ? caught.message : 'geo_resolve_failed'
      throw caught
    } finally {
      loading.value = false
    }
  }

  async function searchCities(q: string, limit = 20) {
    return geoService.searchCities({ q, limit })
  }

  function applyTemporaryCity(city: GeoCitySearchItem) {
    if (!deviceContext.value || !deviceContext.value.context) return
    const bars = cityToBars(city, deviceContext.value.context.globalAvailable)
    activeContext.value = {
      context: {
        ...deviceContext.value.context,
        deviceResolved: true,
        deviceInCoverage: true,
        zoneScopeCode: city.zoneScopeCode,
        zoneCode: city.zoneCode,
        zoneLabel: city.zoneLabel,
        cityScopeCode: city.cityScopeCode,
        cityCode: city.cityCode,
        cityLabel: city.cityLabel,
        normalDefaultScopeLevel: 'ciudad',
        normalDefaultScopeCode: city.cityScopeCode,
        searchRequiredForZoneCity: false,
      },
      ...bars,
    }
    selectedScope.value = defaultSelection(barItems.value)
  }

  function resetToDeviceDefault() {
    activeContext.value = deviceContext.value
    selectedScope.value = defaultSelection(barItems.value)
  }

  return {
    activeContext,
    barItems,
    deviceContext,
    error,
    feedKind,
    loading,
    selectedScope,
    applyTemporaryCity,
    resetToDeviceDefault,
    resolveDevice,
    searchCities,
    selectScope,
    setFeedKind,
  }
}
