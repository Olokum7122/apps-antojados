<template>
  <article
    class="user-s1-base"
    :class="{ 'user-s1-base--expanded': expandedBlockId !== null }"
    @click.self="closeExpanded"
  >
    <!-- Canvas principal -->
    <div
      class="user-s1-base__canvas"
      :style="canvasStyle"
    >
      <!-- Carrusel de media (blocks image/video) -->
      <div
        v-if="mediaBlocks.length"
        class="user-s1-base__carrusel"
        :style="carruselStyle"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
      >
        <img
          v-if="currentSlide.mediaType === 'image'"
          :src="currentSlide.url"
          class="user-s1-base__carrusel-media"
          :style="carruselMediaStyle"
          loading="lazy"
          @click.stop=""
        />
        <video
          v-else
          :src="currentSlide.url"
          :poster="currentSlide.poster || undefined"
          class="user-s1-base__carrusel-media"
          muted
          playsinline
          autoplay
          loop
          @click.stop=""
        />

        <!-- Dots -->
        <div v-if="mediaBlocks.length > 1" class="user-s1-base__carrusel-dots">
          <span
            v-for="(_, i) in mediaBlocks"
            :key="i"
            class="user-s1-base__carrusel-dot"
            :class="{ 'user-s1-base__carrusel-dot--active': i === carruselIndex }"
            @click.stop="carruselIndex = i"
          />
        </div>

        <!-- Flechas -->
        <button
          v-if="mediaBlocks.length > 1"
          class="user-s1-base__carrusel-arrow user-s1-base__carrusel-arrow--left"
          @click.stop="carruselPrev"
        >‹</button>
        <button
          v-if="mediaBlocks.length > 1"
          class="user-s1-base__carrusel-arrow user-s1-base__carrusel-arrow--right"
          @click.stop="carruselNext"
        >›</button>
      </div>

      <!-- Bloques de contenido (no image/video) -->
      <div
        v-for="block in contentBlocks"
        :key="block.id"
        class="user-s1-base__block"
        :class="{
          'user-s1-base__block--expanded': expandedBlockId === block.id,
          'user-s1-base__block--hidden': expandedBlockId !== null && expandedBlockId !== block.id,
        }"
        :style="getBlockPosStyle(block)"
        @click.stop="onBlockTouch(block)"
      >
        <!-- Rating -->
        <div v-if="block.elementType === 'rating'" class="user-s1-base__rating" :style="getBlockContentStyle(block)">
          {{ renderStars(block.content) }}
        </div>

        <!-- Price -->
        <div v-else-if="block.elementType === 'price'" class="user-s1-base__price" :style="getBlockContentStyle(block)">
          {{ block.content }}
        </div>

        <!-- Badge -->
        <div v-else-if="block.elementType === 'badge'" class="user-s1-base__badge" :style="getBlockContentStyle(block)">
          {{ block.content }}
        </div>

        <!-- Separator -->
        <div v-else-if="block.elementType === 'separator'" class="user-s1-base__separator" />

        <!-- Watermark -->
        <div v-else-if="block.elementType === 'watermark'" class="user-s1-base__watermark" :style="getBlockContentStyle(block)">
          {{ block.content }}
        </div>

        <!-- Text content -->
        <div v-else class="user-s1-base__text" :style="getBlockContentStyle(block)">
          {{ block.content }}
        </div>
      </div>

      <!-- Botón VER publicación -->
      <button
        v-if="!expandedBlockId && mediaBlocks.length"
        class="user-s1-base__ver-btn"
        @click.stop="onVerClick"
      >
        Ver publicación
      </button>
    </div>

    <!-- Skeleton loading -->
    <div v-if="loading" class="user-s1-base__skeleton">
      <div class="user-s1-base__skeleton-media" />
      <div class="user-s1-base__skeleton-text" />
      <div class="user-s1-base__skeleton-text user-s1-base__skeleton-text--short" />
    </div>

    <!-- Error state -->
    <div v-if="error" class="user-s1-base__error">{{ error }}</div>
  </article>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type {
  DocumentPackage,
  Block,
  SponsorPost,
  MediaUrls,
  EfectoGlobalId,
} from '@antojados/api/types/document-package'
import { gridToStyle } from '@antojados/ui/services/document-package/gridPositionCalculator'
import { getCanvasStyle, getBlockStyle } from '@antojados/ui/services/document-package/styleApplier'
import { getTouchAction, canExpand } from '@antojados/ui/services/document-package/touchBehavior'
import { normalizeMediaUrl } from '@antojados/http/config/normalize-media-url'
import type { PostLayoutResult } from '@antojados/ui/services/document-package/postLayoutResolver'

