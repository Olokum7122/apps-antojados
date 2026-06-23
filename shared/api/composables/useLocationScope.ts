import { computed, reactive, ref, watch } from 'vue'
import { geoService } from '@antojados/api/services'
import { secureStorage } from '@antojados/api/storage/secure-storage'
import type {
  CityOption,
  GeoBarContextResponse,
  GeoCitySearchItem,
  LocationFeedKey,
  LocationSuggestion,
  ScopeLevel,
  ScopeOption,
} from '@antojados/api/types/location'

export const CITY_OPTIONS: CityOption[] = []

const DEVICE_CITY_KEY = 'antojados.geo.deviceCity'

export const DEFAULT_ALLOWED_SCOPES: Record<LocationFeedKey, ScopeLevel[]> = {
  vas_ir: ['mexico', 'zona', 'ciudad'],
  arre: ['mexico', 'zona', 'ciudad'],
  los_chidos: ['mexico', 'zona', 'ciudad'],
  barrio: ['global', 'mexico', 'zona', 'ciudad'],
  pachanga: ['mexico', 'zona', 'ciudad'],
  la_neta: ['mexico', 'zona', 'ciudad'],
  desma: ['mexico', 'zona', 'ciudad'],
}

const state = reactive({
  initialized: false,
  loading: false,
  deviceContext: null as GeoBarContextResponse | null,
  activeContext: null as GeoBarContextResponse | null,
  cityOptions: [] as CityOption[],
  citySearchRows: [] as GeoCitySearchItem[],
  persistedDeviceCity: null as GeoCitySearchItem | null,
  cityCode: null as string | null,
  cityScopeCode: null as string | null,
  cityLabel: 'Elige ciudad',
  zoneCode: null as string | null,
  zoneScopeCode: null as string | null,
  zoneLabel: 'Tu zona',
  scopeLevel: 'mexico' as ScopeLevel,
  scopeCode: 'MX_52' as string | null,
  scopeLabel: 'Mexico',
})

let initPromise: Promise<void> | null = null
let visibilityListenerReady = false

function normalizeLevel(level: ScopeLevel): ScopeLevel {
  return level === 'metro' ? 'zona' : level
}

function mapCity(row: GeoCitySearchItem): CityOption {
  return {
    code: row.cityCode,
    label: row.cityLabel,
    metroCode: row.zoneCode,
    scopeCode: row.cityScopeCode,
  }
}

function setScope(level: ScopeLevel) {
  const normalized = normalizeLevel(level)
  state.scopeLevel = normalized

  if (normalized === 'global') {
    state.scopeCode = null
    state.scopeLabel = 'Global'
    return
  }

  if (normalized === 'mexico') {
    state.scopeCode = 'MX_52'
    state.scopeLabel = 'Mexico'
    return
  }

  if (normalized === 'zona') {
    state.scopeCode = state.zoneScopeCode || state.zoneCode
    state.scopeLabel = state.zoneLabel || 'Tu zona'
    return
  }

  state.scopeCode = state.cityScopeCode || state.cityCode
  state.scopeLabel = state.cityLabel || 'Ciudad'
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

  const defaultLevel = feedKey === 'barrio'
    ? resolved?.barrioDefaultScopeLevel || 'mexico'
    : resolved?.normalDefaultScopeLevel || 'mexico'
  setScope(defaultLevel)
}

function applyCity(row: GeoCitySearchItem) {
  state.cityCode = row.cityCode
  state.cityScopeCode = row.cityScopeCode
  state.cityLabel = row.cityLabel
  state.zoneCode = row.zoneCode
  state.zoneScopeCode = row.zoneScopeCode
  state.zoneLabel = row.zoneLabel
  setScope('ciudad')
}

function cityFromContext(context: GeoBarContextResponse): GeoCitySearchItem | null {
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

function contextFromCity(city: GeoCitySearchItem): GeoBarContextResponse {
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

async function loadPersistedDeviceCity(): Promise<GeoCitySearchItem | null> {
  const raw = await secureStorage.get(DEVICE_CITY_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as GeoCitySearchItem
  } catch {
    await secureStorage.remove(DEVICE_CITY_KEY)
    return null
  }
}

async function persistDeviceCity(city: GeoCitySearchItem) {
  state.persistedDeviceCity = city
  await secureStorage.set(DEVICE_CITY_KEY, JSON.stringify(city))
}

function getBrowserPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('geolocation_unavailable'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      }),
      reject,
      { enableHighAccuracy: true, maximumAge: 300000, timeout: 12000 },
    )
  })
}

function applyDeviceCity(city: GeoCitySearchItem) {
  state.cityCode = city.cityCode
  state.cityScopeCode = city.cityScopeCode
  state.cityLabel = city.cityLabel
  state.zoneCode = city.zoneCode
  state.zoneScopeCode = city.zoneScopeCode
  state.zoneLabel = city.zoneLabel
}

async function detectDeviceLocation(): Promise<boolean> {
  const coords = await getBrowserPosition()
  const context = await geoService.resolveBarContext(coords)
  const city = cityFromContext(context)
  if (!city) return false
  await persistDeviceCity(city)
  state.deviceContext = context
  applyDeviceCity(city)
  return true
}

async function loadCityOptions(q: string | null = null, limit = 100) {
  const rows = await geoService.searchCities({ q, limit })
  state.citySearchRows = rows
  state.cityOptions = rows.map(mapCity)
  CITY_OPTIONS.splice(0, CITY_OPTIONS.length, ...state.cityOptions)
  return rows
}

