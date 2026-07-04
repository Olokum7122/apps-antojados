import { computed, ref, watch } from 'vue'
import { geoService } from '@antojados/api/services'
import type {
  CityOption,
  GeoBarContextResponse,
  GeoCitySearchItem,
  LocationFeedKey,
  LocationSuggestion,
  ScopeLevel,
  ScopeOption,
} from '@antojados/api/types/location'

// Módulos helper separados (DEBT-020)
import { createGeoState, DEFAULT_ALLOWED_SCOPES } from '@antojados/api/composables/geo/geo-state'
import type { GeoAppState } from '@antojados/api/composables/geo/geo-state'
import {
  normalizeLevel,
  mapCity,
  barForFeedKey,
  optionFromBarItem,
  contextFromCity,
  uniqueScopeLevels,
} from '@antojados/api/composables/geo/geo-helpers'
import {
  loadPersistedDeviceCity,
  requestDeviceLocation,
} from '@antojados/api/composables/geo/geo-device'
import {
  loadCityOptions as loadCities,
  findCityByCode,
  applyCity as applyCityHelper,
} from '@antojados/api/composables/geo/geo-city'

// CITY_OPTIONS interna — no exportada (DEBT-021)
const _cityOptions: CityOption[] = []
const state: GeoAppState = createGeoState()

let initPromise: Promise<void> | null = null
let visibilityListenerReady = false

function hasDedicatedBarsPopulated() {
  return Boolean(state.cityScopeCode && state.zoneScopeCode)
}

function defaultScopeState() {
  return {
    scopeLevel: 'mexico' as ScopeLevel,
    scopeCode: state.deviceContext?.context?.countryScopeCode || 'MX_52',
    scopeLabel: state.deviceContext?.context?.countryLabel || 'Mexico',
    pendingScopeLevel: null as ScopeLevel | null,
  }
}

function feedScopeState(feedKey: LocationFeedKey) {
  if (!state.feedScopes[feedKey]) {
    state.feedScopes[feedKey] = defaultScopeState()
  }
  return state.feedScopes[feedKey]
}

function findContextScopeOption(feedKey: LocationFeedKey, level: ScopeLevel, enabledOnly = false): ScopeOption | null {
  const normalized = normalizeLevel(level)
  const item = barForFeedKey(state.activeContext || state.deviceContext, feedKey)
    .filter((entry) => !enabledOnly || entry.enabled)
    .find((entry) => normalizeLevel(entry.scopeLevel) === normalized)
  return item ? optionFromBarItem(item) : null
}

function setScope(level: ScopeLevel, feedKey: LocationFeedKey) {
  const normalized = normalizeLevel(level)
  const contextOption = findContextScopeOption(feedKey, normalized, true)
  const feedState = feedScopeState(feedKey)
  feedState.scopeLevel = normalized

  if (normalized === 'global') {
    feedState.scopeCode = null
    feedState.scopeLabel = contextOption?.label || 'Global'
    return
  }

  if (normalized === 'mexico') {
    feedState.scopeCode = contextOption?.code || state.deviceContext?.context?.countryScopeCode || 'MX_52'
    feedState.scopeLabel = contextOption?.label || state.deviceContext?.context?.countryLabel || 'Mexico'
    return
  }

  if (normalized === 'zona') {
    feedState.scopeCode = contextOption?.code || state.zoneScopeCode || state.zoneCode
    feedState.scopeLabel = contextOption?.label || state.zoneLabel || 'Tu zona'
    return
  }

  feedState.scopeCode = contextOption?.code || state.cityScopeCode || state.cityCode
  feedState.scopeLabel = contextOption?.label || state.cityLabel || 'Ciudad'
}

function applyContext(context: GeoBarContextResponse, feedKey: LocationFeedKey) {
  const resolved = context.context
  state.activeContext = context
  state.cityCode = resolved?.cityCode || null
  state.cityScopeCode = resolved?.cityScopeCode || resolved?.cityCode || null
  state.cityLabel = resolved?.cityLabel || (resolved?.searchRequiredForZoneCity ? 'Elige ciudad' : 'Ciudad')
  state.zoneCode = resolved?.zoneCode || null
  state.zoneScopeCode = resolved?.zoneScopeCode || resolved?.zoneCode || null
  state.zoneLabel = resolved?.zoneLabel || 'Tu zona'

  const defaultItem = barForFeedKey(context, feedKey).find((item) => item.enabled && item.isDefault)
  const defaultLevel = defaultItem?.scopeLevel || (feedKey === 'barrio'
    ? resolved?.barrioDefaultScopeLevel || 'mexico'
    : resolved?.normalDefaultScopeLevel || 'mexico')
  setScope(defaultLevel, feedKey)
}

