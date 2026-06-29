# 03c — Publish System

Version: 1.1.0
Status: updated
Applies to: shared/api/services/publish/, shared/api/services/media/, shared/api/composables/usePublishMedia.ts

## 1. Proposito

Define el sistema de publicacion de contenido. Cubre el flujo completo desde
que el usuario selecciona un archivo (foto/video) hasta que el post se publica
con su media procesada.

## 2. Visión General del Flujo

```
Usuario selecciona archivo
    │
    ▼
usePublishMedia (captura)
    │  - Lee archivo
    │  - Genera preview base64
    │  - Determina tipo (photo/video)
    │
    ▼
mediaService.uploadMedia()
    │  - Crea media request (engine)
    │  - Registra derechos/origen
    │  - Sube binario
    │  - Polling hasta ready
    │
    ▼
publishService.createSocialPost() / createBizPost()
    │  - Crea el post con URLs de media
    │
    ▼
Feed actualizado
```

## 3. Captura de Media (usePublishMedia)

```typescript
function usePublishMedia(options: { allowedMediaTypes?: MediaType[] }): {
  // Input refs
  photoInputRef: Ref<HTMLInputElement | null>
  videoInputRef: Ref<HTMLInputElement | null>
  deviceInputRef: Ref<HTMLInputElement | null>

  // Estado
  mediaPreview: Ref<string | null>       // Data URL para preview
  mediaBase64: Ref<string | null>        // Base64 sin header
  mediaType: Ref<MediaType>              // 'photo' | 'video'
  mediaFileName: Ref<string | null>
  mediaMimeType: Ref<string | null>
  mediaSizeBytes: Ref<number | null>
  mediaError: Ref<string | null>

  // Acciones
  triggerFilePicker(source: 'photo' | 'video' | 'device'): void
  onFileChange(event: Event): Promise<void>
  clearMedia(): void
}
```

### Flujo de captura

1. Usuario toca boton "Foto", "Video" o "Galeria"
2. `triggerFilePicker(source)` configura accept y capture segun el source
3. El input file nativo se activa
4. `onFileChange()` procesa el archivo seleccionado
5. `readPublishMediaFile(file)` lee como data URL, extrae base64, mimeType, size
6. El preview se muestra al usuario

### Reglas de source

