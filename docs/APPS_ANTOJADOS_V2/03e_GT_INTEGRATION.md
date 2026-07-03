# 03e — GT Integration

Version: 1.0.0
Status: baseline
Applies to: shared/api/services/gt/, shared/api/services/tenants/, shared/api/services/modulos/

## 1. Proposito

Define la integracion entre las apps y el sistema GT (Control Operativo y
Economico). GT es el sistema que gestiona instancias de negocio, modulos,
comisiones y el estado economico de los sponsors.

## 2. Arquitectura de Integracion

```
Apps V2                          GT API
  │                                │
  │  gt-access.service.ts         │
  │  └── Obtener informacion     │
  │      de acceso del usuario    │
  │                                │
  │  tenants.service.ts           │
  │  └── CRUD de tenants         │
  │      (instancias de negocio)  │
  │                                │
  │  modulos.service.ts           │
  │  └── Catalogos y             │
  │      operaciones de modulos   │
  │                                │
  │  efirma.service.ts            │
  │  └── Firma electronica       │
  │      de contratos             │
  │                                │
  └────────────────────────────────┘
         HTTP + Auth
```

## 3. Servicios GT

### gt-access.service.ts (~141 lineas, reducido de ~477)

Servicio de resolucion de acceso GT. Solo contiene logica de resolucion de
acceso sincrona (SRP). El cache y la construccion de snapshot estan en
`gt-cache.service.ts`.

```typescript
// Metodos implementados desde DEBT-031:
getAccessInfo(): GtAccessInfo
hasModuleAccess(instanceId: string, moduleCode: string): boolean
getRole(instanceId: string, userId: string): string | null
```
```

Las funciones de cache y snapshot se importan desde `gt-cache.service.ts`:
```typescript
// Re-exportado via gt-access.service.ts
import { readStoredGtAccessSnapshot, clearGtAccessCache, primeGtAccessForSession, buildGtAccessSnapshotForSession } from './gt-cache.service'
```

### gt-cache.service.ts (~407 lineas, nuevo desde DEBT-002)

Cache de acceso GT con TTL y persistencia:

```typescript
class GtCacheService {
  readStoredGtAccessSnapshot(): GtCheckedSnapshot | null
  clearGtAccessCache(): void
  primeGtAccessForSession(session: TragonSession, options?: { forceRefresh?: boolean; preserveSubscription?: boolean }): Promise<GtCheckedSnapshot | null>
  buildGtAccessSnapshotForSession(session: TragonSession): Promise<GtCheckedSnapshot | null>
}
```

Responsabilidades:
- Cache en localStorage con TTL de 5 minutos (DEBT-027)
- Suscripcion a eventos de invalidacion SSE
- Construccion de snapshot desde API (template + dimensions + sub-dimensions)
- Para usuarios `user`: usa template DEFAULT_USER + sub-dimension catalog
- Para usuarios `sponsor`: usa checked dimensions + template DEFAULT_SPONSOR

### tenants.service.ts (82 lineas)

Gestion de tenants (instancias de negocio sponsor).

```typescript
class TenantsService {
  async listTenants(params: TenantListParams): Promise<TenantListItem[]>
  async getTenantDetail(instanceId: string): Promise<TenantDetail>
  async createTenant(input: TenantCreateInput): Promise<TenantCreateResult>
  async updateTenant(input: TenantUpdateInput): Promise<void>
}
```

### modulos.service.ts (141 lineas)

Gestion de modulos contratados por sponsors.

```typescript
class ModulosService {
  async getCatalog(): Promise<ModuleCatalogItem[]>
  async getInstanceModules(instanceId: string): Promise<InstanceModule[]>
  async activateModule(instanceId: string, moduleCode: string): Promise<void>
  async deactivateModule(instanceId: string, moduleCode: string): Promise<void>
  async getOperations(instanceId: string, moduleCode: string): Promise<ModuleOperation[]>
  async executeOperation(instanceId: string, moduleCode: string, operation: string, payload?: unknown): Promise<unknown>
}
```

### modulos-transversal-bridge.ts (82 lineas)

Bridge para operaciones que cruzan multiples modulos.

```typescript
class ModulosTransversalBridge {
  async crossModuleOperation(input: CrossModuleInput): Promise<CrossModuleResult>
}
```

### efirma.service.ts (161 lineas)

Firma electronica de contratos.

```typescript
class EfirmaService {
  async createDocument(input: EfirmaCreateInput): Promise<EfirmaCreateResult>
  async sendActivation(input: EfirmaActivationInput): Promise<void>
  async authorize(input: EfirmaAuthorizeInput): Promise<void>
  async getStatus(documentId: string): Promise<EfirmaStatus>
}
```

## 4. Endpoints GT

| Grupo | Prefijo | Rutas |
|---|---|---|
| Tenants | /api/v1/antojados/gt/tenants | CRUD, expediente, review |
| Efirma | /api/v1/antojados/gt/efirma | create, send-activation, authorize |
| Modulos | /api/v1/antojados/gt/instances/:id/modules | catalog, operations, audit |
| Instancias | /api/v1/antojados/gt/ | dimensions, templates, checked |

## 5. Cache de Acceso GT

`gt-cache.service.ts` implementa un cache de acceso con persistencia:

```typescript
// Cache en localStorage con TTL de 5 minutos
const GT_ACCESS_STORAGE_KEY = 'antojados.gt.checked.snapshot.v3'
const TTL_MS = 5 * 60 * 1000  // 5 minutos (DEBT-027)

