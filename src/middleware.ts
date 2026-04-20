import { type NextRequest, NextResponse } from 'next/server'
import { createCsrfProtect } from '@edge-csrf/nextjs'
import { updateSession } from '@/lib/supabase/middleware'
import { authLimiter, searchLimiter, checkLimit, getIdentifier } from '@/lib/security/rate-limit'

const PROTECTED_ROUTES = ['/admin', '/dashboard']
const AUTH_ROUTES = ['/login', '/signup']

// CSRF paths to skip (webhooks, analytics ingestion, cron jobs, travel APIs)
const CSRF_SKIP_PATHS = ['/api/webhooks', '/api/track', '/api/cron', '/api/travel']

const csrfProtect = createCsrfProtect({
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    name: '_csrf',
    sameSite: 'strict',
  },
})

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)
  const { pathname } = request.nextUrl

  // ── Rate limiting on auth endpoints ────────────────────────────
  if (pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/api/auth')) {
    const ip = getIdentifier(request)
    const result = await checkLimit(authLimiter, ip)
    if (result.limited) return result.response
  }

  // ── Rate limiting on search/general API ────────────────────────
  if (pathname.startsWith('/api/search')) {
    const ip = getIdentifier(request)
    const result = await checkLimit(searchLimiter, ip)
    if (result.limited) return result.response
  }

  // ── CSRF protection for state-changing requests ──────────────────
  const shouldCheckCsrf =
    !CSRF_SKIP_PATHS.some((p) => pathname.startsWith(p)) &&
    pathname.startsWith('/api')

  if (shouldCheckCsrf) {
    const csrfError = await csrfProtect(request, supabaseResponse)
    if (csrfError) {
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
    }
  }

  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r))
  const isAuth = AUTH_ROUTES.some((r) => pathname.startsWith(r))

  // Unauthenticated → redirect to login
  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Logged-in user hitting auth pages → send to dashboard
  if (isAuth && user) {
    const homeUrl = request.nextUrl.clone()
    homeUrl.pathname = '/dashboard'
    return NextResponse.redirect(homeUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files and API routes
     * that don't need session handling.
     */
    '/((?!_next/static|_next/image|favicon.ico|api/webhooks|api/track).*)',
  ],
}
