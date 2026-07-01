# Onboarding: Consumo de Publicaciones Explorer

## ¿Qué es Explorer?

Explorer es una herramienta web + Android para crear contenido visual interactivo para AntojadosMx. Los diseñadores (explorers) arman posts con imágenes, texto, precios, badges, ratings, etc. en un canvas de 380×640px, y los publican para que aparezcan en los feeds de la app.

## ¿Dónde estamos?

```
Repositorio: /Users/olokum68/AntojadosMx/
├── explorer-app/               ← Frontend Vue + Android (Capacitor)
│   ├── src/                    ← Código Vue
│   ├── android/                ← Proyecto Android (APK)
│   ├── dist/                   ← Build (subido a Contabo)
│   └── public/landing/         ← Landing para descargar APK
│
├── atlx-gt/apps/explorer-api/  ← Backend Node.js (Explorer API)
│   ├── src/services/           ← Lógica de negocio
│   ├── src/routes/             ← Endpoints Express
│   └── scripts/deploy-explorer.sh ← Script de deploy
│
├── apps-antojados/shared/      ← Código compartido (api, http, ui)
└── media-engine/               ← Engine de media (subida de imágenes)
```

## Flujo de la publicación

```
Explorer (editor web/Android)
  → Crea post con bloques visuales
  → Guarda proyecto (borrador)
  → Publica → POST /api/v1/explorer/publications/publish
    → Explorer API guarda en Explorer DB (SQL Server en Contabo)
    → Marca como published
  ← OK

App Android/iOS (AntojadosMx)
  → GET /api/v1/explorer/tenants/{tenantId}/feed/{feedType}
  ← Recibe JSON con composicion.blocks[]
  → Visor Interactivo renderiza los bloques
```

## Endpoints que consume la app

### Feed de publicaciones

```
GET https://explorer-api.antojadosmx.mx/api/v1/explorer/tenants/antojados-mx/feed/que-pex
GET https://explorer-api.antojadosmx.mx/api/v1/explorer/tenants/antojados-mx/feed/pachanga
GET https://explorer-api.antojadosmx.mx/api/v1/explorer/tenants/{sponsorId}/feed/sponsor
```

### Publicación individual

```
GET https://explorer-api.antojadosmx.mx/api/v1/explorer/publications/{publicationId}
```

## ¿Qué recibe la app?

Cada item del feed tiene:

```json
{
  "id": "que-pex-a1b2c3d4",
  "feed_type": "que-pex",
  "published_at": "2026-06-30T12:00:00.000Z",
  "composicion": {
    "tipoPost": "foodie",
    "tipoContent": "platillo",
    "efectoGlobal": "retro",
    "blocks": [
      {
        "elementType": "image",
        "content": "https://engine.../feed.jpg",
        "style": { "borderRadius": "8px" },
        "gridPos": { "col": 1, "row": 1, "colspan": 4, "rowspan": 3 }
      },
      {
        "elementType": "title",
        "content": "Tacos al pastor",
        "style": { "fontSize": 24, "color": "#ffffff", "fontWeight": "bold" },
        "gridPos": { "col": 1, "row": 4, "colspan": 3, "rowspan": 1 }
      },
      {
        "elementType": "price",
        "content": "Precio: $15.00",
        "style": { "fontSize": 18, "color": "#ffd700" },
        "gridPos": { "col": 1, "row": 5, "colspan": 2, "rowspan": 1 }
      },
      {
        "elementType": "badge",
        "content": "🔥 Promo",
        "gridPos": { "col": 3, "row": 4, "colspan": 1, "rowspan": 1 }
      }
    ]
  },
  "title": "Tacos al pastor",
  "media_url": "https://engine.../feed.jpg",
  "author_handle": "Explorador"
}
```

## Cómo renderizar los blocks

### 1. El canvas

- Dimensiones: **380×640px**
- La app debe escalar manteniendo la proporción (380/640 ≈ 0.59375)
- El efecto global define colores: `composicion.efectoGlobal` (retro, dark, clean, etc.)

