<template>
  <component
    :is="presentation === 'dialog' ? 'q-dialog' : 'div'"
    :model-value="presentation === 'dialog' ? modelValue : undefined"
    :maximized="presentation === 'dialog'"
    transition-show="fade"
    transition-hide="fade"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <section
      :class="[
        classes.root,
        `base-feed-fullscreen--${variant}`,
        `base-feed-fullscreen--${presentation}`,
        `base-feed-fullscreen--stage-${stage.toLowerCase()}`,
      ]"
      :subdim-ik="subdimIk"
      :subdim-pc="subdimPc"
      :subdim-type="subdimType"
      :subdim-applies-to="subdimAppliesTo"
      :data-code-component="codeComponent"
    >
      <div :class="classes.media" @click="toggleRail">
        <slot name="media" :post="safePost">
          <video
            v-if="isVideo"
            :src="safePost.mediaUrl"
            class="base-feed-fullscreen__asset"
            autoplay
            muted
            loop
            playsinline
          />
          <img
            v-else-if="safePost.mediaUrl"
            :src="safePost.mediaUrl"
            class="base-feed-fullscreen__asset"
            :class="mediaFit === 'contain' ? 'base-feed-fullscreen__asset--contain' : ''"
          />
          <div v-else class="base-feed-fullscreen__asset base-feed-fullscreen__asset--empty" />
        </slot>

        <div v-if="showScrim" class="base-feed-fullscreen__scrim" />

        <post-action-rail-base
          v-if="showActionRail && effectiveRailVisible"
          layout="slide"
          :density="actionRailDensity"
          :actions="actionRailActions"
          :show-counts="showActionCounts"
          :subdim-ik="actionRailSubdimIk"
          :subdim-pc="actionRailSubdimPc"
          :subdim-type="actionRailSubdimType"
          :subdim-applies-to="actionRailSubdimAppliesTo"
          :code-component="actionRailCodeComponent"
          @action="onActionRail"
        />

        <div
          v-if="overlayVisible && ($slots.overlay || titleLabel || captionLabel)"
          class="base-feed-fullscreen__overlay"
        >
          <slot name="overlay" :post="safePost">
            <div class="base-feed-fullscreen__title">{{ titleLabel }}</div>
            <div v-if="subtitleLabel" class="base-feed-fullscreen__subtitle">{{ subtitleLabel }}</div>
            <div v-if="captionLabel" class="base-feed-fullscreen__caption">{{ captionLabel }}</div>
          </slot>
        </div>

        <q-btn
          flat
          round
          icon="arrow_back"
          color="white"
          size="md"
          aria-label="Regresar"
          :class="classes.close"
          @click.stop="closeDialog"
        />
      </div>

      <div
        v-if="$slots.quickInput && quickInputPlacement === 'overlay'"
        class="base-feed-fullscreen__quick-input"
        @click.stop
      >
        <slot name="quickInput" :post="safePost" />
      </div>

      <div :class="classes.body">
        <div
          v-if="$slots.quickInput && quickInputPlacement === 'body'"
          class="base-feed-fullscreen__quick-input base-feed-fullscreen__quick-input--body"
          @click.stop
        >
          <slot name="quickInput" :post="safePost" />
        </div>

        <slot :post="safePost" />

        <feed-gallery-base
          v-if="associatedItems.length"
          :items="associatedItems"
          :stage="stage"
          :variant="associatedVariant"
          :model="associatedModel"
          :key-field="associatedKeyField"
          :title-field="associatedTitleField"
          :badge-field="associatedBadgeField"
          :tile-variant="associatedTileVariant"
          :subdim-ik="associatedSubdimIk"
          :subdim-pc="associatedSubdimPc"
          :subdim-type="associatedSubdimType"
          :subdim-applies-to="associatedSubdimAppliesTo"
          :code-component="associatedCodeComponent"
          class="base-feed-fullscreen__associated"
          @select="onAssociatedSelect"
        >
          <template v-if="$slots.associatedItem" #item="{ item, index }">
            <slot name="associatedItem" :item="item" :index="index" />
          </template>
        </feed-gallery-base>

        <div v-if="$slots.actions" :class="classes.actions">
          <slot name="actions" :post="safePost" />
        </div>

        <div v-if="$slots.footer" :class="classes.footer">
          <slot name="footer" :post="safePost" />
        </div>
      </div>

      <div v-if="hasFixedComments" :class="classes.comments">
        <slot name="comments" :post="safePost">
          <comments-input-base
            :comments="comments"
            :variant="commentsVariant"
            :title="commentsTitle"
            :placeholder="commentsPlaceholder"
            :empty-message="commentsEmptyMessage"
            :accent-color="commentsAccentColor"
            :accent-text-color="commentsAccentTextColor"
            :subdim-ik="commentsSubdimIk"
            :subdim-pc="commentsSubdimPc"
            :subdim-type="commentsSubdimType"
            :subdim-applies-to="commentsSubdimAppliesTo"
            :code-component="commentsCodeComponent"
            @send="onCommentSend"
          />
        </slot>
      </div>
    </section>
  </component>
</template>

