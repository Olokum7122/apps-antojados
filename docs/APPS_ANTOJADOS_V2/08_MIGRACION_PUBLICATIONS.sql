-- =============================================================================
-- Migración V2 — Publications (Explorer)
-- =============================================================================
-- Cambios en explorer_core.publications:
--   - Elimina tenant_id (se reemplaza por instance_id + sponsor_id + user_id)
--   - Elimina project_id (no aplica para posts directos)
--   - Elimina payload_json (se mueve a publication_packages)
--   - Elimina error_message
--   - Agrega instance_id, user_id, sponsor_id, channel, feed_type, mode
-- 
-- Nuevas tablas:
--   - explorer_core.publication_packages (docJSON por tipo de package)
-- =============================================================================

USE ATLX_EXPLORER_APP;
GO

-- =============================================================================
-- 1. Respaldo de datos existentes (por si acaso)
-- =============================================================================
IF OBJECT_ID('tempdb..#publications_backup') IS NOT NULL
    DROP TABLE #publications_backup;

SELECT * INTO #publications_backup
FROM explorer_core.publications;
GO

PRINT '✅ Backed up existing publications to temp';

-- =============================================================================
-- 2. Eliminar constraints e índices antiguos
-- =============================================================================
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_publications_project')
    DROP INDEX idx_publications_project ON explorer_core.publications;
GO

IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_publications_tenant')
    DROP INDEX idx_publications_tenant ON explorer_core.publications;
GO

-- Eliminar FK a tenants, projects, destinations
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name LIKE 'FK__publications__tenant_id%' OR parent_object_id = OBJECT_ID('explorer_core.publications') AND referenced_object_id = OBJECT_ID('explorer_core.tenants'))
    ALTER TABLE explorer_core.publications DROP CONSTRAINT FK__publications_tenant;
GO

IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name LIKE 'FK__publications__project_id%' OR parent_object_id = OBJECT_ID('explorer_core.publications') AND referenced_object_id = OBJECT_ID('explorer_core.projects'))
    ALTER TABLE explorer_core.publications DROP CONSTRAINT FK__publications_project;
GO

IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name LIKE 'FK__publications__destination_id%' OR parent_object_id = OBJECT_ID('explorer_core.publications') AND referenced_object_id = OBJECT_ID('explorer_core.destinations'))
    ALTER TABLE explorer_core.publications DROP CONSTRAINT FK__publications_destination;
GO

PRINT '✅ Dropped old constraints and indexes';

-- =============================================================================
-- 3. Modificar tabla publications
-- =============================================================================

-- Eliminar columnas viejas
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('explorer_core.publications') AND name = 'tenant_id')
    ALTER TABLE explorer_core.publications DROP COLUMN tenant_id;
GO

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('explorer_core.publications') AND name = 'project_id')
    ALTER TABLE explorer_core.publications DROP COLUMN project_id;
GO

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('explorer_core.publications') AND name = 'payload_json')
    ALTER TABLE explorer_core.publications DROP COLUMN payload_json;
GO

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('explorer_core.publications') AND name = 'error_message')
    ALTER TABLE explorer_core.publications DROP COLUMN error_message;
GO

PRINT '✅ Dropped old columns (tenant_id, project_id, payload_json, error_message)';

-- Agregar columnas nuevas
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('explorer_core.publications') AND name = 'instance_id')
    ALTER TABLE explorer_core.publications ADD instance_id VARCHAR(50) NULL;
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('explorer_core.publications') AND name = 'user_id')
    ALTER TABLE explorer_core.publications ADD user_id VARCHAR(50) NULL;
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('explorer_core.publications') AND name = 'sponsor_id')
    ALTER TABLE explorer_core.publications ADD sponsor_id VARCHAR(50) NULL;
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('explorer_core.publications') AND name = 'channel')
    ALTER TABLE explorer_core.publications ADD channel VARCHAR(20) NOT NULL DEFAULT '';
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('explorer_core.publications') AND name = 'feed_type')
    ALTER TABLE explorer_core.publications ADD feed_type VARCHAR(20) NOT NULL DEFAULT 'USER';
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('explorer_core.publications') AND name = 'mode')
    ALTER TABLE explorer_core.publications ADD mode VARCHAR(10) NOT NULL DEFAULT 'sponsor';
