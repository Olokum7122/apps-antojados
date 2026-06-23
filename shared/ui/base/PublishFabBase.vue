<template>
  <div class="publish-fab-base">
    <q-btn
      fab
      :icon="imageSrc ? undefined : 'add'"
      :color="color"
      :text-color="textColor"
      class="publish-fab-base__button"
      :class="imageSrc ? 'publish-fab-base__button--image' : ''"
      :subdim-ik="subdimIk"
      :subdim-pc="subdimPc"
      :subdim-dim-code="dimCode"
      :subdim-type="subdimType"
      :subdim-applies-to="subdimAppliesTo"
      :data-dim-code="dimCode"
      :data-code-component="codeComponent"
      @click="isGuideOpen = true"
    >
      <img v-if="imageSrc" :src="imageSrc" alt="" class="publish-fab-base__image" />
      <q-tooltip>{{ tooltip }}</q-tooltip>
    </q-btn>
  </div>

  <q-dialog v-model="isGuideOpen" position="bottom">
    <q-card class="publish-fab-base__card bg-grey-10 text-white">
      <q-card-section class="text-center q-pt-lg q-pb-sm">
        <q-icon :name="guideIcon" size="40px" :color="color" />
        <div class="text-h6 q-mt-sm">{{ title }}</div>
        <p class="publish-fab-base__body text-body2 text-grey-4 q-mt-sm q-mb-none">
          {{ body }}
        </p>
      </q-card-section>
      <q-card-actions align="stretch" class="q-px-md q-pb-lg q-gutter-sm column">
        <q-btn
          unelevated
          rounded
          no-caps
          :color="color"
          :text-color="textColor"
          :label="confirmLabel"
          size="md"
          @click="confirm"
        />
        <q-btn
          flat
          rounded
          no-caps
          color="grey-5"
          label="Cancelar"
          size="sm"
          @click="isGuideOpen = false"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  color: { type: String, default: 'primary' },
  textColor: { type: String, default: 'dark' },
  tooltip: { type: String, required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  confirmLabel: { type: String, default: 'Continuar' },
  guideIcon: { type: String, default: 'add' },
  imageSrc: { type: String, default: '' },
  subdimIk: { type: String, default: 'BTN_PUBLICAR' },
  subdimPc: { type: String, default: '' },
  dimCode: { type: String, default: '' },
  subdimType: { type: String, default: 'BUTTON' },
  subdimAppliesTo: { type: String, default: 'all' },
  codeComponent: { type: String, default: '' },
})

const emit = defineEmits(['confirm'])
const isGuideOpen = ref(false)

function confirm() {
  isGuideOpen.value = false
  emit('confirm')
}
</script>

<style scoped>
.publish-fab-base__card {
  width: 100vw;
  max-width: 480px;
  border-radius: 20px 20px 0 0;
}

.publish-fab-base__body {
  white-space: pre-line;
}

.publish-fab-base {
  position: fixed;
  right: max(16px, env(safe-area-inset-right));
  bottom: max(112px, calc(env(safe-area-inset-bottom) + 112px));
  z-index: 2600;
}

.publish-fab-base__button {
  width: 82px;
  height: 82px;
  min-width: 82px;
  min-height: 82px;
}

.publish-fab-base__button--image {
  padding: 0;
  overflow: hidden;
  background: transparent !important;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.36);
}

.publish-fab-base__image {
  width: 82px;
  height: 82px;
  object-fit: contain;
  display: block;
  pointer-events: none;
}

@media (min-width: 900px) {
  .publish-fab-base {
    right: calc((100vw - min(430px, calc(100vw - 24px))) / 2 + 18px);
    bottom: 116px;
  }
}
</style>
