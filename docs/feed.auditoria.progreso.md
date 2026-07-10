# Progreso de Auditoría y Corrección

> **Fecha:** 2026-07-16
> **Estado:** Auditoría y corrección de Capas 1 a 12 completada
> **Próximo paso:** Retomar desde CAPA 13: Gateway — Geo

---

## ✅ CORREGIDOS (36 archivos)

| # | Archivo | Tipo | Corrección aplicada |
|---|---------|------|---------------------|
| 1 | `01_ddl_biz_posts.sql` | DDL | Header agregado |
| 2 | `02_ddl_biz_post_media.sql` | DDL | Header + DEFAULT 'photo' en media_type |
| 3 | `10_ddl_soc_posts.sql` | DDL | Header agregado |
| 4 | `11_ddl_soc_post_media.sql` | DDL | Header + DEFAULT 'photo' en media_type |
| 5 | `14_ddl_soc_post_interactions.sql` | DDL | Header + deuda documentada (#1) |
| 6 | `03_usp_publish_biz_post.sql` | SP | Header agregado |
| 7 | `04_sp_biz_post_media_attach.sql` | SP | Header agregado |
| 8 | `12_usp_publish_soc_post.sql` | SP | Header agregado |
| 9 | `13_sp_soc_post_media_attach.sql` | SP | Header agregado |
| 10 | `05_usp_biz_post_like.sql` | SP | Header + deuda documentada |
| 11 | `06_usp_biz_post_unlike.sql` | SP | Header agregado |
| 12 | `07_usp_biz_post_comment.sql` | SP | Header agregado |
| 13 | `08_usp_biz_post_view.sql` | SP | Header agregado |
| 14 | `09_usp_biz_post_interactions_summary.sql` | SP | Header agregado |
| 15 | `14_usp_soc_post_like.sql` | SP | Header agregado |
| 16 | `15_usp_soc_post_unlike.sql` | SP | Header agregado |
| 17 | `16_usp_soc_post_comment.sql` | SP | Header agregado |
| 18 | `17_usp_soc_post_view.sql` | SP | Header agregado |
| 19 | `18_usp_soc_post_interactions_summary.sql` | SP | Header agregado |
| 20 | `db.js` | JS | Header agregado |
| 21 | `_shared.js` | JS | Header agregado |
| 22 | `_scope.js` | JS | Header agregado |
| 23 | `engineClient.js` | JS | Ya tenía header ✅ |
| 24 | `bizResolver.js` | JS | Header actualizado + deuda documentada (#2) |
| 25 | `postsResolver.js` | JS | Corregido `target_post_id` → `post_id` + header FK |
| 26 | `mediaPackage.resolver.js` | JS | Marcado como deuda (#3) |
| 27 | `bizMapper.js` | JS | Header + deuda documentada (#2) |
| 28 | `postsMapper.js` | JS | Header agregado |
| 29 | `biz.service.js` | JS | Header + deuda documentada (#2) |
| 30 | `posts.service.js` | JS | Header agregado |
| 31 | `feedService.js` | JS | Corregido `target_post_id` → `post_id` (Deuda #1 saldada) |
| 32 | `biz.routes.js` | JS | Header + deuda documentada (#2) |
| 33 | `posts.routes.js` | JS | Header + eliminadas validaciones legacy |
| 34 | `feedRouter.js` | JS | Ya tenía header ✅ (sin cambios) |
| 35 | `routes/v1/antojados/index.js` | JS | Header agregado |
| 36 | `services/antojados/index.js` | JS | Header agregado |

---

## 🎯 DEUDAS DETECTADAS (pendientes de migración)

| # | Deuda | Archivos afectados | Severidad |
|---|-------|--------------------|-----------|
| #1 | `target_post_id` → `post_id` en soc_post_interactions | ~~feedService.js~~ ✅ CORREGIDO, ~~postsResolver.js~~ ✅ CORREGIDO | 🔴 RESUELTA |
| #2 | Contaminación de Sponsor Management en bizResolver/bizMapper/biz.service/biz.routes | `bizResolver.js`, `bizMapper.js`, `biz.service.js`, `biz.routes.js` | 🔴 ALTA (documentada) |
| #3 | mediaPackage.resolver.js referencia SP/vista que no existen | `mediaPackage.resolver.js` | 🔴 ALTA (documentado para eliminar) |
| #4 | Tabla `biz_post_interactions` no tiene DDL en sql/antojados-core/ | `05_usp_biz_post_like.sql` (referencia) | 🟡 MEDIA |
| #5 | files restantes de Capas 13-22 sin header | Varios | 🟡 MEDIA |
| #6 | `posts.service.js` exporta `ratePost` (fuera del modelo) | `posts.service.js` | 🟡 MEDIA |

---

## 📋 CAPAS PENDIENTES (próxima sesión)

| Capa | Archivos | Estado |
|------|----------|--------|
| 13 — Geo | geoResolver.js, geoMapper.js, geo.service.js, geo.routes.js | ⬜ Pendiente |
| 14 — Helpers | _helpers.js | ⬜ Pendiente |
| 15 — Main | index.js (raíz) | ⬜ Pendiente |
| 16-22 | Shared UI, Shared API, Assets, Media Engine | ⬜ Pendiente |
