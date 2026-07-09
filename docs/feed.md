# Modelo de Datos — Feed (biz_posts / soc_posts)

<!--
═══ DOMINIO ═══════════════════════════════════════════════════════════════
Feed de AntojadosMx — Posts de Negocios (biz) y Sociales (soc)

⚠️ NOTA: Este documento cubre el modelo de AntojadosMX.
El Media Engine (ATLX) es multi-servicio y sirve también a Explorer App
y futuras soluciones. Ver media-engine/docs/ para la arquitectura completa.

RESPONSABLE DE ESTE MODELO:
  - bizResolver.js   → CRUD e interacciones de biz_posts
  - postsResolver.js → CRUD e interacciones de soc_posts
  - feedService      → Alimentación del feed unificado
  - Media Engine     → Procesamiento de media (vía serviceRegistry)

NO CUBRE:
  - Sponsors (biz_tenants, sys_instancia) → sponsorManager
  - Feed cache (antojados_feed) → feedService
  - Media Engine internals → docs/media-engine/ (ver Secciones 8, 9, 10 para resumen)

═══ REFERENCIAS ══════════════════════════════════════════════════════════
  - bizResolver.js  → apps-antojados/docs/feed.md (Secciones 1, 2, 5, 6)
  - postsResolver.js → apps-antojados/docs/feed.md (Secciones 3, 4, 5, 6)
  - SPs (usp_*)     → apps-antojados/docs/feed.md (Sección 5)
  - Media Engine    → apps-antojados/docs/feed.md (Sección 8: Modelo me.*, Sección 9: Perfiles, Sección 10: Servicios)
═══

═══ ARQUITECTURA DE PUBLICACIÓN Y CONSUMO ════════════════════════════════

### Flujo de Publicación (escribe)

  CLIENTE (App/Web)
    │
    ├── ① POST /api/media/requests              → MEDIA ENGINE
    │     Body: { sourceApp, sourceActorType, sourceActorId,
    │             targetContext, mediaType, processingProfileCode }
    │     ← { mediaId: "abc-123", status: "received" }
    │
    ├── ② POST /api/media/abc-123/rights-origin → MEDIA ENGINE
    │     Body: { originType, ownershipType, rightsStatus }
    │     ← { mediaId, rightsStatus: "declared" }
    │
    ├── ③ POST /api/media/abc-123/original       → MEDIA ENGINE (multipart)
    │     ← { mediaId, status: "uploaded", originalUrl, sha256Hash }
    │
    │     [Worker del Engine procesa en background:
    │       - Detecta orientación (portrait/landscape/square)
    │       - Evalúa política de derechos
    │       - Resuelve processing_profile_code según canal + orientación
    │       - Genera variantes thumb, feed, full con dimensiones del perfil
    │       - Para video: genera short (1080×1920) + video_preview image
    │       - me.media_request.status → 'ready'
    │       - me.media_variant: { media_id, variant_code, url, width, height }]
    │
    ├── ④ GET /api/media/abc-123/ready-payload  → MEDIA ENGINE
    │     ← { thumb_url, feed_url, full_url,
    │         video_url?, video_preview_url?,
    │         width, height, aspectRatio,
    │         rightsStatus, isDemoContent }
    │
    └── ⑤ POST /api/v1/antojados/biz-posts   → GATEWAY
          Body: { sponsor_id, channel, media_intake_id: "abc-123" }
            │
            ▼
          GATEWAY (bizResolver.js / postsResolver.js)
            │
            ├── engineClient.getReadyPayload(media_intake_id)
            │     ← { thumb_url, feed_url, full_url }
            │
            ├── usp_publish_biz_post   → INSERT antojados_core.biz_posts
            │     (media_url = feed_url del engine)
            │
            └── sp_biz_post_media_attach  → INSERT antojados_core.biz_post_media
                  (asset_id = media_intake_id del engine)
                  (thumb_url, feed_url, full_url del engine)

### Flujo de Consumo (lee)

  CLIENTE (App/Web)
    │
    GET /api/v1/antojados/biz/feed?feed_scope=vas_ir&city_code=MTY
    │
    ▼
  GATEWAY → feedService
    │
    ▼
  RESPONSE:
  {
    "data": [{
      "biz_post_id": "550e8400-...",
      "sponsor_id": "spon_abc",
      "media_url": "/media/2026/07/abc-123/feed_800.webp",
      "media": [{
        "media_id": "660e8400-...",
        "media_url": "/media/2026/07/abc-123/feed_800.webp",
        "thumb_url": "/media/2026/07/abc-123/thumb_300.webp",
        "full_url": "/media/2026/07/abc-123/full_1920.webp",
        "asset_id": "abc-123"
      }],
      "likes_count": 5,
      "comments_count": 2
    }]
  }

  El frontend usa:
    - media_url       → imagen principal del card en feed
    - media[].thumb   → preview / skeleton
    - media[].full    → lightbox / detalle
    - El frontend NUNCA habla directo al Engine

### Reglas de Oro

  1. **El Gateway es el ÚNICO que escribe en `antojados_core.*`** — El Media Engine nunca toca tablas de Antojados.
  2. **El Media Engine escribe solo en `me.*`** — `me.media_request`, `me.media_rights_origin`, `me.media_original`, `me.media_variant`, `me.processing_job`, `me.media_event_log`.
  3. **El Cliente solo sube archivos al Engine** y llama al Gateway. Nunca escribe directamente en BD.
  4. **`asset_id` en `*_post_media` es el `mediaId` del Engine** — link bidireccional entre Antojados y Media Engine.
  5. **`media_url` en tablas principales** (`biz_posts`/`soc_posts`) es siempre `feed_url` del Engine.
  6. **Las variantes `thumb_url`, `feed_url`, `full_url`** se mantienen como interfaz estable — el Gateway no se entera de los perfiles de procesamiento.
  7. **`processing_profile_code` se resuelve automáticamente** según canal + tipo de media + orientación original. El cliente no necesita enviarlo explícitamente.
  8. **Los formatos generados siempre son JPEG/MP4** para máxima compatibilidad. WebP y otros formatos se considerarán en futuras versiones.

═══
-->

## Esquema: `antojados_core`

---

## 1. `biz_posts` — Posts de Negocios (Sponsor)

### Columnas

