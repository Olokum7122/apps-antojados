/**
 * Aplica estilos CSS a un bloque del document package.
 * Mergea: style base + efecto de elemento + text preset.
 */

import type {
  Block,
  ElementStyle,
  EfectoGlobalId,
  ElementEffectId,
  TextPresetId,
} from '@antojados/api/types/document-package'

// ── Efectos globales (canvas) ──

const CANVAS_EFFECTS: Record<EfectoGlobalId, Partial<ElementStyle>> = {
  retro: {
    bgColor: '#f4e4c1',
    bgGradient: 'linear-gradient(135deg, #f4e4c1 0%, #e8d5a3 100%)',
    fontFamily: '"Playfair Display", serif',
    color: '#2d1f0b',
  },
  dark: {
    bgColor: '#1a1a2e',
    bgGradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    fontFamily: 'Inter, sans-serif',
    color: '#e0e0e0',
  },
  clean: {
    bgColor: '#ffffff',
    fontFamily: 'Inter, sans-serif',
    color: '#1a1a1a',
  },
  vibrant: {
    bgColor: '#0f0f23',
    bgGradient: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%)',
    fontFamily: '"Space Grotesk", sans-serif',
    color: '#ffffff',
  },
  minimal: {
    bgColor: '#fafafa',
    fontFamily: '"Helvetica Neue", sans-serif',
    color: '#333333',
  },
  madera: {
    bgColor: '#8B6914',
    bgGradient: 'linear-gradient(135deg, #8B6914 0%, #654321 100%)',
    fontFamily: '"Playfair Display", serif',
    color: '#f5e6c8',
  },
  neon: {
    bgColor: '#0a0a1a',
    fontFamily: '"Space Grotesk", sans-serif',
    color: '#ff00ff',
  },
  acuarela: {
    bgColor: '#f0e6d3',
    bgGradient: 'linear-gradient(135deg, #f0e6d3 0%, #e8dcc8 100%)',
    fontFamily: '"Playfair Display", serif',
    color: '#5c4033',
  },
  carbon: {
    bgColor: '#1a1a1a',
    bgGradient: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
    fontFamily: 'Inter, sans-serif',
    color: '#cccccc',
  },
  pastel: {
    bgColor: '#fce4ec',
    bgGradient: 'linear-gradient(135deg, #fce4ec 0%, #e8eaf6 100%)',
    fontFamily: 'Inter, sans-serif',
    color: '#4a4a4a',
  },
  oceano: {
    bgColor: '#0d1b2a',
    bgGradient: 'linear-gradient(135deg, #0d1b2a 0%, #1b2838 100%)',
    fontFamily: 'Inter, sans-serif',
    color: '#e0f0ff',
  },
}

// ── Efectos por elemento ──

const ELEMENT_EFFECTS: Record<ElementEffectId, Partial<ElementStyle>> = {
  ninguno: {},
  sombra: { boxShadow: '0 4px 12px rgba(0,0,0,0.2)' },
  'sombra-fuerte': { boxShadow: '0 10px 30px rgba(0,0,0,0.3)' },
  neon: {
    color: '#ff00ff',
    textShadow: '0 0 10px #ff00ff, 0 0 20px #ff00ff',
  },
  madera: {
    fontFamily: '"Playfair Display", serif',
    color: '#3e2415',
    bgGradient: 'linear-gradient(135deg, #deb887 0%, #d2a679 100%)',
    borderRadius: '4px',
  },
  metal: {
    fontFamily: '"Space Grotesk", sans-serif',
    color: '#c0c0c0',
    textShadow: '0 0 8px rgba(192,192,192,0.5)',
    bgGradient: 'linear-gradient(135deg, #4a4a4a 0%, #2a2a2a 100%)',
  },
  glass: {
    bgColor: 'rgba(255,255,255,0.15)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    backdropFilter: 'blur(8px)',
  },
  outline: { border: '2px solid var(--app-primary)', borderRadius: '4px' },
  carta: { bgColor: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '8px' },
  retro: {
    fontFamily: '"Playfair Display", serif',
    color: '#2d1f0b',
    bgColor: 'rgba(244,228,193,0.3)',
    border: '2px solid #8b4513',
  },
}

// ── Text presets ──

const TEXT_PRESETS: Record<TextPresetId, Partial<ElementStyle>> = {
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
  body: { fontSize: 14, fontWeight: 'normal', lineHeight: '1.5' },
  badge: { fontSize: 11, fontWeight: 'bold', textAlign: 'center' },
  price: { fontSize: 22, fontWeight: 'bold', color: '#f59e0b' },
  cita: { fontSize: 16, fontFamily: '"Playfair Display", serif', textAlign: 'center', fontStyle: 'italic' },
  capital: { fontSize: 32, fontWeight: 'bold', textAlign: 'center' },
  tiny: { fontSize: 10, fontWeight: '300' },
  mono: { fontSize: 13, fontFamily: '"Courier New", monospace' },
  display: { fontSize: 36, fontWeight: '900', textAlign: 'center' },
}

