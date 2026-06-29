/**
 * gt-access.service.ts — Resolucion de acceso a componentes GT.
 *
 * Responsabilidades:
 *   - Resolver acceso sincrono a metadata GT via snapshot cacheado
 *   - Delegar cache y suscripcion SSE a gt-cache.service.ts (DEBT-002)
 *   - Consultas de informacion de acceso: getAccessInfo, hasModuleAccess, getRole (DEBT-031)
 *
 * Ver gt-cache.service.ts para:
 *   - Cache en localStorage con TTL de 5 min (DEBT-027)
 *   - Suscripcion a eventos de invalidacion SSE
 *   - Construccion de snapshot desde API
 *
 * Separado de gt-cache.service.ts para cumplir SRP (DEBT-002).
 */

import { readStoredGtAccessSnapshot } from '@antojados/api/services/gt/gt-cache.service'
import type { GtCheckedRow, GtCheckedSnapshot } from '@antojados/api/services/gt/gt-cache.service'

export {
  gtAccessRevision,
  readStoredGtAccessSnapshot,
  clearGtAccessCache,
  primeGtAccessForSession,
  buildGtAccessSnapshotForSession,
} from '@antojados/api/services/gt/gt-cache.service'

export type { GtCheckedRow, GtCheckedSnapshot } from '@antojados/api/services/gt/gt-cache.service'

export interface GtMetadataAccessResult {
  visible: boolean
  enabled: boolean
  reason: string
}

export interface GtAccessInfo {
  userId: string | null
  instanceId: string | null
  instanceType: 'user' | 'sponsor' | null
  domainContext: 'user' | 'sponsor' | null
  accessibleModules: string[]
  totalDimensions: number
  totalSubDimensions: number
  refreshedAt: string | null
}

const GRANULAR_LEVELS = new Set(['BUTTON', 'FULLSCREEN', 'DIALOG', 'SUB_COMPONENT', 'SUBTAB'])

function normalizeCode(value: unknown): string {
  return String(value || '').trim().toUpperCase()
}

function normalizeParentCode(value: unknown): string | null {
  const normalized = normalizeCode(value)
  if (!normalized || normalized === 'ROOT') return null
  return normalized
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

export function getAccessInfo(): GtAccessInfo {
  const snapshot = readStoredGtAccessSnapshot()
  if (!snapshot) {
    return {
      userId: null,
      instanceId: null,
      instanceType: null,
      domainContext: null,
      accessibleModules: [],
      totalDimensions: 0,
      totalSubDimensions: 0,
      refreshedAt: null,
    }
  }

  const accessibleModules = snapshot.dimension_locations
    .filter((row) => row.visible && row.enabled)
    .map((row) => row.code)

  return {
    userId: snapshot.session.userId,
    instanceId: snapshot.session.instanceId,
    instanceType: snapshot.session.instanceType,
    domainContext: snapshot.session.domainContext,
    accessibleModules,
    totalDimensions: snapshot.dimension_locations.length,
    totalSubDimensions: snapshot.sub_dimension_locations.length,
    refreshedAt: snapshot.refreshed_at,
  }
}

export function hasModuleAccess(instanceId: string | null | undefined, moduleCode: string): boolean {
  if (!instanceId || !moduleCode) return false

  const snapshot = readStoredGtAccessSnapshot()
  if (!snapshot) return false

  if (snapshot.session.instanceId !== instanceId) return false

  const normalizedCode = normalizeCode(moduleCode)
  const match = findRow(snapshot.dimension_locations, normalizedCode)
  if (!match) return false

  return match.visible === true && match.enabled === true
}

export function getRole(instanceId: string | null | undefined, userId: string | null | undefined): string | null {
  if (!instanceId || !userId) return null

  const snapshot = readStoredGtAccessSnapshot()
  if (!snapshot) return null

  if (snapshot.session.instanceId !== instanceId) return null
  if (snapshot.session.userId !== userId) return null

  if (snapshot.session.domainContext === 'sponsor') return 'admin'
  if (snapshot.session.instanceType === 'sponsor') return 'admin'

  return 'user'
}
