# 01 — Architecture Spec

Version: 1.0.0
Status: baseline
Scope: Android New, iOS

## 1. Proposito

Define la arquitectura general del ecosistema de apps AntojadosMX V2.
Describe como se organizan los modulos, areas, componentes, la navegacion
y la relacion entre las capas shared y las apps.

## 2. Ecosistema General

```
┌─────────────────────────────────────────────────────────────┐
│                    AntojadosMX Ecosystem                      │
├─────────────────┬─────────────────┬─────────────────────────┤
│  Apps V2        │  Media Engine   │  GT Control             │
│  (Android/iOS)  │  V3             │  (Operativo/Economico)  │
│                 │                 │                         │
│  shared/        │  routes/        │  apps/gt-api/           │
│  ├── api/       │  services/      │  ├── routes/            │
│  ├── http/      │  worker/        │  ├── services/          │
│  └── ui/        │  db/            │  └── db/                │
└────────┬────────┴────────┬────────┴───────────┬─────────────┘
         │                 │                    │
         │           ┌─────┴──────┐             │
         │           │  SQL Server │             │
         │           │  Contabo    │             │
         │           │  185.187.   │             │
         │           │  235.253    │             │
         │           └─────┬──────┘             │
         │                 │                    │
         ▼                 ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    API de Antojados                          │
│              (http://185.187.235.253:8010)                   │
│   /api/v1/antojados/auth | /posts | /feed | /places | etc   │
└─────────────────────────────────────────────────────────────┘
```

## 3. Modulos de la App

La app tiene 3 modulos principales, representados en los 3 tabs del footer:

### 3.1 Antojo (storefront)
- **Target:** Usuarios buscando donde ir (consumidores)
- **Areas:**
  - `Vas Ir` — Feed de negocios, galeria de lugares, catalogo
  - `Arre` — Agenda de eventos, promociones de negocios
  - `Los Chidos` — Top rankings
  - `No Vas Ir` — Lugares con malas reseñas
  - `Mi Chamba` — Panel de control para sponsors (requiere cuenta sponsor)
- **Subdimensiones:** ANTOJO.VAS_IR, ANTOJO.ARRE, ANTOJO.LOS_CHIDOS, ANTOJO.NO_VAS_IR, ANTOJO.MI_CHAMBA

### 3.2 Antojados (social/red)
- **Target:** Usuarios compartiendo experiencias
- **Areas:**
  - `Barrio` — Feed social general (momentos)
  - `Para Ti` → `Pachanga` (eventos sociales) + `Que Pex` (contenido editorial)
  - `En el Desma` — Feed de desmadre
  - `La Banda` → `Acarreados` — Gestion de acarreados/red
  - `Mi Rollo` — Feed personalizado
- **Subdimensiones:** ANTOJADOS.BARRIO, ANTOJADOS.PARA_TI, ANTOJADOS.EN_EL_DESMA, ANTOJADOS.COMUNIDAD, ANTOJADOS.MI_ROLLO

### 3.3 Tragon (profile/yo)
- **Target:** Perfil y configuracion del usuario
- **Areas:** Bandeja, Perfil
- **Subdimensiones:** TRAGON.BANDEJA, TRAGON.PERFIL

## 4. Navegacion

### Estructura de rutas

```
/                           → MainLayout (header + footer tabs + router-view)
├── /antojo/*              → AntojoPage (modulo storefront)
│   ├── /antojo/vas-ir/*   → VasIrPanel
│   │   ├── gallery        → GalleryVasIr
│   │   ├── catalogo       → CartaVasIr
│   │   ├── fullscreen     → FullVasIr
│   │   └── publicar       → PublicarVasIrView
│   ├── /antojo/arre/*     → ArrePanel
│   │   ├── agenda         → AgendaArreView
│   │   ├── negocio/:id    → ArreNegocioMockView
│   │   ├── publicar       → PublicarArreView
│   │   ├── detalle/:id    → DetalleArreView
│   │   └── fullscreen/:id → FullscreenArreView
│   ├── /antojo/los-chidos → LosChidosPanel
│   ├── /antojo/no-vas-ir  → NoVasIrPanel
│   └── /antojo/mi-chamba/* → MiChambaPanel
│       ├── registro       → RegistroView
│       ├── e-firma        → EfirmaView
│       ├── contrato       → ContratoView
│       ├── atencion       → AtencionView
│       ├── cuenta         → CuentaView
│       ├── modulos        → ModulosView
│       ├── tiles          → TilesView
│       ├── metricas       → MetricasView
│       └── equipo         → EquipoView
│
├── /red/*                → RedPage (modulo social)
│   ├── /red/barrio/*     → BarrioPanel
│   │   ├── fullscreen/:id → BarrioFullscreenView
│   │   └── publicar      → PublicarBarrioView
│   ├── /red/pa-ti/*      → PaTiPanel
│   │   ├── pachanga      → PachangaView
│   │   ├── pachanga/fullscreen/:id → PachangaFullscreenView
│   │   ├── pachanga/publicar → PublicarPachangaView
│   │   ├── pachanga/publicar-resena → PublicarResenaView
│   │   ├── que-pex       → QuePexView
│   │   ├── que-pex/usuario/:id → QuePexUsuarioView
│   │   ├── que-pex/post/:id → QuePexPostFullscreenView
│   │   └── (legacy) la-neta/* → redirect a que-pex/ o pachanga/
│   ├── /red/en-el-desma  → EnElDesmaPanel
│   ├── /red/la-banda/*   → LaBandaPanel
│   │   └── acarreados    → AcarreadosView
│   └── /red/mi-rollo     → MiRolloPanel
│
├── /yo                   → YoPage (modulo perfil)
│
└── /* (catch all)        → ErrorNotFound
```

