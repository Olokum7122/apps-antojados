<template>
  <section class="los-chidos-component">
    <feed-filter-bar-base
      :city-label="scopeLabel"
      :search-enabled="false"
      :search-value="searchValue"
      :suggestions="suggestions"
      :scope-options="scopeOptions"
      :active-scope-level="scopeLevel"
      stage="S1"
      variant="business"
      accent-color="primary"
      search-placeholder="Buscar ciudad para ranking"
      subdim-ik="LOS_CHIDOS_FILTER_BAR"
      subdim-pc="ANTOJO.LOS_CHIDOS"
      subdim-type="SUB_COMPONENT"
      subdim-applies-to="all"
      code-component="LOS_CHIDOS.FILTER_BAR"
      @select-scope="onSelectScope"
      @open-city="onOpenCity"
      @refresh="refreshAnalytics"
      @update:searchValue="onSearchUpdate"
      @commit-search="commitSearch"
      @select-suggestion="onSelectSuggestion"
    />

    <header class="los-chidos-component__hero">
      <div>
        <p class="los-chidos-component__eyebrow">Antojo / Los Chidos</p>
        <h2>Ranking y metricas del barrio</h2>
        <p>{{ heroCopy }}</p>
      </div>
      <div class="los-chidos-component__tools">
        <span class="tool-chip">{{ scopeLabel }}</span>
        <span class="tool-chip">{{ sponsorSummaryLabel }}</span>
        <span class="tool-chip">{{ tileSummaryLabel }}</span>
      </div>
    </header>

    <div class="los-chidos-component__podium">
      <article
        v-for="item in podiumRows"
        :key="item.id"
        :class="['podium-card', `podium-card--${item.rank}`]"
      >
        <span class="podium-card__medal">{{ item.medal }}</span>
        <strong>{{ item.spot }}</strong>
        <span>{{ item.category }}</span>
        <div class="podium-card__meta">
          <span>{{ item.score }} pts</span>
          <span>{{ starLabel }} {{ item.rating }}</span>
        </div>
      </article>
    </div>

    <entity-grid-base
      :columns="columns"
      :rows="restRows"
      row-key="id"
      empty-message="Sin spots para ranking"
      subdim-ik="LOS_CHIDOS_RANKING"
      subdim-pc="ANTOJO.LOS_CHIDOS"
      subdim-type="SUB_COMPONENT"
      subdim-applies-to="all"
      code-component="LOS_CHIDOS.RANKING_GRID"
    >
      <template #cell-rank="{ value }">
        <div class="rank-pill">#{{ value }}</div>
      </template>
      <template #cell-spot="{ row }">
        <div class="spot-cell">
          <strong>{{ row.spot }}</strong>
          <span>{{ row.category }} · {{ row.posts }} posts · {{ row.visits }} visitas</span>
        </div>
      </template>
      <template #cell-score="{ row }">
        <div class="score-cell">
          <strong>{{ row.score }}</strong>
          <span>{{ starLabel }} {{ row.rating }}</span>
        </div>
      </template>
    </entity-grid-base>

    <q-dialog v-model="isCityPickerOpen" position="bottom">
      <q-card class="los-chidos-component__sheet bg-grey-10 text-white">
        <q-card-section>
          <div class="los-chidos-component__sheet-title">Ciudad para Los Chidos</div>
          <div class="los-chidos-component__city-list">
            <q-btn
              v-for="city in cityOptions"
              :key="city.code"
              no-caps
              unelevated
              :color="cityCode === city.code ? 'primary' : 'grey-9'"
              :text-color="cityCode === city.code ? 'dark' : 'white'"
              :label="city.label"
              @click="onSelectCity(city.code)"
            />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import EntityGridBase from '@antojados/ui/base/EntityGridBase.vue'
import FeedFilterBarBase from '@antojados/ui/base/FeedFilterBarBase.vue'
import { useLocationScope } from '@antojados/api/composables/useLocationScope'
import { rankingsService } from '@antojados/api/services'

const medals = ['🥇', '🥈', '🥉']
const starLabel = '★'
const isCityPickerOpen = ref(false)
const heroCopy = ref(
  'Top lugares por score, calificacion, actividad y spots guardados, consumiendo APIs reales.',
)
const rankingRows = ref([])
const sponsorTotals = ref({
  ctaClicks: 0,
  whatsappTaps: 0,
  tileViews: 0,
})
const {
  cityCode,
  scopeLevel,
  scopeCode,
  scopeLabel,
  cityOptions,
  scopeOptions,
  searchValue,
  suggestions,
  selectScope,
  selectCityByCode,
  selectSuggestion,
} = useLocationScope('los_chidos')

