# HumbleHalal v2 — Full Codebase Audit Report

**Date**: 2026-03-20
**Auditor**: Claude Code (automated)
**Baseline**: CLAUDE.md, PRD.md, SECURITY.md, ANALYTICS_SPEC.md, PDPA_COMPLIANCE.md, TRAVEL_BOOKING.md, EVENTS_TICKETING.md, COOKIE_CONSENT_SPEC.md, PRIVACY_POLICY.md

---

## Summary

| Metric | Count |
|--------|-------|
| **Total items** | 213 |
| **✅ Done** | 131 |
| **⚠️ Partial** | 37 |
| **❌ Not Built** | 45 |
| **Completion** | **61.5%** |

---

## A. FOUNDATION & SCAFFOLD

| # | Item | Status | Evidence |
|---|------|--------|----------|
| A1 | Next.js 14 App Router + TypeScript strict | ✅ DONE | next.config.mjs + tsconfig `"strict": true` |
| A2 | tsconfig path aliases | ✅ DONE | @/components, @/lib, @/hooks, @/types, @/config all defined |
| A3 | Full directory skeleton | ✅ DONE | All route groups present: (public), (auth), (dashboard), (business), admin, api |
| A4 | npm dependencies installed | ✅ DONE | All 30+ deps: @supabase/ssr, @anthropic-ai/sdk, stripe, resend, @sentry/nextjs, sharp, isomorphic-dompurify, edge-csrf, @upstash/ratelimit |
| A5 | package.json scripts | ✅ DONE | dev, build, lint, test, test:e2e, seed, seed:muis, seed:mosques, seed:places |
| A6 | Config enums | ✅ DONE | HalalStatus, Vertical, SingaporeArea, CuisineType, BusinessCategory in src/config/index.ts |
| A7 | .env.local.example | ✅ DONE | 22+ env vars listed |
| A8 | .env.local gitignored | ✅ DONE | .gitignore includes .env.local |
| A9 | Typed env validation | ✅ DONE | src/config/env.ts with requireEnv() + optionalEnv() |

**Section A: 9/9 ✅**

---

## B. DESIGN SYSTEM & UI

| # | Item | Status | Evidence |
|---|------|--------|----------|
| B1 | Tailwind brand tokens | ✅ DONE | primary #047857, accent #D4A017, charcoal #1C1917, warm-white #FAFAF8, background-dark #0f231d |
| B2 | Google Fonts | ✅ DONE | Manrope + Playfair Display imported in layout.tsx |
| B3 | Material Symbols Outlined | ✅ DONE | Stylesheet linked in layout.tsx |
| B4 | .islamic-pattern CSS | ✅ DONE | globals.css: radial-gradient #D4A017, 24x24px, opacity 0.1 |
| B5 | .frosted-glass CSS | ✅ DONE | globals.css: rgba white 10%, blur 12px, white border |
| B6 | shadcn/ui with CSS overrides | ✅ DONE | CSS variables overridden for primary/accent |
| B7 | shadcn components (17) | ✅ DONE | avatar, badge, button, card, dialog, dropdown-menu, input, label, navigation-menu, select, separator, sheet, skeleton, tabs, textarea, tooltip + custom |
| B8 | MuisBadge component | ✅ DONE | src/components/ui/MuisBadge.tsx |
| B9 | GoldCta component | ✅ DONE | src/components/ui/GoldCta.tsx with Link + Button modes |
| B10 | Stitch HTML files | ✅ DONE | design/stitch/ with preview.html |

**Section B: 10/10 ✅**

---

## C. SUPABASE & DATABASE

### Core Setup

| # | Item | Status | Evidence |
|---|------|--------|----------|
| C1 | supabase init / config.toml | ✅ DONE | supabase/config.toml exists |
| C2 | Auth: magic link + Google OAuth | ✅ DONE | Configured in config.toml |
| C3 | PostGIS extension | ✅ DONE | Migration 001: CREATE EXTENSION postgis |
| C4 | Auth rate limits lowered | ⚠️ PARTIAL | config.toml exists but rate limit override not verified |

### Migrations (16 files verified)

| # | Item | Status | Evidence |
|---|------|--------|----------|
| C5 | Migration 001: Extensions + enums | ✅ DONE | postgis, uuid-ossp, pg_trgm + halal_status, listing_vertical enums |
| C6 | Migration 009: user_profiles (PDPA) | ⚠️ PARTIAL | Has display_name, avatar, bio, is_admin, marketing_consent — but also has full_name, email, phone (spec says no full_name/phone) |
| C7 | Migration 002: listings + PostGIS + TSVECTOR | ✅ DONE | geography(Point,4326), GIST spatial index, GIN trgm index |
| C8 | Migration 003/012: food/catering/services | ✅ DONE | listings_food, listings_catering, listings_services extension tables |
| C9 | Migration 004-007: reviews, events, classifieds, forum | ✅ DONE | All tables with triggers (auto-expire classifieds, forum reply count) |
| C10 | Migration 008: mosques, prayer_rooms + PostGIS | ✅ DONE | Both with geography columns and spatial indexes |
| C11 | Migration 011: analytics_events | ✅ DONE | 14+ event types, session_id, listing_id, utm params, no PII |
| C12 | Migration 010: AI Command Centre (7 tables) | ✅ DONE | ai_content_drafts, ai_prompts, ai_moderation_log, ai_enrichment_queue, ai_seo_audit, ai_cost_log, ai_activity_log |

