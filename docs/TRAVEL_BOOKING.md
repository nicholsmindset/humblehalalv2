# HumbleHalal Travel Booking — LiteAPI Integration Spec

> **File:** `docs/TRAVEL_BOOKING.md`
> **Status:** Planning
> **Date:** 7 March 2026
> **Fits into:** `/travel` vertical + `/admin/travel` in AI Command Centre

---

## 1. What This Adds

A **full hotel search and booking engine** embedded into HumbleHalal, powered by LiteAPI (2M+ hotels worldwide). Users can search, compare, and book Muslim-friendly accommodation directly on the platform — no redirect to Booking.com or Agoda.

The halal twist: every search result is enriched with proximity to mosques, halal food availability, prayer room info, and Muslim-friendly facility filters. This is the missing piece that turns HumbleHalal from a "directory with travel guides" into a **full halal travel booking platform**.

### Important: Hotels vs Flights

**LiteAPI = Hotels only.** It does not offer flight search or booking.

**Recommended flight strategy (phased):**

| Phase | Approach | Effort |
|-------|----------|--------|
| **MVP (now)** | Hotels only via LiteAPI. Link out to Skyscanner/Google Flights for flights with affiliate tracking | Zero dev for flights |
| **Phase 2** | Add Duffel API (duffel.com) for real flight search + booking. Modern REST API, commission-based, 300+ airlines. SDK: `npm install @duffel/api` | Medium dev |
| **Phase 3** | Full hotel + flight bundling with package pricing | High dev |

This spec covers **Phase 1 (hotels via LiteAPI)** and the affiliate flight bridge.

---

## 2. Why LiteAPI is the Right Choice

| Factor | LiteAPI | Booking.com API | Amadeus |
|--------|---------|----------------|---------|
| **Access** | Free signup, sandbox key instant | Requires affiliate approval (weeks/months) | Complex onboarding, expensive |
| **Hotels** | 2M+ properties worldwide | 28M+ (largest) | 700K+ |
| **Revenue** | You set your own margin/commission | Fixed affiliate commission | Complex pricing |
| **Payment** | Their SDK handles payments (you earn commission) OR you're merchant of record | Redirect to Booking.com | You handle everything |
| **No-code option** | Whitelabel booking site included free | No | No |
| **AI features** | Semantic search, image-based room search | No | Limited |
| **Node.js SDK** | `liteapi-node-sdk` — clean, well-documented | Basic | Heavy, complex |
| **Effort to integrate** | Days | Weeks (approval alone) | Weeks-months |

### Revenue Model

LiteAPI uses a **commission model** you control:
- You set a `margin` parameter on each rate search (e.g., `margin: 15`)
- The hotel room base rate is $100, your margin makes the selling price $115
- You earn $15 commission per booking
- LiteAPI handles guest payments via their Payment SDK
- **Weekly payouts** every Monday to your connected account
- Confirmed bookings (after guest check-in) become available for payout

**No booking fees, no hidden costs.** Core API endpoints are free. You only pay for usage-based API calls (search rates, static data).

---

## 3. Booking Flow (How It Works)

