# HumbleHalal.com

Singapore's all-in-one halal ecosystem — restaurants, businesses, mosques, events, classifieds, travel, forum, and blog. 10,000+ programmatic SEO pages operated solo via an AI Command Centre admin dashboard.

**Live:** [humblehalal.sg](https://humblehalal.sg) &nbsp;|&nbsp; **Stack:** Next.js 14 · Supabase · Tailwind CSS · Vercel · Stripe · Anthropic Claude

---

## What It Is

HumbleHalal is Singapore's most complete halal directory — designed from the ground up for programmatic SEO at scale and zero-team operations. A single admin dashboard powered by Claude AI handles content generation, moderation, listing enrichment, SEO auditing, and analytics. No editors needed.

### Verticals

| Vertical | URL Pattern | Description |
|----------|------------|-------------|
| Halal Food | `/halal-food/[cuisine]-[area]` | MUIS-certified and Muslim-owned restaurants |
| Businesses | `/business/[category]-[area]` | Halal-certified and Muslim-owned businesses |
| Catering | `/catering/[type]-catering` | Event catering services |
| Mosques | `/mosque/[slug]` | All Singapore mosques with facilities and prayer times |
| Prayer Rooms | `/prayer-rooms/[area]` | Prayer rooms in malls and buildings |
| Events | `/events/[slug]` | Community events with ticketing |
| Classifieds | `/classifieds/[category]` | Buy/sell/rent marketplace |
| Travel | `/travel/muslim-friendly-hotels/[city]` | Muslim-friendly hotel bookings via LiteAPI |
| Community | `/community/[slug]` | Forum discussions |
| Blog | `/blog/[slug]` | AI-generated halal lifestyle content |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router, TypeScript strict, React Server Components) |
| Database | Supabase — PostgreSQL + PostGIS + Row Level Security |
| Auth | Supabase Auth — magic link + Google OAuth |
| Storage | Supabase Storage |
| Hosting | Vercel (auto-deploy from `main`) |
| Payments | Stripe (premium listings, classifieds) |
| Hotel Booking | LiteAPI (12% commission model) |
| Email | Resend (transactional) |
| Newsletter | Beehiiv API |
| AI | Anthropic Claude API (Sonnet for speed, Opus for quality) |
| Maps | Google Maps Platform — Places, Geocoding |
| Styling | Tailwind CSS + shadcn/ui |
| Analytics | Custom event tracker + GA4 + PostHog |
| Monitoring | Sentry |
| Testing | Vitest (unit) + Playwright (E2E) |

---

## Architecture

### Programmatic SEO

Every public page uses ISR (Incremental Static Regeneration):

- **High-traffic pages** — `revalidate = 1800` (30 min)
- **Long-tail pages** — `revalidate = 3600` (1 hour)
- All data fetched in Server Components — never client-side on SEO pages
- Every page has `generateMetadata()` and JSON-LD schema markup

### Database

PostgreSQL via Supabase with PostGIS for spatial queries. Key tables:

```
listings          — base table for all verticals (PostGIS coordinates)
listings_food     — food-specific extension
listings_catering — catering extension
listings_services — services extension
reviews           — user reviews (moderated)
events            — community events + ticketing
classifieds       — marketplace listings
forum_posts       — community forum
forum_replies     — threaded forum replies
mosques           — mosque directory (PostGIS)
prayer_rooms      — prayer room finder
analytics_events  — custom event tracker
ai_content_drafts — AI-generated content pipeline
ai_prompts        — versioned prompt templates
ai_moderation_log — content moderation audit trail
ai_enrichment_queue — listing enrichment jobs
ai_seo_audit      — per-page SEO scores
ai_cost_log       — AI spend tracking
ai_activity_log   — admin action audit log
```

All tables use Row Level Security (RLS). Public read for published content, authenticated write for owned content, admin-only for AI tables.

### AI Command Centre

A protected `/admin` dashboard powered by Claude API:

| Module | Function |
|--------|---------|
| Morning Briefing | Daily digest — new listings, reviews, forum activity, AI costs, SEO alerts |
| Content Autopilot | Blog, travel guides, social posts, newsletter drafts — AI-generated, human-reviewed |
| Listing Intelligence | MUIS cert sync, Google Places enrichment, freshness scoring, closure detection |
| Auto-Moderation | Reviews, forum posts, and classifieds reviewed by AI before publication |
| SEO Engine | Meta description generation, schema audit, pSEO health monitoring |
| Analytics Dashboard | Custom event tracking — lead clicks, search demand, user journeys |
| Sponsor Reports | PDF reports for advertisers with traffic and engagement data |

### Cron Jobs (Vercel Cron, SGT times)

