# 09 — Database Schema

Version: 1.0.0
Status: baseline
Applies to: ATLX_ANTOJADOS_APP, Atlx_Mediaengine, ATLX_Central, ATLX_Core_GT

## 1. Proposito

Define el esquema de bases de datos que utilizan las apps AntojadosMX V2.
Documenta todas las tablas activas, su proposito, relaciones y violaciones
identificadas.

## 2. Bases de Datos

| BD | Esquema principal | Proposito |
|---|---|---|
| ATLX_ANTOJADOS_APP | antojados_core, antojados_feed | Datos de la app (posts, auth, places, feeds) |
| Atlx_Mediaengine | me | Procesamiento de media |
| ATLX_Central | dbo | Cross-domain: tenants, usuarios centrales |
| ATLX_Core_GT | core_configuracion | Configuracion GT |
| ATLX_GT_ANALYTICS | gt_analytics, gt_antojados | Analytics y metricas |
| ATLX_GT_INTEGRATION | gt_antojados, gt_integration | Integracion y sincronizacion |

## 3. Tablas Activas por Sistema

### 3.1 Auth & Identity (antojados_core)

| Tabla | Proposito | Estado |
|---|---|---|
| auth_identities | Cuentas de usuario (sponsor y social) | ✅ Activa |
| auth_password_recovery | Solicitudes de recuperacion de contrasena | ✅ Activa |
| auth_password_recovery_delivery_log | Log de envio de codigos | ✅ Activa |

#### auth_identities

```sql
CREATE TABLE antojados_core.auth_identities (
    user_id NVARCHAR(64) NOT NULL PRIMARY KEY,
    email_hash NVARCHAR(64) NOT NULL,
    display_name NVARCHAR(200) NULL,
    username NVARCHAR(100) NULL,
    city_code NVARCHAR(30) NULL,           -- ⚠️ VIOLACION: ciudad no pertenece a auth
    device_id_first NVARCHAR(200) NULL,
    avatar_url NVARCHAR(500) NULL,
    bio NVARCHAR(500) NULL,
    follower_count INT NOT NULL DEFAULT 0,
    following_count INT NOT NULL DEFAULT 0,
    reputation_level INT NULL,
    verified_reviewer BIT NOT NULL DEFAULT 0,
    status NVARCHAR(20) NOT NULL,
    created_at DATETIME2 NOT NULL,
    updated_at DATETIME2 NOT NULL,
    place_id NVARCHAR(64) NULL,             -- ⚠️ VIOLACION: place_id no pertenece a auth
    instagram_handle NVARCHAR(200) NULL,
    facebook_url NVARCHAR(300) NULL,
    tiktok_handle NVARCHAR(200) NULL,
    x_handle NVARCHAR(200) NULL,
    whatsapp_number NVARCHAR(30) NULL,
    password_secret_ref NVARCHAR(64) NULL,
    phone_e164 NVARCHAR(30) NULL,
    social_account_role_code NVARCHAR(30) NULL,
    collaboration_type_code NVARCHAR(30) NULL,
    corp_instance_id NVARCHAR(64) NULL,    -- OK: instancia de sponsor en GT
    program_instance_id NVARCHAR(64) NULL,  -- OK: programa en GT
    commission_profile_code NVARCHAR(30) NULL,
    economic_status NVARCHAR(30) NULL
)
```

**⚠️ Violaciones:**
- `place_id`: place_id es solo para soc_places (Google Maps). Un usuario no tiene place_id.
- `city_code`: la ciudad del usuario pertenece a la sesion, no a la identidad base.

### 3.2 Instancias (antojados_core)

| Tabla | Proposito | Estado |
|---|---|---|
| sys_instancia | Instancias de negocio (sponsor) y usuario | ✅ Activa |

#### sys_instancia

