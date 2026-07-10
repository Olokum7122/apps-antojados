-- ============================================================
-- SP: usp_biz_post_comment
-- ============================================================
CREATE OR ALTER PROCEDURE antojados_core.usp_biz_post_comment
    @biz_post_id       NVARCHAR(64),
    @user_id           NVARCHAR(64),
    @interaction_type  NVARCHAR(30),  -- 'comment_created' | 'reply_created'
    @parent_comment_id NVARCHAR(64) = NULL,
    @content_text      NVARCHAR(2000),
    @created_at_client DATETIME2(3)  = NULL,
    @interaction_id    NVARCHAR(64)  = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @id NVARCHAR(64) = COALESCE(@interaction_id, LOWER(NEWID()));

    INSERT INTO antojados_core.biz_post_interactions
        (interaction_id, biz_post_id, user_id, interaction_type, parent_comment_id,
         content_text, moderation_status, created_at_client, received_at_server)
    VALUES
        (@id, @biz_post_id, @user_id, @interaction_type, @parent_comment_id,
         @content_text, 'approved', COALESCE(@created_at_client, SYSUTCDATETIME()), SYSUTCDATETIME());

    UPDATE antojados_core.biz_posts
    SET comments_count = comments_count + 1
    WHERE biz_post_id = @biz_post_id;

    SET @interaction_id = @id;
END;
GO

-- ============================================================
-- SP: usp_biz_post_comment — Comentar / Responder en Post de Negocio
--
-- ═══════════════════════════════════════════════════════════════════════════
-- DOMINIO:      Feed de AntojadosMX — Interacciones de Negocios
-- RESPONSABLE:  Insertar un comentario o respuesta en
--               biz_post_interactions e incrementar comments_count
--               en biz_posts.
--
-- NO HACE:
--   - No maneja likes/unlikes
--   - No valida que el post exista
--   - No valida que parent_comment_id exista
--   - No maneja moderación (status siempre 'approved')
--
-- PARÁMETROS (según feed.md §5):
--   @biz_post_id, @user_id, @interaction_type, @parent_comment_id (NULL),
--   @content_text (max 2000), @created_at_client (NULL), @interaction_id OUTPUT
--
-- interaction_type:
--   'comment_created' — comentario raíz
--   'reply_created'   — respuesta a un comentario (requiere parent_comment_id)
--
-- REGLAS:
--   §7.1: UUID con LOWER(NEWID())
--   §7.6: content_text max 2000 chars
--
-- REFERENCIAS:
--   - apps-antojados/docs/feed.md (Sección 5: SPs — Interacciones Biz)
-- ═══════════════════════════════════════════════════════════════════════════
--