| Columna | Tipo | PK | FK | Default | Descripción |
|---|---|---|---|---|---|
| `biz_post_id` | `NVARCHAR(64)` | ✅ | | `LOWER(NEWID())` | UUID del post |
| `sponsor_id` | `NVARCHAR(64)` | | | | ID del negocio/sponsor |
| `channel` | `NVARCHAR(30)` | | | | Canal de publicación |
| `feed_type` | `NVARCHAR(30)` | | | `NULL` | Tipo de feed (`general`, `publicity`, `explorador`) |
| `media_url` | `NVARCHAR(500)` | | | `NULL` | URL de media principal |
| `doc_json` | `NVARCHAR(MAX)` | | | `NULL` | JSON con `badge`, `price`, `descripciones` |
| `views_count` | `INT` | | | `0` | Vistas |
| `likes_count` | `INT` | | | `0` | Likes |
| `comments_count` | `INT` | | | `0` | Comentarios |
| `shares_count` | `INT` | | | `0` | Compartidos |
| `cta_clicks_count` | `INT` | | | `0` | Clicks en CTA |
| `taps_whatsapp_count` | `INT` | | | `0` | Taps a WhatsApp |
| `taps_maps_count` | `INT` | | | `0` | Taps a Maps |
| `engagement_score` | `DECIMAL(10,4)` | | | `0` | Score de engagement |
| `status` | `NVARCHAR(20)` | | | `'active'` | Estado del post |
| `created_at` | `DATETIME2(3)` | | | `SYSUTCDATETIME()` | Fecha de creación |

### Índices

| Nombre | Columnas |
|---|---|
| `PK_biz_posts` (clustered) | `biz_post_id` |
| `IX_biz_posts_sponsor_id` | `sponsor_id` |
| `IX_biz_posts_channel` | `channel` |
| `IX_biz_posts_status` | `status` |
| `IX_biz_posts_created_at` | `created_at DESC` |

---

## 2. `biz_post_media` — Multimedia de Posts de Negocios

### Columnas

| Columna | Tipo | PK | FK | Default | Descripción |
|---|---|---|---|---|---|
| `media_id` | `NVARCHAR(64)` | ✅ | | `LOWER(NEWID())` | UUID del media |
| `post_id` | `NVARCHAR(64)` | | `FK → biz_posts(biz_post_id) ON DELETE CASCADE` | | Post al que pertenece |
| `sponsor_id` | `NVARCHAR(64)` | | | | ID del negocio/sponsor |
| `media_type` | `NVARCHAR(20)` | | | `'photo'` | Tipo (`photo`, `video`, etc.) |
| `media_url` | `NVARCHAR(1000)` | | | | URL del media |
| `sort_order` | `INT` | | | `0` | Orden de visualización |
| `asset_id` | `NVARCHAR(64)` | | | `NULL` | ID del asset en media-engine |
| `thumb_url` | `NVARCHAR(1000)` | | | `NULL` | URL thumbnail |
| `feed_url` | `NVARCHAR(1000)` | | | `NULL` | URL para feed |
| `full_url` | `NVARCHAR(1000)` | | | `NULL` | URL full resolución |
| `created_at` | `DATETIME2(3)` | | | `SYSUTCDATETIME()` | Fecha de creación |

### Índices

| Nombre | Columnas |
|---|---|
| `IX_biz_post_media_post_id` | `post_id` |
| `IX_biz_post_media_sort_order` | `post_id, sort_order` |

---

## 3. `soc_posts` — Posts Sociales (Usuario)

### Columnas

| Columna | Tipo | PK | FK | Default | Descripción |
|---|---|---|---|---|---|
| `post_id` | `NVARCHAR(64)` | ✅ | | `LOWER(NEWID())` | UUID del post |
| `user_id` | `NVARCHAR(64)` | | | | ID del usuario |
| `channel` | `NVARCHAR(30)` | | | | Canal de publicación |
| `feed_type` | `NVARCHAR(30)` | | | `NULL` | Tipo de feed |
| `media_url` | `NVARCHAR(500)` | | | `NULL` | URL de media principal |
| `doc_json` | `NVARCHAR(MAX)` | | | `NULL` | JSON con datos extra |
| `views_count` | `INT` | | | `0` | Vistas |
| `likes_count` | `INT` | | | `0` | Likes |
| `comments_count` | `INT` | | | `0` | Comentarios |
| `shares_count` | `INT` | | | `0` | Compartidos |
| `cta_clicks_count` | `INT` | | | `0` | Clicks en CTA |
| `engagement_score` | `DECIMAL(10,4)` | | | `0` | Score de engagement |
| `status` | `NVARCHAR(20)` | | | `'active'` | Estado del post |
| `created_at` | `DATETIME2(3)` | | | `SYSUTCDATETIME()` | Fecha de creación |

### Índices

| Nombre | Columnas |
|---|---|
| `IX_soc_posts_user_id` | `user_id` |
| `IX_soc_posts_channel` | `channel` |
| `IX_soc_posts_status` | `status` |
| `IX_soc_posts_created_at` | `created_at DESC` |

---

## 4. `soc_post_media` — Multimedia de Posts Sociales

### Columnas

| Columna | Tipo | PK | FK | Default | Descripción |
|---|---|---|---|---|---|
| `media_id` | `NVARCHAR(64)` | ✅ | | `LOWER(NEWID())` | UUID del media |
| `post_id` | `NVARCHAR(64)` | | `FK → soc_posts(post_id) ON DELETE CASCADE` | | Post al que pertenece |
| `user_id` | `NVARCHAR(64)` | | | | ID del usuario |
| `media_type` | `NVARCHAR(20)` | | | `'photo'` | Tipo (`photo`, `video`, etc.) |
| `media_url` | `NVARCHAR(1000)` | | | | URL del media |
| `sort_order` | `INT` | | | `0` | Orden de visualización |
| `asset_id` | `NVARCHAR(64)` | | | `NULL` | ID del asset en media-engine |
| `thumb_url` | `NVARCHAR(1000)` | | | `NULL` | URL thumbnail |
| `feed_url` | `NVARCHAR(1000)` | | | `NULL` | URL para feed |
| `full_url` | `NVARCHAR(1000)` | | | `NULL` | URL full resolución |
| `created_at` | `DATETIME2(3)` | | | `SYSUTCDATETIME()` | Fecha de creación |

### Índices

| Nombre | Columnas |
|---|---|
| `IX_soc_post_media_post_id` | `post_id` |
| `IX_soc_post_media_sort_order` | `post_id, sort_order` |

