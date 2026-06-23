export interface Tenant {
  tenantId: string
  instanceId?: string | null
  businessName?: string | null
  status?: string | null
  raw: Record<string, unknown>
}

export interface TenantDocument {
  docId: string
  docType?: string | null
  reviewStatus?: string | null
  raw: Record<string, unknown>
}