| Job | Schedule | What It Does |
|-----|----------|-------------|
| MUIS Cert Sync | Sun 2am | Syncs MUIS halal certification database |
| Places Refresh | 1st of month 4am | Refreshes Google Places data for all listings |
| Freshness Check | Mon 3am | Scores listing freshness, flags stale data |
| Closure Detection | 15th 4am | Detects permanently closed businesses |
| Newsletter Draft | Wed 6am | Generates weekly newsletter draft via Claude |
| SEO Audit | Daily 5am | Audits 500 pages per run for meta/schema issues |
| GSC Pull | Daily 6am | Pulls Google Search Console performance data |
| Ahrefs Pull | Mon 6am | Pulls Ahrefs ranking and backlink data |
| Morning Briefing | Daily 7am | Builds admin morning briefing report |
| Analytics Rollup | Daily 1am | Rolls up custom analytics events |

---

## Design System

**Colors**

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#047857` | Emerald — brand, MUIS badge, icons, CTAs |
| `accent` | `#D4A017` | Gold — "Halal" wordmark, gold buttons, highlights |
| `charcoal` | `#1C1917` | Dark text, footer background |
| `warm-white` | `#FAFAF8` | Page backgrounds |
| `background-dark` | `#0f231d` | Hero dark sections |

**Fonts**
- **Manrope** (400–800) — all body, UI, buttons, navigation
- **Playfair Display** (italic only) — accent words ("Halal" in logo, section titles)

**Icons** — Google Material Symbols Outlined

**Key patterns**

```css
/* Islamic geometric dot pattern */
.islamic-pattern {
  background-image: radial-gradient(#D4A017 0.5px, transparent 0.5px);
  background-size: 24px 24px;
  opacity: 0.1;
}

/* Frosted glass overlay */
.frosted-glass {
  background: rgba(255,255,255,0.1);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.2);
}
```

Design reference: [`design/stitch/preview.html`](design/stitch/preview.html) — open directly in a browser.

---

## Security

Defence in depth — every layer assumes the layer above it has failed.

| Layer | Implementation |
|-------|---------------|
| **Rate Limiting** | Upstash Redis — auth (5/15min), content (5/hr), search (30/min), travel (10/min), booking (5/10min) |
| **CAPTCHA** | Cloudflare Turnstile — on signup, review, forum, classified, event submissions. Server-side verification only. |
| **XSS Prevention** | `isomorphic-dompurify` — all user content sanitised before storage. `sanitiseHTML` for rich content, `sanitisePlainText` for titles/names. |
| **Security Headers** | X-Frame-Options DENY, HSTS, CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| **Auth Protection** | Supabase JWT + middleware auth check on `/admin/**` and `/dashboard/**` |
| **Admin Panel** | 4 layers: middleware auth → rate limit → session re-verify → audit log |
| **Cron Auth** | `Authorization: Bearer $CRON_SECRET` on all `/api/cron/*` endpoints |
| **Stripe Webhooks** | Signature verification via `stripe.webhooks.constructEvent()` |
| **SQL Injection** | Supabase parameterised queries only — never raw string concatenation |
| **RLS** | Row Level Security on every table — service role for analytics ingestion |
| **PDPA Compliance** | PII purge cron (12-month retention), marketing consent tracking, anonymisation on user deletion |

---

## PDPA Compliance (Singapore)

- Cookie consent banner — essential vs optional, 365-day expiry
- `marketing_consent` + `consent_date` stored on `user_profiles`
- Travel booking and event order PII purged after 12 months via cron
- User deletion triggers anonymisation of reviews and forum content
- Privacy Policy at `/privacy`, Cookie Policy at `/cookies`

---

## Getting Started

### Prerequisites

- Node.js 20+
- Docker (for local Supabase)
- Supabase CLI

### Local Development

```bash
# 1. Clone
git clone https://github.com/nicholsmindset/humblehalalv2.git
cd humblehalalv2

# 2. Install dependencies
npm install

# 3. Copy env template
cp .env.local.example .env.local
# Fill in your Supabase, Anthropic, Stripe, Google Maps keys

# 4. Start local Supabase
npx supabase start
# Copy the printed URL and keys into .env.local

# 5. Run migrations
npx supabase db reset

# 6. Start dev server
npm run dev
# → http://localhost:3000
```

### Commands

```bash
# Development
npm run dev          # Next.js dev server
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest unit tests
npm run test:e2e     # Playwright E2E

# Supabase
npx supabase start          # Start local stack (Docker required)
npx supabase db reset       # Reset DB + re-run all migrations
npx supabase db push        # Push migrations to remote
npx supabase gen types ts --project-id $PROJECT_ID > src/lib/database.types.ts

# Stripe
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Vercel
vercel env pull .env.local  # Pull env vars from Vercel project
vercel --prod               # Deploy to production
```

---

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your values.

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI
ANTHROPIC_API_KEY=

# Payments
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Hotel Booking
LITEAPI_KEY=