```sql
CREATE TABLE antojados_core.sys_instancia (
    instance_id NVARCHAR(64) NOT NULL PRIMARY KEY,
    cuenta_id NVARCHAR(64) NOT NULL,          -- user_id del owner
    instance_type NVARCHAR(20) NOT NULL,       -- 'sponsor' | 'user'
    tenant_id NVARCHAR(64) NULL,               -- ✅ Tenant ligado a instancia (correcto)
    root_location_id NVARCHAR(64) NULL,
    status NVARCHAR(20) NOT NULL,
    snapshot_json NVARCHAR(MAX) NULL,
    snapshot_hash NVARCHAR(64) NULL,
    cascade_synced_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL,
    updated_at DATETIME2 NOT NULL
)
```

**Regla:** `tenant_id` solo se liga a `sys_instancia`. No existe `tenant_id` en `auth_identities` ni en `soc_places` (correcto).

### 3.3 Tenants (antojados_core)

| Tabla | Proposito | Estado |
|---|---|---|
| biz_tenants | Tenants de negocio (sponsor workspace) | ✅ Activa |
| biz_tenant_profiles | Perfiles de tenant | ✅ Activa |
| biz_tenant_users | Usuarios del tenant | ✅ Activa |
| biz_tenant_invitations | Invitaciones a tenant | ✅ Activa |
| biz_tenant_packages | Paquetes contratados | ✅ Activa |
| biz_tenant_tiles | Tiles publicitarios | ✅ Activa |
| biz_tenant_gallery_posts | Posts de galeria del tenant | ✅ Activa |
| biz_tenant_arre_events | Eventos de agenda del tenant | ✅ Activa |
| biz_tenant_economic_snapshot | Snapshot economico | ✅ Activa |
| biz_tenant_expediente_documents | Documentos del expediente | ✅ Activa |
| biz_tenant_notifications | Notificaciones del tenant | ✅ Activa |
| biz_tenant_suspensions | Suspendiones del tenant | ✅ Activa |
| biz_tenant_user_component_details | Detalle de componentes por usuario | ✅ Activa |
| biz_tenant_user_components | Componentes del tenant por usuario | ✅ Activa |

**⚠️ Violacion en biz_tenants:**
```sql
CREATE TABLE antojados_core.biz_tenants (
    id NVARCHAR(64) NOT NULL PRIMARY KEY,
    place_id NVARCHAR(64) NULL,                -- ⚠️ VIOLACION: tenant no tiene place_id
    business_name NVARCHAR(200) NOT NULL,
    ...
)
```
- `place_id`: el tenant se liga a una instancia, no a un place. `place_id` deberia estar solo en `soc_places`.

### 3.4 Places (antojados_core)

| Tabla | Proposito | Estado |
|---|---|---|
| soc_places | Lugares (negocios, venues) | ✅ Activa |

```sql
CREATE TABLE antojados_core.soc_places (
    place_id NVARCHAR(64) NOT NULL PRIMARY KEY,
    name NVARCHAR(200) NOT NULL,
    category NVARCHAR(80) NOT NULL,
    city_code NVARCHAR(30) NOT NULL,           -- OK: lugar tiene ubicacion
    lat FLOAT NULL,                            -- OK: coordenadas del lugar
    lng FLOAT NULL,                            -- OK: coordenadas del lugar
    address NVARCHAR(300) NULL,
    phone NVARCHAR(30) NULL,
    website NVARCHAR(300) NULL,
    avg_rating FLOAT NOT NULL,
    post_count INT NOT NULL,
    verified BIT NOT NULL,
    status NVARCHAR(20) NOT NULL,
    created_by_user_id NVARCHAR(64) NULL,
    created_at DATETIME2 NOT NULL,
    updated_at DATETIME2 NOT NULL,
    google_place_id NVARCHAR(200) NULL,        -- OK: referencia a Google Maps
    ...
    gt_tenant_id NVARCHAR(64) NULL,            -- ⚠️ VIOLACION: tenant solo se liga a instancia
    zone_code NVARCHAR(30) NULL,               -- OK: zona del lugar
    municipality_code NVARCHAR(30) NULL,        -- OK: municipio del lugar
)
```

**⚠️ Violacion:**
- `gt_tenant_id`: un place NO tiene tenant. El tenant se liga a `sys_instancia`. Si un sponsor tiene un place, la relacion es sponsor → instancia → place, no sponsor → place directamente.

