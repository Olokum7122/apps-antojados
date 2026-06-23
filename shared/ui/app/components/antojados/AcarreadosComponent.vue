<template>
  <section class="acarreados-component">
    <tab-bar-sub-dimension-base
      :model-value="tab"
      :tabs="tabs"
      :grid-columns="3"
      level="SUBTAB"
      :parent-context="{ level: 'AREA', code: 'ANTOJADOS.COMUNIDAD.ACARREADOS', label: 'Acarreados' }"
      @update:model-value="tab = $event"
    />

    <div class="acarreados-component__panel">
      <header class="acarreados-component__header">
        <p class="acarreados-component__eyebrow">Antojados / La Banda</p>
        <h2>{{ activeTitle }}</h2>
        <p>{{ activeSubtitle }}</p>
      </header>

      <template v-if="tab === 'siguiendo'">
        <entity-grid-base
          :columns="followingColumns"
          :rows="followingRows"
          row-key="id"
          empty-message="Aun no sigues a nadie"
          subdim-ik="ACARREADOS_SIGUIENDO"
          subdim-pc="ANTOJADOS.COMUNIDAD.ACARREADOS"
          subdim-type="SUB_COMPONENT"
          subdim-applies-to="all"
          code-component="ACARREADOS.SIGUIENDO"
        >
          <template #cell_target="{ row }">
            <div class="social-cell">
              <div class="social-cell__avatar" :style="{ background: row.avatarColor }">{{ row.avatar }}</div>
              <div class="social-cell__body">
                <strong>{{ row.target }}</strong>
                <span>{{ row.meta }}</span>
              </div>
            </div>
          </template>
          <template #cell_action="{ row }">
            <div class="action-pill action-pill--muted">{{ row.action }}</div>
          </template>
        </entity-grid-base>
      </template>

      <template v-else-if="tab === 'seguidores'">
        <entity-grid-base
          :columns="followersColumns"
          :rows="followersRows"
          row-key="id"
          empty-message="Aun no tienes seguidores"
          subdim-ik="ACARREADOS_SEGUIDORES"
          subdim-pc="ANTOJADOS.COMUNIDAD.ACARREADOS"
          subdim-type="SUB_COMPONENT"
          subdim-applies-to="all"
          code-component="ACARREADOS.SEGUIDORES"
        >
          <template #cell_user="{ row }">
            <div class="social-cell">
              <div class="social-cell__avatar" :style="{ background: row.avatarColor }">{{ row.avatar }}</div>
              <div class="social-cell__body">
                <strong>{{ row.user }}</strong>
                <span>{{ row.meta }}</span>
              </div>
            </div>
          </template>
          <template #cell_status="{ row }">
            <div :class="['action-pill', row.status === 'Siguiendo' ? 'action-pill--primary' : 'action-pill--muted']">
              {{ row.status }}
            </div>
          </template>
        </entity-grid-base>
      </template>

      <template v-else>
        <entity-grid-base
          :columns="savedColumns"
          :rows="savedRows"
          row-key="id"
          empty-message="Sin lugares guardados"
          subdim-ik="ACARREADOS_GUARDADOS"
          subdim-pc="ANTOJADOS.COMUNIDAD.ACARREADOS"
          subdim-type="SUB_COMPONENT"
          subdim-applies-to="all"
          code-component="ACARREADOS.GUARDADOS"
        >
          <template #cell_place="{ row }">
            <div class="social-cell">
              <div class="social-cell__avatar" :style="{ background: row.avatarColor }">{{ row.avatar }}</div>
              <div class="social-cell__body">
                <strong>{{ row.place }}</strong>
                <span>{{ row.meta }}</span>
              </div>
            </div>
          </template>
          <template #cell_rating="{ value }">
            <div class="rating-chip">★ {{ value }}</div>
          </template>
          <template #cell_action="{ row }">
            <div class="action-pill action-pill--muted">{{ row.action }}</div>
          </template>
        </entity-grid-base>
      </template>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import EntityGridBase from '@antojados/ui/base/EntityGridBase.vue'
import TabBarSubDimensionBase from '@antojados/ui/base/TabBarSubDimensionBase.vue'

const tab = ref('siguiendo')

const tabs = [
  { name: 'siguiendo', label: 'Siguiendo' },
  { name: 'seguidores', label: 'Seguidores' },
  { name: 'guardados', label: 'Guardados' },
]

