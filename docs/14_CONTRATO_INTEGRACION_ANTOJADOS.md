# Contrato de Integración — Explorer → Antojados Apps

## Visión General

Este documento describe los productos que Explorer y Engine Media entregan,
y lo que Antojados apps (iOS, Android, Web) debe implementar para consumirlos
correctamente en los feeds S1, S2 y S3 (fullscreen).

---

## Responsabilidades por Dominio

### Engine Media
- Procesar foto y video.
- Aplicar looks oficiales.
- Normalizar multimedia.
- Generar variantes: thumbnail, gallery_vertical, gallery_horizontal, hero, fullscreen, short_video, short_poster.
- Publicar **Media Package** con `media_id`, `product_code`, `public_url` HTTPS.

**Nunca conoce**: usuarios, sponsors, posts, feed, Explorer.

### Explorer
- Editor avanzado de composiciones.
- Body editorial y plantillas oficiales.
- Generar **Document Package** con `document_code`, `schema_version`, `composicion`, `template_code`, `body_style_code`, `media_look_code`, `effects`.
- Publicar document packages en `explorer_core.publications`.
- Servir feed con composiciones via `GET /feed/:feedType`.

**Nunca gobierna**: Feed, interfaz de usuario final, interacción social.

### Antojados Apps
- Consumir Media Package y Document Package.
- Renderizar feeds S1, S2, S3 a partir de los packages.
- Gestionar interacción social (likes, comentarios, compartir).
- Gestionar chat dentro de template user-s1.
- Publicar posts creados desde sus propias interfaces.
- En P3 de publicación, guardar URL de media en su propia DB.

**No procesa multimedia, no genera modelos documentales, no construye URLs.**

---

## Productos que Explorer y Engine ya entregan

### 1. Media Package (Engine)

Cada media subida a Engine produce un paquete con:

```json
{
  "media_id": "uuid",
  "version": "1.0",
  "status": "ready",
  "products": [
    {
      "product_code": "prd-abc123",
      "media_type": "image",
      "orientation": "portrait",
      "width": 1080,
      "height": 1350,
      "mime_type": "image/jpeg",
      "public_url": "https://engine.antojadosmx.mx/media/abc123/feed.jpg",
      "version": "1.0"
    }
  ]
}
```

Formatos por tipo de post:

| Tipo post | Thumb | Gallery V | Gallery H | Hero | Fullscreen |
|---|---|---|---|---|---|
| foodie | 320×320 | 1080×1350 | 1080×608 | 1080×1920 | 1440×2560 |
| nota | 320×320 | 1080×1350 | 1080×608 | 1080×1920 | 1440×2560 |
| sponsor | 320×320 | 1080×1350 | 1080×608 | 1080×1920 | 1440×2560 |

### 2. Document Package (Explorer)

Cada post publicado produce un document package:

```json
{
  "document_code": "exp-que-pex-k8f3m2a1",
  "schema_version": "1.0",
  "project_id": "post-xxx",
  "title": "Nombre del post",
  "composicion": {
    "tipoPost": "foodie",
    "tipoContent": "platillo",
    "efectoGlobal": "retro",
    "blocks": [
      {
        "id": "image-x7k9m2",
        "elementType": "image",
        "content": "https://engine.antojadosmx.mx/media/abc123/feed.jpg",
        "mediaAssetId": "prd-abc123",
        "mediaUrls": {
          "thumbUrl": "https://.../thumb.jpg",
          "feedUrl": "https://.../feed.jpg",
          "fullUrl": "https://.../full.jpg"
        },
        "style": { "objectFit": "cover" },
        "gridPos": { "col": 1, "row": 1, "colspan": 24, "rowspan": 30 }
      }
    ]
  },
  "media_asset_id": "prd-abc123",
  "template_code": "full-frame",
  "body_style_code": "retro",
  "media_look_code": "madera",
  "effects": ["sombra", "neon"],
  "feed_type": "que-pex",
  "creator_id": "user-xxx",
  "source_app": "explorer",
  "author_handle": "Explorador"
}
```

---

## Lo que Antojados Apps debe implementar

### P1 — Consumo de Media Package

Antojados debe:

1. Al recibir un post del feed, extraer `media_asset_id` del document package
2. Consultar a Engine Media por los productos disponibles para ese `media_asset_id`
   (o recibirlos directamente en el feed si Engine los incluye)