### 3.5 Posts (antojados_core)

| Tabla | Proposito | Estado |
|---|---|---|
| soc_posts | Posts sociales | ✅ Activa |
| biz_posts | Posts de negocios | ✅ Activa |
| soc_post_media | Media de posts sociales | ✅ Activa |
| soc_post_locations | Ubicaciones de posts | ✅ Activa |
| soc_post_ratings | Ratings de posts | ✅ Activa |
| biz_post_media | Media de posts de negocio | ✅ Activa |
| biz_post_interactions | Interacciones en posts de negocio | ✅ Activa |

### 3.6 Media (antojados_core)

| Tabla | Proposito | Estado |
|---|---|---|
| soc_media_assets | Assets de media social | ⚠️ Legacy (reemplazado por engine) |
| soc_media_intake | Intake de media social | ⚠️ Legacy (reemplazado por engine) |
| biz_media_assets | Assets de media de negocio | ⚠️ Legacy (reemplazado por engine) |

**⚠️ Legacy:** Estas tablas contienen 150, 94 y 64 registros respectivamente. Ya no se usan desde la migracion al Media Engine V3. Deben marcarse como readonly y planear su eliminacion.

### 3.7 Feeds (antojados_feed)

| Tabla | Proposito | Estado |
|---|---|---|
| feed_items | Items del feed social | ✅ Activa |
| feed_biz_items | Items del feed de negocios | ✅ Activa |
| feed_top_places | Top places | ✅ Activa |

### 3.8 Geo (antojados_core)

| Tabla | Proposito | Estado |
|---|---|---|
| geo_scope_catalog | Catalogo de scopes geograficos | ✅ Activa |
| geo_scope_detection_map | Mapa de deteccion geografica por coordenadas | ✅ Activa |
| geo_place_scope_map | Mapa place → scope | ✅ Activa |

### 3.9 Social (antojados_core)

| Tabla | Proposito | Estado |
|---|---|---|
| soc_follows | Follows entre usuarios | ✅ Activa |
| soc_interactions | Likes, comentarios, shares | ✅ Activa |
| soc_saves | Posts guardados | ✅ Activa |

### 3.10 Engine (Atlx_Mediaengine.me)

| Tabla | Proposito | Estado |
|---|---|---|
| media_request | Solicitudes de procesamiento de media | ✅ Activa |
| media_original | Archivos originales subidos | ✅ Activa |
| media_rights_origin | Derechos y origen de la media | ✅ Activa |
| media_variant | Variantes procesadas (thumb, grid, feed, full, video) | ✅ Activa |
| processing_job | Trabajos de procesamiento | ✅ Activa |
| processing_profile | Perfiles de procesamiento | ✅ Activa |
| watermark_profile | Perfiles de watermark | ✅ Activa |
| media_status_catalog | Catalogo de estados | ✅ Activa |
| media_variant_catalog | Catalogo de variantes | ✅ Activa |
| media_error_catalog | Catalogo de errores | ✅ Activa |
| media_event_log | Log de eventos de media | ✅ Activa |

### 3.11 GT Analytics (ATLX_GT_ANALYTICS)

| Tabla | Proposito | Estado |
|---|---|---|
| food_engagement_pmonth | Engagement mensual de comida | ✅ Activa |
| food_city_activity_pmonth | Actividad por ciudad mensual | ✅ Activa |
| food_place_score_pmonth | Score de lugares mensual | ✅ Activa |
| food_biz_post_engagement_pmonth | Engagement de posts de negocio | ✅ Activa |
| food_tile_performance_pmonth | Performance de tiles | ✅ Activa |
| food_user_score_pmonth | Score de usuarios | ✅ Activa |
| food_place_hourly_heatmap | Mapa de calor por hora | ✅ Activa |
| food_place_saves_pmonth | Saves por lugar mensual | ✅ Activa |
| food_tag_trends_pmonth | Tendencias de tags | ✅ Activa |
| food_territorial_activity | Actividad territorial | ✅ Activa |
| food_zonad_order_pmonth | Ordenes Zonad mensuales | ✅ Activa |

