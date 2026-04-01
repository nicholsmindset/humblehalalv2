# HumbleHalal.com

Singapore's all-in-one halal ecosystem: food directory, Muslim businesses, events, classifieds, mosque finder, travel guides, product reviews, service providers, forum, blog. 10,000+ programmatic SEO pages. AI Command Centre admin dashboard runs everything for a solo operator. See `docs/PRD.md`, `docs/AI_DASHBOARD.md`, `docs/ANALYTICS_SPEC.md` for full specs.

## Tech Stack & CLIs

| Layer | Tech | CLI / Install |
|-------|------|---------------|
| Framework | Next.js 14 (App Router, TypeScript strict, RSC) | `npx create-next-app@latest` |
| Database | Supabase (PostgreSQL + PostGIS + RLS) | `npx supabase init && npx supabase start` |
| Auth | Supabase Auth (magic link + Google OAuth) | Configured via `supabase/config.toml` |
| Storage | Supabase Storage (listing photos, uploads) | `npx supabase storage` |
| Edge Functions | Supabase Edge Functions (Deno) | `npx supabase functions new <name>` |
| Hosting | Vercel (auto-deploy from `main`) | `npm i -g vercel && vercel link` |
| Payments | Stripe (premium listings, classifieds) | `brew install stripe/stripe-cli/stripe && stripe login` |
| Email | Resend (transactional) | `npm install resend` (SDK, no CLI) |
| Newsletter | Beehiiv API (cross-promotion) | REST API, no CLI |
| AI | Anthropic Claude API (Sonnet for speed, Opus for quality) | `npm install @anthropic-ai/sdk` |
| Maps | Google Maps Platform (Places, Geocoding, PostGIS) | `npm install @googlemaps/google-maps-services-js` |
| Styling | Tailwind CSS + shadcn/ui | `npx shadcn@latest init` |
| Analytics | Custom event tracker (self-built) + GA4 + PostHog | `npm install posthog-js` |
| Monitoring | Sentry | `npx @sentry/wizard@latest -i nextjs` |
| Testing | Vitest (unit) + Playwright (e2e) | `npm install -D vitest @playwright/test` |
| Linting | ESLint + Prettier (Tailwind plugin) | `npm install -D prettier prettier-plugin-tailwindcss` |
| PDF Gen | @react-pdf/renderer (sponsor reports) | `npm install @react-pdf/renderer` |

## Commands

```bash
# Dev
npm run dev                    # Next.js dev server (port 3000)
npm run build                  # Production build
npm run lint                   # ESLint
npm run format                 # Prettier
npm run test                   # Vitest unit tests
npm run test:e2e               # Playwright

# Supabase
npx supabase start             # Start local Supabase stack (Docker required)
npx supabase stop              # Stop local stack
npx supabase db push           # Push migrations to remote
npx supabase db pull           # Pull remote schema changes
npx supabase db reset          # Reset local DB + re-run migrations + seed
npx supabase db diff -f <name> # Generate migration from local changes
npx supabase gen types ts --project-id $PROJECT_ID > src/lib/database.types.ts
npx supabase functions serve   # Serve Edge Functions locally
npx supabase functions deploy <name>  # Deploy single Edge Function

# Stripe
stripe listen --forward-to localhost:3000/api/webhooks/stripe  # Local webhook forwarding
stripe trigger checkout.session.completed  # Test webhook events

# Vercel
vercel dev                     # Local Vercel dev (mirrors prod)
vercel --prod                  # Deploy to production
vercel env pull .env.local     # Pull env vars from Vercel

# Seed & Import
npm run seed                   # Run all data seeding scripts
npm run seed:muis              # Import MUIS halal directory
npm run seed:mosques           # Import mosque data
npm run seed:places            # Enrich listings via Google Places API
```

## Design System (from Stitch — source of truth: `design/stitch/*.html`)

**Colors** — `primary: #047857` (emerald), `accent: #D4A017` (gold), `charcoal: #1C1917`, `warm-white: #FAFAF8`, `background-dark: #0f231d`

**Fonts** — Manrope (all body/UI/buttons/nav) + Playfair Display italic (ONLY for accent words like "Halal" in logo and section titles). Import both from Google Fonts.

