/**
 * Secure Storage con fallback para entorno web.
 *
 * DEBT-017: Fallback en secure-storage.ts sin Capacitor.
 *
 * En Capacitor (iOS/Android) usa @capacitor/preferences (Secure Storage).
 * En entorno web (SSR o desarrollo) usa localStorage como polyfill.
 */

const FALLBACK_PREFIX = 'antojados_'

function isCapacitorAvailable(): boolean {
  try {
    return (
      typeof globalThis !== 'undefined' &&
      (globalThis as Record<string, unknown>).Capacitor !== undefined &&
      typeof (globalThis as Record<string, unknown>).Capacitor === 'object' &&
      (globalThis as Record<string, unknown>).Capacitor !== null
    )
  } catch {
    return false
  }
}

export interface KeyValueStorage {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
  remove(key: string): Promise<void>
}

function createFallbackStorage(): KeyValueStorage {
  return {
    async get(key: string): Promise<string | null> {
      try {
        return localStorage.getItem(`${FALLBACK_PREFIX}${key}`)
      } catch {
        return null
      }
    },
    async set(key: string, value: string): Promise<void> {
      try {
        localStorage.setItem(`${FALLBACK_PREFIX}${key}`, value)
      } catch {
        // localStorage lleno o deshabilitado — ignorar silenciosamente
      }
    },
    async remove(key: string): Promise<void> {
      try {
        localStorage.removeItem(`${FALLBACK_PREFIX}${key}`)
      } catch {
        // ignorar
      }
    },
  }
}

function createCapacitorStorage(): KeyValueStorage {
  // Import dinámico para no romper SSR/build cuando Capacitor no está instalado
  const PreferencesModule = (() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require('@capacitor/preferences')
    } catch {
      return null
    }
  })()

  if (!PreferencesModule?.Preferences) {
    return createFallbackStorage()
  }

  const { Preferences } = PreferencesModule

  return {
    async get(key: string): Promise<string | null> {
      const { value } = await Preferences.get({ key })
      return value
    },
    async set(key: string, value: string): Promise<void> {
      await Preferences.set({ key, value })
    },
    async remove(key: string): Promise<void> {
      await Preferences.remove({ key })
    },
  }
}

export const secureStorage: KeyValueStorage = isCapacitorAvailable()
  ? createCapacitorStorage()
  : createFallbackStorage()