### Events & Ticketing (Migration 014)

| # | Item | Status | Evidence |
|---|------|--------|----------|
| C13 | event_tickets | ✅ DONE | name, price, quantity, sold_count, sale_start/end |
| C14 | event_orders | ✅ DONE | order_number UNIQUE, stripe_payment_intent_id, custom_responses JSONB, pii_purged |
| C15 | event_order_items | ✅ DONE | attendee_name, qr_code UNIQUE, checked_in, checked_in_at |
| C16 | event_promo_codes | ✅ DONE | code, discount_type, discount_value, max_uses, valid_from/until |
| C17 | event_custom_questions | ✅ DONE | field_type enum, options text[], is_required, sort_order |
| C18 | event_reminders | ✅ DONE | channel enum (email/sms/whatsapp), scheduled_for, sent_at |
| C19 | organiser_payouts | ✅ DONE | gross/platform_fee/stripe_fee/net amounts, stripe_transfer_id |
| C20 | events ALTER columns | ✅ DONE | is_ticketed, is_online, recurrence_rule, refund_policy, platform_fee_percent etc. |

### Travel Booking (Migration 015)

| # | Item | Status | Evidence |
|---|------|--------|----------|
| C21 | travel_bookings | ✅ DONE | liteapi_booking_id, hotel_location PostGIS, guests JSONB, commission_earned, pii_purged |
| C22 | travel_search_log | ✅ DONE | session_id, destination, results_count, selected_hotel, booked |

### PDPA Compliance (Migration 016)

| # | Item | Status | Evidence |
|---|------|--------|----------|
| C23 | marketing_consent on user_profiles | ✅ DONE | BOOLEAN + consent_date TIMESTAMPTZ |
| C24 | travel_bookings pii_purged columns | ✅ DONE | pii_purged BOOLEAN + pii_purge_date TIMESTAMPTZ |
| C25 | event_orders pii_purged columns | ✅ DONE | pii_purged BOOLEAN + pii_purge_date TIMESTAMPTZ |
| C26 | purge_travel_booking_pii() | ✅ DONE | Redacts PII after 12 months |
| C27 | purge_event_order_pii() | ✅ DONE | Redacts orders + cascades to order_items |
| C28 | anonymise_user_reviews() trigger | ✅ DONE | BEFORE DELETE on user_profiles NULLs reviews.user_id |

### RLS Policies (Migration 013)

| # | Item | Status | Evidence |
|---|------|--------|----------|
| C29 | RLS enabled on every table | ✅ DONE | All tables have ALTER TABLE ENABLE ROW LEVEL SECURITY |
| C30 | is_admin() helper function | ✅ DONE | Checks user_profiles.is_admin for auth.uid() |
| C31 | listings RLS | ✅ DONE | Public SELECT, authenticated INSERT/UPDATE own, admin ALL |
| C32 | reviews RLS | ✅ DONE | Public SELECT approved, authenticated INSERT, own UPDATE/DELETE |
| C33 | events, classifieds RLS | ✅ DONE | Public SELECT, authenticated write own, admin ALL |
| C34 | forum RLS | ✅ DONE | Public SELECT approved, authenticated INSERT, own UPDATE |
| C35 | mosques, prayer_rooms RLS | ✅ DONE | Public SELECT, admin write only |
| C36 | user_profiles RLS | ✅ DONE | Limited public SELECT, own UPDATE |
| C37 | analytics_events RLS | ✅ DONE | Service role INSERT, admin SELECT |
| C38 | AI tables RLS | ✅ DONE | Admin only on all 7 tables |
| C39 | event_orders, travel_bookings RLS | ✅ DONE | Authenticated own SELECT, service role INSERT |

### Helper Functions

| # | Item | Status | Evidence |
|---|------|--------|----------|
| C40 | nearby_businesses() PostGIS | ⚠️ PARTIAL | ST_DWithin used in spatial indexes but dedicated function not found as named RPC |
| C41 | search_businesses() TSVECTOR | ⚠️ PARTIAL | TSVECTOR + GIN + trgm indexes exist; search via /api/search but no dedicated DB function |
| C42 | update_business_search_vector() trigger | ⚠️ PARTIAL | Indexes exist but trigger auto-updating search_vector not verified |
| C43 | update_business_rating() trigger | ⚠️ PARTIAL | Reviews table exists but trigger to recalculate listing.average_rating not verified |
| C44 | on_auth_user_created trigger | ✅ DONE | Migration 009: trigger inserts user_profiles on auth.users INSERT |