**Icons** — Google Material Symbols Outlined. Usage: `<span class="material-symbols-outlined text-primary">mosque</span>`

**Navbar** — `fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-primary/10`. Logo: mosque icon + "Humble" Manrope extrabold + "Halal" Playfair italic gold.
**Cards** — `bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all`
**MUIS Badge** — `bg-primary text-white text-xs font-bold px-3 py-1 rounded-full`
**Gold CTA** — `bg-accent text-charcoal rounded-lg font-bold hover:bg-accent/90`
**Islamic Pattern** — `.islamic-pattern { background-image: radial-gradient(#D4A017 0.5px, transparent 0.5px); background-size: 24px 24px; opacity: 0.1; }`
**Frosted Glass** — `.frosted-glass { background: rgba(255,255,255,0.1); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.2); }`

## Directory Structure

```
src/app/
├── (public)/                 # All public pSEO pages
│   ├── halal-food/           # /halal-food/[cuisine]-[area]
│   ├── restaurant/           # /restaurant/[slug]
│   ├── business/             # /business/[category]-[area]
│   ├── catering/             # /catering/[type]-catering
│   ├── events/               # /events/[slug]
│   ├── classifieds/          # /classifieds/[category]
│   ├── mosque/               # /mosque/[slug]
│   ├── prayer-rooms/         # /prayer-rooms/[area]
│   ├── prayer-times/         # /prayer-times/singapore
│   ├── travel/               # /travel/halal-food-guide-[city]
│   ├── products/             # /products/halal-[category]
│   ├── services/             # /services/muslim-[service]
│   ├── community/            # /community/[slug]
│   └── blog/                 # /blog/[slug]
├── (auth)/                   # Login, signup
├── (dashboard)/              # User dashboard (my listings, reviews, settings)
├── (business)/               # Business owner dashboard (claim, manage)
├── admin/                    # AI COMMAND CENTRE (protected, admin role only)
│   ├── page.tsx              # Morning Briefing overview
│   ├── content/              # Content Autopilot (drafts, calendar, queue)
│   ├── listings/             # Listing Intelligence (import, enrichment, MUIS sync)
│   ├── moderation/           # Auto-Moderation (reviews, forum, classifieds queue)
│   ├── seo/                  # SEO Engine (meta audit, schema, pSEO health)
│   ├── analytics/            # Custom Analytics Dashboard (lead actions, demand, journeys)
│   ├── reports/              # Sponsor Report Generator (PDF export)
│   └── settings/             # API keys, prompts, cron config, costs
├── api/
│   ├── track/                # POST /api/track — custom analytics event ingestion
│   ├── ai/                   # AI endpoints (generate, moderate, enrich, seo)
│   ├── listings/             # Listing CRUD
│   ├── reviews/              # Review submission
│   ├── events/               # Event CRUD
│   ├── classifieds/          # Classified CRUD
│   ├── forum/                # Forum post CRUD
│   ├── search/               # Unified search
│   ├── webhooks/stripe/      # Stripe webhooks (skip auth verification)
│   └── cron/                 # Vercel Cron endpoints (MUIS sync, enrichment, SEO audit, newsletter)
└── sitemap.ts                # Dynamic sitemap (all verticals)

src/components/               # ui/, listings/, reviews/, maps/, search/, forms/, layout/, admin/
src/lib/                      # supabase/, stripe/, anthropic/, maps/, seo/, analytics/, utils.ts, database.types.ts
src/hooks/                    # Custom React hooks
src/types/                    # Shared TypeScript types
src/config/                   # Constants, enums, taxonomies (cuisines, areas, verticals)
design/stitch/                # Stitch HTML exports (design reference, NEVER delete)
docs/                         # PRD.md, AI_DASHBOARD.md, ANALYTICS_SPEC.md
supabase/
├── migrations/               # Numbered SQL migration files
├── seed/                     # Data seeding scripts (MUIS, mosques, sample data)
└── functions/                # Supabase Edge Functions (scheduled tasks)
```

## Database Tables (key tables — full schema in migrations)

**Core:** `listings` (base, all verticals), `listings_food` (food extension), `listings_catering`, `listings_services`, `reviews`, `events`, `classifieds`, `forum_posts`, `forum_replies`, `mosques`, `prayer_rooms`, `products`, `users`, `user_profiles`

