# 02e — Geo System Contract

Version: 1.1.0
Status: actualizado tras refactor DEBT-020
Applies to: shared/api/services/geo/geo.service.ts, shared/api/composables/geo/

## 1. Proposito

Define el sistema de geolocalizacion de las apps. Este sistema es responsable
de resolver la ubicacion del usuario, buscar ciudades, y determinar el contexto
geografico para filtrar contenido.

## 2. Arquitectura del Subsistema Geo

El sistema geo se organiza en una capa de servicio (API calls) y modulos helper
que el composable `useLocationScope` utiliza como ladrillos.

```
shared/api/
├── services/
│   └── geo/
│       └── geo.service.ts              ← Servicio API (llamadas HTTP)
│
├── composables/
│   ├── useLocationScope.ts              ← Orquestador principal (~230 L)
│   └── geo/
│       ├── geo-state.ts                 ← Estado reactivo compartido (GeoAppState)
│       ├── geo-helpers.ts               ← Funciones puras de transformacion
│       ├── geo-device.ts                ← Geolocalizacion GPS y persistencia
│       └── geo-city.ts                  ← Busqueda y gestion de ciudades
```

### 2.1 geo-state.ts

Define el estado reactivo centralizado:

```typescript
export const DEFAULT_ALLOWED_SCOPES: Record<LocationFeedKey, ScopeLevel[]>
export const DEFAULT_SCOPE_LABELS: Partial<Record<ScopeLevel, string>>

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

export function createGeoState(): GeoAppState
```

### 2.2 geo-helpers.ts

Funciones puras de transformacion:

```typescript
export function normalizeLevel(level: ScopeLevel): ScopeLevel
export function mapCity(row: GeoCitySearchItem): { code: string; label: string; metroCode: string; scopeCode: string }
export function barForFeedKey(context: GeoBarContextResponse | null, feedKey: string): GeoBarItem[]
export function optionFromBarItem(item: GeoBarItem): ScopeOption
export function cityFromContext(context: GeoBarContextResponse): GeoCitySearchItem | null
export function contextFromCity(city: GeoCitySearchItem): GeoBarContextResponse
export function uniqueScopeLevels(levels: ScopeLevel[]): ScopeLevel[]
```

### 2.3 geo-device.ts

Geolocalizacion del dispositivo y persistencia:

```typescript
export function onGeoCityChangeRequest(handler: ...): void
export async function loadPersistedDeviceCity(): Promise<GeoCitySearchItem | null>
export async function persistDeviceCity(city: GeoCitySearchItem, updateProfile?: boolean): Promise<void>
export async function getBrowserPosition(): Promise<{ lat: number; lng: number }>
export async function detectDeviceLocation(state: GeoAppState): Promise<boolean>
export async function requestDeviceLocation(state: GeoAppState, force?: boolean, onlyIfMissing?: boolean): Promise<boolean>
```

### 2.4 geo-city.ts

Busqueda de ciudades y aplicacion:

```typescript
export async function loadCityOptions(q?: string | null, limit?: number): Promise<GeoCitySearchItem[]>
export function findCityByCode(code: string | null | undefined, rows?: GeoCitySearchItem[]): GeoCitySearchItem | null
export function applyCity(state: GeoAppState, city: GeoCitySearchItem, feedKey: LocationFeedKey, preferredScopeLevel?: ScopeLevel | null): void
```

## 3. Servicio Geo

El servicio `GeoService` encapsula las llamadas HTTP:

```typescript
class GeoService {
  constructor(private readonly http: AxiosInstance)

  async listScopes(params: ListScopesParams): Promise<GeoScopeCatalogItem[]>
  async searchCities(params: SearchCitiesParams): Promise<GeoCitySearchItem[]>
  async resolveBarContext(params: ResolveGeoParams): Promise<GeoBarContextResponse>
}
```

## 4. Endpoints

| Metodo | Endpoint | Proposito |
|---|---|---|
| listScopes | GET /api/v1/antojados/geo/scopes | Catalogo de scopes geograficos |
| searchCities | GET /api/v1/antojados/geo/cities/search | Busqueda de ciudades |
| resolveBarContext | GET /api/v1/antojados/geo/resolve | Resolver contexto geografico |

### listScopes

```typescript
interface ListScopesParams {
  scopeLevel?: ScopeLevel
  parentScopeCode?: string | null
  q?: string | null           // Busqueda por nombre
  limit?: number
}
```

Retorna un catalogo de scopes disponibles filtrados por nivel y padre.

### searchCities

```typescript
interface SearchCitiesParams {
  q?: string | null
  limit?: number
}
```

Retorna ciudades que coinciden con la busqueda.

```typescript
interface GeoCitySearchItem {
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
```

### resolveBarContext

```typescript
interface ResolveGeoParams {
  lat?: number | null
  lng?: number | null
}
```

Si se pasan coordenadas, resuelve el contexto geografico para esas coordenadas.
Si no se pasan, retorna el contexto por defecto (Mexico).

## 4. Tipos de Datos

