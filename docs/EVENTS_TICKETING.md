# HumbleHalal Events & Ticketing Feature Spec

> **File:** `docs/EVENTS_TICKETING.md`
> **Status:** Planning
> **Date:** 7 March 2026
> **Fits into:** Existing `/events` vertical + `/admin/events` in AI Command Centre

---

## 1. What This Changes

Your current `events` table handles basic community events (bazaars, classes, gatherings) with a simple "RSVP" or external registration link. This spec upgrades the events vertical into a **full ticketing and event management platform** — think Eventbrite/Eventsize tailored for Singapore's Muslim community.

**Before:** Events are directory listings. Users discover, click "RSVP" or "Get Tickets" which links out to an external site.

**After:** Event organisers create, sell tickets, manage attendees, check in, and get paid — all within HumbleHalal. You take a platform fee on every paid ticket. Free events remain free to list.

### Why This Makes Sense for HumbleHalal

- **Muslim community events are underserved** — bazaars, Islamic classes, aqiqah, kenduri, halal food festivals currently use Google Forms or cash at the door
- **Revenue multiplier** — platform fee on every ticket sold (3–5% + Stripe processing) is passive income at scale
- **Data goldmine** — attendee data feeds your analytics dashboard and sponsor reports
- **Community lock-in** — organisers who sell tickets through you won't leave
- **Cross-sells everything** — event pages link to halal food nearby, caterers, service providers, mosques

---

## 2. User Roles

| Role | Who | What They Can Do |
|------|-----|-----------------|
| **Attendee** | Anyone | Browse events, buy tickets, get e-tickets, save events, leave reviews |
| **Organiser** | Registered user | Create events, set ticket tiers, track sales, manage attendees, check in, receive payouts |
| **Admin (Robert)** | You | Approve events, manage payouts, view all analytics, feature events, manage platform fees |

---

## 3. Event Types Supported

| Type | Format | Ticket Model | Example |
|------|--------|-------------|---------|
| **In-Person Event** | Physical venue | Paid or free, multiple tiers | Ramadan bazaar, halal food festival |
| **Online Webinar** | Zoom/Google Meet link | Paid or free, single tier | Islamic finance workshop, Quran tajweed class |
| **Hybrid** | Venue + online stream | Separate in-person and online ticket tiers | Conference with live stream |
| **Recurring Class** | Weekly/monthly sessions | Per-session or pass/bundle | Weekly Arabic class, Quran circle |
| **Private/Invite-Only** | Unlisted, invite code required | Paid or free | Family aqiqah, corporate iftar |

---

## 4. Organiser Flow (Create → Sell → Manage → Payout)

### 4.1 Event Creation (`/events/create`)

Multi-step wizard form:

**Step 1 — Basic Info**
- Event title
- Description (rich text editor — bold, lists, links, images)
- Event type: In-Person / Online / Hybrid / Recurring
- Category: Bazaar, Class, Gathering, Workshop, Charity, Sports, Family, Conference, Festival, Private
- Cover image upload (16:9, max 5MB)
- Gallery images (up to 10)
- Tags (searchable)

**Step 2 — Date & Location**
- Start date + time, end date + time
- Timezone (default SGT)
- For recurring: pattern (weekly, biweekly, monthly) + end date or number of occurrences
- Venue name, address, area (with Google Places autocomplete)
- Map pin (auto from address or manual drag)
- For online: platform (Zoom, Google Meet, Custom URL), meeting link (hidden until purchase)
- For hybrid: both venue + online platform

**Step 3 — Tickets**
- Add multiple ticket tiers (e.g., "Early Bird", "Standard", "VIP", "Student", "Family Bundle")
- Per tier: name, price (SGD), quantity available, description, sale start/end date
- Free tickets: price = 0 (no platform fee)
- Promo codes: percentage or fixed discount, usage limit, expiry date
- Group discounts: buy X get Y% off
- Absorption toggle: organiser absorbs platform fee or passes to buyer
- Max tickets per order
- Waitlist: enable if sold out (auto-offer when cancellation)

