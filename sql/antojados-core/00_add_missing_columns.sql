-- ============================================================
-- Agregar columnas faltantes del MediaPackage a las tablas existentes
-- Idempotente: Solo agrega si no existen
-- ============================================================

-- ============================================================
-- 1. soc_posts (social)
-- ============================================================

-- Variantes de imagen
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'antojados_core' AND TABLE_NAME = 'soc_posts' AND COLUMN_NAME = 'grid_url')
    ALTER TABLE antojados_core.soc_posts ADD grid_url NVARCHAR(500) NULL;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'antojados_core' AND TABLE_NAME = 'soc_posts' AND COLUMN_NAME = 'story_url')
    ALTER TABLE antojados_core.soc_posts ADD story_url NVARCHAR(500) NULL;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'antojados_core' AND TABLE_NAME = 'soc_posts' AND COLUMN_NAME = 'cover_url')
    ALTER TABLE antojados_core.soc_posts ADD cover_url NVARCHAR(500) NULL;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'antojados_core' AND TABLE_NAME = 'soc_posts' AND COLUMN_NAME = 'avatar_url')
    ALTER TABLE antojados_core.soc_posts ADD avatar_url NVARCHAR(500) NULL;

-- Variantes de video
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'antojados_core' AND TABLE_NAME = 'soc_posts' AND COLUMN_NAME = 'video_720_url')
    ALTER TABLE antojados_core.soc_posts ADD video_720_url NVARCHAR(500) NULL;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'antojados_core' AND TABLE_NAME = 'soc_posts' AND COLUMN_NAME = 'video_1080_url')
    ALTER TABLE antojados_core.soc_posts ADD video_1080_url NVARCHAR(500) NULL;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'antojados_core' AND TABLE_NAME = 'soc_posts' AND COLUMN_NAME = 'short_url')
    ALTER TABLE antojados_core.soc_posts ADD short_url NVARCHAR(500) NULL;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'antojados_core' AND TABLE_NAME = 'soc_posts' AND COLUMN_NAME = 'feed_video_url')
    ALTER TABLE antojados_core.soc_posts ADD feed_video_url NVARCHAR(500) NULL;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'antojados_core' AND TABLE_NAME = 'soc_posts' AND COLUMN_NAME = 'story_video_url')
    ALTER TABLE antojados_core.soc_posts ADD story_video_url NVARCHAR(500) NULL;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'antojados_core' AND TABLE_NAME = 'soc_posts' AND COLUMN_NAME = 'video_preview_url')
    ALTER TABLE antojados_core.soc_posts ADD video_preview_url NVARCHAR(500) NULL;

-- Metadata de orientacion y media
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'antojados_core' AND TABLE_NAME = 'soc_posts' AND COLUMN_NAME = 'orientation')
    ALTER TABLE antojados_core.soc_posts ADD orientation NVARCHAR(10) NULL;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'antojados_core' AND TABLE_NAME = 'soc_posts' AND COLUMN_NAME = 'aspect_ratio')
    ALTER TABLE antojados_core.soc_posts ADD aspect_ratio NVARCHAR(10) NULL;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'antojados_core' AND TABLE_NAME = 'soc_posts' AND COLUMN_NAME = 'duration_ms')
    ALTER TABLE antojados_core.soc_posts ADD duration_ms INT NULL;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'antojados_core' AND TABLE_NAME = 'soc_posts' AND COLUMN_NAME = 'media_width')
    ALTER TABLE antojados_core.soc_posts ADD media_width INT NULL;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'antojados_core' AND TABLE_NAME = 'soc_posts' AND COLUMN_NAME = 'media_height')
    ALTER TABLE antojados_core.soc_posts ADD media_height INT NULL;

-- Metricas adicionales
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'antojados_core' AND TABLE_NAME = 'soc_posts' AND COLUMN_NAME = 'views_count')
    ALTER TABLE antojados_core.soc_posts ADD views_count INT NOT NULL DEFAULT 0;

PRINT '✅ Columnas de soc_posts actualizadas';

-- ============================================================
-- 2. biz_posts (sponsor)
-- ============================================================

-- Variantes de imagen
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'antojados_core' AND TABLE_NAME = 'biz_posts' AND COLUMN_NAME = 'media_thumbnail_url')
    ALTER TABLE antojados_core.biz_posts ADD media_thumbnail_url NVARCHAR(500) NULL;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'antojados_core' AND TABLE_NAME = 'biz_posts' AND COLUMN_NAME = 'media_feed_url')
    ALTER TABLE antojados_core.biz_posts ADD media_feed_url NVARCHAR(500) NULL;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'antojados_core' AND TABLE_NAME = 'biz_posts' AND COLUMN_NAME = 'media_full_url')
    ALTER TABLE antojados_core.biz_posts ADD media_full_url NVARCHAR(500) NULL;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'antojados_core' AND TABLE_NAME = 'biz_posts' AND COLUMN_NAME = 'grid_url')
    ALTER TABLE antojados_core.biz_posts ADD grid_url NVARCHAR(500) NULL;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'antojados_core' AND TABLE_NAME = 'biz_posts' AND COLUMN_NAME = 'story_url')
    ALTER TABLE antojados_core.biz_posts ADD story_url NVARCHAR(500) NULL;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'antojados_core' AND TABLE_NAME = 'biz_posts' AND COLUMN_NAME = 'cover_url')
    ALTER TABLE antojados_core.biz_posts ADD cover_url NVARCHAR(500) NULL;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'antojados_core' AND TABLE_NAME = 'biz_posts' AND COLUMN_NAME = 'avatar_url')
    ALTER TABLE antojados_core.biz_posts ADD avatar_url NVARCHAR(500) NULL;

