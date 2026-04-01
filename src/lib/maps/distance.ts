// Client-safe haversine distance — no API call required
const EARTH_RADIUS_KM = 6371

export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Format distance as human-readable string: "0.3 km" or "1.2 km" */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

/** Singapore bounding box — fast rejection check */
const SG_BOUNDS = { latMin: 1.15, latMax: 1.48, lngMin: 103.6, lngMax: 104.0 }

export function isInSingapore(lat: number, lng: number): boolean {
  return (
    lat >= SG_BOUNDS.latMin &&
    lat <= SG_BOUNDS.latMax &&
    lng >= SG_BOUNDS.lngMin &&
    lng <= SG_BOUNDS.lngMax
  )
}
