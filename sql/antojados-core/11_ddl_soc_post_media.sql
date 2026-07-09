-- ============================================================
-- DDL: soc_post_media — Columnas FINALES (sin legacy)
-- user_id en vez de sponsor_id
-- ============================================================
-- DROP TABLE IF EXISTS antojados_core.soc_post_media;

CREATE TABLE antojados_core.soc_post_media (
    media_id     NVARCHAR(64)    NOT NULL PRIMARY KEY,
    post_id      NVARCHAR(64)    NOT NULL,
    user_id      NVARCHAR(64)    NOT NULL,
    media_type   NVARCHAR(20)    NOT NULL,
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
