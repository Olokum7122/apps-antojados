<template>
  <q-layout view="lHh Lpr lFf" class="device-preview-layout">
    <q-header elevated class="app-brand-header">
      <q-toolbar>
        <div class="titlebar-brand-sticky">
          <img
            :src="brandImgSrc"
            class="titlebar-logo"
            alt="AntojadosMx"
            @error="onBrandImgError"
          />
        </div>
        <span class="titlebar-sep">/</span>
        <span class="titlebar-sub">{{ title }}</span>
        <q-btn flat dense no-caps class="brand-theme-trigger" @click="rotateTheme">
          <span class="brand-rainbow" aria-hidden="true" />
          <span class="brand-theme-label">Tema {{ activeThemeLabel }}</span>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer bordered class="app-brand-footer">
      <q-tabs
        dense
        class="app-main-tabs"
        indicator-color="primary"
        active-color="primary"
        align="justify"
      >
        <q-route-tab
          v-for="tab in mainTabs"
          :key="tab.name"
          :to="tab.to"
          :icon="tab.icon"
          :label="tab.label"
          :data-ik="tab.ik"
          :data-pc="tab.pc"
          :data-code-component="tab.codeComponent"
          exact
        />
      </q-tabs>
    </q-footer>
  </q-layout>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { MAIN_TABS } from '@antojados/ui/dimensions/navigationDimensions.js'
import { getActiveTheme, getAvailableThemes, setTheme } from '@antojados/ui/theme/themeManager'
import splashBrand from '@antojados/ui/assets/brand/splash.png'
import primaryBrand from '@antojados/ui/assets/brand/brand.png'
import liteBrand from '@antojados/ui/assets/brand/logolite.png'

const route = useRoute()
const themeOptions = getAvailableThemes()
const activeTheme = ref(getActiveTheme())
const BRAND_PRIMARY = splashBrand
const BRAND_SECONDARY = primaryBrand
const BRAND_FALLBACK = liteBrand
const brandImgSrc = ref(BRAND_PRIMARY)
const mainTabs = MAIN_TABS

const title = computed(() => {
  if (route.path.startsWith('/antojo')) return 'Antojo'
  if (route.path.startsWith('/yo')) return 'Tragon'
  return 'Antojados'
})

const themeLabels = {
  ambar: 'Ambar',
  aqua: 'Aqua',
  indigo: 'Indigo',
}

const activeThemeLabel = computed(() => themeLabels[activeTheme.value] || activeTheme.value)

function rotateTheme() {
  const currentIndex = themeOptions.findIndex((theme) => theme === activeTheme.value)
  const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % themeOptions.length : 0
  activeTheme.value = setTheme(themeOptions[nextIndex])
}

function onBrandImgError() {
  if (brandImgSrc.value === BRAND_PRIMARY) {
    brandImgSrc.value = BRAND_SECONDARY
    return
  }

  if (brandImgSrc.value !== BRAND_FALLBACK) {
    brandImgSrc.value = BRAND_FALLBACK
  }
}
</script>

<style scoped>
.titlebar-brand-sticky {
  position: relative;
  margin-left: -4px;
  margin-right: 2px;
  transform: translateY(5px);
  z-index: 3;
}

.titlebar-logo {
  width: min(56vw, 220px);
  max-height: 46px;
  object-fit: contain;
  flex-shrink: 0;
  display: block;
}

.titlebar-sep {
  color: rgba(255, 255, 255, 0.25);
  font-size: 12px;
  line-height: 1;
  margin: 0 4px 0 2px;
}

.titlebar-sub {
  font-weight: 500;
  font-size: 12px;
  color: var(--app-text-secondary);
}

.brand-theme-trigger {
  margin-left: auto;
  gap: 8px;
  padding-left: 10px;
  padding-right: 10px;
  border: 1px solid var(--app-border);
  border-radius: 999px;
  background: var(--app-accent-bg);
}

.brand-rainbow {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: conic-gradient(
    #ef4444 0deg,
    #f59e0b 60deg,
    #eab308 120deg,
    #22c55e 180deg,
    #06b6d4 240deg,
    #3b82f6 300deg,
    #ef4444 360deg
  );
  box-shadow: 0 0 0 2px #fff inset;
}

.brand-theme-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--app-text-accent);
  letter-spacing: 0.01em;
}

.app-brand-header {
  background: var(--bar-bg-module);
  color: var(--bar-active-text-module);
}

.app-brand-header :deep(.q-toolbar) {
  min-height: 56px;
  padding-left: 10px;
  padding-right: 10px;
  gap: 2px;
}

.app-brand-footer {
  background: var(--bar-bg-module);
  color: var(--bar-text-module);
}

.app-main-tabs :deep(.q-tab__label) {
  color: var(--bar-text-module);
}

.app-main-tabs :deep(.q-tab--active .q-tab__label),
.app-main-tabs :deep(.q-tab--active .q-icon) {
  color: var(--bar-active-text-module);
}

.device-preview-layout,
.device-preview-layout :deep(.q-page-container),
.device-preview-layout :deep(.q-page) {
  min-width: 0;
  overflow-x: hidden;
}

@media (min-width: 900px) {
  .device-preview-layout {
    width: min(430px, calc(100vw - 24px));
    margin: 12px auto;
    border: 1px solid var(--app-border);
    border-radius: 28px;
    overflow: hidden;
    box-shadow: 0 16px 38px rgba(0, 0, 0, 0.45);
    min-height: calc(100vh - 24px);
    background: var(--app-bg-start);
  }

  .device-preview-layout :deep(.q-header),
  .device-preview-layout :deep(.q-footer) {
    left: 50% !important;
    transform: translateX(-50%);
    width: min(430px, calc(100vw - 24px));
  }
}
</style>