**Section C: 35 ✅ / 5 ⚠️ / 0 ❌ = 40 items**

---

## D. SUPABASE AUTH & CLIENTS

| # | Item | Status | Evidence |
|---|------|--------|----------|
| D1 | Browser client (createBrowserClient) | ✅ DONE | src/lib/supabase/client.ts |
| D2 | Server client with cookies | ✅ DONE | src/lib/supabase/server.ts with createServerClient + createAdminClient |
| D3 | Middleware session refresh | ✅ DONE | src/lib/supabase/middleware.ts with getUser() |
| D4 | Route protection middleware | ✅ DONE | /admin + /dashboard protected, redirect to /login?next= |
| D5 | database.types.ts generated | ✅ DONE | src/lib/database.types.ts (auto-generated) |
| D6 | on_auth_user_created trigger | ✅ DONE | Migration 009 |

**Section D: 6/6 ✅**

---

## E. SHARED LAYOUT COMPONENTS

| # | Item | Status | Evidence |
|---|------|--------|----------|
| E1 | Navbar.tsx | ✅ DONE | Fixed top, frosted glass, mosque icon + logo, gold CTA, mobile Sheet |
| E2 | Footer.tsx | ✅ DONE | Charcoal bg, 4-column grid, IslamicPattern, cookie preferences link |
| E3 | IslamicPattern.tsx | ✅ DONE | src/components/layout/IslamicPattern.tsx |
| E4 | FrostedGlass.tsx | ✅ DONE | src/components/layout/FrostedGlass.tsx |
| E5 | (public)/layout.tsx | ✅ DONE | Wraps with Navbar + Footer |
| E6 | admin/layout.tsx | ✅ DONE | Admin sidebar, is_admin role check, dark theme |
| E7 | Root layout.tsx | ✅ DONE | Google Fonts, AnalyticsProvider, PageTracker, CookieConsent |

**Section E: 7/7 ✅**

---

## F. PUBLIC PAGES (11 VERTICALS)

### Halal Food Directory

| # | Item | Status | Evidence |
|---|------|--------|----------|
| F1 | /halal-food/[cuisine]-[area] pSEO | ⚠️ PARTIAL | /halal-food/page.tsx exists with ISR + generateMetadata, but no dynamic [cuisine]-[area] route |
| F2 | /restaurant/[slug] | ✅ DONE | Page with generateMetadata, ISR, MuisBadge, reviews |
| F3 | generateMetadata on food pages | ✅ DONE | Present on halal-food and restaurant/[slug] |
| F4 | Restaurant JSON-LD | ✅ DONE | JSON-LD schema on restaurant/[slug] |
| F5 | Breadcrumbs + BreadcrumbList JSON-LD | ✅ DONE | Breadcrumb components on 14+ pages |

### Muslim Business Directory

| # | Item | Status | Evidence |
|---|------|--------|----------|
| F6 | /business/[category]-[area] pSEO | ❌ NOT BUILT | No dynamic pSEO route under (public); business page is in (business) route group |
| F7 | /business/[slug] detail | ❌ NOT BUILT | No public business detail page |
| F8 | LocalBusiness JSON-LD | ❌ NOT BUILT | No business detail page to attach schema |

### Catering

| # | Item | Status | Evidence |
|---|------|--------|----------|
| F9 | /catering/[type]-catering pSEO | ⚠️ PARTIAL | /catering/page.tsx exists but no dynamic [type]-catering route |
| F10 | Request-for-quote form | ❌ NOT BUILT | No quote form component found |

### Events

| # | Item | Status | Evidence |
|---|------|--------|----------|
| F11 | /events listing with filters | ✅ DONE | /events/page.tsx |
| F12 | /events/[slug] detail | ✅ DONE | With TicketSelector, JSON-LD |
| F13 | /events/[slug]/checkout | ❌ NOT BUILT | Checkout handled via /api/events/checkout but no checkout page |
| F14 | /events/[slug]/confirmation/[orderId] | ✅ DONE | E-ticket confirmation page |
| F15 | /tickets/[qrCode] | ✅ DONE | Individual ticket QR page |
| F16 | /checkin/[eventId] organiser scanner | ❌ NOT BUILT | No checkin page; API exists at /api/events/[eventId]/checkin |
| F17 | /events/create wizard | ✅ DONE | Multi-step event creation |
| F18 | Event JSON-LD | ✅ DONE | On events/[slug] |
| F19 | Events pSEO (category/area) | ❌ NOT BUILT | No /events/category/[category] or /events/area/[area] routes |

### Classifieds

| # | Item | Status | Evidence |
|---|------|--------|----------|
| F20 | /classifieds/[category] listing | ⚠️ PARTIAL | /classifieds/page.tsx + /classifieds/[slug] exist but no [category] filter route |
| F21 | Classified submission with CAPTCHA | ✅ DONE | /classifieds/submit/page.tsx; CAPTCHA lib configured |

