const THEME_STORAGE_KEY = 'antojados.theme'
const DEFAULT_THEME = 'ambar'

const THEME_DEFINITIONS = {
  ambar: {
    '--app-primary': '#f59e0b',
    '--app-primary-dark': '#d97706',
    '--app-primary-light': '#fcd34d',
    '--app-secondary': '#10b981',
    '--app-bg-page': '#0a0c14',
    '--app-bg-card': '#12151f',
    '--app-bg-surface': '#1a1d2b',
    '--app-bg-overlay': 'rgba(10, 12, 20, 0.92)',
    '--app-surface': '#12151f',
    '--app-bg-start': '#0a0c14',
    '--app-bg-end': '#111827',
    '--app-text-primary': '#ffffff',
    '--app-text-secondary': 'rgba(255, 255, 255, 0.72)',
    '--app-text-muted': 'rgba(255, 255, 255, 0.42)',
    '--app-text-accent': '#f59e0b',
    '--app-border': 'rgba(255, 255, 255, 0.08)',
    '--app-border-accent': 'rgba(245, 158, 11, 0.4)',
    '--app-accent-bg': 'rgba(245, 158, 11, 0.12)',
    '--app-primary-muted': 'rgba(245, 158, 11, 0.65)',
    '--app-gradient-feed': 'radial-gradient(circle at 30% 20%, rgba(255, 122, 0, 0.55), rgba(10, 12, 20, 0.98) 55%)',
    '--app-shadow-card': '0 4px 24px rgba(0, 0, 0, 0.6)',
    '--app-shadow-fab': '0 4px 12px rgba(245, 158, 11, 0.4)',
    '--bar-bg-module': '#0f172a',
    '--bar-text-module': '#f59e0b',
    '--bar-active-bg-module': '#1e293b',
    '--bar-active-text-module': '#ffffff',
    '--bar-hover-bg-module': '#263449',
    '--bar-bg-area': '#1e293b',
    '--bar-text-area': '#f59e0b',
    '--bar-active-bg-area': '#334155',
    '--bar-active-text-area': '#ffffff',
    '--bar-hover-bg-area': '#3b4d66',
    '--bar-bg-component': '#334155',
    '--bar-text-component': '#f59e0b',
    '--bar-active-bg-component': '#475569',
    '--bar-active-text-component': '#ffffff',
    '--bar-hover-bg-component': '#52637a',
    '--bar-bg-subtab': '#475569',
    '--bar-text-subtab': '#f59e0b',
    '--bar-active-bg-subtab': '#64748b',
    '--bar-active-text-subtab': '#ffffff',
    '--bar-hover-bg-subtab': '#708299',
    '--buttonbar-bg-inverted': '#f59e0b',
    '--buttonbar-text-inverted': '#111827',
    '--buttonbar-active-bg-inverted': '#fcd34d',
    '--buttonbar-border-inverted': '#b45309',
    '--button-base-text-inverted': '#111827',
    '--button-base-primary-bg-inverted': '#fcd34d',
    '--button-base-primary-text-inverted': '#111827',
    '--button-base-outline-border-inverted': 'rgba(17, 24, 39, 0.35)',
    '--button-base-ghost-bg-inverted': 'rgba(255, 255, 255, 0.18)',
    '--app-radius-md': '14px'
  },
  aqua: {
    '--app-primary': '#06b6d4',
    '--app-primary-dark': '#0891b2',
    '--app-primary-light': '#67e8f9',
    '--app-secondary': '#8b5cf6',
    '--app-bg-page': '#0a0c14',
    '--app-bg-card': '#12151f',
    '--app-bg-surface': '#1a1d2b',
    '--app-bg-overlay': 'rgba(10, 12, 20, 0.92)',
    '--app-surface': '#12151f',
    '--app-bg-start': '#0a0c14',
    '--app-bg-end': '#0d1e2a',
    '--app-text-primary': '#ffffff',
    '--app-text-secondary': 'rgba(255, 255, 255, 0.72)',
    '--app-text-muted': 'rgba(255, 255, 255, 0.42)',
    '--app-text-accent': '#06b6d4',
    '--app-border': 'rgba(255, 255, 255, 0.08)',
    '--app-border-accent': 'rgba(6, 182, 212, 0.4)',
    '--app-accent-bg': 'rgba(6, 182, 212, 0.12)',
    '--app-primary-muted': 'rgba(6, 182, 212, 0.65)',
    '--app-gradient-feed': 'radial-gradient(circle at 30% 20%, rgba(6, 182, 212, 0.45), rgba(10, 12, 20, 0.98) 55%)',
    '--app-shadow-card': '0 4px 24px rgba(0, 0, 0, 0.6)',
    '--app-shadow-fab': '0 4px 12px rgba(6, 182, 212, 0.4)',
    '--bar-bg-module': '#08202b',
    '--bar-text-module': '#06b6d4',
    '--bar-active-bg-module': '#0b3342',
    '--bar-active-text-module': '#ffffff',
    '--bar-hover-bg-module': '#114256',
    '--bar-bg-area': '#0b3342',
    '--bar-text-area': '#06b6d4',
    '--bar-active-bg-area': '#0f4458',
    '--bar-active-text-area': '#ffffff',
    '--bar-hover-bg-area': '#16556d',
    '--bar-bg-component': '#0f4458',
    '--bar-text-component': '#06b6d4',
    '--bar-active-bg-component': '#165a70',
    '--bar-active-text-component': '#ffffff',
    '--bar-hover-bg-component': '#1a6982',
    '--bar-bg-subtab': '#165a70',
    '--bar-text-subtab': '#06b6d4',
    '--bar-active-bg-subtab': '#1c728b',
    '--bar-active-text-subtab': '#ffffff',
    '--bar-hover-bg-subtab': '#25839e',
    '--buttonbar-bg-inverted': '#06b6d4',
    '--buttonbar-text-inverted': '#082f49',
    '--buttonbar-active-bg-inverted': '#67e8f9',
    '--buttonbar-border-inverted': '#0e7490',
    '--button-base-text-inverted': '#082f49',
    '--button-base-primary-bg-inverted': '#67e8f9',
    '--button-base-primary-text-inverted': '#082f49',
    '--button-base-outline-border-inverted': 'rgba(8, 47, 73, 0.35)',
    '--button-base-ghost-bg-inverted': 'rgba(255, 255, 255, 0.22)',
    '--app-radius-md': '14px'
  },
  indigo: {
    '--app-primary': '#6366f1',
    '--app-primary-dark': '#4338ca',
    '--app-primary-light': '#a5b4fc',
    '--app-secondary': '#22c55e',
    '--app-bg-page': '#080a16',
    '--app-bg-card': '#101324',
    '--app-bg-surface': '#181b31',
    '--app-bg-overlay': 'rgba(8, 10, 22, 0.92)',
    '--app-surface': '#101324',
    '--app-bg-start': '#080a16',
    '--app-bg-end': '#141733',
    '--app-text-primary': '#ffffff',
    '--app-text-secondary': 'rgba(255, 255, 255, 0.74)',
    '--app-text-muted': 'rgba(255, 255, 255, 0.44)',
    '--app-text-accent': '#a5b4fc',
    '--app-border': 'rgba(255, 255, 255, 0.09)',
    '--app-border-accent': 'rgba(99, 102, 241, 0.44)',
    '--app-accent-bg': 'rgba(99, 102, 241, 0.16)',
    '--app-primary-muted': 'rgba(99, 102, 241, 0.68)',
    '--app-gradient-feed': 'radial-gradient(circle at 30% 20%, rgba(99, 102, 241, 0.48), rgba(8, 10, 22, 0.98) 55%)',
    '--app-shadow-card': '0 4px 24px rgba(0, 0, 0, 0.62)',
    '--app-shadow-fab': '0 4px 12px rgba(99, 102, 241, 0.42)',
    '--bar-bg-module': '#11142b',
    '--bar-text-module': '#a5b4fc',
    '--bar-active-bg-module': '#252a54',
    '--bar-active-text-module': '#ffffff',
    '--bar-hover-bg-module': '#303668',
    '--bar-bg-area': '#252a54',
    '--bar-text-area': '#a5b4fc',
    '--bar-active-bg-area': '#303668',
    '--bar-active-text-area': '#ffffff',
    '--bar-hover-bg-area': '#3a4178',
    '--bar-bg-component': '#303668',
    '--bar-text-component': '#c7d2fe',
    '--bar-active-bg-component': '#3f4786',
    '--bar-active-text-component': '#ffffff',
    '--bar-hover-bg-component': '#4b5598',
    '--bar-bg-subtab': '#3f4786',
    '--bar-text-subtab': '#c7d2fe',
    '--bar-active-bg-subtab': '#5661ad',
    '--bar-active-text-subtab': '#ffffff',
    '--bar-hover-bg-subtab': '#6570be',
    '--buttonbar-bg-inverted': '#6366f1',
    '--buttonbar-text-inverted': '#eef2ff',
    '--buttonbar-active-bg-inverted': '#818cf8',
    '--buttonbar-border-inverted': '#4338ca',
    '--button-base-text-inverted': '#eef2ff',
    '--button-base-primary-bg-inverted': '#818cf8',
    '--button-base-primary-text-inverted': '#11142b',
    '--button-base-outline-border-inverted': 'rgba(238, 242, 255, 0.38)',
    '--button-base-ghost-bg-inverted': 'rgba(255, 255, 255, 0.18)',
    '--app-radius-md': '14px'
  }
}

