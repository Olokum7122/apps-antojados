import {
  ANTOJO_TABS,
  GRANULAR_BUTTONS,
  LA_BANDA_TABS,
  MAIN_TABS,
  MI_CHAMBA_TABS,
  PA_TI_TABS,
  RED_TABS,
  TRAGON_TABS,
} from '../../constants/navigationDimensions.js'

const STRUCTURAL_LEVELS = new Set(['MODULE', 'AREA', 'COMPONENT'])
const GRANULAR_LEVELS = new Set(['SUBTAB', 'BUTTON', 'FULLSCREEN', 'DIALOG', 'SUB_COMPONENT'])
const ANTOJO_ALLOWED_GRANULAR_PARENTS = ['ANTOJO.VAS_IR', 'ANTOJO.ARRE']

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

function resolveModuleCode(code) {
  return normalizeCode(code).split('.').filter(Boolean)[0] || null
}

function isAllowedAntojoGranularParent(parentCode) {
  const normalizedParent = normalizeCode(parentCode)
  return ANTOJO_ALLOWED_GRANULAR_PARENTS.some(
    (allowed) => normalizedParent === allowed || normalizedParent.startsWith(`${allowed}.`),
  )
}

function resolveBarBase(level) {
  const normalizedLevel = normalizeCode(level)
  if (normalizedLevel === 'MODULE' || normalizedLevel === 'AREA') return 'TopBarTabsBase'
  if (normalizedLevel === 'COMPONENT') return 'TabBarComponentBase'
  if (normalizedLevel === 'SUBTAB') return 'TabBarSubDimensionBase'
  if (normalizedLevel === 'BUTTON') return 'ButtonBarBase'
  return 'TabBarBase'
}

function buildMetaJson(item, sourceSet, sourceType) {
  return JSON.stringify({
    scanner: 'antojados-ios-tabbarbase-scan',
    scanner_mode: 'strict-7_2',
    source_type: sourceType,
    source_set: sourceSet,
    source_name: item.name || item.key || null,
    level: normalizeCode(item.subdimType || item.level),
    kind: item.kind || null,
    bar_base: item.barBase || resolveBarBase(item.subdimType || item.level),
    code_component: item.codeComponent || null,
  })
}

function toDimension(item, sourceSet) {
  const level = normalizeCode(item.subdimType || item.level)
  const dimensionCode = normalizeCode(item.dim_code || [item.pc, item.ik].filter(Boolean).join('.'))
  const parentCode = normalizeCode(item.pc) || null
  if (!dimensionCode || !STRUCTURAL_LEVELS.has(level)) return null

  return {
    dimension_code: dimensionCode,
    parent_code: parentCode,
    dimension_type: level,
    dimension_name: normalizeText(item.label || item.ik),
    applies_to: normalizeAppliesTo(item.subdimAppliesTo || item.appliesTo),
    review_status: 'PENDING_REVIEW',
    is_active: 1,
    meta_json: buildMetaJson(item, sourceSet, 'metadata'),
  }
}

function toSubDimension(item, sourceSet, warnings) {
  const level = normalizeCode(item.subdimType || item.level)
  const parentCode = normalizeCode(item.pc)
  const ik = normalizeCode(item.ik)
  const subCode = normalizeCode(item.dim_code || [parentCode, ik].filter(Boolean).join('.'))
  if (!parentCode || !ik || !subCode || !GRANULAR_LEVELS.has(level)) return null

  const moduleCode = resolveModuleCode(parentCode)
  if (moduleCode !== 'ANTOJO') return null
  if (!isAllowedAntojoGranularParent(parentCode)) {
    warnings.push(`[scanner] granular fuera de alcance: ${subCode}`)
    return null
  }

  return {
    parent_code: parentCode,
    sub_code: subCode,
    sub_name: normalizeText(item.label || item.ik),
    sub_type: level,
    applies_to: normalizeAppliesTo(item.subdimAppliesTo || item.appliesTo),
    review_status: 'PENDING_REVIEW',
    is_active: 1,
    meta_json: buildMetaJson(item, sourceSet, 'metadata'),
  }
}

function dedupeBy(items, keyGetter) {
  const map = new Map()
  for (const item of items) {
    const key = normalizeCode(keyGetter(item))
    if (key) map.set(key, item)
  }
  return [...map.values()]
}

function getTabbarbaseSources() {
  return [
    ['MAIN_TABS', MAIN_TABS],
    ['ANTOJO_TABS', ANTOJO_TABS],
    ['RED_TABS', RED_TABS],
    ['PA_TI_TABS', PA_TI_TABS],
    ['LA_BANDA_TABS', LA_BANDA_TABS],
    ['MI_CHAMBA_TABS', MI_CHAMBA_TABS],
    ['TRAGON_TABS', TRAGON_TABS],
    ['GRANULAR_BUTTONS', GRANULAR_BUTTONS],
  ]
}

function buildScannerPayloadFromTabbarbases() {
  const dimensions = []
  const subDimensions = []
  const warnings = []

  for (const [sourceSet, items] of getTabbarbaseSources()) {
    for (const item of items || []) {
      const dimension = toDimension(item, sourceSet)
      if (dimension) dimensions.push(dimension)

      const subDimension = toSubDimension(item, sourceSet, warnings)
      if (subDimension) subDimensions.push(subDimension)
    }
  }

  return {
    dimensions: dedupeBy(dimensions, (item) => item.dimension_code),
    sub_dimensions: dedupeBy(subDimensions, (item) => item.sub_code),
    source_files: 1,
    source: 'AntojadosMX_IOS/@antojados/ui/dimensions/navigationDimensions.js.js',
    warnings: [...new Set(warnings)],
  }
}

function summarizeScannerPayload(payload) {
  return {
    scanned_dimensions: payload.dimensions.length,
    scanned_sub_dimensions: payload.sub_dimensions.length,
    source_files: payload.source_files,
    warnings_count: payload.warnings.length,
    warnings: payload.warnings,
  }
}

export {
  buildScannerPayloadFromTabbarbases,
  getTabbarbaseSources,
  summarizeScannerPayload,
}
