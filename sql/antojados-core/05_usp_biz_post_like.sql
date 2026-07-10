-- ============================================================
-- SP: usp_biz_post_like — Dar Like a un Post de Negocio
--
-- ═══════════════════════════════════════════════════════════════════════════
-- DOMINIO:      Feed de AntojadosMX — Interacciones de Negocios
-- RESPONSABLE:  Insertar un like en biz_post_interactions con
--               UPDLOCK/HOLDLOCK para prevenir duplicados, e
--               incrementar likes_count en biz_posts.
--
-- NO HACE:
--   - No maneja unlikes (usp_biz_post_unlike)
--   - No verifica que el post exista o esté activo
--   - No verifica que el usuario exista
--
-- PARÁMETROS (según feed.md §5):
--   @biz_post_id, @user_id
--
-- TABLAS QUE TOCA:
--   biz_post_interactions (INSERT), biz_posts (UPDATE likes_count)
--
-- REGLAS (feed.md §7):
--   §7.1: UUID con LOWER(NEWID())
--   §7.3: UPDLOCK/HOLDLOCK para concurrencia
--
-- ⚠️ DEUDA: biz_post_interactions no tiene DDL en sql/antojados-core/
--           Ver 14_ddl_soc_post_interactions.sql como referencia.
--
-- REFERENCIAS:
--   - apps-antojados/docs/feed.md (Sección 5: SPs — Interacciones Biz)
-- ═══════════════════════════════════════════════════════════════════════════
--
-- ============================================================
CREATE OR ALTER PROCEDURE antojados_core.usp_biz_post_like
    @biz_post_id NVARCHAR(64),
    @user_id     NVARCHAR(64)
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (
        SELECT 1
        FROM antojados_core.biz_post_interactions WITH (UPDLOCK, HOLDLOCK)
        WHERE biz_post_id = @biz_post_id
          AND user_id = @user_id
          AND interaction_type = 'like_created'
    )
    BEGIN
        INSERT INTO antojados_core.biz_post_interactions
            (interaction_id, biz_post_id, user_id, interaction_type,
             moderation_status, created_at_client, received_at_server)
        VALUES
            (LOWER(NEWID()), @biz_post_id, @user_id, 'like_created',
             'approved', SYSUTCDATETIME(), SYSUTCDATETIME());

        UPDATE antojados_core.biz_posts
        SET likes_count = likes_count + 1
        WHERE biz_post_id = @biz_post_id;
    END;
END;
GO

