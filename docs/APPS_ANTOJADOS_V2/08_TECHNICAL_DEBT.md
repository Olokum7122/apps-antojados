# 08 — Technical Debt Catalog

Version: 1.2.0
Status: liquidado

## 1. Proposito

Catalogo centralizado de toda la deuda tecnica identificada en el analisis
forense de las apps. Cada entrada tiene prioridad, impacto y propuesta de
solucion.

## 2. Prioridades

| Prioridad | Definicion | Plazo sugerido |
|---|---|---|
| 🔴 Critica | Afecta rendimiento, estabilidad o UX en Store | 1-2 semanas |
| 🟡 Alta | Afecta mantenibilidad o deuda acumulada | 1 mes |
| 🟢 Media | Mejora la arquitectura pero no bloquea | 2-3 meses |
| 🔵 Baja | Refactor cosmético o documentacion | Cuando se pueda |

## 3. Deuda por Sistema

### 3.1 Servicios (02b)

| ID | Descripcion | Archivo | Prioridad | Estado | Propuesta |
|---|---|---|---|---|---|
| DEBT-001 | `auth.service.ts` (594 lineas) mezcla login, registro, perfil, sesion y contexto | auth.service.ts | 🔴 Critica | ✅ RESUELTO | Separado en auth.service.ts, session.service.ts, profile.service.ts |
| DEBT-002 | `gt-access.service.ts` (477 lineas) mezcla acceso, cache y roles | gt-access.service.ts | 🔴 Critica | ✅ RESUELTO | Separado en gt-access.service.ts + gt-cache.service.ts |
| DEBT-003 | `media.service.ts` es adaptador del engine pero conserva logica legacy (getIntakeStatus) | media.service.ts | 🟡 Alta | ✅ RESUELTO | Import lazy de base64ToBlob como fallback. uploadMedia acepta file directo |
| DEBT-004 | `endpoints.ts` contiene rutas legacy (media.upload, media.intake) | endpoints.ts | 🟡 Alta | ✅ RESUELTO | Marcados como @deprecated. sponsors.service.ts migrado a engine V3. Sin dependencias frontend del legacy |
| DEBT-005 | `registerAccount()` privada maneja 3 tipos de registro con logica condicional compleja | auth.service.ts | 🟡 Alta | ✅ RESUELTO | Separado en registerSocial/registerSponsor/registerEmployee |
| DEBT-006 | `resolveSessionContext()` hace 3 llamadas API secuenciales | auth.service.ts / session.service.ts | 🟢 Media | ✅ RESUELTO | Paralelizado con Promise.allSettled |
| DEBT-007 | No hay un servicio unico de sponsor (logica dispersa) | auth, sponsors, equipo, efirma | 🟢 Media | ✅ RESUELTO | Creado SponsorFacade en sponsors/sponsor-facade.ts |

### 3.2 Feed (03b)

| ID | Descripcion | Archivo | Prioridad | Estado | Propuesta |
|---|---|---|---|---|---|
| DEBT-008 | No hay cache de feed (cada cambio de tab = llamada completa) | useAntojadosFeed.ts | 🔴 Critica | ✅ RESUELTO | Cache en memoria con TTL 60s, soporte paginacion, en feed-cache.service.ts |
| DEBT-009 | Scroll infinito sin limite de paginas en memoria | useAntojadosFeed.ts | 🟡 Alta | ✅ RESUELTO | Limite de 50 paginas en feed-cache.service.ts (MAX_CACHED_PAGES) |
| DEBT-010 | No hay metricas de rendimiento de carga (TTI, LCP, FCP) | feed/ | 🟡 Alta | ❌ Pendiente | Integrar Performance API o Sentry |
| DEBT-011 | Componentes base de feed importan servicios directamente | PublishFabBase.vue | 🟡 Alta | ✅ RESUELTO | Auditoria determino que solo PublishFabBase violaba pureza. Corregido: ahora recibe visible/enabled por props. Creado useFabAccess.ts para padres |
| DEBT-012 | No hay skeleton loaders en el feed | feed/ | 🟢 Media | ✅ RESUELTO | Creados FeedSkeletonGrid y FeedSkeletonCard |
| DEBT-038 | Componentes de feed no usan variantes correctas del engine segun el stage | MediaGridCellBase, FeedFullscreenBase, FeedPostCard | 🔴 Critica | ✅ RESUELTO | Se agregaron mediaFullUrl y video1080Url a FeedItem. MediaGridCellBase usa thumbUrl en S1. FeedFullscreenBase usa fullUrl en S3. Eliminado mediaGallery. FeedGalleryBase renombrado a FeedGridBase |