**Step 4 — Additional Settings**
- Refund policy: Full refund / Partial / No refund / Custom (with text)
- Registration form: add custom questions (text, dropdown, checkbox) — e.g., "Dietary requirements", "T-shirt size"
- Age restriction toggle
- Private/invite-only toggle + invite code generator
- Auto-confirmation or manual approval for registrations
- WhatsApp reminder opt-in toggle (sends reminder 24h + 1h before event)
- Add co-organisers (share management access)

**Step 5 — Preview & Publish**
- Full event page preview
- Submit for approval (goes to admin queue) or auto-publish (if organiser is verified)

### 4.2 Ticket Purchase Flow (Attendee)

1. **Event page** → see all ticket tiers with prices, availability, descriptions
2. **Select tickets** → choose tier(s) and quantity, apply promo code
3. **Registration form** → fill in name, email, phone, custom questions
4. **Payment** → Stripe Checkout (credit card, Apple Pay, Google Pay, PayNow/SGQR)
5. **Confirmation** → email with e-ticket (QR code), calendar invite (.ics), receipt
6. **WhatsApp reminder** → opt-in reminder 24h and 1h before event
7. **Post-event** → prompt to leave review on the event and linked listings

### 4.3 Attendee Management (Organiser Dashboard)

`/dashboard/my-events/[event-id]/attendees`

- Full attendee list: name, email, ticket tier, purchase date, check-in status, custom question responses
- Search and filter attendees
- Export to CSV
- Send bulk email or WhatsApp message to all attendees
- Resend confirmation/ticket to individual attendee
- Issue refund (full or partial) — triggers Stripe refund
- Transfer ticket to another person
- Manual check-in toggle

### 4.4 Check-In System

**For Organisers:**
- `/checkin/[event-id]` — mobile-optimised check-in page
- QR scanner using device camera (no app needed, works in browser)
- Manual search by name or order number
- Live check-in counter: "142 / 300 checked in"
- Check-in status syncs in real-time via Supabase Realtime

**For Attendees:**
- E-ticket page with large QR code (works offline — QR contains ticket ID)
- Add to Apple Wallet / Google Wallet
- Option to screenshot/save QR

### 4.5 Payout System

- HumbleHalal collects all ticket payments via Stripe
- Platform fee: 3% of ticket price + Stripe processing fee (~2.9% + $0.30)
- Payout schedule: Weekly automatic payout to organiser's bank account via Stripe Connect
- Payout dashboard shows: total sales, platform fees, net payout, pending, completed
- Organiser must onboard to Stripe Connect (Standard or Express account)

---

## 5. Database Schema Changes

### New Tables

**event_tickets** (ticket tier definitions)
```
id              UUID PK
event_id        UUID FK → events ON DELETE CASCADE
name            VARCHAR NOT NULL (e.g., "Early Bird", "VIP")
description     TEXT
price           DECIMAL NOT NULL (0 for free)
quantity        INTEGER NOT NULL
sold_count      INTEGER DEFAULT 0
sale_start      TIMESTAMPTZ
sale_end        TIMESTAMPTZ
sort_order      SMALLINT DEFAULT 0
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMPTZ DEFAULT now()
```

**event_orders** (purchase transactions)
```
id              UUID PK
event_id        UUID FK → events
user_id         UUID FK → auth.users (nullable for guest checkout)
order_number    VARCHAR UNIQUE NOT NULL (HH-20260307-XXXX format)
email           VARCHAR NOT NULL
name            VARCHAR NOT NULL
phone           VARCHAR
total_amount    DECIMAL NOT NULL
platform_fee    DECIMAL NOT NULL
stripe_payment_intent_id  VARCHAR
stripe_checkout_session_id VARCHAR
status          ENUM (pending, completed, refunded, partial_refund, cancelled)
custom_responses JSONB (answers to custom registration questions)
promo_code_used VARCHAR
refund_amount   DECIMAL DEFAULT 0
created_at      TIMESTAMPTZ DEFAULT now()
```