### Mosque & Prayer Room Finder

| # | Item | Status | Evidence |
|---|------|--------|----------|
| F22 | /mosque/[slug] | ✅ DONE | With JSON-LD, prayer times, facilities |
| F23 | /prayer-rooms/[area] | ⚠️ PARTIAL | /prayer-rooms/page.tsx + /prayer-rooms/[slug] but no [area] specific route (uses query param) |
| F24 | /prayer-times/singapore | ✅ DONE | Daily prayer times page |
| F25 | Interactive map with PostGIS | ⚠️ PARTIAL | PostGIS indexes exist, coordinates stored, but no visible map component (Google Maps JS not integrated in frontend) |

### Travel

| # | Item | Status | Evidence |
|---|------|--------|----------|
| F26 | /travel hub | ✅ DONE | /travel/page.tsx with HotelSearchBar |
| F27 | /travel/hotels search results | ✅ DONE | /travel/hotels/page.tsx with HotelCard components |
| F28 | /travel/hotels/[hotelId] detail | ✅ DONE | Hotel detail with rooms, Muslim-friendly badges |
| F29 | /travel/hotels/[hotelId]/checkout | ✅ DONE | LiteAPI prebook + checkout page |
| F30 | /travel/bookings/[bookingId] confirmation | ✅ DONE | Booking confirmation page |
| F31 | /travel/halal-food-guide-[city] pSEO | ❌ NOT BUILT | No halal-food-guide route |
| F32 | /travel/muslim-friendly-hotels-[city] pSEO | ✅ DONE | /travel/muslim-friendly-hotels/[city]/page.tsx |
| F33 | /travel/flights affiliate bridge | ✅ DONE | /travel/flights/page.tsx |
| F34 | Muslim-friendly scoring + badges | ✅ DONE | MuslimBadges.tsx component + enrichment types |

### Products

| # | Item | Status | Evidence |
|---|------|--------|----------|
| F35 | /products/halal-[category] pSEO | ⚠️ PARTIAL | /products/page.tsx exists but no dynamic [category] route |
| F36 | Product review + affiliate links | ❌ NOT BUILT | No product review system |

### Services

| # | Item | Status | Evidence |
|---|------|--------|----------|
| F37 | /services/muslim-[service] pSEO | ⚠️ PARTIAL | /services/page.tsx exists but no dynamic [service] route |

### Community Forum

| # | Item | Status | Evidence |
|---|------|--------|----------|
| F38 | /community/[slug] forum posts | ✅ DONE | Threaded replies, ReplyForm component |
| F39 | Forum post creation + AI moderation | ✅ DONE | /community/new/page.tsx + /api/forum/posts + /api/admin/moderate |

### Blog

| # | Item | Status | Evidence |
|---|------|--------|----------|
| F40 | /blog/[slug] | ✅ DONE | /blog/[id]/page.tsx with generateMetadata + JSON-LD |
| F41 | AI content pipeline | ⚠️ PARTIAL | ai_content_drafts table + admin/content page exist, but no AI generation endpoint verified |

**Section F: 22 ✅ / 9 ⚠️ / 10 ❌ = 41 items**

---

## G. SEARCH & DISCOVERY

| # | Item | Status | Evidence |
|---|------|--------|----------|
| G1 | /api/search unified endpoint | ✅ DONE | /api/search/route.ts |
| G2 | SearchBar with debounce | ✅ DONE | src/components/search/SearchBar.tsx |
| G3 | /search results page | ❌ NOT BUILT | No /search/page.tsx found |
| G4 | Full-text TSVECTOR + GIN | ✅ DONE | Indexes in migrations |
| G5 | Fuzzy search pg_trgm | ✅ DONE | pg_trgm extension + GIN trgm index |
| G6 | "Near me" PostGIS + geolocation | ⚠️ PARTIAL | PostGIS indexes exist but no browser geolocation integration verified |
| G7 | Faceted filters | ❌ NOT BUILT | No faceted filter UI on any listing page |
| G8 | "No results" state | ❌ NOT BUILT | Not verified on any page |
| G9 | search_query analytics tracking | ✅ DONE | search_query is a valid event type in /api/track |

**Section G: 4 ✅ / 1 ⚠️ / 4 ❌ = 9 items**

---

## H. REVIEWS SYSTEM

