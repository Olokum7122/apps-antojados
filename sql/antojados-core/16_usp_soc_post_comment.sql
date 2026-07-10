-- ============================================================
-- SP: usp_soc_post_comment — Comentar / Responder en Post Social
--
-- ═══════════════════════════════════════════════════════════════════════════
-- DOMINIO:      Feed de AntojadosMX — Interacciones Sociales
-- RESPONSABLE:  Insertar un comentario o respuesta en
--               soc_post_interactions e incrementar comments_count
--               en soc_posts.
--
-- NO HACE:
--   - No maneja likes/unlikes
--   - No valida que el post exista
--   - No maneja moderación (status siempre 'approved')
--
-- PARÁMETROS (según feed.md §5):
--   @post_id, @user_id, @interaction_type, @parent_comment_id (NULL),
--   @content_text (max 2000), @created_at_client (NULL), @interaction_id OUTPUT
--
-- REFERENCIAS:
--   - apps-antojados/docs/feed.md (Sección 5: SPs — Interacciones Soc)
-- ═══════════════════════════════════════════════════════════════════════════
--
CREATE OR ALTER PROCEDURE antojados_core.usp_soc_post_comment
    @post_id             NVARCHAR(64),
    @user_id             NVARCHAR(64),
    @interaction_type    NVARCHAR(30),  -- 'comment_created' | 'reply_created'
    @parent_comment_id   NVARCHAR(64) = NULL,
    @content_text        NVARCHAR(2000),
    @created_at_client   DATETIME2(3)  = NULL,
    @interaction_id      NVARCHAR(64)  = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @id NVARCHAR(64) = COALESCE(@interaction_id, LOWER(NEWID()));

    INSERT INTO antojados_core.soc_post_interactions
        (interaction_id, post_id, user_id, interaction_type, parent_comment_id,
         content_text, moderation_status, created_at_client, received_at_server)
    VALUES
        (@id, @post_id, @user_id, @interaction_type, @parent_comment_id,
         @content_text, 'approved', COALESCE(@created_at_client, SYSUTCDATETIME()), SYSUTCDATETIME());

    UPDATE antojados_core.soc_posts
    SET comments_count = comments_count + 1
    WHERE post_id = @post_id;

    SET @interaction_id = @id;
END;
GO

