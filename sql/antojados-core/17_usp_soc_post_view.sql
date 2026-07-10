-- ============================================================
-- SP: usp_soc_post_view — Registrar Vista de Post Social
--
-- ═══════════════════════════════════════════════════════════════════════════
-- DOMINIO:      Feed de AntojadosMX — Interacciones Sociales
-- RESPONSABLE:  Insertar un registro post_viewed en
--               soc_post_interactions e incrementar views_count
--               en soc_posts.
--
-- NO HACE:
--   - No verifica unicidad (cada vista es independiente)
--   - No verifica que el post exista
--
-- PARÁMETROS (según feed.md §5):
--   @post_id, @user_id (NULLABLE — vistas anónimas permitidas)
--
-- NOTA: A diferencia de likes, las vistas no usan UPDLOCK porque
-- cada vista genera un registro nuevo.
--
-- REFERENCIAS:
--   - apps-antojados/docs/feed.md (Sección 5: SPs — Interacciones Soc)
-- ═══════════════════════════════════════════════════════════════════════════
--
-- ============================================================
-- SP: usp_soc_post_view
-- ============================================================
CREATE OR ALTER PROCEDURE antojados_core.usp_soc_post_view
    @post_id NVARCHAR(64),
    @user_id NVARCHAR(64) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO antojados_core.soc_post_interactions
        (interaction_id, post_id, user_id, interaction_type,
         moderation_status, created_at_client, received_at_server)
    VALUES
        (LOWER(NEWID()), @post_id, @user_id, 'post_viewed',
         'approved', SYSUTCDATETIME(), SYSUTCDATETIME());

    UPDATE antojados_core.soc_posts
    SET views_count = views_count + 1
    WHERE post_id = @post_id;
END;
GO

