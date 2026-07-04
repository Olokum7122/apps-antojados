# 03b — Feed System

Version: 1.1.0
Status: updated
Applies to: shared/api/services/feed/, shared
/api/composables/useAntojadosFeed.ts, useAntojoFeed.ts

## 1. Proposito

Define el sistema de feeds de la app. Los feeds son el componente central
de la experiencia de usuario: muestran contenido social y de negocios
organizado por contexto (barrio, pachanga, que-pex, desma, vas-ir, arre, etc.).

## 2. Tipos de Feed

| Feed | Servicio | Composable | Canal | Proposito |
|---|---|---|---|---|
| Barrio | social-feed.service.ts | useAntojadosFeed | momentoS | Feed social general por ciudad/zona |
| Pachanga | social-feed.service.ts | useAntojadosFeed | social_event | Eventos sociales **+ reseñas** |
| Qué Pex | social-feed.service.ts | useAntojadosFeed | que-pex | Periódico ciudadano (noticias) |
| En el Desma | social-feed.service.ts | useAntojadosFeed | desma | Feed de desmadre (videos) |
| Vas Ir | biz-feed.service.ts | useAntojoFeed | biz | Feed de negocios (galeria) |
| Arre | biz-feed.service.ts | useAntojoFeed | biz | Agenda de eventos de negocio |
| Mi Rollo | mi-rollo.service.ts | — | personal | Feed personalizado por usuario |

## 3. Arquitectura de Feeds

```
Vista Vue
    │
    ▼
Composable de Feed (useAntojadosFeed | useAntojoFeed)
    │
    ├── Obtiene scope geografico (useLocationScope)
    ├── Obtiene sesion (useAuth)
    │
    ▼
Servicio de Feed (social-feed | biz-feed | mi-rollo)
    │
    ▼
httpClient → API de Antojados (185.187.235.253:8010)
```

## 4. Contrato de Social Feed (social-feed.service.ts)

```typescript
class SocialFeedService {
  async getFeed(input: SocialFeedInput): Promise<SocialFeedResult>
  async getFollowing(userId: string): Promise<UserProfile[]>
  async getFollowers(userId: string): Promise<UserProfile[]>
  async getSaves(userId: string): Promise<SocialPost[]>
}
```

### Endpoints consumidos

| Metodo | Endpoint | Response |
|---|---|---|
| getFeed | GET /api/v1/antojados/feed | Lista de posts con paginacion |
| getFollowing | GET /api/v1/antojados/social/following/:userId | Lista de usuarios seguidos |
| getFollowers | GET /api/v1/antojados/social/followers/:userId | Lista de seguidores |
| getSaves | GET /api/v1/antojados/social/saves/:userId | Posts guardados |

### Parametros del feed

El feed se filtra por:
- `feed_type`: El tipo de feed (que-pex, momentoS, social_event, desma, etc.)
- `city_code`: Ciudad para filtrar contenido local
- `scope_level` y `scope_code`: Nivel de alcance geografico

### Response tipico

```typescript
interface SocialPost {
  post_id: string
  user_id: string
  display_name: string
  username: string
  avatar_url: string | null
  media_url: string | null
  media_thumbnail_url: string | null
  media_type: 'photo' | 'video' | null
  description: string | null
  venue_name: string | null
  city_code: string | null
  likes_count: number
  comments_count: number
  created_at: string
  // ...
}
```

## 5. Contrato de Biz Feed (biz-feed.service.ts)

```typescript
class BizFeedService {
  async getFeed(input: BizFeedInput): Promise<BizFeedResult>
  async getPostDetail(bizPostId: string): Promise<BizPostDetail>
}
```

### Endpoints consumidos

| Metodo | Endpoint | Response |
|---|---|---|
| getFeed | GET /api/v1/antojados/biz/feed | Lista de posts de negocio |
| getPostDetail | GET /api/v1/antojados/biz/posts/:id | Detalle de un post |

### Response tipico

