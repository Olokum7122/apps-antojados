# Auditoría de Arquitectura — Feed de AntojadosMX

> **Documento adjunto a:** `docs/feed.md`
> **Propósito:** Verificar que cada archivo del modelo de datos tenga header conforme al spec y no viole las reglas del modelo.
> **Método:** Checklist ordered por orden de implementación ideal según `feed.md`.

---

## 📋 Orden de Implementación Ideal (desde feed.md)

El spec define capas que deben implementarse en este orden:

| Orden | Capa | Archivos | Sección feed.md | Estado |
|-------|------|----------|-----------------|--------|
| 1 | **DDL — Tablas** | `01_ddl_biz_posts.sql`, `02_ddl_biz_post_media.sql`, `10_ddl_soc_posts.sql`, `11_ddl_soc_post_media.sql`, `14_ddl_soc_post_interactions.sql` | §1, §2, §3, §4 | ✅ CORREGIDO |
| 2 | **SPs — Publicación** | `03_usp_publish_biz_post.sql`, `04_sp_biz_post_media_attach.sql`, `12_usp_publish_soc_post.sql`, `13_sp_soc_post_media_attach.sql` | §5 | ✅ CORREGIDO |
| 3 | **SPs — Interacciones Biz** | `05_usp_biz_post_like.sql`, `06_usp_biz_post_unlike.sql`, `07_usp_biz_post_comment.sql`, `08_usp_biz_post_view.sql`, `09_usp_biz_post_interactions_summary.sql` | §5 | ✅ CORREGIDO |
| 4 | **SPs — Interacciones Soc** | `14_usp_soc_post_like.sql`, `15_usp_soc_post_unlike.sql`, `16_usp_soc_post_comment.sql`, `17_usp_soc_post_view.sql`, `18_usp_soc_post_interactions_summary.sql` | §5 | ✅ CORREGIDO |
| 5 | **Gateway — DB Shared** | `db.js`, `_shared.js`, `_scope.js` | — | ✅ CORREGIDO |
| 6 | **Gateway — Engine Client** | `engineClient.js` | §10.3 | ✅ YA TENÍA HEADER |
| 7 | **Gateway — Resolvers** | `bizResolver.js`, `postsResolver.js`, `mediaPackage.resolver.js` | §1-6 | ✅ CORREGIDO |
| 8 | **Gateway — Mappers** | `bizMapper.js`, `postsMapper.js` | — | ✅ CORREGIDO |
| 9 | **Gateway — Service Layer** | `biz.service.js`, `posts.service.js` | — | ✅ CORREGIDO |
| 10 | **Gateway — Feed Service** | `feedService.js` | §11 | ✅ CORREGIDO |
| 11 | **Gateway — Routes/Routers** | `biz.routes.js`, `posts.routes.js`, `feedRouter.js` | §11.4 | ✅ CORREGIDO |
| 12 | **Gateway — Routes Index** | `routes/v1/antojados/index.js`, `services/antojados/index.js` | — | ✅ CORREGIDO |
| 13 | **Gateway — Geo** | `geoResolver.js`, `geoMapper.js`, `geo.service.js`, `geo.routes.js` | §11.2 | ⬜ PENDIENTE |
| 14 | **Gateway — Helpers** | `_helpers.js` | — | ⬜ PENDIENTE |
| 15 | **Gateway — Main** | `index.js` | — | ⬜ PENDIENTE |
| 16 | **Shared UI — Web Component** | `interactive-card.js`, `card-viewport.js`, `index.html`, `roots.css`, `styles-card-manager.js` | Frontend | ⬜ PENDIENTE |
| 17 | **Shared UI — Vue Components** | `SponsorVasIrPage.vue`, `SponsorArrePage.vue`, `PostActionRailBase.vue`, `PublishFabBase.vue` | Frontend | ⬜ PENDIENTE |
| 18 | **Shared UI — Base** | `SponsorS1Base.vue`, `UserS1Base.vue` | Frontend | ⬜ PENDIENTE |
| 19 | **Shared API — Services** | `feed/feedItemToCardViewport.ts`, `feed/biz-feed.service.ts`, `feed/useAntojoFeed.ts` | Frontend | ⬜ PENDIENTE |
| 20 | **Shared API — Types** | `types/feed.ts` | Frontend | ⬜ PENDIENTE |
| 21 | **Shared UI — Assets** | `brand/bitmap.png` | §9 | ⬜ PENDIENTE |
| 22 | **Media Engine** | (separado, no en este repo) | §8-10 | — (externo) |

---

## ✅ ESTADO DE AUDITORÍA POR ARCHIVO

