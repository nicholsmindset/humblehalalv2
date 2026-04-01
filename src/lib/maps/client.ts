import { Client, PlaceInputType } from '@googlemaps/google-maps-services-js'

// ── Singleton Maps client (server-only) ───────────────────────────────────────
let _client: Client | null = null
function getClient(): Client {
  if (!_client) {
    _client = new Client({})
  }
  return _client
}

const API_KEY = () => process.env.GOOGLE_MAPS_API_KEY!

// ── Types ─────────────────────────────────────────────────────────────────────
export interface LatLng {
  lat: number
  lng: number
}

export interface PlaceDetails {
  placeId: string
  name: string
  address: string
  phone?: string
  website?: string
  hours?: string[]
  location?: LatLng
  photos?: string[]
  rating?: number
  userRatingsTotal?: number
  businessStatus?: string
}

// ── Geocoding ─────────────────────────────────────────────────────────────────
export async function geocodeAddress(address: string): Promise<LatLng | null> {
  try {
    const client = getClient()
    const res = await client.geocode({
      params: {
        address: `${address}, Singapore`,
        key: API_KEY(),
      },
    })
    const result = res.data.results[0]
    if (!result) return null
    return {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
    }
  } catch {
    return null
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const client = getClient()
    const res = await client.reverseGeocode({
      params: {
        latlng: { lat, lng },
        key: API_KEY(),
      },
    })
    return res.data.results[0]?.formatted_address ?? null
  } catch {
    return null
  }
}

// ── Place lookup ──────────────────────────────────────────────────────────────
export async function findPlace(query: string): Promise<{ placeId: string; location: LatLng } | null> {
  try {
    const client = getClient()
    const res = await client.findPlaceFromText({
      params: {
        input: `${query} Singapore`,
        inputtype: PlaceInputType.textQuery,
        fields: ['place_id', 'geometry'],
        key: API_KEY(),
      },
    })
    const candidate = res.data.candidates[0]
    if (!candidate?.place_id || !candidate.geometry?.location) return null
    return {
      placeId: candidate.place_id,
      location: {
        lat: candidate.geometry.location.lat,
        lng: candidate.geometry.location.lng,
      },
    }
  } catch {
    return null
  }
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  try {
    const client = getClient()
    const res = await client.placeDetails({
      params: {
        place_id: placeId,
        fields: [
          'place_id', 'name', 'formatted_address', 'formatted_phone_number',
          'website', 'opening_hours', 'photos', 'geometry',
          'rating', 'user_ratings_total', 'business_status',
        ] as any,
        key: API_KEY(),
      },
    })

    const p = res.data.result
    if (!p) return null

    const photoUrls = (p.photos ?? []).slice(0, 5).map((photo: any) =>
      `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${API_KEY()}`
    )

    return {
      placeId: p.place_id ?? placeId,
      name: p.name ?? '',
      address: p.formatted_address ?? '',
      phone: (p as any).formatted_phone_number,
      website: p.website,
      hours: (p as any).opening_hours?.weekday_text,
      location: p.geometry?.location
        ? { lat: p.geometry.location.lat, lng: p.geometry.location.lng }
        : undefined,
      photos: photoUrls,
      rating: p.rating,
      userRatingsTotal: (p as any).user_ratings_total,
      businessStatus: (p as any).business_status,
    }
  } catch {
    return null
  }
}
