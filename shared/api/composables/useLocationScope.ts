import { computed, reactive, ref, watch } from 'vue'
import { authService, geoService } from '@antojados/api/services'
import { secureStorage } from '@antojados/api/storage/secure-storage'
import type {
  CityOption,
  GeoBarContextResponse,
  GeoBarItem,
  GeoCitySearchItem,
  LocationFeedKey,
  LocationSuggestion,
  ScopeLevel,
  ScopeOption,
} from '@antojados/api/types/location'

export const CITY_OPTIONS: CityOption[] = []

const DEVICE_CITY_KEY = 'antojados.geo.deviceCity'
const GEO_PERMISSION_NOTICE_EVENT = 'antojados:geo-permission-request'
const GEO_CITY_CHANGE_EVENT = 'antojados:geo-city-change-request'
const GEO_PERMISSION_MESSAGE = 'Usamos tu ubicacion para mostrar publicaciones por ciudad y zona.'

export const DEFAULT_ALLOWED_SCOPES: Record<LocationFeedKey, ScopeLevel[]> = {
  vas_ir: ['mexico', 'zona', 'ciudad'],
  arre: ['mexico', 'zona', 'ciudad'],
  los_chidos: ['mexico', 'zona', 'ciudad'],
  barrio: ['mexico', 'ciudad'],
  pachanga: ['mexico', 'zona', 'ciudad'],
  la_neta: ['mexico', 'zona', 'ciudad'],
  desma: ['mexico', 'zona', 'ciudad'],
}

const DEFAULT_SCOPE_LABELS: Partial<Record<ScopeLevel, string>> = {
  global: 'Global',
  mexico: 'Mexico',
  zona: 'Zona',
  ciudad: 'Ciudad',
  municipio: 'Municipio',
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
  feedScopes: {} as Record<LocationFeedKey, {
    scopeLevel: ScopeLevel
    scopeCode: string | null
    scopeLabel: string
    pendingScopeLevel: ScopeLevel | null
  }>,
})

let initPromise: Promise<void> | null = null
let visibilityListenerReady = false
let deviceLocationPromise: Promise<boolean> | null = null
let lastDeviceLocationAttemptAt = 0

function emitGeoPermissionNotice() {
  if (typeof window === 'undefined' || typeof CustomEvent === 'undefined') return
  window.dispatchEvent(new CustomEvent(GEO_PERMISSION_NOTICE_EVENT, {
    detail: { message: GEO_PERMISSION_MESSAGE },
  }))
}

function emitGeoCityChangeRequest(city: GeoCitySearchItem, currentCityCode: string | null, accept: () => Promise<void>) {
  if (typeof window === 'undefined' || typeof CustomEvent === 'undefined') return
  window.dispatchEvent(new CustomEvent(GEO_CITY_CHANGE_EVENT, {
    detail: {
      city,
      currentCityCode,
      message: `Detectamos que estas en ${city.cityLabel}.`,
      accept,
    },
  }))
}
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

function barForFeedKey(context: GeoBarContextResponse | null, feedKey: LocationFeedKey): GeoBarItem[] {
  if (!context) return []

  if (feedKey === 'barrio') {
    const source = context.barrioBar || context.normalBar || []
    const mexico = source.find((item) => normalizeLevel(item.scopeLevel) === 'mexico')
    const ciudad = source.find((item) => normalizeLevel(item.scopeLevel) === 'ciudad')
    const fallbackCode = context.context?.countryScopeCode || 'MX_52'
    const fallbackLabel = context.context?.countryLabel || 'Mexico'
    return [
      mexico ? { ...mexico, enabled: true, isDefault: true } : { order: 1, scopeLevel: 'mexico', scopeCode: fallbackCode, scopeLabel: fallbackLabel, enabled: true, isDefault: true },
      ...(ciudad ? [{ ...ciudad, enabled: true, isDefault: false }] : []),
    ]
  }

  return context.normalBar || []
}