### 🔷 CAPA 1: DDL — Tablas (SQL) — ✅ CORREGIDO

| Archivo | Header | Violaciones al modelo | Corrección aplicada |
|---------|--------|----------------------|---------------------|
| `sql/antojados-core/01_ddl_biz_posts.sql` | ✅ AGREGADO | Sin violaciones. Fiel al modelo §1 | Header con DOMINIO, RESPONSABLE, NO HACE (legacy listado), REFERENCIAS |
| `sql/antojados-core/02_ddl_biz_post_media.sql` | ✅ AGREGADO | Faltaba DEFAULT 'photo' en media_type | Header + `DEFAULT 'photo'` agregado |
| `sql/antojados-core/10_ddl_soc_posts.sql` | ✅ AGREGADO | Sin violaciones. Fiel al modelo §3 | Header con DOMINIO, NO HACE (enumera diferencias Biz vs Soc) |
| `sql/antojados-core/11_ddl_soc_post_media.sql` | ✅ AGREGADO | Faltaba DEFAULT 'photo' en media_type | Header + `DEFAULT 'photo'` agregado |
| `sql/antojados-core/14_ddl_soc_post_interactions.sql` | ✅ AGREGADO | Documentada deuda: feedService.js usaba target_post_id que no coincide | Header + deuda documentada |

### 🔷 CAPA 2: SPs — Publicación (SQL) — ✅ CORREGIDO

| Archivo | Header | Violaciones al modelo |
|---------|--------|----------------------|
| `sql/antojados-core/03_usp_publish_biz_post.sql` | ✅ AGREGADO | Sin violaciones |
| `sql/antojados-core/04_sp_biz_post_media_attach.sql` | ✅ AGREGADO | Sin violaciones |
| `sql/antojados-core/12_usp_publish_soc_post.sql` | ✅ AGREGADO | Sin violaciones |
| `sql/antojados-core/13_sp_soc_post_media_attach.sql` | ✅ AGREGADO | Sin violaciones |

### 🔷 CAPA 3: SPs — Interacciones Biz (SQL) — ✅ CORREGIDO

| Archivo | Header | Violaciones al modelo |
|---------|--------|----------------------|
| `sql/antojados-core/05_usp_biz_post_like.sql` | ✅ AGREGADO | Documentada deuda: falta DDL de biz_post_interactions |
| `sql/antojados-core/06_usp_biz_post_unlike.sql` | ✅ AGREGADO | Sin violaciones |
| `sql/antojados-core/07_usp_biz_post_comment.sql` | ✅ AGREGADO | Sin violaciones |
| `sql/antojados-core/08_usp_biz_post_view.sql` | ✅ AGREGADO | Sin violaciones |
| `sql/antojados-core/09_usp_biz_post_interactions_summary.sql` | ✅ AGREGADO | Sin violaciones |

### 🔷 CAPA 4: SPs — Interacciones Soc (SQL) — ✅ CORREGIDO

| Archivo | Header | Violaciones al modelo |
|---------|--------|----------------------|
| `sql/antojados-core/14_usp_soc_post_like.sql` | ✅ AGREGADO | Sin violaciones |
| `sql/antojados-core/15_usp_soc_post_unlike.sql` | ✅ AGREGADO | Sin violaciones |
| `sql/antojados-core/16_usp_soc_post_comment.sql` | ✅ AGREGADO | Sin violaciones |
| `sql/antojados-core/17_usp_soc_post_view.sql` | ✅ AGREGADO | Sin violaciones |
| `sql/antojados-core/18_usp_soc_post_interactions_summary.sql` | ✅ AGREGADO | Sin violaciones |

### 🔷 CAPA 5: Gateway — DB Shared (JS) — ✅ CORREGIDO

| Archivo | Header | Violaciones al modelo |
|---------|--------|----------------------|
| `Api_getaway_antojadosmx/src/db.js` | ✅ AGREGADO | Sin violaciones |
| `Api_getaway_antojadosmx/src/services/antojados/_shared.js` | ✅ AGREGADO | Sin violaciones |
| `Api_getaway_antojadosmx/src/services/antojados/_scope.js` | ✅ AGREGADO | Documenta que 'metro' y 'tu_zona' no están en feed.md §11.2 |

### 🔷 CAPA 6: Gateway — Engine Client (JS) — ✅ YA TENÍA HEADER

| Archivo | Header | Violaciones al modelo |
|---------|--------|----------------------|
| `engineClient.js` | ✅ COMPLETO | Sin violaciones |

### 🔷 CAPA 7: Gateway — Resolvers (JS) — ✅ CORREGIDO

