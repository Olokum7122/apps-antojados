<template>
  <article :class="classes.root" role="status" aria-label="Cargando publicación">
    <header :class="classes.head">
      <div :class="classes.avatar" />
      <div :class="classes.metaGroup">
        <div :class="classes.authorBar" />
        <div :class="classes.tagBar" />
      </div>
    </header>
    <div :class="classes.media" />
    <section :class="classes.body">
      <div :class="classes.captionBar" />
      <div :class="classes.captionBarShort" />
    </section>
    <footer :class="classes.actions">
      <div v-for="i in 3" :key="i" :class="classes.actionIcon" />
    </footer>
  </article>
</template>

<script setup>
const classes = {
  root: 'feed-skeleton-card',
  head: 'feed-skeleton-card__head',
  avatar: 'feed-skeleton-card__avatar',
  metaGroup: 'feed-skeleton-card__meta-group',
  authorBar: 'feed-skeleton-card__author-bar',
  tagBar: 'feed-skeleton-card__tag-bar',
  media: 'feed-skeleton-card__media',
  body: 'feed-skeleton-card__body',
  captionBar: 'feed-skeleton-card__caption-bar',
  captionBarShort: 'feed-skeleton-card__caption-bar--short',
  actions: 'feed-skeleton-card__actions',
  actionIcon: 'feed-skeleton-card__action-icon',
}
</script>

<style scoped>
.feed-skeleton-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  animation: feed-skeleton-card-pulse 1.6s ease-in-out infinite;
}

.feed-skeleton-card__head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.feed-skeleton-card__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}

.feed-skeleton-card__meta-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.feed-skeleton-card__author-bar {
  height: 12px;
  width: 120px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.10);
}

.feed-skeleton-card__tag-bar {
  height: 10px;
  width: 80px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.06);
}

.feed-skeleton-card__media {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
}

.feed-skeleton-card__body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.feed-skeleton-card__caption-bar {
  height: 10px;
  width: 85%;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
}

.feed-skeleton-card__caption-bar--short {
  height: 10px;
  width: 55%;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.06);
}

.feed-skeleton-card__actions {
  display: flex;
  gap: 16px;
  padding-top: 4px;
}

.feed-skeleton-card__action-icon {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.06);
}

@keyframes feed-skeleton-card-pulse {
  0% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.6;
  }
}
</style>
