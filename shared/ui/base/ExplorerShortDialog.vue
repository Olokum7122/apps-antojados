<template>
  <q-dialog v-model="internalModel" maximized transition-show="fade" transition-hide="fade">
    <feed-short-viewer
      :items="items"
      :actions="actions"
      :model-value="activeItemId"
      :initial-post-id="initialPostId"
      :badge-label="badgeLabel"
      :accent-color="accentColor"
      :show-controls="true"
      :show-badge="true"
      :show-meta="true"
      :show-action-rail="true"
      :show-comments="showComments"
      :show-comment-input="showCommentInput"
      :height="'100dvh'"
      :subdim-ik="subdimIk"
      :subdim-pc="subdimPc"
      :code-component="codeComponent"
      @update:model-value="onActiveChange"
      @rail-action="onRailAction"
      @comment-submit="onCommentSubmit"
    >
      <!-- Media: imagen/video del post -->
      <template #media="{ item, active, muted, paused }">
        <!-- Explorer canvas como overlay sobre la media -->
        <img
          v-if="item.media_url || item.mediaUrl || item.mediaFullUrl || item.media_full_url"
          :src="item.media_full_url || item.mediaUrl || item.media_url || item.media_feed_url"
          class="explorer-short__media-bg"
          loading="lazy"
        />

        <!-- Canvas explorer superpuesto -->
        <div class="explorer-short__canvas-wrap">
          <explorer-post-viewer
            v-if="hasComposicion(item)"
            :composicion="item.composicion"
            :scale="1"
            :max-width="380"
            @fullscreen-open="onFullscreenOpen"
          />
        </div>
      </template>

      <!-- Comments slot -->
      <template #comments="{ item }">
        <div
          v-for="comment in resolveComments(item).slice(-2)"
          :key="comment.id"
          class="explorer-short__comment"
        >
          <strong>@{{ comment.user }}</strong>
          <span>{{ comment.text }}</span>
        </div>
        <div v-if="!resolveComments(item).length" class="explorer-short__empty-comments">
          Sin comentarios aun - se el primero
        </div>
      </template>
    </feed-short-viewer>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import FeedShortViewer from '@antojados/ui/base/FeedShortViewer.vue'
import ExplorerPostViewer from '@antojados/ui/base/ExplorerPostViewer.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  items: { type: Array, default: () => [] },
  initialPostId: { type: String, default: '' },
  accentColor: { type: String, default: 'deep-purple-3' },
  badgeLabel: { type: String, default: 'EXPLORER' },
  showComments: { type: Boolean, default: true },
  showCommentInput: { type: Boolean, default: true },
  subdimIk: { type: String, default: '' },
  subdimPc: { type: String, default: '' },
  codeComponent: { type: String, default: '' },
})

const emit = defineEmits([
  'update:modelValue',
  'update:activeItemId',
  'rail-action',
  'comment-submit',
])

const internalModel = ref(false)
const activeItemId = ref('')

const actions = computed(() => [
  { key: 'chocalas', label: 'Chocalas', icon: 'favorite_border', count: 0 },
  { key: 'comentar', label: 'Comentar', icon: 'chat_bubble', count: 0 },
  { key: 'morral', label: 'Morral', icon: 'backpack', count: 0 },
  { key: 'compartir', label: 'Pasalo', icon: 'reply', count: 0 },
])

watch(() => props.modelValue, (val) => {
  internalModel.value = val
  if (val && props.initialPostId) {
    activeItemId.value = props.initialPostId
  }
})

watch(internalModel, (val) => {
  emit('update:modelValue', val)
})

function hasComposicion(item) {
  return !!(item.composicion && Array.isArray(item.composicion.blocks) && item.composicion.blocks.length > 0)
}

function resolveComments(item) {
  return item?.comments || []
}

function onActiveChange(id) {
  activeItemId.value = id
  emit('update:activeItemId', id)
}

function onRailAction(action, item) {
  emit('rail-action', action, item)
}

function onCommentSubmit(item, text) {
  emit('comment-submit', item, text)
}

function onFullscreenOpen(block) {
  // Fullscreen de imagen ya lo maneja ExplorerPostViewer internamente
}
</script>

<style scoped>
.explorer-short__media-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.3;
  filter: blur(8px);
  pointer-events: none;
}

.explorer-short__canvas-wrap {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  pointer-events: auto;
}

.explorer-short__comment {
  overflow: hidden;
  color: rgba(255, 255, 255, 0.84);
  font-size: 12px;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.explorer-short__comment strong {
  margin-right: 5px;
  color: #d8b4fe;
}

.explorer-short__empty-comments {
  overflow: hidden;
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}
</style>