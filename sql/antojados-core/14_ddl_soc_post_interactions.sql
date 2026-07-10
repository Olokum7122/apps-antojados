-- ============================================================
-- DDL: soc_post_interactions — Interacciones de Posts Sociales
--
-- ═══════════════════════════════════════════════════════════════════════════
-- DOMINIO:      Feed de AntojadosMX — Interacciones Sociales
-- RESPONSABLE:  Definir la estructura física de la tabla
--               soc_post_interactions, usada por los SPs de interacción
--               (usp_soc_post_like, unlike, comment, view, summary)
--               según feed.md §5.
--
-- NO HACE:
--   - No gestiona interacciones de negocios (biz_post_interactions)
--   - No incluye columnas legacy
--
-- NOTA: Esta tabla NO está documentada explícitamente en feed.md como
-- las otras (biz_posts, biz_post_media, soc_posts, soc_post_media).
-- Su estructura se infiere de los SPs en §5.
--
-- ⚠️ DEUDA DETECTADA EN AUDITORÍA:
--   - feedService.js (línea ~84) usa 'target_post_id' como FK de
--     soc_post_interactions, pero el DDL define la columna como 'post_id'.
--     Esto causa que la subquery has_liked falle silenciosamente para soc_posts.
--     Corrección pendiente en feedService.js: cambiar 'target_post_id' → 'post_id'.
--
-- COLUMNAS:
--   interaction_id (PK), post_id (FK → soc_posts), user_id,
--   interaction_type, content_text, parent_comment_id,
--   moderation_status, created_at_client, received_at_server
--
-- ÍNDICES:
--   PK_soc_post_interactions (clustered), IX_soc_post_interactions_post_id,
--   IX_soc_post_interactions_user_id, IX_soc_post_interactions_parent (filtered)
--
-- REFERENCIAS:
--   - apps-antojados/docs/feed.md (Sección 5: Stored Procedures — Interacciones Soc)
--   - apps-antojados/docs/feed.md (Sección 6: Diferencias Biz vs Soc)
--   - apps-antojados/docs/feed.auditoria.md (Deuda #1: target_post_id vs post_id)
-- ═══════════════════════════════════════════════════════════════════════════
--
-- ⚠️ EJECUTAR CON PRECAUCIÓN: Usa IF NOT EXISTS para evitar sobrescritura
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE s.name = 'antojados_core' AND t.name = 'soc_post_interactions')
BEGIN
    CREATE TABLE antojados_core.soc_post_interactions (
        interaction_id    NVARCHAR(64)  NOT NULL DEFAULT LOWER(NEWID()),
        post_id           NVARCHAR(64)  NOT NULL,
        user_id           NVARCHAR(64)  NOT NULL,
        interaction_type  NVARCHAR(30)  NOT NULL,
            -- like_created, comment_created, reply_created, post_viewed, rating_submitted, post_shared
        content_text      NVARCHAR(2000) NULL,
        parent_comment_id NVARCHAR(64)  NULL,
        moderation_status NVARCHAR(20)  NOT NULL DEFAULT 'approved',
            -- pending, approved, rejected, flagged
        created_at_client DATETIME2(3)  NULL,
        received_at_server DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT PK_soc_post_interactions PRIMARY KEY CLUSTERED (interaction_id),
        CONSTRAINT FK_soc_post_interactions_post FOREIGN KEY (post_id)
            REFERENCES antojados_core.soc_posts(post_id) ON DELETE CASCADE
    );

    CREATE INDEX IX_soc_post_interactions_post_id
        ON antojados_core.soc_post_interactions(post_id, interaction_type)
        INCLUDE (user_id, content_text, received_at_server);

    CREATE INDEX IX_soc_post_interactions_user_id
        ON antojados_core.soc_post_interactions(user_id, interaction_type);

    CREATE INDEX IX_soc_post_interactions_parent
        ON antojados_core.soc_post_interactions(parent_comment_id)
        WHERE parent_comment_id IS NOT NULL;
END;
GO

