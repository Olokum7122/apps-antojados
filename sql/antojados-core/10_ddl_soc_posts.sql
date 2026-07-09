-- ============================================================
-- DDL: soc_posts — Columnas FINALES (sin legacy)
-- ============================================================
-- DROP TABLE IF EXISTS antojados_core.soc_posts;

CREATE TABLE antojados_core.soc_posts (
    post_id          NVARCHAR(64)    NOT NULL PRIMARY KEY,
    user_id          NVARCHAR(64)    NOT NULL,
    channel          NVARCHAR(30)    NOT NULL,
    feed_type        NVARCHAR(30)    NULL,
    media_url        NVARCHAR(500)   NULL,
    doc_json         NVARCHAR(MAX)   NULL,

    -- Métricas
    views_count      INT             NOT NULL DEFAULT 0,
    likes_count      INT             NOT NULL DEFAULT 0,
    comments_count   INT             NOT NULL DEFAULT 0,
    shares_count     INT             NOT NULL DEFAULT 0,
    cta_clicks_count INT             NOT NULL DEFAULT 0,
    engagement_score DECIMAL(10,4)   NOT NULL DEFAULT 0,

    status           NVARCHAR(20)    NOT NULL DEFAULT 'active',
    created_at       DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE NONCLUSTERED INDEX IX_soc_posts_user_id ON antojados_core.soc_posts (user_id);
CREATE NONCLUSTERED INDEX IX_soc_posts_channel ON antojados_core.soc_posts (channel);
CREATE NONCLUSTERED INDEX IX_soc_posts_status ON antojados_core.soc_posts (status);
CREATE NONCLUSTERED INDEX IX_soc_posts_created_at ON antojados_core.soc_posts (created_at DESC);
GO