// Se invalida cuando:
// - El usuario cierra sesion (clearGtAccessCache)
// - Se recibe evento SSE 'checked.invalidate'
// - Expiracion por TTL (5 min)
// - Se cambia el contexto (sponsor ↔ user)
```

## 6. Flujo de Acceso GT

```
1. Usuario inicia sesion
2. Se llama a primeGtAccessForSession(session)
3. Se obtiene informacion de acceso GT del usuario
4. Se cachea en memoria
5. Cuando se necesita, se consulta el cache primero
6. Si no hay cache, se llama a la API
7. Al cerrar sesion, se limpia el cache
```

## 7. Integracion con GT API

GT tiene su propio proyecto en `atlx-gt/apps/gt-api/`. Las apps se comunican
con GT via la API de Antojados (mismo host, rutas `/gt/*`).

## 8. Reglas No Negociables

- El acceso GT siempre se verifica via la API (nunca hardcodeado)
- El cache de acceso se limpia al cerrar sesion
- Las operaciones de modulos requieren verificacion de acceso
- La firma electronica tiene su propio flujo de autorizacion
- Los tenants solo pueden ser gestionados por usuarios con rol adecuado

## 9. ⚠️ Deuda Tecnica Identificada (actualizado tras DEBT-002 y DEBT-031)

- **RESUELTO**: `gt-access.service.ts` separado en 2 servicios: `gt-access.service.ts` (~141 L, solo resolucion) + `gt-cache.service.ts` (~407 L, cache + SSE + TTL). Se resolvieron DEBT-002 y DEBT-027.
- **RESUELTO**: `getAccessInfo`, `hasModuleAccess`, `getRole` implementados en `gt-access.service.ts` (DEBT-031)
- **PENDIENTE**: Los modulos tienen un bridge transversal que sugiere que la arquitectura de modulos no es del todo limpia.
- **PENDIENTE**: No hay documentacion de que modulos existen y que hacen.

## 10. Historial

| Version | Fecha | Cambio |
|---|---|---|
| 1.0.0 | 28/06/2026 | Contrato inicial |
| 1.1.0 | 28/06/2026 | Actualizado tras DEBT-002/DEBT-027: separacion de gt-cache.service.ts con TTL |
| 1.2.0 | 12/07/2026 | Actualizado tras DEBT-031: implementados getAccessInfo, hasModuleAccess, getRole |