3. Seleccionar el formato adecuado según el contexto:
   - **Feed S1/S2**: `gallery_vertical` (1080×1350)
   - **Hero S3**: `hero` (1080×1920)
   - **Galería S3**: `gallery_vertical` + `gallery_horizontal`
   - **Thumbnail**: `thumbnail` (320×320)
4. Renderizar la URL pública (`public_url`) en el componente de imagen nativo

**No construir URLs manualmente.** Usar siempre las URLs que vienen en los packages.

### P2 — Consumo de Document Package (reconstrucción S1)

Antojados debe implementar un **renderer de document packages** que:

1. Recibir el `composicion.blocks[]` del document package
2. Para cada bloque:
   - Identificar `elementType`
   - Aplicar `style` (fontSize, fontWeight, color, textAlign, etc.)
   - Posicionar según `gridPos` (col, row, colspan, rowspan)
   - Calcular dimensiones según grid: 24 cols × 40 rows en 380×640px
3. Aplicar `body_style_code`: cargar las variables CSS del look de canvas desde `explorer_core.looks`
4. Aplicar `media_look_code`: cargar las variables CSS del look de elementos
5. Aplicar `effects[]`: cargar efectos por bloque
6. Renderizar el post completo con interacciones táctiles:

| Elemento | Touch behavior |
|---|---|
| `image` | Touch → fullscreen (S3) |
| `title`, `subtitle`, `price`, `badge` | Touch → zoom-front con animación |
| `body`, `text` | Touch → expand-text (expande contenido) |
| `watermark` | No interactivo |
| `separator` | No interactivo |
| Cualquier bloque activo | Touch fuera → regresa a vista normal |

#### Grid de referencia

| Orientación | Canvas | Cols | Rows |
|---|---|---|---|
| Vertical | 380×640 | 24 | 40 |
| Horizontal | 640×380 | 24 | 24 |

Cálculo de posición:
```
left = (block.gridPos.col - 1) * (canvasWidth / gridCols)
top = (block.gridPos.row - 1) * (canvasHeight / gridRows)
width = block.gridPos.colspan * (canvasWidth / gridCols)
height = block.gridPos.rowspan * (canvasHeight / gridRows)
```

### P3 — Publicación (creación de posts desde Antojados)

Antojados apps pueden crear posts desde su propia interfaz (no solo desde Explorer).

El flujo de publicación desde Antojados:

1. **Usuario captura o selecciona media**
2. **Antojados envía media a Engine** → recibe Media Package con `media_asset_id`
3. **Antojados solicita plantilla S1 a Explorer** → recibe Document Package base
   `GET /api/v1/explorer/templates?feed_type=s1-user`
   → Selecciona `user-s1` template
4. **Usuario completa campos simples** (título, descripción, etc.)
5. **Antojados liga Document Package + Media Package**:
   - Toma el template base
   - Asigna `media_asset_id` al bloque de imagen
   - Asigna URLs de media a `mediaUrls`
   - Llena campos editables (title, body, price, badge)
6. **Antojados envía el document package a Explorer**:
   ```
   POST /api/v1/explorer/tenants/{tenantId}/external/posts
   ```
   Explorer guarda en `explorer_core.publications` y sirve via feed.
7. **Antojados guarda URL de media en su propia DB**
   para exponer el post en su interfaz.

### S1 — Feed principal

Renderizar document packages en lista vertical.
Cada item del feed es un post completo con:
- Imagen principal (desde media package)
- Título, precio, badge, rating (desde document package blocks)
- Efectos visuales aplicados (body_style_code, media_look_code)
- Autor y metadata

Touch en cualquier elemento → comportamiento interactivo definido arriba.

### S2 — Feed enriquecido

Misma estructura que S1 pero con:
- Transiciones entre items más elaboradas (parallax, fade)
- Preview de contenido expandido
- Acceso directo a acciones sociales (like, comentar, compartir)
- Reutilización del mismo document package de S1

**No rediseñar el post.** El document package es el mismo. Solo cambia el
envoltorio del feed (transiciones, acciones).

### S3 — Fullscreen (Hero + galería)

Al hacer touch en una imagen, abrir fullscreen con:

1. **Hero**: Imagen en tamaño completo (hero, 1080×1920)
2. **Galería secundaria**: Thumbnails de otras imágenes del post (si existen)
3. **Metadatos**: Título, precio, badge del document package sobrepuestos
4. **Interacción social**: Like, comentar, compartir

