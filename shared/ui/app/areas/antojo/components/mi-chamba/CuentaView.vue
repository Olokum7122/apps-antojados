<template>
  <section class="mc-page">
    <button-bar-base model-value="pago" :buttons="buttons" :grid-columns="3" />
    <field-editor-base
      title="Cuenta y pagos sponsor"
      :fields="fields"
      :model-value="model"
      info-text="Android hoy la deja como mock pendiente para metodo de pago, CFDI y suscripcion."
    />
    <entity-grid-base :columns="columns" :rows="rows" row-key="id" />
  </section>
</template>

<script setup>
import ButtonBarBase from '@antojados/ui/base/ButtonBarBase.vue'
import EntityGridBase from '@antojados/ui/base/EntityGridBase.vue'
import FieldEditorBase from '@antojados/ui/base/FieldEditorBase.vue'

// Accepted test debt: Cuenta remains mock for iOS/TestFlight parity until payment/CFDI API is ready.
const buttons = [
  { key: 'pago', label: 'Metodo de pago' },
  { key: 'cfdi', label: 'Facturas' },
  { key: 'suscripcion', label: 'Suscripcion' },
]
const fields = [
  { key: 'titular', label: 'Titular' },
  { key: 'cobro', label: 'Proximo cobro' },
  { key: 'estado', label: 'Estado de cuenta' },
]
const model = {
  titular: 'Taqueria Demo',
  cobro: '15/07/2026',
  estado: 'Pendiente de implementar en Android',
}
const columns = [
  { key: 'item', label: 'Cuenta' },
  { key: 'status', label: 'Estado' },
  { key: 'action', label: 'Accion' },
]
const rows = [
  { id: 'cp1', item: 'Metodo de pago', status: 'Pendiente', action: 'Configurar' },
  { id: 'cp2', item: 'Facturas CFDI', status: 'Pendiente', action: 'Consultar' },
  { id: 'cp3', item: 'Suscripcion sponsor', status: 'Pendiente', action: 'Revisar' },
]
</script>

<style scoped>
.mc-page {
  display: grid;
  gap: 10px;
  min-width: 0;
}
</style>