function optionFromBarItem(item: GeoBarItem): ScopeOption {
  const level = normalizeLevel(item.scopeLevel)
  const rawLabel = String(item.scopeLabel || '').trim()
  return {
    level,
    label: !rawLabel || rawLabel.toLowerCase() === level ? DEFAULT_SCOPE_LABELS[level] || level : rawLabel,
    code: item.scopeCode || null,
    requiresCitySelection: !item.enabled && (level === 'zona' || level === 'ciudad' || level === 'municipio'),
  }
}

function defaultScopeState(): { scopeLevel: ScopeLevel; scopeCode: string | null; scopeLabel: string; pendingScopeLevel: ScopeLevel | null } {
  return {
    scopeLevel: 'mexico',
    scopeCode: state.deviceContext?.context?.countryScopeCode || 'MX_52',
    scopeLabel: state.deviceContext?.context?.countryLabel || 'Mexico',
    pendingScopeLevel: null,
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

function uniqueScopeLevels(levels: ScopeLevel[]): ScopeLevel[] {
  return Array.from(new Set(levels.map(normalizeLevel)))
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

function applyCity(
  row: GeoCitySearchItem,
  preferredScopeLevel?: ScopeLevel | null,
  feedKey: LocationFeedKey = 'los_chidos',
) {
  state.activeContext = contextFromCity(row)
  state.cityCode = row.cityCode
  state.cityScopeCode = row.cityScopeCode
  state.cityLabel = row.cityLabel
  state.zoneCode = row.zoneCode
  state.zoneScopeCode = row.zoneScopeCode
  state.zoneLabel = row.zoneLabel
  const feedState = feedScopeState(feedKey)
  const preferred = preferredScopeLevel || feedState.pendingScopeLevel || 'ciudad'
  feedState.pendingScopeLevel = null
  setScope(preferred, feedKey)

  if (feedKey === 'barrio' && preferred === 'ciudad') {
    for (const relatedFeed of ['vas_ir', 'arre', 'los_chidos'] as LocationFeedKey[]) {
      setScope('ciudad', relatedFeed)
    }
  }
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

async function persistDeviceCity(city: GeoCitySearchItem, updateProfile = true) {
  state.persistedDeviceCity = city
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

async function acceptDetectedDeviceCity(city: GeoCitySearchItem) {
  await persistDeviceCity(city, true)
  state.deviceContext = contextFromCity(city)
  applyDeviceCity(city)
  for (const feedKey of Object.keys(state.feedScopes) as LocationFeedKey[]) {
    setScope(feedScopeState(feedKey).scopeLevel, feedKey)
  }
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

function hasDedicatedBarsPopulated() {
  return Boolean(state.cityScopeCode && state.zoneScopeCode)
}

async function detectDeviceLocation(): Promise<boolean> {
  const coords = await getBrowserPosition()
  const context = await geoService.resolveBarContext(coords)
  const city = cityFromContext(context)
  if (!city) return false

  const session = await authService.getSession().catch(() => null)
  const currentCityCode = session?.cityCode || state.persistedDeviceCity?.cityCode || null
  if (currentCityCode && currentCityCode !== city.cityCode) {
    emitGeoCityChangeRequest(city, currentCityCode, () => acceptDetectedDeviceCity(city))
    return false
  }

  await persistDeviceCity(city, true)
  state.deviceContext = context
  applyDeviceCity(city)
  return true
}

async function requestDeviceLocationForFeed(
  feedKey: LocationFeedKey,
  preferredScopeLevel?: ScopeLevel | null,
  force = false,
  onlyIfMissing = false,
): Promise<boolean> {
  const now = Date.now()
  if (onlyIfMissing && hasDedicatedBarsPopulated()) return false
  if (deviceLocationPromise) return deviceLocationPromise
  if (!force && now - lastDeviceLocationAttemptAt < 15000) return false

  lastDeviceLocationAttemptAt = now
  emitGeoPermissionNotice()
  deviceLocationPromise = detectDeviceLocation()
    .then((resolved) => {
      if (!resolved) return false
      if (state.deviceContext) {
        applyContext(state.deviceContext, feedKey)
      }

      const feedState = feedScopeState(feedKey)
      if (preferredScopeLevel && preferredScopeLevel !== 'global' && preferredScopeLevel !== 'mexico') {
        setScope(preferredScopeLevel, feedKey)
        feedState.pendingScopeLevel = null
      }
      return true
    })
    .catch(() => false)
    .finally(() => {
      deviceLocationPromise = null
    })

  return deviceLocationPromise
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

function findCityByCode(code: string | null | undefined): GeoCitySearchItem | null {
  return state.citySearchRows.find((city) => city.cityCode === code || city.cityScopeCode === code) || null
}

export function useLocationScope(feedKey: LocationFeedKey, allowedScopes?: ScopeLevel[]) {
  const searchValue = ref('')
  const selectedScopes = computed(() => {
    // iOS/TestFlight parity: dedicated bars must keep their scopes visible; API enabled flags
    // only decide whether zone/city already have a resolved scope code.
    return uniqueScopeLevels(allowedScopes || DEFAULT_ALLOWED_SCOPES[feedKey])
  })

  void initialize(feedKey).then(() => requestDeviceLocationForFeed(feedKey, null, false, true))
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
      ? state.cityOptions
        .filter(
          (city) =>
            city.label.toLowerCase().includes(query) || city.code.toLowerCase().includes(query),
        )
        .sort((left, right) => {
          const leftLabel = left.label.toLowerCase()
          const rightLabel = right.label.toLowerCase()
          const leftExact = leftLabel === query ? 0 : 1
          const rightExact = rightLabel === query ? 0 : 1
          if (leftExact !== rightExact) return leftExact - rightExact
          const leftStarts = leftLabel.startsWith(query) ? 0 : 1
          const rightStarts = rightLabel.startsWith(query) ? 0 : 1
          if (leftStarts !== rightStarts) return leftStarts - rightStarts
          return leftLabel.localeCompare(rightLabel)
        })
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
    const feedState = feedScopeState(feedKey)
    return selectedScopes.value.includes(feedState.scopeLevel) ? feedState.scopeLevel : selectedScopes.value[0]
  })
  const activeScopeCode = computed(() => {
    const feedState = feedScopeState(feedKey)
    const active = activeScopeLevel.value
    if (active === feedState.scopeLevel) return feedState.scopeCode
    return scopeOptions.value.find((option) => option.level === active)?.code || null
  })

  function selectScope(level: ScopeLevel) {
    const normalized = normalizeLevel(level)
    if (!selectedScopes.value.includes(normalized)) return
    const feedState = feedScopeState(feedKey)
    const option = scopeOptions.value.find((item) => item.level === normalized) || scopeOptionFor(feedKey, normalized)
    if (normalized !== 'global' && normalized !== 'mexico') {
      feedState.pendingScopeLevel = normalized
      void requestDeviceLocationForFeed(feedKey, normalized, true)
      if (!option.code) return
    } else {
      feedState.pendingScopeLevel = null
    }

    setScope(normalized, feedKey)
    feedState.pendingScopeLevel = null
  }

  async function selectCityByCode(code: string, preferredScopeLevel?: ScopeLevel | null) {
    let city = findCityByCode(code)
    if (!city) {
      const rows = await loadCityOptions(code, 20)
      const normalizedCode = code.trim().toLowerCase()
      city = rows.find((row) => row.cityCode === code || row.cityScopeCode === code)
        || rows.find((row) => row.cityLabel.toLowerCase() === normalizedCode)
        || rows.find((row) => row.cityLabel.toLowerCase().startsWith(normalizedCode))
        || rows[0]
        || null
    }
    if (!city) return
    applyCity(city, preferredScopeLevel, feedKey)
  }

  function selectSuggestion(suggestion: { city_code?: string; value?: string }) {
    const cityCode = suggestion.city_code || suggestion.value
    if (!cityCode) return
    void selectCityByCode(cityCode)
    searchValue.value = ''
  }

  async function requestDeviceGeo(force = true, onlyIfMissing = false) {
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
