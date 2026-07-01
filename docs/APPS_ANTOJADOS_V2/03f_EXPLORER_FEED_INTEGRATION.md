# Integración Explorer Feed — apps Android/iOS

## ¿Qué cambió?

Las apps **ya NO consumen de `soc_posts` en Antojados API**. Ahora consumen directamente de **Explorer DB** a través del nuevo **feed endpoint de Explorer API**.

Esto permite que los posts creados en Explorer (con diseño visual completo) se rendericen interactivamente en las apps.

## Arquitectura

```
Explorer API (backend)
    │
    ├── GET /api/v1/explorer/tenants/{tenantId}/feed/{feedType}
    │
    ▼
App Android/iOS recibe JSON con composicion.blocks[]
    │
    ├── VisorInteractivo renderiza blocks
    │   ├── image → ImageView (touch → fullscreen)
    │   ├── title/subtitle/body/text → TextView (touch → zoom)
    │   ├── price → TextView estilizado (touch → zoom)
    │   ├── badge → TextView estilo badge (touch → zoom)
    │   ├── rating → TextView estrellas (touch → zoom)
    │   ├── watermark → TextView opaco (no interactivo)
    │   └── separator → View divisor
    │
    └── Gestos táctiles nativos
```

## Endpoint de Feed

```
GET https://explorer-api.antojadosmx.mx/api/v1/explorer/tenants/{tenantId}/feed/{feedType}
```

### Parámetros

| Parámetro | Tipo | Descripción |
|---|---|---|
| `tenantId` | string | ID del tenant (ej: `antojados-mx`, o el tenant del sponsor) |
| `feedType` | string | `que-pex`, `pachanga`, o `sponsor` |
| `limit` | query (int) | Máximo de items (default 50) |
| `offset` | query (int) | Paginación (default 0) |

### Tipos de feed

| feedType | ¿Qué muestra? | tenantId |
|---|---|---|
| `que-pex` | Posts de noticias, notas, contenido general | `antojados-mx` |
| `pachanga` | Posts de comida, eventos, promos | `antojados-mx` |
| `sponsor` | Publicidad del negocio sponsor | `{tenant_id_del_sponsor}` |

### Response

```json
{
  "ok": true,
  "items": [
    {
      "id": "que-pex-a1b2c3d4",
      "feed_type": "que-pex",
      "destination_id": "dst-antojados-quepex",
      "published_at": "2026-06-30T12:00:00.000Z",
      "composicion": {
        "tipoPost": "foodie",
        "tipoContent": "platillo",
        "efectoGlobal": "retro",
        "blocks": [ ... ]
      },
      "title": "Tacos al pastor",
      "media_url": "https://engine.../feed.jpg",
      "media_thumbnail_url": "https://engine.../thumb.jpg",
      "media_feed_url": "https://engine.../feed.jpg",
      "media_full_url": "https://engine.../full.jpg",
      "media_type": "photo",
      "author_handle": "Explorador",
      "author_avatar_url": null
    }
  ],
  "total": 1
}
```

## Schema de composicion.blocks[]

Cada `composicion` contiene un array `blocks[]`. Cada bloque tiene:

```typescript
interface Block {
  // ID único del bloque
  id: string

  // Tipo de elemento
  elementType: 
    | 'image' | 'title' | 'subtitle' | 'body' | 'text'
    | 'price' | 'rating' | 'badge' | 'watermark'
    | 'separator' | 'author' | 'date' | 'location'

  // Contenido (texto o URL de imagen)
  content: string

  // Estilos inline
  style: {
    fontSize?: number        // px
    fontWeight?: string      // 'normal' | 'bold' | '700' etc
    fontFamily?: string      // 'Inter, sans-serif' etc
    color?: string           // hex o nombre
    bgColor?: string         // hex
    bgGradient?: string      // CSS gradient
    border?: string          // CSS border shorthand
    borderRadius?: string    // px
    boxShadow?: string       // CSS shadow
    opacity?: number         // 0-1
    padding?: string         // px
    textAlign?: string       // 'left' | 'center' | 'right'
    objectFit?: string       // 'cover' | 'contain'
    filter?: string          // CSS filter
    brightness?: number      // 0-200
    contrast?: number        // 0-200
    scaleX?: number          // 1 normal, -1 flip H
    scaleY?: number          // 1 normal, -1 flip V
    rotate?: number          // grados
  }

  // Posición en el grid
  gridPos: {
    col: number       // 1-based
    row: number       // 1-based
    colspan: number   // ancho en celdas
    rowspan: number   // alto en celdas
    offsetX?: number  // desplazamiento fino px
    offsetY?: number  // desplazamiento fino px
  }
}
```

## Efecto Global

El canvas tiene un efecto que define colores y fuente base:

