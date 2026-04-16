import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ISR_REVALIDATE, SingaporeArea } from '@/config'
import { MosqueCard } from '@/components/mosques/MosqueCard'

export const revalidate = ISR_REVALIDATE.LONG_TAIL

const SORT_OPTIONS = [
  { key: 'name', label: 'A–Z', icon: 'sort_by_alpha' },
  { key: 'newest', label: 'Newest', icon: 'schedule' },
] as const

interface Props {
  searchParams: Promise<{ area?: string; q?: string; page?: string; sort?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { area } = await searchParams
  const areaLabel = area ? area.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : ''
  return {
    title: area
      ? `Mosques in ${areaLabel}, Singapore | HumbleHalal`
      : 'Mosques in Singapore — Complete Directory | HumbleHalal',
    description: `Find mosques${area ? ` in ${areaLabel}` : ' across Singapore'} with prayer times, facilities, and directions. Comprehensive MUIS mosque directory.`,
  }
}

const PAGE_SIZE = 24

export default async function MosquePage({ searchParams }: Props) {
  const { area, q, page: pageStr, sort = 'name' } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1', 10))
  const offset = (page - 1) * PAGE_SIZE

  const supabase = await createClient()

  let query = supabase
    .from('mosques')
    .select('id, slug, name, area, address, facilities, prayer_room_available, wheelchair_accessible, photos', { count: 'exact' })
    .range(offset, offset + PAGE_SIZE - 1)

  if (area) query = query.eq('area', area)
  if (q) query = query.ilike('name', `%${q}%`)

  if (sort === 'newest') {
    query = query.order('created_at', { ascending: false })
  } else {
    query = query.order('name', { ascending: true })
  }

  const { data: mosques, count } = (await query) as any
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-charcoal font-sans mb-2">
          {area
            ? `Mosques in ${area.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}`
            : 'Mosques in Singapore'}
        </h1>
        <p className="text-charcoal/50 text-sm">{count ?? 0} mosques found</p>
      </header>

      {/* Area filter chips */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Link
          href="/mosque"
          className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
            !area ? 'bg-primary text-white border-primary' : 'bg-white text-charcoal border-gray-200 hover:border-primary'
          }`}
        >
          All Areas
        </Link>
        {Object.values(SingaporeArea).slice(0, 16).map((a) => (
          <Link
            key={a}
            href={`/mosque?area=${a}`}
            className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors capitalize ${
              area === a
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-charcoal border-gray-200 hover:border-primary'
            }`}
          >
            {a.replace(/-/g, ' ')}
          </Link>
        ))}
      </div>

      {/* Sort options */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xs text-charcoal/40 font-medium">Sort:</span>
        {SORT_OPTIONS.map((opt) => (
          <Link
            key={opt.key}
            href={`/mosque?${new URLSearchParams({ ...(area ? { area } : {}), sort: opt.key }).toString()}`}
            className={`inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              sort === opt.key
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-charcoal/70 border-gray-200 hover:border-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[11px]">{opt.icon}</span>
            {opt.label}
          </Link>
        ))}
      </div>

      {/* Grid */}
      {!mosques || mosques.length === 0 ? (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-5xl text-charcoal/20 block mb-4">mosque</span>
          <p className="text-charcoal/50 font-medium">No mosques found.</p>
          <Link href="/mosque" className="text-primary text-sm hover:underline mt-3 block">Clear filters</Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            {mosques.map((m: any) => (
              <MosqueCard
                key={m.id}
                slug={m.slug}
                name={m.name}
                area={m.area}
                address={m.address}
                facilities={m.facilities}
                capacity={m.capacity}
                wheelchair_accessible={m.wheelchair_accessible}
                prayer_room_available={m.prayer_room_available}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <nav className="flex justify-center gap-2" aria-label="Pagination">
              {page > 1 && (
                <Link href={`/mosque?page=${page - 1}${area ? `&area=${area}` : ''}`} className="px-4 py-2 rounded-lg border border-gray-200 text-sm hover:border-primary transition-colors">
                  ← Prev
                </Link>
              )}
              <span className="px-4 py-2 text-sm text-charcoal/60">Page {page} of {totalPages}</span>
              {page < totalPages && (
                <Link href={`/mosque?page=${page + 1}${area ? `&area=${area}` : ''}`} className="px-4 py-2 rounded-lg border border-gray-200 text-sm hover:border-primary transition-colors">
                  Next →
                </Link>
              )}
            </nav>
          )}
        </>
      )}

      {/* pSEO cross-links */}
      <section className="mt-16 border-t border-gray-100 pt-10">
        <h2 className="text-lg font-bold text-charcoal mb-4">Find Mosques by Area</h2>
        <div className="flex flex-wrap gap-2">
          {Object.values(SingaporeArea).map((a) => (
            <Link key={a} href={`/mosque?area=${a}`} className="text-sm text-primary hover:underline capitalize">
              Mosques in {a.replace(/-/g, ' ')}
            </Link>
          ))}
        </div>
      </section>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: area ? `Mosques in ${area}` : 'Mosques in Singapore',
            numberOfItems: mosques?.length ?? 0,
            itemListElement: (mosques ?? []).map((m: any, i: number) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: m.name,
              url: `https://humblehalal.sg/mosque/${m.slug}`,
            })),
          }),
        }}
      />
    </div>
  )
}
