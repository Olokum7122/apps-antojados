<template>
  <section v-if="access.visible">
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
import { computed, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TabBarComponentBase from '@antojados/ui/base/TabBarComponentBase.vue'
import { DIMENSION_CONTEXTS, MI_CHAMBA_TABS } from '@antojados/ui/dimensions/navigationDimensions.js'
import { gtAccessRevision, resolveGtMetadataAccessSync } from '@antojados/api/services/gt/gt-access.service'

const route = useRoute()
const router = useRouter()

const tabs = MI_CHAMBA_TABS

const access = computed(() => {
  gtAccessRevision.value
  return resolveGtMetadataAccessSync({
    ik: 'MI_CHAMBA',
    pc: 'ANTOJO',
    dim_code: 'ANTOJO.MI_CHAMBA',
    appliesTo: 'sponsor',
    level: 'COMPONENT',
    subdimType: 'COMPONENT',
    codeComponent: 'ANTOJO.MI_CHAMBA.TAB',
  })
})

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

watchEffect(() => {
  if (!access.value.visible && route.path.startsWith('/antojo/mi-chamba')) {
    router.replace('/antojo/vas-ir/gallery')
  }
})
</script>
