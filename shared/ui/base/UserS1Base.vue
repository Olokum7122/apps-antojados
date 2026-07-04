<template>
  <article
    class="user-s1-base"
    @click.self="closeExpanded"
  >
    <!-- Full media (S1 simplificado) -->
    <div class="user-s1-base__canvas">
      <!-- Carrusel de media -->
      <div
        v-if="mediaBlocks.length"
        class="user-s1-base__carrusel"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
      >
        <img
          v-if="currentSlide.mediaType === 'image'"
          :src="currentSlide.url"
          class="user-s1-base__media"
          loading="lazy"
          @click.stop="$emit('open-s3', idPost, carruselIndex, props.channel)"
        />
        <video
          v-else
          :src="currentSlide.url"
          :poster="currentSlide.poster || undefined"
          class="user-s1-base__media"
          muted
          playsinline
          autoplay
          loop
          @click.stop="$emit('open-s3', idPost, carruselIndex, props.channel)"
        />

        <!-- Dots -->
        <div v-if="mediaBlocks.length > 1" class="user-s1-base__dots">
          <span
            v-for="(_, i) in mediaBlocks"
            :key="i"
            class="user-s1-base__dot"
            :class="{ 'user-s1-base__dot--active': i === carruselIndex }"
            @click.stop="carruselIndex = i"
          />
        </div>
      </div>

      <!-- Overlay inferior con autor + botón chat -->
      <div class="user-s1-base__footer">
        <div class="user-s1-base__author">
          <div class="user-s1-base__avatar">{{ authorLetter }}</div>
          <span class="user-s1-base__handle">@{{ authorHandle }}</span>
        </div>
        <button
          v-if="showChat"
          class="user-s1-base__chat-btn"
          @click.stop="$emit('open-chat', idPost, idUser)"
        >
          💬 Chat
        </button>
      </div>
    </div>

    <!-- Skeleton -->
    <div v-if="loading" class="user-s1-base__skeleton">
      <div class="user-s1-base__skeleton-media" />
    </div>

    <!-- Error -->
    <div v-if="error" class="user-s1-base__error">{{ error }}</div>
  </article>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface MediaSlide {
  url: string
  poster: string | null
  mediaType: string
}

const props = defineProps({
  idPost: { type: String, default: '' },
  idUser: { type: String, default: '' },
  authorHandle: { type: String, default: '' },
  channel: { type: String, default: '' },
  /** URLs media del post */
  mediaUrls: { type: Array as () => string[], default: () => [] },
  /** Primer url como fallback */
  mediaUrl: { type: String, default: '' },
  mediaType: { type: String as () => 'photo' | 'video', default: 'photo' },
  showChat: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits<{
  (e: 'open-chat', postId: string, userId: string): void
  (e: 'open-s3', postId: string, mediaIndex: number, channel?: string): void
}>()

const carruselIndex = ref(0)
const touchStartX = ref(0)
const touchEndX = ref(0)

const allMedia = computed<string[]>(() => {
  if (props.mediaUrls.length) return props.mediaUrls
  if (props.mediaUrl) return [props.mediaUrl]
  return []
})

const slides = computed<MediaSlide[]>(() =>
  allMedia.value.map((url) => ({
    url: url,
    poster: null,
    mediaType: props.mediaType || 'photo',
  }))
)

const mediaBlocks = computed(() => slides.value)
const currentSlide = computed(() => slides.value[carruselIndex.value] || slides.value[0] || { url: '', poster: null, mediaType: 'image' })
const authorLetter = computed(() => (props.authorHandle?.charAt(0) || '?').toUpperCase())

function carruselNext() {
  if (carruselIndex.value < slides.value.length - 1) carruselIndex.value++
  else carruselIndex.value = 0
}

function carruselPrev() {
  if (carruselIndex.value > 0) carruselIndex.value--
  else carruselIndex.value = slides.value.length - 1
}

function onTouchStart(e: TouchEvent) { touchStartX.value = e.touches[0].clientX }
function onTouchMove(e: TouchEvent) { touchEndX.value = e.touches[0].clientX }
function onTouchEnd() {
  const diff = touchStartX.value - touchEndX.value
  if (Math.abs(diff) > 50) {
    if (diff > 0) carruselNext()
    else carruselPrev()
  }
}

function closeExpanded() { carruselIndex.value = 0 }
</script>

<style scoped>
.user-s1-base {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.user-s1-base__canvas {
  position: relative;
  width: 100%;
  max-width: 400px;
  border-radius: 12px;
  overflow: hidden;
  background: #000;
}

.user-s1-base__carrusel {
  position: relative;
  width: 100%;
  aspect-ratio: 9 / 16;
  overflow: hidden;
}

.user-s1-base__media {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  cursor: pointer;
}

.user-s1-base__dots {
  position: absolute;
  bottom: 60px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
  z-index: 5;
}

.user-s1-base__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  cursor: pointer;
}

.user-s1-base__dot--active { background: #fff; }

.user-s1-base__footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
  z-index: 4;
}

.user-s1-base__author {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-s1-base__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--app-primary, #7c3aed);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
}

.user-s1-base__handle {
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  text-shadow: 0 1px 4px rgba(0,0,0,0.6);
}

.user-s1-base__chat-btn {
  padding: 8px 18px;
  border-radius: 999px;
  border: none;
  background: var(--app-primary, #7c3aed);
  color: #fff;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.user-s1-base__skeleton {
  width: 100%;
  max-width: 400px;
  aspect-ratio: 9 / 16;
  border-radius: 12px;
  background: #1a1d2e;
}

.user-s1-base__skeleton-media {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  background: linear-gradient(90deg, #2a2d3e 0%, #3a3d4e 50%, #2a2d3e 100%);
  background-size: 200% 100%;
  animation: skeletonPulse 1000ms ease-in-out infinite;
}

.user-s1-base__error {
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