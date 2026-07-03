# 02d — Dimensions & Locations Contract

Version: 1.0.0
Status: baseline
Applies to: shared/ui/dimensions/

## 1. Proposito

Define el sistema de dimensiones (navegacion) y ubicaciones (scope geografico)
de las apps. Este sistema es el corazon de la navegacion y el filtrado de
contenido por ciudad/zona.

## 2. Sistema de Dimensiones

Cada pantalla, area y accion tiene un codigo de dimension unico que permite:

1. **Analitica** — trackear que pantallas se visitan
2. **Permisos** — controlar acceso basado en rol (sponsor vs user)
3. **Navegacion** — resolver tabs activos basado en la ruta
4. **Metadata** — describir proposito de cada vista

### Estructura de codigos

```
{RAIZ}.{MODULO}.{AREA}.{COMPONENTE}.{ACCION}

Ejemplo completo:
ANTOJADOSMX.ANTOJO.VAS_IR.BIZ_FEED.BTN_PUBLICAR
```

### Niveles

| Nivel | Descripcion | Ejemplo |
|---|---|---|
| MODULE | Tab principal del footer | ANTOJADOSMX.ANTOJO |
| AREA | Seccion dentro de un modulo | ANTOJOS.PARA_TI |
| COMPONENT | Vista especifica | ANTOJOS.PARA_TI.QUE_PEX |
| BUTTON | Accion granular | ANTOJOS.PARA_TI.QUE_PEX.BTN_PUBLICAR |

### Modulos principales

| Codigo | Nombre | Ruta base |
|---|---|---|
| ANTOJADOSMX.ANTOJO | Antojo | /antojo/ |
| ANTOJADOSMX.ANTOJADOS | Antojados (Red) | /red/ |
| ANTOJADOSMX.TRAGON | Tragon (Yo) | /yo/ |

### Areas por modulo

**Antojo (ANTOJADOSMX.ANTOJO):**
| Area | Codigo | Ruta |
|---|---|---|
| Vas Ir | ANTOJO.VAS_IR | /antojo/vas-ir/ |
| Arre | ANTOJO.ARRE | /antojo/arre/ |
| Los Chidos | ANTOJO.LOS_CHIDOS | /antojo/los-chidos |
| No Vas Ir | ANTOJO.NO_VAS_IR | /antojo/no-vas-ir |
| Mi Chamba | ANTOJO.MI_CHAMBA | /antojo/mi-chamba/ |

**Antojados (ANTOJADOSMX.ANTOJADOS):**
| Area | Codigo | Ruta |
|---|---|---|
| Barrio | ANTOJADOS.BARRIO | /red/barrio/ |
| Para Ti | ANTOJADOS.PARA_TI | /red/pa-ti/ |
| En el Desma | ANTOJADOS.EN_EL_DESMA | /red/en-el-desma |
| La Banda | ANTOJADOS.COMUNIDAD | /red/la-banda/ |
| Mi Rollo | ANTOJADOS.MI_ROLLO | /red/mi-rollo |

## 3. Tabs de Navegacion

### Footer tabs (MainLayout)

Definidos en `navigationDimensions.js` como `MAIN_TABS`:

```typescript
const MAIN_TABS = [
  { name: 'antojo',   to: '/antojo/vas-ir/gallery', label: 'Antojo',    icon: 'storefront', ... },
  { name: 'red',      to: '/red/barrio',             label: 'Antojados', icon: 'groups',     ... },
  { name: 'yo',       to: '/yo',                     label: 'Tragon',    icon: 'person',     ... },
]
```

### Tabs secundarios

Cada area puede tener su propia tab bar:

**Antojo tabs** (`ANTOJO_TABS`): Vas Ir, Arre, Los Chidos, No Vas Ir, Mi Chamba
**Red tabs** (`RED_TABS`): Barrio, Para Ti, En el Desma, La Banda, Mi Rollo
**Para Ti tabs** (`PA_TI_TABS`): Pachanga, Que Pex
**La Banda tabs** (`LA_BANDA_TABS`): Acarreados
**Mi Chamba tabs** (`MI_CHAMBA_TABS`): Registro, E-firma, Contrato, Atencion, Cuenta, Modulos, Tiles, Metricas, Equipo
**Tragon tabs** (`TRAGON_TABS`): Bandeja, Perfil