function getSafeDocument() {
  return typeof document !== 'undefined' ? document : null
}

function getThemeDefinition(themeName) {
  return THEME_DEFINITIONS[themeName] || THEME_DEFINITIONS[DEFAULT_THEME]
}

function getStoredThemeName() {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY)
    return value && THEME_DEFINITIONS[value] ? value : DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

function persistThemeName(themeName) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, themeName)
  } catch {
    // Keep runtime-only theme when storage is unavailable.
  }
}

export function applyTheme(themeName) {
  const doc = getSafeDocument()
  if (!doc) return DEFAULT_THEME

  const normalizedTheme = THEME_DEFINITIONS[themeName] ? themeName : DEFAULT_THEME
  const themeDefinition = getThemeDefinition(normalizedTheme)

  Object.entries(themeDefinition).forEach(([token, value]) => {
    doc.documentElement.style.setProperty(token, value)
  })

  doc.documentElement.style.setProperty('--q-primary', themeDefinition['--app-primary'])

  doc.body.classList.remove('theme-ambar', 'theme-aqua', 'theme-indigo')
  doc.body.classList.add(`theme-${normalizedTheme}`)

  return normalizedTheme
}

export function initializeThemeManager() {
  const storedTheme = getStoredThemeName()
  return applyTheme(storedTheme)
}

export function setTheme(themeName) {
  const activeTheme = applyTheme(themeName)
  persistThemeName(activeTheme)
  return activeTheme
}

export function getAvailableThemes() {
  return Object.keys(THEME_DEFINITIONS)
}

export function getActiveTheme() {
  const doc = getSafeDocument()
  if (doc) {
    if (doc.body.classList.contains('theme-aqua')) return 'aqua'
    if (doc.body.classList.contains('theme-indigo')) return 'indigo'
    if (doc.body.classList.contains('theme-ambar')) return 'ambar'
  }

  return getStoredThemeName()
}
