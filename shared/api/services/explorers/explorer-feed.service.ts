import type { AxiosInstance } from 'axios'
import type {
  ExplorerFeedItem,
  ExplorerFeedParams,
  ExplorerFeedResponse,
  ExplorerPublicationResponse,
  Composicion,
} from '../../types/explorer'

/**
 * Servicio para consumir el feed de publicaciones de Explorer App.
 * Los posts incluyen composicion.blocks[] con el diseño visual completo.
 */
export class ExplorerFeedService {
  private readonly baseUrl: string

  constructor(
    private readonly http: AxiosInstance,
    baseUrl?: string,
  ) {
    this.baseUrl = (baseUrl || 'https://api.antojadosmx.mx').replace(/\/+$/, '')
  }

  /**
   * Obtiene el feed de publicaciones para un tenant y tipo de feed.
   * GET /api/v1/explorer/tenants/{tenantId}/feed/{feedType}
   */
  async getFeed(params: ExplorerFeedParams): Promise<ExplorerFeedResponse> {
    const { tenantId, feedType, limit = 50, offset = 0 } = params
    const { data } = await this.http.get<ExplorerFeedResponse>(
      `${this.baseUrl}/api/v1/explorer/tenants/${encodeURIComponent(tenantId)}/feed/${encodeURIComponent(feedType)}`,
      { params: { limit, offset } },
    )
    return data
  }

  /**
   * Obtiene una publicación individual por su ID.
   * GET /api/v1/explorer/publications/{publicationId}
   */
  async getPublication(publicationId: string): Promise<ExplorerPublicationResponse> {
    const { data } = await this.http.get<ExplorerPublicationResponse>(
      `${this.baseUrl}/api/v1/explorer/publications/${encodeURIComponent(publicationId)}`,
    )
    return data
  }

  /**
   * Determina si un ítem de feed es de tipo Explorer (tiene composicion.blocks).
   */
  isExplorerPost(item: Record<string, unknown>): boolean {
    const composicion = item.composicion as Composicion | undefined
    return !!(composicion && Array.isArray(composicion.blocks) && composicion.blocks.length > 0)
  }
}

/** Singleton expuesto para uso en composables */
export let explorerFeedService: ExplorerFeedService

export function createExplorerFeedService(http: AxiosInstance, baseUrl?: string): ExplorerFeedService {
  explorerFeedService = new ExplorerFeedService(http, baseUrl)
  return explorerFeedService
}