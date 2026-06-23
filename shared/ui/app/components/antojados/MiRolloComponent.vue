<template>
  <section class="mi-rollo-component">
    <div class="mi-rollo-component__stats">
      <article v-for="card in statCards" :key="card.label" class="stat-card">
        <span class="stat-card__value">{{ card.value }}</span>
        <span class="stat-card__label">{{ card.label }}</span>
        <small>{{ card.note }}</small>
      </article>
    </div>

    <div v-if="requestState.loading" class="mi-rollo-component__status">Cargando Mi Rollo...</div>
    <div v-else-if="requestState.error" class="mi-rollo-component__status">
      {{ requestState.error.message }}
    </div>

    <tab-bar-sub-dimension-base
      :model-value="activeTab"
      :tabs="tabs"
      :grid-columns="2"
      level="SUBTAB"
      :parent-context="{ level: 'AREA', code: 'ANTOJADOS.MI_ROLLO', label: 'Mi Rollo' }"
      @update:model-value="activeTab = $event"
    />

    <entity-grid-base
      v-if="activeTab === 'actividad'"
      :columns="activityColumns"
      :rows="activityRows"
      row-key="id"
      empty-message="Sin actividad reciente"
      subdim-ik="MI_ROLLO_ACTIVITY"
      subdim-pc="ANTOJADOS.MI_ROLLO"
      subdim-type="SUB_COMPONENT"
      subdim-applies-to="all"
      code-component="MI_ROLLO.ACTIVITY"
    >
      <template #cell_activity="{ row }">
        <div class="activity-cell">
          <strong>{{ row.activity }}</strong>
          <span>{{ row.detail }}</span>
        </div>
      </template>
      <template #cell_impact="{ value }">
        <div class="impact-pill">{{ value }}</div>
      </template>
    </entity-grid-base>

    <entity-grid-base
      v-else
      :columns="postsColumns"
      :rows="postsRows"
      row-key="id"
      empty-message="Sin publicaciones propias"
      subdim-ik="MI_ROLLO_POSTS"
      subdim-pc="ANTOJADOS.MI_ROLLO"
      subdim-type="SUB_COMPONENT"
      subdim-applies-to="all"
      code-component="MI_ROLLO.POSTS"
    >
      <template #cell_post="{ row }">
        <div class="activity-cell">
          <strong>{{ row.post }}</strong>
          <span>{{ row.detail }}</span>
        </div>
      </template>
      <template #cell_status="{ value }">
        <div class="impact-pill">{{ value }}</div>
      </template>
    </entity-grid-base>

    <q-btn
      no-caps
      unelevated
      color="primary"
      text-color="dark"
      label="Ir a Tragon"
      class="mi-rollo-component__cta"
      @click="goToYo"
    />
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import EntityGridBase from '@antojados/ui/base/EntityGridBase.vue'
import TabBarSubDimensionBase from '@antojados/ui/base/TabBarSubDimensionBase.vue'
import { useAuth } from '@antojados/api/composables/useAuth'
import { miRolloService } from '@antojados/api/services'
import { useRequest } from '@antojados/api/composables/useRequest'

const router = useRouter()
const activeTab = ref('actividad')
const { profile, hydrateSession, fetchProfile } = useAuth()

const tabs = [
  { name: 'actividad', label: 'Actividad' },
  { name: 'publicaciones', label: 'Mis publicaciones' },
]

const summary = ref(null)
const activityRows = ref([])
const postsRows = ref([])

const requestState = useRequest(async () => {
  await hydrateSession()
  await fetchProfile()

  const userId = profile.value?.id
  if (!userId) {
    throw new Error('No se encontro user_id para Mi Rollo')
  }

  const [summaryResponse, activityResponse, postsResponse] = await Promise.all([
    miRolloService.getSummary(userId),
    miRolloService.listActivity(userId),
    miRolloService.listPosts(userId),
  ])

  summary.value = summaryResponse
  activityRows.value = activityResponse
  postsRows.value = postsResponse

  return {
    summary: summaryResponse,
    activity: activityResponse,
    posts: postsResponse,
  }
})

const statCards = computed(() => [
  {
    label: 'Publicaciones',
    value: String(summary.value?.postsTotal ?? postsRows.value.length ?? 0),
    note: 'Lo que moviste en barrio, neta y pachanga',
  },
  {
    label: 'Me gusta',
    value: String(summary.value?.likesReceivedTotal ?? 0),
    note: 'Senales sociales recientes dentro de Red',
  },
  {
    label: 'Guardados',
    value: String(summary.value?.savedPlacesTotal ?? 0),
    note: 'Spots y lugares que dejaste apartados',
  },
  {
    label: 'Siguiendo',
    value: String(summary.value?.followingTotal ?? 0),
    note: 'Personas y negocios que sigues desde Red',
  },
  {
    label: 'Seguidores',
    value: String(summary.value?.followersTotal ?? 0),
    note: 'Cuentas que ya reaccionan a tu contenido',
  },
])

const activityColumns = [
  { key: 'activity', label: 'Actividad' },
  { key: 'impact', label: 'Impacto' },
  { key: 'when', label: 'Cuando' },
]

const postsColumns = [
  { key: 'post', label: 'Mis publicaciones' },
  { key: 'status', label: 'Estado' },
  { key: 'when', label: 'Cuando' },
]

function goToYo() {
  router.push('/yo')
}

onMounted(async () => {
  await requestState.execute()
})
</script>

<style scoped>
.mi-rollo-component {
  display: grid;
  gap: 16px;
}

.mi-rollo-component__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 12px;
}

.stat-card {
  display: grid;
  gap: 4px;
  padding: 14px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.03);
}

.stat-card__value {
  font-size: 28px;
  font-weight: 800;
  line-height: 1;
}

.stat-card__label {
  font-weight: 700;
}

.stat-card small {
  color: rgba(255, 255, 255, 0.6);
}

.activity-cell {
  display: grid;
  gap: 2px;
}

.activity-cell span {
  color: rgba(255, 255, 255, 0.64);
  font-size: 12px;
}

.impact-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(0, 188, 212, 0.14);
  color: rgba(137, 245, 255, 0.96);
  font-size: 12px;
  font-weight: 700;
}

.mi-rollo-component__cta {
  justify-self: end;
}

.mi-rollo-component__status {
  color: rgba(255, 255, 255, 0.68);
  font-size: 12px;
}
</style>