const followingColumns = [
  { key: 'target', label: 'Siguiendo' },
  { key: 'type', label: 'Tipo' },
  { key: 'action', label: 'Accion' },
]

const followersColumns = [
  { key: 'user', label: 'Seguidores' },
  { key: 'meta', label: 'Estado' },
  { key: 'status', label: 'Relacion' },
]

const savedColumns = [
  { key: 'place', label: 'Guardados' },
  { key: 'rating', label: 'Rating' },
  { key: 'action', label: 'Accion' },
]

const followingRows = [
  { id: 'f1', target: 'Taqueria Don Pepe', meta: 'Negocio', type: 'Negocio', action: 'Dejar de seguir', avatar: 'T', avatarColor: '#7c3006' },
  { id: 'f2', target: 'marifer_foodie', meta: 'Usuario', type: 'Usuario', action: 'Dejar de seguir', avatar: 'M', avatarColor: '#0a2d5c' },
  { id: 'f3', target: 'El Caldito', meta: 'Negocio', type: 'Negocio', action: 'Dejar de seguir', avatar: 'C', avatarColor: '#4a3b00' },
]

const followersRows = [
  { id: 's1', user: 'antojitos_lupita', meta: 'te sigue', status: 'Siguiendo', avatar: 'A', avatarColor: '#5c0a2e' },
  { id: 's2', user: 'elcompa_raul', meta: 'te sigue', status: 'Seguir', avatar: 'R', avatarColor: '#064a2c' },
  { id: 's3', user: 'foodhunter.mx', meta: 'te sigue', status: 'Siguiendo', avatar: 'F', avatarColor: '#1a0050' },
]

const savedRows = [
  { id: 'g1', place: 'Mariscos El Guero', meta: 'mariscos · tgz', rating: '4.7', action: 'Quitar', avatar: 'M', avatarColor: '#064a2c' },
  { id: 'g2', place: 'Cafe Nitro', meta: 'cafeteria · cdmx', rating: '4.5', action: 'Quitar', avatar: 'C', avatarColor: '#0a2d5c' },
  { id: 'g3', place: 'La Garnacha Feliz', meta: 'antojitos · puebla', rating: '4.8', action: 'Quitar', avatar: 'G', avatarColor: '#7c3006' },
]

const activeTitle = computed(() => {
  if (tab.value === 'seguidores') return 'Quien te sigue'
  if (tab.value === 'guardados') return 'Tus lugares guardados'
  return 'A quien sigues'
})

const activeSubtitle = computed(() => {
  if (tab.value === 'seguidores') return 'Usuarios que ya reaccionan a lo que publicas.'
  if (tab.value === 'guardados') return 'Negocios que guardaste para volver o recomendar.'
  return 'Usuarios y negocios que forman parte de tu circulo.'
})
</script>

<style scoped>
.acarreados-component {
  display: grid;
  gap: 14px;
}

.acarreados-component__panel {
  display: grid;
  gap: 14px;
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  background:
    radial-gradient(circle at top left, rgba(239, 163, 0, 0.12), transparent 38%),
    linear-gradient(180deg, rgba(20, 24, 31, 0.96), rgba(11, 14, 19, 0.98));
}

.acarreados-component__header {
  display: grid;
  gap: 4px;
}

.acarreados-component__eyebrow {
  margin: 0;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(239, 163, 0, 0.82);
}

.acarreados-component__header h2,
.acarreados-component__header p {
  margin: 0;
}

.acarreados-component__header h2 {
  font-size: 24px;
}

.acarreados-component__header p {
  color: rgba(255, 255, 255, 0.66);
}

.social-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.social-cell__avatar {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  color: #fff;
  font-weight: 800;
  flex-shrink: 0;
}

.social-cell__body {
  display: grid;
  min-width: 0;
}

.social-cell__body strong,
.social-cell__body span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.social-cell__body span {
  color: rgba(255, 255, 255, 0.62);
  font-size: 12px;
}

.action-pill,
.rating-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.action-pill--muted {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.78);
}

.action-pill--primary {
  background: rgba(239, 163, 0, 0.16);
  color: rgba(239, 163, 0, 0.98);
}

.rating-chip {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 245, 214, 0.92);
}
</style>
