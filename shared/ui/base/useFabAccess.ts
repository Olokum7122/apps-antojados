/**
 * Composable para resolver el acceso (visible/enabled) de un PublishFabBase
 * usando GT metadata access desde el componente padre.
 *
 * Esto mantiene PublishFabBase puro (recibe props), mientras que los padres
 * (que ya importan servicios) resuelven el acceso aqui.
 */
import { computed } from 'vue'
import { gtAccessRevision, resolveGtMetadataAccessSync } from '@antojados/api/services/gt/gt-access.service'
import type { GtMetadataResolution } from '@antojados/api/services/gt/gt-access.service'

export interface FabAccessInput {
  subdimIk: string
  subdimPc: string
  dimCode?: string
  subdimType?: string
  subdimAppliesTo?: string
  codeComponent?: string
}

export interface FabAccessResult {
  visible: boolean
  enabled: boolean
}

export function useFabAccess(input: FabAccessInput): FabAccessResult {
  const access = computed<GtMetadataResolution>(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    gtAccessRevision.value
    return resolveGtMetadataAccessSync({
      ik: input.subdimIk,
      pc: input.subdimPc,
      dim_code: input.dimCode || '',
      appliesTo: input.subdimAppliesTo || 'all',
      level: input.subdimType || 'BUTTON',
      subdimType: input.subdimType || 'BUTTON',
      codeComponent: input.codeComponent || '',
    })
  })

  const isSocialPublishFab =
    (input.subdimType || 'BUTTON') === 'BUTTON' &&
    (input.subdimAppliesTo || 'all') !== 'sponsor' &&
    String(input.subdimPc || '').toUpperCase().startsWith('ANTOJADOS.')

  const visible = computed(() => {
    if (isSocialPublishFab) return true
    return access.value.visible !== false
  })

  const enabled = computed(() => {
    if (isSocialPublishFab) return true
    return access.value.enabled !== false
  })

  return { visible, enabled } as unknown as FabAccessResult
}