**Galería deja de ser el renderer principal.** El renderer principal es
el document package en S1/S2. La galería solo aparece en S3 como complemento.

### Template user-s1 (chat, emoticones, contacto)

El template `user-s1` está diseñado para que Antojados implemente
funcionalidades sociales dentro del post:

1. **Chat embedido**: El post puede contener un bloque de tipo `chat`
   que permite a los usuarios comentar en tiempo real dentro del post.
   Explorer no renderiza el chat (es responsabilidad de Antojados).

2. **Acciones de contacto**: Botón "Contactar" que abre:
   - WhatsApp (si el negocio tiene número)
   - Llamada telefónica
   - Mensaje directo en la app
   - El `template_code: "user-s1"` en el document package indica
     que este post tiene capacidades de contacto.

3. **Emoticones dinámicos**: Los usuarios pueden reaccionar al post con:
   - 👍 Like
   - ❤️ Amor
   - 😂 Risas
   - 😮 Sorpresa
   - 😢 Tristeza
   - 😡 Enojo
   - Estos no vienen del document package. Son responsabilidad de Antojados
     gestionarlos en su capa de interacción social.

4. **Campos editables para el usuario**:
   - `title`: Título (texto plano)
   - `body`: Descripción (texto multilínea)
   - `price`: Precio (numérico con formato moneda)
   - `badge`: Etiqueta (texto corto)
   - `rating`: Calificación (1-5 estrellas)
   - `date`: Fecha del evento
   - `location`: Ubicación (texto + coordenadas)
   - Antojados debe presentar estos campos como un formulario simple
     cuando el usuario crea un post desde su app.

### Reutilización de packages en S2

S2 puede reutilizar el mismo document package de S1 sin modificaciones.
La diferencia está en el envoltorio del feed:

| Aspecto | S1 | S2 |
|---|---|---|
| Document package | Mismo | Mismo |
| Transiciones | Simple | Parallax, fade |
| Acciones sociales | Touch en elemento | Botones visibles |
| Preview contenido | Solo bloque tocado | Expandido parcial |
| Hero | Solo al tocar imagen | Preview de hero |

Esto garantiza que el post se vea igual en ambos feeds, pero con
experiencia de navegación diferente.

---

## Endpoints que Antojados debe consumir

### De Explorer API

| Endpoint | Método | Propósito |
|---|---|---|
| `GET /api/v1/explorer/tenants/{tenantId}/feed/{feedType}` | GET | Obtener feed con document packages |
| `GET /api/v1/explorer/templates?feed_type=s1-user` | GET | Obtener template user-s1 para crear posts |
| `POST /api/v1/explorer/tenants/{tenantId}/external/posts` | POST | Enviar document package creado desde Antojados |

### De Engine Media

| Endpoint | Método | Propósito |
|---|---|---|
| `POST /api/v1/media/upload-sessions` | POST | Crear sesión de upload |
| `POST /api/v1/media/assets` | POST | Subir archivo original |
| `GET /api/v1/media/assets/{mediaId}` | GET | Obtener media package completo |

### Gateway único

```
https://api.antojadosmx.mx
  ├── /api/v1/explorer/*         → Explorer API
  ├── /api/media/*               → Engine Media
  └── /api/v1/antojados/*        → Antojados propia API
```

Antojados apps solo deben configurar `https://api.antojadosmx.mx` como base URL.
**Nunca usar localhost, IP, HTTP ni puertos internos.**

---

## Flujo completo de publicación (P1, P2, P3)

### Cuando el post se crea desde Explorer

```
Explorer editor
  → sube media a Engine (P1) → recibe media_asset_id + URLs
  → edita composición con template
  → click PUBLICAR → 
      P1: Engine DB guarda media (ya hecho)
      P2: Explorer DB guarda document package completo
      P3: Antojados recibe notificación con URL media → guarda en su DB
  → Antojados consume via feed
```

### Cuando el post se crea desde Antojados app

```
Usuario Antojados
  → captura/selecciona media
  → Antojados sube a Engine (P1) → recibe media_asset_id
  → Antojados pide template user-s1 a Explorer
  → Usuario llena campos (title, body, price, etc.)
  → Antojados construye document package con template + media + campos
  → Antojados envía a Explorer via POST /external/posts (P2)
  → Antojados guarda URL media en su DB (P3)
  → Explorer sirve el post via feed para todos los clientes
```

---

## Historial

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0 | 2026-07-01 | Contrato inicial de integración Explorer → Antojados |
