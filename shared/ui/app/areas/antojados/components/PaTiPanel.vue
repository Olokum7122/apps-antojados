<template>
  <section class="pa-ti-panel">
    <tab-bar-sub-dimension-base
      :model-value="activeSubTab"
      :tabs="paTiTabs"
      :grid-columns="2"
      level="SUBTAB"
      :parent-context="DIMENSION_CONTEXTS.PARA_TI"
      class="q-mb-md"
      @update:model-value="onSubTabChange"
    />

    <router-view />
  </section>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TabBarSubDimensionBase from '@antojados/ui/base/TabBarSubDimensionBase.vue'
import {
  DIMENSION_CONTEXTS,
  PA_TI_TABS,
  findTabByName,
  resolvePaTiTab,
} from '@antojados/ui/dimensions/navigationDimensions.js'

const router = useRouter()
const route = useRoute()
const activeSubTab = ref('pachanga')

const paTiTabs = PA_TI_TABS

const onSubTabChange = (next) => {
  const selected = findTabByName(paTiTabs, next)
  if (selected?.to) {
    router.push(selected.to)
  }
}

watch(
  () => route.path,
  (newPath) => {
    activeSubTab.value = resolvePaTiTab(newPath)
  },
  { immediate: true },
)
</script>

<style scoped>
.pa-ti-panel {
  width: 100%;
}
</style>
