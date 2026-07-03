# 02g — Media Engine Integration Contract

Version: 2.0.0
Status: updated
Applies to: Android New, iOS
Consumes: ATLX Media Engine V3 (media-engine)

## 1. Proposito

Define como las apps de AntojadosMX consumen el Media Engine V3 para la subida,
procesamiento y obtencion de media lista para mostrar.

## 2. Principio

Las apps **nunca** procesan media directamente. Toda la media se envia al
Media Engine y las apps solo consumen las URLs del `ready-payload`.

## 3. Flujo Oficial

```
App (Android/iOS)

  1. Crear media request
     POST /api/media/requests
     { sourceApp, sourceActorType, sourceActorId, targetContext, mediaType }

  2. Registrar derechos y origen
     POST /api/media/{mediaId}/rights-origin
     { originType, ownershipType, rightsStatus, allowPublicDisplay, etc. }

  3. Subir archivo original (multipart)
     POST /api/media/{mediaId}/original
     FormData: file (Blob/File)

  4. Polling hasta ready
     GET /api/media/{mediaId}/ready-payload
     → status: "ready" + payload con URLs

  5. Usar URLs del payload para crear el post
```

## 4. Archivo de Implementacion

| Archivo | Rol |
|---|---|
| `shared/api/services/media-engine/mediaEngineClient.ts` | Cliente HTTP del engine. Implementa los 7 endpoints del API Contract V3 |
| `shared/api/services/media/media.service.ts` | Adaptador. Llama al engine y mapea la respuesta al formato `MediaUploadResult` que entienden los componentes existentes |

## 5. Endpoints Consumidos

### 5.1 POST /api/media/requests

Crea un media request. Primer paso del flujo.

Campos requeridos:
- `sourceApp`: `"ios"` | `"android"` | `"explorer"` | `"web"` | `"admin"`
- `sourceActorType`: `"user"` | `"sponsor"` | `"explorer"` | `"employee"` | `"admin"` | `"system"`
- `sourceActorId`: ID del actor (user_id, sponsor_id, etc.)
- `targetContext`: `"post"` | `"avatar"` | `"gallery"` | `"cover"` | `"story"` (ver mapeo en seccion 8)
- `mediaType`: `"image"` | `"video"`

Opcional:
- `clientReferenceId`: Para idempotencia. Usar `{channel}-{entityId}-{timestamp}`

### 5.2 POST /api/media/{mediaId}/rights-origin

Registra derechos y origen de la media.

Valores por defecto desde apps:
- `originType`: `"created_in_antojados"`
- `ownershipType`: `"creator_owned"`
- `rightsStatus`: `"declared"`
- `allowPublicDisplay`: `true`
- `allowDownload`: `false`
- `allowShare`: `true`
- `allowEngineWatermark`: `true`
- `isDemoContent`: `false`

### 5.3 POST /api/media/{mediaId}/original

Sube el archivo binario. Las apps convierten base64 a Blob/File antes de enviar.

- Content-Type: `multipart/form-data`
- Campo del archivo: `file`
- Limite: 500MB

### Variantes que genera el engine

Basado en `media-engine/src/services/media/mediaProcessor.js` — constantes `IMAGE_VARIANTS` y `VIDEO_VARIANTS`:

| Variante | Resolución | Formato | Calidad | Uso en apps | Campo MediaPackage |
|---|---|---|---|---|---|
| **thumb** | 320×320 center crop | WebP q80 | Conservadora | Thumbnails, avatares, pre-listeners, S1 grid | `thumbUrl` |
| **grid** | 600×600 center crop | WebP q80 | Normal | Grid layouts, masonry cells | `gridUrl` |
| **feed** | 1080×1350 crop safe | WebP q82 | Normal | Feed principal (S1: tarjetas, S2: scroll) | `feedUrl` |
| **full** | Max 1440 long side | WebP q85 | Alta | Fullscreen, detalle (S3) | `fullUrl` |
| **story** | 1080×1920 crop safe | WebP q82 | Normal | Story/highlight format | `storyUrl` |
| **cover** | 1080×608 crop safe | WebP q82 | Normal | Business cover, tile background | `coverUrl` |
| **avatar** | 512×512 center crop | WebP q80 | Normal | User/explorer avatar | `avatarUrl` |
| **video** | 720p MP4 H.264/AAC | MP4 | Normal | Feed de videos (Desma, Pachanga) | `videoUrl` |
| **video_1080** | 1080p MP4 H.264/AAC | MP4 | Alta | Fullscreen video | `video1080Url` |
| **short** | 1080×1920 portrait MP4 | MP4 | Normal | Short-form vertical video | `shortUrl` |
| **feed_video** | 1080×1350 or 1080×1920 MP4 | MP4 | Normal | Flexible feed video | `feedVideoUrl` |
| **story_video** | 1080×1920 portrait MP4 | MP4 | Normal | Story format video | `storyVideoUrl` |
| **video_preview** | 720×1280 image preview | WebP q80 | Baja | Video thumbnail before playback | `videoPreviewUrl` |