// ─── Props ──────────────────────────────────────────────────────────────────
// Soporta DOS modos:
// 1. Modo DocumentPackage: recibe `post` con documentPackage.composicion.blocks
// 2. Modo legacy: recibe props planas (mediaUrl, mediaUrls, mediaType, etc.)

const props = defineProps({
  // Modo DocumentPackage (post con blocks)
  post: { type: Object as () => SponsorPost | null, default: null },
  // Modo legacy (props planas)
  idPost: { type: String, default: '' },
  idUser: { type: String, default: '' },
  authorHandle: { type: String, default: '' },
  channel: { type: String, default: '' },
  mediaUrl: { type: String, default: '' },
  mediaUrls: { type: Array as () => string[], default: () => [] },
  mediaType: { type: String as () => 'photo' | 'video', default: 'photo' },
  showChat: { type: Boolean, default: false },
  /** Layout Result opcional desde el Layout Resolver */
  layoutResult: { type: Object as () => PostLayoutResult | null, default: null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits<{
  (e: 'open-chat', postId: string, userId: string): void
  (e: 'open-s3', postId: string, mediaIndex: number, channel?: string): void
  (e: 'open-author', userId: string): void
}>()

// ─── Estado ─────────────────────────────────────────────────────────────────

const expandedBlockId = ref<string | null>(null)
const carruselIndex = ref(0)
const touchStartX = ref(0)
const touchEndX = ref(0)

// ─── Detectar modo ──────────────────────────────────────────────────────────
// Si hay blocks en documentPackage, usa modo grid.
// Si no, usa modo legacy con props planas.

const docPackage = computed<DocumentPackage | null>(() => props.post?.documentPackage || null)
const composicion = computed(() => docPackage.value?.composicion || null)
const allBlocks = computed<Block[]>(() => composicion.value?.blocks || [])

/** Tiene blocks del documentPackage? */
const hasDocBlocks = computed(() => allBlocks.value.length > 0)

/** Modo legacy: slides desde props planas */
const legacyMediaUrls = computed<string[]>(() => {
  if (props.mediaUrls.length) return props.mediaUrls
  if (props.mediaUrl) return [props.mediaUrl]
  return []
})

/** Bloques media (image/video) - desde blocks O legacy */
const mediaBlocks = computed<Block[]>(() => {
  if (hasDocBlocks.value) {
    return allBlocks.value.filter((b) => b.elementType === 'image' || b.elementType === 'video')
  }
  return []
})

/** Bloques de contenido */
const contentBlocks = computed<Block[]>(() => {
  if (hasDocBlocks.value) {
    return allBlocks.value.filter((b) => b.elementType !== 'image' && b.elementType !== 'video')
  }
  return []
})

// ─── Slides del carrusel ────────────────────────────────────────────────────

interface SlideItem {
  url: string
  poster: string | null
  mediaType: 'image' | 'video'
}

const VIDEO_EXTS = ['.mp4', '.mov', '.m3u8', '.webm', '.mkv']

/**
 * Determina si una URL es de video por su extensión.
 * Previene que <img> renderice src .mp4 → naturalWidth=0.
 */
function isVideoUrl(url: string): boolean {
  if (!url) return false
  const lower = url.toLowerCase()
  return VIDEO_EXTS.some((ext) => lower.includes(ext))
}

/**
 * Verifica si una string parece una URL válida para <img src> o <video src>.
 */
function isLikelyUrl(value: string): boolean {
  if (!value) return false
  return value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/')
}

const slides = computed<SlideItem[]>(() => {
  if (hasDocBlocks.value) {
    // Modo DocumentPackage: slides desde blocks
    return mediaBlocks.value.map((b) => {
      const rawUrl = b.mediaUrls?.fullUrl || b.mediaUrls?.feedUrl || ''
      const rawPoster = b.mediaUrls?.thumbUrl || null
      // Solo usar b.content si es una URL válida
      const resolvedUrl = rawUrl || (isLikelyUrl(b.content) ? b.content : '')
      const normalizedUrl = normalizeMediaUrl(resolvedUrl) || resolvedUrl
      return {
        url: normalizedUrl,
        poster: normalizeMediaUrl(rawPoster),
        // Determinar tipo por extensión de URL, no por elementType
        mediaType: isVideoUrl(normalizedUrl) ? 'video' : 'image',
      }
    })
  }
  // Modo legacy: slides desde props planas
  return legacyMediaUrls.value.map((url) => {
    const normalized = normalizeMediaUrl(url)
    const finalUrl = normalized || (isLikelyUrl(url) ? url : '')
    return {
      url: finalUrl,
      poster: null,
      // Determinar tipo por extensión de URL, no por prop mediaType
      mediaType: isVideoUrl(finalUrl) ? 'video' : (props.mediaType === 'video' ? 'video' : 'image'),
    }
  })
})

const currentSlide = computed<SlideItem>(() =>
  slides.value[carruselIndex.value] || slides.value[0] || { url: '', poster: null, mediaType: 'image' },
)

// ─── Cell size desde el Layout Resolver ──────────────────────────────────
// El Layout Resolver (postLayoutResolver.ts) entrega cellWidth/cellHeight.
// Podemos recibir layoutResult como prop opcional desde los pages.
// Fallback: portrait 380×640 con grid 24×40 para backward compatibility.
// Esto asegura que los componentes legacy sigan funcionando sin modificar API.

const gridCols = 24
const gridRows = 40
const canvasWidthDefault = 380
const canvasHeightDefault = 640

const cellWidth = computed(() => {
  if (props.layoutResult) return props.layoutResult.cellWidth
  return canvasWidthDefault / gridCols
})

const cellHeight = computed(() => {
  if (props.layoutResult) return props.layoutResult.cellHeight
  return canvasHeightDefault / gridRows
})

const canvasWidth = computed(() => {
  if (props.layoutResult) return props.layoutResult.canvasWidth
  return canvasWidthDefault
})

const canvasHeight = computed(() => {
  if (props.layoutResult) return props.layoutResult.canvasHeight
  return canvasHeightDefault
})

// ─── Estilos ────────────────────────────────────────────────────────────────
// Si hay blocks, usa canvas con grid (como SponsorS1Base).
// Si no, usa canvas simple con aspect-ratio (como UserS1Base legacy).

const hasLegacyMode = computed(() => !hasDocBlocks.value && legacyMediaUrls.value.length > 0)

const canvasStyle = computed(() => {
  if (hasDocBlocks.value) {
    const effectId = composicion.value?.efectoGlobal || 'retro'
    const base = getCanvasStyle(effectId as EfectoGlobalId)
    return {
      ...base,
      width: `${canvasWidth.value}px`,
      height: `${canvasHeight.value}px`,
      position: 'relative' as const,
      overflow: 'hidden',
      borderRadius: '12px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
      margin: '0 auto',
    }
  }
  // Modo legacy: carrusel simple
  return {
    position: 'relative' as const,
    width: '100%',
    maxWidth: '400px',
    borderRadius: '12px',
    overflow: 'hidden',
    background: '#000',
  }
})

/** Posición del carrusel */
const carruselStyle = computed(() => {
  if (!mediaBlocks.value.length && !hasLegacyMode.value) return {}
  if (hasDocBlocks.value && mediaBlocks.value.length) {
    return gridToStyle(mediaBlocks.value[0].gridPos, cellWidth.value, cellHeight.value)
  }
  // Modo legacy: aspect-ratio 9/16
  return {
    position: 'relative',
    width: '100%',
    aspectRatio: '9 / 16',
    overflow: 'hidden',
  }
})

const carruselMediaStyle = computed(() => ({
  width: '100%',
  height: '100%',
  objectFit: 'cover' as const,
  borderRadius: '8px',
}))

function getBlockPosStyle(block: Block): Record<string, string> {
  const pos = gridToStyle(block.gridPos, cellWidth.value, cellHeight.value)
  if (expandedBlockId.value === block.id) {
    return {
      position: 'absolute',
      left: '0',
      top: '0',
      width: `${canvasWidth.value}px`,
      height: `${canvasHeight.value}px`,
      zIndex: '10',
      overflow: 'auto',
      padding: '16px',
      boxSizing: 'border-box',
    }
  }
  return pos
}

function getBlockContentStyle(block: Block): Record<string, string> {
  return getBlockStyle(block, composicion.value?.efectoGlobal as EfectoGlobalId | null)
}

// ─── Interacciones ──────────────────────────────────────────────────────────

function onBlockTouch(block: Block) {
  const action = getTouchAction(block.elementType)
  if (action === 'carrusel') return
  if (canExpand(block.elementType)) {
    expandedBlockId.value = expandedBlockId.value === block.id ? null : block.id
  }
}

function closeExpanded() { expandedBlockId.value = null }

// ─── Carrusel ───────────────────────────────────────────────────────────────

function carruselNext() {
  carruselIndex.value = carruselIndex.value < slides.value.length - 1 ? carruselIndex.value + 1 : 0
}

function carruselPrev() {
  carruselIndex.value = carruselIndex.value > 0 ? carruselIndex.value - 1 : slides.value.length - 1
}

function onTouchStart(e: TouchEvent) { touchStartX.value = e.touches[0].clientX }
function onTouchMove(e: TouchEvent) { touchEndX.value = e.touches[0].clientX }
function onTouchEnd() {
  const diff = touchStartX.value - touchEndX.value
  if (Math.abs(diff) > 50) {
    diff > 0 ? carruselNext() : carruselPrev()
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function onVerClick() {
  const postId = props.post?.id || props.idPost || ''
  if (postId) emit('open-s3', postId, carruselIndex.value, props.channel)
}

function renderStars(v: string | number): string {
  const n = Math.min(5, Math.max(0, Number(v || 0)))
  return '★'.repeat(n) + '☆'.repeat(5 - n)
}
</script>

<style scoped>
.user-s1-base {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.user-s1-base--expanded {
  z-index: 50;
}

.user-s1-base__canvas {
  position: relative;
  flex-shrink: 0;
  border-radius: 12px;
  overflow: hidden;
}

/* Carrusel */
.user-s1-base__carrusel {
  position: absolute;
  overflow: hidden;
  border-radius: 8px;
  z-index: 1;
}

.user-s1-base__carrusel-media {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  user-select: none;
  -webkit-user-drag: none;
}

.user-s1-base__carrusel-dots {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
  z-index: 5;
}

.user-s1-base__carrusel-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition: background 150ms;
}

.user-s1-base__carrusel-dot--active {
  background: #fff;
}

.user-s1-base__carrusel-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.4);
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-s1-base__carrusel-arrow--left { left: 4px; }
.user-s1-base__carrusel-arrow--right { right: 4px; }

/* Bloques */
.user-s1-base__block {
  z-index: 2;
  cursor: pointer;
  transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  box-sizing: border-box;
}

.user-s1-base__block--hidden {
  opacity: 0;
  pointer-events: none;
}

.user-s1-base__block--expanded {
  z-index: 10;
  background: rgba(0, 0, 0, 0.85);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Elementos específicos */
.user-s1-base__text {
  overflow: hidden;
  word-break: break-word;
  white-space: pre-wrap;
  height: 100%;
  width: 100%;
  box-sizing: border-box;
}

.user-s1-base__price {
  font-weight: 700;
  display: flex;
  align-items: center;
  height: 100%;
  width: 100%;
}

.user-s1-base__rating {
  color: #f59e0b;
  font-size: 16px;
  display: flex;
  align-items: center;
  height: 100%;
  width: 100%;
}

.user-s1-base__badge {
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  display: inline-block;
  background: #7c3aed;
  color: #fff;
  height: auto;
  width: auto;
}

.user-s1-base__watermark {
  opacity: 0.5;
  font-size: 10px;
  text-align: right;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0,0,0,0.6);
  height: 100%;
  width: 100%;
}

.user-s1-base__separator {
  width: 100%;
  height: 2px;
  background: rgba(255, 255, 255, 0.2);
}

/* Botón VER */
.user-s1-base__ver-btn {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  padding: 8px 24px;
  border-radius: 999px;
  border: none;
  background: var(--app-primary, #7c3aed);
  color: #fff;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.user-s1-base__ver-btn:active {
  transform: translateX(-50%) scale(0.96);
}

/* Skeleton */
.user-s1-base__skeleton {
  width: 380px;
  height: 640px;
  border-radius: 12px;
  background: #1a1d2e;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-s1-base__skeleton-media {
  width: 100%;
  height: 60%;
  border-radius: 8px;
  background: linear-gradient(90deg, #2a2d3e 0%, #3a3d4e 50%, #2a2d3e 100%);
  background-size: 200% 100%;
  animation: skeletonPulse 1000ms ease-in-out infinite;
}

.user-s1-base__skeleton-text {
  width: 80%;
  height: 16px;
  border-radius: 4px;
  background: linear-gradient(90deg, #2a2d3e 0%, #3a3d4e 50%, #2a2d3e 100%);
  background-size: 200% 100%;
  animation: skeletonPulse 1000ms ease-in-out infinite;
}

.user-s1-base__skeleton-text--short { width: 40%; }

/* Error */
.user-s1-base__error {
  padding: 20px;
  text-align: center;
}
</style>