```
User Flow:
━━━━━━━━━━

1. SEARCH
   User enters: destination, dates, guests, rooms
   → Server calls LiteAPI POST /hotels/rates
   → Returns hotel list with real-time pricing
   → HumbleHalal enriches results with:
     • Distance to nearest mosque (PostGIS)
     • Halal food count nearby (our food directory)
     • Muslim-friendly badges (prayer room, halal breakfast, etc.)

2. HOTEL DETAIL
   User clicks hotel card
   → Server calls LiteAPI GET /data/hotel?hotelId=xxx
   → Returns: photos, description, facilities, rooms, reviews, policies
   → HumbleHalal adds:
     • "Halal Nearby" section (3 closest halal restaurants from our DB)
     • "Prayer Rooms" section (nearest mosques/prayer rooms)
     • AI-generated "Muslim Traveller Tips" for this hotel/area

3. SELECT ROOM
   User picks room + rate
   → Show cancellation policy, board type, price breakdown
   → "Book Now" button

4. PREBOOK (checkout session)
   → Server calls LiteAPI POST /rates/prebook with offerId + usePaymentSdk: true
   → Returns: prebookId, transactionId, secretKey, updated price/policy
   → Store prebookId + transactionId in our DB (travel_bookings table)

5. PAYMENT
   → Load LiteAPI Payment SDK on checkout page
   → SDK renders secure payment form (credit card, wallets)
   → User pays → SDK processes payment
   → On success: redirects to our confirmation page with transactionId

6. BOOK (confirm)
   → Server calls LiteAPI POST /rates/book with:
     prebookId, holder info (name, email), payment: { method: "TRANSACTION_ID", transactionId }
   → Returns: bookingId, hotelConfirmationCode, status
   → Save to travel_bookings table
   → Send confirmation email via Resend (booking details, hotel info, nearby halal food)
   → Log to analytics_events (event_type: 'hotel_booking', amount, destination)

7. POST-BOOKING
   → User can view booking in /dashboard/my-bookings
   → Cancel via LiteAPI PUT /bookings/{bookingId}
   → Link to our travel guide for that destination
   → Suggest halal food and mosques near the hotel
```

---

## 4. Muslim-Friendly Enrichment Layer

This is what makes HumbleHalal's hotel booking unique — no other OTA does this.

### 4.1 Automatic Enrichment on Every Search Result

For each hotel returned by LiteAPI, we run a server-side enrichment:

| Enrichment | Source | How |
|-----------|--------|-----|
| **Nearest mosque** | Our `mosques` table + PostGIS | `ST_Distance(hotel.location, mosque.location)` — show name + distance |
| **Halal food nearby** | Our `listings` (food vertical) + PostGIS | Count of halal restaurants within 1km radius |
| **Prayer room in hotel** | LiteAPI `hotelFacilities` array | Scan for "prayer room", "mosque", "halal", "Muslim" in facilities |
| **Halal breakfast** | LiteAPI `boardCode` + facilities | Check for "halal breakfast", "halal food" in facilities/remarks |
| **Muslim-friendly score** | Calculated | 1–5 score based on: mosque proximity, halal food density, prayer room, halal breakfast, no-alcohol options |

### 4.2 Muslim-Friendly Badges

Display on hotel cards:

| Badge | Criteria |
|-------|---------|
| 🕌 **Mosque Nearby** | Mosque within 500m |
| 🍽 **Halal Food Area** | 5+ halal restaurants within 1km |
| 🙏 **Prayer Room** | Hotel has prayer room facility |
| ☪️ **Halal Breakfast** | Hotel offers halal breakfast option |
| ⭐ **Muslim-Friendly** | Score ≥ 4/5 on composite score |

### 4.3 AI-Powered "Muslim Travel Tips"

For each destination, the AI Command Centre auto-generates:
- "Halal Food Guide: [City]" — linked to our travel guide vertical
- "Where to Pray in [City]" — nearest mosques and prayer rooms
- "Muslim Traveller Tips for [City]" — local customs, dress code, halal certification info
- Generated once per city, cached, updated monthly

---

## 5. Database Schema

### New Table: `travel_bookings`

```sql
CREATE TABLE travel_bookings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES auth.users,
  liteapi_booking_id VARCHAR UNIQUE,
  liteapi_prebook_id VARCHAR,
  hotel_confirmation_code VARCHAR,
  hotel_id          VARCHAR NOT NULL,
  hotel_name        VARCHAR NOT NULL,
  hotel_city        VARCHAR,
  hotel_country     VARCHAR,
  hotel_location    geography(Point, 4326),
  check_in          DATE NOT NULL,
  check_out         DATE NOT NULL,
  guests            JSONB NOT NULL,     -- [{adults: 2, children: 1, childAges: [5]}]
  rooms             JSONB,              -- room details from booking response
  total_amount      DECIMAL NOT NULL,
  currency          VARCHAR DEFAULT 'SGD',
  commission_earned DECIMAL DEFAULT 0,
  status            VARCHAR DEFAULT 'pending',  -- pending, confirmed, cancelled, completed
  holder_first_name VARCHAR NOT NULL,
  holder_last_name  VARCHAR NOT NULL,
  holder_email      VARCHAR NOT NULL,
  cancellation_policy JSONB,
  refund_amount     DECIMAL DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_travel_bookings_user ON travel_bookings(user_id);
CREATE INDEX idx_travel_bookings_status ON travel_bookings(status);
CREATE INDEX idx_travel_bookings_hotel_location ON travel_bookings USING GIST(hotel_location);
```

