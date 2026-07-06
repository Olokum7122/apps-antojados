-- ============================================================
-- Vista Unificada: v_posts_media
-- Dominio: ATLX_ANTOJADOS_APP
-- Esquema: antojados_core
-- 
-- Propósito: UNIR soc_posts (social) + biz_posts (sponsor)
-- exponiendo TODAS las 13 variantes del MediaPackage + métricas.
-- 
-- Regla de Negocio R7: El FAB P1 (publicación) es el punto de entrega.
-- Regla de Negocio R8: explorer_core.content_packages NO tiene URLs.
--
-- Uso: SELECT * FROM antojados_core.v_posts_media WHERE id_post = @idPost;
-- ============================================================

CREATE OR ALTER VIEW antojados_core.v_posts_media AS

-- Modalidad SOCIAL (soc_posts)
SELECT
    sp.post_id              AS id_post,
    sp.channel              AS channel,
    sp.media_type           AS media_type,
    sp.media_url            AS media_url,
    sp.media_thumbnail_url  AS media_thumbnail_url,
    sp.media_full_url       AS media_full_url,
    sp.media_feed_url       AS media_feed_url,
    sp.grid_url             AS grid_url,
    sp.story_url            AS story_url,
    sp.cover_url            AS cover_url,
    sp.avatar_url           AS avatar_url,
    sp.video_720_url        AS video_720_url,
    sp.video_1080_url       AS video_1080_url,
    sp.short_url            AS short_url,
    sp.feed_video_url       AS feed_video_url,
    sp.story_video_url      AS story_video_url,
    sp.video_preview_url    AS video_preview_url,
    sp.orientation          AS orientation,
    sp.aspect_ratio         AS aspect_ratio,
    sp.duration_ms          AS duration_ms,
    sp.media_width          AS media_width,
    sp.media_height         AS media_height,
    sp.publication_type     AS publication_type,
    sp.feed_type            AS feed_type,
    sp.venue_name           AS venue_name,
    sp.category             AS category,
    sp.dish_name            AS dish_name,
    sp.description          AS description,
    sp.tags_json            AS tags_json,
    sp.likes_count          AS likes_count,
    sp.comments_count       AS comments_count,
    sp.shares_count         AS shares_count,
    sp.views_count          AS views_count,
    sp.avg_rating           AS avg_rating,
    sp.engagement_score     AS engagement_score,
    sp.user_id              AS owner_id,
    NULL                    AS sponsor_id,
    NULL                    AS place_id,
    'social'                AS modalidad,
    sp.published_at         AS published_at
FROM antojados_core.soc_posts sp
WHERE sp.post_status = 'active'

UNION ALL

-- Modalidad SPONSOR (biz_posts + biz_post_media)
SELECT
    bp.biz_post_id          AS id_post,
    bp.channel              AS channel,
    bp.media_type           AS media_type,
    COALESCE(bpm.media_url, bp.media_url) AS media_url,
    COALESCE(bpm.thumb_url, bp.media_thumbnail_url) AS media_thumbnail_url,
    COALESCE(bpm.full_url,  bp.media_full_url)  AS media_full_url,
    COALESCE(bpm.feed_url,  bp.media_feed_url)  AS media_feed_url,
    COALESCE(bpm.grid_url,  bp.grid_url)  AS grid_url,
    COALESCE(bpm.story_url, bp.story_url) AS story_url,
    COALESCE(bpm.cover_url, bp.cover_url) AS cover_url,
    COALESCE(bpm.avatar_url,bp.avatar_url)AS avatar_url,
    COALESCE(bpm.video_720_url,  bp.video_720_url)   AS video_720_url,
    COALESCE(bpm.video_1080_url, bp.video_1080_url)  AS video_1080_url,
    COALESCE(bpm.short_url,      bp.short_url)       AS short_url,
    COALESCE(bpm.feed_video_url, bp.feed_video_url)  AS feed_video_url,
    COALESCE(bpm.story_video_url,bp.story_video_url) AS story_video_url,
    COALESCE(bpm.video_preview_url, bp.video_preview_url) AS video_preview_url,
    COALESCE(bpm.orientation,  bp.orientation)  AS orientation,
    COALESCE(bpm.aspect_ratio, bp.aspect_ratio) AS aspect_ratio,
    COALESCE(bpm.duration_ms,  bp.duration_ms)  AS duration_ms,
    bp.media_width   AS media_width,
    bp.media_height  AS media_height,
    bp.publication_type AS publication_type,
    NULL                AS feed_type,
    bp.title            AS venue_name,
    NULL                AS category,
    NULL                AS dish_name,
    bp.body             AS description,
    NULL                AS tags_json,
    bp.likes_count      AS likes_count,
    bp.comments_count   AS comments_count,
    bp.shares_count     AS shares_count,
    bp.views_count      AS views_count,
    NULL                AS avg_rating,
    NULL                AS engagement_score,
    NULL                AS owner_id,
    bp.publisher_user_id AS sponsor_id,
    bp.place_id         AS place_id,
    'sponsor'           AS modalidad,
    bp.created_at       AS published_at
FROM antojados_core.biz_posts bp
LEFT JOIN antojados_core.biz_post_media bpm
    ON bpm.post_id = bp.biz_post_id
WHERE bp.status = 'active';
GO
