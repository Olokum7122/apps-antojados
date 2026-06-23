<template>
  <section class="vasir-card-view">
    <feed-filter-bar-base
      :city-label="cityLabel"
      :scope-options="scopeOptions"
      :active-scope-level="scopeLevel"
      :no-filter-mode="false"
      :is-filter-open="false"
      :spots-count="spotsCount"
      accent-color="primary"
      subdim-ik="VASIR_CARD_FILTER"
      subdim-pc="ANTOJO.VAS_IR"
      subdim-type="SUB_COMPONENT"
      subdim-applies-to="all"
      code-component="VAS_IR.CARD_FILTER"
      class="q-mb-sm"
      @select-scope="selectScope"
      @refresh="loadFeed"
    />

    <entity-grid-base
      :columns="columns"
      :rows="catalogRows"
      row-key="id"
      empty-message="Sin cartas de Vas Ir"
      subdim-ik="VASIR_CATALOG"
      subdim-pc="ANTOJO.VAS_IR"
      subdim-type="SUB_COMPONENT"
      subdim-applies-to="all"
      code-component="VAS_IR.CATALOG_GRID"
    >
      <template #cell-preview="{ row }">
        <div class="vasir-catalog-card">
          <q-img
            v-if="row.mediaUrl"
            :src="row.mediaUrl"
            :ratio="16 / 10"
            class="vasir-catalog-card__img"
          />
          <div v-else class="vasir-catalog-card__img vasir-catalog-card__img--fallback" />
          <div class="vasir-catalog-card__title">{{ row.title }}</div>
        </div>
      </template>
    </entity-grid-base>

    <div v-if="errorMessage" class="text-negative text-caption q-mt-sm">{{ errorMessage }}</div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import FeedFilterBarBase from '@antojados/ui/base/FeedFilterBarBase.vue'
import EntityGridBase from '@antojados/ui/base/EntityGridBase.vue'
import { bizFeedService } from '@antojados/api/services'
import { useLocationScope } from '@antojados/api/composables/useLocationScope'

const spotsCount = ref(0)
const posts = ref([])
const errorMessage = ref('')
const { cityCode, cityLabel, scopeLevel, scopeCode, scopeOptions, selectScope } = useLocationScope('vas_ir')

const columns = [
  { key: 'preview', label: 'Carta' },
  { key: 'venue', label: 'Lugar' },
  { key: 'type', label: 'Tipo' },
]

const catalogRows = computed(() =>
  posts.value.slice(0, 9).map((post, index) => ({
    id: post.id,
    preview: post.mediaUrl || '',
    venue: post.venueName || post.authorHandle || `Vas Ir ${index + 1}`,
    type: post.mediaType || 'post',
    title: post.caption || post.venueName || 'Carta Vas Ir',
    mediaUrl: post.mediaUrl,
  })),
)

async function loadFeed() {
  try {
    const feedPosts = await bizFeedService.list({
      feedScope: 'vas_ir',
      page: 1,
      limit: 18,
      cityCode: cityCode.value,
      scopeLevel: scopeLevel.value,
      scopeCode: scopeCode.value,
    })
    posts.value = feedPosts
    spotsCount.value = feedPosts.length
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudo cargar Carta Vas Ir'
  }
}

onMounted(async () => {
  await loadFeed()
})

watch([scopeLevel, scopeCode], () => {
  void loadFeed()
})
</script>
