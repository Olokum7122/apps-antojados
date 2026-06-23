export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  status?: number
  meta?: Record<string, unknown>
}

export interface ApiError {
  status: number
  message: string
  code?: string
  details?: Record<string, unknown> | null
}

export interface PaginatedMeta {
  page: number
  perPage: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  meta: PaginatedMeta
  message?: string
}

export interface RefreshTokenResponse {
  accessToken: string
  refreshToken?: string | null
}
