<template>
  <article
    class="sponsor-s1-base"
    :class="{ 'sponsor-s1-base--expanded': expandedBlockId !== null }"
    @click.self="closeExpanded"
  >
    <!-- Canvas principal -->
    <div
      class="sponsor-s1-base__canvas"
      :style="canvasStyle"
    >
      <!-- Carrusel de media (blocks image/video) -->
      <div
        v-if="mediaBlocks.length"
        class="sponsor-s1-base__carrusel"
        :style="carruselStyle"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
      >
        <img
          v-if="currentSlide.mediaType === 'image'"
          :src="currentSlide.url"
          class="sponsor-s1-base__carrusel-media"
          :style="carruselMediaStyle"
          loading="lazy"
          @click.stop=""
        />
        <video
          v-else
          :src="currentSlide.url"
          :poster="currentSlide.poster"
          class="sponsor-s1-base__carrusel-media"
          muted
          playsinline
          autoplay
          loop
          @click.stop=""
        />

        <!-- Dots -->
        <div v-if="mediaBlocks.length > 1" class="sponsor-s1-base__carrusel-dots">
          <span
            v-for="(_, i) in mediaBlocks"
            :key="i"
            class="sponsor-s1-base__carrusel-dot"
            :class="{ 'sponsor-s1-base__carrusel-dot--active': i === carruselIndex }"
            @click.stop="carruselIndex = i"
          />
        </div>

        <!-- Flechas -->
        <button
          v-if="mediaBlocks.length > 1"
          class="sponsor-s1-base__carrusel-arrow sponsor-s1-base__carrusel-arrow--left"
          @click.stop="carruselPrev"
        >‹</button>
        <button
          v-if="mediaBlocks.length > 1"
          class="sponsor-s1-base__carrusel-arrow sponsor-s1-base__carrusel-arrow--right"
          @click.stop="carruselNext"
        >›</button>
      </div>

      <!-- Bloques de contenido (no image/video) -->
      <div
        v-for="block in contentBlocks"
        :key="block.id"
        class="sponsor-s1-base__block"
        :class="{
          'sponsor-s1-base__block--expanded': expandedBlockId === block.id,
          'sponsor-s1-base__block--hidden': expandedBlockId !== null && expandedBlockId !== block.id,
        }"
        :style="getBlockPosStyle(block)"
        @click.stop="onBlockTouch(block)"
      >
        <!-- Rating -->
        <div v-if="block.elementType === 'rating'" class="sponsor-s1-base__rating" :style="getBlockContentStyle(block)">
          {{ renderStars(block.content) }}
        </div>

        <!-- Price -->
        <div v-else-if="block.elementType === 'price'" class="sponsor-s1-base__price" :style="getBlockContentStyle(block)">
          {{ block.content }}
        </div>

        <!-- Badge -->
        <div v-else-if="block.elementType === 'badge'" class="sponsor-s1-base__badge" :style="getBlockContentStyle(block)">
          {{ block.content }}
        </div>

        <!-- Separator -->
        <div v-else-if="block.elementType === 'separator'" class="sponsor-s1-base__separator" />

        <!-- Watermark -->
        <div v-else-if="block.elementType === 'watermark'" class="sponsor-s1-base__watermark" :style="getBlockContentStyle(block)">
          {{ block.content }}
        </div>

        <!-- Text content -->
        <div v-else class="sponsor-s1-base__text" :style="getBlockContentStyle(block)">
          {{ block.content }}
        </div>
      </div>

      <!-- Botón VER Sponsor (solo visible en vista normal) -->
      <button
        v-if="!expandedBlockId && sponsorId"
        class="sponsor-s1-base__ver-btn"
        @click.stop="$emit('ver-sponsor', sponsorId)"
      >
        VER Sponsor
      </button>
    </div>

    <!-- Skeleton loading -->
    <div v-if="loading" class="sponsor-s1-base__skeleton">
      <div class="sponsor-s1-base__skeleton-media" />
      <div class="sponsor-s1-base__skeleton-text" />
      <div class="sponsor-s1-base__skeleton-text sponsor-s1-base__skeleton-text--short" />
    </div>

    <!-- Error state -->
    <div v-if="error" class="sponsor-s1-base__error">{{ error }}</div>
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
import { GRID } from '@antojados/api/types/document-package'
import { gridToStyle } from '@antojados/ui/services/document-package/gridPositionCalculator'
import { getCanvasStyle, getBlockStyle } from '@antojados/ui/services/document-package/styleApplier'
import { getTouchAction, canExpand } from '@antojados/ui/services/document-package/touchBehavior'

