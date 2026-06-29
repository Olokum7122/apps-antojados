<template>
  <section class="arre-negocio-mock-view">
    <feed-detail-column-base
      variant="arre"
      :hero-post="heroPost"
      :posts="eventPosts"
      :actions="eventActions"
      section-title="Eventos activos"
      section-icon="celebration"
      subdim-ik="ARRE_NEGOCIO_HERO"
      subdim-pc="ANTOJO.ARRE.ARRE_FEED"
      subdim-type="SUB_COMPONENT"
      subdim-applies-to="sponsor"
      code-component="ARRE.NEGOCIO.S2_COLUMN"
      @back="goToAgenda"
      @select-post="selectPost"
      @open-post="openHeroPost"
      @action="onAction"
    >
      <template #after>
        <section class="arre-negocio-mock-view__info">
          <button type="button" class="arre-negocio-mock-view__info-head" @click="isInfoOpen = !isInfoOpen">
            <span>Info evento</span>
            <q-icon :name="isInfoOpen ? 'expand_less' : 'expand_more'" color="deep-purple-4" />
          </button>
          <div v-if="isInfoOpen" class="arre-negocio-mock-view__info-body">
            <p>{{ heroPost?.venueName }} publica en Arre solo eventos activos.</p>
            <small>Canal: Arre / Tipo permitido: EVENTO.</small>
          </div>
        </section>

        <div class="arre-negocio-mock-view__sponsor-actions">
          <q-btn
            unelevated
            no-caps
            color="deep-purple-6"
            text-color="white"
            icon="celebration"
            label="Publicar evento"
            @click="goToPublish"
          />
        </div>
      </template>
    </feed-detail-column-base>

    <q-dialog v-model="isTicketsOpen" position="bottom">
      <q-card class="arre-negocio-mock-view__sheet bg-grey-10 text-white">
        <q-card-section>
          <div class="arre-negocio-mock-view__sheet-title">Boletos</div>
          <p class="arre-negocio-mock-view__sheet-copy">Preventa, reservaciones y acceso para este evento.</p>
          <q-btn unelevated no-caps color="deep-purple-6" text-color="white" label="Configurar boletos" />
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="isRatingOpen" position="bottom">
      <q-card class="arre-negocio-mock-view__sheet bg-grey-10 text-white">
        <q-card-section>
          <div class="arre-negocio-mock-view__sheet-title">Califica {{ heroPost?.venueName }}</div>
          <div class="arre-negocio-mock-view__stars">
            <q-icon v-for="star in 5" :key="star" name="star" color="deep-purple-4" size="30px" />
          </div>
          <q-input dark filled autogrow label="Cuenta como estuvo el evento" />
        </q-card-section>
      </q-card>
    </q-dialog>
  </section>

  <publish-fab-base
    color="deep-purple-6"
    text-color="white"
    :visible="fabAccess.visible"
    :enabled="fabAccess.enabled"
    tooltip="Publicar en Arre"
    title="Publicar en Arre"
    body="Comparte tus eventos: conciertos, noches tematicas, fiestas y experiencias unicas.
Tu evento llega a toda la ciudad."
    confirm-label="Crear evento ->"
    guide-icon="celebration"
    image-src="/media/shared/publicar.png"
    subdim-ik="BTN_PUBLICAR"
    subdim-pc="ANTOJO.ARRE.ARRE_FEED"
    dim-code="ANTOJO.ARRE.ARRE_FEED.BTN_PUBLICAR"
    subdim-type="BUTTON"
    subdim-applies-to="sponsor"
    code-component="ANTOJO.ARRE.ARRE_FEED.FAB_PUBLICAR"
    @confirm="goToPublish"
  />
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FeedDetailColumnBase from '@antojados/ui/base/FeedDetailColumnBase.vue'
import PublishFabBase from '@antojados/ui/base/PublishFabBase.vue'
import { useFabAccess } from '@antojados/ui/base/useFabAccess'
import { bizFeedService } from '@antojados/api/services'

const route = useRoute()
const router = useRouter()

