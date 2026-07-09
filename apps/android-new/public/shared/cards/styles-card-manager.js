/**
 * styles-card-manager.js
 * Manejador de estilos vía CSS Custom Properties (roots).
 * Adaptado para funcionar dentro de shadow DOM.
 * Cada card-viewport crea su propia instancia.
 */
class StylesCardManager {
  constructor(shadowRoot) {
    this.shadow = shadowRoot;
    this.root = shadowRoot.querySelector('.canvas');
    this.defaults = {
      // Canvas
      '--canvas-bg': '#0a0c12',
      '--canvas-radius': '24px',

      // Mediabox
      '--media-bg': '#161c2a',
      '--media-radius': '16px',
      '--media-min-height': '320px',

      // Glass
      '--glass-bg': 'rgba(10, 12, 18, 0.72)',
      '--glass-blur': '12px',
      '--glass-radius': '16px 16px 0 0',
      '--glass-height': '150px',
      '--glass-border': '1px solid rgba(255,255,255,0.08)',

      // Textos
      '--text-primary': '#ffffff',
      '--text-secondary': 'rgba(255,255,255,0.65)',
      '--text-muted': 'rgba(255,255,255,0.35)',

      // Badge
      '--badge-font-size': '11px',
      '--badge-radius': '999px',
      '--badge-padding': '4px 12px',

      // Watermark
      '--watermark-opacity': '0.25',
      '--watermark-font-size': '10px',

      // Inputs
      '--input-bg': '#161c2a',
      '--input-border': '1px solid rgba(255,255,255,0.1)',
      '--input-radius': '10px',
      '--input-color': '#ffffff',
      '--input-placeholder': 'rgba(255,255,255,0.3)',
      '--input-focus-border': '#f59e0b',
      '--input-label-color': 'rgba(255,255,255,0.6)',

      // Botones
      '--btn-primary-bg': '#f59e0b',
      '--btn-primary-color': '#0a0c12',
      '--btn-ghost-bg': 'rgba(255,255,255,0.06)',
      '--btn-ghost-color': 'rgba(255,255,255,0.7)',
      '--btn-radius': '12px',

      // Layout
      '--canvas-portrait-w': '24',
      '--canvas-portrait-h': '40',
      '--canvas-landscape-w': '40',
      '--canvas-landscape-h': '24',
      '--margin-sm': '10px',
    };
  }

  /** Aplica un conjunto de propiedades al root del canvas */
  setProperties(props) {
    if (!this.root) return;
    Object.entries(props).forEach(([key, value]) => {
      this.root.style.setProperty(key, value);
    });
  }

  /** Resetea a valores por defecto */
  resetToDefaults() {
    this.setProperties(this.defaults);
  }

  /** Carga un tema completo desde un objeto */
  loadTheme(theme) {
    if (!theme || typeof theme !== 'object') return;
    this.setProperties(theme);
  }

  /** Obtiene el valor actual de una propiedad */
  get(key) {
    if (!this.root) return '';
    return getComputedStyle(this.root).getPropertyValue(key).trim();
  }
}