| Source | accept | capture | mediaType forzado |
|---|---|---|---|
| photo | image/* | environment | photo |
| video | video/* | environment | video |
| device | image/*,video/* | null | segun archivo |

## 4. Subida de Media (mediaService.uploadMedia)

(Ver contrato 02g para detalle completo del engine)

```typescript
async function uploadMedia(input: MediaUploadInput): Promise<MediaUploadResult>
```

### Input

```typescript
interface MediaUploadInput {
  base64: string
  mediaType: MediaType      // 'photo' | 'video'
  channel: 'biz_post' | 'feed_post' | 'gallery' | 'avatar' | 'tile'
  entityId?: string | null
  entityContext?: string | null
}
```

### Output

```typescript
interface MediaUploadResult {
  intake_id?: string | null       // mediaId del engine
  status?: string | null
  thumb_url?: string | null
  feed_url?: string | null
  full_url?: string | null
  media_url?: string | null
  media_thumbnail_url?: string | null
  video_720_url?: string | null
  video_1080_url?: string | null
  error_msg?: string | null
}
```

## 5. Publicacion de Post Social (publishService.createSocialPost)

```typescript
async function createSocialPost(input: SocialPostCreateInput): Promise<SocialPostCreateResult>
```

### Endpoint

POST /api/v1/antojados/posts

### Input

```typescript
interface SocialPostCreateInput {
  post_id?: string | null
  user_id: string
  feed_scope: 'barrio' | 'pachanga' | 'que-pex' | 'desma'
  caption?: string | null
  description?: string | null
  venue_name?: string | null
  media_url?: string | null
  media_thumbnail_url?: string | null
  media_type?: MediaType | null
  media_intake_id?: string | null
  city_code?: string | null
  scope_level?: string | null
  scope_code?: string | null
}
```

### Output

```typescript
interface SocialPostCreateResult {
  post_id: string
}
```

## 6. Publicacion de Post de Negocio (publishService.createBizPost)

```typescript
async function createBizPost(input: BizPostCreateInput): Promise<BizPostCreateResult>
```

### Endpoint

POST /api/v1/antojados/biz/posts

### Input

```typescript
interface BizPostCreateInput {
  place_id: string
  publisher_user_id: string
  channel: 'vas_ir' | 'arre'
  post_type: string
  publication_type: string
  title: string
  body?: string | null
  media_url?: string | null
  media_type?: MediaType | null
  cta_label?: string | null
  cta_url?: string | null
  starts_at?: string | null
  ends_at?: string | null
}
```

### Output

```typescript
interface BizPostCreateResult {
  biz_post_id: string
}
```

## 7. Mapeo de channel a feed_scope

| Canal (desde la UI) | feed_scope | Tipo de post |
|---|---|---|
| feed_post + pachanga (evento) | pachanga | Social (evento) |
| feed_post + pachanga (resena) | pachanga | Social (resena con calificacion) |
| feed_post + barrio | barrio | Social (momento) |
| feed_post + desma | desma | Social (desmadre) |
| feed_post + que-pex | que-pex | Social (noticia) — solo desde Explorer App |
| biz_post + vas_ir | — | Biz (galeria) |
| biz_post + arre | — | Biz (agenda/evento) |

## 8. Vistas de Publicacion

Cada canal tiene su propia vista de publicacion:

| Vista | Ruta | Canal | Media permitida |
|---|---|---|---|
| PublicarResenaView | /red/pa-ti/pachanga/publicar-resena | feed_post | photo |
| PublicarPachangaView | /red/pa-ti/pachanga/publicar | feed_post | photo, video |
| PublicarBarrioView | /red/barrio/publicar | feed_post | photo, video |
| PublicarVasIrView | /antojo/vas-ir/publicar | biz_post | photo, video |
| PublicarArreView | /antojo/arre/publicar | biz_post | photo |

Todas las vistas siguen el mismo patron:
1. Usan `usePublishMedia` para capturar
2. Llaman `mediaService.uploadMedia()`
3. Llaman `publishService.createSocialPost()` o `createBizPost()`
4. Redirigen al feed correspondiente

## 9. Reglas No Negociables

- La media siempre debe subirse via el Media Engine, nunca directamente a la API
- El post no se crea hasta que la media esta completamente procesada (status: ready)
- Los campos `media_url` y `media_type` son obligatorios para posts con media
- `entityId` en uploadMedia debe coincidir con el `post_id` o `biz_post_id` final
- El usuario debe estar autenticado para publicar

## 10. Prohibiciones

- No crear el post antes de que la media este lista
- No mostrar al usuario errores internos del engine
- No permitir publicar sin media en canales que la requieren
- No hardcodear `feed_scope` o `channel` en las vistas (usar constantes)
- No usar `media_intake_id` como identificador principal del post

## 11. ⚠️ Deuda Tecnica Identificada

- `usePublishMedia.ts` maneja base64, pero el engine recibe multipart.
  El servicio tiene que reconvertir base64 → Blob. Esto es procesos doble innecesario.
  Propuesta: que `usePublishMedia` exponga el `File` directamente y que
  `mediaService.uploadMedia()` maneje la conversion a FormData.
- Todas las vistas de publicacion tienen codigo duplicado (validacion de sesion,
  llamado a uploadMedia, llamado a publish, redireccion).
  Propuesta: crear un composable unico `usePublish()` que orqueste todo el flujo.
- No hay validacion de tamaño de archivo antes de subir. Un video de 2GB
  fallaria silenciosamente.
- No hay mensajes de error amigables para el usuario cuando el engine falla.
  Solo se lanza el error tecnico.

## 12. Historial

| Version | Fecha | Cambio |
|---|---|---|
| 1.0.0 | 28/06/2026 | Contrato inicial |
| 1.1.0 | 29/06/2026 | La Neta → Que Pex. Resenas migradas a Pachanga (publicar-resena). feed_scope incluye que-pex |
