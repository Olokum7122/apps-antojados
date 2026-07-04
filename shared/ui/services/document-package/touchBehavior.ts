/**
 * Define comportamientos táctiles para cada tipo de elemento del DocumentPackage.
 *
 * S1/S2:
 *   - image/video: carrusel (swipe), NO hace full
 *   - title, subtitle, price, badge: touch → zoom-front (full, oculta otros)
 *   - body, text: touch → expand-text (full readable)
 *   - watermark, separator: no interactivo
 *   - touch fuera: regresa a vista normal
 */

import type { ElementType } from '@antojados/api/types/document-package'

export type TouchAction = 'fullscreen' | 'zoom-front' | 'expand-text' | 'carrusel' | 'none'

/**
 * Determina la acción táctil para un tipo de elemento.
 */
export function getTouchAction(elementType: ElementType): TouchAction {
  switch (elementType) {
    case 'image':
    case 'video':
      return 'carrusel'
    case 'title':
    case 'subtitle':
    case 'price':
    case 'badge':
      return 'zoom-front'
    case 'body':
    case 'text':
      return 'expand-text'
    case 'watermark':
    case 'separator':
      return 'none'
    default:
      return 'none'
  }
}

/**
 * Indica si un elemento es interactivo (responde a touch).
 */
export function isInteractive(elementType: ElementType): boolean {
  return getTouchAction(elementType) !== 'none'
}

/**
 * Indica si un elemento puede expandirse a full (oculta otros).
 */
export function canExpand(elementType: ElementType): boolean {
  const action = getTouchAction(elementType)
  return action === 'zoom-front' || action === 'expand-text'
}