const publisherId = computed(() => String(route.params.publisher_id || ''))
const routePostId = computed(() => String(route.query.post_id || ''))
const eventPosts = ref([])
const selectedPostId = ref('')
const isInfoOpen = ref(false)
const isTicketsOpen = ref(false)
const isRatingOpen = ref(false)
const heroPost = computed(() => {
  const targetId = selectedPostId.value || routePostId.value
  return eventPosts.value.find((post) => post.id === targetId) || eventPosts.value[0] || null
})
const eventActions = computed(() => [
  { key: 'boletos', label: 'Boletos', icon: 'confirmation_number', color: 'deep-purple-6', textColor: 'white' },
  { key: 'maps', label: 'Maps', icon: 'map', color: 'blue-8', textColor: 'white' },
  { key: 'califica', label: 'Califica', icon: 'rate_review', color: 'deep-purple-6', textColor: 'white' },
  { key: 'compa', label: 'Tu compa', icon: 'person_add_alt_1', color: 'grey-8', textColor: 'white' },
])

const fabAccess = useFabAccess({
  subdimIk: 'BTN_PUBLICAR',
  subdimPc: 'ANTOJO.ARRE.ARRE_FEED',
  dimCode: 'ANTOJO.ARRE.ARRE_FEED.BTN_PUBLICAR',
  subdimType: 'BUTTON',
  subdimAppliesTo: 'sponsor',
  codeComponent: 'ANTOJO.ARRE.ARRE_FEED.FAB_PUBLICAR',
})

watch(
  () => [route.params.publisher_id, route.query.post_id],
  async ([nextPublisherId, nextPostId]) => {
    const resolvedPublisherId = String(nextPublisherId || '')
    selectedPostId.value = String(nextPostId || '')
    eventPosts.value = resolvedPublisherId
      ? await bizFeedService.listByPublisher(resolvedPublisherId, 'arre')
      : []
  },
  { immediate: true },
)

function selectPost(post) {
  if (post?.channel !== 'arre' || post?.postType !== 'event') return
  selectedPostId.value = post.id
  router.replace({
    path: `/antojo/arre/negocio/${publisherId.value}`,
    query: { post_id: post.id, source: 'arre_grid', channel: 'arre' },
  })
}

function openHeroPost() {
  if (!heroPost.value?.id) return
  router.push({
    path: `/antojo/arre/negocio/${publisherId.value}/post/${heroPost.value.id}`,
    query: { source: 'arre_grid', channel: 'arre' },
  })
}

function goToAgenda() {
  router.push('/antojo/arre/agenda')
}

function onAction(actionKey) {
  if (actionKey === 'boletos') isTicketsOpen.value = true
  if (actionKey === 'califica') isRatingOpen.value = true
}

function goToPublish() {
  router.push('/antojo/arre/publicar')
}
</script>

<style scoped>
.arre-negocio-mock-view {
  min-height: 100%;
  background: #0a0c12;
}

.arre-negocio-mock-view__info {
  margin: 10px 12px 0;
  border: 1px solid rgba(124, 58, 237, 0.28);
  border-radius: 8px;
  background: #111722;
}

.arre-negocio-mock-view__info-head {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 0;
  color: #fff;
  background: transparent;
  font-weight: 850;
}

.arre-negocio-mock-view__info-body {
  display: grid;
  gap: 5px;
  padding: 0 12px 12px;
  color: rgba(255, 255, 255, 0.72);
}

.arre-negocio-mock-view__info-body p {
  margin: 0;
}

.arre-negocio-mock-view__sponsor-actions {
  padding: 12px;
}

.arre-negocio-mock-view__sheet {
  width: 100vw;
  max-width: 480px;
  border-radius: 18px 18px 0 0;
}

.arre-negocio-mock-view__sheet-title {
  margin-bottom: 12px;
  font-size: 17px;
  font-weight: 850;
}

.arre-negocio-mock-view__sheet-copy {
  color: rgba(255, 255, 255, 0.7);
}

.arre-negocio-mock-view__stars {
  display: flex;
  gap: 5px;
  margin-bottom: 12px;
}
</style>
