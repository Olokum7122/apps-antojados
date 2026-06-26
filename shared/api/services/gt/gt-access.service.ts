import { ref } from 'vue'
import type { AxiosInstance } from 'axios'
import { httpClient } from '@antojados/http/client'
import { API_ENDPOINTS } from '@antojados/http/endpoints'
import { apiConfig } from '@antojados/http/config/api'
import type { TragonSession } from '@antojados/api/types/auth'

const GT_ACCESS_STORAGE_KEY = 'antojados.gt.checked.snapshot.v3'
const GRANULAR_LEVELS = new Set(['BUTTON', 'FULLSCREEN', 'DIALOG', 'SUB_COMPONENT', 'SUBTAB'])

export const gtAccessRevision = ref(0)

let activeCheckedEventSource: EventSource | null = null
let activeCheckedInstanceId = ''

export interface GtCheckedRow {
  code: string
  visible: boolean
  enabled: boolean
}

export interface GtCheckedSnapshot {
  session: {
    userId: string | null
    instanceId: string | null
    instanceType: 'user' | 'sponsor' | null
    domainContext: 'user' | 'sponsor' | null
    tenantUserId: string | null
  }
  dimension_locations: GtCheckedRow[]
  sub_dimension_locations: GtCheckedRow[]
  refreshed_at: string
}

export interface GtMetadataAccessResult {
  visible: boolean
  enabled: boolean
  reason: string
}

function bumpRevision(): void {
  gtAccessRevision.value += 1
}

function normalizeCode(value: unknown): string {
  return String(value || '').trim().toUpperCase()
}

function addCodeAlias(codes: string[], value: unknown): void {
  const code = normalizeCode(value)
  if (!code || codes.includes(code)) return
  codes.push(code)
}

function dimensionCodeAliases(row: Record<string, unknown>): string[] {
  const codes: string[] = []
  addCodeAlias(codes, row.dimension_code)
  addCodeAlias(codes, row.code)
  addCodeAlias(codes, row.component_code)
  addCodeAlias(codes, row.area_code)
  addCodeAlias(codes, row.module_code)

  for (const code of [...codes]) {
    const tabless = code.endsWith('.TAB') ? code.slice(0, -4) : code
    addCodeAlias(codes, tabless)

    if (tabless.startsWith('PARA_TI.')) {
      addCodeAlias(codes, `ANTOJADOS.${tabless}`)
    }
    if (tabless.startsWith('COMUNIDAD.')) {
      addCodeAlias(codes, `ANTOJADOS.${tabless}`)
    }
    if (tabless.startsWith('MI_CHAMBA.')) {
      addCodeAlias(codes, `ANTOJO.${tabless}`)
    }
  }

  return codes
}

function normalizeParentCode(value: unknown): string | null {
  const normalized = normalizeCode(value)
  if (!normalized || normalized === 'ROOT') return null
  return normalized
}

function toFlag(value: unknown, fallback = false): boolean {
  if (value === null || value === undefined || value === '') return fallback
  return value === true || value === 1 || value === '1' || value === 'true'
}

function resolveSessionInstanceType(session: TragonSession | null | undefined): 'user' | 'sponsor' {
  return session?.instanceType === 'sponsor' || session?.domainContext === 'sponsor'
    ? 'sponsor'
    : 'user'
}

function rowsFrom(data: unknown, primaryKey: string): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[]
  const container = (data && typeof data === 'object') ? (data as Record<string, unknown>) : {}
  const direct = container[primaryKey]
  if (Array.isArray(direct)) return direct as Record<string, unknown>[]
  if (Array.isArray(container.rows)) return container.rows as Record<string, unknown>[]
  if (Array.isArray(container.data)) return container.data as Record<string, unknown>[]
  return []
}

function normalizeDimensionRows(raw: unknown): GtCheckedRow[] {
  const container = (raw && typeof raw === 'object') ? (raw as Record<string, unknown>) : {}
  const instanceType = normalizeCode(container.instance_type || (container.instance as Record<string, unknown> | undefined)?.instance_type)

  return rowsFrom(raw, 'dimension_locations')
    .flatMap((row) => {
      const codes = dimensionCodeAliases(row)
      if (!codes.length) return []

      const controlMode = normalizeCode(row.control_mode)
      if (instanceType === 'SPONSOR' && controlMode && controlMode !== 'OPERABLE') {
        return []
      }

      const checked = toFlag(row.is_checked, false)
      const sponsorVisible = row.visible_override == null ? checked : toFlag(row.visible_override, false)
      const sponsorEnabled = row.enabled_override == null ? checked : toFlag(row.enabled_override, false)
      const visible = instanceType === 'SPONSOR'
        ? sponsorVisible
        : toFlag(row.effective_visible, toFlag(row.visible, false))
      const enabled = instanceType === 'SPONSOR'
        ? sponsorEnabled
        : toFlag(row.effective_enabled, toFlag(row.enabled, false))

      return codes.map((code) => ({
        code,
        visible,
        enabled,
      }))
    })
}

