-- ============================================================
-- SP: sp_soc_post_media_attach
-- Solo columnas FINALES de soc_post_media (user_id en vez de sponsor_id)
-- ============================================================
CREATE OR ALTER PROCEDURE antojados_core.sp_soc_post_media_attach
    @post_id     NVARCHAR(64),
    @user_id     NVARCHAR(64),
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

    INSERT INTO antojados_core.soc_post_media (
        media_id,
        post_id,
        user_id,
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
        @user_id,
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
