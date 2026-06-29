<template>
  <section class="negocio-mock-view">
    <feed-detail-column-base
      variant="vasIr"
      :hero-post="heroPost"
      :posts="businessPosts"
      :actions="businessActions"
      section-title="Publicaciones activas"
      section-icon="campaign"
      subdim-ik="NEGOCIO_HERO"
      subdim-pc="ANTOJO.VAS_IR.NEGOCIO"
      subdim-type="SUB_COMPONENT"
      subdim-applies-to="all"
      code-component="NEGOCIO.S2_COLUMN"
      @back="goToGallery"
      @select-post="selectPost"
      @open-post="openHeroPost"
      @action="onAction"
    >
      <template #after>
        <section class="negocio-mock-view__info">
          <button type="button" class="negocio-mock-view__info-head" @click="isInfoOpen = !isInfoOpen">
            <span>Info negocio</span>
            <q-icon :name="isInfoOpen ? 'expand_less' : 'expand_more'" color="primary" />
          </button>
          <div v-if="isInfoOpen" class="negocio-mock-view__info-body">
            <p>{{ heroPost?.venueName }} publica en Vas Ir con promociones, platillos, descuentos y avisos generales.</p>
            <small>Canal: Vas Ir / Tipos permitidos: PROMO, PLATILLO, DESCUENTO, GENERAL.</small>
          </div>
        </section>

        <div class="negocio-mock-view__sponsor-actions">
          <q-btn
            unelevated
            no-caps
            color="primary"
            text-color="dark"
            icon="add_photo_alternate"
            label="Lo Nuestro"
            @click="isPublishSheetOpen = true"
          />
        </div>
      </template>
    </feed-detail-column-base>

    <q-dialog v-model="isRatingOpen" position="bottom">
      <q-card class="negocio-mock-view__sheet bg-grey-10 text-white">
        <q-card-section>
          <div class="negocio-mock-view__sheet-title">Califica {{ heroPost?.venueName }}</div>
          <div class="negocio-mock-view__stars">
            <q-icon v-for="star in 5" :key="star" name="star" color="primary" size="30px" />
          </div>
          <q-input dark filled autogrow label="Cuenta la neta del lugar" />
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="isPublishSheetOpen" position="bottom">
      <q-card class="negocio-mock-view__sheet bg-grey-10 text-white">
        <q-card-section>
          <div class="negocio-mock-view__sheet-title">Lo Nuestro</div>
          <p class="negocio-mock-view__sheet-copy">Publicacion sponsor dentro del S2 negocio. Usa tipos Vas Ir, no evento.</p>
          <q-btn
            unelevated
            no-caps
            color="primary"
            text-color="dark"
            label="Crear publicacion Vas Ir"
            @click="goToPublish"
          />
        </q-card-section>
      </q-card>
    </q-dialog>
  </section>

  <publish-fab-base
    color="primary"
    text-color="dark"
    :visible="fabAccess.visible"
    :enabled="fabAccess.enabled"
    tooltip="Publicar en Vas Ir"
    title="Publicar en Vas Ir"
    body="Comparte lo mejor de tu negocio: platillos, promociones y descuentos especiales.
Tu publicacion llega a antojados de toda la ciudad."
    confirm-label="Crear publicacion ->"
    guide-icon="storefront"
    image-src="/media/shared/publicar.png"
    subdim-ik="BTN_PUBLICAR"
    subdim-pc="ANTOJO.VAS_IR.BIZ_FEED"
    dim-code="ANTOJO.VAS_IR.BIZ_FEED.BTN_PUBLICAR"
    subdim-type="BUTTON"
    subdim-applies-to="sponsor"
    code-component="ANTOJO.VAS_IR.BIZ_FEED.FAB_PUBLICAR"
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
const postId = computed(() => String(route.query.post_id || ''))
const businessPosts = ref([])
const selectedPostId = ref('')
const isInfoOpen = ref(false)
const isRatingOpen = ref(false)
const isPublishSheetOpen = ref(false)
const heroPost = computed(() => {
  const targetId = selectedPostId.value || postId.value
  return businessPosts.value.find((post) => post.id === targetId) || businessPosts.value[0] || null
})
const businessActions = computed(() => [
  { key: 'maps', label: 'Maps', icon: 'map', count: 0 },
  { key: 'califica', label: 'Califica', icon: 'rate_review', color: 'deep-purple-6', textColor: 'white' },
  { key: 'compa', label: 'Tu compa', icon: 'person_add_alt_1', color: 'grey-8', textColor: 'white' },
])

const fabAccess = useFabAccess({
  subdimIk: 'BTN_PUBLICAR',
  subdimPc: 'ANTOJO.VAS_IR.BIZ_FEED',
  dimCode: 'ANTOJO.VAS_IR.BIZ_FEED.BTN_PUBLICAR',
  subdimType: 'BUTTON',
  subdimAppliesTo: 'sponsor',
  codeComponent: 'ANTOJO.VAS_IR.BIZ_FEED.FAB_PUBLICAR',
})

watch(
  () => [route.params.publisher_id, route.query.post_id],
  async ([nextPublisherId, nextPostId]) => {
    const resolvedPublisherId = String(nextPublisherId || '')
    selectedPostId.value = String(nextPostId || '')
    businessPosts.value = resolvedPublisherId
      ? await bizFeedService.listByPublisher(resolvedPublisherId, 'vas_ir')
      : []
  },
  { immediate: true },
)

function selectPost(post) {
  if (!post?.id) return
  selectedPostId.value = post.id
  router.replace({
    path: `/negocio/${publisherId.value}`,
    query: { post_id: post.id, source: 'biz_grid' },
  })
}

function openHeroPost() {
  if (!heroPost.value?.id) return
  router.push(`/negocio/${publisherId.value}/post/${heroPost.value.id}`)
}

function goToGallery() {
  router.push('/antojo/vas-ir/gallery')
}

function onAction(actionKey) {
  if (actionKey === 'califica') isRatingOpen.value = true
}

function goToPublish() {
  router.push('/antojo/publicar')
}
</script>

<style scoped>
.negocio-mock-view {
  min-height: 100%;
  background: #0a0c12;
}

.negocio-mock-view__info {
  margin: 10px 12px 0;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  background: #111722;
}

.negocio-mock-view__info-head {
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

.negocio-mock-view__info-body {
  display: grid;
  gap: 5px;
  padding: 0 12px 12px;
  color: rgba(255, 255, 255, 0.72);
}

.negocio-mock-view__info-body p {
  margin: 0;
}

.negocio-mock-view__sponsor-actions {
  padding: 12px;
}

.negocio-mock-view__sheet {
  width: 100vw;
  max-width: 480px;
  border-radius: 18px 18px 0 0;
}

.negocio-mock-view__sheet-title {
  margin-bottom: 12px;
  font-size: 17px;
  font-weight: 850;
}

.negocio-mock-view__sheet-copy {
  color: rgba(255, 255, 255, 0.7);
}

.negocio-mock-view__stars {
  display: flex;
  gap: 5px;
  margin-bottom: 12px;
}
</style>