<script setup>
import { computed, ref } from 'vue'
import { resolveBaseComponentClasses } from '@antojados/ui/services/base/baseComponentsResolver'
import CommentsInputBase from '@antojados/ui/base/CommentsInputBase.vue'
import FeedGalleryBase from '@antojados/ui/base/FeedGalleryBase.vue'
import PostActionRailBase from '@antojados/ui/base/PostActionRailBase.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  post: { type: Object, default: () => ({}) },
  stage: {
    type: String,
    default: 'S3',
    validator: (value) => ['S1', 'S2', 'S3'].includes(value),
  },
  presentation: {
    type: String,
    default: 'dialog',
    validator: (value) => ['dialog', 'inline'].includes(value),
  },
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'neta', 'barrio', 'bizPost', 'pachanga', 'arre'].includes(value),
  },
  overlayVisible: { type: Boolean, default: true },
  railVisible: { type: Boolean, default: null },
  showScrim: { type: Boolean, default: true },
  quickInputPlacement: {
    type: String,
    default: 'overlay',
    validator: (value) => ['overlay', 'body'].includes(value),
  },
  mediaFit: {
    type: String,
    default: 'cover',
    validator: (value) => ['cover', 'contain'].includes(value),
  },
  showActionRail: { type: Boolean, default: false },
  actionRailActions: {
    type: Array,
    default: () => [
      { key: 'chocalas', label: 'Chocalas', icon: 'front_hand', count: 0 },
      { key: 'pasala', label: 'Pasala', icon: 'reply', count: 0 },
      { key: 'morral', label: 'Morral', icon: 'backpack', count: 0 },
      { key: 'maps', label: 'Maps', icon: 'map', count: 0 },
    ],
  },
  actionRailDensity: {
    type: String,
    default: 'normal',
    validator: (value) => ['normal', 'compact'].includes(value),
  },
  showActionCounts: { type: Boolean, default: true },
  actionRailSubdimIk: { type: String, default: '' },
  actionRailSubdimPc: { type: String, default: '' },
  actionRailSubdimType: { type: String, default: 'SUB_COMPONENT' },
  actionRailSubdimAppliesTo: { type: String, default: 'all' },
  actionRailCodeComponent: { type: String, default: '' },
  associatedItems: { type: Array, default: () => [] },
  associatedVariant: {
    type: String,
    default: 'businessMasonry',
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
  associatedModel: {
    type: String,
    default: 'androidMosaic',
    validator: (value) => ['uniform', 'androidMosaic'].includes(value),
  },
  associatedKeyField: { type: String, default: 'id' },
  associatedTitleField: { type: String, default: 'venueName' },
  associatedBadgeField: { type: String, default: 'postTypeLabel' },
  associatedTileVariant: { type: String, default: 'business' },
  associatedSubdimIk: { type: String, default: '' },
  associatedSubdimPc: { type: String, default: '' },
  associatedSubdimType: { type: String, default: 'SUB_COMPONENT' },
  associatedSubdimAppliesTo: { type: String, default: 'all' },
  associatedCodeComponent: { type: String, default: '' },
  comments: { type: Array, default: () => [] },
  showComments: { type: Boolean, default: false },
  commentsVariant: { type: String, default: 'vasIr' },
  commentsTitle: { type: String, default: 'Comentarios' },
  commentsPlaceholder: { type: String, default: 'Escribe un comentario...' },
  commentsEmptyMessage: { type: String, default: 'Se el primero en comentar.' },
  commentsAccentColor: { type: String, default: 'primary' },
  commentsAccentTextColor: { type: String, default: 'dark' },
  commentsSubdimIk: { type: String, default: '' },
  commentsSubdimPc: { type: String, default: '' },
  commentsSubdimType: { type: String, default: 'SUB_COMPONENT' },
  commentsSubdimAppliesTo: { type: String, default: 'all' },
  commentsCodeComponent: { type: String, default: '' },
  subdimIk: { type: String, default: '' },
  subdimPc: { type: String, default: '' },
  subdimType: { type: String, default: 'FULLSCREEN' },
  subdimAppliesTo: { type: String, default: 'all' },
  codeComponent: { type: String, default: '' },
})

const emit = defineEmits([
  'update:modelValue',
  'close',
  'rail-action',
  'toggle-overlay',
  'select-associated',
  'send-comment',
])
const internalRailVisible = ref(false)

const classes = resolveBaseComponentClasses('feedFullscreen', {
  variant: props.variant,
  stage: props.stage,
  presentation: props.presentation,
})
const safePost = computed(() => props.post || {})
const isVideo = computed(() => String(safePost.value?.mediaType || '').toLowerCase() === 'video')
const titleLabel = computed(() => safePost.value?.title || safePost.value?.venue || safePost.value?.venueName || '')
const subtitleLabel = computed(() => safePost.value?.subtitle || safePost.value?.author || safePost.value?.authorHandle || '')
const captionLabel = computed(() => safePost.value?.caption || '')
const effectiveRailVisible = computed(() =>
  props.railVisible === null ? internalRailVisible.value : props.railVisible,
)
const hasFixedComments = computed(() => props.showComments || props.comments.length > 0 || Boolean(slots.comments))

const slots = defineSlots()

function toggleRail() {
  if (props.railVisible === null) {
    internalRailVisible.value = !internalRailVisible.value
  }
  emit('toggle-overlay')
}

function closeDialog() {
  emit('update:modelValue', false)
  emit('close')
}

function onActionRail(actionKey) {
  emit('rail-action', actionKey)
}

function onAssociatedSelect(item, index) {
  emit('select-associated', item, index)
}

function onCommentSend(text) {
  emit('send-comment', text)
}
</script>
