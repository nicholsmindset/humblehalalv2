'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface SearchItem {
  id: string
  slug?: string
  name?: string
  title?: string
  area?: string
}

interface SearchResult {
  vertical: string
  items: SearchItem[]
}

const VERTICAL_ICONS: Record<string, string> = {
  food:       'restaurant',
  mosque:     'mosque',
  events:     'event',
  classifieds: 'sell',
}

const VERTICAL_LABELS: Record<string, string> = {
  food:        'Restaurant',
  mosque:      'Mosque',
  events:      'Event',
  classifieds: 'Classified',
}

function itemHref(vertical: string, item: SearchItem): string {
  if (vertical === 'food') return `/restaurant/${item.slug}`
  if (vertical === 'mosque') return `/mosque/${item.slug}`
  if (vertical === 'events') return `/events/${item.slug}`
  if (vertical === 'classifieds') return `/classifieds/${item.slug}`
  return '#'
}

function itemLabel(item: SearchItem): string {
  return item.name ?? item.title ?? ''
}

export default function SearchBar({ placeholder = 'Search halal food, mosques, events…', className = '' }: {
  placeholder?: string
  className?: string
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)

  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Flatten results for keyboard nav
  const flatItems = results.flatMap((r) =>
    r.items.map((item) => ({ vertical: r.vertical, item }))
  )

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setOpen(false); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      if (!res.ok) return
      const data = await res.json()
      const nonEmpty: SearchResult[] = (data.results ?? []).filter((r: SearchResult) => r.items.length > 0)
      setResults(nonEmpty)
      setOpen(nonEmpty.length > 0)
      setActive(-1)
    } finally {
      setLoading(false)
    }
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 280)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setOpen(false)
    router.push(`/halal-food?q=${encodeURIComponent(query.trim())}`)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, flatItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, -1))
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault()
      const { vertical, item } = flatItems[active]
      setOpen(false)
      router.push(itemHref(vertical, item))
    } else if (e.key === 'Escape') {
      setOpen(false)
      setActive(-1)
    }
  }

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} role="search">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/30 text-xl pointer-events-none">
            search
          </span>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (results.length > 0) setOpen(true) }}
            placeholder={placeholder}
            autoComplete="off"
            aria-label="Search"
            aria-expanded={open}
            aria-controls="search-dropdown"
            role="combobox"
            className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 bg-white text-sm text-charcoal placeholder-charcoal/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all shadow-sm"
          />
          {loading ? (
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/30 text-xl animate-spin">
              refresh
            </span>
          ) : query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setResults([]); setOpen(false); inputRef.current?.focus() }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/30 hover:text-charcoal transition-colors"
              aria-label="Clear search"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          )}
        </div>
      </form>

      {/* Dropdown */}
      {open && flatItems.length > 0 && (
        <div
          id="search-dropdown"
          role="listbox"
          className="absolute top-full mt-2 left-0 right-0 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto"
        >
          {results.map((group) => (
            <div key={group.vertical}>
              <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
                <span className="text-[10px] font-bold text-charcoal/40 uppercase tracking-wider">
                  {VERTICAL_LABELS[group.vertical] ?? group.vertical}s
                </span>
              </div>
              {group.items.map((item) => {
                const globalIdx = flatItems.findIndex(
                  (f) => f.vertical === group.vertical && f.item.id === item.id
                )
                return (
                  <Link
                    key={item.id}
                    href={itemHref(group.vertical, item)}
                    role="option"
                    aria-selected={active === globalIdx}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      active === globalIdx ? 'bg-primary/5 text-primary' : 'text-charcoal hover:bg-gray-50'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-base shrink-0 ${
                      active === globalIdx ? 'text-primary' : 'text-charcoal/30'
                    }`}>
                      {VERTICAL_ICONS[group.vertical] ?? 'search'}
                    </span>
                    <span className="flex-1 truncate">{itemLabel(item)}</span>
                    {item.area && (
                      <span className="text-charcoal/30 text-xs capitalize shrink-0">
                        {item.area.replace(/-/g, ' ')}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}

          {/* View all results */}
          <div className="px-4 py-2.5 border-t border-gray-100">
            <button
              type="button"
              onClick={handleSubmit as any}
              className="text-primary text-xs font-medium hover:underline"
            >
              View all results for &ldquo;{query}&rdquo; →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
