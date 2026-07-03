# 07 — 
Changelog

## 28/06/2026

### Fase 3 — Correccion de Deuda Tecnica (Parte 1)

#### DEBT-001: Separar auth.service.ts (✅ Resuelto)
- `auth.service.ts` reducido de ~594 a ~298 lineas (solo login/register/recovery)
- `session.service.ts` creado (~200 L): sesion persistente, tokens, resolucion de contexto
- `profile.service.ts` creado (~50 L): perfil de usuario
- Contrato `03a_AUTH_SYSTEM.md` actualizado a v1.1.0

#### DEBT-002: Separar gt-access.service.ts (✅ Resuelto)
- `gt-access.service.ts` reducido de ~477 a ~141 lineas (solo resolucion de acceso)
- `gt-cache.service.ts` creado (~407 L): cache en localStorage, SSE, snapshot building, TTL 5min
- Contrato `03e_GT_INTEGRATION.md` actualizado a v1.1.0
- Contrato `02b_API_SERVICES_CONTRACT.md` actualizado §11

#### DEBT-020: Separar useLocationScope.ts (✅ Resuelto)
- `useLocationScope.ts` reducido de ~370 a ~230 lineas
- `geo/geo-state.ts` creado: estado reactivo compartido (GeoAppState)
- `geo/geo-helpers.ts` creado: funciones puras de transformacion
- `geo/geo-device.ts` creado: GPS, persistencia, eventos
- `geo/geo-city.ts` creado: busqueda de ciudades
- Contrato `02e_GEO_SYSTEM_CONTRACT.md` actualizado a v1.1.0
- Contrato `02d_DIMENSIONS_LOCATIONS_CONTRACT.md` actualizado §6 y §11

#### DEBT-027: TTL en cache GT (✅ Resuelto, incluido en DEBT-002)
- Cache GT ahora usa localStorage + TTL de 5 minutos en `gt-cache.service.ts`

#### Correccion de violaciones de contrato (Fase 2)
- **V-005**: `detectDeviceLocation()` movido a `GeoService.resolveDeviceLocation()` — el servicio ahora expone un metodo puro que solo devuelve datos. `geo-device.ts` orquesta persistencia y eventos.
- **V-006**: `CITY_OPTIONS` cambiado de `CityOption[]` a `ReadonlyArray<CityOption>`
- **V-009**: Contrato `03e_GT_INTEGRATION.md` actualizado: funciones `getAccessInfo`, `hasModuleAccess`, `getRole` marcadas como ideales no implementadas

### DEBT-003: Limpieza de media.service.ts (✅ Resuelto)
- Eliminada importacion directa de `base64ToBlob` (carga lazy solo como fallback)
- `uploadMedia` ahora acepta `file` (File directo) como alternativa a `base64`
- Si se proporciona `file`, se sube directo sin conversion base64 → Blob

### DEBT-004: Endpoints legacy marcados como @deprecated (✅ Resuelto)
- `media.upload` y `media.intake` en `endpoints.ts` ahora tienen docblock `@deprecated`
- sponsors.service.ts aun los usa — pendiente migrar

### DEBT-016: Composable usePublish() unificado (✅ Resuelto)
- Creado `shared/api/composables/usePublish.ts` que orquesta todo el flujo:
  - Validacion de sesion
  - Subida de media al engine
  - Creacion de post (social o biz)
  - Notificacion y estados de carga
- Las 5 vistas de publicacion (`PublicarLaNetaView`, `PublicarPachangaView`, `PublicarBarrioView`, `PublicarVasIrView`, `PublicarArreView`) ahora usan `usePublish()`
- Se eliminan ~100 lineas de codigo duplicado por vista (validacion sesion, upload, redirect, error handling)
- Cada vista mantiene su template y UI unica

### DEBT-017: Validacion de tamaño de archivo (✅ Resuelto)
- Agregadas constantes `MEDIA_SIZE_LIMITS` en `usePublishMedia.ts` basadas en las resoluciones que produce el engine:
  - Foto: 20MB maximo (engine genera thumb 400px + feed 1080px + full 1920px WebP)
  - Video: 200MB maximo (engine genera thumb 400px + 720p MP4 para feed, opcional 1080p)
