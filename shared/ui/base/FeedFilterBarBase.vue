<template>
  <div
    :class="['base-feed-filter-bar', `base-feed-filter-bar--${variant}`, `base-feed-filter-bar--stage-${stage.toLowerCase()}`]"
    :subdim-ik="subdimIk"
    :subdim-pc="subdimPc"
    :subdim-type="subdimType"
    :subdim-applies-to="subdimAppliesTo"
    :data-code-component="codeComponent"
  >
    <div v-if="searchEnabled" class="base-feed-filter-bar__search-wrap">
      <div class="base-feed-filter-bar__search">
        <input
          class="base-feed-filter-bar__search-input"
          :value="searchValue"
          :placeholder="searchPlaceholder"
          autocomplete="off"
          @input="$emit('update:searchValue', $event.target.value)"
          @keyup.enter="$emit('commit-search')"
        />
        <q-btn
          flat
          dense
          round
          icon="arrow_forward"
          :color="accentColor"
          size="xs"
          @click="$emit('commit-search')"
        />
        <div v-if="searchValue && suggestions.length" class="base-feed-filter-bar__suggestions">
          <button
            v-for="suggestion in suggestions"
            :key="suggestion.value || suggestion.city_code || suggestion.scope_code || suggestion.label"
            type="button"
            class="base-feed-filter-bar__suggestion"
            @click="$emit('select-suggestion', suggestion)"
          >
            <span>{{ suggestion.label || suggestion.name }}</span>
            <small v-if="suggestion.description">{{ suggestion.description }}</small>
          </button>
        </div>
      </div>
    </div>

    <div v-if="scopeOptions.length" class="base-feed-filter-bar__scopes">
      <button
        v-for="scope in scopeOptions"
        :key="`${scope.level}:${scope.code}`"
        type="button"
        :class="[
          'base-feed-filter-bar__scope-pill',
          activeScopeLevel === scope.level && 'base-feed-filter-bar__scope-pill--active',
        ]"
        @click="$emit('select-scope', scope.level)"
      >
        {{ scope.label }}
      </button>
    </div>

    <div class="base-feed-filter-bar__actions">
      <q-btn
        v-if="showCityAction"
        flat
        dense
        round
        icon="location_on"
        :color="accentColor"
        size="sm"
        @click="$emit('open-city')"
      >
        <q-tooltip>{{ cityLabel }}</q-tooltip>
      </q-btn>
      <q-btn
        flat
        dense
        round
        icon="filter_list"
        :color="isFilterOpen ? accentColor : 'grey-4'"
        size="sm"
        @click="$emit('toggle-filter')"
      />
      <q-btn flat dense round icon="refresh" color="grey-4" size="sm" @click="$emit('refresh')" />
      <q-btn flat dense round :color="accentColor" size="sm" @click="$emit('open-spots')">
        <q-icon name="bookmark" size="16px" />
        <q-badge v-if="spotsCount > 0" :color="accentColor" floating>{{ spotsCount }}</q-badge>
        <q-tooltip>Mis Spots</q-tooltip>
      </q-btn>
    </div>
  </div>
</template>

<script setup>
defineProps({
  stage: {
    type: String,
    default: 'S1',
    validator: (value) => ['S1', 'S2', 'S3'].includes(value),
  },
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'business', 'event', 'barrio', 'socialSearch'].includes(value),
  },
  cityLabel: { type: String, default: 'Mi ciudad' },
  showCityAction: { type: Boolean, default: false },
  searchValue: { type: String, default: '' },
  searchPlaceholder: { type: String, default: 'Buscar ciudad' },
  searchEnabled: { type: Boolean, default: false },
  suggestions: { type: Array, default: () => [] },
  scopeOptions: { type: Array, default: () => [] },
  activeScopeLevel: { type: String, default: 'ciudad' },
  noFilterMode: { type: Boolean, default: false },
  isFilterOpen: { type: Boolean, default: false },
  spotsCount: { type: Number, default: 0 },
  accentColor: { type: String, default: 'primary' },
  subdimIk: { type: String, default: '' },
  subdimPc: { type: String, default: '' },
  subdimType: { type: String, default: 'SUB_COMPONENT' },
  subdimAppliesTo: { type: String, default: 'all' },
  codeComponent: { type: String, default: '' },
})

defineEmits([
  'select-mexico',
  'open-city',
  'toggle-filter',
  'refresh',
  'open-spots',
  'update:searchValue',
  'commit-search',
  'select-suggestion',
  'select-scope',
])
</script>

<style scoped>
.base-feed-filter-bar {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-md);
  background: color-mix(in srgb, var(--app-bg-card) 92%, transparent);
}

.base-feed-filter-bar__search-wrap {
  position: relative;
  flex: 1 1 100%;
  display: grid;
  gap: 8px;
}

.base-feed-filter-bar--event {
  border-color: rgba(109, 40, 217, 0.36);
}

.base-feed-filter-bar--barrio {
  border-color: rgba(6, 182, 212, 0.28);
}

.base-feed-filter-bar--socialSearch {
  border-color: rgba(255, 255, 255, 0.06);
  background: #111318;
}

.base-feed-filter-bar__actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

.base-feed-filter-bar__search {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 34px;
  padding: 0 8px 0 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.07);
}

.base-feed-filter-bar__scopes {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.base-feed-filter-bar__scope-pill {
  min-height: 28px;
  padding: 4px 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--app-text-secondary);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.base-feed-filter-bar__scope-pill--active {
  border-color: rgba(239, 163, 0, 0.36);
  background: rgba(239, 163, 0, 0.14);
  color: var(--app-primary);
}

.base-feed-filter-bar__search-input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: 0;
  color: var(--app-text-primary);
  background: transparent;
  font-size: 14px;
  font-weight: 600;
}

.base-feed-filter-bar__search-input::placeholder {
  color: color-mix(in srgb, var(--app-primary) 72%, transparent);
}

.base-feed-filter-bar__suggestions {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 6px);
  z-index: 20;
  display: grid;
  overflow: hidden;
  border-radius: var(--app-radius-md);
  border: 1px solid var(--app-border);
  background: #111318;
  box-shadow: var(--app-shadow-card);
}

.base-feed-filter-bar__suggestion {
  display: grid;
  gap: 2px;
  padding: 8px 10px;
  border: 0;
  color: var(--app-text-primary);
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.base-feed-filter-bar__suggestion small {
  color: var(--app-text-secondary);
}
</style>