---

## 5. Stored Procedures

### Publicación

| SP | Inputs | Output | Crea UUID |
|---|---|---|---|
| `usp_publish_biz_post` | `@sponsor_id, @channel, @feed_type, @media_url, @doc_json` | `@biz_post_id OUTPUT` | `LOWER(NEWID())` |
| `usp_publish_soc_post` | `@user_id, @channel, @feed_type, @media_url, @doc_json` | `@post_id OUTPUT` | `LOWER(NEWID())` |

### Media Attach

| SP | Inputs |
|---|---|
| `sp_biz_post_media_attach` | `@post_id, @sponsor_id, @media_type, @media_url, @sort_order, @asset_id, @thumb_url, @feed_url, @full_url` |
| `sp_soc_post_media_attach` | `@post_id, @user_id, @media_type, @media_url, @sort_order, @asset_id, @thumb_url, @feed_url, @full_url` |

### Interacciones Biz

| SP | Inputs | Efecto |
|---|---|---|
| `usp_biz_post_like` | `@biz_post_id, @user_id` | Inserta interacción `like_created` + UPDATE `likes_count++` (UPDLOCK) |
| `usp_biz_post_unlike` | `@biz_post_id, @user_id` | DELETE interacción + UPDATE `likes_count--` |
| `usp_biz_post_comment` | `@biz_post_id, @user_id, @interaction_type, @parent_comment_id, @content_text, @created_at_client` | Inserta comentario + UPDATE `comments_count++` |
| `usp_biz_post_view` | `@biz_post_id, @user_id` | Inserta `post_viewed` + UPDATE `views_count++` |
| `usp_biz_post_interactions_summary` | `@biz_post_id, @user_id` | SELECT `has_liked, likes_count, comments_count` |

### Interacciones Soc

| SP | Inputs | Efecto |
|---|---|---|
| `usp_soc_post_like` | `@post_id, @user_id` | Igual que biz pero en `soc_posts` / `soc_post_interactions` |
| `usp_soc_post_unlike` | `@post_id, @user_id` | Igual |
| `usp_soc_post_comment` | `@post_id, @user_id, @interaction_type, @parent_comment_id, @content_text, @created_at_client` | Igual |
| `usp_soc_post_view` | `@post_id, @user_id` | Igual |
| `usp_soc_post_interactions_summary` | `@post_id, @user_id` | Igual |

---

## 6. Diferencias Biz vs Soc

| Aspecto | `biz_posts` | `soc_posts` |
|---|---|---|
| Owner | `sponsor_id` (negocio) | `user_id` (usuario) |
| Métricas extra | `taps_whatsapp_count`, `taps_maps_count` | No tiene |
| Media table | `biz_post_media.sponsor_id` | `soc_post_media.user_id` |
| Interacciones table | `biz_post_interactions` | `soc_post_interactions` |

---

═══ AVANCE Y PRÓXIMOS PASOS ═══════════════════════════════════════════════════

### ✅ Completado (SQL → Gateway → Media Engine → Feed → Routes)