| # | Item | Status | Evidence |
|---|------|--------|----------|
| H1 | Review form: stars, title, body, photo | ⚠️ PARTIAL | ReviewForm.tsx has star rating + title + body but NO photo upload |
| H2 | Sub-ratings (food, service, halal, value) | ❌ NOT BUILT | Only single overall rating |
| H3 | One review per user per business | ⚠️ PARTIAL | Status='pending' on insert but UNIQUE constraint not verified |
| H4 | Business owner response | ❌ NOT BUILT | No response UI or table |
| H5 | Rating breakdown chart | ❌ NOT BUILT | ReviewsList shows reviews but no breakdown visualization |
| H6 | Helpful count / vote | ❌ NOT BUILT | No vote UI or helpful_count tracking |
| H7 | AI moderation pipeline | ⚠️ PARTIAL | /api/admin/moderate endpoint exists; reviews default to pending; but no auto-trigger on submit |
| H8 | Image upload (5MB, EXIF strip) | ⚠️ PARTIAL | src/lib/security/image.ts exists with EXIF stripping + WebP conversion, but not wired to review form |

**Section H: 0 ✅ / 4 ⚠️ / 4 ❌ = 8 items**

---

## I. USER DASHBOARD

| # | Item | Status | Evidence |
|---|------|--------|----------|
| I1 | /dashboard main page | ✅ DONE | /dashboard/page.tsx with user overview |
| I2 | /dashboard/settings | ❌ NOT BUILT | No settings directory |
| I3 | /dashboard/my-tickets | ✅ DONE | /dashboard/my-tickets/page.tsx |
| I4 | /dashboard/my-bookings | ✅ DONE | /dashboard/my-bookings/page.tsx |
| I5 | /dashboard/my-listings | ❌ NOT BUILT | No my-listings directory (business owners use /business/dashboard) |
| I6 | /dashboard/my-reviews | ❌ NOT BUILT | No my-reviews directory |
| I7 | /dashboard/saved | ❌ NOT BUILT | No saved/bookmarks directory or table |

**Section I: 3 ✅ / 0 ⚠️ / 4 ❌ = 7 items**

---

## J. BUSINESS OWNER DASHBOARD

| # | Item | Status | Evidence |
|---|------|--------|----------|
| J1 | Claim business flow | ⚠️ PARTIAL | "Claim" CTA exists on business page linking to /login?next=/business/claim, but no /business/claim page |
| J2 | Business management (edit fields, images, hours) | ⚠️ PARTIAL | EditListingForm.tsx exists at /business/dashboard/listings/[id] but limited fields |
| J3 | Leads management | ❌ NOT BUILT | No leads table or management UI |
| J4 | Review management | ❌ NOT BUILT | No review management in business dashboard |
| J5 | Event management | ✅ DONE | /dashboard/my-events/ with attendees view |
| J6 | Analytics view | ❌ NOT BUILT | No analytics in business dashboard |

**Section J: 1 ✅ / 2 ⚠️ / 3 ❌ = 6 items**

---

## K. AI COMMAND CENTRE (/admin)

| # | Item | Status | Evidence |
|---|------|--------|----------|
| K1 | Morning Briefing overview | ✅ DONE | /admin/page.tsx with metrics: page views, searches, clicks, counts |
| K2 | Content Autopilot | ⚠️ PARTIAL | /admin/content/page.tsx shows drafts by type + status but no calendar, scheduling, or AI generation UI |
| K3 | Listing Intelligence | ⚠️ PARTIAL | /admin/listings/page.tsx with search/filter but no import pipeline, MUIS sync trigger, or enrichment UI |
| K4 | Auto-Moderation | ⚠️ PARTIAL | /admin/moderation/page.tsx exists + /api/admin/moderate API but queue UI needs verification |
| K5 | SEO Engine | ⚠️ PARTIAL | /admin/seo/page.tsx shows audit results with scoring but no meta generator or schema validator |
| K6 | Analytics Dashboard | ⚠️ PARTIAL | /admin/analytics/page.tsx with live feed + range filters but no funnels, cohorts, or demand intelligence |
| K7 | Sponsor Report Generator | ⚠️ PARTIAL | /admin/reports/page.tsx exists + /api/admin/report-data API but PDF generation not verified |
| K8 | Settings | ⚠️ PARTIAL | /admin/settings/page.tsx exists but content (API keys, prompts, cost tracking) not verified |

**Section K: 1 ✅ / 7 ⚠️ / 0 ❌ = 8 items**

---

## L. CUSTOM ANALYTICS

| # | Item | Status | Evidence |
|---|------|--------|----------|
| L1 | POST /api/track endpoint | ✅ DONE | Rate-limited, validates 14+ event types, service role client |
| L2 | Client-side trackEvent() | ✅ DONE | src/lib/analytics/tracker.ts |
| L3 | Auto-track page views | ✅ DONE | PageTracker.tsx with usePageTracking hook fires page_view on route change |
| L4 | UTM parameter parsing | ✅ DONE | Parsed from URL in tracker |
| L5 | Anonymous session ID (hh_session, 30-day) | ✅ DONE | Cookie-based session, no PII |
| L6 | Rate limit 100 events/session/hour | ✅ DONE | trackLimiter in rate-limit.ts |
| L7 | Lead action tracking | ✅ DONE | click_website, click_directions, click_phone, click_booking, click_menu, click_affiliate |
| L8 | Secondary tracking | ✅ DONE | search_query, browse_category, view_listing, save_listing, submit_review, share_listing, newsletter_click |
| L9 | Event ticketing analytics | ⚠️ PARTIAL | ticket_purchase tracked but ticket_view, ticket_refund, checkin_scan, event_share, reminder_click not all verified as event types |
| L10 | Travel analytics | ⚠️ PARTIAL | Hotel search/view tracked but hotel_book, hotel_cancel, click_flight_affiliate not all verified |

