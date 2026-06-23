<template>
  <div class="antojados-shell">
    <top-bar-tabs-base
      :model-value="tab"
      :tabs="visibleTabs"
      :grid-columns="visibleTabs.length"
      level="MODULE"
      :parent-context="DIMENSION_CONTEXTS.RED"
      class="q-mb-md"
      @update:model-value="onTabChange"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TopBarTabsBase from '@antojados/ui/base/TopBarTabsBase.vue'
import {
  DIMENSION_CONTEXTS,
  RED_TABS,
  findTabByName,
  resolveRedTab,
} from '@antojados/ui/dimensions/navigationDimensions.js'

const route = useRoute()
const router = useRouter()

const tab = ref('barrio')

const visibleTabs = computed(() => RED_TABS)

function onTabChange(next) {
  const selected = findTabByName(visibleTabs.value, next)
  if (selected?.to && route.path !== selected.to) {
    router.push(selected.to)
  }
}

watch(
  () => route.path,
  (path) => {
    tab.value = resolveRedTab(path)
  },
  { immediate: true },
)
</script>

<style scoped>
.antojados-shell {
  width: 100%;
}
</style>
