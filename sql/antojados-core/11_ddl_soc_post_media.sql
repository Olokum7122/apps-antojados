-- ============================================================
-- DDL: soc_post_media — Multimedia de Posts Sociales
--
-- ═══════════════════════════════════════════════════════════════════════════
-- DOMINIO:      Feed de AntojadosMX — Multimedia de Posts Sociales
-- RESPONSABLE:  Definir la estructura física de la tabla soc_post_media
--               según el modelo de datos de feed.md §4.
--
-- NO HACE:
--   - No gestiona posts sociales (soc_posts)
--   - No incluye columnas exclusivas de biz: sponsor_id
--   - No incluye columnas legacy
--
-- COLUMNAS (según feed.md §4):
--   media_id, post_id (FK → soc_posts), user_id,
--   media_type (DEFAULT 'photo'), media_url, sort_order (DEFAULT 0),
--   asset_id, thumb_url, feed_url, full_url, created_at
--
-- ÍNDICES (según feed.md §4):
--   IX_soc_post_media_post_id, IX_soc_post_media_sort_order (post_id, sort_order)
--
-- REFERENCIAS:
--   - apps-antojados/docs/feed.md (Sección 4: soc_post_media)
--   - apps-antojados/docs/feed.md (Regla 4: asset_id es mediaId del Engine)
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Eliminar si existe (usar con precaución en prod)
-- DROP TABLE IF EXISTS antojados_core.soc_post_media;

CREATE TABLE antojados_core.soc_post_media (
    media_id     NVARCHAR(64)    NOT NULL PRIMARY KEY,
    post_id      NVARCHAR(64)    NOT NULL,
    user_id      NVARCHAR(64)    NOT NULL,
    media_type   NVARCHAR(20)    NOT NULL DEFAULT 'photo',
    media_url    NVARCHAR(1000)  NOT NULL,
    sort_order   INT             NOT NULL DEFAULT 0,
    asset_id     NVARCHAR(64)    NULL,
    thumb_url    NVARCHAR(1000)  NULL,
    feed_url     NVARCHAR(1000)  NULL,
    full_url     NVARCHAR(1000)  NULL,
    created_at   DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT FK_soc_post_media_post
        FOREIGN KEY (post_id) REFERENCES antojados_core.soc_posts(post_id)
        ON DELETE CASCADE
);

CREATE NONCLUSTERED INDEX IX_soc_post_media_post_id ON antojados_core.soc_post_media (post_id);
CREATE NONCLUSTERED INDEX IX_soc_post_media_sort_order ON antojados_core.soc_post_media (post_id, sort_order);
GO