| Archivo | Header | Violaciones al modelo | Corrección aplicada |
|---------|--------|----------------------|---------------------|
| `bizResolver.js` | ✅ ACTUALIZADO | Contaminación Sponsor Management (deuda #2) | Header actualizado; funciones marcadas |
| `postsResolver.js` | ✅ CORREGIDO | deleteSocPost usaba target_post_id (incorrecto). Header FK incorrecto | Cambiado target_post_id → post_id. Header FK corregido |
| `mediaPackage.resolver.js` | ✅ MARCADO DEUDA | Referencia SP/vista que NO existen (deuda #3) | Header documenta deuda |

### 🔷 CAPA 8: Gateway — Mappers (JS) — ✅ CORREGIDO

| Archivo | Header | Violaciones al modelo |
|---------|--------|----------------------|
| `bizMapper.js` | ✅ AGREGADO | Contaminación Sponsor Management (deuda #2) |
| `postsMapper.js` | ✅ AGREGADO | mapRatePostResult valida rating_id (fuera del modelo) |

### 🔷 CAPA 9: Gateway — Service Layer (JS) — ✅ CORREGIDO

| Archivo | Header | Violaciones al modelo |
|---------|--------|----------------------|
| `biz.service.js` | ✅ AGREGADO | Contaminación Sponsor Management (deuda #2) |
| `posts.service.js` | ✅ AGREGADO | Exporta ratePost (fuera del modelo) |

### 🔷 CAPA 10: Gateway — Feed Service (JS) — ✅ CORREGIDO

| Archivo | Header | Violaciones al modelo | Corrección aplicada |
|---------|--------|----------------------|---------------------|
| `feedService.js` | ✅ COMPLETO | Usaba target_post_id (incorrecto para soc) | **DEUDA #1 SALDADA**: target_post_id → post_id |

### 🔷 CAPA 11: Gateway — Routes/Routers (JS) — ✅ CORREGIDO

| Archivo | Header | Violaciones al modelo | Corrección aplicada |
|---------|--------|----------------------|---------------------|
| `biz.routes.js` | ✅ AGREGADO | Contaminación Sponsor Management (deuda #2) | Header con endpoints del modelo vs fuera |
| `posts.routes.js` | ✅ AGREGADO | Validaba business_name, post_id del cliente, media_type. Listaba 'momentos' | Eliminadas validaciones legacy. Canales corregidos |
| `feedRouter.js` | ✅ COMPLETO | Sin violaciones | Sin cambios |

### 🔷 CAPA 12: Gateway — Indexes (JS) — ✅ CORREGIDO

| Archivo | Header | Violaciones al modelo |
|---------|--------|----------------------|
| `routes/v1/antojados/index.js` | ✅ AGREGADO | Sin violaciones |
| `services/antojados/index.js` | ✅ AGREGADO | Sin violaciones |

### 🔷 CAPA 13: Gateway — Geo (JS) — ⬜ PENDIENTE

| Archivo | Header | Violaciones al modelo |
|---------|--------|----------------------|
| `Api_getaway_antojadosmx/src/services/antojados/geoResolver.js` | ⬜ | ⬜ Pendiente de leer |
| `Api_getaway_antojadosmx/src/services/antojados/geoMapper.js` | ⬜ | ⬜ Pendiente de leer |
| `Api_getaway_antojadosmx/src/services/antojados/geo.service.js` | ⬜ | ⬜ Pendiente de leer |
| `Api_getaway_antojadosmx/src/routes/v1/antojados/geo.routes.js` | ⬜ | ⬜ Pendiente de leer |

### 🔷 CAPA 14: Gateway — Helpers (JS) — ⬜ PENDIENTE

| Archivo | Header | Violaciones al modelo |
|---------|--------|----------------------|
| `Api_getaway_antojadosmx/src/routes/v1/antojados/_helpers.js` | ⬜ | ⬜ Pendiente de leer |

### 🔷 CAPA 15: Gateway — Main (JS) — ⬜ PENDIENTE

| Archivo | Header | Violaciones al modelo |
|---------|--------|----------------------|
| `Api_getaway_antojadosmx/src/index.js` | ⬜ | ⬜ Pendiente de leer |

---

## 🔍 DEUDAS ABIERTAS

| # | Deuda | Archivos afectados | Severidad | Plan de acción |
|---|-------|--------------------|-----------|----------------|
| #2 | Contaminación de Sponsor Management | `bizResolver.js`, `bizMapper.js`, `biz.service.js`, `biz.routes.js` | 🔴 ALTA | Migrar funciones de tiles, setup, expediente a `sponsorManager.js` |
| #3 | mediaPackage.resolver.js obsoleto | `mediaPackage.resolver.js` | 🔴 ALTA | Eliminar cuando todos migren a engineClient.getReadyPayload() |
| #4 | Falta DDL de biz_post_interactions | SPs la referencian pero no hay DDL | 🟡 MEDIA | Crear DDL similar a 14_ddl_soc_post_interactions.sql |
| #5 | posts.service.js exporta ratePost | `posts.service.js` | 🟡 MEDIA | soc_post_ratings no está en feed.md |
| #6 | _scope.js incluye 'metro' y 'tu_zona' | `_scope.js` | 🟡 MEDIA | Documentar en feed.md §11.2 o eliminar |

## ✅ DEUDAS RESUELTAS

| # | Deuda | Resuelta en |
|---|-------|-------------|
| ~~#1~~ | ~~target_post_id vs post_id en feedService.js y postsResolver.js~~ | ✅ RESUELTA |

---

## 🚨 CORRECCIONES CRÍTICAS APLICADAS (bugs runtime)

| # | Archivo | Problema | Síntoma | Corrección |
|---|---------|----------|---------|------------|
| A | `feedService.js` | Subquery has_liked consultaba i.target_post_id | has_liked siempre false para soc | target_post_id → post_id |
| B | `postsResolver.js` | deleteSocPost usaba target_post_id | Error SQL, rollback transacción | target_post_id → post_id |
| C | `posts.routes.js` | Validaba business_name requerido | Error 400 (cliente no lo envía) | Eliminada validación |
| D | `posts.routes.js` | Validaba post_id del cliente | Error 400 (cliente no debe enviarlo) | Se ignora post_id del cliente |
| E | `posts.routes.js` | Validaba media_type requerido | Error 400 (no está en soc_posts) | Eliminada validación |
| F | `posts.routes.js` | Canal 'momentos' permitido | Post no visible en ningún feed | 'momentos' eliminado |

---

## 📊 RESUMEN

| Métrica | Antes | Después |
|---------|-------|---------|
| Total archivos a auditar | ~50 | 50 |
| Archivos auditados y corregidos (Capas 1-12) | — | 36 |
| Archivos pendientes (Capas 13-22) | — | ~14 |
| Con header completo (DOMINIO+RESPONSABLE+NO HACE+REF) | 4 de 50 | 36 de 36 (Capas 1-12) |
| Sin header alguno | ~30 | 0 (Capas 1-12) |
| Violaciones graves al modelo | 4 | 0 corregidas + 3 documentadas como deuda |
| Violaciones de columnas legacy | 4 | 3 corregidas + 1 documentada |
| Bugs de runtime corregidos | 6 (A-F) | 6 resueltos |

---

## ⚠️ NOTA IMPORTANTE

Este documento refleja el estado de **Capas 1 a 12** (36 archivos) que han sido leídos, analizados contra el modelo feed.md, corregidos y marcados.

**Capas 13 a 22** (~14 archivos) están pendientes de auditar en la próxima sesión. Cada archivo marcado como `⬜ PENDIENTE` necesita el mismo proceso sistemático:

1. Verificar header (DOMINIO, RESPONSABLE, NO HACE, REFERENCIAS)
2. Verificar que el código no viole las columnas, tipos, SPs y reglas de feed.md
3. Detectar referencias a tablas/columnas/SPs que no existen en el modelo
4. Detectar cualquier columna legacy (title, body, post_type, publication_type, etc.)
5. Corregir y marcar

---

### 🗺 DEUDAS DE ARQUITECTURA (para planificación futura)

```
sponsorManager.js (propuesto)
├── getTenantTilesForUser()
├── createTile()
├── deleteTile()
├── setupSponsorBusiness()
├── setupSponsorRepresentative()
├── setupSponsorBilling()
├── uploadSponsorExpedienteDocument()
└── listSponsorExpediente()

Actualmente todo esto está en bizResolver.js (contaminación #2)
```

```
Eliminar: mediaPackage.resolver.js
Migrar a: engineClient.getReadyPayload()  (feed.md §10.3)
```

```
Crear:    14_ddl_biz_post_interactions.sql  (deuda #4)
Modelo:   biz_post_interactions
Columnas: interaction_id, biz_post_id (FK → biz_posts), user_id, 
          interaction_type, content_text, parent_comment_id,
          moderation_status, created_at_client, received_at_server
```

---

*Auditoría iniciada el 2026-07-16 — Primera sesión completada (Capas 1-12)*
*Próximo paso: Retomar desde CAPA 13: Gateway — Geo (4 archivos)*