function normalizeSubDimensionRows(raw: unknown): GtCheckedRow[] {
  const container = (raw && typeof raw === 'object') ? (raw as Record<string, unknown>) : {}
  const instanceType = normalizeCode(container.instance_type || (container.instance as Record<string, unknown> | undefined)?.instance_type)

  return rowsFrom(raw, 'sub_dimension_locations')
    .map((row) => {
      const code = normalizeCode(row.sub_code || row.code)
      if (!code) return null

      const controlMode = normalizeCode(row.control_mode)
      if (instanceType === 'SPONSOR' && controlMode && controlMode !== 'OPERABLE') {
        return null
      }

      const checked = toFlag(row.is_checked, false)
      const sponsorVisible = row.visible_override == null ? checked : toFlag(row.visible_override, false)
      const sponsorEnabled = row.enabled_override == null ? checked : toFlag(row.enabled_override, false)

      return {
        code,
        visible: instanceType === 'SPONSOR'
          ? sponsorVisible
          : toFlag(row.effective_visible, toFlag(row.visible, false)),
        enabled: instanceType === 'SPONSOR'
          ? sponsorEnabled
          : toFlag(row.effective_enabled, toFlag(row.enabled, false)),
      }
    })
    .filter((row): row is GtCheckedRow => Boolean(row))
}

function normalizeTemplateDimensionRows(raw: unknown): GtCheckedRow[] {
  return rowsFrom(raw, 'dimension_locations')
    .flatMap((row) => {
      const codes = dimensionCodeAliases(row)
      if (!codes.length) return []
      const visible = toFlag(row.visible, false)
      const enabled = toFlag(row.enabled, false)
      return codes.map((code) => ({
        code,
        visible,
        enabled,
      }))
    })
}

function buildSubDimensionCatalogById(raw: unknown): Map<string, { sub_code: string }> {
  const catalog = new Map<string, { sub_code: string }>()
  for (const row of rowsFrom(raw, 'rows')) {
    const subDimensionId = String(row.sub_dimension_id || '').trim()
    const subCode = normalizeCode(row.sub_code || row.code)
    if (!subDimensionId || !subCode) continue
    catalog.set(subDimensionId, { sub_code: subCode })
  }
  return catalog
}

function normalizeTemplateSubDimensionRows(raw: unknown, catalogById: Map<string, { sub_code: string }>): GtCheckedRow[] {
  return rowsFrom(raw, 'sub_dimension_locations')
    .map((row) => {
      const subDimensionId = String(row.sub_dimension_id || '').trim()
      const catalogMatch = subDimensionId ? catalogById.get(subDimensionId) : null
      const code = normalizeCode(row.sub_code || row.code || catalogMatch?.sub_code)
      if (!code) return null
      const enabled = toFlag(row.enabled, false)
      return {
        code,
        visible: toFlag(row.visible, enabled),
        enabled,
      }
    })
    .filter((row): row is GtCheckedRow => Boolean(row))
}

function mergeRows(primaryRows: GtCheckedRow[], fallbackRows: GtCheckedRow[]): GtCheckedRow[] {
  const merged = new Map<string, GtCheckedRow>()
  for (const row of primaryRows || []) merged.set(row.code, row)
  for (const row of fallbackRows || []) {
    if (!merged.has(row.code)) merged.set(row.code, row)
  }
  return [...merged.values()]
}

function writeSnapshot(snapshot: GtCheckedSnapshot): void {
  localStorage.setItem(GT_ACCESS_STORAGE_KEY, JSON.stringify(snapshot))
  bumpRevision()
}

export function readStoredGtAccessSnapshot(): GtCheckedSnapshot | null {
  gtAccessRevision.value
  const raw = localStorage.getItem(GT_ACCESS_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as GtCheckedSnapshot
  } catch {
    return null
  }
}

function clearStoredSnapshot(): void {
  localStorage.removeItem(GT_ACCESS_STORAGE_KEY)
  bumpRevision()
}

export function clearGtAccessCache(): void {
  clearStoredSnapshot()
  if (activeCheckedEventSource) {
    activeCheckedEventSource.close()
    activeCheckedEventSource = null
  }
  activeCheckedInstanceId = ''
}

function findRow(rows: GtCheckedRow[], code: string | null): GtCheckedRow | null {
  if (!code) return null
  const normalizedCode = normalizeCode(code)
  return rows.find((row) => normalizeCode(row.code) === normalizedCode) || null
}