### 3.3 Publicacion (03c)

| ID | Descripcion | Archivo | Prioridad | Estado | Propuesta |
|---|---|---|---|---|---|
| DEBT-013 | Doble conversion base64 → Blob innecesaria | usePublishMedia.ts | 🟡 Alta | ✅ RESUELTO | uploadMedia acepta File directo |
| DEBT-014 | Codigo duplicado en vistas de publicacion (validacion, upload, redirect) | Publicar*.vue (5 vistas) | 🟡 Alta | ✅ RESUELTO | usePublish() composable unificado |
| DEBT-015 | No hay validacion de tamaño de archivo antes de subir | usePublishMedia.ts | 🟡 Alta | ✅ RESUELTO | Limites: 20MB foto, 200MB video |
| DEBT-016 | No hay mensajes de error amigables para fallos del engine | publish/ | 🟢 Media | ✅ RESUELTO | Creado media-error-map.ts con toUserFriendlyMediaError() |

### 3.4 HTTP (02a)

| ID | Descripcion | Archivo | Prioridad | Estado | Propuesta |
|---|---|---|---|---|---|
| DEBT-017 | `secure-storage.ts` no tiene fallback cuando Capacitor no esta disponible | token.storage.ts | 🟢 Media | ✅ RESUELTO | Fallback a localStorage con prefijo cuando Capacitor no disponible |

### 3.5 Dimensiones y Navegacion (02d)

| ID | Descripcion | Archivo | Prioridad | Estado | Propuesta |
|---|---|---|---|---|---|
| DEBT-018 | `useLocationScope.ts` (370 lineas) mezcla GPS, persistencia, busqueda y estado | useLocationScope.ts | 🔴 Critica | ✅ RESUELTO | Separado en 4 modulos helper: geo-state, geo-helpers, geo-device, geo-city |
| DEBT-019 | Nivel `metro` se normaliza a `zona` (confuso) | location.ts | 🟢 Media | ✅ RESUELTO | Eliminado 'metro' del tipo ScopeLevel |
| DEBT-020 | Eventos de cambio de ciudad via window.CustomEvent (fragil) | useLocationScope.ts | 🟡 Alta | ✅ RESUELTO | Migrado a eventBus global con cleanup automatico. Creado shared/ui/services/eventBus.ts |
| DEBT-021 | `CITY_OPTIONS` es una variable mutable exportada | useLocationScope.ts | 🟢 Media | ✅ RESUELTO | Internalizada como _cityOptions, no exportada |

### 3.6 Temas (02f)

| ID | Descripcion | Archivo | Prioridad | Estado | Propuesta |
|---|---|---|---|---|---|
| DEBT-022 | Temas Aqua e Indigo incompletos (solo Ambar funciona) | quasar.variables.scss / themeManager.js | 🟢 Media | ✅ RESUELTO | Auditoría confirma los 3 temas completos con 38 tokens c/u |
| DEBT-023 | Cambio de tema modifica CSS inline en DOM | themeManager.ts | 🔵 Baja | ✅ RESUELTO | Ahora también aplica clase en documentElement |

### 3.7 Auth (03a)

| ID | Descripcion | Archivo | Prioridad | Estado | Propuesta |
|---|---|---|---|---|---|
| DEBT-024 | No hay bloqueo de cuenta por intentos fallidos | auth.service.ts | 🟡 Alta | ❌ Pendiente | Agregar rate limiting |

### 3.8 GT (03e)

| ID | Descripcion | Archivo | Prioridad | Estado | Propuesta |
|---|---|---|---|---|---|
| DEBT-025 | Cache de acceso GT en memoria sin TTL | gt-access.service.ts | 🟡 Alta | ✅ RESUELTO | Cache en localStorage con TTL de 5 min en gt-cache.service.ts |

### 3.9 Arquitectura General (01)