> **Regla fundamental**: Las apps **nunca** usan la URL del archivo original como media final. Siempre deben usar las URLs del `ready-payload` (sección 5.4). Ver `MEDIA_PACKAGE_CONTRACT.md` para el formato de entrega completo.

### Mapeo de variantes por contexto de render

| Contexto de UI | Campo primario | Fallback |
|---|---|---|
| Gallery grid (S1) | `gridUrl` | `thumbUrl` |
| Feed card (S2) | `feedUrl` | `gridUrl` → `thumbUrl` |
| Fullscreen image (S3) | `fullUrl` | `feedUrl` |
| Story / highlight | `storyUrl` | `fullUrl` |
| Avatar | `avatarUrl` | `thumbUrl` |
| Cover / tile | `coverUrl` | `feedUrl` |
| Video feed playback | `videoUrl` | — |
| Video fullscreen | `video1080Url` | `videoUrl` |
| Video preview (thumbnail) | `videoPreviewUrl` | `thumbUrl` |
| Short / Reels | `shortUrl` | `videoUrl` |

### Limites de tamaño recomendados en apps

Basado en las variantes que genera el engine, las apps deben validar antes de subir:

| Tipo | Limite app | Razon |
|---|---|---|
| Foto | 20 MB | 1920px WebP q85 rara vez supera 5MB. 20MB da margen para fotos RAW de camara |
| Video | 200 MB | 60s en 720p ~30-50MB, 1080p ~80-120MB. 200MB cubre videos largos |
| Engine hard limit | 500 MB | Limite del servidor (configurable en `VITE_MEDIA_ENGINE_URL`) |

### 5.4 GET /api/media/{mediaId}/ready-payload

Obtiene el payload final. La app hace polling cada 3 segundos hasta obtener `status: "ready"`.

Respuesta cuando esta ready:
```json
{
  "mediaId": "uuid",
  "status": "ready",
  "ready": true,
  "payload": {
    "productCode": "antojados-biz-001",
    "mediaType": "image",
    "orientation": "landscape",
    "width": 4032,
    "height": 3024,
    "mimeType": "image/jpeg",
    "thumbUrl": "https://.../thumb.jpg",
    "gridUrl": "https://.../grid.jpg",
    "feedUrl": "https://.../feed.jpg",
    "fullUrl": "https://.../full.jpg",
    "storyUrl": null,
    "coverUrl": null,
    "avatarUrl": null,
    "originalUrl": "https://.../original.jpg",
    "videoUrl": null,
    "video1080Url": null,
    "shortUrl": null,
    "feedVideoUrl": null,
    "storyVideoUrl": null,
    "videoPreviewUrl": null,
    "durationMs": null,
    "aspectRatio": "4:3",
    "originType": "created_in_antojados",
    "rightsStatus": "approved",
    "isDemoContent": false,
    "payloadVersion": "1.0",
    "readyAt": "2026-07-15T14:30:00.000Z"
  }
}
```

> **Nota**: El `originalUrl` NUNCA debe usarse como media final de display. Es solo para diagnóstico.
> Ver `MEDIA_PACKAGE_CONTRACT.md` para especificación completa del formato de entrega.

### 5.5 Endpoints adicionales (disponibles pero no usados desde apps)

- `GET /api/media/{mediaId}` — diagnostico
- `GET /api/media/{mediaId}/policy` — evaluar politica
- `POST /api/media/{mediaId}/cancel` — cancelar media pendiente

## 6. Mapeo de Tipos

### De channel de apps a targetContext del engine

| channel (apps) | targetContext (engine) |
|---|---|
| `feed_post` | `post` |
| `biz_post` | `post` |
| `avatar` | `avatar` |
| `gallery` | `gallery` |
| `tile` | `cover` |

### De payload del engine a MediaUploadResult