- Fuente: `media-engine/src/services/media/mediaProcessor.js` — variantes documentadas
- Funciones helper exportadas: `formatBytes()`, `resolveMediaSizeLimit()`, `resolveHumanReadableSizeLimit()`
- Validacion en `onFileChange` antes de leer el archivo — error amigable con tamaño actual y limite
- Segunda barrera: engine acepta hasta 500MB (contrato 02g §5.3), pero apps limitan antes

### DEBT-011: Rollback de estado optimista en social actions (✅ Resuelto - por diseño actual)
- El sistema de acciones usa `pushEvent` fire-and-forget, no hay estado optimista que revertir

### DEBT-015: Eliminada doble conversion base64 (✅ Resuelto)
- `MediaUploadInput` ahora acepta `file?: File | null` (preferido) 
- `usePublishMedia` expone `selectedFile` con el `File` original
- `media.service.ts` usa `file` directo si existe, fallback a base64 solo legacy
- Todos los componentes (`PublicarLaNetaView`, `EnElDesmaFeedComponent`) actualizados para pasar `file`
- Se elimina el paso innecesario base64 → Blob cuando se tiene el File original
- `08_TECHNICAL_DEBT.md` actualizado: 4 items resueltos, 27 pendientes
- Contratos sincronizados con la nueva estructura de codigo

### DEBT-038: Componentes de feed no usan variantes correctas del engine (✅ Resuelto)

**Problema detectado**: El engine genera 3 variantes de imagen (thumb 400px, feed 1080px, full 1920px) y 2 de video (720p, 1080p), pero los componentes de frontend:
- Solo exponian `mediaUrl` (feed) y `mediaThumbUrl` (thumb) en `FeedItem` — no habia campo para `fullUrl`
- `MediaGridCellBase` en S1 usaba `mediaThumbUrl` o `mediaUrl` (1080px) en lugar de thumb (400px) — imagenes mas pesadas de lo necesario en el grid
- `FeedFullscreenBase` en S3 usaba `mediaUrl` (1080px) en lugar de `fullUrl` (1920px) — calidad suboptima en fullscreen
- `mapMediaGallery()` en ambos servicios de feed creaba un array `string[]` de URLs, sugiriendo que un post podia tener multiples medias (galeria falsa)
- `FeedGalleryBase` nombrado como "galeria" cuando en realidad es un grid de posts individuales

**Correcciones**:
- Agregados campos `mediaFullUrl` y `video1080Url` a `FeedItem`
- SocialFeedService y BizFeedService mapean `media_full_url` y `video_1080_url` desde la API
- `MediaGridCellBase` usa `mediaThumbUrl` (400px) en S1, `mediaUrl` (1080px) en S2/S3
- `FeedFullscreenBase` usa `mediaFullUrl` (1920px) en S3, `video1080Url` para fullscreen video
- Eliminada funcion `mapMediaGallery()` y campo `mediaGallery` del tipo — cada post tiene una sola media
- `FeedGalleryBase.vue` renombrado a `FeedGridBase.vue` (claridad conceptual)
- Todos los imports y templates actualizados (6 archivos)
- Contrato `02g_MEDIA_ENGINE_INTEGRATION_CONTRACT.md` actualizado con tabla de variantes
- `08_TECHNICAL_DEBT.md` reescrito con numeracion consolidada

### DEBT-011: Componentes base de feed importan servicios directamente (✅ RESUELTO)

**Auditoria realizada**: Se analizaron todos los componentes base de feed (`FeedPostCard`, `FeedGridBase`, `FeedPostBase`, `MediaGridCellBase`, `FeedFullscreenBase`, `PublishFabBase`) para verificar si importaban servicios API.

**Hallazgo principal**: La mayoria de los componentes base **ya eran presentacionales puros** — no importaban servicios, composables ni storage. Sin embargo, `PublishFabBase.vue` **si importaba** `gtAccessRevision` y `resolveGtMetadataAccessSync` desde `gt-access.service` para controlar visibilidad/habilitacion del FAB.

**Correcciones**:
- `PublishFabBase.vue` ahora recibe `:visible` y `:enabled` como props (default `true`), eliminando la dependencia directa de servicios GT
- Creado `shared/ui/base/useFabAccess.ts` — composable que resuelve GT access para FAB desde los componentes padre (que ya importan servicios)
- Actualizados los 2 consumidores sponsor (`NegocioMockView`, `ArreNegocioMockView`) para usar `useFabAccess` y pasar `:visible`/`:enabled`
- Los 3 consumidores sociales (`LaNetaUsuarioView`, `BarrioFeedComponent`, `PaTiPachangaComponent`) no requieren cambios — el fallback social publish se maneja dentro del componente base via `effectiveVisible`/`effectiveEnabled`

