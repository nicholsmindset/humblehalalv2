'use client'

import { useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

interface UsePaginationReturn {
  page: number
  goTo: (page: number) => void
  nextPage: () => void
  prevPage: () => void
  pageUrl: (page: number) => string
}

export function usePagination(totalPages?: number): UsePaginationReturn {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const page = Math.max(1, Number(searchParams.get('page') ?? 1))

  const pageUrl = useCallback((p: number): string => {
    const params = new URLSearchParams(searchParams.toString())
    if (p <= 1) {
      params.delete('page')
    } else {
      params.set('page', String(p))
    }
    const qs = params.toString()
    return `${pathname}${qs ? `?${qs}` : ''}`
  }, [pathname, searchParams])

  const goTo = useCallback((p: number) => router.push(pageUrl(p)), [pageUrl, router])
  const nextPage = useCallback(() => {
    if (totalPages === undefined || page < totalPages) goTo(page + 1)
  }, [goTo, page, totalPages])
  const prevPage = useCallback(() => { if (page > 1) goTo(page - 1) }, [goTo, page])

  return { page, goTo, nextPage, prevPage, pageUrl }
}
