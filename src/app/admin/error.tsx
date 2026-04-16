'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import Link from 'next/link'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error, { tags: { surface: 'admin' } })
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6 py-20">
      <div className="max-w-xl w-full text-center">
        <span className="material-symbols-outlined text-accent text-6xl">warning</span>
        <h2 className="mt-6 text-2xl font-extrabold text-charcoal">Admin Command Centre error</h2>
        <p className="mt-3 text-charcoal/70">
          An error occurred in the admin dashboard. Check Sentry for details.
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-charcoal/40 font-mono">Error ID: {error.digest}</p>
        )}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-6 py-3 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
          <Link
            href="/admin"
            className="px-6 py-3 rounded-lg bg-white border border-gray-200 text-charcoal font-bold hover:bg-gray-50 transition-colors"
          >
            Back to briefing
          </Link>
        </div>
      </div>
    </div>
  )
}
