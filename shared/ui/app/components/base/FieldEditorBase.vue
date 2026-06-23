<template>
  <section
    :class="classes.root"
    :subdim-ik="subdimIk"
    :subdim-pc="subdimPc"
    :subdim-type="subdimType"
    :subdim-applies-to="subdimAppliesTo"
    :data-code-component="codeComponent"
  >
    <div :class="classes.title">{{ title }}</div>

    <div :class="classes.fields">
      <q-input
        v-for="field in normalizedFields"
        :key="field.key"
        :model-value="field.value"
        :label="field.label"
        :type="field.type"
        :hint="field.hint"
        :readonly="field.readonly"
        :disable="field.disabled"
        dark
        filled
        dense
        @update:model-value="updateField(field.key, $event)"
      />
    </div>

    <div v-if="infoText" :class="classes.info">{{ infoText }}</div>

    <div :class="classes.actions">
      <slot name="actions" :update-field="updateField" />
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { resolveBaseComponentClasses } from '@antojados/ui/services/base/baseComponentsResolver'

const props = defineProps({
  title: { type: String, default: 'Editor' },
  fields: { type: Array, default: () => [] },
  modelValue: { type: Object, default: () => ({}) },
  infoText: { type: String, default: '' },
  subdimIk: { type: String, default: '' },
  subdimPc: { type: String, default: '' },
  subdimType: { type: String, default: 'SUB_COMPONENT' },
  subdimAppliesTo: { type: String, default: 'all' },
  codeComponent: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

const classes = resolveBaseComponentClasses('fieldEditor')

const normalizedFields = computed(() =>
  (props.fields || []).map((field) => ({
    key: String(field?.key || ''),
    label: String(field?.label || field?.key || ''),
    hint: String(field?.hint || ''),
    type: String(field?.type || 'text'),
    readonly: field?.readonly === true,
    disabled: field?.disabled === true,
    value: props.modelValue?.[field?.key] ?? field?.value ?? '',
  })),
)

function updateField(key, value) {
  emit('update:modelValue', {
    ...(props.modelValue || {}),
    [key]: value,
  })
}
</script>

<style scoped>
.base-field-editor {
  display: grid;
  gap: 12px;
  padding: 14px;
  border-radius: var(--app-radius-md, 14px);
  background: var(--app-bg-surface);
  border: 1px solid var(--app-border);
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
}

.base-field-editor__title {
  color: var(--app-text-primary);
  font-size: 14px;
  font-weight: 700;
}

.base-field-editor__fields {
  display: grid;
  gap: 10px;
  min-width: 0;
}

.base-field-editor__info {
  color: var(--app-text-secondary);
  font-size: 12px;
  line-height: 1.4;
}

.base-field-editor__actions {
  display: grid;
  gap: 8px;
}

:deep(.base-field-editor .q-field) {
  color: var(--app-text-primary);
  min-width: 0;
  max-width: 100%;
}

:deep(.base-field-editor .q-field__control) {
  background: var(--app-bg-card) !important;
  color: var(--app-text-primary) !important;
  border-radius: 12px;
}

:deep(.base-field-editor .q-field--filled .q-field__control:before),
:deep(.base-field-editor .q-field--filled .q-field__control:after) {
  border-bottom-color: var(--app-border) !important;
}

:deep(.base-field-editor .q-field__native),
:deep(.base-field-editor .q-field__input) {
  color: var(--app-text-primary) !important;
  -webkit-text-fill-color: var(--app-text-primary) !important;
}

:deep(.base-field-editor input),
:deep(.base-field-editor textarea) {
  color: var(--app-text-primary) !important;
  -webkit-text-fill-color: var(--app-text-primary) !important;
  caret-color: var(--app-primary) !important;
}

:deep(.base-field-editor .q-field__label) {
  color: var(--app-text-secondary) !important;
}

:deep(.base-field-editor .q-field__bottom),
:deep(.base-field-editor .q-field__messages),
:deep(.base-field-editor .q-field__marginal) {
  color: var(--app-text-muted) !important;
}
</style>