```typescript
interface BizPost {
  biz_post_id: string
  publisher_user_id: string
  place_id: string
  business_name: string | null
  channel: 'vas_ir' | 'arre'
  publication_type: string
  title: string
  body: string | null
  media_url: string | null
  media_type: 'photo' | 'video' | null
  cta_label: string | null
  cta_url: string | null
  starts_at: string | null
  ends_at: string | null
  created_at: string
  // ...
}
```

## 6. Contrato de Mi Rollo (mi-rollo.service.ts)

```typescript
class MiRolloService {
  async getFeed(userId: string): Promise<SocialPost[]>
}
```

Feed personalizado que muestra solo contenido del usuario y de las personas/negocios que sigue.

## 7. Composable useAntojadosFeed

Orquesta el feed social. Maneja:

- Paginacion (scroll infinito)
- Cambio de contexto (barrio ↔ pachanga ↔ que-pex ↔ en-el-desma)
- Scope geografico (ciudad actual)
- Refresh de contenido

```typescript
function useAntojadosFeed(options: { feedType: string }): {
  posts: Ref<SocialPost[]>
  loading: Ref<boolean>
  error: Ref<string | null>
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
  hasMore: Ref<boolean>
}
```

## 8. Composable useAntojoFeed

Orquesta el feed de negocios. Maneja:

- Paginacion
- Filtro por canal (vas_ir | arre)
- Refresh

```typescript
function useAntojoFeed(options: { channel: string }): {
  posts: Ref<BizPost[]>
  loading: Ref<boolean>
  error: Ref<string | null>
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
  hasMore: Ref<boolean>
}
```

## 9. Acciones Sociales (social-actions.service.ts)

```typescript
class SocialActionsService {
  async follow(targetUserId: string): Promise<void>
  async unfollow(targetUserId: string): Promise<void>
  async like(postId: string): Promise<void>
  async unlike(postId: string): Promise<void>
  async save(postId: string): Promise<void>
  async unsave(postId: string): Promise<void>
}
```

### Endpoints

| Accion | Metodo HTTP | Ruta |
|---|---|---|
| Follow | POST | /api/v1/antojados/social/follow |
| Unfollow | DELETE | /api/v1/antojados/social/follow/:userId |
| Like | POST | /api/v1/antojados/social/like |
| Unlike | DELETE | /api/v1/antojados/social/like/:postId |
| Save | POST | /api/v1/antojados/social/save |
| Unsave | DELETE | /api/v1/antojados/social/save/:postId |

## 10. Sincronizacion de Eventos

El endpoint `POST /api/v1/antojados/sync/events` permite sincronizar
eventos del feed social con el servidor.

## 11. Flujo de Carga de Feed

```
1. Usuario abre una vista de feed
2. Composable detecta el tipo de feed (feedType / channel)
3. Obtiene la ciudad actual (useLocationScope)
4. Llama al servicio con { feed_type, city_code, page, perPage }
5. Servicio mapea la respuesta al formato tipado
6. Composable actualiza la lista de posts
7. UI renderiza los posts (FeedPostCard, FeedGalleryBase, etc.)
8. Scroll infinito: al llegar al final, llama loadMore() → siguiente pagina
```

## 12. Renderizado de Posts

Los posts se renderizan usando componentes base:
- `FeedPostCard.vue` — Tarjeta individual de post
- `FeedGalleryBase.vue` — Galeria de media
- `FeedFullscreenBase.vue` — Vista fullscreen de un post
- `FeedDetailColumnBase.vue` — Columna de detalle
- `FeedPostBase.vue` — Post base reutilizable

### 12.1 Feed Pachanga (con reseñas)

Pachanga hereda la lógica de reseñas que antes pertenecía a La Neta.
El feed muestra tanto eventos sociales como reseñas de lugares/platillos.

- **S1:** Grid de thumbnails (mismos componentes)
- **S2:** Card con calificación (estrellas + dims heredados de La Neta)
- **S3:** Fullscreen con detalle de reseña
- **FAB:** Opciones "Publicar evento" + "Publicar reseña"

### 12.2 Feed Qué Pex (periódico ciudadano)

Ocupa el espacio de navegación que antes era La Neta.

