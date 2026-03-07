'use client'

// ── Types ──────────────────────────────────────────────────────

export type EventType =
  | 'click_website' | 'click_directions' | 'click_phone'
  | 'click_booking' | 'click_menu' | 'click_affiliate'
  | 'search_query' | 'browse_category' | 'view_listing'
  | 'save_listing' | 'submit_review' | 'share_listing'
  | 'newsletter_click' | 'set_notification' | 'page_view'

export interface TrackEventPayload {
  event_type: EventType
  listing_id?: string
  listing_name?: string
  listing_category?: string
  listing_area?: string
  brand_name?: string
  search_term?: string
  source_channel?: string
}

// ── Session management ─────────────────────────────────────────

const SESSION_KEY = 'hh_sid'
const SESSION_TTL = 30 * 60 * 1000 // 30 minutes

function generateId(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 16)
}

export function getSessionId(): string {
  if (typeof window === 'undefined') return ''

  try {
    const stored = sessionStorage.getItem(SESSION_KEY)
    if (stored) {
      const { id, expires } = JSON.parse(stored)
      if (Date.now() < expires) return id
    }
  } catch {
    // Ignore storage errors
  }

  const id = generateId()
  try {
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ id, expires: Date.now() + SESSION_TTL })
    )
  } catch {
    // Ignore storage errors
  }
  return id
}

// ── UTM parsing ────────────────────────────────────────────────

interface UtmParams {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
}

export function parseUtmParams(url?: string): UtmParams {
  if (typeof window === 'undefined') return {}
  try {
    const u = new URL(url ?? window.location.href)
    const result: UtmParams = {}
    const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'] as const
    keys.forEach((k) => {
      const v = u.searchParams.get(k)
      if (v) result[k] = v
    })
    return result
  } catch {
    return {}
  }
}

// ── Device detection ───────────────────────────────────────────

function getDeviceType(): 'mobile' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop'
  return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
}

// ── Core trackEvent function ───────────────────────────────────

export async function trackEvent(payload: TrackEventPayload): Promise<void> {
  if (typeof window === 'undefined') return

  const session_id = getSessionId()
  if (!session_id) return

  const utms = parseUtmParams()

  const body = {
    ...payload,
    session_id,
    page_url: window.location.pathname + window.location.search,
    referrer: document.referrer || undefined,
    device_type: getDeviceType(),
    ...utms,
  }

  try {
    await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      // Use keepalive so the request survives navigation
      keepalive: true,
    })
  } catch {
    // Silently fail — analytics must never break the UI
  }
}

// ── Convenience helpers ────────────────────────────────────────

export const track = {
  pageView: (extra?: Partial<TrackEventPayload>) =>
    trackEvent({ event_type: 'page_view', ...extra }),

  clickWebsite: (listing: Pick<TrackEventPayload, 'listing_id' | 'listing_name' | 'listing_category' | 'listing_area' | 'brand_name'>) =>
    trackEvent({ event_type: 'click_website', ...listing }),

  clickDirections: (listing: Pick<TrackEventPayload, 'listing_id' | 'listing_name' | 'listing_area'>) =>
    trackEvent({ event_type: 'click_directions', ...listing }),

  clickPhone: (listing: Pick<TrackEventPayload, 'listing_id' | 'listing_name' | 'listing_area'>) =>
    trackEvent({ event_type: 'click_phone', ...listing }),

  clickBooking: (listing: Pick<TrackEventPayload, 'listing_id' | 'listing_name'>) =>
    trackEvent({ event_type: 'click_booking', ...listing }),

  clickMenu: (listing: Pick<TrackEventPayload, 'listing_id' | 'listing_name'>) =>
    trackEvent({ event_type: 'click_menu', ...listing }),

  clickAffiliate: (extra?: Partial<TrackEventPayload>) =>
    trackEvent({ event_type: 'click_affiliate', ...extra }),

  searchQuery: (search_term: string) =>
    trackEvent({ event_type: 'search_query', search_term }),

  browseCategory: (listing_category: string, listing_area?: string) =>
    trackEvent({ event_type: 'browse_category', listing_category, listing_area }),

  viewListing: (listing: Pick<TrackEventPayload, 'listing_id' | 'listing_name' | 'listing_category' | 'listing_area'>) =>
    trackEvent({ event_type: 'view_listing', ...listing }),

  saveListing: (listing: Pick<TrackEventPayload, 'listing_id' | 'listing_name'>) =>
    trackEvent({ event_type: 'save_listing', ...listing }),

  submitReview: (listing: Pick<TrackEventPayload, 'listing_id' | 'listing_name'>) =>
    trackEvent({ event_type: 'submit_review', ...listing }),

  shareListing: (listing: Pick<TrackEventPayload, 'listing_id' | 'listing_name'>) =>
    trackEvent({ event_type: 'share_listing', ...listing }),

  newsletterClick: (source_channel?: string) =>
    trackEvent({ event_type: 'newsletter_click', source_channel }),

  setNotification: (listing: Pick<TrackEventPayload, 'listing_id' | 'listing_name'>) =>
    trackEvent({ event_type: 'set_notification', ...listing }),
}
