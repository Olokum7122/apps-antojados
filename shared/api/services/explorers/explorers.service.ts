import type { AxiosInstance } from 'axios'
import { API_ENDPOINTS } from '@antojados/http/endpoints'
import type { Explorer, ExplorerAssociation } from '@antojados/api/types/explorer'

function asRecord(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as Record<string, unknown> : {}
}

function mapExplorer(raw: unknown): Explorer {
  const row = asRecord(raw)
  return {
    userId: String(row.user_id || ''),
    displayName: typeof row.display_name === 'string' ? row.display_name : null,
    username: typeof row.username === 'string' ? row.username : null,
    cityCode: typeof row.city_code === 'string' ? row.city_code : null,
    status: typeof row.status === 'string' ? row.status : null,
    raw: row,
  }
}

function mapAssociation(raw: unknown): ExplorerAssociation {
  const row = asRecord(raw)
  return {
    associationId: String(row.association_id || row.id || ''),
    userId: String(row.user_id || ''),
    targetType: typeof row.target_type === 'string' ? row.target_type : null,
    associatedInstanceId: typeof row.associated_instance_id === 'string' ? row.associated_instance_id : null,
    status: typeof row.status === 'string' ? row.status : null,
    raw: row,
  }
}

function dataArray<T>(payload: { data?: T[] } | T[]): T[] {
  return Array.isArray(payload) ? payload : Array.isArray(payload.data) ? payload.data : []
}

export class ExplorersService {
  constructor(private readonly http: AxiosInstance) {}

  async list(params: { cityCode?: string; limit?: number; offset?: number } = {}): Promise<Explorer[]> {
    const { data } = await this.http.get<{ data?: unknown[] }>(API_ENDPOINTS.auth.explorers, {
      params: { city_code: params.cityCode, limit: params.limit, offset: params.offset },
    })
    return dataArray(data).map(mapExplorer)
  }

  async listActivity(params: { cityCode?: string; days?: number; limit?: number; offset?: number } = {}): Promise<Record<string, unknown>> {
    const { data } = await this.http.get<Record<string, unknown>>(API_ENDPOINTS.auth.explorersActivity, {
      params: { city_code: params.cityCode, days: params.days, limit: params.limit, offset: params.offset },
    })
    return data
  }

  async setStatus(userId: string, input: { enabled?: boolean; updatedBy?: string } = {}): Promise<Record<string, unknown>> {
    const { data } = await this.http.patch<Record<string, unknown>>(API_ENDPOINTS.auth.explorer(userId), {
      enabled: input.enabled !== false,
      updated_by: input.updatedBy,
    })
    return data
  }

  async listAssociations(userId: string, params: { status?: string; targetType?: string; limit?: number; offset?: number } = {}): Promise<ExplorerAssociation[]> {
    const { data } = await this.http.get<{ data?: unknown[] }>(API_ENDPOINTS.auth.explorerAssociations(userId), {
      params: { status: params.status, target_type: params.targetType, limit: params.limit, offset: params.offset },
    })
    return dataArray(data).map(mapAssociation)
  }

  async linkAssociation(userId: string, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { data } = await this.http.post<Record<string, unknown>>(API_ENDPOINTS.auth.explorerAssociations(userId), payload)
    return data
  }

  async updateAssociation(userId: string, associationId: string, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { data } = await this.http.patch<Record<string, unknown>>(API_ENDPOINTS.auth.explorerAssociation(userId, associationId), payload)
    return data
  }

  async getActivity(userId: string, days = 14): Promise<Record<string, unknown>> {
    const { data } = await this.http.get<Record<string, unknown>>(API_ENDPOINTS.auth.explorerActivity(userId), { params: { days } })
    return data
  }
}