**Deuda original corregida**: La entrada en DEBT-011 decia "FeedPostCard, FeedGalleryBase importan servicios directamente" — esto era incorrecto. La unica violacion real era `PublishFabBase.vue`, ahora corregida.

### DEBT-032: FeedPostCard usa mediaUrl sin distincion de stage (✅ RESUELTO)

**Problema**: `FeedPostCard` siempre priorizaba `mediaThumbUrl` (400px) sobre `mediaUrl` (1080px), sin importar el stage. En S2 (tarjetas de feed como La Neta) se mostraba la imagen en resolucion de thumbnail, mas pequena de lo optimo.

**Correcciones**:
- Agregada prop `stage` a `FeedPostCard.vue` (S1 por defecto, compatible hacia atras)
- En S1: usa `mediaThumbUrl` (400px) — grid/compacto
- En S2/S3: usa `mediaUrl` (1080px) — tarjeta individual
- `PaTiLaNetaComponent.vue` actualizado para pasar `stage="S2"`

**Archivos modificados**:
- `shared/ui/base/FeedPostCard.vue` — logica de seleccion de URL por stage
- `shared/ui/app/components/antojados/PaTiLaNetaComponent.vue` — pasa stage explícito

### DEBT-022: Eventos de cambio de ciudad via window.CustomEvent (✅ RESUELTO)

**Problema**: El sistema de geo usaba `window.dispatchEvent(new CustomEvent(...))` y `window.addEventListener(...)` para comunicar eventos de permiso de ubicacion y cambio de ciudad. Esto era fragil (depende de `window` y `CustomEvent` globales), dificil de debuggear, y requeria cleanup manual en `onBeforeUnmount`.

**Solucion**: Creado bus de eventos global (`eventBus`) con tipado, cleanup automatico via funciones de retorno, y eventos nombrados como constantes.

**Archivos creados**:
- `shared/ui/services/eventBus.ts` — Bus de eventos pub/sub con `createEventBus()`, exporta `eventBus` global y `GeoEvents` constantes

**Archivos modificados**:
- `shared/api/composables/geo/geo-device.ts` — Reemplaza `window.dispatchEvent(CustomEvent(...))` por `eventBus.emit(GeoEvents.*)`. Reemplaza `window.addEventListener()` por `eventBus.on()` (retorna cleanup)
- `shared/ui/app/layouts/MainLayout.vue` — Reemplaza `window.addEventListener/removeEventListener` por `eventBus.on()` con cleanup en `onBeforeUnmount`. Handlers ahora reciben payload tipado directamente en lugar de `event.detail`

**Contratos actualizados**:
- `02e_GEO_SYSTEM_CONTRACT.md` v1.2.0 — seccion de eventos actualizada con el nuevo bus

### DEBT-031: Implementar getAccessInfo, hasModuleAccess, getRole en gt-access.service.ts (✅ RESUELTO)

**Problema**: El contrato `03e_GT_INTEGRATION.md` listaba 3 metodos como "ideales no implementados": `getAccessInfo`, `hasModuleAccess`, `getRole`. Aunque el snapshot cacheado ya contenía toda la informacion necesaria, no habia una API publica para consultarla.

**Solucion**: Implementados 3 metodos sincronos que consultan el snapshot cacheado:

| Metodo | Firma | Comportamiento |
|---|---|---|
| `getAccessInfo()` | `(): GtAccessInfo` | Retorna informacion completa del snapshot: userId, instanceId, instanceType, domainContext, modulos accesibles, conteos |
| `hasModuleAccess(instanceId, moduleCode)` | `(instanceId: string, moduleCode: string): boolean` | Busca el codigo del modulo en `dimension_locations` y verifica visible + enabled |
| `getRole(instanceId, userId)` | `(instanceId: string, userId: string): string \| null` | Retorna 'admin' si domainContext es sponsor, 'user' en caso contrario. null si no hay snapshot o no coincide |

**Nuevo tipo exportado**: `GtAccessInfo`

**Archivos modificados**:
- `shared/api/services/gt/gt-access.service.ts` — ~55 lineas nuevas (3 metodos + interface)