/**
 * Obtiene los estilos CSS para el canvas (fondo, tipografía, color base).
 */
export function getCanvasStyle(effectId: EfectoGlobalId): Record<string, string> {
  const effect = CANVAS_EFFECTS[effectId] || CANVAS_EFFECTS.retro
  const style: Record<string, string> = {}

  if (effect.bgGradient) style.background = effect.bgGradient
  else if (effect.bgColor) style.background = effect.bgColor
  if (effect.fontFamily) style.fontFamily = effect.fontFamily
  if (effect.color) style.color = effect.color

  return style
}

/**
 * Aplica estilo completo a un bloque: base + efecto + textPreset.
 */
export function getBlockStyle(
  block: Block,
  canvasEffectId?: EfectoGlobalId | null,
): Record<string, string> {
  const base = block.style || {}
  const merged: Record<string, string> = {}

  // Si el efectoCanvas tiene tipografía/color, es el fallback
  const canvasEffect = canvasEffectId ? CANVAS_EFFECTS[canvasEffectId] : null

  // Mapear propiedades con valores por defecto
  merged.fontSize = `${base.fontSize || 14}px`
  merged.fontWeight = base.fontWeight || 'normal'
  merged.fontFamily = base.fontFamily || canvasEffect?.fontFamily || 'Inter, sans-serif'
  merged.color = base.color || canvasEffect?.color || '#333333'
  merged.textAlign = base.textAlign || 'left'
  merged.padding = base.padding || '4px'
  merged.overflow = 'hidden'
  merged.wordBreak = 'break-word'
  merged.boxSizing = 'border-box'
  merged.width = '100%'
  merged.height = '100%'

  if (base.fontStyle && base.fontStyle !== 'normal') merged.fontStyle = base.fontStyle
  if (base.textDecoration && base.textDecoration !== 'none') merged.textDecoration = base.textDecoration
  if (base.bgColor && base.bgColor !== 'transparent') merged.background = base.bgColor
  if (base.bgGradient) merged.background = base.bgGradient
  if (base.textShadow && base.textShadow !== 'none') merged.textShadow = base.textShadow
  if (base.boxShadow && base.boxShadow !== 'none') merged.boxShadow = base.boxShadow
  if (base.border && base.border !== 'none') merged.border = base.border
  if (base.borderRadius) merged.borderRadius = `${base.borderRadius}px`
  if (base.opacity !== undefined) merged.opacity = String(base.opacity)

  // Aplicar efecto de elemento
  if (block.efectoId && ELEMENT_EFFECTS[block.efectoId]) {
    const effect = ELEMENT_EFFECTS[block.efectoId]
    if (effect.boxShadow) merged.boxShadow = effect.boxShadow
    if (effect.color && !base.color) merged.color = effect.color
    if (effect.fontFamily && !base.fontFamily) merged.fontFamily = effect.fontFamily
    if (effect.bgGradient && !base.bgGradient) merged.background = effect.bgGradient
    if (effect.bgColor && !base.bgColor && !base.bgGradient) merged.background = effect.bgColor
    if (effect.textShadow) merged.textShadow = effect.textShadow
    if (effect.borderRadius) merged.borderRadius = effect.borderRadius
    // glass effect
    if (effect.backdropFilter) merged.backdropFilter = effect.backdropFilter
  }

  // Filtros de imagen
  if (base.filter && base.filter !== 'none') {
    const filterMap: Record<string, string> = {
      bn: 'grayscale(100%)',
      sepia: 'sepia(80%) saturate(120%)',
      azul: 'hue-rotate(200deg) saturate(150%)',
      vintage: 'sepia(50%) contrast(110%) brightness(90%)',
      neon: 'saturate(300%) hue-rotate(60deg) contrast(150%)',
    }
    merged.filter = filterMap[base.filter] || base.filter
  }

  if (base.brightness !== undefined && base.brightness !== 100) {
    const currentFilter = merged.filter || ''
    merged.filter = currentFilter
      ? `${currentFilter} brightness(${base.brightness}%)`
      : `brightness(${base.brightness}%)`
  }

  if (base.contrast !== undefined && base.contrast !== 100) {
    const currentFilter = merged.filter || ''
    merged.filter = currentFilter
      ? `${currentFilter} contrast(${base.contrast}%)`
      : `contrast(${base.contrast}%)`
  }

  // Transformaciones
  if (base.scaleX !== undefined || base.scaleY !== undefined || base.rotate !== undefined) {
    const tx: string[] = []
    if (base.scaleX !== undefined && base.scaleX !== 1) tx.push(`scaleX(${base.scaleX})`)
    if (base.scaleY !== undefined && base.scaleY !== 1) tx.push(`scaleY(${base.scaleY})`)
    if (base.rotate !== undefined && base.rotate !== 0) tx.push(`rotate(${base.rotate}deg)`)
    if (tx.length) merged.transform = tx.join(' ')
  }

  return merged
}
