# 02g — Media Engine Integration Contract

Version: 1.0.0
Status: baseline
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

| Variante | Resolucion | Formato | Calidad | Uso en apps |
|---|---|---|---|---|
| **thumb** | 400px width | WebP q80 | Conservadora | Thumbnails, avatares, pre-listeners |
| **grid** | — | — | — | (reservado para grids futuros) |
| **feed** | 1080px width | WebP q82 | Normal | Feed principal (S1: tarjetas, S2: scroll) |
| **full** | 1920px width | WebP q85 | Alta | Fullscreen, detalle (S3) |
| **cover** | — | — | — | (reservado para biz covers) |
| **video_720** | 720p | MP4 | Normal | Feed de videos (Desma, Pachanga) |
| **video_1080** | 1080p | MP4 | Alta | Fullscreen video |

> Fuente: `media-engine/src/services/media/mediaProcessor.js` — constantes `IMAGE_VARIANTS` y `VIDEO_VARIANTS`.

Las apps **nunca** usan la URL del archivo original como media final. Siempre deben usar las URLs del `ready-payload` (seccion 5.4).

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
    "thumbUrl": "https://...",
    "gridUrl": "https://...",
    "feedUrl": "https://...",
    "fullUrl": "https://...",
    "coverUrl": "https://...",
    "videoUrl": "https://...",
    "videoPreviewUrl": "https://...",
    "originType": "created_in_antojados",
    "rightsStatus": "approved",
    "isDemoContent": false
  }
}
```

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

| Campo engine | Campo MediaUploadResult |
|---|---|
| `payload.thumbUrl` | `thumb_url` |
| `payload.feedUrl` | `feed_url` |
| `payload.fullUrl` | `full_url` |
| `payload.videoUrl` | `video_720_url` |
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

## 11. Historial

| Version | Fecha | Cambio |
|---|---|---|
| 1.0.0 | 28/06/2026 | Contrato inicial. Migracion de intake legacy a Media Engine V3 |
