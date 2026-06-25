<template>
  <section class="vasir-full-view">
    <feed-fullscreen-base
      :model-value="true"
      stage="S3"
      presentation="inline"
      :post="currentPost"
      :show-action-rail="true"
      :action-rail-actions="vasIrActions"
      action-rail-density="compact"
      media-fit="cover"
      :associated-items="associatedPosts"
      associated-variant="businessMasonry"
      associated-model="androidMosaic"
      associated-tile-variant="business"
      action-rail-subdim-ik="VASIR_ACTION_RAIL"
      action-rail-subdim-pc="ANTOJO.VAS_IR"
      action-rail-subdim-type="SUB_COMPONENT"
      action-rail-subdim-applies-to="all"
      action-rail-code-component="VAS_IR.ACTION_RAIL"
      subdim-ik="VASIR_FULLSCREEN"
      subdim-pc="ANTOJO.VAS_IR"
      subdim-type="FULLSCREEN"
      subdim-applies-to="all"
      code-component="VAS_IR.FULLSCREEN"
      @close="goBack"
      @rail-action="onRailAction"
      @select-associated="openAssociatedPost"
    >
      <template #overlay="{ post }">
        <div class="vasir-full-copy">
          <q-badge color="primary" text-color="dark">VAS IR</q-badge>
          <div class="vasir-full-copy__title">{{ post.title }}</div>
          <div class="vasir-full-copy__body">{{ post.caption || 'Vista completa de Vas Ir' }}</div>
        </div>
      </template>
    </feed-fullscreen-base>
  </section>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import FeedFullscreenBase from '@antojados/ui/base/FeedFullscreenBase.vue'
import { bizFeedService } from '@antojados/api/services'
import { useLocationScope } from '@antojados/api/composables/useLocationScope'

const router = useRouter()
const currentPost = ref({})
const associatedPosts = ref([])
const { cityCode, scopeLevel, scopeCode } = useLocationScope('vas_ir')
const vasIrActions = ref([
  { key: 'chocalas', label: 'Chocalas', icon: 'front_hand', count: 0 },
  { key: 'pasala', label: 'Pasala', icon: 'reply', count: 0 },
  { key: 'morral', label: 'Morral', icon: 'backpack', count: 0 },
  { key: 'maps', label: 'Maps', icon: 'map', count: 0 },
])

async function loadFeed() {
  try {
    const feedPosts = await bizFeedService.list({
      feedScope: 'vas_ir',
      page: 1,
      limit: 12,
      cityCode: cityCode.value,
      scopeLevel: scopeLevel.value,
      scopeCode: scopeCode.value,
    })
    currentPost.value = feedPosts[0] || {}
    associatedPosts.value = feedPosts.slice(1)
  } catch {
    currentPost.value = {}
    associatedPosts.value = []
  }
}

onMounted(async () => {
  await loadFeed()
})

watch([scopeLevel, scopeCode], () => {
  void loadFeed()
})

function goBack() {
  router.push('/antojo/vas-ir/gallery')
}

function openAssociatedPost(item) {
  if (!item?.id) return
  const nextCurrent = associatedPosts.value.find((post) => post.id === item.id) || item
  associatedPosts.value = [
    currentPost.value,
    ...associatedPosts.value.filter((post) => post.id !== item.id),
  ].filter((post) => post?.id)
  currentPost.value = nextCurrent
}

function onRailAction(actionKey) {
  if (
    actionKey === 'chocalas' ||
    actionKey === 'pasala' ||
    actionKey === 'morral' ||
    actionKey === 'maps'
  ) {
    return
  }
}
</script>

<style scoped>
.vasir-full-view {
  min-height: 100%;
  background: #000;
}

.vasir-full-copy {
  display: grid;
  gap: 6px;
}

.vasir-full-copy__title {
  font-weight: 800;
}

.vasir-full-copy__body {
  color: rgba(255, 255, 255, 0.78);
}
</style>
