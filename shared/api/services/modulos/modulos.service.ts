import type { AxiosInstance } from 'axios'
import { API_ENDPOINTS } from '@antojados/http/endpoints'

export interface ModuloCatalogItem {
  id: string
  itemCode: string
  sourceComponentCode: string | null
  sourceSubCode: string | null
  locationId: string | null
  subLocationId: string | null
  label: string
  description: string | null
  required: boolean
  defaultActive: boolean
  requestedVisible: boolean
  requestedEnabled: boolean
  defaultPlazo: string
  plazoOptions: string[]
}

export interface ModuloOperationRow {
  id: string
  requestId: string | null
  operationState: string | null
  operationBy: string | null
  operationAt: string | null
  createdAt: string | null
  raw: Record<string, unknown>
}

export interface ModuloOperationItemInput {
  item_code: string
  source_component_code?: string | null
  source_sub_code?: string | null
  location_id?: string | null
  sub_location_id?: string | null
  requested_visible: boolean
  requested_enabled: boolean
  plazo: string
  date_inicia: string
}

export interface ModuloOperationInput {
  request_id: string
  operation_by: string
  operation_at: string
  operation: {
    summary: string
    items: ModuloOperationItemInput[]
  }
}

function stringOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const text = String(value).trim()
  return text || null
}

function boolFrom(value: unknown): boolean {
  return value === true || Number(value || 0) === 1
}

function normalizePlazoOptions(value: unknown, fallback: string): string[] {
  const rawOptions = Array.isArray(value) ? value : []
  const options = rawOptions.map((item) => String(item).trim()).filter(Boolean)
  if (options.length > 0) return options
  return [fallback || '1']
}

function mapCatalogItem(raw: Record<string, unknown>, index: number): ModuloCatalogItem {
  const itemCode = stringOrNull(raw.item_code) || stringOrNull(raw.code) || `MODULO_${index + 1}`
  const defaultPlazo = stringOrNull(raw.default_plazo) || stringOrNull(raw.plazo) || '1'
  return {
    id: stringOrNull(raw.id) || itemCode,
    itemCode,
    sourceComponentCode: stringOrNull(raw.source_component_code),
    sourceSubCode: stringOrNull(raw.source_sub_code),
    locationId: stringOrNull(raw.location_id),
    subLocationId: stringOrNull(raw.sub_location_id),
    label: stringOrNull(raw.label) || itemCode,
    description: stringOrNull(raw.description),
    required: boolFrom(raw.required),
    defaultActive: boolFrom(raw.default_active),
    requestedVisible: boolFrom(raw.requested_visible),
    requestedEnabled: boolFrom(raw.requested_enabled),
    defaultPlazo,
    plazoOptions: normalizePlazoOptions(raw.plazo_options, defaultPlazo),
  }
}

function mapOperation(raw: Record<string, unknown>, index: number): ModuloOperationRow {
  const id = stringOrNull(raw.operation_id) || stringOrNull(raw.id) || stringOrNull(raw.request_id) || `op_${index + 1}`
  return {
    id,
    requestId: stringOrNull(raw.request_id),
    operationState: stringOrNull(raw.operation_state) || stringOrNull(raw.status),
    operationBy: stringOrNull(raw.operation_by),
    operationAt: stringOrNull(raw.operation_at),
    createdAt: stringOrNull(raw.created_at),
    raw,
  }
}

function rowsFrom(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[]
  const container = data as Record<string, unknown>
  if (Array.isArray(container?.rows)) return container.rows as Record<string, unknown>[]
  if (Array.isArray(container?.items)) return container.items as Record<string, unknown>[]
  return []
}

export function buildModuloRequestId(instanceId: string): string {
  return `modulos-${instanceId}-${Date.now()}`
}

export class ModulosService {
  constructor(private readonly http: AxiosInstance) {}

  async getCatalog(instanceId: string): Promise<ModuloCatalogItem[]> {
    const { data } = await this.http.get<unknown>(API_ENDPOINTS.modulos.catalog(instanceId))
    return rowsFrom(data).map(mapCatalogItem)
  }

  async getOperations(instanceId: string): Promise<ModuloOperationRow[]> {
    const { data } = await this.http.get<unknown>(API_ENDPOINTS.modulos.operations(instanceId))
    return rowsFrom(data).map(mapOperation)
  }

  async submitOperation(instanceId: string, payload: ModuloOperationInput): Promise<ModuloOperationRow | null> {
    const { data } = await this.http.post<unknown>(API_ENDPOINTS.modulos.operations(instanceId), payload)
    const rows = rowsFrom(data)
    if (rows.length > 0) return mapOperation(rows[0], 0)
    if (data && typeof data === 'object') return mapOperation(data as Record<string, unknown>, 0)
    return null
  }

  async getAudit(instanceId: string): Promise<ModuloOperationRow[]> {
    const { data } = await this.http.get<unknown>(API_ENDPOINTS.modulos.audit(instanceId))
    return rowsFrom(data).map(mapOperation)
  }
}