### FABs de publicacion

```typescript
const GRANULAR_BUTTONS = [
  { name: 'vas-ir-publicar-fab', ... },  // ANTOJO.VAS_IR.BIZ_FEED.BTN_PUBLICAR
  { name: 'arre-publicar-fab', ... },    // ANTOJO.ARRE.ARRE_FEED.BTN_PUBLICAR
]
```

## 4. Resolucion de Tabs

Funciones helper en `navigationDimensions.js`:

| Funcion | Proposito |
|---|---|
| `findTabByName(tabs, name)` | Busca un tab por nombre |
| `resolveAntojoTab(path)` | Determina tab activo de Antojo segun la ruta |
| `resolveRedTab(path)` | Determina tab activo de Red segun la ruta |
| `resolvePaTiTab(path)` | Determina tab activo de Para Ti |
| `resolveLaBandaTab(path)` | Determina tab activo de La Banda |

```typescript
function resolveAntojoTab(path: string): string {
  if (path.includes('/arre')) return 'arre'
  if (path.includes('/los-chidos')) return 'los-chidos'
  if (path.includes('/no-vas-ir')) return 'no-vas-ir'
  if (path.includes('/mi-chamba')) return 'mi-chamba'
  return 'vas-ir' // default
}
```

## 5. Contextos de Dimension

Definidos en `DIMENSION_CONTEXTS`:

```typescript
const DIMENSION_CONTEXTS = {
  MAIN:       { level: 'MODULE',    code: 'ANTOJADOSMX',          label: 'AntojadosMX' },
  ANTOJO:     { level: 'MODULE',    code: 'ANTOJADOSMX.ANTOJO',   label: 'Antojo' },
  RED:        { level: 'MODULE',    code: 'ANTOJADOS',            label: 'Antojados' },
  PARA_TI:    { level: 'AREA',      code: 'ANTOJADOS.PARA_TI',    label: 'Para Ti' },
  COMUNIDAD:  { level: 'AREA',      code: 'ANTOJADOS.COMUNIDAD',  label: 'Comunidad' },
  VAS_IR:     { level: 'AREA',      code: 'ANTOJO.VAS_IR',        label: 'Vas Ir' },
  ARRE:       { level: 'AREA',      code: 'ANTOJO.ARRE',          label: 'Arre' },
  MI_CHAMBA:  { level: 'COMPONENT', code: 'ANTOJO.MI_CHAMBA',     label: 'Mi Chamba' },
  YO:         { level: 'MODULE',    code: 'TRAGON',               label: 'Tragon' },
}
```

## 6. Sistema de Ubicacion (Scope)

El sistema de ubicacion permite filtrar contenido por nivel geografico.
Su implementacion se organiza en modulos helper dentro de `shared/api/composables/geo/`.

### Arquitectura

```
useLocationScope.ts          ← Orquestador (~230 L, antes ~370 L)
└── geo/
    ├── geo-state.ts         ← Estado reactivo compartido
    ├── geo-helpers.ts       ← Funciones puras de transformacion
    ├── geo-device.ts        ← GPS, persistencia, eventos
    └── geo-city.ts          ← Busqueda de ciudades
```

### Niveles de Scope

```typescript
type ScopeLevel = 'global' | 'mexico' | 'zona' | 'metro' | 'ciudad' | 'municipio'
```

### Scopes permitidos por feed

```typescript
const DEFAULT_ALLOWED_SCOPES: Record<LocationFeedKey, ScopeLevel[]> = {
  vas_ir:     ['mexico', 'zona', 'ciudad'],
  arre:       ['mexico', 'zona', 'ciudad'],
  los_chidos: ['mexico', 'zona', 'ciudad'],
  barrio:     ['mexico', 'ciudad'],
  pachanga:   ['mexico', 'zona', 'ciudad'],
  que_pex:    ['mexico', 'zona', 'ciudad'],
  desma:      ['mexico', 'zona', 'ciudad'],
}
```