-- Variantes de video
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'antojados_core' AND TABLE_NAME = 'biz_posts' AND COLUMN_NAME = 'video_720_url')
    ALTER TABLE antojados_core.biz_posts ADD video_720_url NVARCHAR(500) NULL;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'antojados_core' AND TABLE_NAME = 'biz_posts' AND COLUMN_NAME = 'video_1080_url')
    ALTER TABLE antojados_core.biz_posts ADD video_1080_url NVARCHAR(500) NULL;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'antojados_core' AND TABLE_NAME = 'biz_posts' AND COLUMN_NAME = 'short_url')
    ALTER TABLE antojados_core.biz_posts ADD short_url NVARCHAR(500) NULL;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'antojados_core' AND TABLE_NAME = 'biz_posts' AND COLUMN_NAME = 'feed_video_url')
    ALTER TABLE antojados_core.biz_posts ADD feed_video_url NVARCHAR(500) NULL;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'antojados_core' AND TABLE_NAME = 'biz_posts' AND COLUMN_NAME = 'story_video_url')
    ALTER TABLE antojados_core.biz_posts ADD story_video_url NVARCHAR(500) NULL;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'antojados_core' AND TABLE_NAME = 'biz_posts' AND COLUMN_NAME = 'video_preview_url')
    ALTER TABLE antojados_core.biz_posts ADD video_preview_url NVARCHAR(500) NULL;

-- Metadata
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'antojados_core' AND TABLE_NAME = 'biz_posts' AND COLUMN_NAME = 'orientation')
    ALTER TABLE antojados_core.biz_posts ADD orientation NVARCHAR(10) NULL;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'antojados_core' AND TABLE_NAME = 'biz_posts' AND COLUMN_NAME = 'aspect_ratio')
    ALTER TABLE antojados_core.biz_posts ADD aspect_ratio NVARCHAR(10) NULL;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'antojados_core' AND TABLE_NAME = 'biz_posts' AND COLUMN_NAME = 'duration_ms')
    ALTER TABLE antojados_core.biz_posts ADD duration_ms INT NULL;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'antojados_core' AND TABLE_NAME = 'biz_posts' AND COLUMN_NAME = 'media_width')
    ALTER TABLE antojados_core.biz_posts ADD media_width INT NULL;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'antojados_core' AND TABLE_NAME = 'biz_posts' AND COLUMN_NAME = 'media_height')
    ALTER TABLE antojados_core.biz_posts ADD media_height INT NULL;

PRINT '✅ Columnas de biz_posts actualizadas';

-- ============================================================
-- 3. biz_post_media (galeria sponsor)
-- ============================================================

-- Variantes de imagen
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'antojados_core' AND TABLE_NAME = 'biz_post_media' AND COLUMN_NAME = 'grid_url')
    ALTER TABLE antojados_core.biz_post_media ADD grid_url NVARCHAR(1000) NULL;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'antojados_core' AND TABLE_NAME = 'biz_post_media' AND COLUMN_NAME = 'story_url')
    ALTER TABLE antojados_core.biz_post_media ADD story_url NVARCHAR(1000) NULL;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'antojados_core' AND TABLE_NAME = 'biz_post_media' AND COLUMN_NAME = 'cover_url')
    ALTER TABLE antojados_core.biz_post_media ADD cover_url NVARCHAR(1000) NULL;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'antojados_core' AND TABLE_NAME = 'biz_post_media' AND COLUMN_NAME = 'avatar_url')
    ALTER TABLE antojados_core.biz_post_media ADD avatar_url NVARCHAR(1000) NULL;

-- Variantes de video
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'antojados_core' AND TABLE_NAME = 'biz_post_media' AND COLUMN_NAME = 'video_720_url')
    ALTER TABLE antojados_core.biz_post_media ADD video_720_url NVARCHAR(1000) NULL;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'antojados_core' AND TABLE_NAME = 'biz_post_media' AND COLUMN_NAME = 'video_1080_url')
    ALTER TABLE antojados_core.biz_post_media ADD video_1080_url NVARCHAR(1000) NULL;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'antojados_core' AND TABLE_NAME = 'biz_post_media' AND COLUMN_NAME = 'short_url')
    ALTER TABLE antojados_core.biz_post_media ADD short_url NVARCHAR(1000) NULL;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'antojados_core' AND TABLE_NAME = 'biz_post_media' AND COLUMN_NAME = 'feed_video_url')
    ALTER TABLE antojados_core.biz_post_media ADD feed_video_url NVARCHAR(1000) NULL;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'antojados_core' AND TABLE_NAME = 'biz_post_media' AND COLUMN_NAME = 'story_video_url')
    ALTER TABLE antojados_core.biz_post_media ADD story_video_url NVARCHAR(1000) NULL;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'antojados_core' AND TABLE_NAME = 'biz_post_media' AND COLUMN_NAME = 'video_preview_url')
    ALTER TABLE antojados_core.biz_post_media ADD video_preview_url NVARCHAR(1000) NULL;

-- Metadata
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'antojados_core' AND TABLE_NAME = 'biz_post_media' AND COLUMN_NAME = 'orientation')
    ALTER TABLE antojados_core.biz_post_media ADD orientation NVARCHAR(10) NULL;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'antojados_core' AND TABLE_NAME = 'biz_post_media' AND COLUMN_NAME = 'aspect_ratio')
    ALTER TABLE antojados_core.biz_post_media ADD aspect_ratio NVARCHAR(10) NULL;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'antojados_core' AND TABLE_NAME = 'biz_post_media' AND COLUMN_NAME = 'duration_ms')
    ALTER TABLE antojados_core.biz_post_media ADD duration_ms INT NULL;

PRINT '✅ Columnas de biz_post_media actualizadas';
GO
