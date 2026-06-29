/**
 * useGeoEvents — Composable para manejar eventos de geo a nivel de layout.
 *
 * DEBT-028: Separa la lógica de eventos de geo de MainLayout en un
 * composable reutilizable.
 *
 * Escucha eventos del eventBus (GeoEvents.PERMISSION_REQUEST,
 * GeoEvents.CITY_CHANGE_REQUEST) y el visibilitychange del document
 * para refrescar la ubicación cuando la app vuelve a foreground.
 */
import { onBeforeUnmount, onMounted } from 'vue'
import type { Ref } from 'vue'
import { useQuasar } from 'quasar'
import { eventBus, GeoEvents } from '@antojados/ui/services/eventBus'
import type { GeoCitySearchItem } from '@antojados/api/types/location'

export interface UseGeoEventsOptions {
  /** Función para solicitar ubicación del dispositivo */
  requestDeviceGeo: (force?: boolean, onlyIfMissing?: boolean) => Promise<boolean>
  /** Cooldown en ms entre notificaciones de permiso (default: 15000) */
  permissionNoticeCooldown?: number
}

export function useGeoEvents(options: UseGeoEventsOptions) {
  const $q = useQuasar()
  const cooldown = options.permissionNoticeCooldown ?? 15000
  let lastGeoNoticeAt = 0

  let offGeoPermission: (() => void) | null = null
  let offGeoCityChange: (() => void) | null = null

  function onGeoPermissionRequest(payload: { message: string }) {
    const now = Date.now()
    if (now - lastGeoNoticeAt < cooldown) return
    lastGeoNoticeAt = now
    $q.notify({
      type: 'info',
      message: payload?.message || 'Usamos tu ubicacion para mostrar publicaciones por ciudad y zona.',
      timeout: 3600,
    })
  }

  function onGeoCityChangeRequest(payload: {
    city: GeoCitySearchItem
    currentCityCode: string | null
    accept: () => Promise<void>
    message?: string
  }) {
    const cityLabel = payload.city?.cityLabel || 'esta ciudad'
    const accept = typeof payload.accept === 'function' ? payload.accept : null
    $q.notify({
      type: 'info',
      message: `${payload.message || `Detectamos que estas en ${cityLabel}.`} Usarla como ciudad de tus feeds?`,
      timeout: 12000,
      actions: [
        {
          label: 'Usar ciudad',
          color: 'white',
          handler: () => {
            if (accept) void accept()
          },
        },
        { label: 'Mantener', color: 'white' },
      ],
    })
  }

  function refreshGeoFromForeground() {
    void options.requestDeviceGeo(false, true)
  }

  function onVisibilityChange() {
    if (document.visibilityState === 'visible') {
      refreshGeoFromForeground()
    }
  }

  onMounted(() => {
    offGeoPermission = eventBus.on(GeoEvents.PERMISSION_REQUEST, onGeoPermissionRequest)
    offGeoCityChange = eventBus.on(GeoEvents.CITY_CHANGE_REQUEST, onGeoCityChangeRequest)
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibilityChange)
    }
  })

  onBeforeUnmount(() => {
    if (offGeoPermission) offGeoPermission()
    if (offGeoCityChange) offGeoCityChange()
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  })
}
