<template>
  <div
    class="base-media-grid-cell"
    :class="[
      isVideo ? 'base-media-grid-cell--video' : '',
      hasMedia ? '' : 'base-media-grid-cell--empty',
      interactive ? 'base-media-grid-cell--interactive' : '',
      normalizedActions.length ? 'base-media-grid-cell--has-actions' : '',
      `base-media-grid-cell--${variant}`,
      `base-media-grid-cell--stage-${stage.toLowerCase()}`,
    ]"
    :subdim-ik="subdimIk"
    :subdim-pc="subdimPc"
    :subdim-type="subdimType"
    :subdim-applies-to="subdimAppliesTo"
    :data-code-component="codeComponent"
  >
    <template v-if="hasMedia">
      <video
        v-if="isVideo"
        :src="videoSource"
        :poster="videoPoster"
        class="base-media-grid-cell__media"
        muted
        playsinline
        preload="metadata"
      />
      <img v-else :src="mediaSource" class="base-media-grid-cell__media" loading="lazy" />
      <div v-if="isVideo" class="base-media-grid-cell__play">▶</div>
    </template>

    <div v-else class="base-media-grid-cell__media base-media-grid-cell__media--placeholder" />

    <div
      v-if="showActions && normalizedActions.length"
      class="base-media-grid-cell__actions"
      @click.stop
    >
      <q-btn
        v-for="action in normalizedActions"
        :key="action.key"
        dense
        round
        unelevated
        :icon="action.icon"
        :aria-label="action.label"
        :title="action.label"
        :class="['base-media-grid-cell__action', action.class]"
        @click.stop="$emit('action', action.key, post, action)"
      />
    </div>

    <div v-if="$slots.overlay || title || badge" class="base-media-grid-cell__overlay">
      <slot name="overlay" :post="post">
        <q-badge v-if="badge" color="dark" text-color="white" class="base-media-grid-cell__badge">
          {{ badge }}
        </q-badge>
        <div v-if="title" class="base-media-grid-cell__title">{{ title }}</div>
      </slot>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  post: { type: Object, required: true },
  badge: { type: String, default: '' },
  title: { type: String, default: '' },
  stage: {
    type: String,
    default: 'S1',
    validator: (value) => ['S1', 'S2', 'S3'].includes(value),
  },
  variant: {
    type: String,
    default: 'default',
    validator: (value) =>
      ['default', 'business', 'event', 'barrio', 'pachanga', 'short', 'hero'].includes(value),
  },
  actions: { type: Array, default: () => [] },
  showActions: { type: Boolean, default: true },
  interactive: { type: Boolean, default: true },
  subdimIk: { type: String, default: '' },
  subdimPc: { type: String, default: '' },
  subdimType: { type: String, default: 'SUB_COMPONENT' },
  subdimAppliesTo: { type: String, default: 'all' },
  codeComponent: { type: String, default: '' },
})

defineEmits(['action'])

const isVideo = computed(() => String(props.post?.mediaType || '').toLowerCase() === 'video')
const mediaSource = computed(
  () => props.post?.mediaThumbUrl || props.post?.thumbnailUrl || props.post?.mediaUrl || '',
)
const videoSource = computed(() => props.post?.mediaUrl || '')
const videoPoster = computed(() => props.post?.mediaThumbUrl || props.post?.thumbnailUrl || '')
const hasMedia = computed(() => !!mediaSource.value)
const normalizedActions = computed(() =>
  props.actions
    .map((action) => {
      if (typeof action === 'string') {
        return { key: action, icon: action, label: action, class: '' }
      }

      return {
        key: action.key || action.name || action.icon,
        icon: action.icon || 'more_horiz',
        label: action.label || action.key || action.name || 'Accion',
        class: action.class || '',
      }
    })
    .filter((action) => action.key),
)
</script>

<style scoped>
.base-media-grid-cell {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 100%;
  overflow: hidden;
  background: #10131b;
  isolation: isolate;
  transition:
    transform 150ms cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1),
    filter 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.base-media-grid-cell--interactive {
  cursor: pointer;
}

.base-media-grid-cell__media {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
  transition: transform 120ms cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;
}

.base-media-grid-cell--stage-s1 {
  background: #000;
}

.base-media-grid-cell--stage-s1 .base-media-grid-cell__media {
  object-fit: contain;
  background: #000;
}

@media (hover: hover) and (pointer: fine) {
  .base-media-grid-cell--interactive:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 22px rgba(0, 0, 0, 0.34);
    filter: saturate(1.06);
  }

  .base-media-grid-cell--interactive:hover .base-media-grid-cell__media {
    transform: scale(1.015);
  }

  .base-media-grid-cell--has-actions .base-media-grid-cell__actions {
    opacity: 0;
    transform: translateY(-4px);
  }

  .base-media-grid-cell--has-actions:hover .base-media-grid-cell__actions,
  .base-media-grid-cell--has-actions:focus-within .base-media-grid-cell__actions {
    opacity: 1;
    transform: translateY(0);
  }
}

.base-media-grid-cell--interactive:active {
  transform: scale(0.96);
}

.base-media-grid-cell__media--placeholder {
  background: linear-gradient(90deg, #10131b 0%, #1a1f2b 45%, #10131b 100%);
  background-size: 200% 100%;
  animation: baseMediaCellSkeletonPulse 1000ms ease-in-out infinite;
}

.base-media-grid-cell__play {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.58);
  color: #fff;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-left: 3px;
  pointer-events: none;
}

.base-media-grid-cell__actions {
  position: absolute;
  top: 7px;
  right: 7px;
  z-index: 3;
  display: flex;
  gap: 6px;
  transition:
    opacity 150ms cubic-bezier(0.4, 0, 0.2, 1),
    transform 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.base-media-grid-cell__action {
  width: 30px;
  height: 30px;
  min-height: 30px;
  color: white;
  background: rgba(12, 14, 20, 0.74);
  backdrop-filter: blur(8px);
}

.base-media-grid-cell__action:hover,
.base-media-grid-cell__action:focus-visible {
  background: rgba(239, 163, 0, 0.96);
  color: #111827;
}

.base-media-grid-cell__overlay {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  padding: 24px 7px 7px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.72), transparent);
  color: white;
  pointer-events: none;
}

.base-media-grid-cell--business .base-media-grid-cell__badge,
.base-media-grid-cell--event .base-media-grid-cell__badge {
  color: #111827;
  background: var(--app-primary) !important;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.3px;
}

.base-media-grid-cell--event .base-media-grid-cell__badge {
  color: #fff;
  background: #6d28d9 !important;
}

.base-media-grid-cell--pachanga .base-media-grid-cell__overlay,
.base-media-grid-cell--barrio .base-media-grid-cell__overlay {
  padding-top: 34px;
}

.base-media-grid-cell--short {
  border-radius: 0;
}

.base-media-grid-cell--short .base-media-grid-cell__overlay,
.base-media-grid-cell--hero .base-media-grid-cell__overlay {
  padding: 72px 92px 24px 16px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.78), transparent 62%);
}

.base-media-grid-cell--short .base-media-grid-cell__title,
.base-media-grid-cell--hero .base-media-grid-cell__title {
  font-size: 18px;
}

.base-media-grid-cell__badge {
  margin-bottom: 4px;
}

.base-media-grid-cell__title {
  font-size: 11px;
  font-weight: 700;
  line-height: 1.2;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.65);
}

@keyframes baseMediaCellSkeletonPulse {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
