import { readStoredGtAccessSnapshot, resolveGtMetadataAccessSync } from '@antojados/api/services/gt/gt-access.service'

function normalizeText(value) {
  return String(value || '').trim()
}

function normalizeCode(value) {
  return normalizeText(value).replace(/\s+/g, '_').toUpperCase()
}

function normalizeAppliesTo(value) {
  const normalized = normalizeText(value).toLowerCase()
  if (normalized === 'user' || normalized === 'sponsor') return normalized
  return 'all'
}

function inferParentLevel(level) {
  const normalized = normalizeCode(level)
  if (normalized === 'BUTTON') return 'SUBTAB'
  if (normalized === 'SUBTAB') return 'COMPONENT'
  if (normalized === 'COMPONENT') return 'AREA'
  if (normalized === 'AREA') return 'MODULE'
  return null
}

function inferDefaultKind(level) {
  const normalized = normalizeCode(level)
  if (normalized === 'BUTTON') return 'button'
  return 'tab'
}

function normalizeBarBase(value, level) {
  const explicit = normalizeText(value)
  if (explicit) return explicit
  const normalized = normalizeCode(level)
  if (normalized === 'MODULE' || normalized === 'AREA') return 'TopBarTabsBase'
  if (normalized === 'COMPONENT') return 'TabBarComponentBase'
  if (normalized === 'SUBTAB') return 'TabBarSubDimensionBase'
  if (normalized === 'BUTTON') return 'ButtonBarBase'
  return 'TabBarBase'
}

function resolveDimCode(item, ik, pc, key) {
  const explicit = normalizeCode(
    item?.dim_code || item?.dimCode || item?.metadata?.dim_code || item?.metadata?.dimCode,
  )
  if (explicit) return explicit
  const normalizedIk = normalizeCode(ik || key)
  const normalizedPc = normalizeCode(pc)
  return [normalizedPc, normalizedIk].filter(Boolean).join('.') || normalizedIk || null
}

function resolveParentContext(level, item, parentContext) {
  const parentLevel = normalizeCode(parentContext?.level) || inferParentLevel(level)
  const parentCode = normalizeCode(parentContext?.code || item?.pc || item?.subdimPc || item?.['subdim-pc']) || null
  const parentLabel = normalizeText(parentContext?.label || item?.parentLabel || '') || null

  return {
    level: parentLevel,
    code: parentCode,
    label: parentLabel,
  }
}

function resolveBarItem(level, item, { parentContext = null, defaultKind = null } = {}) {
  const resolvedLevel = normalizeCode(level)
  const key = normalizeText(item?.key || item?.name || item?.route || item?.to || item?.label)
  const label = normalizeText(item?.label || key)
  const route = normalizeText(item?.route || item?.to || '') || null
  const ik = normalizeCode(
    item?.ik || item?.subdimIk || item?.metadata?.ik || item?.metadata?.subdimIk || item?.['subdim-ik'],
  )
  const pc = normalizeCode(
    item?.pc || item?.subdimPc || item?.metadata?.pc || item?.metadata?.subdimPc || item?.['subdim-pc'],
  )
  const appliesTo = normalizeAppliesTo(
    item?.appliesTo || item?.subdimAppliesTo || item?.metadata?.appliesTo || item?.metadata?.subdimAppliesTo || item?.metadata?.['subdim-applies-to'],
  )
  const kind = normalizeText(item?.kind || defaultKind || inferDefaultKind(resolvedLevel)).toLowerCase() || 'tab'
  const barBase = normalizeBarBase(item?.barBase || item?.metadata?.barBase, resolvedLevel)
  const codeComponent = normalizeCode(
    item?.codeComponent || item?.componentCode || item?.subLocationCode || item?.metadata?.codeComponent,
  ) || null
  const dim_code = resolveDimCode(item, ik, pc, key)
  const identityKey = [resolvedLevel, kind, ik || key, pc || null, appliesTo, codeComponent || null]
    .filter(Boolean)
    .join('::')
  const parent = resolveParentContext(resolvedLevel, item, parentContext)
  const subdimType = normalizeCode(item?.subdimType || item?.metadata?.subdimType || resolvedLevel)
  const metadata = {
    ...(item?.metadata || {}),
    ik,
    pc,
    dim_code,
    appliesTo,
    kind,
    barBase,
    level: resolvedLevel,
    codeComponent,
    subdimType,
  }
  const access = resolveGtMetadataAccessSync(metadata)

  return {
    ...item,
    key,
    label,
    route,
    to: route || item?.to || null,
    level: resolvedLevel,
    ik,
    pc,
    dim_code,
    appliesTo,
    kind,
    barBase,
    codeComponent,
    identityKey,
    parentContext: parent,
    dimensionMeta: {
      level: resolvedLevel,
      code: ik || key || null,
      dim_code,
      label,
      parentCode: parent.code || pc || null,
    },
    subdimType,
    subdimAppliesTo: appliesTo,
    metadata,
    visible: item?.visible !== false && access.visible !== false,
    enabled: item?.enabled !== false && access.enabled !== false,
    disabled: item?.disabled === true || access.enabled === false,
    domAttrs: {
      'data-key': key || '',
      'data-label': label || '',
      'data-route': route || '',
      'data-level': resolvedLevel,
      'data-kind': kind,
      'data-bar-base': barBase,
      'data-ik': ik || '',
      'data-pc': pc || '',
      'data-dim-code': dim_code || '',
      'data-applies-to': appliesTo,
      'data-identity-key': identityKey,
      'data-parent-level': parent.level || '',
      'data-parent-code': parent.code || '',
      'data-code-component': codeComponent || '',
      ik: ik || '',
      pc: pc || '',
      dim_code: dim_code || '',
      'subdim-ik': ik || '',
      'subdim-pc': pc || '',
      'subdim-dim-code': dim_code || '',
      'subdim-type': subdimType,
      'subdim-applies-to': appliesTo,
    },
  }
}

function resolveBarItems(level, items, options = {}) {
  const sourceItems = (Array.isArray(items) ? items : []).filter(Boolean)
  const resolvedItems = sourceItems
    .map((item) => resolveBarItem(level, item, options))
    .filter((item) => item.visible !== false)

  if (resolvedItems.length > 0) return resolvedItems

  const snapshot = readStoredGtAccessSnapshot()
  const instanceType = String(snapshot?.session?.instanceType || 'user').toLowerCase()
  const isSponsor = instanceType === 'sponsor'

  return sourceItems
    .filter((item) => {
      const appliesTo = normalizeAppliesTo(
        item?.appliesTo || item?.subdimAppliesTo || item?.metadata?.appliesTo || item?.metadata?.subdimAppliesTo,
      )
      return appliesTo !== 'sponsor' || isSponsor
    })
    .map((item) => ({
      ...resolveBarItem(level, item, options),
      visible: true,
      enabled: true,
      disabled: item?.disabled === true,
      fallbackReason: 'fallback_shell_tabs',
    }))
}

export { resolveBarItem, resolveBarItems }