### New Table: `travel_search_log` (for analytics & demand intelligence)

```sql
CREATE TABLE travel_search_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      VARCHAR,
  destination     VARCHAR NOT NULL,
  check_in        DATE,
  check_out       DATE,
  guests          JSONB,
  results_count   INTEGER,
  selected_hotel  VARCHAR,  -- hotel_id if user clicked a result
  booked          BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_travel_search_dest ON travel_search_log(destination);
```

---

## 6. URL Structure

| Page | URL | Purpose |
|------|-----|---------|
| Travel hub | `/travel` | Browse guides + hotel search entry |
| Hotel search results | `/travel/hotels?dest=tokyo&checkin=...&checkout=...&guests=2` | Search results with Muslim-friendly enrichment |
| Hotel detail | `/travel/hotels/[hotelId]` | Full hotel page with rooms, pricing, nearby halal |
| Checkout | `/travel/hotels/[hotelId]/checkout?offerId=...` | Prebook + payment |
| Confirmation | `/travel/bookings/[bookingId]` | Booking confirmation + e-receipt |
| My bookings | `/dashboard/my-bookings` | User's travel booking history |
| City guide (pSEO) | `/travel/halal-food-guide-[city]` | Existing travel guide + "Book Hotels" CTA |
| City hotels (pSEO) | `/travel/muslim-friendly-hotels-[city]` | pSEO page for "[city] Muslim friendly hotels" |
| Flight bridge | `/travel/flights` | Redirect/embed to Skyscanner affiliate |

---

## 7. LiteAPI Technical Integration

### 7.1 SDK Setup

```bash
npm install liteapi-node-sdk
```

### 7.2 Server-Side Wrapper (`src/lib/liteapi/client.ts`)

```typescript
// All LiteAPI calls are SERVER-SIDE ONLY
// Never expose API key to client

import LiteApi from 'liteapi-node-sdk';

const liteapi = new LiteApi(process.env.LITEAPI_API_KEY!);

export { liteapi };
```

### 7.3 Key API Endpoints Used

| Endpoint | Method | When Used |
|----------|--------|-----------|
| `POST /hotels/rates` | Search | User searches hotels (returns rates + availability) |
| `POST /hotels/min-rates` | Search | Quick price preview on travel guide pages |
| `GET /data/hotel?hotelId=xxx` | Detail | Hotel detail page (photos, facilities, rooms) |
| `GET /data/reviews?hotelId=xxx` | Detail | Hotel reviews tab |
| `GET /data/places?textQuery=xxx` | Search | Destination autocomplete |
| `POST /rates/prebook` | Checkout | Lock rate + get payment session |
| `POST /rates/book` | Checkout | Confirm booking after payment |
| `GET /bookings/{bookingId}` | Manage | Retrieve booking details |
| `PUT /bookings/{bookingId}` | Manage | Cancel booking |
| `GET /data/weather?hotelId=xxx` | Detail | Weather widget on hotel page |

### 7.4 API Key & Auth

- **Header:** `X-API-Key: <your_key>`
- **Sandbox key:** For dev/testing (free, rate limited 5 req/sec)
- **Production key:** Requires credit card on LiteAPI dashboard (27,000 req/min)
- **Payment SDK:** Client-side script `https://payment-wrapper.liteapi.travel/dist/liteAPIPayment.js`

### 7.5 Env Vars to Add

```
LITEAPI_API_KEY=              # Server only (sand_ for dev, prod_ for live)
LITEAPI_WEBHOOK_SECRET=       # For booking status webhooks
NEXT_PUBLIC_LITEAPI_ENV=      # 'sandbox' or 'live' (for payment SDK publicKey)
```

---

## 8. Flight Strategy (Affiliate Bridge — MVP)

Since LiteAPI doesn't cover flights, the MVP approach:

### 8.1 Skyscanner Affiliate