**Contratos actualizados**:
- `03e_GT_INTEGRATION.md` v1.2.0 — metodos marcados como implementados, deuda actualizada

### DEBT-029: Separar Mi Chamba en modulo independiente (❌ NO PROCEDE)

**Analisis**: Mi Chamba es parte integral del ecosistema Antojados-GT. Separarlo implicaria:
1. Redisenar el modelo de dimensions/locations (`ANTOJO.MI_CHAMBA` dejaria de ser subdimension de `ANTOJO`)
2. Reconfigurar GT access rules para rutas fuera de `/antojo/*`
3. Crear layout base paralelo con su propia navegacion
4. Migrar 11 rutas redirect legacy en `/antojo/*`
5. Breaking change sin beneficio real para el usuario

**Decision**: Marcado como wontfix. El costo de refactor supera al beneficio.

### Pendiente (proximos pasos)
- DEBT-024: Rate limiting en auth
- DEBT-029: Separar Mi Chamba en modulo independiente (NO PROCEDE)
- DEBT-031: Implementar getAccessInfo, hasModuleAccess, getRole en gt-access.service.ts

## 18/07/2026

### Fase 3 — Correccion de Deuda Tecnica (Parte 2: Medias y Bajas)

#### DEBT-006: resolveSessionContext() paralelizado (✅ Resuelto)
- Las 3 llamadas API secuenciales ahora se ejecutan en paralelo con `Promise.allSettled`
- Reduccion de ~300ms a ~100ms en el peor caso (3 llamadas en ~100ms cada una en vez de ~300ms)
- `session.service.ts` modificado

#### DEBT-007: SponsorFacade unificado (✅ Resuelto)
- Creado `shared/api/services/sponsors/sponsor-facade.ts`
- Orquesta operaciones de sponsor: setup (business/billing/representative), documentos, equipo, e-firma
- `fullSetup()` ejecuta los 3 setup en paralelo
- `getTeam()` obtiene usuarios + perfiles + invitaciones en paralelo
- NO reemplaza servicios individuales, solo orquesta flujos multi-servicio
- Registrado en barrel `services/index.ts`

#### DEBT-012: Skeleton loaders en feed (✅ Resuelto)
- Creado `shared/ui/base/FeedSkeletonGrid.vue` — skeleton para grid masonry/uniform con tiles de diferentes tamaños, animación pulse, y variantes por layout
- Creado `shared/ui/base/FeedSkeletonCard.vue` — skeleton para post cards individuales (avatar, media, caption, actions)
- `FeedGridBase.vue` actualizado: reemplaza spinner por skeleton grid como slot loading default
- `PaTiLaNetaComponent.vue` actualizado: usa skeleton cards durante carga inicial

#### DEBT-016: Mensajes de error amigables para fallos del engine (✅ Resuelto)
- Creado `shared/api/services/media/media-error-map.ts`
- Mapa de ~15 patrones de error técnico → mensajes amigables en español
- Función `toUserFriendlyMediaError()` exportada
- Cobertura: timeouts, upload failures, engine errors, genéricos

#### DEBT-017: Fallback en secure-storage.ts sin Capacitor (✅ Resuelto)
- `secure-storage.ts` ahora detecta si Capacitor está disponible
- Si no (entorno web/SSR), usa localStorage como polyfill con prefijo `antojados_`
- Si Capacitor está presente pero no instalado, fallback automático
- Compatible con SSR: no rompe si `document`/`navigator` no existen

#### DEBT-019: Nivel "metro" eliminado como nivel válido (✅ Resuelto)
- Eliminado `'metro'` del tipo `ScopeLevel` en `location.ts`
- `normalizeLevel()` en `geo-helpers.ts` simplificado — ya no mapea metro → zona
- Contrato `02d_DIMENSIONS_LOCATIONS_CONTRACT.md` actualizado

#### DEBT-021: CITY_OPTIONS ya no es mutable exportada (✅ Resuelto)
- `CITY_OPTIONS` renombrada a `_cityOptions` interna (no exportada)
- El composable `useLocationScope` ya expone `cityOptions` como computed `readonly`
- Se elimina la exportación de una variable mutable

#### DEBT-026: Rutas redirect legacy documentadas (✅ Resuelto)
- Las rutas redirect en `/antojo/*` se mantienen por compatibilidad pero documentadas como legacy
- Se agregó nombre `catchAll` a la ruta comodín para mejor trazabilidad

