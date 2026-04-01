'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { track } from '@/lib/analytics/tracker'

/**
 * Fires a page_view event on every route change.
 * Mount once in a client component near the root layout.
 */
export function usePageTracking() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const previous = useRef<string | null>(null)

  useEffect(() => {
    const current = pathname + searchParams.toString()
    if (current === previous.current) return
    previous.current = current
    track.pageView()
  }, [pathname, searchParams])
}