### Footer tabs (MainLayout)

Tres tabs fijos en el footer:
| Tab | Ruta | Icono | Codigo de dimension |
|---|---|---|---|
| Antojo | /antojo/vas-ir/gallery | storefront | ANTOJADOSMX.ANTOJO |
| Antojados | /red/barrio | groups | ANTOJADOSMX.ANTOJADOS |
| Tragon | /yo | person | ANTOJADOSMX.TRAGON |

### Tab bars secundarias

Cada area puede tener su propia tab bar:
- **Antojo:** Vas Ir, Arre, Los Chidos, No Vas Ir, Mi Chamba
- **Antojados/Red:** Barrio, Para Ti, En el Desma, La Banda, Mi Rollo
- **Para Ti:** Pachanga, Que Pex
- **La Banda:** Acarreados
- **Mi Chamba:** Registro, E-firma, Contrato, Atencion, Cuenta, Modulos, Tiles, Metricas, Equipo

## 5. Sistema de Dimensiones

Cada pantalla/componente tiene un codigo de dimension unico que permite:

1. **Analitica** — trackear que pantallas se visitan
2. **Permisos** — controlar acceso basado en rol (sponsor vs user)
3. **Navegacion** — resolver tabs activos basado en la ruta
4. **Metadata** — describir proposito de cada vista

### Estructura de codigos

```
NIVEL: MODULE → AREA → COMPONENT → BUTTON
Ejemplo: ANTOJADOSMX.ANTOJO.VAS_IR.BIZ_FEED.BTN_PUBLICAR
```

### Niveles

| Nivel | Descripcion | Ejemplo |
|---|---|---|
| MODULE | Tab principal del footer | ANTOJADOSMX.ANTOJO |
| AREA | Seccion dentro de un modulo | ANTOJOS.PARA_TI |
| COMPONENT | Vista especifica | ANTOJOS.PARA_TI.QUE_PEX |
| BUTTON | Accion granular | ANTOJOS.PARA_TI.LA_NETA.BTN_PUBLICAR |

## 6. Capas de la App

### 6.1 Capa HTTP (shared/http/)
Proposito: Comunicacion con la API de Antojados.
(Ver contrato 02a para detalle)

### 6.2 Capa de Servicios (shared/api/services/)
Proposito: Logica de llamadas API y mapeo de respuestas.
(Ver contrato 02b para detalle)

### 6.3 Capa de UI (shared/ui/)
Proposito: Componentes Vue, layouts, vistas, estilos.
(Ver contratos 02c, 02d, 02e, 02f para detalle)

### 6.4 Capa de Composición (shared/api/composables/)
Proposito: Orquestar logica compleja entre servicios y UI.
Ejemplos: usePublishMedia, useAntojadosFeed, useAuth, useGeoBar

## 7. Flujo de Datos Tipico

```
Vista Vue (SFC)
    │
    ▼
Composable (useXxx)
    │
    ▼
Servicio (service.xxx)
    │
    ▼
httpClient (axios + interceptors)
    │
    ▼
API de Antojados (185.187.235.253:8010)
    │
    ▼
SQL Server (Contabo)
```

Para media, el flujo se desvia al Media Engine:
(Ver contrato 02g para detalle)

## 8. Temas

La app soporta 3 temas intercambiables:
- **Ambar** (default)
- **Aqua**
- **Indigo**

Los temas se gestionan via `themeManager.ts` y se almacenan en la sesion.
El cambio de tema persiste entre sesiones.

## 9. Reglas No Negociables

- La navegacion siempre pasa por el router de Vue (nunca window.location)
- Los tabs del footer son fijos y no se modifican sin este contrato
- Cada vista debe tener un codigo de dimension unico
- Los codigos de dimension siguen la estructura NIVEL.DOMINIO.AREA.COMPONENTE
- Los componentes base NO deben modificarse sin entender su contrato
- No usar CSS global fuera de shared/ui/css/ (app.scss, indexclasses.scss, quasar.variables.scss)

## 10. Prohibiciones

- No agregar modulos nuevos sin actualizar este contrato
- No crear rutas fuera del router de Vue
- No hardcodear rutas en componentes (usar las constantes de navegacion)
- No modificar el MainLayout sin considerar los 3 modulos principales
- No agregar tabs al footer sin aprobacion arquitectonica

## 11. ⚠️ Deuda Tecnica Identificada
- ~~Mi Chamba tiene 9 sub-vistas que solo aplican a sponsors, pero estan en la misma estructura
  de rutas que las areas publicas. Deberia separarse en un modulo independiente.~~ **NO PROCEDE** — Mi Chamba es parte integral del ecosistema Antojados-GT.
- Hay 18 rutas redirect en /antojo/* que son legacy de versiones anteriores.
  Limpiar rutas muertas.
- El catch-all route redirige a ErrorNotFound pero no hay logging de 404s
  para identificar rutas rotas.
- `MainLayout.vue` maneja eventos de geo directamente (window event listeners).
  Esto deberia estar en un composable separado.
- El sistema de dimensiones no tiene validacion de unicidad. Podrian existir
  dos componentes con el mismo codigo y no detectarse.

## 12. Historial

| Version | Fecha | Cambio |
|---|---|---|
| 1.0.0 | 28/06/2026 | Contrato inicial. Arquitectura de modulos, navegacion, dimensiones |
| 1.1.0 | 29/06/2026 | Refactor La Neta → Que Pex. Resenas migradas a Pachanga como publicar-resena |