## 4. Relaciones Clave

```
auth_identities (user_id)
    │
    ├── sys_instancia (cuenta_id)
    │       │
    │       ├── tenant_id → ATLX_Central.sec_tenants / ATLX_Core_GT.ten_tenants
    │       │
    │       └── root_location_id → ATLX_Core_GT.loc_locations
    │
    ├── soc_posts (user_id)
    │       │
    │       └── place_id → soc_places (place_id)
    │
    ├── soc_follows (follower_id / followed_id)
    ├── soc_interactions (user_id)
    └── soc_saves (user_id)

soc_places (place_id)
    │
    ├── soc_posts (place_id)
    ├── biz_posts (place_id)
    └── geo_place_scope_map (place_id)
            │
            └── scope → geo_scope_catalog (scope_code)

biz_tenants (id)
    │
    └── sys_instancia (tenant_id)

media_request (media_id)
    ├── media_original (media_id)
    ├── media_rights_origin (media_id)
    └── media_variant (media_id)
```

## 5. ⚠️ Violaciones Detectadas

| ID | Tabla | Columna | Violacion | Solucion |
|---|---|---|---|---|
| DB-V001 | auth_identities | place_id | place_id es solo para soc_places (Google Maps). Un usuario no tiene place_id | Eliminar columna |
| DB-V002 | auth_identities | city_code | La ciudad pertenece a la sesion/contexto, no a la identidad base | Mover a tabla de sesion o contexto |
| DB-V003 | soc_places | gt_tenant_id | Tenant solo se liga a sys_instancia, no a place | Eliminar columna |
| DB-V004 | biz_tenants | place_id | Tenant no tiene place_id, se liga a instancia | Eliminar columna |

## 6. ⚠️ Tablas Legacy

| ID | Tabla | BD | Registros | Motivo |
|---|---|---|---|---|
| DB-L001 | soc_media_intake | ATLX_ANTOJADOS_APP | 150 | Reemplazado por Media Engine V3 |
| DB-L002 | soc_media_assets | ATLX_ANTOJADOS_APP | 94 | Reemplazado por Media Engine V3 |
| DB-L003 | biz_media_assets | ATLX_ANTOJADOS_APP | 64 | Reemplazado por Media Engine V3 |

## 7. Tablas por Crear / Modificar

Basado en los contratos ideales de la app y el engine:

| Tabla | Accion | Justificacion |
|---|---|---|
| me.media_request.external_context_id | ✅ Ya existe | Para referencias externas (post_id, biz_post_id) |
| me.media_request.client_reference_id | ✅ Ya existe | Para idempotencia |

## 8. Reglas No Negociables

- `place_id` SOLO pertenece a `soc_places`. Ninguna otra tabla debe tener place_id
- `tenant_id` SOLO pertenece a `sys_instancia`. Ninguna otra tabla debe tener tenant_id
- `city_code` pertenece al contexto de sesion, no a la identidad del usuario
- Las tablas legacy de media no deben usarse para nuevas subidas
- El engine es la unica fuente de verdad para media procesada
- Los feeds (feed_items, feed_biz_items) se construyen desde soc_posts y biz_posts

## 9. Reglas de SPS y Mappers

El sistema SPS (Stored Procedures) debe ser la unica capa de acceso a datos:

- Las apps NO hacen SELECT/INSERT/UPDATE directos a tablas
- Toda operacion de datos pasa por un Stored Procedure
- Los mappers en la app transforman la respuesta del SP al formato de la UI
- No debe existir logica de negocio en los SP (solo CRUD)

## 10. Prohibiciones

- No crear nuevas tablas sin actualizar este contrato
- No agregar columnas a tablas existentes sin justificacion y aprobacion
- No usar tablas legacy de media para nuevas integraciones
- No hardcodear IDs de tablas en el codigo de la app
- No acceder a tablas directamente desde la app (siempre via API)

## 11. Historial

| Version | Fecha | Cambio |
|---|---|---|
| 1.0.0 | 28/06/2026 | Contrato inicial. 4 violaciones detectadas, 3 tablas legacy |
