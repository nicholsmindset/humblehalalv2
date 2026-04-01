# HumbleHalal — Security Hardening Spec

> **File:** `docs/SECURITY.md`
> **Status:** Implement before launch
> **Date:** 7 March 2026
> **Principle:** Defence in depth — every layer assumes the layer above has failed

---

## 1. Threat Model

As a Singapore-based platform handling hotel bookings, event ticket payments, and community data, HumbleHalal faces these threats ranked by likelihood:

| Threat | Target | Impact | Likelihood |
|--------|--------|--------|-----------|
| Brute force login | `/api/auth/*` | Account takeover | High |
| Credential stuffing | Login endpoint | Mass account compromise | High |
| Spam/bot submissions | Reviews, forum, classifieds, event submissions | Content pollution, SEO damage | High |
| API abuse | `/api/track`, `/api/search`, `/api/travel/*` | Server overload, cost explosion (LiteAPI calls) | Medium |
| XSS injection | User-generated content (reviews, forum, classifieds) | Session hijack, data theft | Medium |
| CSRF | State-changing actions (booking, review submission) | Unauthorised actions on behalf of users | Medium |
| Admin panel breach | `/admin/*` | Full platform compromise, data exfiltration | Medium |
| SQL injection | Any user input hitting Supabase | Database compromise | Low (Supabase parameterised queries) |
| DDoS | Entire site | Downtime | Low (Vercel edge network absorbs most) |
| Payment data theft | Checkout flows | Financial fraud | Low (Stripe/LiteAPI handle payment data, not us) |

---

## 2. Brute Force Protection

### 2.1 Rate Limiting Architecture

Use **Upstash Redis** for distributed rate limiting that works on Vercel's serverless/edge runtime. Supabase alone can't do this efficiently at the middleware level.

```bash
npm install @upstash/ratelimit @upstash/redis
```

**Env vars to add:**
```
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

### 2.2 Rate Limit Tiers

| Endpoint Group | Limit | Window | Identifier | Block Duration |
|---------------|-------|--------|-----------|---------------|
| **Auth: login/signup/reset** | 5 requests | 15 minutes | IP address | 15 min lockout |
| **Auth: magic link request** | 3 requests | 10 minutes | Email address | 30 min lockout |
| **API: review submission** | 5 reviews | 1 hour | User ID | 1 hour |
| **API: forum post** | 10 posts | 1 hour | User ID | 1 hour |
| **API: classified submission** | 5 listings | 1 hour | User ID | 1 hour |
| **API: event submission** | 3 events | 1 hour | User ID | 1 hour |
| **API: search** | 30 requests | 1 minute | IP address | 1 min cooldown |
| **API: track (analytics)** | 100 events | 1 minute | Session ID | 1 min cooldown |
| **API: travel/search (LiteAPI)** | 10 requests | 1 minute | IP + User | 5 min cooldown |
| **API: prebook/book** | 5 requests | 10 minutes | User ID | 10 min lockout |
| **Admin: all routes** | 60 requests | 1 minute | Admin user ID | 1 min cooldown |
| **General: all other API** | 60 requests | 1 minute | IP address | 1 min cooldown |

### 2.3 Implementation

```typescript
// src/lib/security/rate-limit.ts

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Auth endpoints — strictest limits
export const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(5, '15 m'),
  prefix: 'rl:auth',
  analytics: true,
});

// Content submission — moderate limits
export const contentLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(5, '1 h'),
  prefix: 'rl:content',
  analytics: true,
});

// Search / general API — relaxed limits
export const searchLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '1 m'),
  prefix: 'rl:search',
  analytics: true,
});

// LiteAPI calls — protect from cost explosion
export const travelLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(10, '1 m'),
  prefix: 'rl:travel',
  analytics: true,
});

// Helper function for API routes
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const result = await limiter.limit(identifier);
  return {
    success: result.success,
    remaining: result.remaining,
    reset: result.reset,
  };
}
```

### 2.4 Rate Limit Response Headers

All API responses include:
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 1709827200
```

When rate limited, return `429 Too Many Requests`:
```json
{
  "error": "Too many requests. Please try again later.",
  "retryAfter": 900
}
```

### 2.5 Account Lockout (Supabase Auth)

Supabase Auth already has built-in rate limiting (configurable in `config.toml`):

