export interface Place {
  placeId: string
  name: string
  category?: string | null
  cityCode?: string | null
  lat?: number | null
  lng?: number | null
  raw: Record<string, unknown>
}

export interface GooglePlaceCandidate {
  placeId: string
  name: string
  formattedAddress?: string | null
  lat?: number | null
  lng?: number | null
}