- Sign up for Skyscanner Travel APIs affiliate programme
- Create `/travel/flights` page with a search form
- Form submits → redirect to Skyscanner with affiliate link + params (origin, destination, dates)
- Earn affiliate commission on completed flight bookings
- URL format: `https://www.skyscanner.com.sg/transport/flights/[origin]/[destination]/[date]/?adultsv2=2&ref=humblehalal`

### 8.2 UI Integration

- On hotel search results page, add banner: "Need flights too? Search flights →"
- On travel guide pages, add "Book Flights" button alongside "Book Hotels"
- Track outbound clicks as `analytics_events.event_type = 'click_flight_affiliate'`

### 8.3 Future: Duffel API (Phase 2)

When ready to build native flight booking:
- **Duffel** (duffel.com) — modern REST API, 300+ airlines, commission-based
- `npm install @duffel/api`
- Similar flow: Search → Offer → Order → Payment
- Can bundle with LiteAPI hotels for package pricing

---

## 9. Search UI Components

### 9.1 Hotel Search Bar

Placed on: `/travel`, `/travel/halal-food-guide-[city]` pages, homepage travel section

| Field | Type | Source |
|-------|------|--------|
| Destination | Autocomplete | LiteAPI `GET /data/places?textQuery=` |
| Check-in | Date picker | — |
| Check-out | Date picker | — |
| Guests & Rooms | Dropdown | Adults, children (with ages), rooms |
| **Muslim-Friendly Only** | Toggle | Filter results by Muslim-friendly score ≥ 3 |

### 9.2 Search Results Cards

Each hotel card shows:
- Hotel photo (from LiteAPI `hotelImages[0]`)
- Hotel name + star rating
- Price per night (with commission margin applied)
- Location (city, address)
- Muslim-friendly badges (mosque nearby, halal food, prayer room)
- Review rating + count
- "Book Now" CTA button
- Cancellation policy tag (Refundable / Non-refundable)

### 9.3 Filters Sidebar

- Price range slider
- Star rating (1–5)
- Muslim-friendly score (1–5)
- Facilities: Prayer room, Halal breakfast, Swimming pool, WiFi, Parking
- Board type: Room only, Bed & Breakfast, Half board, Full board
- Refundable only toggle
- Distance from city centre

---

## 10. AI Command Centre Integration

### Auto-Generated Travel Content
- When a user books a hotel in a new city, AI checks if we have a halal food guide for that city
- If not: auto-queues a travel guide generation task in Content Autopilot
- Guides are pre-generated for top 40 Muslim travel destinations

### Booking Analytics
New analytics_events types:
- `hotel_search` — user searches (with destination, dates)
- `hotel_view` — user views hotel detail
- `hotel_book` — booking confirmed (with amount, commission)
- `hotel_cancel` — booking cancelled
- `click_flight_affiliate` — outbound click to Skyscanner

### Demand Intelligence
- Travel search log feeds the analytics dashboard
- "Top Searched Destinations" panel in `/admin/analytics`
- "Unserved Destinations" — cities searched but no travel guide exists (content gap!)
- Commission earnings report in `/admin/analytics/travel`

---

## 11. Cross-Vertical Links

This is the ecosystem power — every booking connects to your other verticals:

| Touchpoint | Cross-Link |
|-----------|------------|
| Hotel search results | "X halal restaurants nearby" badge (food directory) |
| Hotel detail page | "Halal Food Near This Hotel" section (food directory) |
| Hotel detail page | "Nearest Mosques" section (mosque finder) |
| Hotel detail page | "Prayer Times in [City]" link (prayer times) |
| Booking confirmation email | "Halal Food Guide: [City]" link (travel guide) |
| Booking confirmation email | "Upcoming Events in [City]" link (events) |
| Travel guide pages | "Book Muslim-Friendly Hotels" CTA (hotel search) |
| Newsletter | "This Week's Hotel Deal: [City]" (newsletter cross-promo) |

---

## 12. Whitelabel Option (Quick Win)

LiteAPI also offers a **free no-code whitelabel booking site** that you can deploy instantly:

- Custom subdomain: `book.humblehalal.com`
- Or custom domain: `hotels.humblehalal.com`
- Your logo, colours, commission rate
- Zero development needed
- Bookings visible in LiteAPI dashboard
- Use this as a **Phase 0 quick win** while building the custom integration

**Recommended approach:**
1. Deploy whitelabel at `hotels.humblehalal.com` immediately (today)
2. Link to it from your travel guides and travel pages
3. Build the custom LiteAPI integration (this spec) over 2–3 weeks
4. Switch from whitelabel to custom when ready
5. Keep whitelabel as fallback

---

## 13. Implementation Phases

### Phase 0 — Quick Win (Day 1)
- Sign up for LiteAPI account
- Deploy whitelabel booking site at `hotels.humblehalal.com`
- Add "Book Hotels" links to existing travel guide pages
- Start earning commission immediately

### Phase A — Search & Detail (Week 1)
- Install `liteapi-node-sdk`
- Build hotel search API route (`/api/travel/search`)
- Build destination autocomplete component
- Build search results page with Muslim-friendly enrichment
- Build hotel detail page with rooms, photos, facilities, reviews

### Phase B — Booking Flow (Week 2)
- Build prebook → payment → book flow
- Integrate LiteAPI Payment SDK on checkout page
- Build booking confirmation page
- Build travel_bookings table + booking management
- Send confirmation emails via Resend

### Phase C — Enrichment & UX (Week 3)
- Add Muslim-friendly scoring and badges
- Add "Halal Food Nearby" and "Nearest Mosques" sections to hotel detail
- Add flight affiliate bridge (`/travel/flights`)
- Add travel search logging for analytics
- Build `/dashboard/my-bookings` for users

### Phase D — pSEO & Monetization
- Generate pSEO pages: `/travel/muslim-friendly-hotels-[city]` for top 40 cities
- AI auto-generates city descriptions and Muslim travel tips
- Add hotel search widget to all travel guide pages
- Commission tracking in admin analytics dashboard

---

## 14. CLAUDE.md Additions

Add these when building this feature:

```
## Travel Booking (LiteAPI)

- All LiteAPI calls are SERVER-SIDE ONLY via src/lib/liteapi/client.ts. Never expose API key to client.
- SDK: liteapi-node-sdk. Auth header: X-API-Key.
- Booking flow: Search (POST /hotels/rates) → Detail (GET /data/hotel) → Prebook (POST /rates/prebook with usePaymentSdk: true) → Payment (LiteAPI Payment SDK, client-side) → Book (POST /rates/book with TRANSACTION_ID method).
- Payment SDK script: https://payment-wrapper.liteapi.travel/dist/liteAPIPayment.js — loaded on checkout page only.
- Muslim-friendly enrichment: PostGIS queries against our mosques and food listings tables to enrich LiteAPI results with proximity data.
- Commission: Set via margin parameter in rate search. Weekly payouts from LiteAPI after guest check-in.
- Flight affiliate: Skyscanner redirect with affiliate link. Track as analytics_events.event_type = 'click_flight_affiliate'.
- New env vars: LITEAPI_API_KEY (server only), LITEAPI_WEBHOOK_SECRET, NEXT_PUBLIC_LITEAPI_ENV.
- New npm dep: liteapi-node-sdk
```

---

## 15. Revenue Projection

| Metric | Conservative (Month 6) | Moderate (Month 12) |
|--------|----------------------|-------------------|
| Monthly hotel searches | 5,000 | 20,000 |
| Conversion rate | 2% | 3% |
| Bookings/month | 100 | 600 |
| Avg booking value | SGD 200 | SGD 250 |
| Commission rate | 12% | 15% |
| **Monthly commission** | **SGD 2,400** | **SGD 22,500** |
| Flight affiliate clicks | 500 | 2,000 |
| Flight affiliate conversion | 1% | 1.5% |
| Flight affiliate revenue | SGD 150 | SGD 900 |
| **Total travel revenue** | **SGD 2,550/mo** | **SGD 23,400/mo** |

Travel booking has the potential to become HumbleHalal's **largest revenue stream** — bigger than listings, events, and ads combined.

---

*Bismillah. Book halal, travel halal. 💚✈️*