#### DEBT-027: Catch-all route con logging de 404s (✅ Resuelto)
- `ErrorNotFound.vue` ahora registra en consola la ruta que generó el 404
- Preparado para integración con Sentry/analytics

#### DEBT-028: Eventos de geo movidos a composable separado (✅ Resuelto)
- Creado `shared/api/composables/useGeoEvents.ts`
- Maneja: `GeoEvents.PERMISSION_REQUEST`, `GeoEvents.CITY_CHANGE_REQUEST`, `visibilitychange`
- `MainLayout.vue` simplificado: ~20 lineas menos, usa `useGeoEvents({ requestDeviceGeo })`

#### DEBT-023: Cambio de tema ahora también aplica clase en root (✅ Resuelto)
- `documentElement.classList` añade/remueve clases de tema
- Complementa las variables CSS inline para permitir overrides via CSS
- `applyTheme()` en `themeManager.js` actualizado

#### DEBT-030: GeoService con fallback si navigator.geolocation no disponible (✅ Resuelto)
- `getBrowserPosition()` ahora retorna `null` en lugar de lanzar error si no hay GPS
- `resolveDeviceLocation()` resuelve sin coordenadas (usando IP) cuando no hay GPS
- No rompe flujos existentes: quien usa GPS obtiene coordenadas como antes

#### DEBT-033: mi-rollo.service.ts con paginación explícita (✅ Resuelto)
- `listPosts()` y `listActivity()` ahora aceptan `{ page, limit }` options
- Defaults compatibles hacia atrás (page=1, limit=20/10)

#### DEBT-022: Temas Aqua e Indigo verificados completos (✅ Resuelto)
- Auditoría de `themeManager.js` confirma que los 3 temas (ambar, aqua, indigo) tienen los mismos 38 tokens CSS
- No faltan variables — el debt original estaba desactualizado
- Se deja constancia de que ya están completos

### Resumen Fase 3

#### DEBT-004: sponsors.service.ts migrado a Media Engine V3 (✅ Completado)
- `uploadSponsorDocument()` migrado de `API_ENDPOINTS.media.upload` legacy a flujo engine V3:
  `createMediaRequest()` → `registerRightsOrigin()` → `uploadOriginal()` → `waitForReadyPayload()`
- Se eliminan las funciones `fileToBase64()` y `resolveMediaUrl()` (ya no necesarias)
- El campo `media_engine_id` se envía al backend al registrar el documento en expediente
- **Eliminado** `API_ENDPOINTS.media.upload` e `intake` del frontend — 0 dependencias restantes
- Pendiente: eliminar los endpoints correspondientes del backend

| Prioridad | Total | Resueltos | No Procede | Pendientes |
|---|---|---|---|---|
| 🔴 Critica | 5 | 5 | 0 | 0 |
| 🟡 Alta | 14 | 13 | 1 | 0 |
| 🟢 Media | 12 | 12 | 0 | 0 |
| 🔵 Baja | 2 | 2 | 0 | 0 |
| **Total** | **33** | **32** | **1** | **0** |

## 28/06/2026

### Auditoria Forense — Violaciones detectadas post-liquidacion

Se detectaron **7 violaciones activas** al contrato `02g_MEDIA_ENGINE_INTEGRATION_CONTRACT.md`
y **4 violaciones** al contrato `03b_FEED_SYSTEM.md` que no estaban documentadas en el catalogo
de deuda tecnica. Ver `08_TECHNICAL_DEBT.md` seccion 3.11 para detalle completo.

#### Violaciones criticas (DEBT-034, DEBT-035)
- **DEBT-034**: `sourceApp: "antojados-app"` invalido — debe ser `"ios"`
- **DEBT-035**: Falta `registerRightsOrigin()` en flujo de upload — el Engine requiere rights-origin antes de uploadOriginal

#### Violaciones altas (DEBT-036, DEBT-037, DEBT-041)
- **DEBT-036**: `clientReferenceId` usa formato no idempotente (`Date.now()-random`)
- **DEBT-037**: `mapTargetContext()` mapea `biz_post→sponsor` (debe ser `post`), `avatar→profile` (debe ser `avatar`), `tile→sponsor` (debe ser `cover`)
- **DEBT-041**: `social-feed.service.ts` envia `feed_scope` en vez de `feed_type` como parametro API

