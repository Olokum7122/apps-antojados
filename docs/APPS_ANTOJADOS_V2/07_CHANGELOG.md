# 07 — Changelog

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

### Refactor: La Neta → Qué Pex + Reseñas a Pachanga

#### Cambio estructural
- **La Neta** eliminado como feed independiente. Su espacio de navegación es ocupado por **Qué Pex** (periódico ciudadano)
- **Lógica de reseñas/calificaciones** se mueve a **Pachanga**: el FAB ahora permite "Publicar evento" y "Publicar reseña"
- Los componentes S1/S2/S3 de La Neta se reutilizan sin cambios en ambos destinos

#### Contratos actualizados
- `03b_FEED_SYSTEM.md` v1.1.0
- `03c_PUBLISH_SYSTEM.md` — mapeo de canales actualizado
- `08_TECHNICAL_DEBT.md` — deuda de La Neta resuelta