**event_order_items** (individual tickets within an order)
```
id              UUID PK
order_id        UUID FK → event_orders ON DELETE CASCADE
ticket_id       UUID FK → event_tickets
attendee_name   VARCHAR NOT NULL
attendee_email  VARCHAR NOT NULL
qr_code         VARCHAR UNIQUE NOT NULL (generated hash)
checked_in      BOOLEAN DEFAULT false
checked_in_at   TIMESTAMPTZ
checked_in_by   UUID FK → auth.users (who scanned)
status          ENUM (active, cancelled, transferred)
created_at      TIMESTAMPTZ DEFAULT now()
```

**event_promo_codes**
```
id              UUID PK
event_id        UUID FK → events ON DELETE CASCADE
code            VARCHAR NOT NULL
discount_type   ENUM (percentage, fixed)
discount_value  DECIMAL NOT NULL
max_uses        INTEGER
used_count      INTEGER DEFAULT 0
valid_from      TIMESTAMPTZ
valid_until     TIMESTAMPTZ
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMPTZ DEFAULT now()
UNIQUE (event_id, code)
```

**event_custom_questions**
```
id              UUID PK
event_id        UUID FK → events ON DELETE CASCADE
question        VARCHAR NOT NULL
field_type      ENUM (text, textarea, dropdown, checkbox, radio)
options         TEXT[] (for dropdown/radio/checkbox)
is_required     BOOLEAN DEFAULT false
sort_order      SMALLINT DEFAULT 0
```

**event_reminders** (scheduled WhatsApp/email reminders)
```
id              UUID PK
order_item_id   UUID FK → event_order_items
channel         ENUM (email, whatsapp, sms)
scheduled_for   TIMESTAMPTZ NOT NULL
sent_at         TIMESTAMPTZ
status          ENUM (pending, sent, failed)
```

**organiser_payouts**
```
id              UUID PK
organiser_id    UUID FK → auth.users
event_id        UUID FK → events
gross_amount    DECIMAL NOT NULL
platform_fee    DECIMAL NOT NULL
stripe_fee      DECIMAL NOT NULL
net_amount      DECIMAL NOT NULL
stripe_transfer_id VARCHAR
status          ENUM (pending, processing, completed, failed)
payout_date     TIMESTAMPTZ
created_at      TIMESTAMPTZ DEFAULT now()
```

### Modify Existing `events` Table — Add Columns

```sql
ALTER TABLE events ADD COLUMN is_ticketed BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN is_online BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN is_hybrid BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN is_recurring BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN is_private BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN invite_code VARCHAR;
ALTER TABLE events ADD COLUMN online_platform VARCHAR; -- zoom, google_meet, custom
ALTER TABLE events ADD COLUMN online_link VARCHAR; -- hidden until ticket purchase
ALTER TABLE events ADD COLUMN recurrence_rule JSONB; -- {pattern, end_date, occurrences}
ALTER TABLE events ADD COLUMN refund_policy VARCHAR DEFAULT 'no_refund';
ALTER TABLE events ADD COLUMN refund_policy_text TEXT;
ALTER TABLE events ADD COLUMN max_tickets_per_order SMALLINT DEFAULT 10;
ALTER TABLE events ADD COLUMN waitlist_enabled BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN organiser_stripe_account_id VARCHAR;
ALTER TABLE events ADD COLUMN platform_fee_percent DECIMAL DEFAULT 3.0;
ALTER TABLE events ADD COLUMN total_revenue DECIMAL DEFAULT 0;
ALTER TABLE events ADD COLUMN total_tickets_sold INTEGER DEFAULT 0;
ALTER TABLE events ADD COLUMN custom_questions JSONB; -- legacy, prefer event_custom_questions table
```

---

## 6. URL Structure (pSEO)

