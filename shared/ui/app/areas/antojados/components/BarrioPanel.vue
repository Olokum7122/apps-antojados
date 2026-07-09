<template>
  <section class="barrio-panel">
    <app-empty-state message="Barrio — próximamente" />
  </section>
</template>

<script setup>
import AppEmptyState from '@antojados/ui/base/AppEmptyState.vue'
</script>

<style scoped>
.barrio-panel { width: 100%; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0a0c12; }
</style>

