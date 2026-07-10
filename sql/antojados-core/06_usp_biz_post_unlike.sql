-- ============================================================
-- SP: usp_biz_post_unlike — Quitar Like de un Post de Negocio
--
-- ═══════════════════════════════════════════════════════════════════════════
-- DOMINIO:      Feed de AntojadosMX — Interacciones de Negocios
-- RESPONSABLE:  Eliminar un like de biz_post_interactions y
--               decrementar likes_count en biz_posts.
--
-- NO HACE:
--   - No maneja likes (usp_biz_post_like)
--   - No verifica que el like exista antes de eliminar
--
-- PARÁMETROS (según feed.md §5):
--   @biz_post_id, @user_id
--
-- NOTA: No usa UPDLOCK porque DELETE es idempotente y no requiere
--       bloqueo pesimista. Si no existe el like, @@ROWCOUNT = 0.
--
-- REFERENCIAS:
--   - apps-antojados/docs/feed.md (Sección 5: SPs — Interacciones Biz)
-- ═══════════════════════════════════════════════════════════════════════════
--
CREATE OR ALTER PROCEDURE antojados_core.usp_biz_post_unlike
    @biz_post_id NVARCHAR(64),
    @user_id     NVARCHAR(64)
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM antojados_core.biz_post_interactions
    WHERE biz_post_id = @biz_post_id
      AND user_id = @user_id
      AND interaction_type = 'like_created';

    IF @@ROWCOUNT > 0
        UPDATE antojados_core.biz_posts
        SET likes_count = CASE WHEN likes_count > 0 THEN likes_count - 1 ELSE 0 END
        WHERE biz_post_id = @biz_post_id;
END;
GO

