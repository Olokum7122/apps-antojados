<template>
  <section
    :class="['feed-detail-column-base', `feed-detail-column-base--${variant}`]"
    :subdim-ik="subdimIk"
    :subdim-pc="subdimPc"
    :subdim-type="subdimType"
    :subdim-applies-to="subdimAppliesTo"
    :data-code-component="codeComponent"
  >
    <div class="feed-detail-column-base__hero" @click="$emit('open-post', heroPost)">
      <img
        v-if="heroMediaSrc"
        :src="heroMediaSrc"
        class="feed-detail-column-base__hero-img"
        loading="eager"
      />
      <div v-else class="feed-detail-column-base__hero-img feed-detail-column-base__hero-empty" />
      <div class="feed-detail-column-base__scrim" />

      <q-btn
        flat
        round
        icon="arrow_back"
        color="white"
        padding="10px"
        class="feed-detail-column-base__back"
        @click.stop="$emit('back')"
      />

      <div class="feed-detail-column-base__hero-copy">
        <q-badge :color="accentColor" :text-color="accentTextColor" class="feed-detail-column-base__badge">
          {{ heroPost?.postTypeLabel || badgeLabel }}
        </q-badge>
        <h2>{{ heroPost?.venueName || heroPost?.title || title }}</h2>
        <p v-if="heroSubtitle">{{ heroSubtitle }}</p>
      </div>
    </div>

    <div class="feed-detail-column-base__ctas">
      <q-btn
        v-for="action in actions"
        :key="action.key"
        unelevated
        dense
        no-caps
        :outline="action.outline === true"
        :color="action.color || accentColor"
        :text-color="action.textColor || accentTextColor"
        :icon="action.icon"
        :label="action.label"
        class="feed-detail-column-base__cta"
        @click="$emit('action', action.key, heroPost, action)"
      />
    </div>

    <article class="feed-detail-column-base__focal" @click="$emit('open-post', heroPost)">
      <div class="feed-detail-column-base__focal-title">
        {{ heroPost?.caption || heroPost?.title || 'Publicacion destacada' }}
      </div>
      <div v-if="heroPost?.body" class="feed-detail-column-base__focal-body">{{ heroPost.body }}</div>
      <div class="feed-detail-column-base__focal-footer">
        <span>{{ openLabel }}</span>
        <q-icon name="chevron_right" :color="accentColor" size="18px" />
      </div>
    </article>

    <section class="feed-detail-column-base__section">
      <div class="feed-detail-column-base__section-title">
        <q-icon :name="sectionIcon" :color="accentColor" size="15px" />
        <span>{{ sectionTitle }}</span>
      </div>

      <div v-if="columnPosts.length" class="feed-detail-column-base__rows">
        <button
          v-for="post in columnPosts"
          :key="post.id"
          type="button"
          :class="[
            'feed-detail-column-base__row',
            post.id === heroPost?.id && 'feed-detail-column-base__row--active',
          ]"
          @click="$emit('select-post', post)"
        >
          <img
            v-if="getPostSrc(post)"
            :src="getPostSrc(post)"
            class="feed-detail-column-base__row-img"
            loading="lazy"
          />
          <div v-else class="feed-detail-column-base__row-img feed-detail-column-base__row-empty" />
          <div class="feed-detail-column-base__row-body">
            <q-badge
              :color="resolveBadgeColor(post)"
              :text-color="resolveBadgeTextColor(post)"
              class="feed-detail-column-base__row-badge"
            >
              {{ post.postTypeLabel || badgeLabel }}
            </q-badge>
            <strong>{{ post.caption || post.title || post.venueName }}</strong>
            <small v-if="post.venueName || post.authorHandle">
              {{ post.venueName }}<span v-if="post.authorHandle"> / @{{ post.authorHandle }}</span>
            </small>
          </div>
          <q-icon name="chevron_right" color="grey-5" size="20px" />
        </button>
      </div>

      <div v-else class="feed-detail-column-base__empty">{{ emptyMessage }}</div>
    </section>

    <slot name="after" :hero-post="heroPost" :posts="posts" />
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { usePostMedia } from '@antojados/ui/services/useNormalizedMedia'

const props = defineProps({
  heroPost: { type: Object, default: null },
  posts: { type: Array, default: () => [] },
  variant: {
    type: String,
    default: 'vasIr',
    validator: (value) => ['vasIr', 'arre', 'neta', 'banda', 'negocio', 'perfil'].includes(value),
  },
  actions: { type: Array, default: () => [] },
  title: { type: String, default: 'Detalle' },
  badgeLabel: { type: String, default: 'POST' },
  sectionTitle: { type: String, default: 'Publicaciones activas' },
  sectionIcon: { type: String, default: 'campaign' },
  openLabel: { type: String, default: 'Ver publicacion completa' },
  emptyMessage: { type: String, default: 'Sin publicaciones activas' },
  subdimIk: { type: String, default: '' },
  subdimPc: { type: String, default: '' },
  subdimType: { type: String, default: 'SUB_COMPONENT' },
  subdimAppliesTo: { type: String, default: 'all' },
  codeComponent: { type: String, default: '' },
})

