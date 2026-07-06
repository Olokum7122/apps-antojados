/**
 * Calcula posiciones CSS absolutas desde gridPos usando cellWidth/cellHeight
 * proporcionados por el Layout Resolver.
 *
 * El Layout Resolver es el único responsable de calcular cellWidth y cellHeight
 * según deviceOrientation, mediaAspectRatio y viewport.
 *
 * Este módulo solo convierte grid → píxeles, nunca calcula geometría.
 *
 * Fórmula:
 *   left  = (col - 1) * cellWidth
 *   top   = (row - 1) * cellHeight
 *   width = colspan * cellWidth
 *   height = rowspan * cellHeight
 */

import type { GridPosition } from '@antojados/api/types/document-package'

export interface GridPixelResult {
  left: number
  top: number
  width: number
  height: number
}

/**
 * Convierte GridPosition a píxeles absolutos usando cellWidth/cellHeight dinámicos.
 * Los valores cellWidth/cellHeight deben venir del Layout Resolver.
 */
export function gridToPixels(
  pos: GridPosition,
  cellWidth: number = 380 / 24,
  cellHeight: number = 640 / 40,
): GridPixelResult {
  return {
    left: (pos.col - 1) * cellWidth,
    top: (pos.row - 1) * cellHeight,
    width: pos.colspan * cellWidth,
    height: pos.rowspan * cellHeight,
  }
}

/**
 * Retorna un objeto de estilo CSS position:absolute calculado desde gridPos.
 * Acepta cellWidth/cellHeight opcionales desde el Layout Resolver.
 * Si no se proveen, usa fallback portrait 380/24 y 640/40.
 */
export function gridToStyle(
  pos: GridPosition,
  cellWidth?: number,
  cellHeight?: number,
): Record<string, string> {
  const px = gridToPixels(pos, cellWidth, cellHeight)
  return {
    position: 'absolute',
    left: `${px.left}px`,
    top: `${px.top}px`,
    width: `${px.width}px`,
    height: `${px.height}px`,
  }
}
