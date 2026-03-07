'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SignupCompletePage() {
  const router = useRouter()
  const [status, setStatus] = useState<'saving' | 'done' | 'error'>('saving')

  useEffect(() => {
    async function completeSignup() {
      const raw = localStorage.getItem('hh_signup_pending')
      if (!raw) {
        router.replace('/dashboard')
        return
      }

      try {
        const { displayName, marketingConsent, consentDate } = JSON.parse(raw)
        const res = await fetch('/api/user/complete-signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ displayName, marketingConsent, consentDate }),
        })

        if (res.ok) {
          localStorage.removeItem('hh_signup_pending')
          setStatus('done')
          setTimeout(() => router.replace('/dashboard'), 1200)
        } else {
          setStatus('error')
        }
      } catch {
        setStatus('error')
      }
    }
    completeSignup()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-white px-4">
      <div className="bg-white rounded-xl border border-gray-200 p-8 w-full max-w-sm shadow-sm text-center">
        {status === 'saving' && (
          <>
            <span className="material-symbols-outlined text-5xl text-primary block mb-4 animate-pulse">
              person_add
            </span>
            <p className="font-bold text-charcoal">Setting up your account…</p>
          </>
        )}
        {status === 'done' && (
          <>
            <span className="material-symbols-outlined text-5xl text-primary block mb-4">
              check_circle
            </span>
            <p className="font-bold text-charcoal">Welcome to HumbleHalal!</p>
            <p className="text-sm text-charcoal/60 mt-1">Redirecting to your dashboard…</p>
          </>
        )}
        {status === 'error' && (
          <>
            <span className="material-symbols-outlined text-5xl text-amber-500 block mb-4">
              warning
            </span>
            <p className="font-bold text-charcoal">Almost there!</p>
            <p className="text-sm text-charcoal/60 mt-1 mb-4">
              Your account is ready, but we couldn&apos;t save all preferences. You can update them
              in your settings.
            </p>
            <a
              href="/dashboard"
              className="inline-block bg-primary text-white font-bold px-6 py-2.5 rounded-lg text-sm hover:bg-primary/90 transition-colors"
            >
              Go to dashboard
            </a>
          </>
        )}
      </div>
    </div>
  )
}