| Campo engine (MediaPayload) | Campo MediaUploadResult |
|---|---|
| `payload.thumbUrl` | `thumb_url` |
| `payload.gridUrl` | `grid_url` |
| `payload.feedUrl` | `feed_url` |
| `payload.fullUrl` | `full_url` |
| `payload.storyUrl` | `story_url` |
| `payload.coverUrl` | `cover_url` |
| `payload.avatarUrl` | `avatar_url` |
| `payload.videoUrl` | `video_720_url` |
| `payload.video1080Url` | `video_1080_url` |
| `payload.shortUrl` | `short_url` |
| `payload.feedVideoUrl` | `feed_video_url` |
| `payload.storyVideoUrl` | `story_video_url` |
| `payload.videoPreviewUrl` | `video_preview_url` |
| `payload.mediaType` | `media_type` |
| `payload.durationMs` | `duration_ms` |
| `mediaId` | `intake_id` |
| `status` | `status` |

## 7. Reglas No Negociables

- Las apps **nunca** envian base64 directamente al engine. Deben convertirlo a Blob/File.
- Las apps **nunca** usan la URL del archivo original como media final.
- Las apps **nunca** guardan `content://` o rutas locales como URL final.
- Las apps **nunca** procesan video pesado localmente (solo el engine lo hace).
- Las apps **no** tienen acceso directo a tablas `me.*` del engine.
- Las apps **siempre** deben pasar por `registerRightsOrigin` antes de marcar media como lista.
- El `clientReferenceId` debe ser unico por `sourceApp` para garantizar idempotencia.

## 8. Prohibiciones

- No usar el `ready-payload` como fuente unica de almacenamiento. Las apps pueden copiar las URLs para render rapido, pero no mutar el significado tecnico de la media.
- No asumir que `video_1080_url` existe. El engine V3 no genera 1080p como variante estandar. Usar `videoUrl` como unico campo de video.
- No exponer al usuario el estado interno del engine ("processing", "queued", etc.). Solo mostrar "Procesando..." o "Listo".

## 9. Dependencias

- `mediaEngineClient.ts` depende de `axios` (ya incluido en apps)
- `media.service.ts` depende de `mediaEngineClient.ts`
- Los componentes Vue que importan `mediaService.uploadMedia()` no requieren cambios
- El engine debe estar accesible desde la URL configurada en `VITE_MEDIA_ENGINE_URL`

## 10. Variables de Entorno

```env
VITE_MEDIA_ENGINE_URL=http://localhost:4100
```

En produccion esta variable debe apuntar a la URL publica del Media Engine.

## 11. Interaccion con el API Gateway

El API Gateway (`Api_getaway_antojadosmx`) es el unico punto de entrada para
todo el ecosistema. **Desde V3.1.0**, el Gateway expone un proxy para el Media Engine:

```
/api/media/* → http://localhost:4100 (Media Engine V3)
/api/v1/antojados/* → Gateway business logic (Express + SQL Server)
```

Las apps se comunican con el Media Engine **a través del Gateway**, no directamente:

### Flujo completo

```
App (iOS/Android)
  │
  ├── 1. POST /api/media/requests → Gateway (proxy) → Media Engine
  │     { sourceApp, sourceActorType, sourceActorId, targetContext, mediaType }
  │
  ├── 2. POST /api/media/{mediaId}/rights-origin → Gateway (proxy) → Media Engine
  │     { originType: "created_in_antojados", ... }
  │
  ├── 3. POST /api/media/{mediaId}/original → Gateway (proxy) → Media Engine (multipart)
  │
  ├── 4. GET /api/media/{mediaId}/ready-payload (polling hasta "ready")
  │     → Gateway (proxy) → Media Engine
  │     → Obtiene media_intake_id + payload con URLs
  │
  └── 5. POST /api/v1/antojados/posts → API Gateway (directo)
        { media_intake_id, post_id, user_id, ... }
        → Gateway: resolvePostMediaFromIntake() busca URLs en DB
        → Gateway: crea el post con todas las variantes resueltas
```

**Importante**: El paso 5 debe enviar `media_intake_id` (no `media_url` directo).
El Gateway resuelve automaticamente la URL final mediante la funcion
`resolvePostMediaFromIntake()` en `postsResolver.js`.

Ver `API_CENTRAL_CONTRACT.md` para detalle de la interaccion entre los 3 servicios.

## 12. Historial

| Version | Fecha | Cambio |
|---|---|---|
| 1.0.0 | 28/06/2026 | Contrato inicial. Migracion de intake legacy a Media Engine V3 |
| 1.1.0 | [FECHA_ACTUAL] | Agregada seccion 11 sobre interaccion con API Gateway. Reglas actualizadas sobre rights-origin y media_intake_id |
| 2.0.0 | [FECHA_ACTUAL] | Ampliada tabla de variantes (13 variantes). Agregado mapeo por contexto de render. Ready-payload actualizado con formato completo. Seccion 11 actualizada con proxy Gateway. Referencia a MEDIA_PACKAGE_CONTRACT.md y API_CENTRAL_CONTRACT.md |
