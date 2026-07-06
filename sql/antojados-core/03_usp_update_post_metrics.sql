-- ============================================================
-- Stored Procedure: usp_update_post_metrics
-- Dominio: ATLX_ANTOJADOS_APP
-- Esquema: antojados_core
--
-- Propósito: Actualizar métricas de un post existente.
-- Soporta modalidad social y sponsor.
-- ============================================================

CREATE OR ALTER PROCEDURE antojados_core.usp_update_post_metrics
    @id_post   NVARCHAR(255),
    @modalidad NVARCHAR(10),
    @likes     INT = NULL,
    @comments  INT = NULL,
    @shares    INT = NULL,
    @views     INT = NULL,
    @avg_rating DECIMAL(3,2) = NULL,
    @engagement_score DECIMAL(10,4) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @modalidad = 'social'
    BEGIN
        UPDATE antojados_core.soc_posts
        SET
            likes_count       = COALESCE(@likes, likes_count),
            comments_count    = COALESCE(@comments, comments_count),
            shares_count      = COALESCE(@shares, shares_count),
            views_count       = COALESCE(@views, views_count),
            avg_rating        = COALESCE(@avg_rating, avg_rating),
            engagement_score  = COALESCE(@engagement_score, engagement_score)
        WHERE post_id = @id_post AND post_status = 'active';
    END
    ELSE IF @modalidad = 'sponsor'
    BEGIN
        UPDATE antojados_core.biz_posts
        SET
            likes_count       = COALESCE(@likes, likes_count),
            comments_count    = COALESCE(@comments, comments_count),
            shares_count      = COALESCE(@shares, shares_count),
            views_count       = COALESCE(@views, views_count),
            engagement_score  = COALESCE(@engagement_score, engagement_score)
        WHERE biz_post_id = @id_post AND status = 'active';
    END
END;
GO
