# Contrato de Arquitectura --- API Central del Ecosistema Antojados (v1.1)

## Objetivo

Implementar una única API pública para todo el ecosistema Antojados.

**Único endpoint público permitido:**

`https://api.antojadosmx.mx`

Ningún cliente (iOS, Android, Web o Explorer) podrá consumir IPs,
`localhost` o puertos internos.

------------------------------------------------------------------------

# 1. Arquitectura

## Componentes

-   apps-antojados

    -   app-ios
    -   app-android
    -   app-web
    -   shared/ui
    -   shared/http
    -   shared/api

-   media-engine

-   explorer-app

-   explorer-api

-   atlx_antojados_gt

------------------------------------------------------------------------

# 2. Gateway

Cloudflare ↓

Nginx (443) ↓

Servicios internos

Mapeo obligatorio:

-   `/api/v1/antojados/*` → localhost:8010
-   `/api/media/*` → localhost:4100
-   `/media/*` → localhost:4100
-   `/api/v1/explorer/*` → localhost:4101
-   `/api/v1/gt/*` → puerto GT

Los puertos internos nunca serán visibles para clientes.

------------------------------------------------------------------------

# 3. Cloudflare

-   DNS:
    -   `api.antojadosmx.mx` → Contabo (Proxy ON)
-   SSL/TLS:
    -   Full (Strict)
    -   Always HTTPS ON
    -   Automatic HTTPS Rewrites ON

------------------------------------------------------------------------

# 4. Variables

Clientes:

`VITE_API_URL=https://api.antojadosmx.mx`

Media Engine:

`ME_MEDIA_BASE_URL=https://api.antojadosmx.mx`

Prohibido:

-   localhost
-   127.0.0.1
-   IP pública
-   http://

------------------------------------------------------------------------

# 5. URLs públicas

Permitidas:

-   https://api.antojadosmx.mx/api/v1/antojados/...
-   https://api.antojadosmx.mx/api/media/...
-   https://api.antojadosmx.mx/media/...
-   https://api.antojadosmx.mx/api/v1/explorer/...
-   https://api.antojadosmx.mx/api/v1/gt/...

------------------------------------------------------------------------

# 6. Responsabilidades

## apps-antojados

-   Produce posts
-   Consume feed
-   Consume media
-   Guarda URLs finales
-   Renderiza contenido

## media-engine

-   Procesa multimedia
-   Genera variantes
-   Publica URLs HTTPS

## explorer

-   Produce documentos JSON
-   Publica contenido editorial

## GT

-   Control operativo
-   Control económico
-   Auditoría
-   Rules
-   Chat

------------------------------------------------------------------------

# 7. Comunicación

## Proxy interno

Operaciones síncronas.

## Bus

Eventos asíncronos:

-   media_uploaded
-   media_processed
-   post_created
-   explorer_document_created
-   rule_updated
-   analytics_event_created

------------------------------------------------------------------------

# 8. Restricciones

Prohibido:

-   Hardcodear URLs.
-   Consumir localhost desde clientes.
-   Consumir IP directa.
-   Exponer puertos internos.
-   Resolver media fuera de shared/http o shared/api.

Toda normalización de URLs será centralizada.

------------------------------------------------------------------------

# 9. Interaccion con Media Engine a traves del Gateway

El API Gateway (`Api_getaway_antojadosmx`) es el unico punto de entrada para la creacion
de posts con media. El flujo correcto es:

```
App (iOS/Android)
  → 1. Sube media al Media Engine (directo via Nginx proxy)
  → 2. Obtiene media_intake_id del ready-payload
  → 3. POST /api/v1/antojados/posts { media_intake_id, ... }
  → Gateway: resolvePostMediaFromIntake() busca URLs en DB
  → Gateway: crea el post con media_url y media_thumbnail_url resueltos
```

El Gateway es el responsable de:

### 9.1 Resolucion de URLs de Media (`postsResolver.js`)

La funcion `resolvePostMediaFromIntake()` implementa:

1. Busca `media_intake_id` en `antojados_core.soc_media_intake`
2. Joinea con `antojados_core.soc_media_assets` para obtener las URLs del Engine
3. Valida que el intake este en estado `done`
4. Valida que `entity_id` coincida con `post_id`
5. Resuelve URLs segun tipo de media:
   - Video: prioriza `video_720_url` > `video_1080_url` > `feed_url` > `full_url`
   - Imagen: prioriza `feed_url` > `full_url` > `thumb_url`
6. Asigna `media_url` y `media_thumbnail_url` en el post final

### 9.2 Responsabilidades

| Actor | Hace | No hace |
|---|---|---|
| Apps (iOS/Android) | Sube media al Engine, obtiene intake_id, crea post con intake_id | No resuelve URLs finales, no decide que variante usar |
| API Gateway | Resuelve URLs del Engine, valida estado, crea post en DB | No procesa media, no almacena archivos |
| Media Engine | Procesa multimedia, genera variantes, almacena en `soc_media_assets` | No crea posts, no decide visibilidad |
| Nginx | Proxy `/api/media/*` → localhost:4100, `/api/v1/antojados/*` → localhost:8010 | No procesa logica de negocio |

### 9.3 Mapeo de endpoints

| Ruta publica | Destino interno | Proposito |
|---|---|---|
| `https://api.antojadosmx.mx/api/media/*` | Nginx → `localhost:4100` (Media Engine) | Subida y procesamiento de media |
| `https://api.antojadosmx.mx/api/v1/antojados/posts` | Nginx → `localhost:8010` (API Gateway) | Creacion de posts (con intake_id) |
| `https://api.antojadosmx.mx/api/v1/antojados/feed` | Nginx → `localhost:8010` (API Gateway) | Consulta de feed |
| `https://api.antojadosmx.mx/media/*` | Nginx → `localhost:4100` (Media Engine static) | Servir archivos de media estaticos |

### 9.4 Reglas No Negociables

- Las apps **nunca** deben pasar `media_url` directo al crear un post. Deben pasar `media_intake_id`
- El Gateway **siempre** resuelve `media_url` y `media_thumbnail_url` via `resolvePostMediaFromIntake()`
- Si el intake no esta en estado `done`, el Gateway rechaza la creacion del post con error `MEDIA_INTAKE_NOT_DONE`
- Si el `entity_id` del intake no coincide con el `post_id`, el Gateway rechaza con error `MEDIA_INTAKE_POST_MISMATCH`
- El Gateway **nunca** debe llamar al Media Engine directamente. Las apps se comunican con el Engine a traves de Nginx

# 10. Criterios de aceptación

-   Todos los clientes usan únicamente `https://api.antojadosmx.mx`.
-   No existen referencias a localhost, IPs o HTTP en clientes.
-   Media funciona igual en iOS, Android y Web.
-   Gateway enruta correctamente hacia todos los servicios internos.
-   Cloudflare opera exclusivamente como HTTPS/CDN/WAF.
-   **Las apps pasan `media_intake_id` en lugar de `media_url` directo al crear posts.**
-   **El Gateway resuelve las URLs del Media Engine via `resolvePostMediaFromIntake()`.**
-   **El registro de derechos/origen (rights-origin) se ejecuta antes de uploadOriginal en todas las apps.**
