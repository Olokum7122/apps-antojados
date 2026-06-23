<template>
  <section class="no-vas-ir-panel">
    <header class="no-vas-ir-panel__hero">
      <div>
        <p class="no-vas-ir-panel__eyebrow">Antojo / No Vas Ir</p>
        <h2>Mock funcional de ZonaD</h2>
        <p>Catalogo de promos delivery, categorias activas y acceso rapido al carrito, sin mezclarlo con un feed social.</p>
      </div>
      <div class="no-vas-ir-panel__cart">
        <span>Carrito activo</span>
        <strong>3 items</strong>
      </div>
    </header>

    <div class="no-vas-ir-panel__filters">
      <span v-for="filter in filters" :key="filter" class="filter-chip">{{ filter }}</span>
    </div>

    <feed-gallery-base
      :items="mockItems"
      key-field="id"
      empty-message="Sin promos disponibles"
      variant="businessMasonry"
      subdim-ik="NO_VAS_IR_GALLERY"
      subdim-pc="ANTOJO.NO_VAS_IR"
      subdim-type="SUB_COMPONENT"
      code-component="ANTOJO.NO_VAS_IR.GALLERY"
    >
      <template #item="{ item }">
        <feed-post-base
          :post="item"
          subdim-ik="NO_VAS_IR_CARD"
          subdim-pc="ANTOJO.NO_VAS_IR"
          subdim-type="SUB_COMPONENT"
          code-component="ANTOJO.NO_VAS_IR.CARD"
        >
          <template #media>
            <div class="no-vas-ir-panel__media">
              <q-icon :name="item.icon" size="34px" color="primary" />
              <span class="no-vas-ir-panel__tag">{{ item.tag }}</span>
            </div>
          </template>

          <template #default>
            <p class="no-vas-ir-panel__copy">{{ item.caption }}</p>
          </template>

          <template #actions>
            <div class="no-vas-ir-panel__actions">
              <span class="action-chip">Abrir catalogo</span>
              <span class="action-chip action-chip--muted">Agregar al carrito</span>
            </div>
          </template>
        </feed-post-base>
      </template>
    </feed-gallery-base>
  </section>
</template>

<script setup>
import FeedGalleryBase from '@antojados/ui/base/FeedGalleryBase.vue'
import FeedPostBase from '@antojados/ui/base/FeedPostBase.vue'

// Accepted test debt: No Vas Ir/ZonaD stays mock for the iOS TestFlight cut.
const filters = ['Todos', 'Tacos', 'Pizza', 'Sushi', 'Bebidas']

const mockItems = [
  {
    id: 'zonad-1',
    title: 'Combo taquero',
    subtitle: 'Entrega local',
    icon: 'delivery_dining',
    tag: 'Tacos',
    caption: 'Promo destacada de sponsor con salto a catalogo y flujo de carrito activo.',
  },
  {
    id: 'zonad-2',
    title: 'Pizza nocturna',
    subtitle: 'Patrocinado',
    icon: 'local_offer',
    tag: 'Pizza',
    caption: 'Card mock de ZonaD con categoria, promo y acceso a carrito sin usar rail social.',
  },
  {
    id: 'zonad-3',
    title: 'Roll pack',
    subtitle: 'Entrega express',
    icon: 'shopping_bag',
    tag: 'Sushi',
    caption: 'Flujo visual para catalogo, carrito y orden del negocio dentro de ZonaD.',
  },
]
</script>

<style scoped>
.no-vas-ir-panel {
  display: grid;
  gap: 14px;
}

.no-vas-ir-panel__hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding: 18px;
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    radial-gradient(circle at top right, rgba(239, 163, 0, 0.14), transparent 34%),
    linear-gradient(180deg, rgba(18, 18, 20, 0.96), rgba(11, 12, 14, 0.98));
}

.no-vas-ir-panel__eyebrow {
  margin: 0 0 6px;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(239, 163, 0, 0.84);
}

.no-vas-ir-panel__hero h2,
.no-vas-ir-panel__hero p {
  margin: 0;
}

.no-vas-ir-panel__hero p {
  margin-top: 6px;
  color: rgba(255, 255, 255, 0.68);
}

.no-vas-ir-panel__cart {
  display: grid;
  gap: 2px;
  min-width: 112px;
  padding: 10px 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.06);
  text-align: right;
}

.no-vas-ir-panel__cart span {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.62);
}

.no-vas-ir-panel__filters,
.no-vas-ir-panel__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-chip,
.action-chip {
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

.action-chip--muted {
  color: rgba(255, 255, 255, 0.76);
  background: rgba(255, 255, 255, 0.05);
}

.no-vas-ir-panel__media {
  position: relative;
  min-height: 128px;
  display: grid;
  place-items: center;
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--app-primary) 24%, transparent), transparent),
    var(--app-bg-surface);
}

.no-vas-ir-panel__tag {
  position: absolute;
  top: 10px;
  right: 10px;
  min-height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
}

.no-vas-ir-panel__copy {
  margin: 0;
  color: var(--app-text-secondary);
  font-size: 13px;
  line-height: 1.45;
}
</style>
