<template>
  <section>
    <tab-bar-component-base
      :model-value="activeTab"
      :tabs="tabs"
      :grid-columns="5"
      :parent-context="DIMENSION_CONTEXTS.MI_CHAMBA"
      @update:model-value="onTabChange"
    />

    <router-view />
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TabBarComponentBase from '@antojados/ui/base/TabBarComponentBase.vue'
import { DIMENSION_CONTEXTS, MI_CHAMBA_TABS } from '@antojados/ui/dimensions/navigationDimensions.js'

const route = useRoute()
const router = useRouter()

const tabs = MI_CHAMBA_TABS

const activeTab = computed(() => {
  if (route.path.includes('/e-firma')) return 'e-firma'
  if (route.path.includes('/contrato')) return 'contrato'
  if (route.path.includes('/atencion')) return 'atencion'
  if (route.path.includes('/cuenta')) return 'cuenta'
  if (route.path.includes('/modulos')) return 'modulos'
  if (route.path.includes('/tiles')) return 'tiles'
  if (route.path.includes('/metricas')) return 'metricas'
  if (route.path.includes('/equipo')) return 'equipo'
  return 'registro'
})

function onTabChange(next) {
  const selected = tabs.find((tab) => tab.name === next)
  if (selected?.route && route.path !== selected.route) {
    router.push(selected.route)
  }
}
</script>
