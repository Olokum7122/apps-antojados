import { reactive } from 'vue'
import type {
  GeoBarContextResponse,
  GeoCitySearchItem,
  LocationFeedKey,
  ScopeLevel,
} from '@antojados/api/types/location'

export const DEFAULT_ALLOWED_SCOPES: Record<LocationFeedKey, ScopeLevel[]> = {
  vas_ir: ['mexico', 'zona', 'ciudad'],
  arre: ['mexico', 'zona', 'ciudad'],
  los_chidos: ['mexico', 'zona', 'ciudad'],
  barrio: ['mexico', 'ciudad'],
  pachanga: ['mexico', 'zona', 'ciudad'],
  la_neta: ['mexico', 'zona', 'ciudad'],
  que_pex: ['mexico', 'zona', 'ciudad'],
  desma: ['mexico', 'zona', 'ciudad'],
}

export const DEFAULT_SCOPE_LABELS: Partial<Record<ScopeLevel, string>> = {
  global: 'Global',
  mexico: 'Mexico',
  zona: 'Zona',
  ciudad: 'Ciudad',
  municipio: 'Municipio',
}

export interface GeoAppState {
  initialized: boolean
  loading: boolean
  deviceContext: GeoBarContextResponse | null
  activeContext: GeoBarContextResponse | null
  citySearchRows: GeoCitySearchItem[]
  persistedDeviceCity: GeoCitySearchItem | null
  cityCode: string | null
  cityScopeCode: string | null
  cityLabel: string
  zoneCode: string | null
  zoneScopeCode: string | null
  zoneLabel: string
  feedScopes: Record<LocationFeedKey, FeedScopeState>
}

export interface FeedScopeState {
  scopeLevel: ScopeLevel
  scopeCode: string | null
  scopeLabel: string
  pendingScopeLevel: ScopeLevel | null
}

export function createGeoState(): GeoAppState {
  return reactive({
    initialized: false,
    loading: false,
    deviceContext: null,
    activeContext: null,
    citySearchRows: [],
    persistedDeviceCity: null,
    cityCode: null,
    cityScopeCode: null,
    cityLabel: 'Elige ciudad',
    zoneCode: null,
    zoneScopeCode: null,
    zoneLabel: 'Tu zona',
    feedScopes: {} as Record<LocationFeedKey, FeedScopeState>,
  }) as GeoAppState
}
