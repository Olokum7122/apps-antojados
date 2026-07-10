-- ============================================================
-- SP: usp_soc_post_like — Dar Like a un Post Social
--
-- ═══════════════════════════════════════════════════════════════════════════
-- DOMINIO:      Feed de AntojadosMX — Interacciones Sociales
-- RESPONSABLE:  Insertar un like en soc_post_interactions con
--               UPDLOCK/HOLDLOCK para prevenir duplicados, e
--               incrementar likes_count en soc_posts.
--
-- NO HACE:
--   - No maneja unlikes (usp_soc_post_unlike)
--   - No maneja comentarios (usp_soc_post_comment)
--   - No verifica que el post exista o esté activo
--
-- PARÁMETROS (según feed.md §5):
--   @post_id, @user_id
--
-- NOTA: Usa columna post_id (no target_post_id).
--       Ver deuda en feedService.js línea ~84 que usa target_post_id.
--
-- REFERENCIAS:
--   - apps-antojados/docs/feed.md (Sección 5: SPs — Interacciones Soc)
--   - sql/antojados-core/14_ddl_soc_post_interactions.sql
-- ═══════════════════════════════════════════════════════════════════════════
--
CREATE OR ALTER PROCEDURE antojados_core.usp_soc_post_like
    @post_id NVARCHAR(64),
    @user_id NVARCHAR(64)
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (
        SELECT 1
        FROM antojados_core.soc_post_interactions WITH (UPDLOCK, HOLDLOCK)
        WHERE post_id = @post_id
          AND user_id = @user_id
          AND interaction_type = 'like_created'
    )
    BEGIN
        INSERT INTO antojados_core.soc_post_interactions
            (interaction_id, post_id, user_id, interaction_type,
             moderation_status, created_at_client, received_at_server)
        VALUES
            (LOWER(NEWID()), @post_id, @user_id, 'like_created',
             'approved', SYSUTCDATETIME(), SYSUTCDATETIME());

        UPDATE antojados_core.soc_posts
        SET likes_count = likes_count + 1
        WHERE post_id = @post_id;
    END;
END;
GO

