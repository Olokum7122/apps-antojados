<template>
  <article
    :class="[classes.root, cardClass]"
    :subdim-ik="subdimIk"
    :subdim-pc="subdimPc"
    :subdim-type="subdimType"
    :subdim-applies-to="subdimAppliesTo"
    :data-code-component="codeComponent"
    @click="$emit('open', post)"
  >
    <div v-if="feedDebug && post.recommendation_score != null" :class="classes.debugChip">
      <span :class="classes.debugScore">{{ Number(post.recommendation_score).toFixed(1) }}</span>
      <span :class="classes.debugReason">{{ post.recommendation_reason || 'n/a' }}</span>
    </div>

    <header :class="classes.head">
      <div :class="classes.avatar">{{ avatarLetter }}</div>
      <div :class="classes.meta">
        <button type="button" :class="classes.author" @click.stop="$emit('author', post)">
          @{{ authorLabel }}
        </button>
        <div :class="classes.tags">
          <button
            v-if="venueLabel"
            type="button"
            :class="[classes.tag, classes.tagVenue]"
            @click.stop="$emit('venue', post)"
          >
            #{{ venueLabel }}
          </button>
          <span v-if="dishLabel" :class="[classes.tag, classes.tagDish]">#{{ dishLabel }}</span>
          <span v-if="momentLabel" :class="[classes.tag, classes.tagMoment]">#{{ momentLabel }}</span>
        </div>
      </div>
    </header>

    <div v-if="mediaUrl" :class="classes.mediaWrap">
      <img :src="mediaUrl" :class="classes.media" loading="lazy" @click.stop="$emit('open', post)" />
    </div>

    <section :class="classes.body">
      <p v-if="captionLabel" :class="classes.caption">{{ captionLabel }}</p>

      <div v-if="ratingVerdicts.length" :class="classes.verdicts">
        <div v-for="verdict in ratingVerdicts" :key="verdict.dim" :class="classes.verdictRow">
          <span :class="classes.verdictIcon">{{ resolveVerdictIcon(verdict.dim) }}</span>
          <span :class="classes.verdictText">"{{ verdict.phrase }}"</span>
        </div>
      </div>

      <q-rating
        v-else-if="averageRating"
        :model-value="averageRating"
        size="0.95em"
        color="primary"
        icon="star_border"
        icon-selected="star"
        readonly
      />
    </section>

    <footer v-if="$slots.actions" :class="classes.actions" @click.stop>
      <slot name="actions" :post="post" />
    </footer>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { resolveBaseComponentClasses } from '@antojados/ui/services/base/baseComponentsResolver'

const props = defineProps({
  post: { type: Object, required: true },
  feedDebug: { type: Boolean, default: false },
  cardClass: { type: [String, Array, Object], default: '' },
  /** Stage del engine: S1 (thumb 400px), S2 (feed 1080px), S3 (full 1920px) */
  stage: {
    type: String,
    default: 'S1',
    validator: (value) => ['S1', 'S2', 'S3'].includes(value),
  },
  subdimIk: { type: String, default: '' },
  subdimPc: { type: String, default: '' },
  subdimType: { type: String, default: 'SUB_COMPONENT' },
  subdimAppliesTo: { type: String, default: 'all' },
  codeComponent: { type: String, default: '' },
})

defineEmits(['open', 'author', 'venue'])

const classes = resolveBaseComponentClasses('feedPostCard')

const authorLabel = computed(() => props.post.author || props.post.authorHandle || 'usuario')
const avatarLetter = computed(() => authorLabel.value.charAt(0).toUpperCase() || '?')
const venueLabel = computed(() => props.post.venue || props.post.venueName || '')
const dishLabel = computed(() => props.post.dish || props.post.dishName || '')
const momentLabel = computed(() => props.post.momentTag || '')
const captionLabel = computed(() => props.post.caption || '')
const mediaUrl = computed(() => {
  // S1: thumb (400px), S2/S3: feed (1080px)
  if (props.stage === 'S1') {
    return props.post.mediaThumbUrl || props.post.mediaUrl || ''
  }
  return props.post.mediaUrl || props.post.mediaThumbUrl || ''
})
const averageRating = computed(() => Number(props.post.averageRating || 0))
const ratingVerdicts = computed(() => props.post.ratingVerdicts || [])

function resolveVerdictIcon(dim) {
  const icons = {
    taste: 'chile',
    price: '$',
    service: 'cuate',
    cleanliness: 'comal',
    ambience: 'carbon',
    wait_time: 'trompo',
  }
  return icons[dim] || 'star'
}
</script>

