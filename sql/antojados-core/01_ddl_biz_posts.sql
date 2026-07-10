-- ============================================================
-- DDL: biz_posts — Posts de Negocios (Sponsor)
--
-- ═══════════════════════════════════════════════════════════════════════════
-- DOMINIO:      Feed de AntojadosMX — Posts de Negocios (biz)
-- RESPONSABLE:  Definir la estructura física de la tabla biz_posts
--               según el modelo de datos de feed.md §1.
--
-- NO HACE:
--   - No define índices clustering personalizados (usa PK por defecto)
--   - No define FOREIGN KEYS (se gestionan a nivel de SP/App)
--   - No incluye columnas legacy: title, body, post_type,
--     publication_type, publisher_user_id, effects, template_code,
--     mediaItems, place_id, duration_ms, etc.
--
-- COLUMNAS (según feed.md §1):
--   biz_post_id, sponsor_id, channel, feed_type, media_url, doc_json,
--   views_count, likes_count, comments_count, shares_count,
--   cta_clicks_count, taps_whatsapp_count, taps_maps_count,
--   engagement_score, status, created_at
--
-- ÍNDICES (según feed.md §1):
--   PK_biz_posts (clustered), IX_biz_posts_sponsor_id,
--   IX_biz_posts_channel, IX_biz_posts_status,
--   IX_biz_posts_created_at DESC
--
-- REFERENCIAS:
--   - apps-antojados/docs/feed.md (Sección 1: biz_posts)
--   - apps-antojados/docs/feed.md (Sección 6: Diferencias Biz vs Soc)
--   - apps-antojados/docs/feed.md (Sección 7: Reglas de Negocio)
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Eliminar si existe (usar con precaución en prod)
-- DROP TABLE IF EXISTS antojados_core.biz_posts;

CREATE TABLE antojados_core.biz_posts (
    biz_post_id          NVARCHAR(64)    NOT NULL PRIMARY KEY,
    sponsor_id           NVARCHAR(64)    NOT NULL,
    channel              NVARCHAR(30)    NOT NULL,
    feed_type            NVARCHAR(30)    NULL,
    media_url            NVARCHAR(500)   NULL,
    doc_json             NVARCHAR(MAX)   NULL,

    -- Métricas
    views_count          INT             NOT NULL DEFAULT 0,
    likes_count          INT             NOT NULL DEFAULT 0,
    comments_count       INT             NOT NULL DEFAULT 0,
    shares_count         INT             NOT NULL DEFAULT 0,
    cta_clicks_count     INT             NOT NULL DEFAULT 0,
    taps_whatsapp_count  INT             NOT NULL DEFAULT 0,
    taps_maps_count      INT             NOT NULL DEFAULT 0,
    engagement_score     DECIMAL(10,4)   NOT NULL DEFAULT 0,

    status               NVARCHAR(20)    NOT NULL DEFAULT 'active',
    created_at           DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE NONCLUSTERED INDEX IX_biz_posts_sponsor_id ON antojados_core.biz_posts (sponsor_id);
CREATE NONCLUSTERED INDEX IX_biz_posts_channel ON antojados_core.biz_posts (channel);
CREATE NONCLUSTERED INDEX IX_biz_posts_status ON antojados_core.biz_posts (status);
CREATE NONCLUSTERED INDEX IX_biz_posts_created_at ON antojados_core.biz_posts (created_at DESC);
GO