# Maps
GOOGLE_MAPS_API_KEY=

# Email & Newsletter
RESEND_API_KEY=
BEEHIIV_API_KEY=
BEEHIIV_PUBLICATION_ID=

# Analytics & Monitoring
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
SENTRY_DSN=
NEXT_PUBLIC_GA_MEASUREMENT_ID=

# Security
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
CRON_SECRET=

# Auth (Google OAuth)
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=
```

---

## Project Structure

```
src/
├── app/
│   ├── (public)/          # All public-facing pSEO pages
│   │   ├── halal-food/    # /halal-food/[cuisine]-[area]
│   │   ├── restaurant/    # /restaurant/[slug]
│   │   ├── mosque/        # /mosque/[slug]
│   │   ├── events/        # /events/[slug]
│   │   ├── classifieds/   # /classifieds/[category]
│   │   ├── travel/        # /travel/muslim-friendly-hotels/[city]
│   │   ├── community/     # /community/[slug]
│   │   ├── blog/          # /blog/[slug]
│   │   ├── privacy/       # Privacy policy
│   │   └── cookies/       # Cookie policy
│   ├── (auth)/            # /login, /signup, /signup/complete
│   ├── (dashboard)/       # /dashboard — user account
│   ├── admin/             # AI Command Centre (admin-only)
│   │   ├── page.tsx       # Morning briefing
│   │   ├── content/       # Content autopilot
│   │   ├── listings/      # Listing management
│   │   ├── moderation/    # Review/forum moderation queue
│   │   ├── seo/           # SEO audit dashboard
│   │   ├── analytics/     # Custom analytics
│   │   ├── reports/       # Sponsor PDF reports
│   │   └── settings/      # API keys, prompts, costs
│   └── api/
│       ├── track/         # Custom analytics ingestion
│       ├── reviews/       # Review submission
│       ├── forum/         # Forum posts + replies
│       ├── classifieds/   # Classified listings
│       ├── events/        # Event management + ticketing
│       ├── search/        # Unified search
│       ├── travel/        # Hotel search, prebook, book
│       ├── user/          # Profile management
│       ├── webhooks/      # Stripe webhook handler
│       └── cron/          # 10 scheduled jobs
├── components/
│   ├── layout/            # Navbar, Footer, CookieConsent, AnalyticsProvider
│   ├── ui/                # shadcn/ui + custom MuisBadge, GoldCta
│   ├── listings/          # Listing cards, detail views
│   ├── travel/            # Hotel cards, search, checkout
│   └── admin/             # AI dashboard components
├── lib/
│   ├── supabase/          # client.ts, server.ts, middleware.ts
│   ├── security/          # rate-limit.ts, captcha.ts, sanitise.ts
│   ├── liteapi/           # Hotel booking client + enrichment
│   ├── resend/            # Email templates
│   ├── anthropic/         # Claude API helpers
│   └── utils/             # cron-auth, slug, etc.
├── hooks/                 # Custom React hooks
├── types/                 # Shared TypeScript types
└── config/                # Enums, constants, env validation

supabase/
├── migrations/            # 001–016 SQL migration files
├── seed/                  # MUIS, mosque, sample data seeders
└── functions/             # Supabase Edge Functions

design/
└── stitch/
    ├── README.md          # Design token reference
    └── preview.html       # Standalone UI preview (open in browser)

docs/
├── PLAN.md               # Phase 0 implementation plan
├── SECURITY.md           # Security spec and threat model
├── ANALYTICS_SPEC.md     # Custom analytics event specification
├── PDPA_COMPLIANCE.md    # Singapore PDPA compliance spec
├── TRAVEL_BOOKING.md     # LiteAPI travel booking spec
└── EVENTS_TICKETING.md   # Event ticketing spec
```

---

## Halal Status Tiers

| Status | Trust Level | Description |
|--------|-------------|-------------|
| `muis_certified` | Highest | Active MUIS certification with cert number |
| `muslim_owned` | High | Verified Muslim-owned business |
| `self_declared` | Medium | Operator self-declares halal |
| `not_applicable` | — | Services not related to food |

MUIS certification data is synced weekly via the MUIS Cert Sync cron job.

---

## Newsletter Integration

HumbleHalal cross-promotes with a separate Beehiiv newsletter brand. All cross-links use UTM parameters:

```
?utm_source=humblehalal&utm_medium=directory&utm_campaign=[page-type]
```

Newsletter attribution is tracked in `analytics_events.source_channel = 'newsletter'`.

---

## Contributing

This is a solo-operated project. Issues and PRs are welcome for bug reports.

---

## Disclaimer

HumbleHalal.com is not affiliated with MUIS (Majlis Ugama Islam Singapura). Halal status information is provided for reference only. Always verify certification directly with MUIS before making purchasing decisions.

---

*Built in Singapore · Serving the Muslim community*
test content
