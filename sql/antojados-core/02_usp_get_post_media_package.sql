-- ============================================================
-- Stored Procedure: usp_get_post_media_package
-- Dominio: ATLX_ANTOJADOS_APP
-- Esquema: antojados_core
--
-- Propósito: Obtener el MediaPackage completo de un post
-- (social o sponsor) por su id_post + modalidad opcional.
--
-- Uso: EXEC antojados_core.usp_get_post_media_package
--        @id_post = 'uuid',
--        @modalidad = 'social' | 'sponsor' | NULL (ambos)
-- ============================================================

CREATE OR ALTER PROCEDURE antojados_core.usp_get_post_media_package
    @id_post   NVARCHAR(255),
    @modalidad NVARCHAR(10) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        id_post, modalidad, channel, media_type,
        media_url, media_thumbnail_url, media_full_url, media_feed_url,
        grid_url, story_url, cover_url, avatar_url,
        video_720_url, video_1080_url, short_url,
        feed_video_url, story_video_url, video_preview_url,
        orientation, aspect_ratio, duration_ms,
        media_width, media_height,
        publication_type, feed_type,
        venue_name, category, dish_name, description, tags_json,
        likes_count, comments_count, shares_count, views_count,
        avg_rating, engagement_score,
        owner_id, sponsor_id, place_id,
        published_at
    FROM antojados_core.v_posts_media
    WHERE id_post = @id_post
      AND (@modalidad IS NULL OR modalidad = @modalidad);
END;
GO