defineEmits(['back', 'select-post', 'open-post', 'action'])

const { thumbSrc: heroMediaSrc, mediaSrc: heroMediaFallback } = usePostMedia(() => props.heroPost)

function getPostSrc(post) {
  return usePostMedia(() => post).thumbSrc.value || usePostMedia(() => post).mediaSrc.value || ''
}

const accentColor = computed(() => (props.variant === 'arre' ? 'deep-purple-6' : 'primary'))
const accentTextColor = computed(() => (props.variant === 'arre' ? 'white' : 'dark'))
const heroSubtitle = computed(() => {
  const post = props.heroPost
  if (!post) return ''
  const bits = []
  if (post.authorHandle) bits.push(`@${post.authorHandle}`)
  if (post.channel === 'arre') bits.push('canal Arre')
  else if (post.venueName) bits.push(post.venueName)
  return bits.join(' / ')
})
const columnPosts = computed(() =>
  (props.posts || []).filter((post) => post && post.id !== props.heroPost?.id),
)

function resolveBadgeColor(post) {
  if (props.variant === 'arre' || post?.postType === 'event') return 'deep-purple-6'
  if (post?.postType === 'promo') return 'orange-5'
  if (post?.postType === 'discount') return 'green-6'
  return 'primary'
}

function resolveBadgeTextColor(post) {
  if (props.variant === 'arre' || post?.postType === 'event') return 'white'
  return 'dark'
}
</script>

<style scoped>
.feed-detail-column-base {
  min-height: 100%;
  padding-bottom: 18px;
  background: #0a0c12;
  color: var(--app-text-primary);
}

.feed-detail-column-base__hero {
  position: relative;
  min-height: 260px;
  overflow: hidden;
  background: #05070b;
  cursor: pointer;
}

.feed-detail-column-base__hero-img,
.feed-detail-column-base__hero-empty {
  width: 100%;
  height: 300px;
  display: block;
  object-fit: contain;
  background: #000;
}

.feed-detail-column-base__hero-empty,
.feed-detail-column-base__row-empty {
  background: linear-gradient(135deg, #141824, #06080d);
}

.feed-detail-column-base__scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.78), transparent 58%);
}

.feed-detail-column-base__back {
  position: absolute;
  top: 14px;
  left: 12px;
  z-index: 3;
}

.feed-detail-column-base__hero-copy {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 18px;
  z-index: 2;
  display: grid;
  gap: 7px;
}

.feed-detail-column-base__badge,
.feed-detail-column-base__row-badge {
  width: max-content;
  font-weight: 800;
}

.feed-detail-column-base__hero-copy h2 {
  margin: 0;
  font-size: 28px;
  line-height: 1.08;
}

.feed-detail-column-base__hero-copy p {
  margin: 0;
  color: rgba(255, 255, 255, 0.78);
  font-size: 13px;
  font-weight: 700;
}

.feed-detail-column-base__ctas {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  padding: 14px 12px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.feed-detail-column-base__cta {
  min-height: 44px;
  border-radius: 6px;
  font-weight: 800;
}

.feed-detail-column-base__focal {
  margin: 16px 12px 20px;
  padding: 16px;
  border: 1px solid rgba(245, 158, 11, 0.22);
  border-radius: 8px;
  background: #121722;
  cursor: pointer;
}

.feed-detail-column-base--arre .feed-detail-column-base__focal {
  border-color: rgba(124, 58, 237, 0.32);
}

.feed-detail-column-base__focal-title {
  font-size: 19px;
  font-weight: 850;
  line-height: 1.2;
}

.feed-detail-column-base__focal-body {
  margin-top: 8px;
  color: var(--app-text-secondary);
}

.feed-detail-column-base__focal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 16px;
  color: var(--app-primary);
  font-size: 13px;
  font-weight: 800;
}

.feed-detail-column-base__section {
  padding: 0 12px;
}

.feed-detail-column-base__section-title {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 10px;
  color: rgba(255, 255, 255, 0.56);
  font-size: 13px;
  font-weight: 900;
  text-transform: uppercase;
}

.feed-detail-column-base__rows {
  display: grid;
}

.feed-detail-column-base__row {
  width: 100%;
  display: grid;
  grid-template-columns: 74px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 13px 0;
  border: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  color: inherit;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.feed-detail-column-base__row--active {
  opacity: 0.62;
}

.feed-detail-column-base__row-img {
  width: 74px;
  height: 74px;
  border-radius: 8px;
  object-fit: cover;
  display: block;
}

.feed-detail-column-base__row-body {
  min-width: 0;
  display: grid;
  gap: 5px;
}

.feed-detail-column-base__row-body strong {
  overflow: hidden;
  color: #fff;
  font-size: 16px;
  line-height: 1.15;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.feed-detail-column-base__row-body small {
  overflow: hidden;
  color: var(--app-text-secondary);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.feed-detail-column-base__empty {
  padding: 22px 0;
  color: var(--app-text-secondary);
  text-align: center;
}
</style>
