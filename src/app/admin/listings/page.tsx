import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Vertical } from '@/config'

export const metadata: Metadata = { title: 'Listings | HumbleHalal Admin' }
export const dynamic = 'force-dynamic'

const STATUS_STYLES: Record<string, string> = {
  active:   'bg-primary/20 text-primary',
  pending:  'bg-accent/20 text-accent',
  draft:    'bg-white/10 text-white/40',
  archived: 'bg-red-500/10 text-red-400',
}

const PAGE_SIZE = 30

interface Props {
  searchParams: Promise<{ q?: string; vertical?: string; status?: string; page?: string }>
}

export default async function ListingsPage({ searchParams }: Props) {
  const { q, vertical, status, page } = await searchParams
  const pageNum = Math.max(1, Number(page) || 1)
  const offset = (pageNum - 1) * PAGE_SIZE

  const supabase = await createClient()

  let query = (supabase as any)
    .from('listings')
    .select('id, slug, name, area, vertical, status, halal_status, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (q) query = query.ilike('name', `%${q}%`)
  if (vertical) query = query.eq('vertical', vertical)
  if (status) query = query.eq('status', status)

  const { data: rows, count } = (await query) as any
  const listings = (rows ?? []) as any[]
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  function buildUrl(params: Record<string, string | undefined>) {
    const p = new URLSearchParams()
    Object.entries({ q, vertical, status, ...params }).forEach(([k, v]) => {
      if (v) p.set(k, v)
    })
    const qs = p.toString()
    return `/admin/listings${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Listings</h1>
          <p className="text-white/40 text-sm mt-1">{(count ?? 0).toLocaleString()} total listings</p>
        </div>
      </div>

      {/* Filters */}
      <form method="GET" action="/admin/listings" className="flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={q ?? ''}
          placeholder="Search by name…"
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 w-60"
        />
        <select
          name="vertical"
          defaultValue={vertical ?? ''}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">All verticals</option>
          {Object.values(Vertical).map((v) => (
            <option key={v} value={v} className="bg-charcoal capitalize">{v}</option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={status ?? ''}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">All statuses</option>
          <option value="active"  className="bg-charcoal">Active</option>
          <option value="pending" className="bg-charcoal">Pending</option>
          <option value="draft"   className="bg-charcoal">Draft</option>
          <option value="archived" className="bg-charcoal">Archived</option>
        </select>
        <button
          type="submit"
          className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-bold hover:bg-primary/90 transition-colors"
        >
          Filter
        </button>
        {(q || vertical || status) && (
          <Link
            href="/admin/listings"
            className="flex items-center text-white/40 text-sm px-3 py-2 hover:text-white transition-colors"
          >
            Clear
          </Link>
        )}
      </form>

      {/* Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-white/40 text-xs font-medium uppercase tracking-wider">
              <th className="text-left px-5 py-3">Name</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Vertical</th>
              <th className="text-left px-4 py-3 hidden lg:table-cell">Area</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3 hidden xl:table-cell">Created</th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {listings.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-white/40">
                  No listings found.
                </td>
              </tr>
            ) : (
              listings.map((l: any) => (
                <tr key={l.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-white font-medium truncate max-w-[200px]">{l.name}</p>
                    <p className="text-white/30 text-xs truncate max-w-[200px]">{l.slug}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-white/60 capitalize text-xs">{l.vertical}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-white/60 text-xs capitalize">
                      {l.area?.replace(/-/g, ' ') ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[l.status] ?? 'bg-white/10 text-white/40'}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell text-white/30 text-xs">
                    {new Date(l.created_at).toLocaleDateString('en-SG')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/restaurant/${l.slug}`}
                      target="_blank"
                      className="text-white/20 hover:text-primary transition-colors"
                      title="View listing"
                    >
                      <span className="material-symbols-outlined text-base">open_in_new</span>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-white/40">
            Page {pageNum} of {totalPages} · {(count ?? 0).toLocaleString()} listings
          </p>
          <div className="flex gap-2">
            {pageNum > 1 && (
              <Link
                href={buildUrl({ page: String(pageNum - 1) })}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                ← Prev
              </Link>
            )}
            {pageNum < totalPages && (
              <Link
                href={buildUrl({ page: String(pageNum + 1) })}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