```typescript
type ScopeLevel = 'global' | 'mexico' | 'zona' | 'metro' | 'ciudad' | 'municipio'

interface GeoScopeCatalogItem {
  scopeCode: string
  scopeLevel: ScopeLevel
  scopeLabel: string
  parentScopeCode: string | null
  countryCode: string | null
  cityCode: string | null
  zoneCode: string | null
  status: 'active' | 'inactive' | string
}

interface GeoBarContext {
  deviceResolved: boolean              // Si el GPS se resolvio exitosamente
  deviceInCoverage: boolean            // Si el dispositivo esta en area de cobertura
  countryScopeCode: string
  countryCode: string
  countryLabel: string
  zoneScopeCode: string | null
  zoneCode: string | null
  zoneLabel: string | null
  cityScopeCode: string | null
  cityCode: string | null
  cityLabel: string | null
  normalDefaultScopeLevel: ScopeLevel  // Scope default para feeds normales
  normalDefaultScopeCode: string
  barrioDefaultScopeLevel: ScopeLevel  // Scope default para feed barrio
  barrioDefaultScopeCode: string
  globalAvailable: boolean
  searchRequiredForZoneCity: boolean   // Si requiere busqueda manual de ciudad
  deviceDistanceKm: number | null
  detectionConfidence: number | null
  detectionSourceType: string | null   // 'gps' | 'ip' | 'persisted' | 'manual'
}
```

## 5. Flujo de Resolucion de Contexto

```
1. App inicia
2. Se llama a resolveBarContext() sin coordenadas → contexto default (Mexico)
3. Si el usuario da permiso de ubicacion:
   a. navigator.geolocation.getCurrentPosition()
   b. Se obtienen lat/lng
   c. Se llama a resolveBarContext({ lat, lng })
   d. Se obtiene ciudad, zona, pais
4. Si la ciudad detectada es diferente a la persistida:
   a. Se emite evento de cambio de ciudad
   b. Usuario acepta o rechaza
5. El contexto se aplica a todos los feeds
6. La ciudad seleccionada se persiste en secureStorage
```

## 6. Deteccion de Ubicacion del Dispositivo

```typescript
function getBrowserPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
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
```

Configuracion:
- `enableHighAccuracy: true` — usa GPS cuando este disponible
- `maximumAge: 300000` — cachea la posicion por 5 minutos
- `timeout: 12000` — tiempo maximo de espera

## 7. Persistencia

La ciudad seleccionada se persiste en `secureStorage` (Capacitor Preferences)
bajo la clave `antojados.geo.deviceCity`.

```typescript
async function persistDeviceCity(city: GeoCitySearchItem, updateProfile = true): Promise<void> {
  // Guarda en secureStorage
  // Si updateProfile es true, actualiza el perfil del usuario en la API
}
```

## 8. Eventos de Geo

El sistema emite eventos via el bus de eventos global (`eventBus`) para comunicar cambios de ubicacion:

| Evento | Proposito | Disparado por |
|---|---|---|
| `geo:permission-request` | Solicitar permiso de ubicacion | `detectDeviceLocation()` |
| `geo:city-change-request` | Notificar cambio de ciudad detectado | `detectDeviceLocation()` |

Estos eventos son escuchados por `MainLayout.vue` que muestra notificaciones
al usuario.

El bus de eventos (`@antojados/ui/services/eventBus`) reemplazo el uso anterior de
`window.CustomEvent` que era fragil y dificil de debuggear. El bus ofrece:

```typescript
import { eventBus, GeoEvents } from '@antojados/ui/services/eventBus'

// Emitir
eventBus.emit(GeoEvents.CITY_CHANGE_REQUEST, { city, currentCityCode, accept })

// Escuchar (retorna funcion de cleanup)
const off = eventBus.on(GeoEvents.CITY_CHANGE_REQUEST, (payload) => { ... })
onBeforeUnmount(() => off())
```

## 9. Reglas No Negociables

- La ubicacion del dispositivo siempre se obtiene via `navigator.geolocation`
- Si el GPS falla, se usa el contexto por defecto (Mexico)
- La ciudad siempre se persiste para evitar preguntar cada vez
- El contexto geografico siempre se resuelve via la API (nunca hardcodeado)
- Los eventos de geo se disparan con un throttle de 15 segundos
- La deteccion de ubicacion no debe bloquear la carga del feed

## 10. Prohibiciones

- No hardcodear coordenadas o ciudades en los componentes
- No usar IP-based geolocation como sustituto del GPS
- No almacenar coordenadas exactas del usuario (solo ciudad/scope)
- No hacer polling de ubicacion (solo cuando el usuario interactua o la app vuelve a foreground)
- No asumir que el GPS siempre esta disponible

## 11. ⚠️ Deuda Tecnica Identificada (actualizado tras DEBT-020 y DEBT-022)

- **RESUELTO**: `useLocationScope.ts` separado en 4 modulos helper (DEBT-020)
- **RESUELTO**: `CITY_OPTIONS` ahora es variable mutable con readonly semantico
- **RESUELTO**: Eventos window (`CustomEvent`) migrados a bus Vue (DEBT-022)
- **PENDIENTE**: `detectDeviceLocation()` deberia estar en `GeoService` en lugar de `geo-device.ts`
- **PENDIENTE**: No hay fallback si `navigator.geolocation` no esta disponible
- **PENDIENTE**: No hay metricas de rendimiento de resolucion de geo

## 12. Historial

| Version | Fecha | Cambio |
|---|---|---|
| 1.0.0 | 28/06/2026 | Contrato inicial |
| 1.1.0 | 28/06/2026 | Actualizado tras DEBT-020: nueva arquitectura de modulos helper geo/ |
| 1.2.0 | 12/07/2026 | Actualizado tras DEBT-022: eventos window migrados a eventBus |

