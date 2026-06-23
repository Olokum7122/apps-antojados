<template>
  <section class="antojados-tabs-shell">
    <top-bar-tabs-base
      :model-value="activeTab"
      :tabs="antojadosTabs"
      :grid-columns="antojadosTabs.length"
      level="AREA"
      :parent-context="DIMENSION_CONTEXTS.RED"
      class="q-mb-md"
      @update:model-value="activeTab = $event"
    />

    <barrio-feed-component v-if="activeTab === 'barrio'" />
    <pa-ti-tabs-component v-else-if="activeTab === 'pa-ti'" />
    <en-el-desma-feed-component v-else-if="activeTab === 'en-el-desma'" />
    <la-banda-tabs-component v-else-if="activeTab === 'la-banda'" />
    <mi-rollo-component v-else />
  </section>
</template>

<script setup>
import { ref } from 'vue'
import TopBarTabsBase from '@antojados/ui/base/TopBarTabsBase.vue'
import BarrioFeedComponent from '@antojados/ui/app/components/antojados/BarrioFeedComponent.vue'
import PaTiTabsComponent from '@antojados/ui/app/components/antojados/PaTiTabsComponent.vue'
import EnElDesmaFeedComponent from '@antojados/ui/app/components/antojados/EnElDesmaFeedComponent.vue'
import LaBandaTabsComponent from '@antojados/ui/app/components/antojados/LaBandaTabsComponent.vue'
import MiRolloComponent from '@antojados/ui/app/components/antojados/MiRolloComponent.vue'
import { DIMENSION_CONTEXTS, RED_TABS } from '@antojados/ui/dimensions/navigationDimensions.js'

const activeTab = ref('barrio')
const antojadosTabs = RED_TABS
</script>

<style scoped>
.antojados-tabs-shell {
  width: 100%;
}
</style>
