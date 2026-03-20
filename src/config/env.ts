/**
 * Typed environment variable validation.
 * Throws at build/startup time if required vars are missing.
 */

function requireEnv(name: string): string {
  const val = process.env[name]
  if (!val) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return val
}

function optionalEnv(name: string, defaultValue = ''): string {
  return process.env[name] ?? defaultValue
}

// ── Public (exposed to browser) ─────────────────────────────
export const env = {
  NEXT_PUBLIC_SUPABASE_URL:       requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY:  requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: optionalEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'),
  NEXT_PUBLIC_POSTHOG_KEY:        optionalEnv('NEXT_PUBLIC_POSTHOG_KEY'),
  NEXT_PUBLIC_POSTHOG_HOST:       optionalEnv('NEXT_PUBLIC_POSTHOG_HOST', 'https://app.posthog.com'),
  NEXT_PUBLIC_GA_MEASUREMENT_ID:  optionalEnv('NEXT_PUBLIC_GA_MEASUREMENT_ID'),

  // ── Server-only (never exposed to browser) ─────────────────
  SUPABASE_SERVICE_ROLE_KEY: optionalEnv('SUPABASE_SERVICE_ROLE_KEY'),
  ANTHROPIC_API_KEY:         optionalEnv('ANTHROPIC_API_KEY'),
  STRIPE_SECRET_KEY:         optionalEnv('STRIPE_SECRET_KEY'),
  STRIPE_WEBHOOK_SECRET:     optionalEnv('STRIPE_WEBHOOK_SECRET'),
  GOOGLE_MAPS_API_KEY:       optionalEnv('GOOGLE_MAPS_API_KEY'),
  RESEND_API_KEY:            optionalEnv('RESEND_API_KEY'),
  BEEHIIV_API_KEY:           optionalEnv('BEEHIIV_API_KEY'),
  BEEHIIV_PUBLICATION_ID:    optionalEnv('BEEHIIV_PUBLICATION_ID'),
  SENTRY_DSN:                optionalEnv('SENTRY_DSN'),
  CRON_SECRET:               optionalEnv('CRON_SECRET'),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: optionalEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY'),
  TURNSTILE_SECRET_KEY:      optionalEnv('TURNSTILE_SECRET_KEY'),
  LITEAPI_API_KEY:           optionalEnv('LITEAPI_API_KEY'),
  LITEAPI_SANDBOX_KEY:       optionalEnv('LITEAPI_SANDBOX_KEY'),
  UPSTASH_REDIS_REST_URL:    optionalEnv('UPSTASH_REDIS_REST_URL'),
  UPSTASH_REDIS_REST_TOKEN:  optionalEnv('UPSTASH_REDIS_REST_TOKEN'),
} as const

export type Env = typeof env
