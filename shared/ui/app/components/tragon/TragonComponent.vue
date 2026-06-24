<template>
  <section class="tragon-component">
    <section v-if="isAuthenticated" class="tragon-component__hero">
      <div class="tragon-component__identity">
        <div class="tragon-component__avatar">{{ profileInitial }}</div>
        <div class="tragon-component__identity-copy">
          <p class="tragon-component__eyebrow">Yo / Tragon</p>
          <h2>{{ heroTitle }}</h2>
          <p>{{ heroSubtitle }}</p>
        </div>
      </div>

      <div class="tragon-component__stats">
        <article v-for="card in statCards" :key="card.label" class="stat-card">
          <span class="stat-card__value">{{ card.value }}</span>
          <span class="stat-card__label">{{ card.label }}</span>
        </article>
      </div>
    </section>

    <template v-if="!isAuthenticated">
      <app-panel
        title="Tragon"
        subtitle="Acceso y cuenta"
        tone="flat"
        panel-class="tragon-panel tragon-panel--fullbleed"
      >
        <button-bar-base
          v-model="authScreenKey"
          :buttons="authScreenButtons"
          :grid-columns="4"
          :scrollable="false"
        :parent-context="{ level: 'COMPONENT', code: 'TRAGON', label: 'Tragon' }"
        />
      </app-panel>

      <app-panel
        v-if="authScreenKey === 'tragon'"
        title="Tragon"
        subtitle="Perfil y bandeja"
        panel-class="tragon-panel"
      >
        <div class="tragon-shell-template">
          <button-bar-base
            v-model="tragonAreaKey"
            :buttons="tragonAreaButtons"
            :grid-columns="2"
            :parent-context="{ level: 'COMPONENT', code: 'TRAGON.SHELL', label: 'Pantalla Tragon' }"
          />

          <entity-grid-base
            v-if="tragonAreaKey === 'perfil'"
            :columns="templateColumns"
            :rows="tragonPerfilTemplateRows"
            row-key="id"
            empty-message="Sin datos"
            subdim-ik="TRAGON_TEMPLATE_PERFIL"
            subdim-pc="TRAGON"
            code-component="TRAGON.TEMPLATE.PERFIL"
          />

          <entity-grid-base
            v-else
            :columns="templateColumns"
            :rows="tragonBandejaTemplateRows"
            row-key="id"
            empty-message="Sin datos"
            subdim-ik="TRAGON_TEMPLATE_BANDEJA"
            subdim-pc="TRAGON"
            code-component="TRAGON.TEMPLATE.BANDEJA"
          />
        </div>
      </app-panel>

      <app-panel
        v-else-if="authScreenKey === 'login'"
        title="Login Tragon"
        subtitle="Sesion personal"
        panel-class="tragon-panel"
      >
        <field-editor-base
          title="Login"
          :fields="loginFields"
          :model-value="loginForm"
          subdim-ik="TRAGON_LOGIN"
          subdim-pc="TRAGON"
          code-component="TRAGON.LOGIN"
          @update:model-value="mergeLoginForm"
        >
          <template #actions>
            <div class="tragon-form__note">
              <q-toggle v-model="showPassword" dense color="primary" label="Mostrar contrasenas" />
            </div>
            <div class="tragon-bar-bleed">
              <button-bar-base
                model-value="login"
                :buttons="loginActionButtons"
                :grid-columns="1"
                :parent-context="{ level: 'COMPONENT', code: 'TRAGON.LOGIN', label: 'Acceso' }"
                @action="onLoginAction"
              />
            </div>
            <q-btn
              no-caps
              outline
              color="primary"
              icon="policy"
              label="Centro legal y soporte"
              class="tragon-component__secondary-action"
              @click="openLegalCenter"
            />
          </template>
        </field-editor-base>
      </app-panel>

      <app-panel
        v-else-if="authScreenKey === 'registro'"
        title="Registro Tragon"
        subtitle="Usuario, sponsor o empleado"
        panel-class="tragon-panel"
      >
        <field-editor-base
          :title="authSectionTitle"
          :fields="authFields"
          :model-value="authModel"
          :info-text="authInfoText"
          subdim-ik="TRAGON_AUTH"
          subdim-pc="TRAGON"
          code-component="TRAGON.AUTH"
          @update:model-value="mergeAuthModel"
        >
          <template #actions>
            <div class="tragon-bar-bleed">
              <button-bar-base
                v-model="authMode"
                :buttons="authModeButtons"
                :grid-columns="3"
                :parent-context="{ level: 'COMPONENT', code: 'TRAGON.AUTH', label: 'Acceso y Cuenta' }"
              />
            </div>

            <div class="tragon-bar-bleed">
              <button-bar-base
                model-value="submit"
                :buttons="authActionButtons"
                :grid-columns="1"
                :parent-context="{ level: 'COMPONENT', code: 'TRAGON.AUTH', label: 'Acceso y Cuenta' }"
                @action="onAuthAction"
              />
            </div>
          </template>
        </field-editor-base>
      </app-panel>

      <template v-else-if="authScreenKey === 'recuperacion'">
        <app-panel
          title="Recuperacion"
          subtitle="Cuenta Tragon"
          panel-class="tragon-panel"
        >
          <field-editor-base
            title="Recuperacion de cuenta"
            :fields="recoveryFields"
            :model-value="recoveryForm"
            subdim-ik="TRAGON_RECOVERY_FORM"
            subdim-pc="TRAGON"
            code-component="TRAGON.RECOVERY.FORM"
            @update:model-value="mergeRecoveryForm"
          >
            <template #actions>
              <div class="tragon-bar-bleed">
                <button-bar-base
                  model-value="submit"
                  :buttons="recoveryActionButtons"
                  :grid-columns="1"
                  :parent-context="{ level: 'COMPONENT', code: 'TRAGON.RECOVERY', label: 'Recuperacion' }"
                  @action="onRecoveryAction"
                />
              </div>
              <q-banner v-if="recoveryStatusMessage" rounded class="tragon-banner tragon-banner--info">
                {{ recoveryStatusMessage }}
              </q-banner>
            </template>
          </field-editor-base>
        </app-panel>

        <app-panel
          title="Estado"
          subtitle="Recuperacion"
          panel-class="tragon-panel"
        >
          <entity-grid-base
            :columns="recoveryColumns"
            :rows="recoveryRows"
            row-key="id"
            empty-message="Aun no se ha solicitado recuperacion."
            subdim-ik="TRAGON_RECOVERY"
            subdim-pc="TRAGON"
            code-component="TRAGON.RECOVERY"
          />
        </app-panel>
      </template>
    </template>

    <template v-else>
      <app-panel
        title="Tragon"
        subtitle="Sesion activa"
        tone="flat"
        panel-class="tragon-panel tragon-panel--fullbleed"
      >
        <button-bar-base
          v-model="sectionKey"
          :buttons="sectionButtons"
          :grid-columns="2"
          :scrollable="false"
          :parent-context="{ level: 'COMPONENT', code: 'TRAGON', label: 'Tragon' }"
        />
      </app-panel>

      <div class="tragon-component__kpis">
        <article v-for="item in kpis" :key="item.label" class="kpi-card">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
          <small>{{ item.note }}</small>
        </article>
      </div>

      <app-panel
        v-if="sectionKey === 'session'"
        title="Sesion Activa"
        subtitle="Contexto operativo actual de Tragon."
        panel-class="tragon-panel"
      >
        <entity-grid-base
          :columns="sessionColumns"
          :rows="sessionRows"
          row-key="id"
          empty-message="Sin datos de sesion"
          subdim-ik="TRAGON_SESSION"
          subdim-pc="TRAGON"
          subdim-type="SUB_COMPONENT"
          subdim-applies-to="all"
          code-component="TRAGON.SESSION"
        />
      </app-panel>

      <app-panel
        v-else-if="sectionKey === 'profile'"
        title="Mi Perfil"
        subtitle="Lectura y actualizacion sobre la API real de Antojados."
        panel-class="tragon-panel"
      >
        <field-editor-base
          title="Perfil personal"
          :fields="profileFields"
          :model-value="profileForm"
          info-text="Aqui vive el perfil personal del usuario. Equipo y Registro siguen fuera de Tragon."
          subdim-ik="TRAGON_PROFILE"
          subdim-pc="TRAGON"
          code-component="TRAGON.PROFILE"
          @update:model-value="mergeProfileForm"
        >
          <template #actions>
            <div class="tragon-bar-bleed">
              <button-bar-base
                model-value="guardar"
                :buttons="profileActionButtons"
                :grid-columns="2"
                :parent-context="{ level: 'COMPONENT', code: 'TRAGON.PROFILE', label: 'Mi Perfil' }"
                @action="onProfileAction"
              />
            </div>
          </template>
        </field-editor-base>
      </app-panel>

      <app-panel
        v-else-if="sectionKey === 'account'"
        title="Mi Cuenta"
        subtitle="Lectura canonica de auth_identities."
        panel-class="tragon-panel"
      >
        <entity-grid-base
          :columns="accountColumns"
          :rows="accountRows"
          row-key="id"
          empty-message="Sin datos de cuenta"
          subdim-ik="TRAGON_ACCOUNT"
          subdim-pc="TRAGON"
          subdim-type="SUB_COMPONENT"
          subdim-applies-to="all"
          code-component="TRAGON.ACCOUNT"
        >
          <template #cell_value="{ value }">
            <div class="account-value">{{ value }}</div>
          </template>
        </entity-grid-base>
        <q-btn
          no-caps
          outline
          color="negative"
          icon="delete_outline"
          label="Eliminar cuenta"
          class="tragon-component__secondary-action"
          @click="openDeleteAccount"
        />
      </app-panel>

      <app-panel
        v-else-if="sectionKey === 'status'"
        title="Redes y Estado"
        subtitle="Lectura canonica de auth_identities."
        panel-class="tragon-panel"
      >
        <entity-grid-base
          :columns="metaColumns"
          :rows="metaRows"
          row-key="id"
          empty-message="Sin metadata"
          subdim-ik="TRAGON_META"
          subdim-pc="TRAGON"
          subdim-type="SUB_COMPONENT"
          subdim-applies-to="all"
          code-component="TRAGON.META"
        />
      </app-panel>

      <app-panel
        v-else
        title="Acciones"
        subtitle="Controles personales antes de pasar a Equipo o Registro."
        panel-class="tragon-panel"
      >
        <template #actions>
          <div class="tragon-bar-bleed">
            <button-bar-base
              model-value="rehidratar"
              :buttons="sessionActionButtons"
              :grid-columns="3"
              :parent-context="{ level: 'COMPONENT', code: 'TRAGON.ACTIONS', label: 'Acciones' }"
              @action="onSessionAction"
            />
          </div>
        </template>
      </app-panel>
    </template>

    <q-dialog v-model="isLegalDialogOpen" position="bottom">
      <q-card class="tragon-dialog">
        <q-card-section>
          <div class="tragon-dialog__title">Centro legal y soporte</div>
          <div class="tragon-dialog__subtitle">Links publicos requeridos para privacidad, soporte y seguridad.</div>
        </q-card-section>

        <q-list separator class="tragon-dialog__list">
          <q-item
            v-for="item in legalCenterLinks"
            :key="item.key"
            clickable
            @click="openExternalLink(item.href)"
          >
            <q-item-section avatar>
              <q-icon :name="item.icon" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ item.label }}</q-item-label>
              <q-item-label caption>{{ item.caption }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-icon name="open_in_new" color="grey-5" />
            </q-item-section>
          </q-item>
        </q-list>

        <q-card-actions align="right">
          <q-btn flat no-caps color="primary" label="Cerrar" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="isDeleteAccountDialogOpen" position="bottom">
      <q-card class="tragon-dialog">
        <q-card-section>
          <div class="tragon-dialog__title">Eliminar cuenta</div>
          <div class="tragon-dialog__subtitle">
            Abre el canal HTTPS para iniciar el proceso de eliminacion de cuenta y datos asociados.
          </div>
        </q-card-section>

        <q-card-actions align="between">
          <q-btn flat no-caps color="grey-5" label="Cerrar" v-close-popup />
          <q-btn
            unelevated
            no-caps
            color="negative"
            icon="open_in_new"
            label="Abrir proceso HTTPS"
            @click="openExternalLink(deleteAccountUrl)"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import AppPanel from '@antojados/ui/base/AppPanel.vue'
import ButtonBarBase from '@antojados/ui/base/ButtonBarBase.vue'
import EntityGridBase from '@antojados/ui/base/EntityGridBase.vue'
import FieldEditorBase from '@antojados/ui/base/FieldEditorBase.vue'
import { useAuth } from '@antojados/api/composables/useAuth'
import { useLocationScope } from '@antojados/api/composables/useLocationScope'

const $q = useQuasar()
const { cityCode: activeCityCode, requestDeviceGeo } = useLocationScope('los_chidos')

const {
  profile,
  session,
  isAuthenticated,
  hydrateSession,
  login,
  registerSocial,
  registerSponsor,
  registerEmployee,
  logout,
  fetchProfile,
  saveProfile,
  requestPasswordRecovery,
  verifyPasswordRecovery,
  resetPasswordRecovery,
  loginState,
  socialRegisterState,
  sponsorRegisterState,
  employeeRegisterState,
  profileState,
  updateProfileState,
  passwordRecoveryState,
  passwordVerifyState,
  passwordResetState,
} = useAuth()

const sectionKey = ref('session')
const authScreenKey = ref('login')
const authMode = ref('signup-user')
const showPassword = ref(false)
const tragonAreaKey = ref('perfil')
const isLegalDialogOpen = ref(false)
const isDeleteAccountDialogOpen = ref(false)
const privacyPolicyUrl = 'https://antojadosmx.mx/aviso-privacidad.html'
const deleteAccountUrl = 'https://antojadosmx.mx/eliminar-cuenta.html'
const childSafetyUrl = 'https://antojadosmx.mx/estandares-seguridad-infantil.html'
const supportMailUrl = 'mailto:antojadosmx2026@antojadosmx.mx'

const legalCenterLinks = [
  {
    key: 'privacy',
    label: 'Aviso de privacidad',
    caption: privacyPolicyUrl,
    href: privacyPolicyUrl,
    icon: 'privacy_tip',
  },
  {
    key: 'support',
    label: 'Soporte',
    caption: 'antojadosmx2026@antojadosmx.mx',
    href: supportMailUrl,
    icon: 'support_agent',
  },
  {
    key: 'delete-account',
    label: 'Eliminar cuenta',
    caption: deleteAccountUrl,
    href: deleteAccountUrl,
    icon: 'delete_outline',
  },
  {
    key: 'child-safety',
    label: 'Estandares de seguridad infantil',
    caption: childSafetyUrl,
    href: childSafetyUrl,
    icon: 'verified_user',
  },
]

const loginForm = reactive({
  email: '',
  password: '',
})

const userForm = reactive({
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const sponsorForm = reactive({
  fullName: '',
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
  businessName: '',
  bizType: '',
  cityCode: '',
  phone: '',
})

const employeeForm = reactive({
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  inviteCode: '',
})

const recoveryForm = reactive({
  email: '',
  recoveryRequestId: '',
  recoveryCode: '',
  password: '',
  confirmPassword: '',
})

const recoveryMeta = reactive({
  channel: '',
  message: '',
  expiresAt: '',
})

const profileForm = reactive({
  displayName: '',
  bio: '',
  avatarUrl: '',
})

const sectionButtons = computed(() => [
  { key: 'session', label: 'Sesion' },
  { key: 'profile', label: 'Perfil' },
  { key: 'account', label: 'Cuenta' },
  { key: 'status', label: 'Estado' },
  { key: 'actions', label: 'Acciones' },
])

const authScreenButtons = computed(() => [
  { key: 'login', label: 'Entrar' },
  { key: 'registro', label: 'Crear' },
  { key: 'recuperacion', label: 'Recuperar' },
  { key: 'tragon', label: 'Libre' },
])

const tragonAreaButtons = computed(() => [
  { key: 'perfil', label: 'Perfil' },
  { key: 'bandeja', label: 'Bandeja' },
])

const authModeButtons = computed(() => [
  { key: 'signup-user', label: 'Usuario' },
  { key: 'signup-sponsor', label: 'Sponsor' },
  { key: 'employee', label: 'Empleado' },
])

const loginFields = computed(() => {
  const passwordType = showPassword.value ? 'text' : 'password'
  return [
    { key: 'email', label: 'Correo o username' },
    { key: 'password', label: 'Contrasena', type: passwordType },
  ]
})

// Accepted test debt: password recovery consumes API; the out-of-band delivery channel is pending.
const recoveryFields = computed(() => {
  const passwordType = showPassword.value ? 'text' : 'password'
  return [
    { key: 'email', label: 'Correo de recuperacion' },
    { key: 'recoveryRequestId', label: 'Recovery request id' },
    { key: 'recoveryCode', label: 'Codigo de recuperacion' },
    { key: 'password', label: 'Nueva contrasena', type: passwordType },
    { key: 'confirmPassword', label: 'Confirmar nueva contrasena', type: passwordType },
  ]
})

const loginActionButtons = computed(() => [
  { key: 'login', label: 'Entrar', loading: loginState.loading, variant: 'primary' },
])

const recoveryActionButtons = computed(() => [
  {
    key: 'submit',
    label: 'Solicitar o actualizar recuperacion',
    loading: passwordRecoveryState.loading || passwordVerifyState.loading || passwordResetState.loading,
    variant: 'primary',
  },
])

const authActionButtons = computed(() => {
  const actionMap = {
    'signup-user': { key: 'submit', label: 'Crear cuenta social', loading: socialRegisterState.loading, variant: 'primary' },
    'signup-sponsor': { key: 'submit', label: 'Crear cuenta sponsor', loading: sponsorRegisterState.loading, variant: 'primary' },
    employee: { key: 'submit', label: 'Crear cuenta empleado', loading: employeeRegisterState.loading, variant: 'primary' },
  }

  return [actionMap[authMode.value] || actionMap['signup-user']]
})

const profileActionButtons = computed(() => [
  { key: 'guardar', label: 'Guardar perfil', loading: updateProfileState.loading, variant: 'primary' },
  { key: 'recargar', label: 'Recargar perfil', loading: profileState.loading },
])

const sessionActionButtons = computed(() => [
  { key: 'rehidratar', label: 'Rehidratar' },
  { key: 'guardar', label: 'Guardar perfil' },
  { key: 'logout', label: 'Cerrar sesion', variant: 'primary' },
])

const heroTitle = computed(() => {
  if (!isAuthenticated.value) return 'Identidad, acceso y cuenta'
  return profile.value?.name || session.value?.displayName || session.value?.email || 'Mi cuenta'
})

const heroSubtitle = computed(() => {
  if (!isAuthenticated.value) {
    return 'Tragon controla login, creacion de cuentas social, sponsor y empleado, mas recuperacion de contrasena.'
  }

  if (session.value?.instanceType === 'sponsor') {
    return 'Sesion sponsor activa. Equipo y Registro vendran despues, pero la identidad ya corre desde Tragon.'
  }

  return 'Sesion social activa para consumo de perfil y controles personales.'
})

const authSectionTitle = computed(() => {
  if (authMode.value === 'signup-user') return 'Crear cuenta social'
  if (authMode.value === 'signup-sponsor') return 'Crear cuenta sponsor'
  if (authMode.value === 'employee') return 'Crear cuenta empleado'
  return 'Crear cuenta'
})

const authInfoText = computed(() => {
  if (authMode.value === 'signup-sponsor') {
    return `Ciudad operativa: ${sponsorForm.cityCode || activeCityCode.value || 'pendiente'}.`
  }
  return 'Datos de identidad para la cuenta.'
})

const authFields = computed(() => {
  const passwordType = showPassword.value ? 'text' : 'password'

  if (authMode.value === 'signup-user') {
    return [
      { key: 'fullName', label: 'Nombre completo' },
      { key: 'email', label: 'Correo' },
      { key: 'password', label: 'Contrasena', type: passwordType },
      { key: 'confirmPassword', label: 'Confirmar contrasena', type: passwordType },
    ]
  }

  if (authMode.value === 'signup-sponsor') {
    return [
      { key: 'fullName', label: 'Nombre del usuario sponsor' },
      { key: 'email', label: 'Correo' },
      { key: 'username', label: 'Username sponsor' },
      { key: 'password', label: 'Contrasena', type: passwordType },
      { key: 'confirmPassword', label: 'Confirmar contrasena', type: passwordType },
      { key: 'businessName', label: 'Nombre comercial' },
      { key: 'bizType', label: 'Tipo de negocio' },
      { key: 'cityCode', label: 'Ciudad operativa' },
      { key: 'phone', label: 'Telefono' },
    ]
  }

  if (authMode.value === 'employee') {
    return [
      { key: 'fullName', label: 'Nombre completo' },
      { key: 'email', label: 'Correo' },
      { key: 'password', label: 'Contrasena', type: passwordType },
      { key: 'confirmPassword', label: 'Confirmar contrasena', type: passwordType },
      { key: 'inviteCode', label: 'Codigo de invitacion' },
    ]
  }
  return []
})

const authModel = computed(() => {
  if (authMode.value === 'signup-user') return userForm
  if (authMode.value === 'signup-sponsor') return sponsorForm
  if (authMode.value === 'employee') return employeeForm
  return userForm
})

const profileFields = [
  { key: 'displayName', label: 'Nombre visible' },
  { key: 'bio', label: 'Bio' },
  { key: 'avatarUrl', label: 'Avatar URL' },
]

const recoveryColumns = [
  { key: 'field', label: 'Campo' },
  { key: 'value', label: 'Valor' },
]

const templateColumns = [
  { key: 'field', label: 'Campo' },
  { key: 'value', label: 'Valor' },
]

const accountColumns = [
  { key: 'field', label: 'Campo' },
  { key: 'value', label: 'Valor' },
]

const sessionColumns = [
  { key: 'field', label: 'Campo' },
  { key: 'value', label: 'Valor' },
]

const metaColumns = [
  { key: 'field', label: 'Campo' },
  { key: 'value', label: 'Valor' },
]

const recoveryRows = computed(() => {
  if (!recoveryForm.recoveryRequestId) return []

  return [
    { id: 'request', field: 'Recovery request id', value: recoveryForm.recoveryRequestId },
    { id: 'channel', field: 'Canal reportado', value: recoveryMeta.channel || 'Sin canal real' },
    { id: 'expires', field: 'Expira', value: recoveryMeta.expiresAt || 'No informado' },
    { id: 'message', field: 'Estado', value: recoveryMeta.message || 'Solicitud creada' },
  ]
})

const tragonPerfilTemplateRows = computed(() => [
  { id: 'perfil-1', field: 'Area', value: 'Perfil' },
  { id: 'perfil-2', field: 'Header', value: 'Avatar, nombre visible, correo' },
  { id: 'perfil-3', field: 'Stats', value: 'Posts, siguiendo, seguidores' },
  { id: 'perfil-4', field: 'KPIs', value: 'Puntos, score, rewards, ranking' },
  { id: 'perfil-5', field: 'Cuenta', value: 'Privacidad, tema, logout, editar perfil' },
])

const tragonBandejaTemplateRows = computed(() => [
  { id: 'bandeja-1', field: 'Area', value: 'Bandeja' },
  { id: 'bandeja-2', field: 'Contenido', value: 'Publicaciones pendientes o propias' },
  { id: 'bandeja-3', field: 'Acciones', value: 'Reintentar, descartar, compartir' },
  { id: 'bandeja-4', field: 'Estado vacio', value: 'Sincronizacion pendiente / sin publicaciones' },
  { id: 'bandeja-5', field: 'Destino', value: 'Shell Tragón separado de Auth' },
])

const recoveryStatusMessage = computed(() => {
  if (!recoveryForm.recoveryRequestId) return ''
  if (recoveryMeta.channel === 'direct_response') {
    return 'La API reporta direct_response. La UI ya no muestra el codigo, pero todavia falta integrar envio real por correo o SMS en backend.'
  }
  return recoveryMeta.message || 'Solicitud de recuperacion creada.'
})

const profileName = computed(() => profile.value?.name || session.value?.displayName || session.value?.email || 'Tragon')
const profileInitial = computed(() => profileName.value.trim().charAt(0).toUpperCase() || 'T')

const statCards = computed(() => [
  { label: 'Cuenta', value: isAuthenticated.value ? 'Activa' : 'Nueva' },
  { label: 'Contexto', value: session.value?.instanceType === 'sponsor' ? 'Sponsor' : (isAuthenticated.value ? 'Social' : 'Acceso') },
  { label: 'Sesion', value: isAuthenticated.value ? 'Local' : 'Libre' },
])

const kpis = computed(() => [
  { label: 'Seguidores', value: String(profile.value?.followerCount || 0), note: 'Lectura API' },
  { label: 'Siguiendo', value: String(profile.value?.followingCount || 0), note: 'Lectura API' },
  { label: 'Reputacion', value: String(profile.value?.reputationLevel || 0), note: 'auth_identities' },
  { label: 'Reviewer', value: profile.value?.verifiedReviewer ? 'Si' : 'No', note: 'Bandera actual' },
])

const accountRows = computed(() => [
  { id: 'email', field: 'Correo', value: session.value?.email || '' },
  { id: 'name', field: 'Nombre visible', value: profile.value?.name || session.value?.displayName || '' },
  { id: 'username', field: 'Username', value: profile.value?.username || session.value?.username || '' },
  { id: 'city', field: 'City code', value: profile.value?.cityCode || session.value?.cityCode || '' },
  { id: 'bio', field: 'Bio', value: profile.value?.bio || '' },
])

const sessionRows = computed(() => [
  { id: 'userId', field: 'User ID', value: session.value?.userId || '' },
  { id: 'instanceType', field: 'Instance type', value: session.value?.instanceType || '' },
  { id: 'domainContext', field: 'Domain context', value: session.value?.domainContext || '' },
  { id: 'instanceId', field: 'Instance ID', value: session.value?.instanceId || '' },
  { id: 'tenantUserId', field: 'Tenant user ID', value: session.value?.tenantUserId || '' },
])

const metaRows = computed(() => [
  { id: 'instagram', field: 'Instagram', value: profile.value?.instagramHandle || '' },
  { id: 'facebook', field: 'Facebook', value: profile.value?.facebookUrl || '' },
  { id: 'tiktok', field: 'TikTok', value: profile.value?.tiktokHandle || '' },
  { id: 'x', field: 'X', value: profile.value?.xHandle || '' },
  { id: 'whatsapp', field: 'WhatsApp', value: profile.value?.whatsappNumber || '' },
  { id: 'status', field: 'Status', value: profile.value?.status || '' },
  { id: 'economicStatus', field: 'Economic status', value: profile.value?.economicStatus || '' },
])

watch(
  () => isAuthenticated.value,
  (nextValue) => {
    if (nextValue) {
      sectionKey.value = 'session'
      return
    }

    authScreenKey.value = 'login'
  },
  { immediate: true },
)

watch(
  () => profile.value,
  (nextProfile) => {
    profileForm.displayName = nextProfile?.name || session.value?.displayName || ''
    profileForm.bio = nextProfile?.bio || ''
    profileForm.avatarUrl = nextProfile?.avatarUrl || ''
  },
  { immediate: true },
)

function notifyError(error, fallback) {
  const message = error && typeof error === 'object' && 'message' in error
    ? String(error.message || fallback)
    : error instanceof Error
      ? error.message
      : String(error || fallback)
  $q.notify({ type: 'negative', message: message || fallback })
}

function notifyWarning(message) {
  $q.notify({ type: 'warning', message })
}

function openLegalCenter() {
  isLegalDialogOpen.value = true
}

function openDeleteAccount() {
  isDeleteAccountDialogOpen.value = true
}

function openExternalLink(href) {
  if (typeof window === 'undefined' || !href) return

  if (href.startsWith('mailto:')) {
    window.location.href = href
    return
  }

  const opened = window.open(href, '_blank', 'noopener,noreferrer')
  if (!opened) {
    window.location.href = href
  }
}

function text(value) {
  return String(value || '').trim()
}

function normalizedEmail(value) {
  return text(value).toLowerCase()
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail(value))
}

function requireFields(model, fields) {
  const missing = fields
    .filter(({ key }) => !text(model[key]))
    .map(({ label }) => label)

  if (!missing.length) return true
  notifyWarning(`Faltan datos: ${missing.join(', ')}.`)
  return false
}

function requireEmail(value, label = 'correo') {
  if (isValidEmail(value)) return true
  notifyWarning(`Captura un ${label} valido.`)
  return false
}

function requirePasswordPair(model) {
  if (text(model.password).length < 8) {
    notifyWarning('La contrasena debe tener al menos 8 caracteres.')
    return false
  }

  if (text(model.password) !== text(model.confirmPassword || model.password)) {
    notifyWarning('La confirmacion de contrasena no coincide.')
    return false
  }

  return true
}

function validateLoginForm() {
  return requireFields(loginForm, [
    { key: 'email', label: 'correo o username' },
    { key: 'password', label: 'contrasena' },
  ])
}

function validateSocialRegisterForm() {
  return requireFields(userForm, [
    { key: 'fullName', label: 'nombre completo' },
    { key: 'email', label: 'correo' },
    { key: 'password', label: 'contrasena' },
    { key: 'confirmPassword', label: 'confirmar contrasena' },
  ]) && requireEmail(userForm.email) && requirePasswordPair(userForm)
}

function validateSponsorRegisterForm(cityCode) {
  // Shared iOS/TestFlight parity: sponsor registration must resolve to an instance axis.
  return requireFields(sponsorForm, [
    { key: 'fullName', label: 'nombre del usuario sponsor' },
    { key: 'email', label: 'correo' },
    { key: 'username', label: 'username sponsor' },
    { key: 'password', label: 'contrasena' },
    { key: 'confirmPassword', label: 'confirmar contrasena' },
    { key: 'businessName', label: 'nombre comercial' },
    { key: 'bizType', label: 'tipo de negocio' },
  ]) && requireEmail(sponsorForm.email) && requirePasswordPair(sponsorForm) && Boolean(cityCode || notifyWarning('Falta ciudad operativa.'))
}

function validateEmployeeRegisterForm() {
  return requireFields(employeeForm, [
    { key: 'fullName', label: 'nombre completo' },
    { key: 'email', label: 'correo' },
    { key: 'password', label: 'contrasena' },
    { key: 'confirmPassword', label: 'confirmar contrasena' },
    { key: 'inviteCode', label: 'codigo de invitacion' },
  ]) && requireEmail(employeeForm.email) && requirePasswordPair(employeeForm)
}

function mergeAuthModel(nextValue) {
  const target = authModel.value
  Object.assign(target, nextValue || {})
}

function mergeLoginForm(nextValue) {
  Object.assign(loginForm, nextValue || {})
}

function mergeRecoveryForm(nextValue) {
  Object.assign(recoveryForm, nextValue || {})
}

function mergeProfileForm(nextValue) {
  Object.assign(profileForm, nextValue || {})
}

function refreshLocationContext() {
  void requestDeviceGeo()
}

async function hydrateAndRefresh() {
  const currentSession = await hydrateSession()

  if (currentSession?.userId) {
    await fetchProfile()
    refreshLocationContext()
  }
}

async function submitLogin() {
  if (!validateLoginForm()) return

  try {
    await login({
      loginIdentifier: text(loginForm.email),
      password: loginForm.password,
    })
    $q.notify({ type: 'positive', message: 'Sesion iniciada.' })
    refreshLocationContext()
  } catch (error) {
    notifyError(error, 'No fue posible iniciar sesion.')
  }
}

async function submitSocialRegister() {
  if (!validateSocialRegisterForm()) return

  try {
    await registerSocial({
      fullName: text(userForm.fullName),
      email: normalizedEmail(userForm.email),
      password: userForm.password,
      confirmPassword: userForm.confirmPassword,
      marketingOptIn: false,
    })
    $q.notify({ type: 'positive', message: 'Cuenta social creada.' })
    refreshLocationContext()
  } catch (error) {
    notifyError(error, 'No fue posible crear la cuenta social.')
  }
}

async function submitSponsorRegister() {
  const resolvedCityCode = text(sponsorForm.cityCode) || activeCityCode.value || null
  if (!validateSponsorRegisterForm(resolvedCityCode)) return

  try {
    await registerSponsor({
      fullName: text(sponsorForm.fullName),
      email: normalizedEmail(sponsorForm.email),
      username: text(sponsorForm.username),
      password: sponsorForm.password,
      confirmPassword: sponsorForm.confirmPassword,
      businessName: text(sponsorForm.businessName),
      bizType: text(sponsorForm.bizType),
      cityCode: resolvedCityCode,
      phone: text(sponsorForm.phone) || null,
      marketingOptIn: false,
    })
    $q.notify({
      type: 'positive',
      message: 'Cuenta sponsor creada. El cierre operativo seguira despues en Mi Chamba / Equipo.',
      timeout: 5000,
    })
    refreshLocationContext()
  } catch (error) {
    notifyError(error, 'No fue posible crear la cuenta sponsor.')
  }
}

async function submitEmployeeRegister() {
  if (!validateEmployeeRegisterForm()) return

  try {
    await registerEmployee({
      fullName: text(employeeForm.fullName),
      email: normalizedEmail(employeeForm.email),
      password: employeeForm.password,
      confirmPassword: employeeForm.confirmPassword,
      inviteCode: text(employeeForm.inviteCode).toUpperCase(),
      marketingOptIn: false,
    })
    $q.notify({ type: 'positive', message: 'Cuenta empleado creada con invitacion.' })
    refreshLocationContext()
  } catch (error) {
    notifyError(error, 'No fue posible crear la cuenta empleado.')
  }
}

async function submitRecoveryRequest() {
  if (!requireFields(recoveryForm, [{ key: 'email', label: 'correo de recuperacion' }]) || !requireEmail(recoveryForm.email)) return

  try {
    const result = await requestPasswordRecovery({ email: normalizedEmail(recoveryForm.email) })
    recoveryForm.recoveryRequestId = result.recoveryRequestId
    recoveryMeta.channel = result.channel || ''
    recoveryMeta.message = result.message || ''
    recoveryMeta.expiresAt = result.expiresAt || ''

    $q.notify({
      type: result.channel === 'direct_response' ? 'warning' : 'positive',
      message:
        result.channel === 'direct_response'
          ? 'Solicitud creada, pero el backend aun no envia por correo o SMS.'
          : 'Solicitud de recuperacion creada.',
      timeout: 4500,
    })
  } catch (error) {
    notifyError(error, 'No fue posible solicitar recuperacion.')
  }
}

async function submitRecoveryVerify() {
  if (!requireFields(recoveryForm, [
    { key: 'recoveryRequestId', label: 'recovery request id' },
    { key: 'recoveryCode', label: 'codigo de recuperacion' },
  ])) return

  try {
    await verifyPasswordRecovery({
      recoveryRequestId: text(recoveryForm.recoveryRequestId),
      recoveryCode: text(recoveryForm.recoveryCode),
    })
    $q.notify({ type: 'positive', message: 'Codigo verificado.' })
  } catch (error) {
    notifyError(error, 'No fue posible verificar el codigo.')
  }
}

async function submitRecoveryReset() {
  if (!requireFields(recoveryForm, [
    { key: 'recoveryRequestId', label: 'recovery request id' },
    { key: 'recoveryCode', label: 'codigo de recuperacion' },
    { key: 'password', label: 'nueva contrasena' },
    { key: 'confirmPassword', label: 'confirmar nueva contrasena' },
  ]) || !requirePasswordPair(recoveryForm)) return

  try {
    await resetPasswordRecovery({
      recoveryRequestId: text(recoveryForm.recoveryRequestId),
      recoveryCode: text(recoveryForm.recoveryCode),
      password: recoveryForm.password,
      confirmPassword: recoveryForm.confirmPassword,
    })
    $q.notify({ type: 'positive', message: 'Contrasena actualizada.' })
  } catch (error) {
    notifyError(error, 'No fue posible resetear la contrasena.')
  }
}

async function submitProfileUpdate() {
  try {
    await saveProfile({
      displayName: profileForm.displayName,
      bio: profileForm.bio,
      avatarUrl: profileForm.avatarUrl,
    })
    $q.notify({ type: 'positive', message: 'Perfil actualizado.' })
  } catch (error) {
    notifyError(error, 'No fue posible actualizar el perfil.')
  }
}

async function submitLogout() {
  try {
    await logout()
    $q.notify({ type: 'positive', message: 'Sesion cerrada.' })
  } catch (error) {
    notifyError(error, 'No fue posible cerrar sesion.')
  }
}

async function onAuthAction({ key }) {
  if (key !== 'submit') return

  if (authMode.value === 'signup-user') {
    await submitSocialRegister()
    return
  }

  if (authMode.value === 'signup-sponsor') {
    await submitSponsorRegister()
    return
  }

  if (authMode.value === 'employee') {
    await submitEmployeeRegister()
    return
  }
}

async function onProfileAction({ key }) {
  if (key === 'guardar') {
    await submitProfileUpdate()
  }

  if (key === 'recargar') {
    await fetchProfile()
  }
}

async function onSessionAction({ key }) {
  if (key === 'rehidratar') {
    await hydrateAndRefresh()
    return
  }

  if (key === 'guardar') {
    await submitProfileUpdate()
    return
  }

  if (key === 'logout') {
    await submitLogout()
  }
}

async function onLoginAction({ key }) {
  if (key === 'login') {
    await submitLogin()
  }
}

async function onRecoveryAction({ key }) {
  if (key !== 'submit') return

  if (!recoveryForm.recoveryRequestId) {
    await submitRecoveryRequest()
    return
  }

  if (recoveryForm.recoveryCode && recoveryForm.password) {
    await submitRecoveryReset()
    return
  }

  if (recoveryForm.recoveryCode) {
    await submitRecoveryVerify()
    return
  }

  await submitRecoveryRequest()
}

onMounted(async () => {
  await hydrateAndRefresh()
})
</script>

<style scoped>
.tragon-component {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.tragon-component__hero {
  display: grid;
  gap: 16px;
  padding: 18px;
  border-radius: 22px;
  background:
    radial-gradient(circle at top right, rgba(0, 188, 212, 0.16), transparent 34%),
    linear-gradient(180deg, rgba(18, 26, 34, 0.96), rgba(9, 13, 18, 0.98));
  border: 1px solid rgba(255, 255, 255, 0.08);
  min-width: 0;
}

.tragon-component__identity {
  display: flex;
  gap: 14px;
  align-items: center;
  min-width: 0;
}

.tragon-component__identity-copy {
  min-width: 0;
}

.tragon-component__avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 22px;
  color: #fff;
  background: rgba(0, 188, 212, 0.2);
  border: 1px solid rgba(0, 188, 212, 0.42);
  flex: 0 0 auto;
}

.tragon-component__eyebrow {
  margin: 0 0 6px;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(0, 188, 212, 0.84);
}

.tragon-component__identity h2,
.tragon-component__identity p {
  margin: 0;
  overflow-wrap: anywhere;
}

.tragon-component__identity p:last-child {
  margin-top: 6px;
  color: rgba(255, 255, 255, 0.68);
}

.tragon-component__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.tragon-component__kpis {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.stat-card,
.kpi-card {
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.03);
  border-radius: 18px;
  min-width: 0;
}

.stat-card {
  display: grid;
  gap: 4px;
  padding: 14px;
}

.stat-card__value {
  font-size: 24px;
  font-weight: 800;
  line-height: 1;
}

.stat-card__label {
  font-weight: 700;
  overflow-wrap: anywhere;
}

.kpi-card {
  display: grid;
  gap: 4px;
  padding: 14px;
}

.kpi-card span,
.kpi-card small {
  color: rgba(255, 255, 255, 0.62);
  overflow-wrap: anywhere;
}

.kpi-card strong {
  font-size: 22px;
}

.tragon-form__note {
  display: grid;
  gap: 8px;
}

.tragon-bar-bleed {
  width: calc(100% + 28px);
  margin-left: -14px;
  margin-right: -14px;
  min-width: 0;
}

.tragon-component__secondary-action {
  width: 100%;
  margin-top: 10px;
}

.tragon-banner {
  font-size: 12px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.tragon-banner--info {
  background: rgba(0, 188, 212, 0.12);
  border: 1px solid rgba(0, 188, 212, 0.28);
  color: rgba(255, 255, 255, 0.84);
}

.account-value {
  font-weight: 700;
  overflow-wrap: anywhere;
}

.tragon-dialog {
  width: min(420px, calc(100vw - 24px));
  background: rgba(11, 18, 26, 0.98);
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.tragon-dialog__title {
  font-size: 18px;
  font-weight: 800;
}

.tragon-dialog__subtitle {
  margin-top: 6px;
  color: rgba(255, 255, 255, 0.64);
  font-size: 12px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.tragon-dialog__list :deep(.q-item__label--caption) {
  color: rgba(255, 255, 255, 0.56);
  overflow-wrap: anywhere;
}

.tragon-panel--fullbleed :deep(.q-card__section) {
  padding-left: 0;
  padding-right: 0;
}

.tragon-panel--fullbleed :deep(.q-card__section:first-child) {
  padding-left: 16px;
  padding-right: 16px;
}

.tragon-panel :deep(.q-card__section) {
  min-width: 0;
}

@media (max-width: 640px) {
  .tragon-component__stats,
  .tragon-component__kpis {
    grid-template-columns: 1fr;
  }

  .tragon-component__identity {
    align-items: flex-start;
  }
}
</style>