function resolveLocationMatches(snapshot: GtCheckedSnapshot, metadata: Record<string, unknown>) {
  const level = normalizeCode(metadata.level || metadata.subdimType || metadata['subdim-type'] || metadata.subdim_type)
  const primaryCode = normalizeCode(metadata.ik || metadata.subdimIk || metadata['subdim-ik'])
  const parentCode = normalizeParentCode(metadata.pc || metadata.subdimPc || metadata['subdim-pc'])
  const dimCode = normalizeCode(metadata.dim_code || metadata.dimCode || metadata['subdim-dim-code'])
  const codeComponent = normalizeCode(metadata.codeComponent || metadata.componentCode || metadata.subLocationCode)
  const fullSearchCode = primaryCode && parentCode
    ? (primaryCode.startsWith(`${parentCode}.`) ? primaryCode : normalizeCode(`${parentCode}.${primaryCode}`))
    : primaryCode
  const searchCodes = [codeComponent, dimCode, fullSearchCode, primaryCode].filter(Boolean)

  let primaryDimension: GtCheckedRow | null = null
  let primarySubDimension: GtCheckedRow | null = null
  for (const code of searchCodes) {
    primaryDimension = primaryDimension || findRow(snapshot.dimension_locations, code)
    primarySubDimension = primarySubDimension || findRow(snapshot.sub_dimension_locations, code)
    if (primaryDimension || primarySubDimension) break
  }

  const parentDimension = parentCode
    ? (findRow(snapshot.dimension_locations, parentCode) || findRow(snapshot.sub_dimension_locations, parentCode))
    : null

  const shouldUseGranular = GRANULAR_LEVELS.has(level)
  const primaryMatch = shouldUseGranular
    ? (primarySubDimension || primaryDimension)
    : (primaryDimension || primarySubDimension)

  return {
    level,
    primaryCode: codeComponent || dimCode || fullSearchCode,
    parentCode,
    primaryMatch,
    parentDimension,
  }
}

export function resolveGtMetadataAccessSync(metadata: Record<string, unknown> | null | undefined): GtMetadataAccessResult {
  if (!metadata) {
    return { visible: true, enabled: true, reason: 'no_metadata' }
  }

  const snapshot = readStoredGtAccessSnapshot()
  const requestedLevel = normalizeCode(metadata.level || metadata.subdimType || metadata['subdim-type'] || metadata.subdim_type)
  const requestedCode = normalizeCode(metadata.ik || metadata.subdimIk || metadata['subdim-ik'])
  const requestedParent = normalizeParentCode(metadata.pc || metadata.subdimPc || metadata['subdim-pc'])
  const gtGoverned = Boolean(requestedCode || requestedParent)

  if (!snapshot) {
    return gtGoverned
      ? { visible: false, enabled: false, reason: 'no_cached_snapshot' }
      : { visible: true, enabled: true, reason: 'no_cached_snapshot_public' }
  }

  const { primaryCode, parentCode, primaryMatch, parentDimension, level } = resolveLocationMatches(snapshot, metadata)
  if (!primaryCode && !parentCode) {
    return { visible: true, enabled: true, reason: 'no_metadata_codes' }
  }
  if (primaryCode && !primaryMatch) {
    if (GRANULAR_LEVELS.has(level) && parentDimension) {
      const inheritedVisible = parentDimension.visible === true
      const inheritedEnabled = parentDimension.enabled === true
      const inheritedEffectiveVisible = level === 'BUTTON'
        ? (inheritedVisible && inheritedEnabled)
        : inheritedVisible
      return {
        visible: inheritedEffectiveVisible,
        enabled: inheritedEnabled,
        reason: inheritedEffectiveVisible && inheritedEnabled ? 'inherited_parent_dimension' : 'disabled_by_parent_dimension',
      }
    }
    return { visible: false, enabled: false, reason: 'primary_code_not_mapped' }
  }
  if (parentCode && !parentDimension && !GRANULAR_LEVELS.has(level) && !primaryMatch) {
    return { visible: false, enabled: false, reason: 'parent_dimension_not_mapped' }
  }

  const rows = [primaryMatch, parentDimension].filter(Boolean) as GtCheckedRow[]
  const visible = rows.every((row) => row.visible === true)
  const enabled = rows.every((row) => row.enabled === true)
  const effectiveVisible = level === 'BUTTON' ? (visible && enabled) : visible

  return {
    visible: effectiveVisible,
    enabled,
    reason: effectiveVisible && enabled ? 'allowed' : 'disabled_by_gt',
  }
}

