<template>
  <div class="explorer-viewer" :style="viewerStyle">
    <!-- Canvas donde se renderizan los blocks -->
    <div
      ref="canvasRef"
      class="explorer-viewer__canvas"
      :style="canvasStyle"
      @click.self="onTapOutside"
    >
      <!-- Cada bloque se posiciona absoluto dentro del canvas -->
      <div
        v-for="block in blocks"
        :key="block.id || `${block.elementType}-${block.gridPos.col}-${block.gridPos.row}`"
        class="explorer-viewer__block"
        :class="[
          `explorer-viewer__block--${block.elementType}`,
          { 'explorer-viewer__block--interactive': isInteractive(block) },
          { 'explorer-viewer__block--zoomed': zoomedBlockId === (block.id || `${block.elementType}-${block.gridPos.col}-${block.gridPos.row}`) },
        ]"
        :style="getBlockStyle(block)"
        @click.stop="onBlockTap(block)"
      >
        <!-- Image -->
        <img
          v-if="block.elementType === 'image' && block.content"
          :src="block.content"
          :alt="block.content"
          class="explorer-viewer__image"
          :style="getImageStyle(block)"
          loading="lazy"
        />

        <!-- Video -->
        <video
          v-else-if="block.elementType === 'image' && isVideoUrl(block.content)"
          :src="block.content"
          class="explorer-viewer__image explorer-viewer__video"
          :style="getImageStyle(block)"
          muted
          loop
          playsinline
          autoplay
        />

        <!-- Title -->
        <div
          v-else-if="block.elementType === 'title'"
          class="explorer-viewer__title"
          :style="getTextStyle(block)"
        >
          {{ block.content }}
        </div>

        <!-- Subtitle -->
        <div
          v-else-if="block.elementType === 'subtitle'"
          class="explorer-viewer__subtitle"
          :style="getTextStyle(block)"
        >
          {{ block.content }}
        </div>

        <!-- Body / Text -->
        <div
          v-else-if="block.elementType === 'body' || block.elementType === 'text'"
          class="explorer-viewer__body"
          :style="getTextStyle(block)"
        >
          {{ block.content }}
        </div>

        <!-- Price -->
        <div
          v-else-if="block.elementType === 'price'"
          class="explorer-viewer__price"
          :style="getTextStyle(block)"
        >
          {{ block.content }}
        </div>

        <!-- Badge -->
        <div
          v-else-if="block.elementType === 'badge'"
          class="explorer-viewer__badge"
          :style="getBadgeStyle(block)"
        >
          {{ block.content }}
        </div>

        <!-- Rating -->
        <div
          v-else-if="block.elementType === 'rating'"
          class="explorer-viewer__rating"
          :style="getTextStyle(block)"
        >
          {{ renderStars(block.content) }}
        </div>

        <!-- Watermark -->
        <div
          v-else-if="block.elementType === 'watermark'"
          class="explorer-viewer__watermark"
          :style="getTextStyle(block)"
        >
          {{ block.content }}
        </div>

        <!-- Separator -->
        <hr
          v-else-if="block.elementType === 'separator'"
          class="explorer-viewer__separator"
          :style="getSeparatorStyle(block)"
        />

        <!-- Author -->
        <div
          v-else-if="block.elementType === 'author'"
          class="explorer-viewer__author"
          :style="getTextStyle(block)"
        >
          {{ block.content }}
        </div>

        <!-- Date -->
        <div
          v-else-if="block.elementType === 'date'"
          class="explorer-viewer__date"
          :style="getTextStyle(block)"
        >
          {{ block.content }}
        </div>

        <!-- Location -->
        <div
          v-else-if="block.elementType === 'location'"
          class="explorer-viewer__location"
          :style="getTextStyle(block)"
        >
          {{ block.content }}
        </div>
      </div>
    </div>

    <!-- Fullscreen overlay for images -->
    <teleport to="body">
      <div
        v-if="fullscreenImageUrl"
        class="explorer-viewer__fullscreen-overlay"
        @click.self="closeFullscreen"
      >
        <button class="explorer-viewer__fullscreen-close" @click="closeFullscreen">&times;</button>
        <img
          :src="fullscreenImageUrl"
          class="explorer-viewer__fullscreen-image"
          alt="fullscreen"
        />
      </div>
    </teleport>

    <!-- Zoom overlay for other blocks -->
    <teleport to="body">
      <div
        v-if="zoomedBlock"
        class="explorer-viewer__zoom-overlay"
        @click.self="closeZoom"
      >
        <button class="explorer-viewer__zoom-close" @click="closeZoom">&times;</button>
        <div class="explorer-viewer__zoom-content" :style="getZoomStyle(zoomedBlock)">
          <!-- Render the zoomed block content -->
          <img
            v-if="zoomedBlock.elementType === 'image'"
            :src="zoomedBlock.content"
            class="explorer-viewer__zoom-image"
          />
          <div
            v-else
            class="explorer-viewer__zoom-text"
            :style="getZoomTextStyle(zoomedBlock)"
          >
            {{ zoomedBlock.content }}
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  /** Objeto composicion con blocks, efectoGlobal, tipoPost, tipoContent */
  composicion: {
    type: Object,
    required: true,
  },
  /** Escala del canvas (0-1). Si no se provee, se auto-escala al contenedor */
  scale: {
    type: Number,
    default: null,
  },
  /** Ancho máximo del canvas en px */
  maxWidth: {
    type: Number,
    default: 380,
  },
})