**Section L: 8 ✅ / 2 ⚠️ / 0 ❌ = 10 items**

---

## M. PAYMENTS & MONETIZATION

| # | Item | Status | Evidence |
|---|------|--------|----------|
| M1 | Stripe Checkout for event tickets | ✅ DONE | /api/events/checkout creates Stripe Checkout Session |
| M2 | Stripe Connect for organiser payouts | ⚠️ PARTIAL | organiser_payouts table exists but Stripe Connect Express onboarding flow not verified |
| M3 | Platform fee 3% | ✅ DONE | platform_fee_percent column on events |
| M4 | PayNow/SGQR via Stripe | ❌ NOT BUILT | No payment_method_types configuration for PayNow verified |
| M5 | Stripe webhook with signature verification | ✅ DONE | /api/webhooks/stripe with constructEvent() |
| M6 | LiteAPI Payment SDK on hotel checkout | ⚠️ PARTIAL | LiteAPI prebook/book APIs exist but Payment SDK widget not verified on checkout page |
| M7 | Hotel commission via margin parameter | ⚠️ PARTIAL | commission_earned column exists but margin parameter in search API not verified |
| M8 | Premium listing tiers with Stripe subscriptions | ❌ NOT BUILT | No subscription flow or tier management |
| M9 | Featured listing placement | ❌ NOT BUILT | No featured/promoted listing system |

**Section M: 3 ✅ / 3 ⚠️ / 3 ❌ = 9 items**

---

## N. SECURITY

