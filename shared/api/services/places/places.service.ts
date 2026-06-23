import type { AxiosInstance } from 'axios'
import { API_ENDPOINTS } from '@antojados/http/endpoints'
import type { FeedItem } from '@antojados/api/types/feed'
import type { GooglePlaceCandidate, Place } from '@antojados/api/types/place'

function asRecord(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as Record<string, unknown> : {}
}

function dataArray<T>(payload: { data?: T[] } | T[]): T[] {
  return Array.isArray(payload) ? payload : Array.isArray(payload.data) ? payload.data : []
}

function toNumber(value: unknown): number | null {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function mapPlace(raw: unknown): Place {
  const row = asRecord(raw)
  return {
    placeId: String(row.place_id || row.id || ''),
    name: String(row.name || row.place_name || ''),
    category: typeof row.category === 'string' ? row.category : null,
    cityCode: typeof row.city_code === 'string' ? row.city_code : null,
    lat: toNumber(row.lat),
    lng: toNumber(row.lng),
    raw: row,
  }
}

function mapCandidate(raw: unknown): GooglePlaceCandidate {
  const row = asRecord(raw)
  return {
    placeId: String(row.place_id || ''),
    name: String(row.name || ''),
    formattedAddress: typeof row.formatted_address === 'string' ? row.formatted_address : null,
    lat: toNumber(row.lat),
    lng: toNumber(row.lng),
  }
}

export class PlacesService {
  constructor(private readonly http: AxiosInstance) {}

  async list(params: Record<string, unknown> = {}): Promise<Place[]> {
    const { data } = await this.http.get<{ data?: unknown[] }>(API_ENDPOINTS.places.list, { params })
    return dataArray(data).map(mapPlace)
  }

  async searchGooglePlaces(name: string, city: string): Promise<GooglePlaceCandidate[]> {
    const { data } = await this.http.get<{ candidates?: unknown[] }>(API_ENDPOINTS.places.searchGooglePlaces, { params: { name, city } })
    return Array.isArray(data.candidates) ? data.candidates.map(mapCandidate) : []
  }

  async get(placeId: string, userId?: string): Promise<Place> {
    const { data } = await this.http.get<unknown>(API_ENDPOINTS.places.detail(placeId), { params: { user_id: userId } })
    return mapPlace(data)
  }

  async create(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { data } = await this.http.post<Record<string, unknown>>(API_ENDPOINTS.places.list, input)
    return data
  }

  async update(placeId: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { data } = await this.http.patch<Record<string, unknown>>(API_ENDPOINTS.places.detail(placeId), input)
    return data
  }

  async listPosts(placeId: string, params: { page?: number; limit?: number } = {}): Promise<FeedItem[]> {
    const { data } = await this.http.get<{ data?: FeedItem[] }>(API_ENDPOINTS.places.posts(placeId), { params })
    return dataArray(data)
  }

  async getRatingsSummary(placeId: string): Promise<Record<string, unknown>> {
    const { data } = await this.http.get<Record<string, unknown>>(API_ENDPOINTS.places.ratingsSummary(placeId))
    return data
  }
}