async function requestDeviceLocationForFeed(
  feedKey: LocationFeedKey,
  preferredScopeLevel?: ScopeLevel | null,
  force = false,
  onlyIfMissing = false,
): Promise<boolean> {
  const resolved = await requestDeviceLocation(state, force, onlyIfMissing)
  if (resolved && state.deviceContext) {
    applyContext(state.deviceContext, feedKey)
    if (preferredScopeLevel && preferredScopeLevel !== 'global' && preferredScopeLevel !== 'mexico') {
      setScope(preferredScopeLevel, feedKey)
      const fs = feedScopeState(feedKey)
      fs.pendingScopeLevel = null
    }
  }
  return resolved
}

async function loadCityOptions(q: string | null = null, limit = 100) {
  const rows = await loadCities(q, limit)
  state.citySearchRows = rows
  _cityOptions.splice(0, _cityOptions.length, ...rows.map(mapCity))
  return rows
}

async function initialize(feedKey: LocationFeedKey) {
  if (!initPromise) {
    state.loading = true
    initPromise = Promise.allSettled([
      loadPersistedDeviceCity(),
      geoService.resolveBarContext(),
      loadCityOptions(null, 100),
    ])
      .then(([persistedResult, contextResult]) => {
        const persistedCity = persistedResult.status === 'fulfilled' ? persistedResult.value : null
        const context = contextResult.status === 'fulfilled' ? contextResult.value : null
        state.persistedDeviceCity = persistedCity
        state.deviceContext = persistedCity ? contextFromCity(persistedCity) : context
        state.initialized = true
      })
      .finally(() => { state.loading = false })
  }

  await initPromise
  if (state.deviceContext) applyContext(state.deviceContext, feedKey)
}

function resetToDevice(feedKey: LocationFeedKey) {
  if (state.deviceContext) applyContext(state.deviceContext, feedKey)
}

function ensureVisibilityReset(feedKey: LocationFeedKey) {
  if (visibilityListenerReady || typeof document === 'undefined') return
  visibilityListenerReady = true
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      void requestDeviceLocationForFeed(feedKey, null, false, true)
    }
  })
}

function scopeOptionFor(feedKey: LocationFeedKey, level: ScopeLevel): ScopeOption {
  const normalized = normalizeLevel(level)
  const contextOption = findContextScopeOption(feedKey, normalized)
  if (contextOption) return contextOption

  if (normalized === 'global') return { level: normalized, label: 'Global', code: null }
  if (normalized === 'mexico') {
    return {
      level: normalized,
      label: state.deviceContext?.context?.countryLabel || 'Mexico',
      code: state.deviceContext?.context?.countryScopeCode || 'MX_52',
    }
  }
  if (normalized === 'zona') {
    return {
      level: normalized,
      label: state.zoneScopeCode ? state.zoneLabel : 'Zona',
      code: state.zoneScopeCode,
      requiresCitySelection: !state.zoneScopeCode,
    }
  }
  if (normalized === 'municipio') {
    return {
      level: normalized,
      label: state.zoneScopeCode ? state.zoneLabel : 'Municipio',
      code: state.zoneScopeCode,
      requiresCitySelection: !state.zoneScopeCode,
    }
  }
  return {
    level: normalized,
    label: state.cityScopeCode ? state.cityLabel : 'Ciudad',
    code: state.cityScopeCode,
    requiresCitySelection: !state.cityScopeCode,
  }
}

