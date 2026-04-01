'use client'

import { useCallback, useMemo } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

interface Filters {
  area?: string
  cuisine?: string
  category?: string
  halal_status?: string
  q?: string
  page?: number
}

interface UseFiltersReturn {
  filters: Filters
  setFilter: (key: keyof Filters, value: string | number | undefined) => void
  clearFilters: () => void
  buildUrl: (overrides?: Partial<Filters>) => string
}

export function useFilters(): UseFiltersReturn {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const filters = useMemo<Filters>(() => ({
    area:         searchParams.get('area') ?? undefined,
    cuisine:      searchParams.get('cuisine') ?? undefined,
    category:     searchParams.get('category') ?? undefined,
    halal_status: searchParams.get('halal_status') ?? undefined,
    q:            searchParams.get('q') ?? undefined,
    page:         searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
  }), [searchParams])

  const buildUrl = useCallback((overrides: Partial<Filters> = {}): string => {
    const merged = { ...filters, ...overrides }
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(merged)) {
      if (v !== undefined && v !== null && v !== '') {
        params.set(k, String(v))
      }
    }
    const qs = params.toString()
    return `${pathname}${qs ? `?${qs}` : ''}`
  }, [filters, pathname])

  const setFilter = useCallback((key: keyof Filters, value: string | number | undefined) => {
    const url = buildUrl({ [key]: value, page: undefined })
    router.push(url)
  }, [buildUrl, router])

  const clearFilters = useCallback(() => {
    router.push(pathname)
  }, [pathname, router])

  return { filters, setFilter, clearFilters, buildUrl }
}
