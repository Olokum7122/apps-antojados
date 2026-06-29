<template>
  <div
    :class="rootClass"
    :subdim-ik="subdimIk"
    :subdim-pc="subdimPc"
    :subdim-type="subdimType"
    :subdim-applies-to="subdimAppliesTo"
    :data-code-component="codeComponent"
  >
    <div v-if="$slots.header" :class="classes.header">
      <slot name="header" />
    </div>

    <div v-if="$slots.filters" :class="classes.filters">
      <slot name="filters" />
    </div>

    <div v-if="loading" :class="classes.loading">
      <slot name="loading">
        <feed-skeleton-grid
          :variant="variant === 'default' ? 'masonry' : 'uniform'"
          :skeleton-count="8"
        />
      </slot>
    </div>

    <div v-else-if="items.length" :class="gridClasses">
      <div
        v-for="(item, index) in items"
        :key="resolveKey(item, index)"
        :class="cellClasses(item, index)"
        role="button"
        tabindex="0"
        @click="$emit('select', item, index)"
        @keyup.enter="$emit('select', item, index)"
        @keyup.space.prevent="$emit('select', item, index)"
      >
        <slot name="item" :item="item" :index="index">
          <slot v-if="item?._sponsor" name="sponsor" :item="item" :index="index">
            <div class="base-feed-grid__sponsor">Sponsor</div>
          </slot>
          <media-grid-cell-base
            v-else
            :post="item"
            :stage="stage"
            :variant="resolveTileVariant(item, index)"
            :title="resolveTitle(item)"
            :badge="resolveBadge(item)"
            :actions="resolveTileActions(item, index)"
            :show-actions="showTileActions"
            :subdim-ik="`${subdimIk}_MEDIA_CELL`"
            :subdim-pc="subdimPc"
            :subdim-type="subdimType"
            :subdim-applies-to="subdimAppliesTo"
            :code-component="`${codeComponent}.MEDIA_CELL`"
            @action="(actionKey, post, action) => emitTileAction(actionKey, post, action, index)"
          />
        </slot>
      </div>
    </div>

    <div v-else :class="classes.empty">
      <slot name="empty">
        <span :class="classes.emptyMessage">{{ emptyMessage }}</span>
      </slot>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { resolveBaseComponentClasses } from '@antojados/ui/services/base/baseComponentsResolver'
import MediaGridCellBase from './MediaGridCellBase.vue'
import FeedSkeletonGrid from './FeedSkeletonGrid.vue'

const props = defineProps({
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  emptyMessage: { type: String, default: 'Sin contenido disponible' },
  keyField: { type: String, default: 'id' },
  stage: {
    type: String,
    default: 'S1',
    validator: (value) => ['S1', 'S2', 'S3'].includes(value),
  },
  variant: {
    type: String,
    default: 'default',
    validator: (value) =>
      [
        'default',
        'businessMasonry',
        'eventMasonry',
        'barrioMasonry',
        'pachangaMasonry',
        'socialMasonry',
      ].includes(value),
  },
  model: {
    type: String,
    default: 'uniform',
    validator: (value) => ['uniform', 'androidMosaic'].includes(value),
  },
  gridClass: { type: [String, Array, Object], default: '' },
  cellClass: { type: Function, default: () => '' },
  titleField: { type: String, default: 'venueName' },
  badgeField: { type: String, default: '' },
  tileVariant: { type: String, default: '' },
  tileVariantResolver: { type: Function, default: null },
  tileActions: { type: Array, default: () => [] },
  tileActionsResolver: { type: Function, default: null },
  showTileActions: { type: Boolean, default: false },
  subdimIk: { type: String, default: '' },
  subdimPc: { type: String, default: '' },
  subdimType: { type: String, default: 'SUB_COMPONENT' },
  subdimAppliesTo: { type: String, default: 'all' },
  codeComponent: { type: String, default: '' },
})

const emit = defineEmits(['select', 'tile-action'])

const classes = resolveBaseComponentClasses('feedGrid', {
  variant: props.variant,
  stage: props.stage,
})

const rootClass = computed(() => [
  classes.root,
  `base-feed-grid--stage-${props.stage.toLowerCase()}`,
  `base-feed-grid--${props.variant}`,
  effectiveModel.value === 'androidMosaic'
    ? 'base-feed-grid--android'
    : 'base-feed-grid--uniform',
])

const gridClasses = computed(() => [classes.grid, props.gridClass])

const effectiveModel = computed(() => {
  if (props.model === 'androidMosaic') return 'androidMosaic'
  if (props.variant !== 'default') return 'androidMosaic'
  return props.model
})

function densePatternClass(index) {
  const mod = index % 10
  if (mod === 0 || mod === 1) return 'base-feed-grid__cell--vertical'
  if (mod === 2 || mod === 3) return 'base-feed-grid__cell--medium'
  if (mod === 4) return 'base-feed-grid__cell--wide'
  if (mod === 5 || mod === 6) return 'base-feed-grid__cell--square'
  if (mod === 7 || mod === 8) return 'base-feed-grid__cell--medium'
  return 'base-feed-grid__cell--wide'
}

function cellClasses(item, index) {
  return [
    classes.cell,
    effectiveModel.value === 'androidMosaic' ? densePatternClass(index) : '',
    props.cellClass(item, index),
  ]
}

function resolveKey(item, index) {
  return item?.[props.keyField] ?? `${props.keyField}-${index}`
}

function resolveTitle(item) {
  return String(
    item?.[props.titleField] || item?.venue || item?.authorHandle || item?.title || '',
  )
}

function resolveBadge(item) {
  if (!props.badgeField) return ''
  return String(item?.[props.badgeField] || '')
}

function resolveTileActions(item, index) {
  if (props.tileActionsResolver) return props.tileActionsResolver(item, index) || []
  return props.tileActions
}

function resolveTileVariant(item, index) {
  if (props.tileVariantResolver) return props.tileVariantResolver(item, index) || 'default'
  if (props.tileVariant) return props.tileVariant
  const map = {
    businessMasonry: 'business',
    eventMasonry: 'event',
    barrioMasonry: 'barrio',
    pachangaMasonry: 'pachanga',
    socialMasonry: 'barrio',
  }
  return map[props.variant] || 'default'
}

function emitTileAction(actionKey, post, action, index) {
  emit('tile-action', actionKey, post, action, index)
}
</script>