async function initialize(feedKey: LocationFeedKey) {
  if (!initPromise) {
    state.loading = true
    initPromise = Promise.all([
      loadPersistedDeviceCity(),
      geoService.resolveBarContext(),
      loadCityOptions(null, 100),
    ])
      .then(([persistedCity, context]) => {
        state.persistedDeviceCity = persistedCity
        state.deviceContext = persistedCity ? contextFromCity(persistedCity) : context
        state.initialized = true
      })
      .finally(() => {
        state.loading = false
      })
  }

  await initPromise
  if (state.deviceContext) {
    applyContext(state.deviceContext, feedKey)
  }
}

function resetToDevice(feedKey: LocationFeedKey) {
  if (state.deviceContext) {
    applyContext(state.deviceContext, feedKey)
  }
}

function ensureVisibilityReset(feedKey: LocationFeedKey) {
  if (visibilityListenerReady || typeof document === 'undefined') return
  visibilityListenerReady = true
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      resetToDevice(feedKey)
    }
  })
}

function scopeOptionFor(level: ScopeLevel): ScopeOption {
  const normalized = normalizeLevel(level)
  if (normalized === 'global') return { level: normalized, label: 'Global', code: null }
  if (normalized === 'mexico') return { level: normalized, label: 'Mexico', code: 'MX_52' }
  if (normalized === 'zona') return { level: normalized, label: state.zoneScopeCode ? state.zoneLabel : 'Zona', code: state.zoneScopeCode }
  if (normalized === 'municipio') return { level: normalized, label: state.zoneScopeCode ? state.zoneLabel : 'Municipio', code: state.zoneScopeCode }
  return { level: normalized, label: state.cityScopeCode ? state.cityLabel : 'Ciudad', code: state.cityScopeCode }
}

function findCityByCode(code: string | null | undefined): GeoCitySearchItem | null {
  return state.citySearchRows.find((city) => city.cityCode === code || city.cityScopeCode === code) || null
}

export function useLocationScope(feedKey: LocationFeedKey, allowedScopes?: ScopeLevel[]) {
  const searchValue = ref('')
  const selectedScopes = computed(() => (allowedScopes || DEFAULT_ALLOWED_SCOPES[feedKey]).map(normalizeLevel))

  void initialize(feedKey)
  ensureVisibilityReset(feedKey)

  watch(searchValue, async (value) => {
    const query = value.trim()
    if (query.length < 2) return
    await loadCityOptions(query, 20)
  })

  const cityOptions = computed(() => state.cityOptions)
  const suggestions = computed<LocationSuggestion[]>(() => {
    const query = searchValue.value.trim().toLowerCase()
    const source = query
      ? state.cityOptions.filter(
        (city) =>
          city.label.toLowerCase().includes(query) || city.code.toLowerCase().includes(query),
      )
      : state.cityOptions

    return source.slice(0, 10).map((city) => ({
      value: city.code,
      label: city.label,
      description: `${city.code} - ${city.metroCode}`,
      city_code: city.code,
      scope_code: city.scopeCode || city.code,
      metro_code: city.metroCode,
    }))
  })

  const scopeOptions = computed<ScopeOption[]>(() => selectedScopes.value.map(scopeOptionFor))
  const activeScopeLevel = computed(() =>
    selectedScopes.value.includes(state.scopeLevel) ? state.scopeLevel : selectedScopes.value[0],
  )
  const activeScopeCode = computed(() => {
    const active = activeScopeLevel.value
    if (active === state.scopeLevel) return state.scopeCode
    return scopeOptionFor(active).code
  })

  function selectScope(level: ScopeLevel) {
    const normalized = normalizeLevel(level)
    if (!selectedScopes.value.includes(normalized)) return
    if (normalized !== 'global' && normalized !== 'mexico' && !scopeOptionFor(normalized).code) {
      void detectDeviceLocation().then((resolved) => {
        if (resolved && scopeOptionFor(normalized).code) setScope(normalized)
      })
      return
    }
    setScope(normalized)
  }

  async function selectCityByCode(code: string) {
    let city = findCityByCode(code)
    if (!city) {
      const rows = await loadCityOptions(code, 10)
      city = rows.find((row) => row.cityCode === code || row.cityScopeCode === code) || rows[0] || null
    }
    if (!city) return
    applyCity(city)
  }

  function selectSuggestion(suggestion: { city_code?: string; value?: string }) {
    const cityCode = suggestion.city_code || suggestion.value
    if (!cityCode) return
    void selectCityByCode(cityCode)
    searchValue.value = ''
  }

  async function requestDeviceGeo() {
    const resolved = await detectDeviceLocation()
    if (resolved) resetToDevice(feedKey)
    return resolved
  }

  return {
    cityCode: computed(() => state.cityCode),
    cityScopeCode: computed(() => state.cityScopeCode),
    cityLabel: computed(() => state.cityLabel),
    metroCode: computed(() => state.zoneCode),
    zoneScopeCode: computed(() => state.zoneScopeCode),
    scopeLevel: activeScopeLevel,
    scopeCode: activeScopeCode,
    scopeLabel: computed(() => state.scopeLabel),
    cityOptions,
    scopeOptions,
    searchValue,
    suggestions,
    selectScope,
    selectCityByCode,
    selectSuggestion,
    requestDeviceGeo,
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