```toml
[auth.rate_limit]
sign_in_sign_ups = 30          # per 5 min per IP — LOWER THIS to 10
token_refresh = 150            # per 5 min per IP
token_verifications = 30       # per 5 min per IP
email_sent = 2                 # per hour — keep low to prevent email bombing
```

**Update config.toml:**
```toml
sign_in_sign_ups = 10   # Reduced from 30
```

---

## 3. CAPTCHA Protection

### 3.1 Cloudflare Turnstile (Free, Privacy-Friendly)

Use Turnstile instead of reCAPTCHA — it's free, privacy-respecting, and doesn't require users to solve puzzles.

```bash
npm install @marsidev/react-turnstile
```

**Env vars:**
```
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=          # Server only
```

### 3.2 Where to Add CAPTCHA

| Action | CAPTCHA Type | Why |
|--------|-------------|-----|
| **Signup** | Invisible (managed mode) | Block bot account creation |
| **Login (after 3 failed attempts)** | Interactive (visible widget) | Block credential stuffing |
| **Review submission** | Invisible | Block review spam |
| **Forum post (new users only)** | Invisible | Block forum spam, remove after 5 approved posts |
| **Classified submission** | Invisible | Block fake listings |
| **Event submission** | Invisible | Block spam events |
| **Contact form** | Interactive | Block contact spam |
| **Hotel booking** | None (payment is the barrier) | Low risk |
| **Event ticket purchase** | None (payment is the barrier) | Low risk |

### 3.3 Server-Side Verification

Every CAPTCHA token must be verified server-side before processing:

```typescript
// src/lib/security/captcha.ts

export async function verifyCaptcha(token: string): Promise<boolean> {
  const response = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
      }),
    }
  );
  const data = await response.json();
  return data.success === true;
}
```

---

## 4. Security Headers

### 4.1 next.config.ts

```typescript
const securityHeaders = [
  // Prevent clickjacking — site cannot be embedded in iframes
  { key: 'X-Frame-Options', value: 'DENY' },

  // Prevent MIME type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },

  // Control referrer information
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },

  // Force HTTPS for 1 year + all subdomains
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },

  // Restrict browser features
  {
    key: 'Permissions-Policy',
    value: 'camera=(self), microphone=(), geolocation=(self), payment=(self)'
  },

  // DNS prefetch for performance
  { key: 'X-DNS-Prefetch-Control', value: 'on' },

  // Content Security Policy
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://www.googletagmanager.com https://cdn.vercel-insights.com https://payment-wrapper.liteapi.travel https://js.stripe.com https://us.i.posthog.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https: http:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.liteapi.travel https://book.liteapi.travel https://api.stripe.com https://us.i.posthog.com https://www.google-analytics.com https://challenges.cloudflare.com",
      "frame-src https://challenges.cloudflare.com https://js.stripe.com https://hooks.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; ')
  },
];

// In next.config.ts
const nextConfig = {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};
```

---

## 5. CSRF Protection

### 5.1 Edge CSRF for Server Actions and API Routes

```bash
npm install edge-csrf
```

### 5.2 Middleware Integration

Add CSRF protection to `src/middleware.ts` — the token is generated per-request and validated on all POST/PUT/DELETE mutations:

```typescript
// In middleware.ts — add alongside existing auth middleware
import csrf from 'edge-csrf';

const csrfProtect = csrf({
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    name: '__csrf',
    sameSite: 'strict',
  },
});
```

### 5.3 Exempt Routes

CSRF is NOT applied to:
- `/api/webhooks/stripe` — Stripe verifies via webhook signature
- `/api/track` — analytics ingestion (uses session hash, no state change)
- `/api/cron/*` — cron jobs (protected by `CRON_SECRET` header)

---

## 6. XSS Prevention

### 6.1 Input Sanitisation

All user-generated content (reviews, forum posts, classifieds, event descriptions) is sanitised before storage AND before rendering.

```bash
npm install isomorphic-dompurify
```

```typescript
// src/lib/security/sanitise.ts
import DOMPurify from 'isomorphic-dompurify';

export function sanitiseHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  });
}

export function sanitisePlainText(dirty: string): string {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}
```

### 6.2 Where to Sanitise