### 2. Posición de cada bloque

```typescript
cellWidth = 380 / grid.cols   // grid.cols = 4 (default)
cellHeight = 640 / grid.rows  // grid.rows = 6 (default)

left = (block.gridPos.col - 1) * cellWidth + (block.gridPos.offsetX || 0)
top = (block.gridPos.row - 1) * cellHeight + (block.gridPos.offsetY || 0)
width = block.gridPos.colspan * cellWidth - 4
height = block.gridPos.rowspan * cellHeight - 4
```

### 3. Tipos de bloque y su render

| elementType | Render nativo | Touch behavior |
|---|---|---|
| `image` | ImageView con object-fit cover | Tap → fullscreen |
| `title`, `subtitle`, `body`, `text` | TextView con style (fontSize, color, fontFamily, textAlign) | Tap → zoom al frente |
| `price` | TextView con fontWeight bold | Tap → zoom al frente |
| `badge` | TextView con bgColor + borderRadius | Tap → zoom al frente |
| `rating` | TextView con estrellas (★) | Tap → zoom al frente |
| `watermark` | TextView opaco, no táctil | No interactivo |
| `separator` | View divisor | No interactivo |

## Efectos globales disponibles

```typescript
'retro' | 'dark' | 'clean' | 'vibrant' | 'minimal' 
| 'madera' | 'neon' | 'acuarela' | 'carbon' | 'pastel' | 'oceano'
```

Cada efecto define: `bgColor`, `bgGradient`, `fontFamily`, `textColor`, `accentColor`, `borderColor`

## Deploy actual

### Servidor
```
Host: 185.187.235.253
Usuario: root
Ruta: /opt/atlx-gt/
  ├── explorer-app/dist/    ← Frontend web (Vue build)
  ├── explorer-api/         ← Backend Node.js (Express, puerto 4101)
```

### Script de deploy
```bash
cd /Users/olokum68/AntojadosMx
export CONTABO_PASS='password'
bash atlx-gt/scripts/deploy-explorer.sh
```

### Para regenerar el APK
```bash
cd /Users/olokum68/AntojadosMx/explorer-app
pnpm run build
npx cap sync
cd android && ./gradlew assembleDebug
cp app/build/outputs/apk/debug/app-debug.apk dist/explorer-app.apk
```

## Checklist para Android/iOS

- [ ] Configurar HTTP client con base URL `https://explorer-api.antojadosmx.mx/api/v1/explorer`
- [ ] Implementar `GET /tenants/:tenantId/feed/:feedType` con paginación (limit, offset)
- [ ] Mapear JSON a modelos: `FeedItem`, `Composicion`, `Block`, `GridPosition`, `ElementStyle`
- [ ] Renderizar canvas 380×640 con efecto global
- [ ] Renderizar cada bloque según `elementType` con position absoluta
- [ ] Implementar tap en imagen → fullscreen con animación
- [ ] Implementar tap en otros blocks → zoom al frente
- [ ] Implementar tap fuera → regresa a vista normal
- [ ] Implementar swipe left/right para navegar entre items
- [ ] Implementar refresh (pull to refresh)
- [ ] Manejar error cuando no hay conexión
- [ ] Manejar empty state cuando no hay publicaciones
- [ ] Implementar el mismo visor para sponsor feed

## Documentos relacionados

| Documento | Ubicación |
|---|---|
| Contrato API completo | `explorer-app/docs/EXPLORER_APP_V1/04_API_CONTRACT.md` |
| Flujo de publicación | `explorer-app/docs/EXPLORER_APP_V1/03_FLUJO_PUBLICACION.md` |
| Integración feed (detalle técnico) | `apps-antojados/docs/APPS_ANTOJADOS_V2/03f_EXPLORER_FEED_INTEGRATION.md` |
| Changelog | `apps-antojados/docs/APPS_ANTOJADOS_V2/07_CHANGELOG.md` |