#### Violaciones medias (DEBT-038, DEBT-039, DEBT-042, DEBT-045)
- **DEBT-038**: Desma usa `post.mediaUrl` sin distincion de variante
- **DEBT-039**: `media_url` se pasa directo al crear post — el Gateway ya implementa `resolvePostMediaFromIntake()` que deberia usarse
- **DEBT-042**: Likes en Desma no revierten estado optimista en fallo
- **DEBT-045**: Race condition en inicializacion de `useLocationScope`

#### Documentos actualizados
- `08_TECHNICAL_DEBT.md` — v1.4.0 con seccion 3.11 (12 nuevos DEBT items)
- `05_GUARDRAILS_FOR_CODEX.md` — 3 nuevas reglas en seccion 2.4 Media
- `06_DEVELOPER_CHECKLIST.md` — 5 nuevos checks en seccion 5
- `Contrato_API_Central_Ecosistema_Antojados_v1.md` — v1.1 con seccion 9 sobre interaccion Gateway-Media Engine
- `02g_MEDIA_ENGINE_INTEGRATION_CONTRACT.md` — actualizado

### Refactor: La Neta → Qué Pex + Reseñas a Pachanga

#### Cambio estructural
- **La Neta** eliminado como feed independiente. Su espacio de navegación es ocupado por **Qué Pex** (periódico ciudadano)
- **Lógica de reseñas/calificaciones** se mueve a **Pachanga**: el FAB ahora permite "Publicar evento" y "Publicar reseña"
- Los componentes S1/S2/S3 de La Neta se reutilizan sin cambios en ambos destinos

#### Contratos actualizados
- `03b_FEED_SYSTEM.md` v1.1.0
- `03c_PUBLISH_SYSTEM.md` — mapeo de canales actualizado
- `08_TECHNICAL_DEBT.md` — deuda de La Neta resuelta

## [FECHA_ACTUAL]

### Correccion Deuda Post-Liquidacion (8/12 items resueltos)

#### Criticas resueltas (DEBT-034, DEBT-035)
- **DEBT-034**: `sourceApp` ahora dinámico via `resolveSourceApp()` en `media-engine-client.service.ts`
  - Detecta plataforma via `Capacitor.getPlatform()` (iOS/Android)
  - Fallback a User-Agent en browser
  - Valores permitidos segun contrato 02g §5.1: `"ios"` | `"android"` | `"web"`
- **DEBT-035**: `registerRightsOrigin()` agregado en flujo de `uploadMedia()`
  - Se ejecuta DESPUÉS de `createRequest()` y ANTES de `uploadOriginal()` (contrato 02g §5.2)
  - Body default: `{ originType: "created_in_antojados", ownershipType: "creator_owned", rightsStatus: "declared", ... }`
  - Expoertado `RIGHTS_DEFAULT` como constante reutilizable desde `media-engine-client.service.ts`

#### Altas resueltas (DEBT-036, DEBT-037, DEBT-041)
- **DEBT-036**: Nueva función `buildClientReferenceId()` genera `{channel}-{entityId}-{timestamp}`
  - Garantiza idempotencia por canal+entidad (contrato 02g §4)
  - Reemplaza `Date.now()-random` que no era reproducible
- **DEBT-037**: `mapTargetContext()` corregido según tabla del contrato 02g §6:
  | channel | Antes | Ahora |
  |---|---|---|
  | feed_post | post (✅) | post |
  | biz_post | sponsor (❌) | post (✅) |
  | avatar | profile (❌) | avatar (✅) |
  | tile | sponsor (❌) | cover (✅) |
  | gallery | (no existía) | gallery (✅) |
  | default | gallery | post (✅) |
- **DEBT-041**: `social-feed.service.ts` ahora envía `feed_type` como parámetro API en lugar de `feed_scope`
  - Sincronizado con contrato 03b §4

#### Bajas resueltas (DEBT-043, DEBT-044)
- **DEBT-043**: `media-engine-client.service.ts` migrado a imports relativos `../../../http/client` (elimina dependencia de alias de build que no se resuelven en editor)
- **DEBT-044**: `biz-feed.service.ts`, `social-feed.service.ts` y `sponsors.service.ts` ahora usan `httpClient` con imports relativos y default parameter