| Content Type | Sanitise Method | When |
|-------------|----------------|------|
| Review body | `sanitiseHTML` | On submission (Server Action) AND on render |
| Forum post body | `sanitiseHTML` | On submission AND on render |
| Forum reply | `sanitiseHTML` | On submission AND on render |
| Classified description | `sanitiseHTML` | On submission AND on render |
| Event description | `sanitiseHTML` | On submission AND on render |
| Display name | `sanitisePlainText` | On signup AND on profile update |
| Search queries | `sanitisePlainText` | Before database query |
| All other text inputs | `sanitisePlainText` | On submission |

### 6.3 Output Encoding

React's JSX already escapes output by default. NEVER use `dangerouslySetInnerHTML` unless the content has been sanitised by DOMPurify first.

---

## 7. SQL Injection Prevention

### 7.1 Supabase Parameterised Queries

Supabase JS client uses parameterised queries by default — you are safe if you:

- **ALWAYS use the Supabase client** (`.from('table').select()`, `.insert()`, `.update()`)
- **NEVER build raw SQL strings** with user input concatenation
- **NEVER use `.rpc()` with unsanitised user input** in the SQL body

### 7.2 RLS as Defence in Depth

Row Level Security policies ensure that even if a query is manipulated, the database only returns data the user is authorised to see. This is already implemented in your Step 6 migration.

---

## 8. Admin Panel Security

### 8.1 Multi-Layer Protection

The `/admin` panel is HumbleHalal's most sensitive surface. It gets 4 layers of protection:

**Layer 1 — Middleware Auth Check:**
Middleware redirects to `/login` if not authenticated or `user_profiles.is_admin !== true`.

**Layer 2 — Rate Limiting:**
Admin routes have their own rate limiter (60 req/min per admin user).

**Layer 3 — Session Validation:**
Every admin Server Action re-verifies the session is valid and the user is still an admin. No cached auth checks.

**Layer 4 — Audit Log:**
Every admin action is logged to `ai_activity_log` with: action type, admin user_id, timestamp, metadata (what was changed).

### 8.2 Admin Safeguards

- Admin role can only be granted via direct database update (no UI to self-promote)
- Supabase Dashboard IP restrictions (if available on your plan)
- Admin session timeout: 2 hours of inactivity (configurable in Supabase Auth)

---

## 9. API Security

### 9.1 Cron Job Protection

All `/api/cron/*` endpoints verify a shared secret:

```typescript
// In every cron API route
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorised', { status: 401 });
  }
  // ... cron logic
}
```

Vercel Cron automatically sends this header. Manual calls require the secret.

### 9.2 Webhook Signature Verification

**Stripe webhooks** (`/api/webhooks/stripe`):
```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature')!;

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    // Process event
  } catch (err) {
    return new Response('Invalid signature', { status: 400 });
  }
}
```

### 9.3 LiteAPI Key Protection

- LiteAPI key is NEVER exposed to the client
- All LiteAPI calls go through server-side API routes
- Rate limited to prevent cost explosion (10 req/min per user)

---

## 10. File Upload Security

### 10.1 Rules

| Rule | Implementation |
|------|---------------|
| Max file size | 2MB (enforced client-side AND server-side) |
| Allowed types | `image/jpeg`, `image/png`, `image/webp`, `image/gif` only |
| File validation | Check magic bytes header, don't trust file extension alone |
| Storage | Supabase Storage with signed URLs (not public bucket URLs) |
| Filename | Generate random UUID filename, never use original filename |
| Metadata stripping | Strip EXIF data before storage (location, device info) |

### 10.2 EXIF Stripping

```bash
npm install sharp
```

```typescript
// src/lib/security/image.ts
import sharp from 'sharp';

export async function processUpload(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .rotate()           // Auto-rotate based on EXIF then strip
    .withMetadata({})   // Remove all EXIF/metadata
    .webp({ quality: 80 })
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .toBuffer();
}
```

---

## 11. Monitoring & Alerting

### 11.1 Sentry (Error Tracking)

Already configured. Additionally:
- Enable Sentry Performance Monitoring for API route latency
- Set alerts for: 5xx error spike, auth failure spike, new error type

### 11.2 Upstash Redis Analytics

Upstash rate limiter has built-in analytics. Monitor:
- Rate limit hit frequency by endpoint
- Top blocked IPs
- Auth endpoint abuse patterns

### 11.3 Supabase Audit Logs

