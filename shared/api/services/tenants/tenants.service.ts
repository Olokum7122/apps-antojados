import type { AxiosInstance } from 'axios'
import { API_ENDPOINTS } from '@antojados/http/endpoints'
import type { Tenant, TenantDocument } from '@antojados/api/types/tenant'

function asRecord(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as Record<string, unknown> : {}
}

function dataArray<T>(payload: { data?: T[] } | T[]): T[] {
  return Array.isArray(payload) ? payload : Array.isArray(payload.data) ? payload.data : []
}

function mapTenant(raw: unknown): Tenant {
  const row = asRecord(raw)
  return {
    tenantId: String(row.tenant_id || row.id || row.instance_id || ''),
    instanceId: typeof row.instance_id === 'string' ? row.instance_id : null,
    businessName: typeof row.business_name === 'string' ? row.business_name : null,
    status: typeof row.tenant_status === 'string' ? row.tenant_status : typeof row.status === 'string' ? row.status : null,
    raw: row,
  }
}

function mapDocument(raw: unknown): TenantDocument {
  const row = asRecord(raw)
  return {
    docId: String(row.doc_id || row.id || ''),
    docType: typeof row.doc_type === 'string' ? row.doc_type : null,
    reviewStatus: typeof row.review_status === 'string' ? row.review_status : null,
    raw: row,
  }
}

export class TenantsService {
  constructor(private readonly http: AxiosInstance) {}

  async list(params: { page?: number; limit?: number } = {}): Promise<Tenant[]> {
    const { data } = await this.http.get<{ data?: unknown[] }>(API_ENDPOINTS.tenants.list, { params })
    return dataArray(data).map(mapTenant)
  }

  async get(tenantId: string): Promise<Tenant> {
    const { data } = await this.http.get<unknown>(API_ENDPOINTS.tenants.detail(tenantId))
    return mapTenant(data)
  }

  async activate(tenantId: string, operatorId: string): Promise<Record<string, unknown>> {
    const { data } = await this.http.post<Record<string, unknown>>(API_ENDPOINTS.tenants.activate(tenantId), { operator_id: operatorId })
    return data
  }

  async suspend(tenantId: string, input: { reason: string; initiatedBy: string; suspensionType?: string; plannedEndAt?: string | null }): Promise<Record<string, unknown>> {
    const { data } = await this.http.post<Record<string, unknown>>(API_ENDPOINTS.tenants.suspend(tenantId), {
      reason: input.reason,
      initiated_by: input.initiatedBy,
      suspension_type: input.suspensionType,
      planned_end_at: input.plannedEndAt,
    })
    return data
  }

  async reactivate(tenantId: string, operatorId: string): Promise<Record<string, unknown>> {
    const { data } = await this.http.post<Record<string, unknown>>(API_ENDPOINTS.tenants.reactivate(tenantId), { operator_id: operatorId })
    return data
  }

  async listExpediente(tenantId: string, params: { reviewStatus?: string; page?: number; limit?: number } = {}): Promise<TenantDocument[]> {
    const { data } = await this.http.get<{ data?: unknown[] }>(API_ENDPOINTS.tenants.expediente(tenantId), {
      params: { review_status: params.reviewStatus, page: params.page, limit: params.limit },
    })
    return dataArray(data).map(mapDocument)
  }

  async reviewDocument(tenantId: string, docId: string, input: { reviewStatus: 'approved' | 'rejected'; reviewedBy: string; reviewNotes?: string | null }): Promise<Record<string, unknown>> {
    const { data } = await this.http.post<Record<string, unknown>>(API_ENDPOINTS.tenants.expedienteReview(tenantId, docId), {
      review_status: input.reviewStatus,
      reviewed_by: input.reviewedBy,
      review_notes: input.reviewNotes,
    })
    return data
  }
}