// ─── Props ──────────────────────────────────────────────────────────────────

const props = defineProps({
  /** Sponsor post completo (documentPackage + mediaPackage) */
  post: {
    type: Object as () => SponsorPost | null,
    default: null,
  },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  /** Si tiene sponsorId, muestra botón VER */
  sponsorId: { type: String, default: '' },
})

const emit = defineEmits<{
  (e: 'ver-sponsor', sponsorId: string): void
  (e: 'open-s3', postId: string, mediaIndex: number): void
}>()

// ─── Estado ─────────────────────────────────────────────────────────────────

const expandedBlockId = ref<string | null>(null)
const carruselIndex = ref(0)
const touchStartX = ref(0)
const touchEndX = ref(0)

// ─── Extraer datos del post ─────────────────────────────────────────────────

const docPackage = computed<DocumentPackage | null>(() => props.post?.documentPackage || null)
const composicion = computed(() => docPackage.value?.composicion || null)
const allBlocks = computed<Block[]>(() => composicion.value?.blocks || [])

/** Bloques media (image/video) para carrusel */
const mediaBlocks = computed<Block[]>(() =>
  allBlocks.value.filter((b) => b.elementType === 'image' || b.elementType === 'video'),
)

/** Bloques de contenido */
const contentBlocks = computed<Block[]>(() =>
  allBlocks.value.filter((b) => b.elementType !== 'image' && b.elementType !== 'video'),
)

// ─── Slides del carrusel ────────────────────────────────────────────────────

interface SlideItem {
  url: string
  poster: string | null
  mediaType: 'image' | 'video'
}

const slides = computed<SlideItem[]>(() => {
  return mediaBlocks.value.map((b) => {
    // Usar fullUrl si está disponible, sino content como fallback
    const url = b.mediaUrls?.fullUrl || b.mediaUrls?.feedUrl || b.content || ''
    const poster = b.mediaUrls?.thumbUrl || null
    return {
      url,
      poster,
      mediaType: b.elementType === 'video' ? 'video' : 'image',
    }
  })
})

const currentSlide = computed<SlideItem>(() => slides.value[carruselIndex.value] || slides.value[0] || { url: '', poster: null, mediaType: 'image' })

// ─── Estilos ────────────────────────────────────────────────────────────────

const canvasStyle = computed(() => {
  const effectId = composicion.value?.efectoGlobal || 'retro'
  const base = getCanvasStyle(effectId as EfectoGlobalId)

  return {
    ...base,
    width: `${GRID.CANVAS_WIDTH}px`,
    height: `${GRID.CANVAS_HEIGHT}px`,
    position: 'relative' as const,
    overflow: 'hidden',
    borderRadius: '12px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
    margin: '0 auto',
  }
})

/** Posición del carrusel = primer bloque media */
const carruselStyle = computed(() => {
  if (!mediaBlocks.value.length) return {}
  return gridToStyle(mediaBlocks.value[0].gridPos)
})

const carruselMediaStyle = computed(() => ({
  width: '100%',
  height: '100%',
  objectFit: 'cover' as const,
  borderRadius: '8px',
}))