### Composable useLocationScope

```typescript
function useLocationScope(feedKey: LocationFeedKey, allowedScopes?: ScopeLevel[]) {
  return {
    cityCode, cityScopeCode, cityLabel,
    metroCode, zoneScopeCode,
    scopeLevel, scopeCode, scopeLabel,
    cityOptions, scopeOptions,
    searchValue, suggestions,
    selectScope(level: ScopeLevel): void
    selectCityByCode(code: string): Promise<void>
    selectSuggestion(suggestion): void
    requestDeviceGeo(force?: boolean): Promise<boolean>
    hasDedicatedBarsPopulated: ComputedRef<boolean>
    resetToDevice(): void
  }
}
```

## 7. Flujo de Ubicacion

```
1. App inicia → initialize(feedKey)
2. Carga ciudad persistida (secureStorage)
3. Llama a geoService.resolveBarContext() para obtener contexto
4. Si hay GPS disponible, detecta ubicacion del dispositivo
5. Si la ciudad detectada difiere de la persistida, emite evento de cambio
6. El usuario acepta o rechaza el cambio de ciudad
7. El scope seleccionado se aplica al feed (scopeLevel + scopeCode)
8. Los feeds filtran contenido por city_code y scope_code
```

## 8. GeoBar

La API devuelve un `GeoBarContextResponse` con:

```typescript
interface GeoBarContextResponse {
  context: GeoBarContext | null     // Contexto actual
  normalBar: GeoBarItem[]           // Barra para feeds normales (vas_ir, arre, etc)
  barrioBar: GeoBarItem[]           // Barra para feed de barrio (incluye global)
}
```

Cada `GeoBarItem` representa un nivel de scope disponible:

```typescript
interface GeoBarItem {
  order: number
  scopeLevel: ScopeLevel
  scopeCode: string | null
  scopeLabel: string | null
  enabled: boolean                   // Si el scope ya tiene coordenadas resueltas
  isDefault: boolean                 // Si es el scope por defecto
}
```

## 9. Reglas No Negociables

- Cada pantalla debe tener un codigo de dimension unico
- Los codigos de dimension siguen la estructura MODULO.AREA.COMPONENTE
- Los tabs del footer son fijos y no se modifican sin contrato
- El scope geografico siempre se resuelve via la API (nunca hardcodeado)
- La ciudad del dispositivo se persiste en secureStorage
- Si el usuario rechaza el cambio de ciudad, se mantiene la anterior
- `normalizeLevel('metro')` debe resolverse como 'zona'

## 10. Prohibiciones

- No hardcodear scopes geograficos en los componentes
- No modificar MAIN_TABS sin actualizar MainLayout y este contrato
- No crear nuevos tabs sin registrar su codigo de dimension
- No usar `localStorage` para guardar preferencias de ubicacion
- No asumir que GPS siempre esta disponible

## 11. ⚠️ Deuda Tecnica Identificada (actualizado)

- **RESUELTO**: `useLocationScope.ts` separado en 4 modulos helper (DEBT-020). De ~370 a ~230 lineas.
- **RESUELTO**: Nivel `metro` eliminado como nivel válido (DEBT-019)
- **RESUELTO**: Eventos window (`CustomEvent`) migrados a bus Vue (DEBT-022)
- **RESUELTO**: `CITY_OPTIONS` ahora es interna, no exportada (DEBT-021)
- **PENDIENTE**: `DEFAULT_ALLOWED_SCOPES` definido en composable. Mover a config.

## 12. Historial

| Version | Fecha | Cambio |
|---|---|---|
| 1.0.0 | 28/06/2026 | Contrato inicial |
| 1.1.0 | 28/06/2026 | Actualizado tras DEBT-020: nueva arquitectura de modulos helper |
| 1.2.0 | 29/06/2026 | La Neta → Que Pex. Scopes, tabs y dimensiones actualizados |

