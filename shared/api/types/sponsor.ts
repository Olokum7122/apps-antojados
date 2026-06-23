export interface Sponsor {
  sponsorId: string
  userId?: string | null
  placeId?: string | null
  businessName: string
  category?: string | null
  cityCode?: string | null
  status?: string | null
}

export interface SponsorListQuery {
  page?: number
  perPage?: number
  search?: string
  cityCode?: string
  status?: string
}

export interface SponsorInstanceStatus {
  instanceId: string | null
  status: string | null
}

export interface SponsorDocumentUploadInput {
  instanceId: string
  userId: string
  uploadedByTenantUserId: string
  file: File
  docType: string
}
