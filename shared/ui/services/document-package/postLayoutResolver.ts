/**
 * Resuelve el layout del post según:
 * 1. deviceOrientation: 'portrait' | 'landscape'
 * 2. mediaAspectRatio: la proporción real de la imagen/video
 * 3. viewportWidth, viewportHeight: espacio disponible
 *
 * Grids:
 *   - portrait device: 24×40 (canvas 380×640)
 *   - landscape device: 40×24 (canvas 640×380)
 *   - square media: 30×30 (canvas 380×380)
 *
 * El post se escala para que la imagen sea lo más grande posible
 * dentro del viewport, manteniendo margen interno de 15px y
 * marco transparente.
 */

export type DeviceOrientation = 'portrait' | 'landscape'
export type MediaVariant = 'portrait' | 'landscape' | 'square'

export interface PostLayoutResult {
  /** Orientación efectiva del canvas */
  canvasOrientation: DeviceOrientation
  /** Grid resultante */
  gridColumns: number
  gridRows: number
  /** Tamaño del post en píxeles (escalado al viewport) */
  postWidth: number
  postHeight: number
  /** Área de la media (dentro del post, antes del margen) */
  mediaBox: { width: number; height: number }
  /** Área de la media con margen interno de 15px */
  mediaInnerBox: { width: number; height: number; left: number; top: number }
  /** Zona segura para blocks (igual a mediaInnerBox) */
  blockSafeArea: { width: number; height: number; left: number; top: number }
  /** object-fit a usar */
  mediaFitMode: 'contain' | 'cover'
  /** Variante de la media */
  variant: MediaVariant
  /** Ancho y alto del canvas virtual (sin escalar) */
  canvasWidth: number
  canvasHeight: number
  /** Tamaño de cada celda en el grid (px) */
  cellWidth: number
  cellHeight: number
}

/**
 * Determina la orientación del dispositivo basado en el viewport.
 */
export function getDeviceOrientation(): DeviceOrientation {
  if (typeof window === 'undefined') return 'portrait'
  return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
}

/**
 * Determina la variante de la media según su aspect ratio.
 * @param aspectRatio width/height de la media
 */
export function getMediaVariant(aspectRatio: number): MediaVariant {
  if (aspectRatio > 1.05) return 'landscape'
  if (aspectRatio < 0.95) return 'portrait'
  return 'square'
}

/**
 * Determina el grid según deviceOrientation y variant de media.
 * - portrait device + media portrait → 24×40
 * - portrait device + media landscape → 40×24 (ajuste)
 * - landscape device → 40×24
 * - square → 30×30
 */
export function getGridForLayout(
  deviceOrientation: DeviceOrientation,
  variant: MediaVariant,
): { cols: number; rows: number; canvasWidth: number; canvasHeight: number } {
  if (variant === 'square') {
    return { cols: 30, rows: 30, canvasWidth: 380, canvasHeight: 380 }
  }
  if (deviceOrientation === 'landscape') {
    return { cols: 40, rows: 24, canvasWidth: 640, canvasHeight: 380 }
  }
  // portrait device
  if (variant === 'portrait') {
    return { cols: 24, rows: 40, canvasWidth: 380, canvasHeight: 640 }
  }
  // media landscape en portrait device — usamos 40×24 para dar más ancho
  return { cols: 40, rows: 24, canvasWidth: 640, canvasHeight: 380 }
}

/**
 * Calcula el tamaño del post escalado al viewport disponible.
 *
 * Estrategia:
 * - La media siempre tiene margen interno de 15px.
 * - El post debe ocupar el máximo espacio posible sin deformar la media.
 * - En portrait device: el ancho es el viewportWidth (con padding del feed).
 * - En landscape device: el alto se limita para que no ocupe toda la pantalla.
 *
 * @param viewportWidth  Ancho disponible para el post (px)
 * @param viewportHeight Alto disponible para el post (px)
 * @param canvasWidth    Ancho virtual del canvas (380 o 640)
 * @param canvasHeight   Alto virtual del canvas (640 o 380)
 */
export function resolvePostSize(
  viewportWidth: number,
  viewportHeight: number,
  canvasWidth: number,
  canvasHeight: number,
): { postWidth: number; postHeight: number } {
  const aspectRatio = canvasWidth / canvasHeight

  // Escalar para que quepa en el viewport
  let postWidth = viewportWidth
  let postHeight = postWidth / aspectRatio

  // Si el alto calculado excede el viewport, escalar por alto
  if (postHeight > viewportHeight) {
    postHeight = viewportHeight
    postWidth = postHeight * aspectRatio
  }

  return { postWidth, postHeight }
}

/**
 * Resuelve el layout completo del post.
 *
 * @param mediaAspectRatio aspect ratio de la media (width/height). Si 0, se asume portrait.
 * @param viewportWidth    ancho disponible en px (default: window.innerWidth - 32)
 * @param viewportHeight   alto disponible en px (default: window.innerHeight * 0.85)
 */
export function resolvePostTemplateLayout(
  mediaAspectRatio: number = 0,
  viewportWidth?: number,
  viewportHeight?: number,
): PostLayoutResult {
  const deviceOrientation = getDeviceOrientation()
  const variant = mediaAspectRatio > 0 ? getMediaVariant(mediaAspectRatio) : 'portrait'
  const grid = getGridForLayout(deviceOrientation, variant)

  const vw = viewportWidth ?? (typeof window !== 'undefined' ? window.innerWidth - 32 : 400)
  const vh = viewportHeight ?? (typeof window !== 'undefined' ? window.innerHeight * 0.85 : 700)

  const { postWidth, postHeight } = resolvePostSize(vw, vh, grid.canvasWidth, grid.canvasHeight)

  // El área de la media es todo el post
  const mediaBox = { width: postWidth, height: postHeight }

  // Margen interno de 15px
  const margin = 15
  const mediaInnerBox = {
    width: Math.max(0, postWidth - margin * 2),
    height: Math.max(0, postHeight - margin * 2),
    left: margin,
    top: margin,
  }

  // object-fit: sempre contain para no deformar
  const mediaFitMode: 'contain' = 'contain'

  const cellWidth = grid.canvasWidth / grid.cols
  const cellHeight = grid.canvasHeight / grid.rows

  return {
    canvasOrientation: deviceOrientation,
    gridColumns: grid.cols,
    gridRows: grid.rows,
    postWidth,
    postHeight,
    mediaBox,
    mediaInnerBox,
    blockSafeArea: mediaInnerBox,
    mediaFitMode,
    variant,
    canvasWidth: grid.canvasWidth,
    canvasHeight: grid.canvasHeight,
    cellWidth,
    cellHeight,
  }
}
