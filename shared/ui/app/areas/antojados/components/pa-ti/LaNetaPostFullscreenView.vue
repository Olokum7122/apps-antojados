<template>
  <section class="la-neta-post-fullscreen-view">
    <feed-fullscreen-base
      :model-value="true"
      stage="S3"
      presentation="inline"
      variant="neta"
      :post="post"
      :show-action-rail="true"
      :action-rail-actions="actions"
      action-rail-density="compact"
      media-fit="contain"
      :show-comments="false"
      subdim-ik="LA_NETA_FULLSCREEN"
      subdim-pc="ANTOJADOS.PARA_TI.LA_NETA"
      subdim-type="FULLSCREEN"
      subdim-applies-to="all"
      code-component="LA_NETA.FULLSCREEN"
      @close="goBack"
      @rail-action="onRailAction"
    >
      <template #overlay="{ post: item }">
        <div class="la-neta-post-fullscreen-view__copy">
          <button type="button" class="la-neta-post-fullscreen-view__author" @click.stop="goUser(item)">
            @{{ item.authorHandle || item.author }}
          </button>
          <button
            v-if="item.venueName || item.venue"
            type="button"
            class="la-neta-post-fullscreen-view__venue"
            @click.stop="goVenue(item)"
          >
            <q-icon name="place" size="13px" />
            {{ item.venueName || item.venue }}
          </button>
          <q-badge color="primary" text-color="dark">{{ item.momentTag || 'LA NETA' }}</q-badge>
          <p>{{ item.caption }}</p>
        </div>
      </template>

      <template #quickInput>
        <form
          class="la-neta-post-fullscreen-view__review"
          subdim-ik="LA_NETA_REVIEW_PANEL"
          subdim-pc="ANTOJADOS.PARA_TI.LA_NETA"
          subdim-type="SUB_COMPONENT"
          subdim-applies-to="all"
          data-code-component="LA_NETA.REVIEW_PANEL"
          @submit.prevent="submitReview"
        >
          <input
            v-model.trim="reviewDraft"
            class="la-neta-post-fullscreen-view__review-input"
            placeholder="Que opinas de lo que publico..."
            autocomplete="off"
          />
          <q-btn
            flat
            round
            dense
            icon="send"
            color="deep-orange-4"
            size="sm"
            type="submit"
            :disable="!reviewDraft"
          />
        </form>
      </template>
    </feed-fullscreen-base>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FeedFullscreenBase from '@antojados/ui/base/FeedFullscreenBase.vue'
import { useLocationScope } from '@antojados/api/composables/useLocationScope'
import { useSocialActionSync } from '@antojados/api/composables/useSocialActionSync'
import { socialFeedService } from '@antojados/api/services'

const route = useRoute()
const router = useRouter()
const { pushEvent } = useSocialActionSync()
const { cityCode, scopeLevel, scopeCode } = useLocationScope('la_neta')
const post = ref(null)
const reviewDraft = ref('')
const actions = computed(() => [
  { key: 'chocalas', label: 'Chocalas', icon: 'front_hand', count: post.value?.likesCount ?? 0 },
  { key: 'califica', label: 'Califica', icon: 'star_outline', count: 0 },
  { key: 'pasala', label: 'Pasala', icon: 'reply', count: post.value?.commentsCount ?? 0 },
  { key: 'morral', label: 'Morral', icon: 'backpack', count: 0 },
  { key: 'compa', label: 'Tu compa', icon: 'person_add_alt_1', count: 0 },
])

watch(
  () => [route.params.post_id, route.query.user_id],
  async ([postId, userId]) => {
    const resolvedPostId = String(postId || '')
    const resolvedUserId = String(userId || '')

    if (!resolvedPostId) {
      post.value = null
      reviewDraft.value = ''
      return
    }

    const directPost = await socialFeedService.getById(resolvedPostId, 'la-neta')
    if (directPost?.id === resolvedPostId) {
      post.value = directPost
      reviewDraft.value = ''
      return
    }

    if (resolvedUserId) {
      const userPosts = await socialFeedService.listByUser(resolvedUserId, 'la-neta')
      post.value = userPosts.find((item) => item.id === resolvedPostId) || userPosts[0] || null
    } else {
      post.value = directPost
    }

    reviewDraft.value = ''
  },
  { immediate: true },
)

function goBack() {
  const resolvedUserId = String(route.query.user_id || post.value?.userId || '')
  if (resolvedUserId) {
    router.push(`/red/pa-ti/la-neta/usuario/${resolvedUserId}?post_id=${post.value?.id || ''}`)
    return
  }
  router.push('/red/pa-ti/la-neta')
}

function goUser(item) {
  if (!item?.userId) return
  router.push(`/red/pa-ti/la-neta/usuario/${item.userId}?post_id=${item.id}`)
}

function goVenue(item) {
  if (!item?.place_id) return
  router.push(`/negocio/${item.place_id}`)
}

function syncAction(eventType, payload) {
  return pushEvent({
    eventType,
    postId: post.value?.id,
    placeId: post.value?.placeId || post.value?.place_id,
    userId: post.value?.userId,
    targetUserId: post.value?.userId,
    scopeLevel: scopeLevel.value,
    scopeCode: scopeCode.value,
    cityCode: cityCode.value,
    feedScope: 'la-neta',
    channel: post.value?.channel || 'social',
    payload,
  })
}

function onRailAction(actionKey) {
  if (actionKey === 'chocalas') void syncAction('post_like')
  if (actionKey === 'califica' && (post.value?.placeId || post.value?.place_id)) {
    void syncAction('place_rating', {
      source: 'la_neta_fullscreen',
      contributes_to_ranking: true,
      contributes_to_sponsor_metrics: true,
      rating_origin: 'user_domain',
    })
  }
  if (actionKey === 'pasala') void syncAction('post_share')
  if (actionKey === 'morral') void syncAction('post_save')
  if (actionKey === 'compa') void syncAction('user_follow')
}

function submitReview() {
  if (reviewDraft.value) {
    void syncAction('post_comment', { text: reviewDraft.value, source: 'la_neta_review' })
  }
  reviewDraft.value = ''
}
</script>

<style scoped>
.la-neta-post-fullscreen-view {
  min-height: 100%;
  background: #000;
}

.la-neta-post-fullscreen-view__copy {
  display: grid;
  justify-items: start;
  gap: 6px;
}

.la-neta-post-fullscreen-view__copy p {
  margin: 0;
  color: rgba(255, 255, 255, 0.86);
}

.la-neta-post-fullscreen-view__author,
.la-neta-post-fullscreen-view__venue {
  border: 0;
  padding: 0;
  color: #fff;
  background: transparent;
  font: inherit;
  font-weight: 850;
}

.la-neta-post-fullscreen-view__venue {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
}

.la-neta-post-fullscreen-view__review {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  padding: 8px;
  border-radius: 999px;
  background: rgba(10, 12, 18, 0.88);
  backdrop-filter: blur(10px);
}

.la-neta-post-fullscreen-view__review-input {
  width: 100%;
  min-height: 38px;
  padding: 0 12px;
  border: 0;
  border-radius: 999px;
  outline: 0;
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}
</style>