const columns = [
  { key: 'rank', label: 'Top' },
  { key: 'spot', label: 'Lugar' },
  { key: 'score', label: 'Score' },
]

const podiumRows = computed(() => rankingRows.value.slice(0, 3))
const restRows = computed(() => rankingRows.value.slice(3))
const sponsorSummaryLabel = computed(
  () => `CTA ${sponsorTotals.value.ctaClicks} · WA ${sponsorTotals.value.whatsappTaps}`,
)
const tileSummaryLabel = computed(() => `Tiles ${sponsorTotals.value.tileViews}`)

async function loadRanking() {
  const rows = await rankingsService.getTopPlaces({
    cityCode: cityCode.value,
    scopeLevel: scopeLevel.value,
    scopeCode: scopeCode.value,
    limit: 12,
  })
  rankingRows.value = rows.map((row, index) => ({
    id: row.placeId,
    rank: row.rankPosition || index + 1,
    spot: row.placeName,
    category: row.category || 'General',
    score: row.score.toFixed(1),
    rating: row.avgRating.toFixed(1),
    posts: row.postCount,
    visits: row.verifiedVisitCount,
    medal: medals[index],
  }))
}

async function loadSponsorMetrics() {
  const rows = await rankingsService.getSponsorMetrics({
    cityCode: cityCode.value,
    scopeLevel: scopeLevel.value,
    scopeCode: scopeCode.value,
    limit: 20,
  })
  sponsorTotals.value = rows.reduce(
    (accumulator, row) => ({
      ctaClicks: accumulator.ctaClicks + row.ctaClicksTotal,
      whatsappTaps: accumulator.whatsappTaps + row.whatsappTapsTotal,
      tileViews: accumulator.tileViews + row.tileViews,
    }),
    { ctaClicks: 0, whatsappTaps: 0, tileViews: 0 },
  )

  heroCopy.value =
    rows.length > 0
      ? 'Ranking y metricas sponsor consolidados desde analytics con filtro territorial dedicado.'
      : 'Sin actividad consolidada todavia para este alcance territorial.'
}

function onSelectScope(level) {
  selectScope(level)
}

function onOpenCity() {
  isCityPickerOpen.value = true
}

function onSelectCity(code) {
  selectCityByCode(code)
  isCityPickerOpen.value = false
}

function commitSearch() {
  if (suggestions.value[0]) {
    onSelectSuggestion(suggestions.value[0])
  }
}

function onSearchUpdate(value) {
  searchValue.value = value
}

function onSelectSuggestion(suggestion) {
  selectSuggestion(suggestion)
  isCityPickerOpen.value = false
}

function refreshAnalytics() {
  void Promise.all([loadRanking(), loadSponsorMetrics()])
}

watch([scopeLevel, scopeCode], () => {
  refreshAnalytics()
})

onMounted(() => {
  refreshAnalytics()
})
</script>

<style scoped>
.los-chidos-component {
  display: grid;
  gap: 16px;
}

.los-chidos-component__hero {
  display: grid;
  gap: 12px;
  padding: 18px;
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    radial-gradient(circle at top left, rgba(239, 163, 0, 0.18), transparent 34%),
    linear-gradient(180deg, rgba(22, 20, 15, 0.96), rgba(14, 12, 9, 0.98));
}

.los-chidos-component__eyebrow {
  margin: 0 0 6px;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(239, 163, 0, 0.84);
}

.los-chidos-component__hero h2,
.los-chidos-component__hero p {
  margin: 0;
}

.los-chidos-component__hero p {
  color: rgba(255, 255, 255, 0.68);
}

.los-chidos-component__tools {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tool-chip,
.rank-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
}

.los-chidos-component__podium {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.podium-card {
  display: grid;
  gap: 4px;
  padding: 14px;
  border-radius: 18px;
  color: #fff;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.podium-card--1 {
  background: linear-gradient(180deg, rgba(239, 163, 0, 0.24), rgba(255, 255, 255, 0.04));
}

.podium-card__medal {
  font-size: 20px;
}

.podium-card__meta {
  display: flex;
  justify-content: space-between;
  color: rgba(255, 255, 255, 0.74);
  font-size: 12px;
}

.spot-cell,
.score-cell {
  display: grid;
  gap: 2px;
}

.spot-cell span,
.score-cell span {
  color: rgba(255, 255, 255, 0.64);
  font-size: 12px;
}

.los-chidos-component__sheet {
  width: 100vw;
  max-width: 480px;
  border-radius: 18px 18px 0 0;
}

.los-chidos-component__sheet-title {
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 850;
}

.los-chidos-component__city-list {
  display: grid;
  gap: 8px;
}
</style>
