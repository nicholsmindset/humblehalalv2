'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!termsAccepted) {
      setError('You must agree to the Privacy Policy and Terms of Service to continue.')
      return
    }
    setLoading(true)
    setError(null)

    // Persist signup data so /signup/complete can save it after auth
    localStorage.setItem(
      'hh_signup_pending',
      JSON.stringify({
        displayName: displayName.trim(),
        marketingConsent,
        consentDate: new Date().toISOString(),
      })
    )

    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/signup/complete')}`,
      },
    })

    if (err) {
      setError(err.message)
      setLoading(false)
    } else {
      setSent(true)
    }
  }

  async function handleGoogle() {
    // Store minimal consent data for Google OAuth flow
    localStorage.setItem(
      'hh_signup_pending',
      JSON.stringify({
        displayName: displayName.trim(),
        marketingConsent,
        consentDate: new Date().toISOString(),
      })
    )
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/signup/complete')}`,
      },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-white px-4 py-12">
      <div className="bg-white rounded-xl border border-gray-200 p-8 w-full max-w-md shadow-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <span className="text-3xl">
              <span className="font-extrabold text-charcoal font-sans">Humble</span>
              <span className="italic text-accent font-display">Halal</span>
            </span>
          </Link>
          <p className="text-charcoal/60 mt-2 text-sm">Create your free account</p>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <span className="material-symbols-outlined text-5xl text-primary block">
              mark_email_read
            </span>
            <h2 className="font-bold text-charcoal text-lg">Check your inbox</h2>
            <p className="text-charcoal/60 text-sm">
              We sent a sign-in link to <strong>{email}</strong>. Click it to activate your
              account.
            </p>
            <button
              onClick={() => setSent(false)}
              className="text-primary text-sm hover:underline"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSignup} className="space-y-5">
            {/* Google OAuth */}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={!termsAccepted}
              className="flex items-center justify-center gap-3 w-full border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium text-charcoal hover:border-primary hover:bg-warm-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-charcoal/40 text-xs">or</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Display name */}
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-charcoal mb-1.5">
                Display name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="First name, nickname, or alias"
                maxLength={100}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-charcoal placeholder-charcoal/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="text-xs text-charcoal/40 mt-1">
                This is displayed publicly next to your reviews and posts.
              </p>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-charcoal mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-charcoal placeholder-charcoal/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Consent checkboxes */}
            <div className="space-y-3 pt-1">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 accent-primary"
                />
                <span className="text-sm text-charcoal">
                  I agree to HumbleHalal&apos;s{' '}
                  <Link href="/privacy" target="_blank" className="text-primary underline">
                    Privacy Policy
                  </Link>{' '}
                  and{' '}
                  <Link href="/terms" target="_blank" className="text-primary underline">
                    Terms of Service
                  </Link>{' '}
                  <span className="text-red-500">*</span>
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={marketingConsent}
                  onChange={(e) => setMarketingConsent(e.target.checked)}
                  className="mt-0.5 accent-primary"
                />
                <span className="text-sm text-charcoal/70">
                  Send me the weekly Humble Halal newsletter and halal food picks (optional)
                </span>
              </label>
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !email || !termsAccepted}
              className="w-full bg-primary text-white rounded-lg py-2.5 text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending…' : 'Create account'}
            </button>

            <p className="text-center text-xs text-charcoal/50">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
