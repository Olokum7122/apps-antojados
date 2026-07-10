-- ============================================================
-- SP: sp_biz_post_media_attach — Adjuntar Multimedia a Post de Negocio
--
-- ═══════════════════════════════════════════════════════════════════════════
-- DOMINIO:      Feed de AntojadosMX — Multimedia de Posts de Negocios
-- RESPONSABLE:  Insertar un registro multimedia (thumb/feed/full)
--               en biz_post_media, vinculado a un biz_post existente.
--
-- NO HACE:
--   - No publica el post (lo hace usp_publish_biz_post)
--   - No procesa media (lo hace Media Engine)
--   - No recibe parámetros legacy
--
-- PARÁMETROS (según feed.md §5):
--   @post_id, @sponsor_id, @media_type (DEFAULT 'photo'),
--   @media_url, @sort_order (DEFAULT 0), @asset_id (NULL),
--   @thumb_url (NULL), @feed_url (NULL), @full_url (NULL)
--
-- REGLAS (feed.md):
--   §4: asset_id es el mediaId del Media Engine
--   §6: thumb/feed/full son la interfaz estable; el Gateway
--       no se entera de los perfiles de procesamiento
--
-- REFERENCIAS:
--   - apps-antojados/docs/feed.md (Sección 2: biz_post_media)
--   - apps-antojados/docs/feed.md (Sección 5: SPs — Media Attach)
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Solo columnas FINALES de biz_post_media
-- ============================================================
CREATE OR ALTER PROCEDURE antojados_core.sp_biz_post_media_attach
    @post_id     NVARCHAR(64),
    @sponsor_id  NVARCHAR(64),
    @media_type  NVARCHAR(20)  = 'photo',
    @media_url   NVARCHAR(1000),
    @sort_order  INT           = 0,
    @asset_id    NVARCHAR(64)  = NULL,
    @thumb_url   NVARCHAR(1000)= NULL,
    @feed_url    NVARCHAR(1000)= NULL,
    @full_url    NVARCHAR(1000)= NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @id NVARCHAR(64) = LOWER(NEWID());

    INSERT INTO antojados_core.biz_post_media (
        media_id,
        post_id,
        sponsor_id,
        media_type,
        media_url,
        sort_order,
        asset_id,
        thumb_url,
        feed_url,
        full_url,
        created_at
    )
    VALUES (
        @id,
        @post_id,
        @sponsor_id,
        @media_type,
        @media_url,
        @sort_order,
        @asset_id,
        @thumb_url,
        @feed_url,
        @full_url,
        SYSUTCDATETIME()
    );
END;
GO

