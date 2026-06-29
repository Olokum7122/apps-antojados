<template>
  <div :class="skeletonClass" role="status" aria-label="Cargando feed">
    <div
      v-for="i in skeletonCount"
      :key="i"
      :class="tileClass(i)"
      :style="{ animationDelay: `${(i - 1) * 60}ms` }"
    >
      <div :class="classes.thumb" />
      <div :class="classes.textGroup">
        <div :class="classes.titleBar" />
        <div :class="classes.subtitleBar" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  /**
   * Variant del grid skeleton: 'masonry' (social), 'uniform' (biz)
   */
  variant: {
    type: String,
    default: 'masonry',
    validator: (value) => ['masonry', 'uniform'].includes(value),
  },
  /** Cantidad de skeleton tiles a mostrar */
  skeletonCount: {
    type: Number,
    default: 8,
  },
})

const classes = {
  root: 'feed-skeleton-grid',
  cell: 'feed-skeleton-grid__cell',
  thumb: 'feed-skeleton-grid__thumb',
  textGroup: 'feed-skeleton-grid__text-group',
  titleBar: 'feed-skeleton-grid__title-bar',
  subtitleBar: 'feed-skeleton-grid__subtitle-bar',
}

const skeletonClass = computed(() => [
  classes.root,
  `feed-skeleton-grid--${props.variant}`,
])

function tileClass(index) {
  const mod = index % 10
  let size = 'square'
  if (props.variant === 'masonry') {
    if (mod === 0 || mod === 1) size = 'vertical'
    else if (mod === 2 || mod === 3) size = 'medium'
    else if (mod === 4) size = 'wide'
    else if (mod === 5 || mod === 6) size = 'square'
    else if (mod === 7 || mod === 8) size = 'medium'
    else size = 'wide'
  }
  return [classes.cell, `feed-skeleton-grid__cell--${size}`]
}
</script>

<style scoped>
.feed-skeleton-grid {
  display: grid;
  gap: 4px;
  width: 100%;
  padding: 0;
}

/* Masonry variant — 3 columns */
.feed-skeleton-grid--masonry {
  grid-template-columns: repeat(3, 1fr);
}

/* Uniform variant — 2 columns */
.feed-skeleton-grid--uniform {
  grid-template-columns: repeat(2, 1fr);
}

.feed-skeleton-grid__cell {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  animation: feed-skeleton-pulse 1.6s ease-in-out infinite;
}

.feed-skeleton-grid__cell--square {
  aspect-ratio: 1 / 1;
  grid-row: span 1;
  grid-column: span 1;
}

.feed-skeleton-grid__cell--vertical {
  aspect-ratio: 3 / 4;
  grid-row: span 2;
  grid-column: span 1;
}

.feed-skeleton-grid__cell--medium {
  aspect-ratio: 4 / 3;
  grid-row: span 1;
  grid-column: span 1;
}

.feed-skeleton-grid__cell--wide {
  aspect-ratio: 16 / 9;
  grid-row: span 1;
  grid-column: span 2;
}

.feed-skeleton-grid__thumb {
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.04) 0%,
    rgba(255, 255, 255, 0.10) 50%,
    rgba(255, 255, 255, 0.04) 100%
  );
  position: absolute;
  inset: 0;
}

.feed-skeleton-grid__text-group {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px 10px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.feed-skeleton-grid__title-bar {
  height: 10px;
  width: 65%;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.12);
}

.feed-skeleton-grid__subtitle-bar {
  height: 8px;
  width: 40%;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
}

@keyframes feed-skeleton-pulse {
  0% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.6;
  }
}
</style>
