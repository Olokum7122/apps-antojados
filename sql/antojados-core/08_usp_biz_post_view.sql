-- ============================================================
-- SP: usp_biz_post_view — Registrar Vista de Post de Negocio
--
-- ═══════════════════════════════════════════════════════════════════════════
-- DOMINIO:      Feed de AntojadosMX — Interacciones de Negocios
-- RESPONSABLE:  Insertar un registro post_viewed en
--               biz_post_interactions e incrementar views_count
--               en biz_posts.
--
-- NO HACE:
--   - No verifica unicidad (cada vista es un registro nuevo)
--   - No verifica que el post exista
--   - No usa locking (acepta imprecisión en views_count)
--
-- PARÁMETROS (según feed.md §5):
--   @biz_post_id, @user_id (NULLABLE — vistas anónimas permitidas)
--
-- NOTA: A diferencia de likes, las vistas NO tienen UPDLOCK porque
-- cada vista genera un registro nuevo; no hay riesgo de duplicado
-- prohibido.
--
-- REFERENCIAS:
--   - apps-antojados/docs/feed.md (Sección 5: SPs — Interacciones Biz)
-- ═══════════════════════════════════════════════════════════════════════════
--
CREATE OR ALTER PROCEDURE antojados_core.usp_biz_post_view
    @biz_post_id NVARCHAR(64),
    @user_id     NVARCHAR(64) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO antojados_core.biz_post_interactions
        (interaction_id, biz_post_id, user_id, interaction_type,
         moderation_status, created_at_client, received_at_server)
    VALUES
        (LOWER(NEWID()), @biz_post_id, @user_id, 'post_viewed',
         'approved', SYSUTCDATETIME(), SYSUTCDATETIME());

    UPDATE antojados_core.biz_posts
    SET views_count = views_count + 1
    WHERE biz_post_id = @biz_post_id;
END;
GO