| Capa | Estado | Detalle |
|---|---|---|
| Tablas `antojados_core` (`biz_posts`, `biz_post_media`, `soc_posts`, `soc_post_media`) | ✅ Creadas | Columnas según secciones 1-4 |
| SPs de publicación y media attach | ✅ Creados | Sección 5 |
| SPs de interacciones (like, unlike, comment, view, summary) | ✅ Creados | 10 SPs con UPDLOCK |
| Tabla `soc_post_interactions` | ✅ Creada | DDL idéntico a biz_post_interactions |
| `bizResolver.js` / `postsResolver.js` | ✅ Reescritos | Solo modelo feed.md |
| `engineClient.js` | ✅ Creado | Cliente HTTP gateway → Media Engine |
| Media Engine (servidor Express) | ✅ Creado | Routes REST en /api/media/* |
| Media Engine (BD `me.*`) | ✅ Creada | 6 tablas + vistas + SPs en esquema `me` |
| Media Engine (Worker background) | ✅ Creado | Pipeline: pick → process → variants → ready |
| Media Engine (perfiles de procesamiento) | ✅ Creados | portrait, landscape, square, short_vertical (Sección 9) |
| `channelProfileMapper.js` | ✅ Creado | Mapeo canal + tipo + orientación → perfil |
| `mediaPackageMapper.js` | ✅ Creado | Mapeo engine → gateway (compatibilidad) |
| `serviceRegistry.js` | ✅ Creado | Multi-servicio engine (antojados, explorer, generic) |
| `feedService.js` | ✅ CREADO | Servicio de feed unificado con geo + scoring + cursor |
| `feedRouter.js` | ✅ CREADO | 7 endpoints de feed con paginación cursor-based |
| `feed.md` Sección 11 | ✅ AGREGADA | Modelo de consumo completo con contratos, rutas, tipos |
| `feedResolver.js`, `feed.service.js`, `feed.routes.js`, `feedMapper.js`, `recommendation.config.js` | 🗑️ **ELIMINADOS** | Legacy que usaba `antojados_feed.feed_items` |
| `19_usp_feed_scoring_refresh.sql`, `00_add_missing_columns.sql`, `02_refactor_biz_posts_final.sql`, `01_v_posts_media.sql`, `02_usp_get_post_media_package.sql`, `03_usp_update_post_metrics.sql` | 🗑️ **ELIMINADOS** | No documentados en feed.md o migraciones one-shot ya aplicadas |
| Rutas de interacciones soc (`like`, `unlike`, `comment`, `view`, `interactions-summary`) en `posts.routes.js` | ✅ CREADAS | Endpoints REST para soc_posts (equivalente a biz_posts) |
| Ruta duplicada `GET /biz/feed` en `biz.routes.js` | 🗑️ **ELIMINADA** | El feed unificado se sirve exclusivamente desde `feedRouter.js` |

### ✅ Frontend — Consumo y Renderizado

| Componente / Archivo | Ubicación | Estado | Detalle |
|---|---|---|---|
| `SponsorVasIrPage.vue` | `shared/ui/app/components/antojo/SponsorVasIrPage.vue` | ✅ CREADO | Page de Vas Ir. Usa `card-viewport` WC + `PostActionRailBase` + `PublishFabBase` fuera del shadow DOM. Carga feed via `BizFeedService.list()`. Evento `ver-sponsor` → S2 con rail de acciones. |
| `SponsorArrePage.vue` | `shared/ui/app/components/antojo/SponsorArrePage.vue` | ✅ CREADO | Page de Arre. Misma arquitectura que Vas Ir. Carga feed via `BizFeedService.list()`. |
| `card-viewport` Web Component | `shared/ui/cards/interactive-card.js` | ✅ ACTUALIZADO | WC con stageS1 (glass-back, media-box, glass-front, card-actions) y stageS2 (s2-back, glass-comments). Shadow DOM aislado. Recibe datos planos via `docJson`. Dispara eventos `ver-sponsor`, `open-chat`, `open-s3`, `like`, `comment` hacia Vue. |
| `index.html` (template) | `shared/ui/cards/index.html` | ✅ ACTUALIZADO | Template HTML del WC. Sin rail ni FAB (viven en Vue fuera del WC). Stages fijos S1/S2. Media-box con imagen, badge, watermark, dots de navegación. Glass-back/glass-front con título y descripción. Glass-comments con lista + input. |
| `PostActionRailBase.vue` | `shared/ui/base/PostActionRailBase.vue` | ✅ CREADO | Rail horizontal de acciones post-S2 (Chocalas, Pasala, Comentar, Whatsapp, Maps). Vive en Vue fuera del card-viewport. Se muestra en S2 vía `v-if="isS2 && cardPosts.length"`. |
| `PublishFabBase.vue` | `shared/ui/base/PublishFabBase.vue` | ✅ CREADO | FAB flotante para publicar. Vive en Vue fuera del WC. Se muestra en S2 vía `v-if="isS2"`. Dispara `goToPublish()`. |
| `BizFeedService` | `shared/api/services/feed/biz-feed.service.ts` | ✅ CREADO | Service que consulta `GET /api/v1/antojados/biz/feed`. Métodos: `list()` (con `BizFeedParams`), `listByPublisher()`, `getById()`, `listAssociated()`. Mapea `RawBizPost` → `FeedItem` con `mediaGallery`, `postTypeLabel`, `ratingVerdicts`, `comments`. |
| `BizFeedParams` / `FeedItem` | `shared/api/types/feed.ts` | ✅ CREADO | Tipos canónicos: `BizFeedParams` (cityCode, scopeLevel, postType, feedScope, etc.), `FeedItem` (id, mediaUrl, mediaGallery, mediaFullUrl, videoUrl, likesCount, commentsCount, postType, postTypeLabel, caption, title, venueName, publisherUserId, comments, ratingVerdicts). |
| `feedItemToCardViewport` | `shared/ui/services/document-package/feedItemToCardViewport.ts` | ✅ CREADO | Bridge `feedItemListToCardViewport(FeedItem[])` → `CardViewportPost[]`. Transforma `mediaGallery`, `title`, `caption`, `postTypeLabel` al `docJson` plano que entiende el WC (`badge`, `descripciones`, `titulo`, `nombre_platillo`, `texto_promo`, `media[]`, `comments[]`). |
| `useAntojoFeed` | `shared/api/composables/useAntojoFeed.ts` | ✅ CREADO | Composable Vue que envuelve `BizFeedService.list()` con manejo de scope (vas_ir, arre), estados loading/error y refresh. Usado por SponsorVasIrPage y SponsorArrePage. |
| `SponsorS1Base.vue` | `shared/ui/base/SponsorS1Base.vue` | ✅ ACTUALIZADO | Soporte dual: `DocumentPackageContract` (nuevo) + `SponsorPost` (legacy). Adaptadores `adaptDocumentPackageContractToRenderData` y `adaptSponsorPostToRenderData`. Mantiene props legacy. |
| `UserS1Base.vue` | `shared/ui/base/UserS1Base.vue` | ✅ ACTUALIZADO | Soporte dual: `DocumentPackageContract` + `SponsorPost`. Mantiene props legacy. |
| Routes Vas Ir | `shared/ui/app/router/routes.js` | ✅ ACTUALIZADO | Ruta `/antojo/vas-ir/gallery` → `SponsorVasIrPage` (S1). Ruta con `sponsorId` para S2. |
| Routes Arre | `shared/ui/app/router/routes.js` | ✅ ACTUALIZADO | Ruta `/antojo/arre/agenda` → `SponsorArrePage` (S1). Ruta con `sponsorId` para S2. |
| Config Quasar iOS | `apps/app-ios/quasar.config.js` | ✅ ACTUALIZADO | Proxy `/api/v1/*` → `https://api.antojadosmx.mx`. Custom element `card-viewport` en `isCustomElement`. `beforeBuild` ejecuta `scripts/sync-cards.mjs`. |
| Config Quasar Android | `apps/android-new/quasar.config.js` | ✅ ACTUALIZADO | Proxy `/api/v1/*` → `https://api.antojadosmx.mx`. Custom element `card-viewport`. |
| Sync de cards | `scripts/sync-cards.mjs` | ✅ CREADO | Copia `shared/ui/cards/` → `apps/app-ios/public/shared/cards/` y `apps/android-new/public/shared/cards/`. Se ejecuta en `beforeBuild` de ambos Quasar projects. |
| Env development iOS | `apps/app-ios/.env.development` | ✅ AJUSTADO | `VITE_API_URL=http://localhost:9000` para usar proxy local. `VITE_APP_ENV=development`. |
| `httpClient` config | `shared/http/config/api.ts` | ✅ ACTUALIZADO | Lee `VITE_API_URL` como `baseURL`. Valida con `assertApiConfigured()`. Timeout configurable via `VITE_API_TIMEOUT`. |
| Interceptors HTTP | `shared/http/interceptors.ts` | ✅ ACTUALIZADO | Logging de requests/responses con `[TRACE interceptor]`. Manejo de error `Network Error` para debug de conectividad. Token auth via header (si existe). |

### ✅ Seed de Datos Demo

| Acción | Estado | Detalle |
|---|---|---|
| 20 posts VAS IR | ✅ SEMBRADOS en BD producción | Via `antojados_core.usp_publish_biz_post` con `sponsor_id=spon_demo_001`, channel=vas_ir. Imágenes Unsplash de comida, promos, descuentos. `doc_json` con badge, price, descripciones, titulo. |
| 10 posts ARRE | ✅ SEMBRADOS en BD producción | Via `antojados_core.usp_publish_biz_post` con `sponsor_id=spon_demo_001`, channel=arre. Imágenes Unsplash de eventos, música, DJ, conciertos. |
| Sponsor demo | `spon_demo_001` | Todos los posts pertenecen a este sponsor. Sin lugar/ciudad asociado (no hay `place_id` en biz_posts). |
| Script de seed (servidor) | `/opt/api_antojados/scripts/seed-demo.cjs` | Seed directo via SP `usp_publish_biz_post`. No usa Media Engine. Los `media_url` apuntan directo a Unsplash. |
| Script local | `apps-antojados/scripts/seed-insert.cjs` | Versión local del script (con errores de columnas legacy, no ejecutable directamente). |
| Verificación | ✅ 30 posts insertados | Confirmado vía log de ejecución. Todos con status=active y created_at escalonado. |

### ✅ Pendientes resueltos

| Pendiente | Estado | Detalle |
|---|---|---|
| `services/antojados/biz.routes.js` legacy | 🗑️ **ELIMINADO** | Archivo huérfano duplicado, no se importaba desde ningún lado |
| `bizResolver.js.bak`, `postsResolver.js.bak-*` | 🗑️ **ELIMINADOS** | Backups legacy que ya no son necesarios |
| Tests de integración feed | 🟢 PENDIENTE | Futuro: probar flujo publish → engine → feed → consume |
| Preferencias de usuario (popular/reciente) | 🟢 PENDIENTE | Futuro: persistir modo sort en user_preferences |
| Error `Invalid column name 'duration_ms'` en feedService | 🔴 PENDIENTE | La consulta SQL en `feedService.js` referencia `duration_ms` que no existe en `biz_posts`. Hay que agregar la columna o corregir la query. |
| Filtro geo por ciudad en feedService | 🔴 PENDIENTE | `feedService.js` requiere `place_id` en `biz_posts` para filtrar por ciudad. Los posts demo no tienen `place_id`. El feed actualmente devuelve error en lugar de datos. |
| Conexión `ERR_CONNECTION_REFUSED` a `:8010` | 🔴 PENDIENTE | El frontend intenta conectar a `http://localhost:8010` directamente. Se cambió `VITE_API_URL=http://localhost:9000` pero el proxy de Quasar debe redirigir a `https://api.antojadosmx.mx`. |

═══

## 7. Reglas de Negocio

1. **UUID siempre con guiones**: `LOWER(NEWID())` → `20bf35f6-efd9-4980-91ed-039003fe77a8`
2. **`doc_json`** solo contiene: `badge`, `price`, `descripciones[]` — NO `title`, `body`, `effects`, `template_code`, `mediaItems`
3. **`media_url`** en la tabla principal es la URL del primer/principal media. Los adicionales van en `*_post_media`
4. **Métricas** se actualizan exclusivamente via SPs de interacción (nunca UPDATE directo)
5. **Status** solo acepta: `active`, `archived`, `deleted`

---

## 8. Modelo de Datos del Media Engine — Esquema `me.`

El Media Engine opera sobre su propia base de datos `ATLX_MediaEngine`, esquema `me.`.
**Nunca escribe en `antojados_core`.** El Gateway es el puente entre ambos mundos.

### 8.1 `me.media_request` — Solicitud de procesamiento

Raíz de cada media procesado. Creada en el intake (paso ① del flujo).

| Columna | Tipo | Descripción |
|---|---|---|
| `media_id` | `UNIQUEIDENTIFIER PK` | UUID del media (NEWID()) |
| `source_app` | `NVARCHAR(30)` | `android`, `ios`, `explorer`, `web`, `admin`, `worker` |
| `source_actor_type` | `NVARCHAR(30)` | `user`, `sponsor`, `explorer`, `employee`, `admin`, `system` |
| `source_actor_id` | `NVARCHAR(120)` | ID del actor (user_id, sponsor_id, etc.) |
| `target_context` | `NVARCHAR(40)` | `post`, `short`, `pachanga`, `profile`, `sponsor`, `event`, `promo`, `cover`, `avatar`, `story`, `gallery`, `fullscreen` |
| `external_context_id` | `NVARCHAR(160)` | ID externo de referencia (opcional) |
| `client_reference_id` | `NVARCHAR(160)` | Para idempotencia (source_app + client_reference_id = único) |
| `media_type` | `NVARCHAR(20)` | `image`, `video` |
| `processing_profile_code` | `NVARCHAR(60)` | Perfil de procesamiento (Sección 9). Default `standard` |
| `watermark_profile_code` | `NVARCHAR(60)` | Perfil de watermark (opcional) |
| `status` | `NVARCHAR(30)` | `received` → `uploading` → `uploaded` → `queued` → `processing` → `ready` / `failed` / `rejected` / `canceled` / `expired` |
| `moderation_status` | `NVARCHAR(30)` | `none`, `pending`, `approved`, `rejected`, `manual_review` |
| `ready_payload_json` | `NVARCHAR(MAX)` | Payload cachead cuando status = ready |
| `payload_version` | `INT` | Versión del payload. Default `3` |
| `created_at` / `updated_at` | `DATETIME2(3)` | Timestamps |
| `uploaded_at` / `ready_at` / `failed_at` / `rejected_at` / `canceled_at` / `expired_at` | `DATETIME2(3)` | Timestamps de estado |

### 8.2 `me.media_rights_origin` — Derechos y origen

Registro de origen, licencia y política de uso del media.

| Columna clave | Descripción |
|---|---|
| `origin_type` | `official_antojados`, `explorer_partner`, `created_in_antojados`, `uploaded_by_owner`, `licensed_content`, `external_platform`, `demo_content`, `unknown` |
| `origin_platform` | `antojados`, `explorer`, `tiktok`, `instagram`, `facebook`, `youtube`, `whatsapp`, `camera_roll`, `web`, `unknown` |
| `ownership_type` | `company_owned`, `licensed_to_company`, `creator_owned`, `business_owned`, `third_party`, `unknown` |
| `rights_status` | `pending`, `declared`, `approved`, `restricted`, `rejected`, `takedown_requested`, `removed` |
| `is_demo_content` | `BIT` — Si es contenido demo (muestra label en UI) |
| `allow_engine_watermark` | `BIT` — Si el engine puede aplicar watermark de Antojados |
| `engine_watermark_policy` | `apply`, `skip`, `preserve_external`, `admin_review`, `blocked` |

### 8.3 `me.media_original` — Archivo original

Metadata del archivo original subido.

| Columna clave | Descripción |
|---|---|
| `original_url` | URL pública temporal del original |
| `original_storage_path` | Ruta local/absoluta en disco |
| `mime_type` / `extension` | Tipo MIME y extensión |
| `size_bytes` | Tamaño en bytes |
| `width` / `height` | Dimensiones originales |
| `duration_ms` | Duración (solo video) |
| `sha256_hash` | Hash SHA-256 del archivo |
| `exif_json` / `metadata_json` | Metadatos extraídos |

### 8.4 `me.media_variant` — Variantes procesadas

Cada variante generada por el worker (thumb, feed, full, short, video_preview, etc.).

| Columna clave | Descripción |
|---|---|
| `variant_code` | `thumb`, `grid`, `feed`, `full`, `story`, `cover`, `avatar`, `short`, `feed_video`, `video_preview`, `watermarked`, `original_safe` |
| `media_type` | `image`, `video` |
| `url` | URL pública de la variante |
| `storage_path` | Ruta local/absoluta |
| `width` / `height` | Dimensiones finales |
| `aspect_ratio` | Ratio calculado (ej. `3:5`, `5:3`, `1:1`, `9:16`) |
| `codec` / `bitrate_kbps` / `fps` | Solo video |
| `has_watermark` | `BIT` — Si se aplicó watermark |
| `is_public` | `BIT` — Si es accesible públicamente |
| Unique | `(media_id, variant_code)` |

### 8.5 `me.processing_job` — Cola de trabajos

Jobs encolados por el worker para procesamiento background.

| Columna clave | Descripción |
|---|---|
| `job_type` | `normalize`, `thumbnail`, `compress`, `watermark`, `metadata`, `payload`, `full_pipeline` |
| `status` | `pending` → `running` → `done` / `failed` / `canceled` |
| `priority` | Prioridad (menor = más prioritario). Default `100` |
| `locked_by` | Worker ID que tomó el job |
| `attempts` / `max_attempts` | Reintentos. Default `3` máx |

### 8.6 `me.media_event_log` — Auditoría

Registro de eventos del engine para trazabilidad.

### 8.7 Vistas principales

| Vista | Propósito |
|---|---|
| `me.v_media_ready_payload` | Payload público listo para consumo |
| `me.v_media_request_summary` | Resumen operativo del media request |

### 8.8 Almacenamiento en disco

```
/media/{YYYY}/{MM}/{media_uuid}/
├── original.{ext}        # Backup del original
├── thumb.jpg             # Miniatura (según perfil)
├── grid.jpg              # Grid (600×600, siempre se genera)
├── feed.jpg              # Media principal del card (según perfil)
├── full.jpg              # Full resolución (según perfil)
├── story.jpg             # Story (1080×1920)
├── cover.jpg             # Cover (1080×608)
├── avatar.jpg             # Avatar (512×512)
├── short.mp4             # Short video (1080×1920, solo video)
├── feed_video.mp4        # Video horizontal (solo video)
└── video_preview.jpg     # Preview thumbnail del video (solo video)
```

---

## 9. Perfiles de Procesamiento (Processing Profiles)

Los perfiles determinan las **dimensiones exactas** de las variantes `thumb`, `feed` y `full`
según la **orientación del contenido** y el **canal de publicación**.

### 9.1 Perfiles disponibles

| Código | Orientación | Grilla | Proporción | thumb | feed | full | Uso típico |
|--------|------------|--------|-----------|-------|------|------|------------|
| `portrait_standard` | Vertical (alto > ancho) | 24×40 | 3:5 | 384×640 | 576×960 | 1080×1800 | Fotos verticales, posts en feed |
| `landscape_standard` | Horizontal (ancho > alto) | 40×24 | 5:3 | 640×384 | 960×576 | 1800×1080 | Fotos horizontales |
| `square_standard` | Cuadrado (ancho = alto) | 30×30 | 1:1 | 320×320 | 800×800 | 1440×1440 | Fotos cuadradas |
| `short_vertical` | Vertical — solo video | 24×40 | 9:16 | — | 480×854 | — | Shorts video (desma, que_pex) |

### 9.2 Mapeo canal → perfil

El `channelProfileMapper.js` (en `adapters/antojados/`) resuelve el perfil según:

```
channel + mediaType + sourceOrientation → processingProfileCode
```

| Canal | mediaType | Orientaciones aceptadas | Perfiles posibles |
|-------|-----------|------------------------|-------------------|
| `vas_ir` (biz) | image / video | portrait, landscape, square | portrait_standard, landscape_standard, square_standard |
| `arre` (biz) | image / video | portrait, landscape, square | portrait_standard, landscape_standard, square_standard |
| `barrio` (soc) | image / video | portrait, landscape, square | portrait_standard, landscape_standard, square_standard |
| `pachanga/neta` (soc) | image / video | portrait, landscape, square | portrait_standard, landscape_standard, square_standard |
| `que_pex` (soc) | image / video | portrait, landscape, square | portrait_standard, landscape_standard, square_standard, short_vertical |
| `desma` (soc) | **video only** | vertical (shorts) | short_vertical |

### 9.3 Detección de orientación

El worker detecta automáticamente la orientación del original:

```js
if (width > height) → landscape
if (width < height) → portrait
if (width === height) → square
```

Para videos en canal `desma` o `target_context = 'short'`, se fuerza `short_vertical`
independientemente de la orientación detectada.

### 9.4 Variantes que se conservan (independientes del perfil)

Estas variantes **siempre se generan** con dimensiones fijas, sin importar el perfil:

| Variante | Dimensión | Propósito |
|----------|-----------|-----------|
| `grid` | 600×600 | Mosaicos / galerías futuras |
| `story` | 1080×1920 | Stories (futuro) |
| `cover` | 1080×608 | Post editoriales tipo banner |
| `avatar` | 512×512 | Avatares de perfil |

---

## 10. Servicios del Media Engine

### 10.1 Endpoints REST (API Contract V3)

| Método | Ruta | Propósito | Llamado por |
|--------|------|-----------|-------------|
| `POST` | `/api/media/requests` | Crear media request | Cliente (app/web) |
| `POST` | `/api/media/{mediaId}/rights-origin` | Registrar derechos/origen | Cliente |
| `GET` | `/api/media/{mediaId}/rights-origin` | Obtener derechos/origen | Diagnóstico |
| `POST` | `/api/media/{mediaId}/original` | Subir archivo original (multipart) | Cliente |
| `GET` | `/api/media/{mediaId}` | Info del media request | Gateway / diagnóstico |
| `GET` | `/api/media/{mediaId}/ready-payload` | Obtener payload listo | **Gateway** (`engineClient.js`) |
| `GET` | `/api/media/{mediaId}/policy` | Evaluar política de derechos | Worker / diagnóstico |
| `POST` | `/api/media/{mediaId}/cancel` | Cancelar media pendiente | Cliente |
| `GET` | `/health` | Health check | DevOps |

### 10.2 Ready Payload — respuesta estándar

Cuando `status = ready`, el endpoint `GET /ready-payload` devuelve:

```json
{
  "mediaId": "abc-123",
  "status": "ready",
  "ready": true,
  "payload": {
    "thumbUrl": "/media/2026/07/abc-123/thumb.jpg",
    "gridUrl": "/media/2026/07/abc-123/grid.jpg",
    "feedUrl": "/media/2026/07/abc-123/feed.jpg",
    "fullUrl": "/media/2026/07/abc-123/full.jpg",
    "coverUrl": "/media/2026/07/abc-123/cover.jpg",
    "videoUrl": "/media/2026/07/abc-123/short.mp4",
    "videoPreviewUrl": "/media/2026/07/abc-123/video_preview.jpg",
    "width": 576,
    "height": 960,
    "aspectRatio": "3:5",
    "rightsStatus": "approved",
    "isDemoContent": false
  }
}
```

### 10.3 Clientes HTTP

| Cliente | Lenguaje | Ubicación | Usado por |
|---------|----------|-----------|-----------|
| `engineClient.js` | Node (CommonJS) | `Api_getaway_antojadosmx/src/services/antojados/engineClient.js` | Gateway (bizResolver, postsResolver) |
| `mediaEngineClient.ts` | TypeScript | `apps-antojados/shared/api/services/media-engine/mediaEngineClient.ts` | Frontend AntojadosMX (apps Android/iOS) |

### 10.4 Adaptadores Antojados (registrados en serviceRegistry)

| Archivo | Propósito |
|---------|-----------|
| `adapters/antojados/channelProfileMapper.js` | Resuelve `processing_profile_code` según canal, tipo media y orientación |
| `adapters/antojados/mediaPackageMapper.js` | Mapea variantes del engine al formato que esperan `bizResolver.js` y `postsResolver.js` |

**Nota multi-servicio:** El Media Engine usa `serviceRegistry.js` para gestionar adaptadores
por servicio. Cada `sourceApp` (antojados, explorer, generic) tiene su propio
conjunto de mappers. Los adaptadores de Antojados se registran en `index.js`:

```js
serviceRegistry.registerService('antojados', {
  channelProfileMapper: antojadosChannelProfileMapper,
  mediaPackageMapper: antojadosPackageMapper,
});
```

### 10.5 Flujo completo (engine → Gateway → BD)

```
Cliente sube media
  ↓
Media Engine procesa (perfil portrait/landscape/square/short)
  ↓
Gateway consulta ready-payload → recibe { thumb_url, feed_url, full_url }
  ↓
Gateway inserta en biz_posts / soc_posts (media_url = feed_url)
  ↓
Gateway inserta en biz_post_media / soc_post_media (thumb/feed/full + asset_id)
  ↓
Frontend consume media_url desde el post — sin cambios en el consumo
```

---

## 11. Feed Service — Consumo y Persistencia de Posts

### 11.1 Arquitectura de Consumo

El feed unificado se sirve a través de `feedService.js`, que es el **único** punto de entrada
para consultar posts. No se consulta `biz_posts` ni `soc_posts` directamente.

```
FRONTEND (App/Web)
  │
  GET /api/v1/antojados/feed?feed_scope=vas_ir&city_code=MTY&cursor=...&limit=20
  │
  ▼
GATEWAY → feedService.js
  │
  ├── 1. Resuelve ciudad/scope vía geoResolver
  ├── 2. Determina qué canales consultar según feed_scope
  ├── 3. Consulta biz_posts y/o soc_posts con JOIN a sponsor/user para filtro geo
  ├── 4. Aplica scoring (engagement_score + recencia)
  ├── 5. Pagina con cursor-based pagination (by created_at, biz_post_id)
  └── 6. Devuelve feed unificado + metadatos de paginación
```

### 11.2 Estructura del Feed: GEO define alcance, CANAL define contenido

```
feed_scope                    → Define QUÉ canales se sirven (modal/canal específico)
  │
  ├── 'vas_ir'               → biz_posts WHERE channel = 'vas_ir'
  ├── 'arre'                 → biz_posts WHERE channel = 'arre' (eventos)
  ├── 'pachanga'             → soc_posts WHERE channel IN ('pachanga', 'neta')
  ├── 'barrio'               → soc_posts WHERE channel = 'barrio'
  ├── 'que_pex'              → soc_posts WHERE channel = 'que_pex' (contenido Explorer)
  └── 'desma'                → soc_posts WHERE channel = 'desma' (solo shorts video)

city_scope / scope_level      → Define QUÉ contenido es visible (filtro geo)
  │
  ├── scope_level = 'ciudad' → filtrar por ciudad del sponsor/user
  ├── scope_level = 'zona'   → filtrar por zona metropolitana
  ├── scope_level = 'mexico' → todo el país
  └── scope_level = 'global' → todo (futuro, sin filtro)

scoring (orden dentro del canal)
  ├── Por defecto: created_at DESC (más recientes primero)
  ├── popular=true: engagement_score DESC, created_at DESC
  └── (futuro) preferencias + afinidad del usuario
```

### 11.3 Mapeo feed_scope → canales y tablas

| feed_scope | Módulo | Modal | Tabla | Canales | Origen del contenido |
|-----------|--------|-------|-------|---------|---------------------|
| `vas_ir` | antojo | biz/sponsors | `biz_posts` | `vas_ir` | AntojadosMX (sponsors) |
| `arre` | antojo | biz/sponsors (on demand) | `biz_posts` | `arre` | AntojadosMX (eventos) |
| `pachanga` | antojados | user (dos modales) | `soc_posts` | `pachanga`, `neta` | AntojadosMX (usuarios) |
| `barrio` | antojados | user (modal global/méxico) | `soc_posts` | `barrio` | AntojadosMX (usuarios) |
| `que_pex` | antojados | user | `soc_posts` | `que_pex` | Explorer App (expuesto en Antojados) |
| `desma` | antojados | user (shorts) | `soc_posts` | `desma` | AntojadosMX (solo shorts video) |

### 11.4 Contrato de Rutas del Feed

| Método | Ruta | feed_scope | Descripción |
|--------|------|-----------|-------------|
| `GET` | `/api/v1/antojados/feed` | dinámico | Feed unificado multi-canal (parámetro `feed_scope`) |
| `GET` | `/api/v1/antojados/biz/feed` | `vas_ir` | Feed de negocios (vas_ir) |
| `GET` | `/api/v1/antojados/biz/feed/arre` | `arre` | Feed de eventos (arre) |
| `GET` | `/api/v1/antojados/posts/feed/pachanga` | `pachanga` | Feed social pachanga/neta |
| `GET` | `/api/v1/antojados/posts/feed/barrio` | `barrio` | Feed social barrio |
| `GET` | `/api/v1/antojados/posts/feed/que-pex` | `que_pex` | Feed que_pex (Explorer) |
| `GET` | `/api/v1/antojados/posts/feed/desma` | `desma` | Feed shorts (desma) |

### 11.5 Query Parameters (comunes a todas las rutas de feed)

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `city_code` | string | contexto geo del usuario | Filtro por ciudad (`MTY`, `CDMX`, `GDL`, etc.) |
| `scope_level` | string | `'ciudad'` | Nivel geográfico (`ciudad`, `zona`, `mexico`, `global`) |
| `cursor` | string | `null` | Cursor para paginación (base64 de `created_at` + `post_id`) |
| `limit` | int | `20` | Posts por página (max `50`) |
| `popular` | boolean | `false` | Si `true`, ordena por `engagement_score DESC` en vez de fecha |

### 11.6 Respuesta del Feed

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "type": "biz",
      "channel": "vas_ir",
      "owner_id": "spon_abc",
      "media_url": "/media/2026/07/abc-123/feed.jpg",
      "doc_json": {
        "badge": "Oferta",
        "price": "$199",
        "descripciones": ["Deliciosa torta de la casa"]
      },
      "media": [
        {
          "media_id": "660e8400-...",
          "media_type": "photo",
          "media_url": "/media/2026/07/abc-123/feed.jpg",
          "sort_order": 0,
          "thumb_url": "/media/2026/07/abc-123/thumb.jpg",
          "feed_url": "/media/2026/07/abc-123/feed.jpg",
          "full_url": "/media/2026/07/abc-123/full.jpg",
          "asset_id": "abc-123"
        }
      ],
      "has_liked": true,
      "likes_count": 15,
      "comments_count": 3,
      "views_count": 142,
      "shares_count": 2,
      "engagement_score": 8.4570,
      "taps_whatsapp_count": 5,
      "taps_maps_count": 1,
      "cta_clicks_count": 7,
      "created_at": "2026-07-15T14:30:00.000Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655441111",
      "type": "soc",
      "channel": "barrio",
      "owner_id": "usr_456",
      "media_url": "/media/2026/07/def-456/feed.jpg",
      "doc_json": null,
      "author": {
        "user_id": "usr_456",
        "display_name": "Juan Pérez",
        "avatar_url": "/avatars/usr_456.jpg"
      },
      "media": [],
      "has_liked": false,
      "likes_count": 3,
      "comments_count": 1,
      "views_count": 28,
      "shares_count": 0,
      "engagement_score": 1.2345,
      "created_at": "2026-07-14T10:00:00.000Z"
    }
  ],
  "cursor": {
    "next": "eyJjcmVhdGVkX2F0IjoiMjAyNi0wNy0xNVQxNDozMDowMC4wMDBaIiwicG9zdF9pZCI6IjU1MGU4NDAwLWUyOWItNDFkNC1hNzE2LTQ0NjY1NTQ0MDAwMCJ9",
    "prev": null
  },
  "meta": {
    "scope_level": "ciudad",
    "city_code": "MTY",
    "feed_scope": "vas_ir",
    "has_more": true,
    "geo_filter_applied": true
  }
}
```

**Campos de enriquecimiento (añadidos por feedService):**

| Campo | Tipo | Presente en | Descripción |
|---|---|---|---|
| `has_liked` | `boolean` | biz + soc | `true` si el usuario autenticado (`userId`) ha dado like al post. `false` si no se provee `userId` |
| `author` | `object` | solo soc | Objeto con `user_id`, `display_name`, `avatar_url` del autor del post social |
| `owner_id` | `string` | biz + soc | Alias unificado: `sponsor_id` para biz, `user_id` para soc |
| `geo_filter_applied` | `boolean` | meta | Indica si se aplicó filtro de ciudad en la consulta |
```

### 11.7 Cursor-based pagination

Se usa paginación por cursor basada en `(created_at, post_id)` para evitar
duplicados en feeds activos donde entran nuevos posts constantemente.

```typescript
interface FeedCursor {
  created_at: string   // ISO 8601
  post_id: string      // UUID del último post en la página actual
}

// Codificación: base64(JSON.stringify(cursor))
// URL: ?cursor=eyJjcmVhdGVkX2F0IjoiMjAyNi0wNy0xNVQxNDozMDowMC4wMDBaIiwicG9zdF9pZCI6IjU1MGU4NDAwLWUyOWItNDFkNC1hNzE2LTQ0NjY1NTQ0MDAwMCJ9

// SQL equivalente:
// SELECT TOP (@limit) ...
// FROM ...
// WHERE (created_at < @cursor_created_at
//    OR (created_at = @cursor_created_at AND post_id < @cursor_post_id))
// ORDER BY created_at DESC, post_id DESC
```

### 11.8 Servicio `feedService.js`

El código fuente del servicio de feed está en:
`Api_getaway_antojadosmx/src/services/antojados/feedService.js`

Este archivo es la **única fuente de verdad** para:
- `getFeed()` — consulta paginada con filtro geo, cursor y scoring
- `getFeedWithMedia()` — wrapper que además adjunta `media[]` (thumb/feed/full)
- `FEED_SCOPE_MAP` — mapeo feed_scope → tabla, canales y tipo

No se replica el código aquí para evitar desincronización.
