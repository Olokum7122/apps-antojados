<template>
  <div class="antojo-shell q-mb-md">
    <tab-bar-component-base
      :model-value="tab"
      :tabs="visibleTabs"
      :grid-columns="visibleTabs.length"
      level="AREA"
      :parent-context="DIMENSION_CONTEXTS.ANTOJO"
      @update:model-value="onTabChange"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TabBarComponentBase from '@antojados/ui/base/TabBarComponentBase.vue'
import {
  ANTOJO_TABS,
  DIMENSION_CONTEXTS,
  findTabByName,
  resolveAntojoTab,
} from '@antojados/ui/dimensions/navigationDimensions.js'

const route = useRoute()
const router = useRouter()
const tab = ref('vas-ir')

const visibleTabs = computed(() => ANTOJO_TABS)

function onTabChange(next) {
  const selected = findTabByName(visibleTabs.value, next)
  if (selected?.to && route.path !== selected.to) {
    router.push(selected.to)
  }
}

watch(
  () => route.path,
  (path) => {
    tab.value = resolveAntojoTab(path)
  },
  { immediate: true },
)
</script>

<style scoped>
.antojo-shell {
  width: 100%;
}
</style>
