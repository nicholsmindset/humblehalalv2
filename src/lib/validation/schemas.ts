/**
 * Lightweight validation schemas (no external dependency).
 * Each schema exposes a `safeParse` method that returns
 * `{ success: true, data: T }` or `{ success: false, error: string }`.
 */

export interface TravelSearchInput {
  destination: string
  placeId?: string
  checkin: string
  checkout: string
  guests: unknown
  currency?: string
}

function safeParseTravelSearch(raw: unknown):
  | { success: true; data: TravelSearchInput }
  | { success: false; error: string } {
  if (!raw || typeof raw !== 'object') {
    return { success: false, error: 'Invalid request body' }
  }

  const body = raw as Record<string, unknown>

  const destination = body.destination
  if (typeof destination !== 'string' || destination.trim().length < 2 || destination.trim().length > 100) {
    return { success: false, error: 'destination must be 2–100 characters' }
  }

  const checkin = body.checkin
  if (typeof checkin !== 'string' || !checkin) {
    return { success: false, error: 'checkin is required' }
  }

  const checkout = body.checkout
  if (typeof checkout !== 'string' || !checkout) {
    return { success: false, error: 'checkout is required' }
  }

  if (!body.guests) {
    return { success: false, error: 'guests is required' }
  }

  // placeId is optional — must be a string if present
  const placeId = body.placeId
  if (placeId !== undefined && typeof placeId !== 'string') {
    return { success: false, error: 'placeId must be a string' }
  }

  const currency = body.currency
  if (currency !== undefined && typeof currency !== 'string') {
    return { success: false, error: 'currency must be a string' }
  }

  return {
    success: true,
    data: {
      destination: destination.trim(),
      placeId: typeof placeId === 'string' ? placeId : undefined,
      checkin,
      checkout,
      guests: body.guests,
      currency: typeof currency === 'string' ? currency : undefined,
    },
  }
}

export const travelSearchSchema = {
  safeParse: safeParseTravelSearch,
}