const emit = defineEmits(['block-tap', 'fullscreen-open', 'fullscreen-close'])

const canvasRef = ref(null)
const fullscreenImageUrl = ref('')
const zoomedBlockId = ref(null)
const zoomedBlock = ref(null)

const CANVAS_WIDTH = 380
const CANVAS_HEIGHT = 640
const GRID_COLS = 4
const GRID_ROWS = 6

const efectoGlobal = computed(() => props.composicion?.efectoGlobal || 'retro')
const blocks = computed(() => props.composicion?.blocks || [])

const viewerStyle = computed(() => {
  const scale = props.scale || 1
  return {
    width: `${CANVAS_WIDTH * scale}px`,
    maxWidth: `${props.maxWidth}px`,
    margin: '0 auto',
  }
})

const canvasStyle = computed(() => {
  const efecto = getEfectoConfig(efectoGlobal.value)
  return {
    width: '100%',
    aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}`,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: efecto.bgColor,
    background: efecto.bgGradient || efecto.bgColor,
    fontFamily: efecto.fontFamily,
    color: efecto.textColor,
    border: `1px solid ${efecto.borderColor}`,
    borderRadius: '8px',
  }
})

function getEfectoConfig(efectoId) {
  const efectos = {
    retro: {
      bgColor: '#f5e6c8',
      bgGradient: 'linear-gradient(135deg, #f5e6c8, #e8d5a3)',
      fontFamily: '"Playfair Display", Georgia, serif',
      textColor: '#2d1f0b',
      accentColor: '#c0392b',
      borderColor: '#b8a07a',
    },
    dark: {
      bgColor: '#1a1a2e',
      bgGradient: 'linear-gradient(135deg, #1a1a2e, #16213e)',
      fontFamily: '"Inter", Arial, sans-serif',
      textColor: '#e0e0e0',
      accentColor: '#e94560',
      borderColor: '#0f3460',
    },
    clean: {
      bgColor: '#ffffff',
      fontFamily: '"Inter", Arial, sans-serif',
      textColor: '#333333',
      accentColor: '#3498db',
      borderColor: '#e0e0e0',
    },
    vibrant: {
      bgColor: '#ff6b6b',
      bgGradient: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
      fontFamily: '"Inter", Arial, sans-serif',
      textColor: '#ffffff',
      accentColor: '#feca57',
      borderColor: '#ff4757',
    },
    minimal: {
      bgColor: '#f8f9fa',
      fontFamily: '"Inter", Arial, sans-serif',
      textColor: '#212529',
      accentColor: '#000000',
      borderColor: '#dee2e6',
    },
    madera: {
      bgColor: '#8B6914',
      bgGradient: 'linear-gradient(135deg, #8B6914, #a0782c)',
      fontFamily: '"Playfair Display", Georgia, serif',
      textColor: '#f5e6c8',
      accentColor: '#ffd700',
      borderColor: '#6b4f12',
    },
    neon: {
      bgColor: '#0a0a23',
      bgGradient: 'linear-gradient(135deg, #0a0a23, #1a0a3e)',
      fontFamily: '"Inter", Arial, sans-serif',
      textColor: '#00ff88',
      accentColor: '#ff00ff',
      borderColor: '#00ff88',
    },
    acuarela: {
      bgColor: '#e8f4f8',
      bgGradient: 'linear-gradient(135deg, #e8f4f8, #d4eaf7)',
      fontFamily: '"Georgia", serif',
      textColor: '#2c3e50',
      accentColor: '#3498db',
      borderColor: '#a8d8ea',
    },
    carbon: {
      bgColor: '#2c2c2c',
      bgGradient: 'linear-gradient(135deg, #2c2c2c, #1a1a1a)',
      fontFamily: '"Inter", Arial, sans-serif',
      textColor: '#f0f0f0',
      accentColor: '#e74c3c',
      borderColor: '#444444',
    },
    pastel: {
      bgColor: '#fce4ec',
      bgGradient: 'linear-gradient(135deg, #fce4ec, #f3e5f5)',
      fontFamily: '"Inter", Arial, sans-serif',
      textColor: '#4a148c',
      accentColor: '#ec407a',
      borderColor: '#e1bee7',
    },
    oceano: {
      bgColor: '#006064',
      bgGradient: 'linear-gradient(135deg, #006064, #004d40)',
      fontFamily: '"Inter", Arial, sans-serif',
      textColor: '#e0f2f1',
      accentColor: '#4dd0e1',
      borderColor: '#00838f',
    },
  }
  return efectos[efectoId] || efectos.retro
}

function calcCellWidth() {
  return CANVAS_WIDTH / GRID_COLS
}

function calcCellHeight() {
  return CANVAS_HEIGHT / GRID_ROWS
}

function getBlockStyle(block) {
  const cellW = calcCellWidth()
  const cellH = calcCellHeight()
  const left = (block.gridPos.col - 1) * cellW + (block.gridPos.offsetX || 0)
  const top = (block.gridPos.row - 1) * cellH + (block.gridPos.offsetY || 0)
  const width = block.gridPos.colspan * cellW - 4
  const height = block.gridPos.rowspan * cellH - 4

  return {
    position: 'absolute',
    left: `${(left / CANVAS_WIDTH) * 100}%`,
    top: `${(top / CANVAS_HEIGHT) * 100}%`,
    width: `${(width / CANVAS_WIDTH) * 100}%`,
    height: `${(height / CANVAS_HEIGHT) * 100}%`,
    overflow: 'hidden',
  }
}

function getImageStyle(block) {
  const style = block.style || {}
  return {
    width: '100%',
    height: '100%',
    objectFit: style.objectFit || 'cover',
    borderRadius: style.borderRadius || '0px',
    filter: style.filter || 'none',
    opacity: style.opacity ?? 1,
    transform: getTransform(style),
  }
}

function getTextStyle(block) {
  const style = block.style || {}
  return {
    fontSize: style.fontSize ? `${style.fontSize}px` : '14px',
    fontWeight: style.fontWeight || 'normal',
    fontFamily: style.fontFamily || undefined,
    color: style.color || undefined,
    textAlign: style.textAlign || 'left',
    padding: style.padding || '4px',
    opacity: style.opacity ?? 1,
    transform: getTransform(style),
    textShadow: style.boxShadow || undefined,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: style.textAlign === 'center' ? 'center' : style.textAlign === 'right' ? 'flex-end' : 'flex-start',
    boxSizing: 'border-box',
    wordBreak: 'break-word',
  }
}

function getBadgeStyle(block) {
  const style = block.style || {}
  return {
    fontSize: style.fontSize ? `${style.fontSize}px` : '12px',
    fontWeight: style.fontWeight || 'bold',
    color: style.color || '#ffffff',
    backgroundColor: style.bgColor || '#e74c3c',
    borderRadius: style.borderRadius || '12px',
    padding: style.padding || '4px 12px',
    opacity: style.opacity ?? 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 'auto',
    width: 'auto',
    maxWidth: '100%',
    boxSizing: 'border-box',
  }
}

function getSeparatorStyle(block) {
  const style = block.style || {}
  return {
    border: 'none',
    borderTop: style.border || `1px solid ${style.color || '#cccccc'}`,
    opacity: style.opacity ?? 0.5,
    margin: '0',
    width: '100%',
  }
}

function getTransform(style) {
  const transforms = []
  if (style.scaleX !== undefined && style.scaleX !== 1) {
    transforms.push(`scaleX(${style.scaleX})`)
  }
  if (style.scaleY !== undefined && style.scaleY !== 1) {
    transforms.push(`scaleY(${style.scaleY})`)
  }
  if (style.rotate) {
    transforms.push(`rotate(${style.rotate}deg)`)
  }
  return transforms.length > 0 ? transforms.join(' ') : undefined
}

function isInteractive(block) {
  return !['watermark', 'separator'].includes(block.elementType)
}

function isVideoUrl(url) {
  if (!url) return false
  const videoExts = ['.mp4', '.webm', '.mov', '.avi', '.mkv']
  const lower = url.toLowerCase()
  return videoExts.some((ext) => lower.includes(ext))
}

function renderStars(rating) {
  const num = parseInt(String(rating), 10) || 0
  const fullStars = Math.min(Math.max(num, 0), 5)
  return '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars)
}

function onBlockTap(block) {
  if (!isInteractive(block)) return

  emit('block-tap', block)

  if (block.elementType === 'image') {
    fullscreenImageUrl.value = block.content
    emit('fullscreen-open', block)
  } else {
    zoomedBlockId.value = block.id || `${block.elementType}-${block.gridPos.col}-${block.gridPos.row}`
    zoomedBlock.value = block
  }
}

function closeFullscreen() {
  fullscreenImageUrl.value = ''
  emit('fullscreen-close')
}

function closeZoom() {
  zoomedBlockId.value = null
  zoomedBlock.value = null
}

function onTapOutside() {
  if (zoomedBlockId.value) {
    closeZoom()
  }
}

function getZoomStyle(block) {
  if (block.elementType === 'image') {
    return {
      maxWidth: '90vw',
      maxHeight: '90vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }
  }
  const style = block.style || {}
  return {
    fontSize: `${Math.min((style.fontSize || 24) * 1.5, 48)}px`,
    fontWeight: style.fontWeight || 'bold',
    color: style.color || '#ffffff',
    textAlign: style.textAlign || 'center',
    padding: '24px',
    maxWidth: '80vw',
    wordBreak: 'break-word',
  }
}

function getZoomTextStyle(block) {
  return getZoomStyle(block)
}
</script>

<style scoped>
.explorer-viewer {
  width: 100%;
  user-select: none;
  -webkit-user-select: none;
}

.explorer-viewer__canvas {
  position: relative;
  width: 100%;
  cursor: default;
}

.explorer-viewer__block {
  transition: transform 0.2s ease, opacity 0.2s ease;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
}

.explorer-viewer__block--interactive {
  cursor: pointer;
}

.explorer-viewer__block--interactive:hover {
  opacity: 0.9;
}

.explorer-viewer__block--zoomed {
  z-index: 10;
}

.explorer-viewer__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.explorer-viewer__video {
  object-fit: cover;
}

.explorer-viewer__title {
  font-size: 24px;
  font-weight: bold;
  line-height: 1.2;
}

.explorer-viewer__subtitle {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.3;
}

.explorer-viewer__body {
  font-size: 14px;
  line-height: 1.5;
}

.explorer-viewer__price {
  font-size: 18px;
  font-weight: bold;
  color: #ffd700;
}

.explorer-viewer__badge {
  font-size: 12px;
  font-weight: bold;
  border-radius: 12px;
  white-space: nowrap;
}

.explorer-viewer__rating {
  font-size: 16px;
  letter-spacing: 2px;
}

.explorer-viewer__watermark {
  font-size: 10px;
  opacity: 0.3;
  pointer-events: none;
}

.explorer-viewer__separator {
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.3);
  width: 100%;
  margin: 0;
}

.explorer-viewer__author,
.explorer-viewer__date,
.explorer-viewer__location {
  font-size: 12px;
  opacity: 0.8;
}

/* Fullscreen overlay */
.explorer-viewer__fullscreen-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.2s ease;
}

.explorer-viewer__fullscreen-image {
  max-width: 95vw;
  max-height: 95vh;
  object-fit: contain;
  border-radius: 4px;
}

.explorer-viewer__fullscreen-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  border-radius: 50%;
  color: white;
  font-size: 28px;
  cursor: pointer;
  z-index: 10001;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.explorer-viewer__fullscreen-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Zoom overlay */
.explorer-viewer__zoom-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.2s ease;
}

.explorer-viewer__zoom-content {
  display: flex;
  align-items: center;
  justify-content: center;
}

.explorer-viewer__zoom-image {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
}

.explorer-viewer__zoom-text {
  color: white;
}

.explorer-viewer__zoom-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  border-radius: 50%;
  color: white;
  font-size: 28px;
  cursor: pointer;
  z-index: 10001;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.explorer-viewer__zoom-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>