- **S1:** Grid de thumbnails (mismos componentes)
- **S2:** Card con titular grande + categoría visible + badge de explorador
- **S3:** Fullscreen con cuerpo de noticia + foto
- **Sin calificación** — no tiene estrellas, dims ni ratings
- **Sin FAB propio** — el contenido se produce desde Explorer App

## 13. Reglas No Negociables

- El feed debe cargar en menos de 3 segundos en conexion 4G
- El scroll infinito debe tener un maximo de 50 paginas cargadas en memoria
- Las imagenes del feed deben cargarse lazy (v-lazy de Quasar o IntersectionObserver)
- Los videos del feed deben tener autoplay en silent mode
- Los feeds deben usar el sistema de dimensiones para analytics
- Las acciones (like, follow, save) deben ser optimistas: UI cambia inmediato, luego API

## 14. Prohibiciones

- No cargar todo el feed de una sola vez (siempre paginado)
- No renderizar videos en autoplay con sonido
- No almacenar el feed completo en memoria (cache solo la pagina actual + 2 adyacentes)
- No hacer polling al feed (solo refresh manual o pull-to-refresh)
- No mezclar posts de negocio con posts sociales en el mismo composable

## 15. ⚠️ Deuda Tecnica Identificada

- No hay cache de feed. Cada vez que se cambia de tab o se vuelve a una vista,
  se hace una llamada completa a la API. Propuesta: cache de la pagina actual
  con invalidacion por tiempo (60 segundos).
- El scroll infinito no tiene limite de paginas en memoria. En feeds muy grandes,
  el consumo de RAM puede crecer sin control.
- No hay metricas de rendimiento de carga de feed (TTI, LCP, FCP).
  Propuesta: integrar Performance API o Sentry para monitorear.
- `social-actions.service.ts` no maneja estados de error granularmente.
  Si un like falla, no se revierte el estado optimista.
- `mi-rollo.service.ts` no tiene paginacion explcita en su interfaz.
- Los componentes base de feed (FeedPostCard, FeedGalleryBase) mezclan logica
  de presentacion con logica de negocio (llamadas a servicios en el template).
- No hay skeleton loaders. La UX de carga es "nada → de repente contenido".

<<<<<<< HEAD
## 16. Historial
=======
## 16. Parametro `feed_type` vs `feed_scope`

El API Gateway (`Api_getaway_antojadosmx`) acepta `feed_scope` como parametro
en `GET /api/v1/antojados/feed`, pero internamente el `feedResolver.js` lo
usa como parte de la query. Sin embargo, el contrato oficial (seccion 4)
define `feed_type` como el nombre del parametro.

El `social-feed.service.ts` envia `feed_scope` como nombre de parametro:

```typescript
// social-feed.service.ts — actual
const response = await this.http.get(API_ENDPOINTS.socialPosts.feed, {
  params: {
    feed_scope: params.scope || undefined,  // ← deberia ser feed_type
    city_code: params.cityCode,
    ...
  }
})
```

**Deuda asociada**: DEBT-041 — el nombre del parametro debe estandarizarse
a `feed_type` tanto en el cliente como en el Gateway.

## 17. ⚠️ Deuda Tecnica Identificada (Post-Liquidacion)

Ver `08_TECHNICAL_DEBT.md` seccion 3.11 para detalle completo.

| ID | Descripcion | Prioridad |
|---|---|---|
| DEBT-040 | `venue_name` hardcodeado como "En el Desma" en todos los posts | 🟢 Baja |
| DEBT-041 | `feed_scope` vs `feed_type` — parametro inconsistente | 🟡 Alta |
| DEBT-042 | Likes en Desma no revierten estado optimista en fallo | 🟡 Media |

## 18. Historial
>>>>>>> staging-20260307

| Version | Fecha | Cambio |
|---|---|---|
| 1.0.0 | 28/06/2026 | Contrato inicial |
| 1.1.0 | 28/06/2026 | La Neta → Qué Pex. Reseñas movidas a Pachanga |
<<<<<<< HEAD
=======
| 1.2.0 | [FECHA_ACTUAL] | Agregadas secciones 16 y 17. Documentado DEBT-041, DEBT-040, DEBT-042 |
>>>>>>> staging-20260307