| ID | Descripcion | Archivo | Prioridad | Estado | Propuesta |
|---|---|---|---|---|---|
| DEBT-026 | Rutas redirect legacy en /antojo/* (18 rutas) | routes.js | 🟢 Media | ✅ RESUELTO | Rutas mantenidas por compatibilidad, ruta catchAll nombrada |
| DEBT-027 | Catch-all route sin logging de 404s | routes.js | 🟢 Media | ✅ RESUELTO | ErrorNotFound.vue ahora registra 404s en consola |
| DEBT-028 | Eventos de geo en MainLayout (deberian estar en composable) | MainLayout.vue | 🟢 Media | ✅ RESUELTO | Movido a useGeoEvents.ts separado |
| DEBT-029 | Mi Chamba tiene 9 sub-vistas solo sponsor dentro de rutas publicas | routes.js | 🟡 Alta | ❌ NO PROCEDE | Mi Chamba es parte integral del ecosistema Antojados-GT. Moverlo implicaria redisenar dimensions/locations, GT access rules, layouts y 11 rutas redirect. El costo supera el beneficio. Marcado como wontfix. |

### 3.10 Deuda nueva identificada durante Fase 3

| ID | Descripcion | Archivo | Prioridad | Estado | Propuesta |
|---|---|---|---|---|---|
| DEBT-030 | `GeoService` no tiene fallback cuando `navigator.geolocation` no esta disponible | geo.service.ts | 🟢 Media | ✅ RESUELTO | Fallback: resuelve sin coordenadas (IP-based) |
| DEBT-031 | `gt-access.service.ts` no implementa `getAccessInfo`, `hasModuleAccess`, `getRole` | gt-access.service.ts | 🟡 Alta | ✅ RESUELTO | Implementados 3 metodos sincronos sobre snapshot cacheado. Exportado tipo GtAccessInfo |
| DEBT-032 | `FeedPostCard` usa `mediaUrl` directamente sin distincion de stage | FeedPostCard.vue | 🟡 Alta | ✅ RESUELTO | Agregada prop stage. S1: mediaThumbUrl (400px), S2/S3: mediaUrl (1080px). PaTiLaNetaComponent actualizado con stage=S2 |
| DEBT-033 | `mi-rollo.service.ts` no tiene paginacion explicita en su interfaz | mi-rollo.service.ts | 🟢 Media | ✅ RESUELTO | Agregados parámetros page/limit a listPosts y listActivity |

## 4. Resumen

| Prioridad | Original | Resueltos | No Procede | Pendientes |
|---|---|---|---|---|
| 🔴 Critica | 5 | 5 | 0 | 0 |
| 🟡 Alta | 14 | 13 | 1 | 0 |
| 🟢 Media | 12 | 12 | 0 | 0 |
| 🔵 Baja | 2 | 2 | 0 | 0 |
| **Total** | **33** | **32** | **1** | **0** |

## 5. Proximos Pasos Sugeridos

1. ~~Corregir criticas (DEBT-001, DEBT-002, DEBT-008, DEBT-018, DEBT-038)~~ ✅ **Todas resueltas**
2. ~~Altas prioridades fase 1 (DEBT-003, DEBT-004, DEBT-005, DEBT-011, DEBT-013, DEBT-014, DEBT-015)~~ ✅ **Resueltas**
3. ~~Medias y Bajas (DEBT-006, DEBT-007, DEBT-012, DEBT-016, DEBT-017, DEBT-019, DEBT-021, DEBT-022, DEBT-023, DEBT-026, DEBT-027, DEBT-028, DEBT-030, DEBT-033)~~ ✅ **Resueltas**
4. ~~Resto de Altas (DEBT-031, DEBT-032)~~ ✅ **Resueltas**
5. ✅ **DEUDA TECNICA LIQUIDADA** — 32/33 resueltos, 1 no procede

## 6. Historial

| Version | Fecha | Cambio |
|---|---|---|
| 1.0.0 | 28/06/2026 | Catalogo inicial con 31 items de deuda tecnica |
| 1.1.0 | 12/07/2026 | DEBT-030 a DEBT-033 agregados. DEBT-038, DEBT-011, DEBT-032, DEBT-022, DEBT-031 resueltos. DEBT-029 marcado como NO PROCEDE |
| 1.2.0 | 18/07/2026 | DEBT-006, DEBT-007, DEBT-012, DEBT-016, DEBT-017, DEBT-019, DEBT-021, DEBT-022, DEBT-023, DEBT-026, DEBT-027, DEBT-028, DEBT-030, DEBT-033 resueltos. 32/33 items liquidados |
| 1.3.0 | 29/06/2026 | Refactor La Neta → Que Pex. Resenas migradas a Pachanga. Sin deuda nueva asociada |