function ensureCheckedInvalidationSubscription(session: TragonSession): void {
  const instanceId = String(session.instanceId || '').trim()
  if (!instanceId || typeof EventSource === 'undefined') {
    if (activeCheckedEventSource) {
      activeCheckedEventSource.close()
      activeCheckedEventSource = null
    }
    activeCheckedInstanceId = ''
    return
  }

  if (activeCheckedEventSource && activeCheckedInstanceId === instanceId) {
    return
  }

  if (activeCheckedEventSource) {
    activeCheckedEventSource.close()
  }

  const source = new EventSource(`${apiConfig.apiUrl}${API_ENDPOINTS.gt.checkedEvents(instanceId)}`)
  source.addEventListener('checked.invalidate', () => {
    void primeGtAccessForSession(session, { forceRefresh: true, preserveSubscription: true })
  })
  source.onerror = () => {
    // EventSource reconnects automatically.
  }

  activeCheckedEventSource = source
  activeCheckedInstanceId = instanceId
}

export async function buildGtAccessSnapshotForSession(
  session: TragonSession,
  client: AxiosInstance = httpClient,
): Promise<GtCheckedSnapshot | null> {
  const instanceType = resolveSessionInstanceType(session)
  const instanceId = String(session.instanceId || '').trim()

  if (instanceType === 'user') {
    if (!instanceId) return null

    const [templateResponse, subDimensionsResponse] = await Promise.all([
      client.get(API_ENDPOINTS.gt.template('DEFAULT_USER'), { params: { scope_type: 'user' } }),
      client.get(API_ENDPOINTS.gt.subDimensions, { params: { is_active: '1' } }),
    ])

    const subDimensionCatalogById = buildSubDimensionCatalogById(subDimensionsResponse.data)
    return {
      session: {
        userId: session.userId,
        instanceId,
        instanceType: 'user',
        domainContext: 'user',
        tenantUserId: session.tenantUserId || null,
      },
      dimension_locations: normalizeTemplateDimensionRows(templateResponse.data),
      sub_dimension_locations: normalizeTemplateSubDimensionRows(templateResponse.data, subDimensionCatalogById),
      refreshed_at: new Date().toISOString(),
    }
  }

  if (!instanceId) return null

  const [dimensionsResponse, subDimensionsResponse, templateResponse, subDimensionCatalogResponse] = await Promise.all([
    client.get(API_ENDPOINTS.gt.checkedDimensions(instanceId), {
      params: { template_code: 'DEFAULT_SPONSOR', scope_type: 'sponsor' },
    }),
    client.get(API_ENDPOINTS.gt.checkedSubDimensions(instanceId), {
      params: { template_code: 'DEFAULT_SPONSOR', scope_type: 'sponsor' },
    }),
    client.get(API_ENDPOINTS.gt.template('DEFAULT_SPONSOR'), {
      params: { scope_type: 'sponsor' },
    }),
    client.get(API_ENDPOINTS.gt.subDimensions, { params: { is_active: '1' } }),
  ])

  const checkedDimensionRows = normalizeDimensionRows(dimensionsResponse.data)
  const checkedSubDimensionRows = normalizeSubDimensionRows(subDimensionsResponse.data)
  const templateDimensionRows = normalizeTemplateDimensionRows(templateResponse.data)
  const subDimensionCatalogById = buildSubDimensionCatalogById(subDimensionCatalogResponse.data)
  const templateSubDimensionRows = normalizeTemplateSubDimensionRows(templateResponse.data, subDimensionCatalogById)

  return {
    session: {
      userId: session.userId,
      instanceId,
      instanceType: 'sponsor',
      domainContext: 'sponsor',
      tenantUserId: session.tenantUserId || null,
    },
    dimension_locations: mergeRows(checkedDimensionRows, templateDimensionRows),
    sub_dimension_locations: mergeRows(checkedSubDimensionRows, templateSubDimensionRows),
    refreshed_at: new Date().toISOString(),
  }
}

export async function primeGtAccessForSession(
  session: TragonSession | null,
  options: { forceRefresh?: boolean; preserveSubscription?: boolean } = {},
): Promise<GtCheckedSnapshot | null> {
  if (!session?.userId) {
    clearGtAccessCache()
    return null
  }

  const current = readStoredGtAccessSnapshot()
  const currentKey = current
    ? `${current.session.userId}:${current.session.instanceType}:${current.session.instanceId || ''}`
    : ''
  const nextKey = `${session.userId}:${resolveSessionInstanceType(session)}:${session.instanceId || ''}`

  if (!options.forceRefresh && current && currentKey === nextKey) {
    if (!options.preserveSubscription) ensureCheckedInvalidationSubscription(session)
    return current
  }

  try {
    const snapshot = await buildGtAccessSnapshotForSession(session)
    if (!snapshot) {
      clearGtAccessCache()
      return null
    }
    writeSnapshot(snapshot)
    if (!options.preserveSubscription) ensureCheckedInvalidationSubscription(session)
    return snapshot
  } catch {
    return current && currentKey === nextKey ? current : null
  }
}

