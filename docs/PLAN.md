# Phase 0: Foundation — HumbleHalal.com Implementation Plan

## Context
HumbleHalal.com is Singapore's halal ecosystem directory: food, businesses, events, classifieds, mosques, travel, products, forum, and blog — 10,000+ programmatic SEO pages — operated solo via an AI Command Centre admin dashboard. This Phase 0 plan scaffolds the complete technical foundation before any feature development.

**Stack:** Next.js 14 (App Router, TypeScript strict, RSC) · Supabase (PostgreSQL + PostGIS + RLS) · Tailwind CSS + shadcn/ui · Vercel · Stripe · Resend · Anthropic Claude API

---

## Checklist

### 1. Next.js 14 App Router Scaffold

- [ ] 1.1 `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --yes`
- [ ] 1.2 Enable `"strict": true` in `tsconfig.json`; add `"paths"` aliases: `@/components`, `@/lib`, `@/hooks`, `@/types`, `@/config`
- [ ] 1.3 Create full directory skeleton (see below)
- [ ] 1.4 Install all npm dependencies
- [ ] 1.5 Add `seed`, `seed:muis`, `seed:mosques`, `seed:places` scripts to `package.json`
- [ ] 1.6 Create `src/config/index.ts` with enums: `HalalStatus`, `Vertical`, `SingaporeArea`, `CuisineType`, `BusinessCategory`

**Directory skeleton:**
```
src/app/
  (public)/halal-food/ restaurant/ business/ catering/ events/ classifieds/
  mosque/ prayer-rooms/ prayer-times/ travel/ products/ services/ community/ blog/
  (auth)/
  (dashboard)/
  (business)/
  admin/content/ admin/listings/ admin/moderation/ admin/seo/
  admin/analytics/ admin/reports/ admin/settings/
  api/track/ api/ai/ api/listings/ api/reviews/ api/events/
  api/classifieds/ api/forum/ api/search/ api/webhooks/stripe/ api/cron/
src/components/ui/ listings/ reviews/ maps/ search/ forms/ layout/ admin/
src/lib/supabase/ stripe/ anthropic/ maps/ seo/ analytics/
src/hooks/
src/types/
src/config/
design/stitch/
supabase/migrations/ supabase/seed/ supabase/functions/
```

**npm dependencies:**
```bash
npm install @supabase/supabase-js @supabase/ssr @anthropic-ai/sdk \
  @googlemaps/google-maps-services-js resend stripe @stripe/stripe-js \
  posthog-js @sentry/nextjs @react-pdf/renderer
npm install -D vitest @playwright/test prettier prettier-plugin-tailwindcss
```

---

### 2. Tailwind Config — Design System

- [ ] 2.1 Update `tailwind.config.ts` with brand tokens:
  - `primary: '#047857'` (emerald-700)
  - `accent: '#D4A017'` (gold)
  - `charcoal: '#1C1917'`
  - `warm-white: '#FAFAF8'`
  - `background-dark: '#0f231d'`
  - Font families: `sans: ['Manrope']`, `display: ['Playfair Display']`
- [ ] 2.2 Add Google Fonts import in `src/app/layout.tsx` (Manrope 400–800, Playfair Display 400 italic)
- [ ] 2.3 Add global CSS utilities in `src/app/globals.css`:
  - `.islamic-pattern` — radial-gradient dot pattern #D4A017, 24×24px, opacity 0.1
  - `.frosted-glass` — rgba white 10%, blur(12px), white border
- [ ] 2.4 Add Google Material Symbols Outlined stylesheet link in `<head>`
- [ ] 2.5 Create `design/stitch/README.md` (design system reference)
- [ ] 2.6 Configure `prettier.config.js` with `prettier-plugin-tailwindcss`

---

### 3. shadcn/ui Initialisation

- [ ] 3.1 `npx shadcn@latest init` — TypeScript, App Router, `src/`, CSS variables
- [ ] 3.2 Override CSS variables in `globals.css`: `--primary: #047857`, `--accent: #D4A017`
- [ ] 3.3 Install shadcn components: `button card badge input label select textarea dialog sheet dropdown-menu navigation-menu tabs tooltip separator skeleton avatar`