```typescript
interface EfectoGlobal {
  id: string           // 'retro' | 'dark' | 'clean' | 'vibrant' | 
                       // 'minimal' | 'madera' | 'neon' | 'acuarela' |
                       // 'carbon' | 'pastel' | 'oceano'
  name: string
  bgColor: string      // color de fondo del canvas
  bgGradient?: string  // gradient (opcional, sobreescribe bgColor)
  fontFamily: string   // fuente base
  textColor: string    // color de texto por defecto
  accentColor: string  // color de acento
  borderColor: string  // color de borde
}
```

## Canvas dimensions

- **Ancho**: 380px
- **Alto**: 640px
- **Ratio**: 380/640 = 0.59375
- La app debe escalar manteniendo la proporción (letterbox)
- Los blocks se posicionan en `position: absolute` dentro del canvas

**Cálculo de posición:**

```typescript
cellWidth = 380 / grid.cols  // grid.cols de composicion (default 4)
cellHeight = 640 / grid.rows // grid.rows de composicion (default 6)

left = (block.gridPos.col - 1) * cellWidth + (block.gridPos.offsetX || 0)
top = (block.gridPos.row - 1) * cellHeight + (block.gridPos.offsetY || 0)
width = block.gridPos.colspan * cellWidth - 4  // -4 por margen de 2px cada lado
height = block.gridPos.rowspan * cellHeight - 4
```

## Comportamiento interactivo

| Bloque | Touch | Animación |
|---|---|---|
| `image` | Tap → Fullscreen | Transición de posición a pantalla completa |
| `title`, `subtitle`, `body`, `text` | Tap → Zoom al frente | Escala + translación al centro |
| `price` | Tap → Zoom al frente | Escala + translación al centro |
| `badge` | Tap → Zoom al frente | Escala + translación al centro |
| `rating` | Tap → Zoom al frente | Escala + translación al centro |
| `watermark` | No interactivo | — |
| `separator` | No interactivo | — |
| Cualquier bloque en zoom | Tap fuera del bloque | Regresa a vista normal |

### Flujo de navegación

1. App carga feed desde `GET /feed/:feedType`
2. Muestra primer item con todos los blocks renderizados
3. Swipe left/right → navega entre items del feed (paginación)
4. Tap en bloque → animación de zoom al frente
5. Tap en imagen → fullscreen (ocupa toda la pantalla)
6. Tap fuera del bloque/ imagen → regresa a vista normal del item
7. Al llegar al último item, carga el siguiente batch (offset + limit)

## Sponsor Feed

Para publicaciones de tipo sponsor:

```kotlin
// Ejemplo Android
val feed = api.getFeed(
    tenantId = sponsorTenantId,  // ej: "restaurante-el-gourmet"
    feedType = "sponsor"
)
// Mismo formato de response, misma interactividad
```

El sponsor contrata para que su publicidad tenga:
1. Edición visual profesional (Explorer)
2. Publicación con diseño completo (JSON en DB)
3. Experiencia interactiva en la app (visor táctil)
4. Opcional: exportación del diseño como imagen

## Publicación individual

Para ver detalle de un post específico (ej: notificación push):

```
GET /api/v1/explorer/publications/{publicationId}
```

Response: mismo formato que un item del feed.

## Migración desde soc_posts

**No es necesario migrar datos existentes.** Los posts nuevos se crean en Explorer DB. Los posts legacy en `soc_posts` pueden coexistir hasta que se decida migrarlos.

Para consumir ambos:
1. Usar Explorer Feed para posts nuevos (tienen `composicion`)
2. Usar `soc_posts` existente para posts legacy (solo tienen `media_url` + `caption`)

## Lista de tareas para Android/iOS

- [ ] Implementar HTTP client para Explorer API (base URL configurable)
- [ ] Crear modelo de datos: `FeedItem`, `Block`, `GridPosition`, `ElementStyle`
- [ ] Crear `FeedRepository` que consume `GET /tenants/:tid/feed/:feedType`
- [ ] Implementar `ExplorerPostRenderer`:
  - [ ] Renderizar canvas con efecto global (bgColor, fontFamily, border)
  - [ ] Renderizar cada block según `elementType`
  - [ ] Posicionar blocks con `gridPos` (position absolute)
  - [ ] Escalar canvas manteniendo ratio 380/640
- [ ] Implementar gestos táctiles:
  - [ ] Tap en `image` → fullscreen con animación
  - [ ] Tap en otros blocks → zoom al frente con animación
  - [ ] Tap fuera → regresa a vista normal
- [ ] Implementar swipe left/right para navegar entre items
- [ ] Implementar paginación (offset + limit)
- [ ] Crear componente específico para Sponsor (mismo renderer, diferente feed)