| Page | URL | Purpose |
|------|-----|---------|
| Event listing | `/events` | Browse/search all events |
| Event detail | `/events/[slug]` | Public event page with ticket purchase |
| Ticket checkout | `/events/[slug]/checkout` | Stripe checkout flow |
| Order confirmation | `/events/[slug]/confirmation/[order-id]` | E-ticket + QR + calendar |
| E-ticket | `/tickets/[qr-code]` | Individual ticket with QR (shareable) |
| Check-in | `/checkin/[event-id]` | Organiser check-in scanner |
| Create event | `/events/create` | Multi-step wizard |
| Manage event | `/dashboard/my-events/[event-id]` | Organiser dashboard |
| Attendee list | `/dashboard/my-events/[event-id]/attendees` | Manage attendees |
| My tickets | `/dashboard/my-tickets` | Attendee's purchased tickets |
| Category pSEO | `/events/category/[category]` | e.g., `/events/category/islamic-classes` |
| Area pSEO | `/events/area/[area]` | e.g., `/events/area/tampines` |
| Seasonal pSEO | `/events/ramadan-[year]` | Ramadan hub |

---

## 7. Stripe Integration Details

### Required Stripe Products

| Product | Purpose | Setup |
|---------|---------|-------|
| **Stripe Checkout** | Ticket purchase payment page | `stripe.checkout.sessions.create()` |
| **Stripe Connect (Express)** | Organiser payout accounts | Organisers onboard via Stripe-hosted flow |
| **Stripe Webhooks** | Payment confirmation, refunds, disputes | `/api/webhooks/stripe` (already exists) |
| **PayNow / SGQR** | Singapore local payment method | Enable via Stripe Dashboard (SG-specific) |

### Payment Flow

```
Attendee clicks "Buy Tickets"
  → Frontend creates order in event_orders (status: pending)
  → Server Action calls stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'paynow'],
      line_items: [ticket tiers selected],
      application_fee_amount: platform_fee_in_cents,
      transfer_data: { destination: organiser_stripe_account_id },
      success_url: '/events/[slug]/confirmation/[order-id]',
      cancel_url: '/events/[slug]',
      metadata: { order_id, event_id }
    })
  → Redirect to Stripe Checkout
  → On success: webhook fires checkout.session.completed
    → Update event_orders.status = 'completed'
    → Generate QR codes for each event_order_item
    → Send confirmation email via Resend
    → Send WhatsApp confirmation (if opted in)
    → Increment event_tickets.sold_count
    → Increment events.total_tickets_sold + total_revenue
    → Log to analytics_events (event_type: 'ticket_purchase')
```

### Payout Flow

```
Weekly cron job (/api/cron/organiser-payouts):
  → Query completed orders not yet paid out
  → Group by organiser
  → Create Stripe Transfer to each organiser's Connect account
  → Record in organiser_payouts table
  → Send payout notification email to organiser
```

---

## 8. WhatsApp Reminders

Use the **WhatsApp Business API** via a provider (Twilio or direct Meta Business API). Alternatively, start with a simpler approach:

**MVP approach:** Use Resend email reminders first. Add WhatsApp as Phase 2.

**Reminder schedule:**
- 24 hours before event → "Reminder: [Event Name] is tomorrow at [time] at [venue]. Your ticket: [link]"
- 1 hour before event → "Starting soon! [Event Name] begins at [time]. Show your QR code at the door: [link]"

**Cron job:** `/api/cron/event-reminders` runs every 30 minutes, queries event_reminders table for pending reminders where scheduled_for <= now(), sends and updates status.

---

## 9. AI Command Centre Integration

### Auto-Generated Event Content
- AI generates event descriptions from basic inputs (title, type, venue, date)
- AI suggests categories and tags based on description
- AI writes social media promotion posts for published events

### Event Moderation
- New event submissions run through AI moderation (spam, inappropriate content, date validation)
- High-confidence events auto-publish, flagged ones go to admin queue

### Analytics Extensions
New event_type values for analytics_events:
- `ticket_view` — attendee views ticket tiers
- `ticket_purchase` — completed purchase (with amount)
- `ticket_refund` — refund processed
- `checkin_scan` — QR code scanned at door
- `event_share` — attendee shares event
- `reminder_click` — attendee clicks reminder link

### Sponsor Reports
Events analytics feed into the sponsor report generator — show organisers their event performance data as a branded PDF.

---

## 10. Monetization

