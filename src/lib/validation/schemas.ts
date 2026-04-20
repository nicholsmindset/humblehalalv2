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

  // Fix 3: ISO date format validation (YYYY-MM-DD)
  const dateRe = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRe.test(checkin) || !dateRe.test(checkout)) {
    return { success: false, error: 'checkin and checkout must be YYYY-MM-DD' }
  }

  // Fix 2: guests structural validation
  const guests = body.guests
  if (!guests) {
    return { success: false, error: 'guests is required' }
  }
  if (typeof guests !== 'number' && !Array.isArray(guests)) {
    return { success: false, error: 'guests must be a number or array' }
  }
  if (Array.isArray(guests) && guests.length === 0) {
    return { success: false, error: 'guests array must not be empty' }
  }

  // Fix 1: placeId length + character constraint
  const placeId = body.placeId
  if (placeId !== undefined) {
    if (typeof placeId !== 'string' || placeId.length > 300 || !/^[\w-]+$/.test(placeId)) {
      return { success: false, error: 'placeId is invalid' }
    }
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
