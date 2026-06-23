<template>
  <q-page class="q-pa-md app-page-bg">
    <antojo-shell />
    <router-view />
  </q-page>
</template>

<script setup>
import AntojoShell from '@antojados/ui/app/areas/antojo/AntojoShell.vue'
</script>

<style scoped>
.app-page-bg {
  min-width: 0;
  overflow-x: hidden;
}
</style>
