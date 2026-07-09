<template>
  <section class="pachanga-view">
    <app-empty-state message="Pachanga — próximamente" />
  </section>
</template>

<script setup>
import AppEmptyState from '@antojados/ui/base/AppEmptyState.vue'
</script>

<style scoped>
.pachanga-view { width: 100%; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0a0c12; }
</style>

