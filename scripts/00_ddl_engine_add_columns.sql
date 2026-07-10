-- ═══════════════════════════════════════════════════════════════════
-- DDL ENGINE — Agregar columnas faltantes a tablas me.*
--
-- Cumple con feed.md §8 (Modelo Media Engine)
--   + channel   → NVARCHAR(30)  NULL (se llena al crear media_request)
--   + post_id   → NVARCHAR(64)  NULL (se llena cuando se vincula a un post)
--   + sponsor_id → NVARCHAR(64) NULL (para media de biz)
--   + user_id   → NVARCHAR(64)  NULL (para media de soc)
--
-- IDEMPOTENTE: cada ALTER usa IF COL_LENGTH(...) IS NULL
-- SIN GO: usa EXEC()
-- NO elimina columnas existentes (los SPs existentes las referencian)
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. media_request ──────────────────────────────────────────────
IF COL_LENGTH('me.media_request', 'channel') IS NULL
    EXEC('ALTER TABLE me.media_request ADD channel NVARCHAR(30) NULL');

IF COL_LENGTH('me.media_request', 'post_id') IS NULL
    EXEC('ALTER TABLE me.media_request ADD post_id NVARCHAR(64) NULL');

IF COL_LENGTH('me.media_request', 'sponsor_id') IS NULL
    EXEC('ALTER TABLE me.media_request ADD sponsor_id NVARCHAR(64) NULL');

IF COL_LENGTH('me.media_request', 'user_id') IS NULL
    EXEC('ALTER TABLE me.media_request ADD user_id NVARCHAR(64) NULL');

-- ── 2. media_rights_origin ────────────────────────────────────────
IF COL_LENGTH('me.media_rights_origin', 'channel') IS NULL
    EXEC('ALTER TABLE me.media_rights_origin ADD channel NVARCHAR(30) NULL');

IF COL_LENGTH('me.media_rights_origin', 'post_id') IS NULL
    EXEC('ALTER TABLE me.media_rights_origin ADD post_id NVARCHAR(64) NULL');

IF COL_LENGTH('me.media_rights_origin', 'sponsor_id') IS NULL
    EXEC('ALTER TABLE me.media_rights_origin ADD sponsor_id NVARCHAR(64) NULL');

IF COL_LENGTH('me.media_rights_origin', 'user_id') IS NULL
    EXEC('ALTER TABLE me.media_rights_origin ADD user_id NVARCHAR(64) NULL');

-- ── 3. media_original ─────────────────────────────────────────────
IF COL_LENGTH('me.media_original', 'channel') IS NULL
    EXEC('ALTER TABLE me.media_original ADD channel NVARCHAR(30) NULL');

IF COL_LENGTH('me.media_original', 'post_id') IS NULL
    EXEC('ALTER TABLE me.media_original ADD post_id NVARCHAR(64) NULL');

IF COL_LENGTH('me.media_original', 'sponsor_id') IS NULL
    EXEC('ALTER TABLE me.media_original ADD sponsor_id NVARCHAR(64) NULL');

IF COL_LENGTH('me.media_original', 'user_id') IS NULL
    EXEC('ALTER TABLE me.media_original ADD user_id NVARCHAR(64) NULL');

-- ── 4. media_variant ──────────────────────────────────────────────
IF COL_LENGTH('me.media_variant', 'channel') IS NULL
    EXEC('ALTER TABLE me.media_variant ADD channel NVARCHAR(30) NULL');

IF COL_LENGTH('me.media_variant', 'post_id') IS NULL
    EXEC('ALTER TABLE me.media_variant ADD post_id NVARCHAR(64) NULL');

IF COL_LENGTH('me.media_variant', 'sponsor_id') IS NULL
    EXEC('ALTER TABLE me.media_variant ADD sponsor_id NVARCHAR(64) NULL');

IF COL_LENGTH('me.media_variant', 'user_id') IS NULL
    EXEC('ALTER TABLE me.media_variant ADD user_id NVARCHAR(64) NULL');

-- ── 5. processing_job ─────────────────────────────────────────────
IF COL_LENGTH('me.processing_job', 'channel') IS NULL
    EXEC('ALTER TABLE me.processing_job ADD channel NVARCHAR(30) NULL');

IF COL_LENGTH('me.processing_job', 'post_id') IS NULL
    EXEC('ALTER TABLE me.processing_job ADD post_id NVARCHAR(64) NULL');

IF COL_LENGTH('me.processing_job', 'sponsor_id') IS NULL
    EXEC('ALTER TABLE me.processing_job ADD sponsor_id NVARCHAR(64) NULL');

IF COL_LENGTH('me.processing_job', 'user_id') IS NULL
    EXEC('ALTER TABLE me.processing_job ADD user_id NVARCHAR(64) NULL');

-- ── 6. media_event_log ────────────────────────────────────────────
IF COL_LENGTH('me.media_event_log', 'channel') IS NULL
    EXEC('ALTER TABLE me.media_event_log ADD channel NVARCHAR(30) NULL');

IF COL_LENGTH('me.media_event_log', 'post_id') IS NULL
    EXEC('ALTER TABLE me.media_event_log ADD post_id NVARCHAR(64) NULL');

IF COL_LENGTH('me.media_event_log', 'sponsor_id') IS NULL
    EXEC('ALTER TABLE me.media_event_log ADD sponsor_id NVARCHAR(64) NULL');

IF COL_LENGTH('me.media_event_log', 'user_id') IS NULL
    EXEC('ALTER TABLE me.media_event_log ADD user_id NVARCHAR(64) NULL');

-- ═══════════════════════════════════════════════════════════════════
-- FIN DDL ENGINE
-- ═══════════════════════════════════════════════════════════════════
