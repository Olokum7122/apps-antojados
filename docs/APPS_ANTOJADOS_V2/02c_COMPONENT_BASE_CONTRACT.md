# 02c — Component Base Contract

Version: 1.0.0
Status: baseline
Applies to: shared/ui/base/

## 1. Proposito

Define los componentes base reutilizables de la UI. Estos componentes son
los bloques de construccion para todas las vistas de la app.

## 2. Lista de Componentes Base

| Componente | Proposito | Props clave |
|---|---|---|
| AppEmptyState.vue | Estado vacio (sin datos, sin resultados) | message, icon, actionLabel |
| AppPanel.vue | Panel contenedor con header y body | title, subtitle, loading |
| ButtonBarBase.vue | Barra de botones horizontal | buttons[], align |
| ButtonBase.vue | Boton base reutilizable | label, icon, color, disabled, loading |
| CommentsInputBase.vue | Input de comentarios con avatar | placeholder, onSubmit |
| EntityGridBase.vue | Grid de entidades (negocios, lugares) | items[], columns |
| FeedDetailColumnBase.vue | Columna de detalle de feed | post, actions |
| FeedFilterBarBase.vue | Barra de filtros para feeds | filters[], activeFilter |
| FeedFlowOrchestratorBase.vue | Orquestador de flujo de feed (multi-step) | steps[], activeStep |
| FeedFullscreenBase.vue | Vista fullscreen de post con media | post, onClose |
| FeedGalleryBase.vue | Galeria de media en grid | media[] |
| FeedPostBase.vue | Post base con autor, media, acciones | post, actions |
| FeedPostCard.vue | Tarjeta de post en feed | post, compact |
| FieldEditorBase.vue | Editor de campos con validacion | field, rules |
| FullscreenVideoControlsBase.vue | Controles de video en fullscreen | videoRef, autoplay |
| MediaGridCellBase.vue | Celda individual de grid de media | media, aspectRatio |
| PostActionRailBase.vue | Rail de acciones de post (like, comment, share) | post, onAction |
| PublishFabBase.vue | FAB de publicacion | channel, visible, enabled, onClick |
| TabBarComponentBase.vue | Barra de tabs (nivel componente) | tabs[], activeTab |
| TabBarSubDimensionBase.vue | Barra de tabs con metadata de dimension | tabs[], dimension |
| TopBarTabsBase.vue | Tabs en la barra superior | tabs[], modelValue |

## 3. Contrato General

Cada componente base debe:

1. **Ser puro** — no debe llamar servicios API directamente
2. **Recibir datos via props** — no debe obtener datos por si mismo
3. **Emitir eventos** — las acciones se comunican via $emit
4. **No tener estado global** — son componentes presentacionales
5. **Soportar slots** — para personalizacion cuando sea necesario
6. **Usar CSS scoped** — no contaminar estilos globales
7. **Usar variables CSS del theme** — colores y espaciados via variables

## 4. Patron de Props

```typescript
// Componente base ideal
interface Props {
  // Datos
  items?: SomeType[]
  modelValue?: SomeType

  // Configuracion
  loading?: boolean
  disabled?: boolean
  compact?: boolean

  // Apariencia
  color?: string
  size?: 'sm' | 'md' | 'lg'
}

// Eventos
interface Emits {
  (e: 'update:modelValue', value: SomeType): void
  (e: 'action', action: { type: string; payload: unknown }): void
  (e: 'click', event: MouseEvent): void
}
```

## 5. Componentes de Feed (los mas usados)

### FeedPostCard.vue

Renderiza un post individual en el feed.

```vue
<FeedPostCard
  :post="post"
  :compact="false"
  @action="handleAction"
  @click="goToDetail"
/>
```

Slots: `header`, `media`, `footer`, `actions`

### FeedGalleryBase.vue

Renderiza una galeria de media en formato grid.

```vue
<FeedGalleryBase
  :media="mediaList"
  :columns="3"
  @select="openFullscreen"
/>
```

### FeedFullscreenBase.vue

Vista fullscreen para un post con su media.

```vue
<FeedFullscreenBase
  :post="post"
  @close="closeFullscreen"
  @action="handleAction"
/>
```

## 6. Componentes de Navegacion

### TabBarComponentBase.vue

Barra de tabs a nivel componente. Usado para sub-navegacion dentro de areas.

```vue
<TabBarComponentBase
  :tabs="tabs"
  :active-tab="currentTab"
  @update:active-tab="onTabChange"
/>
```

### TopBarTabsBase.vue

Tabs en la barra superior del layout. Diferente a los tabs del footer.

## 7. Componentes de Estado

### AppEmptyState.vue

Se muestra cuando no hay datos que renderizar.

```vue
<AppEmptyState
  message="No hay publicaciones en esta zona"
  icon="photo_library"
  action-label="Publicar ahora"
  @action="goToPublish"
/>
```

### AppPanel.vue

Contenedor con header, body y loading state.

```vue
<AppPanel
  title="Vas Ir"
  subtitle="Lugares cerca de ti"
  :loading="isLoading"
>
  <template #body>
    <!-- contenido -->
  </template>
</AppPanel>
```

## 8. Reglas No Negociables

- Los componentes base NO deben importar servicios API
- Los componentes base NO deben usar `useRouter` o `useRoute` (recibir rutas via props)
- Los componentes base NO deben tener estado reactivo que persista fuera del ciclo del componente
- Los componentes base deben usar TypeScript para definir props y emits
- Los nombres de props deben estar en camelCase (nunca kebab-case en la definicion)
- Los componentes base deben tener `scoped` styles (no leak global)

## 9. Prohibiciones

- No modificar un componente base para un caso especifico (crear nuevo componente o extension)
- No pasar props no documentadas al componente base
- No usar `$attrs` para pasar props no declaradas
- No tener logica de negocio en los componentes base
- No usar store/pinia/vuex en componentes base

## 10. ⚠️ Deuda Tecnica Identificada

- Algunos componentes base (FeedPostCard, FeedGalleryBase) importan servicios
  directamente, violando el principio de pureza.
  Propuesta: refactorizar para recibir datos via props y emitir eventos.
- No hay tests unitarios para los componentes base.
- `FeedFlowOrchestratorBase.vue` es el componente mas complejo y mezcla
  orquestacion de flujo con presentacion. Deberia separarse en
  orquestador + presentador.
- Varios componentes base tienen props sin tipar (any).
- No hay documentacion JSDoc en los componentes base.

## 11. Historial

| Version | Fecha | Cambio |
|---|---|---|
| 1.0.0 | 28/06/2026 | Contrato inicial. 21 componentes base documentados |
