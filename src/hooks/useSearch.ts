'use client'

import { useEffect, useState } from 'react'
import { useDebounce } from './useDebounce'

interface SearchResult {
  id: string
  name: string
  slug: string
  vertical: string
  area?: string
  halal_status?: string
}

interface UseSearchReturn {
  query: string
  setQuery: (q: string) => void
  results: SearchResult[]
  isLoading: boolean
  error: string | null
  clear: () => void
}

export function useSearch(initialQuery = ''): UseSearchReturn {
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (!debouncedQuery.trim() || debouncedQuery.length < 2) {
      setResults([])
      return
    }

    const controller = new AbortController()
    setIsLoading(true)
    setError(null)

    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&limit=8`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        setResults(data.results ?? [])
        setIsLoading(false)
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError('Search failed')
          setIsLoading(false)
        }
      })

    return () => controller.abort()
  }, [debouncedQuery])

  function clear() {
    setQuery('')
    setResults([])
    setError(null)
  }

  return { query, setQuery, results, isLoading, error, clear }
}