**AI Command Centre:** `ai_content_drafts` (all AI content: blog, travel, social, newsletter), `ai_prompts` (versioned prompt templates), `ai_moderation_log`, `ai_enrichment_queue`, `ai_seo_audit`, `ai_cost_log`, `ai_activity_log`

**Analytics:** `analytics_events` (custom event tracker — event_type, session_id, page_url, referrer, listing_id, listing_category, listing_area, search_term, source_channel, device_type, utm params)

**All tables require RLS policies.** Public read for published content, authenticated write for owned content, admin-only for AI tables.

## Architecture Rules

- **pSEO pages**: ISR with `revalidate = 1800` (high-traffic) or `3600` (long-tail). ALL data fetched in Server Components. NEVER client-side fetch on pSEO pages.
- **PostGIS**: All coordinates as `geography(Point, 4326)`. Spatial indexes on all listing tables. Use `ST_DPoint` for distance queries.
- **AI calls**: Server Actions only. NEVER expose Anthropic API key to client. Use Sonnet for speed tasks (moderation, meta gen, descriptions), Opus for quality tasks (blog posts, travel guides). Cache identical prompts 24h.
- **Analytics tracking**: Client-side `trackEvent()` fires POST to `/api/track`. Auto-tracks page views on route change. Parses UTMs from URL. Anonymous session IDs via cookie (no PII).
- **Stripe webhooks**: `/api/webhooks/stripe` must skip auth verification. Validate webhook signatures server-side.
- **Slug generation**: `slugify(name + "-" + area)`, unique constraint on `(vertical, slug)`.
- **Halal status enum**: `muis_certified | muslim_owned | self_declared | not_applicable`. MUIS is highest trust tier.
- **JSON-LD schema**: Every pSEO page MUST have appropriate schema (LocalBusiness, Restaurant, Event, Product, FAQPage, BreadcrumbList).
- **Meta tags**: Every page MUST have `generateMetadata()`. Pattern: `[Primary Keyword] | HumbleHalal`.
- **NEVER edit `database.types.ts`** — always regenerate via Supabase CLI.
- **ALWAYS match Stitch designs** — open `design/stitch/*.html` for the source-of-truth Tailwind classes.

## Env Vars (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # Server only
ANTHROPIC_API_KEY=                  # Server only
STRIPE_SECRET_KEY=                  # Server only
STRIPE_WEBHOOK_SECRET=              # Server only
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
GOOGLE_MAPS_API_KEY=                # Server only
RESEND_API_KEY=                     # Server only
BEEHIIV_API_KEY=                    # Server only
BEEHIIV_PUBLICATION_ID=             # Server only
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
SENTRY_DSN=
NEXT_PUBLIC_GA_MEASUREMENT_ID=
```

## Cron Jobs (Vercel Cron via `vercel.json` or Supabase pg_cron)

| Job | Schedule | Endpoint |
|-----|----------|----------|
| MUIS Cert Sync | Weekly Sun 2am SGT | `/api/cron/muis-sync` |
| Google Places Refresh | Monthly 1st 4am | `/api/cron/places-refresh` |
| Listing Freshness Score | Weekly Mon 3am | `/api/cron/freshness-check` |
| Closure Detection | Monthly 15th 4am | `/api/cron/closure-detect` |
| Newsletter Draft | Weekly Wed 6am | `/api/cron/newsletter-draft` |
| SEO Audit (500 pages) | Daily 5am | `/api/cron/seo-audit` |
| GSC Data Pull | Daily 6am | `/api/cron/gsc-pull` |
| Ahrefs Data Pull | Weekly Mon 6am | `/api/cron/ahrefs-pull` |
| Morning Briefing Build | Daily 7am | `/api/cron/morning-briefing` |
| Analytics Rollup | Daily 1am | `/api/cron/analytics-rollup` |

## Newsletter Cross-Promotion

Beehiiv = separate brand. UTM required on all cross-links: `?utm_source=humblehalal&utm_medium=directory&utm_campaign=[page-type]`. Track newsletter attribution via `analytics_events.source_channel = 'newsletter'`.
