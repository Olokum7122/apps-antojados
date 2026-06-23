import type { AxiosInstance } from 'axios'
import { API_ENDPOINTS } from '@antojados/http/endpoints'
import type { SystemHealth } from '@antojados/api/types/system'

function mapSystemHealth(raw: unknown): SystemHealth {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('system_health_invalid_response')
  }

  const candidate = raw as Record<string, unknown>
  const status =
    typeof candidate.status === 'string'
      ? candidate.status
      : typeof candidate.message === 'string'
        ? candidate.message
        : null

  if (!status) {
    throw new Error('system_health_missing_status')
  }

  return {
    status,
    timestamp:
      typeof candidate.timestamp === 'string'
        ? candidate.timestamp
        : typeof candidate.time === 'string'
          ? candidate.time
          : null,
    raw: candidate,
  }
}

export class SystemService {
  constructor(private readonly http: AxiosInstance) {}

  async getHealth(): Promise<SystemHealth> {
    const { data } = await this.http.get<unknown>(API_ENDPOINTS.system.health)
    return mapSystemHealth(data)
  }
}