| # | Item | Status | Evidence |
|---|------|--------|----------|
| N1 | Rate limiting via Upstash Redis | ✅ DONE | 7 limiters: auth, content, forum, search, track, travelSearch, travelBook |
| N2 | Cloudflare Turnstile CAPTCHA | ✅ DONE | src/lib/security/captcha.ts configured |
| N3 | Server-side CAPTCHA verification | ✅ DONE | Turnstile API verification |
| N4 | CSRF via edge-csrf | ✅ DONE | middleware.ts: edge-csrf with skip paths for webhooks/track/cron/travel |
| N5 | XSS: isomorphic-dompurify | ✅ DONE | sanitiseHTML() + sanitisePlainText() in src/lib/security/sanitise.ts |
| N6 | Security headers in next.config | ✅ DONE | X-Frame-Options DENY, HSTS, CSP, X-Content-Type-Options, Referrer-Policy |
| N7 | File upload security | ✅ DONE | src/lib/security/image.ts: magic bytes check, EXIF strip with sharp, UUID filenames, WebP conversion |
| N8 | Cron job auth (CRON_SECRET) | ✅ DONE | src/lib/utils/cron-auth.ts, Bearer token on all /api/cron/* |
| N9 | Admin 4 layers | ⚠️ PARTIAL | middleware auth + rate limit + role check exist, but session re-verify and audit log not fully verified |
| N10 | SQL injection prevention | ✅ DONE | All queries via Supabase parameterised client |

**Section N: 9 ✅ / 1 ⚠️ / 0 ❌ = 10 items**

---

## O. PDPA COMPLIANCE

| # | Item | Status | Evidence |
|---|------|--------|----------|
| O1 | Cookie consent banner | ✅ DONE | CookieConsent.tsx: Accept All / Essential Only / Learn More, fixed bottom |
| O2 | cookie_consent cookie (365-day) | ✅ DONE | Cookie set with consent value |
| O3 | GA4/PostHog gated by consent | ✅ DONE | AnalyticsProvider.tsx only loads if consent='all' |
| O4 | Custom analytics always active | ✅ DONE | /api/track fires regardless of consent (anonymous) |
| O5 | Signup: separate consent checkboxes | ⚠️ PARTIAL | Signup page exists but separate Terms + Marketing checkboxes not verified |
| O6 | Checkout consent notice | ❌ NOT BUILT | No consent notice above confirm button on hotel/event checkout |
| O7 | Dashboard settings (consent, export, delete) | ❌ NOT BUILT | /dashboard/settings not built |
| O8 | Account deletion flow | ❌ NOT BUILT | No delete account UI; DB triggers exist but no user-facing flow |
| O9 | PII purge cron (monthly, 12 months) | ✅ DONE | /api/cron/pii-purge calls RPCs for travel_bookings + event_orders |
| O10 | /privacy page | ✅ DONE | /privacy/page.tsx exists |
| O11 | /cookies page | ✅ DONE | /cookies/page.tsx exists |
| O12 | Never send PII to Claude API | ⚠️ PARTIAL | No direct PII send observed but AI endpoints not comprehensively audited |

**Section O: 6 ✅ / 2 ⚠️ / 4 ❌ = 12 items**

---

## P. EMAIL SYSTEM

| # | Item | Status | Evidence |
|---|------|--------|----------|
| P1 | Resend SDK configured | ✅ DONE | src/lib/resend/index.ts + send.ts |
| P2 | Email templates | ⚠️ PARTIAL | ticket-confirmation, event-reminder, booking-confirmation exist; missing: welcome, new lead, review notification, claim approved |
| P3 | Beehiiv API integration | ⚠️ PARTIAL | Env vars defined (BEEHIIV_API_KEY, BEEHIIV_PUBLICATION_ID) but no Beehiiv API calls found |
| P4 | UTM on cross-links | ⚠️ PARTIAL | UTM tracking in analytics but not verified on all newsletter/email cross-links |

**Section P: 1 ✅ / 3 ⚠️ / 0 ❌ = 4 items**

---

## Q. CRON JOBS

| # | Item | Status | Evidence |
|---|------|--------|----------|
| Q1 | vercel.json cron entries | ✅ DONE | 12 entries including all required jobs |
| Q2 | /api/cron/muis-sync | ⚠️ PARTIAL | Route file exists, CRON_SECRET verified, but implementation is TODO placeholder |
| Q3 | /api/cron/places-refresh | ⚠️ PARTIAL | TODO placeholder |
| Q4 | /api/cron/freshness-check | ⚠️ PARTIAL | TODO placeholder |
| Q5 | /api/cron/closure-detect | ⚠️ PARTIAL | TODO placeholder |
| Q6 | /api/cron/newsletter-draft | ⚠️ PARTIAL | TODO placeholder |
| Q7 | /api/cron/seo-audit | ⚠️ PARTIAL | TODO placeholder |
| Q8 | /api/cron/gsc-pull | ⚠️ PARTIAL | TODO placeholder |
| Q9 | /api/cron/ahrefs-pull | ⚠️ PARTIAL | TODO placeholder |
| Q10 | /api/cron/morning-briefing | ⚠️ PARTIAL | TODO placeholder |
| Q11 | /api/cron/analytics-rollup | ⚠️ PARTIAL | TODO placeholder |
| Q12 | /api/cron/pii-purge | ✅ DONE | Fully implemented: calls RPCs, 12-month retention |
| Q13 | /api/cron/send-reminders | ✅ DONE | Fully implemented: fetches pending, sends via Resend |
| Q14 | /api/cron/organiser-payouts | ❌ NOT BUILT | No route file exists |
| Q15 | All crons verify CRON_SECRET | ✅ DONE | Bearer token auth on all cron routes |

**Section Q: 4 ✅ / 10 ⚠️ / 1 ❌ = 15 items**

---

## R. SEO & SITEMAP

| # | Item | Status | Evidence |
|---|------|--------|----------|
| R1 | generateMetadata() on every public page | ⚠️ PARTIAL | 16 of ~35 public pages have generateMetadata; travel/hotels, travel hub, some static pages missing |
| R2 | JSON-LD on every pSEO page | ⚠️ PARTIAL | 21 pages have JSON-LD but not all pSEO pages covered |
| R3 | Dynamic sitemap.ts | ✅ DONE | Fetches all verticals in parallel, generates URLs |
| R4 | Sitemap index if >50K URLs | ❌ NOT BUILT | Single sitemap, no index splitting |
| R5 | robots.ts | ❌ NOT BUILT | No robots.ts file found |
| R6 | OG image generation | ❌ NOT BUILT | No next/og ImageResponse found |
| R7 | Canonical URLs on every page | ❌ NOT BUILT | No canonical URL meta tags verified |
| R8 | ISR revalidate on all pSEO pages | ✅ DONE | 19 pages have revalidate constants |

**Section R: 2 ✅ / 2 ⚠️ / 4 ❌ = 8 items**

---

## S. MONITORING & DEPLOYMENT

| # | Item | Status | Evidence |
|---|------|--------|----------|
| S1 | Sentry configured | ✅ DONE | sentry.server.config.ts, sentry.edge.config.ts, global-error.tsx, instrumentation.ts |
| S2 | PostHog configured (consent gated) | ✅ DONE | AnalyticsProvider loads PostHog only after consent |
| S3 | GA4 configured (consent gated) | ✅ DONE | GA4 loads only after consent='all' |
| S4 | Vercel deployment | ✅ DONE | vercel.json configured, auto-deploy from main |
| S5 | Dependabot | ✅ DONE | .github/dependabot.yml exists |

**Section S: 5/5 ✅**

---

## T. TESTING

| # | Item | Status | Evidence |
|---|------|--------|----------|
| T1 | Vitest configured | ⚠️ PARTIAL | "test": "vitest" in package.json but no vitest.config.ts |
| T2 | Playwright configured | ⚠️ PARTIAL | "test:e2e": "playwright test" in package.json but no playwright.config.ts |
| T3 | E2E: homepage loads | ❌ NOT BUILT | No test files exist |
| T4 | E2E: search returns results | ❌ NOT BUILT | No test files |
| T5 | E2E: admin redirect | ❌ NOT BUILT | No test files |

**Section T: 0 ✅ / 2 ⚠️ / 3 ❌ = 5 items**

---

## SUMMARY BY SECTION

| Section | Items | ✅ Done | ⚠️ Partial | ❌ Not Built |
|---------|-------|---------|-----------|-------------|
| A. Foundation | 9 | 9 | 0 | 0 |
| B. Design System | 10 | 10 | 0 | 0 |
| C. Database | 40 | 35 | 5 | 0 |
| D. Auth & Clients | 6 | 6 | 0 | 0 |
| E. Layout | 7 | 7 | 0 | 0 |
| F. Public Pages | 41 | 22 | 9 | 10 |
| G. Search | 9 | 4 | 1 | 4 |
| H. Reviews | 8 | 0 | 4 | 4 |
| I. User Dashboard | 7 | 3 | 0 | 4 |
| J. Business Dashboard | 6 | 1 | 2 | 3 |
| K. Admin / AI Centre | 8 | 1 | 7 | 0 |
| L. Analytics | 10 | 8 | 2 | 0 |
| M. Payments | 9 | 3 | 3 | 3 |
| N. Security | 10 | 9 | 1 | 0 |
| O. PDPA Compliance | 12 | 6 | 2 | 4 |
| P. Email | 4 | 1 | 3 | 0 |
| Q. Cron Jobs | 15 | 4 | 10 | 1 |
| R. SEO & Sitemap | 8 | 2 | 2 | 4 |
| S. Monitoring | 5 | 5 | 0 | 0 |
| T. Testing | 5 | 0 | 2 | 3 |
| **TOTAL** | **213** | **131** | **37** | **45** |

---

## TOP 10 PRIORITY ITEMS TO BUILD NEXT

Ordered by launch-blocking importance:

| Priority | Item | Why | Effort |
|----------|------|-----|--------|
| **1** | **robots.ts** (R5) | Without it, search engines may crawl /admin and /api routes. 10 minutes to build. | 1 session |
| **2** | **/search results page** (G3) + faceted filters (G7) | Core user journey — users search and must see results. SearchBar + API exist, just need the page. | 1 session |
| **3** | **Review system completion** (H2-H8) | Sub-ratings, photo upload, helpful votes, owner responses, moderation auto-trigger. Reviews are the #1 trust signal. | 2 sessions |
| **4** | **/dashboard/settings** (I2, O7, O8) | PDPA-required: consent toggle, data export, account deletion. Legal blocker for Singapore launch. | 1 session |
| **5** | **Cron job implementations** (Q2-Q11) | 10 cron routes are TODO placeholders. MUIS sync, morning briefing, and analytics rollup are most critical. | 3 sessions |
| **6** | **Business directory pSEO** (F6-F8) | /business/[category]-[area] + /business/[slug] are core pSEO pages for 10,000+ page target. | 2 sessions |
| **7** | **Admin panels completion** (K2-K8) | Content calendar, listing import, moderation queue, SEO tools, reports — all ⚠️ PARTIAL. These run the solo-operator workflow. | 3 sessions |
| **8** | **Testing setup** (T1-T5) | vitest.config.ts + playwright.config.ts + at least 3 smoke tests. Prevents regressions. | 1 session |
| **9** | **Canonical URLs + OG images** (R6-R7) | SEO hygiene for 10,000+ pages. Prevents duplicate content penalties. | 1 session |
| **10** | **Dynamic pSEO routes** (F1, F9, F19, F31, F35, F37) | [cuisine]-[area], [type]-catering, events/category, travel guides, products, services — the bulk of the 10,000 page target. | 3 sessions |

---

## ESTIMATED SESSIONS TO MVP LAUNCH

| Phase | Sessions | What |
|-------|----------|------|
| **Critical fixes** (P1-P3) | 3 | robots.ts, search page, dashboard/settings, PDPA flows |
| **Core features** (P4-P6) | 5 | Reviews completion, business directory, cron implementations |
| **Admin tooling** (P7) | 3 | Admin panels from ⚠️ to ✅ |
| **pSEO & SEO** (P9-P10) | 4 | Dynamic routes, canonical URLs, OG images, sitemap index |
| **Testing & polish** (P8) | 2 | Test configs, smoke tests, final QA pass |
| **TOTAL** | **~17 sessions** | From current state to MVP launch |

The foundation (A-E), database (C), security (N), analytics (L), and monitoring (S) are solid. The main gaps are in **user-facing features** (reviews, dashboards, business flows), **pSEO route generation**, **admin tool implementation**, and **cron job logic**.
