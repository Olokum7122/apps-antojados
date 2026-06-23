export interface RankingItem {
  placeId: string
  placeName: string
  category?: string | null
  cityCode?: string | null
  rankPosition: number
  score: number
  postCount: number
  verifiedVisitCount: number
  avgRating: number
  savesCount: number
  sponsored: boolean
}

export interface SponsorMetricItem {
  placeId: string
  cityCode: string | null
  category: string | null
  postType: string | null
  bizPostCount: number
  impressionsTotal: number
  likesTotal: number
  commentsTotal: number
  sharesTotal: number
  ctaClicksTotal: number
  whatsappTapsTotal: number
  mapsTapsTotal: number
  callsTotal: number
  avgEngagementScore: number
  tileViews: number
  tileClicks: number
  tileFollows: number
}
