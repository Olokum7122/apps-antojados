import { Preferences } from '@capacitor/preferences'

export interface KeyValueStorage {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
  remove(key: string): Promise<void>
}

export const secureStorage: KeyValueStorage = {
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

// Preferences es compatible con Capacitor Android/iOS.
// Puede migrarse a Secure Storage cuando se instale una dependencia dedicada.
