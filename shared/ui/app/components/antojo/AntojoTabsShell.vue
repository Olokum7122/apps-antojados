<template>
  <section class="antojo-tabs-shell">
    <tab-bar-component-base
      :model-value="activeTab"
      :tabs="antojoTabs"
      :grid-columns="antojoTabs.length"
      level="AREA"
      :parent-context="DIMENSION_CONTEXTS.ANTOJO"
      class="q-mb-md"
      @update:model-value="activeTab = $event"
    />

    <vas-ir-feed-component v-if="activeTab === 'vas-ir'" />
    <arre-feed-component v-else-if="activeTab === 'arre'" />
    <los-chidos-feed-component v-else-if="activeTab === 'los-chidos'" />
    <no-vas-ir-panel v-else-if="activeTab === 'no-vas-ir'" />
    <mi-chamba-panel v-else />
  </section>
</template>

<script setup>
import { ref } from 'vue'
import TabBarComponentBase from '@antojados/ui/base/TabBarComponentBase.vue'
import VasIrFeedComponent from '@antojados/ui/app/components/feed/VasIrFeedComponent.vue'
import ArreFeedComponent from '@antojados/ui/app/components/antojo/ArreFeedComponent.vue'
import LosChidosFeedComponent from '@antojados/ui/app/components/antojo/LosChidosFeedComponent.vue'
import NoVasIrPanel from '@antojados/ui/app/areas/antojo/components/NoVasIrPanel.vue'
import MiChambaPanel from '@antojados/ui/app/areas/antojo/components/MiChambaPanel.vue'
import { ANTOJO_TABS, DIMENSION_CONTEXTS } from '@antojados/ui/dimensions/navigationDimensions.js'

const activeTab = ref('vas-ir')
const antojoTabs = ANTOJO_TABS
</script>

<style scoped>
.antojo-tabs-shell {
  width: 100%;
}
</style>
