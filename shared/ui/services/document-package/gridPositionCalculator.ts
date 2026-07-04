/**
 * Calcula posiciones CSS absolutas desde gridPos (24×40 → 380×640px).
 *
 * Fórmula:
 *   left  = (col - 1) * (canvasWidth / COLS)
 *   top   = (row - 1) * (canvasHeight / ROWS)
 *   width = colspan * (canvasWidth / COLS)
 *   height = rowspan * (canvasHeight / ROWS)
 */

import type { GridPosition } from '@antojados/api/types/document-package'
import { GRID } from '@antojados/api/types/document-package'

export interface GridPixelResult {
  left: number
  top: number
  width: number
  height: number
}

/**
 * Convierte GridPosition a píxeles absolutos en el canvas 380×640.
 */
export function gridToPixels(pos: GridPosition): GridPixelResult {
  const cellW = GRID.CANVAS_WIDTH / GRID.COLS
  const cellH = GRID.CANVAS_HEIGHT / GRID.ROWS

  return {
    left: (pos.col - 1) * cellW,
    top: (pos.row - 1) * cellH,
    width: pos.colspan * cellW,
    height: pos.rowspan * cellH,
  }
}

/**
 * Retorna un objeto de estilo CSS position:absolute calculado desde gridPos.
 */
export function gridToStyle(pos: GridPosition): Record<string, string> {
  const px = gridToPixels(pos)
  return {
    position: 'absolute',
    left: `${px.left}px`,
    top: `${px.top}px`,
    width: `${px.width}px`,
    height: `${px.height}px`,
  }
}