export function useLocationScope(feedKey: LocationFeedKey, allowedScopes?: ScopeLevel[]) {
  const searchValue = ref('')
  const selectedScopes = computed(() =>
    uniqueScopeLevels(allowedScopes || DEFAULT_ALLOWED_SCOPES[feedKey]),
  )

  // DEBT-045: initialize debe completarse antes de requestDeviceLocationForFeed
  // para evitar race condition donde el feed carga antes del scope geográfico.
  const initTask = initialize(feedKey).then(() =>
    requestDeviceLocationForFeed(feedKey, null, false, true)
  )

  ensureVisibilityReset(feedKey)

  watch(searchValue, async (value) => {
    const query = value.trim()
    if (query.length < 2) return
    await loadCityOptions(query, 20)
  })

  const cityOptions = computed(() => state.citySearchRows.map(mapCity))
  const suggestions = computed<LocationSuggestion[]>(() => {
    const query = searchValue.value.trim().toLowerCase()
    const source = query
      ? state.citySearchRows.map(mapCity)
          .filter((city) =>
            city.label.toLowerCase().includes(query) || city.code.toLowerCase().includes(query),
          )
          .sort((left, right) => {
            const l = left.label.toLowerCase()
            const r = right.label.toLowerCase()
            const lE = l === query ? 0 : 1
            const rE = r === query ? 0 : 1
            if (lE !== rE) return lE - rE
            const lS = l.startsWith(query) ? 0 : 1
            const rS = r.startsWith(query) ? 0 : 1
            if (lS !== rS) return lS - rS
            return l.localeCompare(r)
          })
      : state.citySearchRows.map(mapCity)

    return source.slice(0, 10).map((city) => ({
      value: city.code,
      label: city.label,
      description: `${city.code} - ${city.metroCode}`,
      city_code: city.code,
      scope_code: city.scopeCode || city.code,
      metro_code: city.metroCode,
    }))
  })

  const scopeOptions = computed<ScopeOption[]>(() => {
    const contextOptions = new Map(
      barForFeedKey(state.activeContext || state.deviceContext, feedKey)
        .map(optionFromBarItem)
        .filter((option) => selectedScopes.value.includes(option.level))
        .map((option) => [option.level, option]),
    )
    return selectedScopes.value.map((level) => contextOptions.get(level) || scopeOptionFor(feedKey, level))
  })

  const activeScopeLevel = computed(() => {
    const fs = feedScopeState(feedKey)
    return selectedScopes.value.includes(fs.scopeLevel) ? fs.scopeLevel : selectedScopes.value[0]
  })

  const activeScopeCode = computed(() => {
    const fs = feedScopeState(feedKey)
    const active = activeScopeLevel.value
    if (active === fs.scopeLevel) return fs.scopeCode
    return scopeOptions.value.find((o) => o.level === active)?.code || null
  })

  function selectScope(level: ScopeLevel) {
    const normalized = normalizeLevel(level)
    if (!selectedScopes.value.includes(normalized)) return
    const fs = feedScopeState(feedKey)
    const option = scopeOptions.value.find((o) => o.level === normalized) || scopeOptionFor(feedKey, normalized)

    if (normalized !== 'global' && normalized !== 'mexico') {
      fs.pendingScopeLevel = normalized
      void requestDeviceLocationForFeed(feedKey, normalized, true)
      if (!option.code) return
    } else {
      fs.pendingScopeLevel = null
    }
    setScope(normalized, feedKey)
    fs.pendingScopeLevel = null
  }

  async function selectCityByCode(code: string, preferredScopeLevel?: ScopeLevel | null) {
    let city = findCityByCode(code, state.citySearchRows)
    if (!city) {
      const rows = await loadCityOptions(code, 20)
      const nc = code.trim().toLowerCase()
      city = findCityByCode(code, rows)
        || rows.find((r) => r.cityLabel.toLowerCase() === nc)
        || rows.find((r) => r.cityLabel.toLowerCase().startsWith(nc))
        || rows[0]
        || null
    }
    if (!city) return
    applyCityHelper(state, city, feedKey, preferredScopeLevel)
    // Rebuild scope from city context
    const context = contextFromCity(city)
    applyContext(context, feedKey)
  }

  function selectSuggestion(suggestion: { city_code?: string; value?: string }) {
    const cityCode = suggestion.city_code || suggestion.value
    if (!cityCode) return
    void selectCityByCode(cityCode)
    searchValue.value = ''
  }

  function requestDeviceGeo(force = true, onlyIfMissing = false) {
    return requestDeviceLocationForFeed(feedKey, null, force, onlyIfMissing)
  }

  return {
    cityCode: computed(() => state.cityCode),
    cityScopeCode: computed(() => state.cityScopeCode),
    cityLabel: computed(() => state.cityLabel),
    metroCode: computed(() => state.zoneCode),
    zoneScopeCode: computed(() => state.zoneScopeCode),
    scopeLevel: activeScopeLevel,
    scopeCode: activeScopeCode,
    scopeLabel: computed(() => feedScopeState(feedKey).scopeLabel),
    cityOptions,
    scopeOptions,
    searchValue,
    suggestions,
    selectScope,
    selectCityByCode,
    selectSuggestion,
    requestDeviceGeo,
    hasDedicatedBarsPopulated: computed(() => hasDedicatedBarsPopulated()),
    resetToDevice: () => resetToDevice(feedKey),
  }
}

export function useGeoScopeMaster() {
  return useLocationScope('pachanga')
}

export type {
  CityOption,
  LocationFeedKey,
  LocationSuggestion,
  ScopeLevel,
  ScopeOption,
} from '@antojados/api/types/location'
