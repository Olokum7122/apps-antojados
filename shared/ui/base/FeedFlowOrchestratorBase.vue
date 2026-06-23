<template>
  <section
    :class="[classes.root, `base-feed-flow--${variant}`, `base-feed-flow--stage-${stage.toLowerCase()}`]"
    :subdim-ik="subdimIk"
    :subdim-pc="subdimPc"
    :subdim-type="subdimType"
    :subdim-applies-to="subdimAppliesTo"
    :data-code-component="codeComponent"
  >
    <div :class="classes.stepper">
      <div
        v-for="step in normalizedSteps"
        :key="step.key"
        :class="[
          classes.step,
          step.key === activeStep ? classes.stepActive : '',
          step.index < activeIndex ? classes.stepDone : '',
        ]"
      >
        {{ step.label }}
      </div>
    </div>

    <div :class="classes.content">
      <slot :active-step="activeStep" :active-index="activeIndex" :steps="normalizedSteps" />
    </div>

    <div :class="classes.actions">
      <slot name="actions" :active-step="activeStep" :active-index="activeIndex">
        <q-btn
          v-if="showBack"
          flat
          dense
          no-caps
          color="grey-5"
          label="Atrás"
          @click="$emit('back')"
        />
        <q-btn
          v-if="showNext"
          unelevated
          dense
          no-caps
          color="primary"
          :label="nextLabel"
          @click="$emit('next')"
        />
      </slot>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { resolveBaseComponentClasses } from '@antojados/ui/services/base/baseComponentsResolver'

const props = defineProps({
  steps: { type: Array, default: () => [] },
  activeStep: { type: String, default: '' },
  stage: {
    type: String,
    default: 'S3',
    validator: (value) => ['S1', 'S2', 'S3'].includes(value),
  },
  variant: {
    type: String,
    default: 'publish',
    validator: (value) => ['publish', 'record', 'decision', 'playback'].includes(value),
  },
  nextLabel: { type: String, default: 'Siguiente' },
  showBack: { type: Boolean, default: true },
  showNext: { type: Boolean, default: true },
  subdimIk: { type: String, default: '' },
  subdimPc: { type: String, default: '' },
  subdimType: { type: String, default: 'SUB_COMPONENT' },
  subdimAppliesTo: { type: String, default: 'all' },
  codeComponent: { type: String, default: '' },
})

defineEmits(['back', 'next'])

const classes = resolveBaseComponentClasses('feedFlow', {
  variant: props.variant,
  stage: props.stage,
})

const normalizedSteps = computed(() =>
  (props.steps || []).map((step, index) => ({
    key: String(step?.key || `step-${index}`),
    label: String(step?.label || `Paso ${index + 1}`),
    index,
  })),
)

const activeIndex = computed(() =>
  normalizedSteps.value.findIndex((step) => step.key === props.activeStep),
)
</script>
