<template>
  <section class="que-pex-usuario-view">
    <feed-detail-column-base
      :hero-post="heroPost"
      :posts="userPosts"
      variant="neta"
      :title="profileTitle"
      badge-label="QUE PEX"
      section-title="Publicaciones del usuario"
      section-icon="article"
      open-label="Ver publicacion completa"
      empty-message="Sin publicaciones de este usuario"
      :actions="actions"
      subdim-ik="QUE_PEX_USER_S2"
      subdim-pc="ANTOJADOS.PARA_TI.QUE_PEX"
      subdim-type="SCREEN"
      subdim-applies-to="all"
      code-component="QUE_PEX.USER_S2"
      @back="goBack"
      @select-post="selectPost"
      @open-post="openPost"
      @action="onAction"
    />
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FeedDetailColumnBase from '@antojados/ui/base/FeedDetailColumnBase.vue'
import { useLocationScope } from '@antojados/api/composables/useLocationScope'
import { useSocialActionSync } from '@antojados/api/composables/useSocialActionSync'
import { socialFeedService } from '@antojados/api/services'

const route = useRoute()
const router = useRouter()
const { pushEvent } = useSocialActionSync()
const { cityCode, scopeLevel, scopeCode } = useLocationScope('que_pex')
const userPosts = ref([])
const selectedPostId = ref(String(route.query.post_id || ''))
const heroPost = computed(() => {
  return userPosts.value.find((post) => post.id === selectedPostId.value) || userPosts.value[0] || null
})
const profileTitle = computed(() => `@${heroPost.value?.authorHandle || heroPost.value?.author || 'usuario'}`)
const actions = [
  { key: 'compa', label: 'Tu compa', icon: 'person_add_alt_1', color: 'primary', textColor: 'dark' },
  { key: 'pasala', label: 'Pasala', icon: 'reply', color: 'grey-8', textColor: 'white' },
]

watch(
  () => [route.params.user_id, route.query.post_id],
  async ([userId, postId]) => {
    const resolvedUserId = String(userId || '')
    userPosts.value = resolvedUserId ? await socialFeedService.listByUser(resolvedUserId, 'que-pex') : []
    selectedPostId.value = String(postId || userPosts.value[0]?.id || '')
  },
  { immediate: true },
)

function goBack() {
  router.push('/red/pa-ti/que-pex')
}

function selectPost(post) {
  selectedPostId.value = post.id
}

function openPost(post) {
  if (!post?.id) return
  router.push(`/red/pa-ti/que-pex/post/${post.id}?user_id=${post.userId || route.params.user_id || ''}`)
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
    feedScope: 'que-pex',
    channel: heroPost.value?.channel || 'social',
    payload,
  })
}

function onAction(actionKey) {
  if (actionKey === 'pasala') openPost(heroPost.value)
  if (actionKey === 'compa') void syncHeroAction('user_follow')
}
</script>

<style scoped>
.que-pex-usuario-view {
  position: relative;
  min-height: 100%;
  padding-bottom: 84px;
  background: #0a0c12;
}
</style>