| Revenue Stream | How | Est. Revenue |
|---------------|-----|-------------|
| **Platform fee** | 3% of every paid ticket | Scales with GMV |
| **Featured event listing** | Promoted placement in browse/search | SGD 50–200/event |
| **Organiser subscription** | Unlimited events + advanced features (analytics, custom branding) | SGD 29–99/mo |
| **WhatsApp reminders add-on** | Per-reminder fee or included in subscription | SGD 0.05–0.10/message |
| **Sponsored event categories** | Brand sponsors a category (e.g., "Ramadan Events powered by [Brand]") | SGD 500–2,000/season |

### Revenue Projection (Month 12)

Conservative: 50 paid events/month × 100 avg tickets × SGD 25 avg price × 3% fee = **SGD 3,750/month** in platform fees alone. Plus featured listings and subscriptions.

---

## 11. Competitive Advantage

| Feature | Eventbrite | Eventsize | Peatix | HumbleHalal Events |
|---------|-----------|-----------|--------|-------------------|
| Muslim-community focus | ❌ | ❌ | ❌ | ✅ Core audience |
| Halal food nearby links | ❌ | ❌ | ❌ | ✅ Cross-vertical |
| Prayer time integration | ❌ | ❌ | ❌ | ✅ Built-in |
| Mosque event sync | ❌ | ❌ | ❌ | ✅ Mosque vertical |
| PayNow/SGQR | ❌ | ✅ | ❌ | ✅ Via Stripe |
| WhatsApp reminders | ❌ | ✅ | ❌ | ✅ Planned |
| Community reviews | ❌ | ❌ | ❌ | ✅ Review system |
| AI event description gen | ❌ | ❌ | ❌ | ✅ AI Command Centre |
| Halal catering cross-sell | ❌ | ❌ | ❌ | ✅ Catering vertical |
| Newsletter promotion | ❌ | ❌ | ❌ | ✅ Beehiiv cross-promo |

---

## 12. Implementation Phases

### Phase A — Foundation (alongside current Phase 2–3)
- New migration: event_tickets, event_orders, event_order_items, event_promo_codes tables
- Alter events table with new columns
- Stripe Connect onboarding flow for organisers
- Basic ticket purchase via Stripe Checkout

### Phase B — Organiser Tools (Week after Phase A)
- Event creation wizard (multi-step form)
- Organiser dashboard: attendee list, sales chart, export CSV
- QR code generation for e-tickets
- Check-in scanner page (browser-based camera QR reader)
- Email confirmations and e-ticket delivery via Resend

### Phase C — Attendee Experience
- My Tickets dashboard for attendees
- Calendar invite generation (.ics)
- Apple Wallet / Google Wallet pass (stretch goal)
- Event reviews post-attendance
- Share event functionality

### Phase D — Advanced Features
- Email reminders (24h + 1h before via cron)
- WhatsApp reminders (Phase 2 — requires WhatsApp Business API)
- Recurring event support
- Promo codes and group discounts
- Waitlist auto-offer on cancellation
- Custom registration questions
- Private/invite-only events

### Phase E — Monetization Polish
- Weekly automated organiser payouts via Stripe Connect
- Featured event placement (paid promotion)
- Organiser subscription tiers
- Event analytics in AI Command Centre
- Sponsor category pages

---

## 13. CLAUDE.md Additions

Add these to your CLAUDE.md when building this feature:

```
## Events & Ticketing

- Stripe Connect Express for organiser payouts. Onboarding via stripe.accountLinks.create().
- Ticket purchase via Stripe Checkout Sessions with application_fee_amount for platform cut.
- QR codes generated server-side using 'qrcode' npm package, stored as SVG data URI in event_order_items.qr_code.
- Check-in scanner at /checkin/[event-id] uses navigator.mediaDevices.getUserMedia() + jsQR library for browser-based QR scanning. Mobile-optimised.
- Supabase Realtime subscription on event_order_items for live check-in counter.
- Online event meeting links are stored encrypted and only revealed after ticket purchase confirmation.
- Event reminders: cron job /api/cron/event-reminders runs every 30min via Vercel Cron.
- PayNow/SGQR enabled via Stripe payment_method_types: ['card', 'paynow'] in Checkout Sessions.
- New npm deps: qrcode, jsqr, @stripe/stripe-js (client), stripe (server)
```
