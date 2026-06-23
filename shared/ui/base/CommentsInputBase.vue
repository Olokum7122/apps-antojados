<template>
  <section
    :class="['comments-input-base', `comments-input-base--${variant}`]"
    :subdim-ik="subdimIk"
    :subdim-pc="subdimPc"
    :subdim-type="subdimType"
    :subdim-applies-to="subdimAppliesTo"
    :data-code-component="codeComponent"
  >
    <div class="comments-input-base__title">
      <q-icon :name="icon" :color="accentColor" size="16px" />
      <span>{{ title }}</span>
    </div>

    <div v-if="comments.length" class="comments-input-base__list">
      <article v-for="comment in comments" :key="comment.id" class="comments-input-base__comment">
        <strong>@{{ comment.user }}</strong>
        <span>{{ comment.text }}</span>
      </article>
    </div>
    <div v-else class="comments-input-base__empty">{{ emptyMessage }}</div>

    <form class="comments-input-base__form" @submit.prevent="send">
      <input
        v-model.trim="draft"
        class="comments-input-base__input"
        :placeholder="placeholder"
        autocomplete="off"
      />
      <q-btn
        round
        dense
        unelevated
        :color="accentColor"
        :text-color="accentTextColor"
        icon="send"
        type="submit"
        :disable="!draft"
      />
    </form>
  </section>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  comments: { type: Array, default: () => [] },
  variant: {
    type: String,
    default: 'vasIr',
    validator: (value) => ['vasIr', 'arre', 'neta', 'barrio', 'pachanga', 'desma'].includes(value),
  },
  title: { type: String, default: 'Comentarios' },
  icon: { type: String, default: 'forum' },
  placeholder: { type: String, default: 'Escribe un comentario...' },
  emptyMessage: { type: String, default: 'Se el primero en comentar.' },
  accentColor: { type: String, default: 'primary' },
  accentTextColor: { type: String, default: 'dark' },
  subdimIk: { type: String, default: '' },
  subdimPc: { type: String, default: '' },
  subdimType: { type: String, default: 'SUB_COMPONENT' },
  subdimAppliesTo: { type: String, default: 'all' },
  codeComponent: { type: String, default: '' },
})

const emit = defineEmits(['send'])
const draft = ref('')

function send() {
  if (!draft.value) return
  emit('send', draft.value)
  draft.value = ''
}
</script>

<style scoped>
.comments-input-base {
  display: grid;
  gap: 7px;
  padding: 0;
  color: var(--app-text-primary);
}

.comments-input-base__title {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 11px;
  font-weight: 850;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.48);
}

.comments-input-base__list {
  display: grid;
  gap: 6px;
  max-height: 86px;
  overflow-y: auto;
  scrollbar-width: none;
}

.comments-input-base__list::-webkit-scrollbar {
  display: none;
}

.comments-input-base__comment {
  display: block;
  min-height: 28px;
  padding: 6px 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  line-height: 1.3;
}

.comments-input-base__comment strong {
  color: var(--app-primary);
  font-size: 12px;
  margin-right: 6px;
}

.comments-input-base__comment span,
.comments-input-base__empty {
  color: rgba(255, 255, 255, 0.72);
  font-size: 12px;
}

.comments-input-base__form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
}

.comments-input-base__input {
  width: 100%;
  min-height: 38px;
  padding: 0 14px;
  border: 0;
  border-radius: 999px;
  outline: 0;
  color: #fff;
  background: rgba(12, 14, 20, 0.82);
}
</style>
