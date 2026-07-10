import { httpClient } from '@antojados/http/client'
import { API_ENDPOINTS } from '@antojados/http/endpoints'
import type { ApiResponse } from '@antojados/api/types/api'
import type { RankingItem, SponsorMetricItem } from '@antojados/api/types/ranking'

export interface RankingQuery {
  cityCode?: string
  scopeLevel?: string
  scopeCode?: string | null
  category?: string
  limit?: number
}

interface RawRankingPlace extends Record<string, unknown> {
  place_id?: string
  place_name?: string
  category?: string
  city_code?: string
  score?: number | string
  rank_position?: number | string
  post_count?: number | string
  verified_visit_count?: number | string
  avg_rating?: number | string
  saves_count?: number | string
  sponsored?: boolean | number
}

interface RawSponsorMetric extends Record<string, unknown> {
  place_id?: string
  city_code?: string
  category?: string
  post_type?: string
  biz_post_count?: number | string
  impressions_total?: number | string
  likes_total?: number | string
  comments_total?: number | string
  shares_total?: number | string
  cta_clicks_total?: number | string
  whatsapp_taps_total?: number | string
  maps_taps_total?: number | string
  calls_total?: number | string
  avg_engagement_score?: number | string
  tile_views?: number | string
  tile_clicks?: number | string
  tile_follows?: number | string
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function mapRankingPlace(raw: RawRankingPlace): RankingItem {
  return {
    placeId: String(raw.id || ''),
    placeName: typeof raw.place_name === 'string' ? raw.place_name : 'Lugar',
    category: typeof raw.category === 'string' ? raw.category : null,
    cityCode: typeof raw.city_code === 'string' ? raw.city_code : null,
    score: toNumber(raw.score, 0),
    rankPosition: toNumber(raw.rank_position, 0),
    postCount: toNumber(raw.post_count, 0),
    verifiedVisitCount: toNumber(raw.verified_visit_count, 0),
    avgRating: toNumber(raw.avg_rating, 0),
    savesCount: toNumber(raw.saves_count, 0),
    sponsored: raw.sponsored === true || Number(raw.sponsored || 0) === 1,
  }
}

function mapSponsorMetric(raw: RawSponsorMetric): SponsorMetricItem {
  return {
    placeId: String(raw.place_id || ''),
    cityCode: typeof raw.city_code === 'string' ? raw.city_code : null,
    category: typeof raw.category === 'string' ? raw.category : null,
    bizPostCount: toNumber(raw.biz_post_count, 0),
    impressionsTotal: toNumber(raw.impressions_total, 0),
    likesTotal: toNumber(raw.likes_total, 0),
    commentsTotal: toNumber(raw.comments_total, 0),
    sharesTotal: toNumber(raw.shares_total, 0),
    ctaClicksTotal: toNumber(raw.cta_clicks_total, 0),
    whatsappTapsTotal: toNumber(raw.whatsapp_taps_total, 0),
    mapsTapsTotal: toNumber(raw.maps_taps_total, 0),
    callsTotal: toNumber(raw.calls_total, 0),
    avgEngagementScore: toNumber(raw.avg_engagement_score, 0),
    tileViews: toNumber(raw.tile_views, 0),
    tileClicks: toNumber(raw.tile_clicks, 0),
    tileFollows: toNumber(raw.tile_follows, 0),
  }
}

export async function getTopPlaces(query: RankingQuery = {}): Promise<RankingItem[]> {
  const { data } = await httpClient.get<ApiResponse<RawRankingPlace[]>>(
    API_ENDPOINTS.rankings.topPlaces,
    {
      params: {
        city_code: query.cityCode,
        scope_level: query.scopeLevel,
        scope_code: query.scopeCode ?? undefined,
        category: query.category,
        limit: query.limit,
      },
    },
  )
  return Array.isArray(data.data) ? data.data.map(mapRankingPlace) : []
}

export async function getSponsorMetrics(query: RankingQuery = {}): Promise<SponsorMetricItem[]> {
  const { data } = await httpClient.get<ApiResponse<RawSponsorMetric[]>>(
    API_ENDPOINTS.rankings.sponsorMetrics,
    {
      params: {
        city_code: query.cityCode,
        scope_level: query.scopeLevel,
        scope_code: query.scopeCode ?? undefined,
        category: query.category,
        limit: query.limit,
      },
    },
  )
  return Array.isArray(data.data) ? data.data.map(mapSponsorMetric) : []
}
