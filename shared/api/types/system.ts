export interface SystemHealth {
  status: string
  timestamp: string | null
  raw: Record<string, unknown>
}
