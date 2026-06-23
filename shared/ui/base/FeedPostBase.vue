<template>
  <article
    :class="[classes.root, postClass]"
    :subdim-ik="subdimIk"
    :subdim-pc="subdimPc"
    :subdim-type="subdimType"
    :subdim-applies-to="subdimAppliesTo"
    :data-code-component="codeComponent"
  >
    <div :class="classes.media" @click="$emit('open', post)">
      <slot name="media" :post="post" />

      <div v-if="$slots.mediaOverlay" :class="classes.mediaOverlay" @click.stop>
        <slot name="mediaOverlay" :post="post" />
      </div>
    </div>

    <div :class="classes.body">
      <header :class="classes.header">
        <slot name="header" :post="post">
          <div :class="classes.title">{{ titleLabel }}</div>
          <div :class="classes.subtitle">{{ subtitleLabel }}</div>
        </slot>
      </header>

      <section v-if="$slots.default" :class="classes.content">
        <slot :post="post" />
      </section>

      <section v-if="$slots.actions" :class="classes.actions">
        <slot name="actions" :post="post" />
      </section>

      <section v-if="$slots.comments" :class="classes.comments">
        <slot name="comments" :post="post" />
      </section>

      <footer v-if="$slots.footer" :class="classes.footer">
        <slot name="footer" :post="post" />
      </footer>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { resolveBaseComponentClasses } from '@antojados/ui/services/base/baseComponentsResolver'

const props = defineProps({
  post: { type: Object, required: true },
  emphasis: { type: String, default: 'default' },
  postClass: { type: [String, Array, Object], default: '' },
  subdimIk: { type: String, default: '' },
  subdimPc: { type: String, default: '' },
  subdimType: { type: String, default: 'SUB_COMPONENT' },
  subdimAppliesTo: { type: String, default: 'all' },
  codeComponent: { type: String, default: '' },
})

defineEmits(['open'])

const classes = computed(() =>
  resolveBaseComponentClasses('feedPost', {
    emphasis: props.emphasis,
  }),
)

const titleLabel = computed(() => props.post?.title || props.post?.venue || 'Publicación')
const subtitleLabel = computed(() => props.post?.subtitle || props.post?.authorHandle || '')
</script>
