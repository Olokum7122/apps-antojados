<template>
  <article class="feed-explorer-card" :style="cardStyle">
    <!-- Header común -->
    <header v-if="showHeader" class="feed-explorer-card__header">
      <div class="feed-explorer-card__avatar">{{ avatarLetter }}</div>
      <div class="feed-explorer-card__meta">
        <span class="feed-explorer-card__author">@{{ authorLabel }}</span>
        <span class="feed-explorer-card__feed-type">{{ feedTypeLabel }}</span>
      </div>
    </header>

    <!-- Render condicional: Explorer Post (con composicion) vs Legacy -->
    <explorer-post-viewer
      v-if="hasComposicion"
      :composicion="post.composicion"
      :scale="1"
      :max-width="maxWidth"
      class="feed-explorer-card__viewer"
      @block-tap="onBlockTap"
      @fullscreen-open="onFullscreenOpen"
      @fullscreen-close="onFullscreenClose"
    />

    <!-- Fallback legacy: imagen normal -->
    <img
      v-else-if="post.media_url || post.mediaUrl"
      :src="post.media_url || post.mediaUrl"
      class="feed-explorer-card__legacy-image"
      loading="lazy"
    />

    <!-- Published date -->
    <div v-if="publishedDate" class="feed-explorer-card__date">
      {{ publishedDate }}
    </div>

    <!-- Action rail slot -->
    <footer v-if="$slots.actions" class="feed-explorer-card__actions" @click.stop>
      <slot name="actions" :post="post" />
    </footer>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import ExplorerPostViewer from '@antojados/ui/base/ExplorerPostViewer.vue'

const props = defineProps({
  post: {
    type: Object,
    required: true,
  },
  maxWidth: {
    type: Number,
    default: 380,
  },
  showHeader: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['open', 'block-tap', 'fullscreen-open', 'fullscreen-close'])

const hasComposicion = computed(() => {
  return !!(props.post?.composicion && Array.isArray(props.post.composicion.blocks) && props.post.composicion.blocks.length > 0)
})

const authorLabel = computed(() => props.post.author_handle || props.post.authorHandle || 'explorador')
const avatarLetter = computed(() => authorLabel.value.charAt(0).toUpperCase() || '?')
const feedTypeLabel = computed(() => {
  const ft = props.post.feed_type || props.post.feedType || ''
  return ft.toUpperCase()
})

const publishedDate = computed(() => {
  const dateStr = props.post.published_at
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return ''
  }
})

const cardStyle = computed(() => ({
  maxWidth: `${props.maxWidth}px`,
  margin: '0 auto',
  borderRadius: '12px',
  overflow: 'hidden',
  background: '#0d0f16',
}))

function onBlockTap(block) {
  emit('block-tap', block)
}

function onFullscreenOpen(block) {
  emit('fullscreen-open', block)
}

function onFullscreenClose() {
  emit('fullscreen-close')
}
</script>

<style scoped>
.feed-explorer-card {
  width: 100%;
  background: #0d0f16;
  border-radius: 12px;
  overflow: hidden;
}

.feed-explorer-card__header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
}

.feed-explorer-card__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  color: white;
  flex-shrink: 0;
}

.feed-explorer-card__meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.feed-explorer-card__author {
  font-size: 13px;
  font-weight: 700;
  color: #ffffff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.feed-explorer-card__feed-type {
  font-size: 10px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 0.5px;
}

.feed-explorer-card__viewer {
  width: 100%;
}

.feed-explorer-card__legacy-image {
  width: 100%;
  display: block;
  object-fit: cover;
}

.feed-explorer-card__date {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  padding: 6px 12px;
}

.feed-explorer-card__actions {
  padding: 6px 12px 10px;
}
</style>