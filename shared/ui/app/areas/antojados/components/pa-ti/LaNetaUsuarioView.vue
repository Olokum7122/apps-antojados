<template>
  <section class="la-neta-usuario-view">
    <feed-detail-column-base
      :hero-post="heroPost"
      :posts="userPosts"
      variant="neta"
      :title="profileTitle"
      badge-label="LA NETA"
      section-title="Resenas del usuario"
      section-icon="rate_review"
      open-label="Ver resena completa"
      empty-message="Sin resenas de este usuario"
      :actions="actions"
      subdim-ik="LA_NETA_USER_S2"
      subdim-pc="ANTOJADOS.PARA_TI.LA_NETA"
      subdim-type="SCREEN"
      subdim-applies-to="all"
      code-component="LA_NETA.USER_S2"
      @back="goBack"
      @select-post="selectPost"
      @open-post="openPost"
      @action="onAction"
    />

    <publish-fab-base
      color="primary"
      text-color="dark"
      tooltip="Publicar en La Neta"
      title="Di La Neta"
      body="Sube una resena con foto y cuenta como estuvo el lugar."
      confirm-label="Publicar ->"
      guide-icon="rate_review"
      image-src="/media/shared/publicar.png"
      subdim-ik="BTN_PUBLICAR"
      subdim-pc="ANTOJADOS.PARA_TI.LA_NETA"
      subdim-type="BUTTON"
      subdim-applies-to="all"
      code-component="LA_NETA.PUBLICAR"
      @confirm="onPublish"
    />
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FeedDetailColumnBase from '@antojados/ui/base/FeedDetailColumnBase.vue'
import PublishFabBase from '@antojados/ui/base/PublishFabBase.vue'
import { useLocationScope } from '@antojados/api/composables/useLocationScope'
import { useSocialActionSync } from '@antojados/api/composables/useSocialActionSync'
import { socialFeedService } from '@antojados/api/services'

const route = useRoute()
const router = useRouter()
const { pushEvent } = useSocialActionSync()
const { cityCode, scopeLevel, scopeCode } = useLocationScope('la_neta')
const userPosts = ref([])
const selectedPostId = ref(String(route.query.post_id || ''))
const heroPost = computed(() => {
  return userPosts.value.find((post) => post.id === selectedPostId.value) || userPosts.value[0] || null
})
const profileTitle = computed(() => `@${heroPost.value?.authorHandle || heroPost.value?.author || 'usuario'}`)
const actions = [
  { key: 'compa', label: 'Tu compa', icon: 'person_add_alt_1', color: 'primary', textColor: 'dark' },
  { key: 'califica', label: 'Califica', icon: 'star', color: 'deep-purple-6', textColor: 'white' },
  { key: 'pasala', label: 'Pasala', icon: 'reply', color: 'grey-8', textColor: 'white' },
]

watch(
  () => [route.params.user_id, route.query.post_id],
  async ([userId, postId]) => {
    const resolvedUserId = String(userId || '')
    userPosts.value = resolvedUserId ? await socialFeedService.listByUser(resolvedUserId, 'la-neta') : []
    selectedPostId.value = String(postId || userPosts.value[0]?.id || '')
  },
  { immediate: true },
)

function goBack() {
  router.push('/red/pa-ti/la-neta')
}

function selectPost(post) {
  selectedPostId.value = post.id
}

function openPost(post) {
  if (!post?.id) return
  router.push(`/red/pa-ti/la-neta/post/${post.id}?user_id=${post.userId || route.params.user_id || ''}`)
}

function syncHeroAction(eventType, payload) {
  return pushEvent({
    eventType,
    postId: heroPost.value?.id,
    placeId: heroPost.value?.placeId || heroPost.value?.place_id,
    userId: heroPost.value?.userId,
    targetUserId: heroPost.value?.userId,
    scopeLevel: scopeLevel.value,
    scopeCode: scopeCode.value,
    cityCode: cityCode.value,
    feedScope: 'la-neta',
    channel: heroPost.value?.channel || 'social',
    payload,
  })
}

function onAction(actionKey) {
  if (actionKey === 'pasala') openPost(heroPost.value)
  if (actionKey === 'compa') void syncHeroAction('user_follow')
  if (actionKey === 'califica' && (heroPost.value?.placeId || heroPost.value?.place_id)) {
    void syncHeroAction('place_rating', {
      source: 'la_neta_user_s2',
      contributes_to_ranking: true,
      contributes_to_sponsor_metrics: true,
      rating_origin: 'user_domain',
    })
  }
}

function onPublish() {
  router.push('/red/pa-ti/la-neta/publicar')
}
</script>

<style scoped>
.la-neta-usuario-view {
  position: relative;
  min-height: 100%;
  padding-bottom: 84px;
  background: #0a0c12;
}
</style>