---

### 4. Supabase Project Init

- [ ] 4.1 `npx supabase init` → creates `supabase/config.toml`
- [ ] 4.2 Configure `supabase/config.toml`:
  - `project_id = "humblehalalv2"`
  - Auth: email (magic link) + Google OAuth
  - `site_url = "https://humblehalal.sg"`
  - `additional_redirect_urls = ["http://localhost:3000/**"]`
  - PostGIS extension enabled

---

### 5. Database Migrations

All migrations in `supabase/migrations/` as numbered `.sql` files.

- [ ] **001** — Extensions (`postgis`, `uuid-ossp`, `pg_cron`) + 4 enums (`halal_status`, `listing_vertical`, `content_status`, `moderation_status`)
- [ ] **002** — `user_profiles` (id FK auth.users, display_name, avatar_url, role)
- [ ] **003** — `listings` (PostGIS `geography(Point,4326)`, spatial index, all fields per spec)
- [ ] **004** — `listings_food`, `listings_catering`, `listings_services` extension tables
- [ ] **005** — `reviews`, `events`, `classifieds`, `forum_posts`, `forum_replies`
- [ ] **006** — `mosques`, `prayer_rooms` (both with PostGIS + spatial indexes)
- [ ] **007** — `analytics_events` (all UTM + session fields, 4 indexes)
- [ ] **008** — AI Command Centre: `ai_content_drafts`, `ai_prompts`, `ai_moderation_log`, `ai_enrichment_queue`, `ai_seo_audit`, `ai_cost_log`, `ai_activity_log`

---

### 6. RLS Policies

- [ ] 6.1 `is_admin()` helper function in DB
- [ ] 6.2 Enable RLS on every table
- [ ] 6.3 `listings` — public SELECT (published), authenticated INSERT/UPDATE (own), admin ALL
- [ ] 6.4 `reviews` — public SELECT (approved), authenticated INSERT, own UPDATE/DELETE, admin ALL
- [ ] 6.5 `events`, `classifieds` — public SELECT, authenticated write (own), admin ALL
- [ ] 6.6 `forum_posts`, `forum_replies` — public SELECT (approved), authenticated INSERT, own UPDATE
- [ ] 6.7 `mosques`, `prayer_rooms` — public SELECT, admin write only
- [ ] 6.8 `user_profiles` — limited public SELECT (display_name, avatar), own UPDATE
- [ ] 6.9 `analytics_events` — service role INSERT only, admin SELECT
- [ ] 6.10 All 7 AI tables — admin only

---

### 7. Supabase Auth Config

- [ ] 7.1 `src/lib/supabase/client.ts` — browser client (`@supabase/ssr`)
- [ ] 7.2 `src/lib/supabase/server.ts` — server client (cookies, RSC + Server Actions)
- [ ] 7.3 `src/lib/supabase/middleware.ts` — session refresh
- [ ] 7.4 `src/middleware.ts` — protect `/admin/**` and `/dashboard/**`
- [ ] 7.5 DB trigger: `on_auth_user_created` → insert `user_profiles(id, role='user')`

---

### 8. Shared Layout Components

- [ ] 8.1 `src/components/layout/Navbar.tsx` — fixed top, frosted, logo (mosque icon + Humble/Halal typography), nav links, gold CTA sign-in, mobile Sheet
- [ ] 8.2 `src/components/layout/Footer.tsx` — charcoal bg, 4-col grid, Islamic pattern overlay
- [ ] 8.3 `src/components/layout/IslamicPattern.tsx` — reusable `.islamic-pattern` wrapper
- [ ] 8.4 `src/components/layout/FrostedGlass.tsx` — reusable `.frosted-glass` wrapper
- [ ] 8.5 `src/app/(public)/layout.tsx` — wraps public pages with Navbar + Footer
- [ ] 8.6 `src/app/admin/layout.tsx` — admin sidebar, server-side role check
- [ ] 8.7 `src/app/layout.tsx` — root layout: Google Fonts, Sentry, PostHog, `<html lang="en">`
- [ ] 8.8 `src/components/ui/MuisBadge.tsx` — `bg-primary text-white text-xs font-bold px-3 py-1 rounded-full`
- [ ] 8.9 `src/components/ui/GoldCta.tsx` — `bg-accent text-charcoal rounded-lg font-bold hover:bg-accent/90`

