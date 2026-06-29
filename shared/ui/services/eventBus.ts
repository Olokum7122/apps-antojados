/**
 * Bus de eventos simple para comunicacion entre modulos.
 * Reemplaza los window.CustomEvent que eran fragiles y dificiles de debuggear.
 *
 * Uso:
 *   import { eventBus } from '@antojados/ui/services/eventBus'
 *
 *   // Emitir
 *   eventBus.emit('geo:city-change-request', { city, currentCityCode, accept })
 *
 *   // Escuchar
 *   const off = eventBus.on('geo:city-change-request', (payload) => { ... })
 *   onBeforeUnmount(() => off()) // cleanup
 *
 *   // Una sola vez
 *   eventBus.once('geo:permission-request', (payload) => { ... })
 */

type EventHandler = (...args: any[]) => void

interface EventBus {
  on(event: string, handler: EventHandler): () => void
  once(event: string, handler: EventHandler): () => void
  emit(event: string, ...args: any[]): void
  off(event: string, handler: EventHandler): void
  clear(event?: string): void
}

export function createEventBus(): EventBus {
  const handlers = new Map<string, Set<EventHandler>>()

  function on(event: string, handler: EventHandler): () => void {
    if (!handlers.has(event)) {
      handlers.set(event, new Set())
    }
    handlers.get(event)!.add(handler)
    return () => off(event, handler)
  }

  function once(event: string, handler: EventHandler): () => void {
    const wrapped = (...args: any[]) => {
      off(event, wrapped)
      handler(...args)
    }
    return on(event, wrapped)
  }

  function emit(event: string, ...args: any[]): void {
    const eventHandlers = handlers.get(event)
    if (eventHandlers) {
      eventHandlers.forEach((handler) => {
        try {
          handler(...args)
        } catch (error) {
          console.error(`[EventBus] Error in handler for "${event}":`, error)
        }
      })
    }
  }

  function off(event: string, handler: EventHandler): void {
    const eventHandlers = handlers.get(event)
    if (eventHandlers) {
      eventHandlers.delete(handler)
      if (eventHandlers.size === 0) {
        handlers.delete(event)
      }
    }
  }

  function clear(event?: string): void {
    if (event) {
      handlers.delete(event)
    } else {
      handlers.clear()
    }
  }

  return { on, once, emit, off, clear }
}

/** Bus global de eventos de la aplicacion */
export const eventBus = createEventBus()

/** Eventos del sistema de geo (antes window.CustomEvent) */
export const GeoEvents = {
  PERMISSION_REQUEST: 'geo:permission-request',
  CITY_CHANGE_REQUEST: 'geo:city-change-request',
} as const