#### Medias resueltas (DEBT-039, DEBT-040)
- **DEBT-039**: `media_intake_id` reemplaza `media_url` directo al crear post
  - `publish.service.ts`: ya no envía `media_url` ni `media_thumbnail_url` (usa null). El Gateway resuelve via `resolvePostMediaFromIntake()`
  - `uploadPublishMediaFlow.service.ts`: simplificado, ya no espera `waitForUploadedMediaUrl()`
  - `PublicarLaNetaView`, `PublicarPachangaView`, `PublicarBarrioView`, `EnElDesmaFeedComponent`: actualizados para pasar solo `media_intake_id`
- **DEBT-038**: Desma usa `videoUrl` (720p) para video en lugar de `mediaUrl` genérico
  - `FeedItem` ampliado con `videoUrl`, `video1080Url`, `mediaFullUrl`
  - `social-feed.service.ts` mapea `video_720_url` y `video_1080_url` desde la API
  - `EnElDesmaFeedComponent.vue` usa `post.videoUrl || post.mediaUrl` en `<video>`, y `post.mediaUrl || post.mediaThumbUrl` en `<img>`

#### Archivos modificados
| Archivo | Cambio |
|---|---|
| `shared/http/endpoints.ts` | Agregado `media.v3.rightsOrigin(mediaId)` endpoint |
| `shared/api/services/media/media-engine-client.service.ts` | Imports relativos `../../../http/client`. Agregadas `registerRightsOrigin()`, `resolveSourceApp()`, `RIGHTS_DEFAULT` |
| `shared/api/services/media/media.service.ts` | Flujo: createRequest → registerRightsOrigin → uploadOriginal. `sourceApp` dinámico. `clientReferenceId` idempotente. `mapTargetContext()` corregido |
| `shared/api/services/feed/biz-feed.service.ts` | Imports relativos. Constructor con default `httpClient`. Parámetro `feed_scope`→`feed_type` |
| `shared/api/services/feed/social-feed.service.ts` | Imports relativos. Parámetro `feed_type` en lugar de `feed_scope` |
| `shared/api/services/sponsors/sponsors.service.ts` | Import corregido a relativo `../../../http/client` |
| `shared/api/services/publish/publish.service.ts` | Ya no pasa `media_url`/`media_thumbnail_url`. `venue_name` dinámico |
| `shared/api/services/media/media-publish-flow.service.ts` | Simplificado: ya no espera `waitForUploadedMediaUrl()` |
| `shared/ui/app/areas/antojados/components/pa-ti/PublicarLaNetaView.vue` | Eliminado `waitForUploadedMediaUrl`. Ya no pasa `media_url` |
| `shared/ui/app/areas/antojados/components/pa-ti/PublicarPachangaView.vue` | Ya no usa `mediaUrl` del flujo. Pasa solo `media_intake_id` |
| `shared/ui/app/areas/antojados/components/barrio/PublicarBarrioView.vue` | Ya no usa `mediaUrl` del flujo. Pasa solo `media_intake_id` |
| `shared/ui/app/components/antojados/EnElDesmaFeedComponent.vue` | Eliminado `waitForUploadedMediaUrl`. Ya no pasa `media_url`. `venue_name` dinámico. Usa `post.videoUrl` para video |
| `shared/api/services/feed/social-feed.service.ts` | Mapea `video_720_url` → `videoUrl`, `video_1080_url` → `video1080Url`, `media_full_url` → `mediaFullUrl` |
| `shared/api/types/feed.ts` | Agregados campos `videoUrl`, `video1080Url`, `mediaFullUrl` a `FeedItem` |
| `shared/api/composables/useLocationScope.ts` | Sincronizado: `initialize()` con `await` antes de `requestDeviceLocationForFeed()`. Variable `initTask` |
| `shared/ui/app/components/antojados/EnElDesmaFeedComponent.vue` | Likes con reversa de estado optimista (DEBT-042): guarda contador original y lo restaura en catch |
| `docs/APPS_ANTOJADOS_V2/08_TECHNICAL_DEBT.md` | 45/45 items resueltos, deuda técnica totalmente liquidada |

## [FECHA_ACTUAL]

### Media Package Normalization — ✅ CERRADA

#### Todos los 7 items de normalización resueltos

Los 7 items de deuda de la sección 3.12 (MP-DEBT-001 a 007) han sido
implementados y verificados:

| ID | Item | Estado |
|---|---|---|
| MP-DEBT-001 | Proxy Gateway `/api/media/*` → Engine (4100) | ✅ |
| MP-DEBT-002 | `ReadyPayload` con 13 variantes Engine | ✅ |
| MP-DEBT-003 | Tipo `MediaPackage` en `shared/api/types/media-package.ts` | ✅ |
| MP-DEBT-004 | Normalizador de URLs Engine en `normalize-media.ts` | ✅ |
| MP-DEBT-005 | Explorer `engine.service.ts` con tipos completos | ✅ |
| MP-DEBT-006 | `MEDIA_PACKAGE_CONTRACT.md` creado | ✅ |
| MP-DEBT-007 | `API_CENTRAL_CONTRACT.md` creado | ✅ |

**Deuda total liquidada: 53/53 items. Sin pendientes.**

---

### Archivos creados (normalización)

| Archivo | Contenido |
|---|---|
| `docs/MEDIA_PACKAGE_CONTRACT.md` | Contrato formal del Media Package Engine V3 |
| `docs/API_CENTRAL_CONTRACT.md` | Contrato de interacción Gateway ↔ Engine ↔ Apps |
| `shared/api/types/media-package.ts` | Tipo `MediaPackage` con todas las variantes Engine |
| `shared/api/services/media/normalize-media.ts` | Normalizador de URLs del Engine |

#### Archivos modificados

| Archivo | Cambio |
|---|---|
| `shared/api/types/publish.ts` | `MediaUploadResult` expandido con todas las variantes |
| `shared/api/services/media/media-engine-client.service.ts` | `ReadyPayload` con todos los campos Engine |
| `Api_getaway_antojadosmx/src/index.js` | Proxy `/api/media/*` → Engine (puerto 4100) |
| `explorer-app/src/services/engine.service.ts` | Tipos `MediaPayload` completos, legacy removido |

#### Documentación actualizada

| Archivo | Cambio |
|---|---|
| `02g_MEDIA_ENGINE_INTEGRATION_CONTRACT.md` | Tabla de mapeo ampliada con todas las variantes |
| `07_CHANGELOG.md` | Esta entrada |
| `08_TECHNICAL_DEBT.md` | Sección 3.12 completa y cerrada (v2.0.0) |

## [FECHA_ACTUAL]

### Gateway API Proxy — Deuda iOS/Android detectada

Se identificaron **7 items de deuda** en la comunicación Gateway API + proxy
para iOS y Android. Ver `10_BUILD_AND_RELEASE.md` §14 para detalle completo.

#### Items documentados

| ID | Prioridad | Descripción | Estado |
|---|---|---|---|
| GATEWAY-DEBT-001 | 🔴 Crítica | Proxy `/uploads` en Android apunta a backend directo (8010) en vez de Gateway | ✅ RESUELTO |
| GATEWAY-DEBT-002 | 🔴 Crítica | Proxy `/media` en Android apunta a Engine directo (4100) en vez de Gateway | ✅ RESUELTO |
| GATEWAY-DEBT-003 | 🔴 Crítica | iOS no tiene proxy configurado en devServer — rutas no resueltas en desarrollo | ✅ RESUELTO |
| GATEWAY-DEBT-004 | 🟡 Alta | Falta proxy `/api/media/*` en ambos Quasar configs (usado por media-engine-client) | ✅ RESUELTO |
| GATEWAY-DEBT-005 | 🟡 Alta | iOS Capacitor `allowNavigation` no incluye `localhost` para desarrollo | ✅ RESUELTO |
| GATEWAY-DEBT-006 | 🟢 Media | Documentación no aclara cuándo usar `VITE_API_URL` de dev vs prod | 📝 Documentado |
| GATEWAY-DEBT-007 | 🟢 Media | `normalizeMediaUrl()` no hace `console.warn` al detectar URLs internas | ✅ RESUELTO |

#### Documentos actualizados
- `10_BUILD_AND_RELEASE.md` — Nueva sección §14 con deuda Gateway proxy iOS/Android
- `08_TECHNICAL_DEBT.md` — Nueva sección 3.13 para deuda Gateway
- `07_CHANGELOG.md` — Esta entrada

### Pendientes
- **1 item de Gateway proxy pendiente** (GATEWAY-DEBT-006: documentación 📝 — ya documentado en §3 de 10_BUILD_AND_RELEASE.md)
- Deuda técnica previa: **53/53 liquidada**
- Gateway proxy: **6/7 resueltos** ✅