function getBlockPosStyle(block: Block): Record<string, string> {
  const pos = gridToStyle(block.gridPos)
  if (expandedBlockId.value === block.id) {
    return {
      position: 'absolute',
      left: '0',
      top: '0',
      width: `${GRID.CANVAS_WIDTH}px`,
      height: `${GRID.CANVAS_HEIGHT}px`,
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

  if (action === 'carrusel') {
    // El carrusel ya maneja su navegación
    return
  }

  if (canExpand(block.elementType)) {
    if (expandedBlockId.value === block.id) {
      closeExpanded()
    } else {
      expandedBlockId.value = block.id
    }
  }
}

function closeExpanded() {
  expandedBlockId.value = null
}

// ─── Carrusel ───────────────────────────────────────────────────────────────

function carruselNext() {
  if (carruselIndex.value < slides.value.length - 1) {
    carruselIndex.value++
  } else {
    carruselIndex.value = 0
  }
}

function carruselPrev() {
  if (carruselIndex.value > 0) {
    carruselIndex.value--
  } else {
    carruselIndex.value = slides.value.length - 1
  }
}

function onTouchStart(e: TouchEvent) {
  touchStartX.value = e.touches[0].clientX
}

function onTouchMove(e: TouchEvent) {
  touchEndX.value = e.touches[0].clientX
}

function onTouchEnd() {
  const diff = touchStartX.value - touchEndX.value
  if (Math.abs(diff) > 50) {
    if (diff > 0) carruselNext()
    else carruselPrev()
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function renderStars(v: string | number): string {
  const n = Math.min(5, Math.max(0, Number(v || 0)))
  return '★'.repeat(n) + '☆'.repeat(5 - n)
}
</script>

<style scoped>
.sponsor-s1-base {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.sponsor-s1-base--expanded {
  z-index: 50;
}

.sponsor-s1-base__canvas {
  position: relative;
  flex-shrink: 0;
  border-radius: 12px;
  overflow: hidden;
}

/* Carrusel */
.sponsor-s1-base__carrusel {
  position: absolute;
  overflow: hidden;
  border-radius: 8px;
  z-index: 1;
}

.sponsor-s1-base__carrusel-media {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  user-select: none;
  -webkit-user-drag: none;
}

.sponsor-s1-base__carrusel-dots {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
  z-index: 5;
}

.sponsor-s1-base__carrusel-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition: background 150ms;
}

.sponsor-s1-base__carrusel-dot--active {
  background: #fff;
}

.sponsor-s1-base__carrusel-arrow {
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

.sponsor-s1-base__carrusel-arrow--left { left: 4px; }
.sponsor-s1-base__carrusel-arrow--right { right: 4px; }

/* Bloques */
.sponsor-s1-base__block {
  z-index: 2;
  cursor: pointer;
  transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  box-sizing: border-box;
}

.sponsor-s1-base__block--hidden {
  opacity: 0;
  pointer-events: none;
}

.sponsor-s1-base__block--expanded {
  z-index: 10;
  background: rgba(0, 0, 0, 0.85);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Elementos específicos */
.sponsor-s1-base__text {
  overflow: hidden;
  word-break: break-word;
  white-space: pre-wrap;
  height: 100%;
  width: 100%;
  box-sizing: border-box;
}

.sponsor-s1-base__price {
  font-weight: 700;
  display: flex;
  align-items: center;
  height: 100%;
  width: 100%;
}

.sponsor-s1-base__rating {
  color: #f59e0b;
  font-size: 16px;
  display: flex;
  align-items: center;
  height: 100%;
  width: 100%;
}

.sponsor-s1-base__badge {
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  display: inline-block;
  background: #7c3aed;
  color: #fff;
  height: auto;
  width: auto;
}

.sponsor-s1-base__watermark {
  opacity: 0.5;
  font-size: 10px;
  text-align: right;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0,0,0,0.6);
  height: 100%;
  width: 100%;
}

.sponsor-s1-base__separator {
  width: 100%;
  height: 2px;
  background: rgba(255, 255, 255, 0.2);
}

/* Botón VER */
.sponsor-s1-base__ver-btn {
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

.sponsor-s1-base__ver-btn:active {
  transform: translateX(-50%) scale(0.96);
}

/* Skeleton */
.sponsor-s1-base__skeleton {
  width: 380px;
  height: 640px;
  border-radius: 12px;
  background: #1a1d2e;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sponsor-s1-base__skeleton-media {
  width: 100%;
  height: 60%;
  border-radius: 8px;
  background: linear-gradient(90deg, #2a2d3e 0%, #3a3d4e 50%, #2a2d3e 100%);
  background-size: 200% 100%;
  animation: skeletonPulse 1000ms ease-in-out infinite;
}

.sponsor-s1-base__skeleton-text {
  width: 80%;
  height: 16px;
  border-radius: 4px;
  background: linear-gradient(90deg, #2a2d3e 0%, #3a3d4e 50%, #2a2d3e 100%);
  background-size: 200% 100%;
  animation: skeletonPulse 1000ms ease-in-out infinite;
}

.sponsor-s1-base__skeleton-text--short { width: 40%; }

/* Error */
.sponsor-s1-base__error {
  padding: 20px;
  text-align: center;
  color: #fca5a5;
  font-size: 13px;
}

@keyframes skeletonPulse {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
