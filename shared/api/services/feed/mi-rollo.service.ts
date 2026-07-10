import { API_ENDPOINTS } from '@antojados/http/endpoints'
import type { ApiResponse } from '@antojados/api/types/api'

export interface MiRolloSummary {
  userId: string
  displayName: string | null
  username: string | null
  postsTotal: number
  likesReceivedTotal: number
  commentsReceivedTotal: number
  sharesReceivedTotal: number
  savedPlacesTotal: number
  followingTotal: number
  followersTotal: number
  engagementScore: number
  verifiedVisitsCount: number
  uniquePlacesVisited: number
}

export interface MiRolloActivityItem {
  id: string
  activity: string
  detail: string
  impact: string
  when: string
  sortDate: string
}

export interface MiRolloPostItem {
  id: string
  post: string
  detail: string
  status: string
  when: string
  sortDate: string
}

interface RawUserSummary extends Record<string, unknown> {
  user_id?: string
  display_name?: string
  username?: string
  posts_total?: number | string
  likes_received_total?: number | string
  comments_received_total?: number | string
  shares_received_total?: number | string
  saved_places_total?: number | string
  following_total?: number | string
  followers_total?: number | string
  engagement_score?: number | string
  verified_visits_count?: number | string
  unique_places_visited?: number | string
}

interface RawPost extends Record<string, unknown> {
  post_id?: string
  dish_name?: string
  feed_type?: string
  post_status?: string
  likes_count?: number | string
  comments_count?: number | string
  shares_count?: number | string
  published_at?: string
}

interface RawFollow extends Record<string, unknown> {
  follow_id?: string
  target_type?: string
  target_user_id?: string
  target_place_id?: string
  created_at?: string
}

interface RawSave extends Record<string, unknown> {
    save_id?: string
    place_name?: string
    created_at?: string
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function toRelativeDate(value: string | null): string {
  if (!value) return 'Sin fecha'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Sin fecha'

  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const dayMs = 1000 * 60 * 60 * 24
  const days = Math.floor(diff / dayMs)

  if (days <= 0) return 'Hoy'
  if (days === 1) return 'Ayer'
  return `Hace ${days} dias`
}

function mapSummary(raw: RawUserSummary): MiRolloSummary {
  return {
    userId: String(raw.user_id || ''),
    displayName: typeof raw.display_name === 'string' ? raw.display_name : null,
    username: typeof raw.username === 'string' ? raw.username : null,
    postsTotal: toNumber(raw.posts_total, 0),
    likesReceivedTotal: toNumber(raw.likes_received_total, 0),
    commentsReceivedTotal: toNumber(raw.comments_received_total, 0),
    sharesReceivedTotal: toNumber(raw.shares_received_total, 0),
    savedPlacesTotal: toNumber(raw.saved_places_total, 0),
    followingTotal: toNumber(raw.following_total, 0),
    followersTotal: toNumber(raw.followers_total, 0),
    engagementScore: toNumber(raw.engagement_score, 0),
    verifiedVisitsCount: toNumber(raw.verified_visits_count, 0),
    uniquePlacesVisited: toNumber(raw.unique_places_visited, 0),
  }
}

export class MiRolloService {
  constructor(private readonly http: import('axios').AxiosInstance) {}

  async getSummary(userId: string): Promise<MiRolloSummary | null> {
    const response = await this.http.get<ApiResponse<RawUserSummary>>(API_ENDPOINTS.rankings.userSummary, {
      params: { user_id: userId },
    })

    if (!response.data.data?.user_id) {
      return null
    }

    return mapSummary(response.data.data)
  }

  /**
   * Lista posts del usuario con paginación explícita.
   * @param userId - ID del usuario
   * @param options - Parámetros de paginación (page, limit)
   */
  async listPosts(
    userId: string,
    options: { page?: number; limit?: number } = {},
  ): Promise<MiRolloPostItem[]> {
    const page = options.page ?? 1
    const limit = options.limit ?? 20
    const response = await this.http.get<ApiResponse<{ data?: RawPost[] }>>(API_ENDPOINTS.socialPosts.create, {
      params: { user_id: userId, limit, page },
    })

    const rows = Array.isArray(response.data.data?.data) ? response.data.data.data : []

    return rows.map((row, index) => {
      const publishedAt = typeof row.published_at === 'string' ? row.published_at : null
      const dish = typeof row.dish_name === 'string' ? row.dish_name : 'Publicacion'
      const comments = toNumber(row.comments_count, 0)
      const likes = toNumber(row.likes_count, 0)

      return {
        id: String(row.post_id || `post-${index}`),
        post: dish,
        detail: `${likes} likes · ${comments} comentarios`,
        status: typeof row.post_status === 'string' ? row.post_status : 'active',
        when: toRelativeDate(publishedAt),
        sortDate: publishedAt || '',
      }
    })
  }

  /**
   * Lista actividad reciente del usuario con paginación explícita.
   * @param userId - ID del usuario
   * @param options - Parámetros de paginación (page, limit)
   */
  async listActivity(
    userId: string,
    options: { page?: number; limit?: number } = {},
  ): Promise<MiRolloActivityItem[]> {
    const page = options.page ?? 1
    const limit = options.limit ?? 10
    const [followingResponse, followersResponse, savesResponse] = await Promise.all([
      this.http.get<ApiResponse<{ data?: RawFollow[] }>>(API_ENDPOINTS.socialPosts.following(userId), {
        params: { limit, page },
      }),
      this.http.get<ApiResponse<{ data?: RawFollow[] }>>(API_ENDPOINTS.socialPosts.followers(userId), {
        params: { limit, page },
      }),
      this.http.get<ApiResponse<{ data?: RawSave[] }>>(API_ENDPOINTS.socialPosts.saves(userId), {
        params: { limit, page },
      }),
    ])

    const following = Array.isArray(followingResponse.data.data?.data) ? followingResponse.data.data.data : []
    const followers = Array.isArray(followersResponse.data.data?.data) ? followersResponse.data.data.data : []
    const saves = Array.isArray(savesResponse.data.data?.data) ? savesResponse.data.data.data : []

    const items: MiRolloActivityItem[] = [
      ...saves.map((row, index) => {
        const createdAt = typeof row.created_at === 'string' ? row.created_at : ''
        const placeName = typeof row.place_name === 'string' ? row.place_name : 'Lugar guardado'
        return {
          id: String(row.save_id || `save-${index}`),
          activity: 'Guardado',
          detail: `Guardaste ${placeName}.`,
          impact: '1 guardado',
          when: toRelativeDate(createdAt),
          sortDate: createdAt,
        }
      }),
      ...following.map((row, index) => {
        const createdAt = typeof row.created_at === 'string' ? row.created_at : ''
        const targetType = row.target_type === 'place' ? 'negocio' : 'usuario'
        return {
          id: String(row.follow_id || `following-${index}`),
          activity: 'Siguiendo',
          detail: `Empezaste a seguir un ${targetType} en Red.`,
          impact: '1 seguimiento',
          when: toRelativeDate(createdAt),
          sortDate: createdAt,
        }
      }),
      ...followers.map((row, index) => {
        const createdAt = typeof row.created_at === 'string' ? row.created_at : ''
        return {
          id: String(row.follow_id || `follower-${index}`),
          activity: 'Nuevo seguidor',
          detail: 'Una cuenta nueva reacciono a tu perfil.',
          impact: '1 seguidor',
          when: toRelativeDate(createdAt),
          sortDate: createdAt,
        }
      }),
    ]

    return items.sort((a, b) => String(b.sortDate).localeCompare(String(a.sortDate))).slice(0, 12)
  }
}
