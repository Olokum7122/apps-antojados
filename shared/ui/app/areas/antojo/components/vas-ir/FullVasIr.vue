<template>
  <section class="vasir-full-view">
    <feed-fullscreen-base
      v-model="open"
      :post="currentPost"
      :show-action-rail="true"
      :action-rail-actions="vasIrActions"
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
      @rail-action="onRailAction"
    >
      <template #media="{ post }">
        <div class="vasir-full-hero">
          <q-img
            v-if="post.mediaUrl"
            :src="post.mediaUrl"
            class="vasir-full-hero__img"
            fit="cover"
          />
          <div v-else class="vasir-full-hero__fallback" />
          <div class="vasir-full-hero__gallery">
            <q-chip
              v-for="thumb in heroThumbs"
              :key="thumb.id"
              clickable
              @click="currentPost = thumb"
            >
              {{ thumb.title }}
            </q-chip>
          </div>
        </div>
      </template>

      <template #default="{ post }">
        <div class="vasir-full-copy">
          <div class="vasir-full-copy__title">{{ post.title }}</div>
          <div class="vasir-full-copy__body">{{ post.caption || 'Vista completa de Vas Ir' }}</div>
        </div>
      </template>
    </feed-fullscreen-base>
  </section>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import FeedFullscreenBase from '@antojados/ui/base/FeedFullscreenBase.vue'
import { bizFeedService } from '@antojados/api/services'
import { useLocationScope } from '@antojados/api/composables/useLocationScope'

const open = ref(true)
const currentPost = ref({})
const heroThumbs = ref([])
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
    heroThumbs.value = feedPosts.slice(0, 5).map((post) => ({
      id: post.id,
      title: post.venueName || post.authorHandle || 'Vas Ir',
      mediaUrl: post.mediaUrl,
      caption: post.caption,
    }))
    currentPost.value = heroThumbs.value[0] || {}
  } catch {
    heroThumbs.value = []
    currentPost.value = {}
  }
}

onMounted(async () => {
  await loadFeed()
})

watch([scopeLevel, scopeCode], () => {
  void loadFeed()
})

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
