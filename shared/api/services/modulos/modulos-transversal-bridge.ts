const MODULOS_TRANSVERSAL_DRAFT_KEY = 'michamba:modulos:transversal-draft'

export interface ModulosTransversalDraftItem {
  template_location_id: string | null
  location_id: string | null
  component_code: string | null
  dimension_code: string | null
  subscription_label: string
  enabled: boolean
}

export interface ModulosTransversalDraft {
  source: string
  instance_id: string
  business_name: string | null
  created_at: string
  items: ModulosTransversalDraftItem[]
}

function normalizeText(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function normalizeDraftItem(item: Record<string, unknown>, index: number): ModulosTransversalDraftItem {
  const locationId = normalizeText(item.location_id)
  const componentCode = normalizeText(item.component_code)
  const templateLocationId = normalizeText(item.template_location_id)
  const dimensionCode = normalizeText(item.dimension_code)
  const subscriptionLabel = normalizeText(item.subscription_label)

  if (!locationId && !componentCode && !templateLocationId) {
    throw new Error(`modulosTransversalBridge: item ${index + 1} sin location_id, component_code ni template_location_id`)
  }

  return {
    template_location_id: templateLocationId || null,
    location_id: locationId || null,
    component_code: componentCode || null,
    dimension_code: dimensionCode || null,
    subscription_label: subscriptionLabel || componentCode || dimensionCode || `suscripcion_${index + 1}`,
    enabled: item.enabled === true,
  }
}

function normalizeDraft(payload: Record<string, unknown>): ModulosTransversalDraft {
  const instanceId = normalizeText(payload.instance_id)
  if (!instanceId) {
    throw new Error('modulosTransversalBridge: instance_id requerido')
  }

  const rawItems = Array.isArray(payload.items) ? payload.items : []
  if (rawItems.length === 0) {
    throw new Error('modulosTransversalBridge: items requerido')
  }

  return {
    source: normalizeText(payload.source) || 'gt-transversal',
    instance_id: instanceId,
    business_name: normalizeText(payload.business_name) || null,
    created_at: normalizeText(payload.created_at) || new Date().toISOString(),
    items: rawItems.map((item, index) => normalizeDraftItem((item || {}) as Record<string, unknown>, index)),
  }
}

export function readTransversalModuleDraft(): ModulosTransversalDraft | null {
  const raw = localStorage.getItem(MODULOS_TRANSVERSAL_DRAFT_KEY)
  if (!raw) return null

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>
  } catch {
    throw new Error('modulosTransversalBridge: draft invalido en storage')
  }

  return normalizeDraft(parsed)
}

export function clearTransversalModuleDraft(): void {
  localStorage.removeItem(MODULOS_TRANSVERSAL_DRAFT_KEY)
}