---

### 9. Environment Variables

- [ ] 9.1 `.env.local.example` committed (all 17 vars blank):
  ```
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=
  ANTHROPIC_API_KEY=
  STRIPE_SECRET_KEY=
  STRIPE_WEBHOOK_SECRET=
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
  GOOGLE_MAPS_API_KEY=
  RESEND_API_KEY=
  BEEHIIV_API_KEY=
  BEEHIIV_PUBLICATION_ID=
  NEXT_PUBLIC_POSTHOG_KEY=
  NEXT_PUBLIC_POSTHOG_HOST=
  SENTRY_DSN=
  NEXT_PUBLIC_GA_MEASUREMENT_ID=
  SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=
  SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=
  CRON_SECRET=
  ```
- [ ] 9.2 `.env.local` gitignored
- [ ] 9.3 `src/config/env.ts` — typed build-time validation (throws if required vars missing)

---

### 10. Vercel Config

- [ ] 10.1 `vercel.json` with all 10 cron jobs (UTC schedules)
- [ ] 10.2 Stub route handlers for all 10 cron endpoints (`GET` returns `{ ok: true }`)
- [ ] 10.3 `src/lib/utils/cron-auth.ts` — `Authorization: Bearer $CRON_SECRET` verification

**Cron schedule (UTC):**
| Job | Path | Schedule |
|-----|------|----------|
| MUIS Cert Sync | `/api/cron/muis-sync` | `0 18 * * 0` (Sun 2am SGT) |
| Places Refresh | `/api/cron/places-refresh` | `0 20 1 * *` (1st 4am SGT) |
| Freshness Check | `/api/cron/freshness-check` | `0 19 * * 1` (Mon 3am SGT) |
| Closure Detect | `/api/cron/closure-detect` | `0 20 15 * *` (15th 4am SGT) |
| Newsletter Draft | `/api/cron/newsletter-draft` | `0 22 * * 3` (Wed 6am SGT) |
| SEO Audit | `/api/cron/seo-audit` | `0 21 * * *` (5am SGT) |
| GSC Pull | `/api/cron/gsc-pull` | `0 22 * * *` (6am SGT) |
| Ahrefs Pull | `/api/cron/ahrefs-pull` | `0 22 * * 1` (Mon 6am SGT) |
| Morning Briefing | `/api/cron/morning-briefing` | `0 23 * * *` (7am SGT) |
| Analytics Rollup | `/api/cron/analytics-rollup` | `0 17 * * *` (1am SGT) |

---

### 11. Git & Initial Commit

- [ ] 11.1 `.gitignore` covers `.env.local`, `node_modules/`, `.next/`, `supabase/.branches/`, `supabase/.temp/`
- [ ] 11.2 Commit: `chore: Phase 0 foundation scaffold`
- [ ] 11.3 Push to `https://github.com/nicholsmindset/humblehalalv2.git`

---

## Verification

1. `npm run dev` → starts on localhost:3000, zero TypeScript errors
2. `npm run build` → clean production build
3. `npm run lint` → ESLint passes
4. `npx supabase start` → local stack starts, PostGIS enabled
5. `npx supabase db reset` → all 8 migrations apply cleanly
6. Visit `/` → Navbar + Footer render with emerald/gold design
7. Visit `/admin` unauthenticated → redirected to `/login`
8. `vercel.json` has 10 cron entries, all stubs return 200
9. `.env.local.example` committed, `.env.local` gitignored