Enable Supabase Database Webhooks for:
- Any changes to `user_profiles.is_admin`
- Any direct SQL access to AI tables
- Bulk deletions (>10 rows)

### 11.4 Security Alerts to Admin

Build into the Morning Briefing (`/admin`):
- "Rate limit blocks in last 24h: X"
- "Failed login attempts: X"
- "Flagged content by AI moderator: X"
- "New admin actions logged: X"

---

## 12. Dependency Security

### 12.1 Automated Audits

```json
// package.json scripts
{
  "audit": "npm audit --production",
  "audit:fix": "npm audit fix --production"
}
```

### 12.2 GitHub Dependabot

Enable in `.github/dependabot.yml`:
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
```

### 12.3 Secret Scanning

```bash
npm install -D secretlint @secretlint/secretlint-rule-preset-recommend
```

Add to pre-commit hook or CI:
```bash
npx secretlint "**/*"
```

---

## 13. npm Packages to Add

| Package | Purpose |
|---------|---------|
| `@upstash/ratelimit` | Distributed rate limiting (works on Vercel Edge) |
| `@upstash/redis` | Redis client for rate limiting |
| `@marsidev/react-turnstile` | Cloudflare Turnstile CAPTCHA (React component) |
| `edge-csrf` | CSRF protection in Next.js middleware |
| `isomorphic-dompurify` | HTML sanitisation (XSS prevention) |
| `sharp` | Image processing (EXIF stripping, resize, WebP conversion) |
| `secretlint` (dev) | Secret scanning in codebase |

---

## 14. Env Vars to Add

```
# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# CAPTCHA (Cloudflare Turnstile)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
```

---

## 15. CLAUDE.md Additions

```
## Security

- Rate limiting via Upstash Redis (@upstash/ratelimit). Auth endpoints: 5 req/15min. Search: 30 req/min. LiteAPI: 10 req/min. Always check rate limit BEFORE processing the request.
- CAPTCHA via Cloudflare Turnstile on: signup, login (after 3 fails), review/forum/classified/event submissions. Always verify server-side via Turnstile API.
- CSRF via edge-csrf in middleware. Exempt: /api/webhooks/stripe, /api/track, /api/cron/*.
- XSS: sanitise ALL user input with isomorphic-dompurify before storage AND before render. Never dangerouslySetInnerHTML without DOMPurify.
- SQL injection: ALWAYS use Supabase client methods. NEVER concatenate user input into SQL strings.
- File uploads: max 2MB, image/* only, strip EXIF with sharp, generate UUID filenames, convert to WebP.
- Cron jobs: verify Bearer {CRON_SECRET} header on all /api/cron/* routes.
- Stripe webhooks: verify signature with stripe.webhooks.constructEvent(). Skip auth middleware.
- Admin panel: 4 layers — middleware auth + rate limit + session re-verify + audit log.
- Security headers set in next.config.ts: X-Frame-Options DENY, HSTS, CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.
- New deps: @upstash/ratelimit, @upstash/redis, @marsidev/react-turnstile, edge-csrf, isomorphic-dompurify, sharp
- New env vars: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, NEXT_PUBLIC_TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY
```

---

## 16. Implementation Priority

| Priority | Task | When |
|----------|------|------|
| **P0** | Security headers in next.config.ts | Now (Step 5-8) |
| **P0** | Supabase Auth rate limits in config.toml | Now (already started) |
| **P0** | RLS policies on all tables | Now (Step 6) |
| **P1** | Upstash rate limiting on auth + API routes | Before launch |
| **P1** | Turnstile CAPTCHA on signup + content submission | Before launch |
| **P1** | DOMPurify sanitisation on all user inputs | Before launch |
| **P1** | CSRF protection via edge-csrf | Before launch |
| **P1** | Stripe webhook signature verification | Before payments go live |
| **P1** | Cron job secret header check | Before cron jobs go live |
| **P2** | EXIF stripping on image uploads | Before photo uploads go live |
| **P2** | File type validation (magic bytes) | Before photo uploads go live |
| **P2** | Dependabot + secret scanning | Before public GitHub repo |
| **P2** | Security monitoring in admin dashboard | After admin dashboard built |
| **P3** | CSP nonce implementation (stricter than unsafe-inline) | Post-launch hardening |
| **P3** | Supabase IP restrictions for admin | Post-launch hardening |

---

*Defence in depth. Trust nothing. Verify everything.*