GO

PRINT '✅ Added new columns (instance_id, user_id, sponsor_id, channel, feed_type, mode)';

-- =============================================================================
-- 4. Crear tabla publication_packages (docJSON)
-- =============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'publication_packages' AND schema_id = SCHEMA_ID('explorer_core'))
BEGIN
    CREATE TABLE explorer_core.publication_packages (
        publication_id VARCHAR(50) NOT NULL,
        package_type VARCHAR(20) NOT NULL,   -- 'publicity' | 'general' | 'user'
        payload_json NVARCHAR(MAX) NOT NULL,  -- docJSON completo
        created_at DATETIME2 DEFAULT GETUTCDATE(),
        
        CONSTRAINT PK_publication_packages PRIMARY KEY (publication_id),
        CONSTRAINT FK_publication_packages_publication 
            FOREIGN KEY (publication_id) 
            REFERENCES explorer_core.publications(publication_id)
            ON DELETE CASCADE
    );
    PRINT '✅ Table explorer_core.publication_packages created';
END
GO

-- =============================================================================
-- 5. Migrar datos existentes de publications
-- =============================================================================
-- Los registros existentes en publications vienen de Explorer App (Qué Pex/Pachanga)
-- y tenían tenant_id (el negocio) y payload_json.
-- 
-- Se mapean:
--   - destination_id → channel (que-pex → 'que_pex', pachanga → 'pachanga')
--   - payload_json → se mueve a publication_packages con package_type = 'user'
--   - tenant_id → se ignora (era el negocio, no aplica para social)
--   - Se deja user_id = NULL (no tenemos el user original)
--   - Se deja sponsor_id = NULL (no es sponsor)
--   - mode = 'social'
--   - instance_id = NULL

INSERT INTO explorer_core.publication_packages (publication_id, package_type, payload_json)
SELECT 
    publication_id,
    'user' AS package_type,
    payload_json
FROM #publications_backup
WHERE payload_json IS NOT NULL;
GO

UPDATE explorer_core.publications
SET 
    channel = CASE 
        WHEN d.external_ref = 'que-pex' THEN 'que_pex'
        WHEN d.external_ref = 'pachanga' THEN 'pachanga'
        ELSE COALESCE(pb.feed_type, 'que_pex')
    END,
    feed_type = 'USER',
    mode = 'social',
    destination_id = pb.destination_id
FROM explorer_core.publications p
INNER JOIN #publications_backup pb ON pb.publication_id = p.publication_id
LEFT JOIN explorer_core.destinations d ON d.destination_id = pb.destination_id;
GO

PRINT '✅ Migrated existing publications data';

-- =============================================================================
-- 6. Nuevos índices
-- =============================================================================
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_publications_channel')
    CREATE INDEX idx_publications_channel ON explorer_core.publications(channel, status, published_at);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_publications_sponsor')
    CREATE INDEX idx_publications_sponsor ON explorer_core.publications(sponsor_id, status, published_at)
    WHERE sponsor_id IS NOT NULL;
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_publications_user')
    CREATE INDEX idx_publications_user ON explorer_core.publications(user_id, status, published_at)
    WHERE user_id IS NOT NULL;
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_publications_external_post')
    CREATE INDEX idx_publications_external_post ON explorer_core.publications(external_post_id)
    WHERE external_post_id IS NOT NULL;
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_publications_mode')
    CREATE INDEX idx_publications_mode ON explorer_core.publications(mode, status, published_at);
GO

PRINT '✅ Created new indexes';

-- =============================================================================
-- 7. Cleanup
-- =============================================================================
IF OBJECT_ID('tempdb..#publications_backup') IS NOT NULL
    DROP TABLE #publications_backup;
GO

PRINT '';
PRINT '🎉 Migration V2 complete!';
GO
