<template>
  <div
    class="base-fullscreen-video-controls"
    :class="showMediaControls ? 'base-fullscreen-video-controls--media' : 'base-fullscreen-video-controls--back-only'"
    @click.stop
  >
    <q-btn
      flat
      round
      icon="arrow_back"
      color="white"
      size="md"
      aria-label="Regresar"
      class="base-fullscreen-video-controls__btn"
      @click="$emit('back')"
    />
    <q-btn
      v-if="showMediaControls"
      flat
      round
      :icon="muted ? 'volume_off' : 'volume_up'"
      color="white"
      size="md"
      aria-label="Audio"
      class="base-fullscreen-video-controls__btn"
      @click="$emit('toggle-mute')"
    />
    <q-btn
      v-if="showMediaControls"
      flat
      round
      :icon="paused ? 'play_arrow' : 'pause'"
      color="white"
      size="md"
      aria-label="Reproducir o pausar"
      class="base-fullscreen-video-controls__btn"
      @click="$emit('toggle-pause')"
    />
  </div>
</template>

<script setup>
defineProps({
  muted: { type: Boolean, default: true },
  paused: { type: Boolean, default: false },
  showMediaControls: { type: Boolean, default: false },
})

defineEmits(['back', 'toggle-mute', 'toggle-pause'])
</script>

<style scoped>
.base-fullscreen-video-controls {
  position: absolute;
  top: max(10px, env(safe-area-inset-top));
  left: max(10px, env(safe-area-inset-left));
  z-index: 9;
  display: grid;
  gap: 8px;
  align-items: center;
  width: max-content;
}

.base-fullscreen-video-controls--media {
  grid-template-columns: repeat(3, 52px);
}

.base-fullscreen-video-controls--back-only {
  grid-template-columns: 52px;
}

.base-fullscreen-video-controls__btn {
  width: 52px;
  height: 52px;
  min-width: 52px;
  min-height: 52px;
  background: rgba(0, 0, 0, 0.42);
  backdrop-filter: blur(8px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.34);
  touch-action: manipulation;
}

.base-fullscreen-video-controls__btn :deep(.q-icon) {
  font-size: 28px;
}
</style>
