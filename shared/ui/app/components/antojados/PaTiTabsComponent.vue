<template>
  <section class="pa-ti-tabs-component">
    <tab-bar-sub-dimension-base
      :model-value="activeSubTab"
      :tabs="paTiTabs"
      :grid-columns="2"
      level="SUBTAB"
      :parent-context="DIMENSION_CONTEXTS.PARA_TI"
      class="q-mb-md"
      @update:model-value="activeSubTab = $event"
    />

    <pa-ti-pachanga-component v-if="activeSubTab === 'pachanga'" />
    <que-pex-feed-component v-else />
  </section>
</template>

<script setup>
import { ref } from 'vue'
import TabBarSubDimensionBase from '@antojados/ui/base/TabBarSubDimensionBase.vue'
import PaTiPachangaComponent from '@antojados/ui/app/components/antojados/PaTiPachangaComponent.vue'
import QuePexFeedComponent from '@antojados/ui/app/components/antojados/QuePexFeedComponent.vue'
import { DIMENSION_CONTEXTS, PA_TI_TABS } from '@antojados/ui/dimensions/navigationDimensions.js'

const activeSubTab = ref('pachanga')
const paTiTabs = PA_TI_TABS
</script>

<style scoped>
.pa-ti-tabs-component {
  width: 100%;
}
</style>
