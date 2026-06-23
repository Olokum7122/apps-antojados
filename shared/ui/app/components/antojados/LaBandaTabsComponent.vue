<template>
  <section class="la-banda-tabs-component">
    <tab-bar-sub-dimension-base
      :model-value="activeSubTab"
      :tabs="laBandaTabs"
      :grid-columns="2"
      level="SUBTAB"
      :parent-context="DIMENSION_CONTEXTS.COMUNIDAD"
      class="q-mb-md"
      @update:model-value="activeSubTab = $event"
    />

    <acarreados-component />
  </section>
</template>

<script setup>
import { ref } from 'vue'
import TabBarSubDimensionBase from '@antojados/ui/base/TabBarSubDimensionBase.vue'
import AcarreadosComponent from '@antojados/ui/app/components/antojados/AcarreadosComponent.vue'
import { DIMENSION_CONTEXTS, LA_BANDA_TABS } from '@antojados/ui/dimensions/navigationDimensions.js'

const activeSubTab = ref('acarreados')
const laBandaTabs = LA_BANDA_TABS
</script>

<style scoped>
.la-banda-tabs-component {
  width: 100%;
}
</style>
