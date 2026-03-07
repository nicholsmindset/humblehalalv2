import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ISR_REVALIDATE, SingaporeArea } from '@/config'
import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema'

export const revalidate = ISR_REVALIDATE.LONG_TAIL

interface Props {
  searchParams: Promise<{ area?: string; q?: string; page?: string }>
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
  const { area, q, page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1', 10))
  const offset = (page - 1) * PAGE_SIZE

  const supabase = await createClient()

  let query = supabase
    .from('mosques')
    .select('id, slug, name, area, address, facilities, prayer_room_available, wheelchair_accessible, photos', { count: 'exact' })
    .order('name', { ascending: true })
    .range(offset, offset + PAGE_SIZE - 1)

  if (area) query = query.eq('area', area)
  if (q) query = query.ilike('name', `%${q}%`)

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

      {/* Grid */}
      {!mosques || mosques.length === 0 ? (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-5xl text-charcoal/20 block mb-4">mosque</span>
          <p className="text-charcoal/50 font-medium">No mosques found.</p>
          <Link href="/mosque" className="text-primary text-sm hover:underline mt-3 block">Clear filters</Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {mosques.map((m: any) => (
              <Link
                key={m.id}
                href={`/mosque/${m.slug}`}
                className="group bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all overflow-hidden flex flex-col"
              >
                {/* Photo or placeholder */}
                <div className="relative h-40 bg-emerald-50 flex items-center justify-center overflow-hidden">
                  {m.photos?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.photos[0]} alt={m.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <span className="material-symbols-outlined text-5xl text-primary/30">mosque</span>
                  )}
                </div>
                <div className="p-4 flex flex-col gap-2 flex-1">
                  <h2 className="font-bold text-charcoal text-sm leading-snug">{m.name}</h2>
                  <div className="flex items-center gap-1 text-xs text-charcoal/50">
                    <span className="material-symbols-outlined text-sm text-charcoal/30">location_on</span>
                    <span className="capitalize">{m.area?.replace(/-/g, ' ')}</span>
                  </div>
                  {/* Facilities */}
                  {m.facilities && m.facilities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-auto">
                      {(m.facilities as string[]).slice(0, 3).map((f) => (
                        <span key={f} className="bg-warm-white text-charcoal/60 text-[10px] px-2 py-0.5 rounded-full border border-gray-100 capitalize">
                          {f.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Badges */}
                  <div className="flex gap-2 mt-1">
                    {m.prayer_room_available && (
                      <span className="flex items-center gap-0.5 text-[10px] text-primary font-medium">
                        <span className="material-symbols-outlined text-xs">wc</span>
                        Prayer room
                      </span>
                    )}
                    {m.wheelchair_accessible && (
                      <span className="flex items-center gap-0.5 text-[10px] text-primary font-medium">
                        <span className="material-symbols-outlined text-xs">accessible</span>
                        Accessible
                      </span>
                    )}
                  </div>
                </div>
              </Link>
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

      <BreadcrumbSchema items={[
        { name: 'Home', href: '/' },
        { name: 'Mosques' },
      ]} />

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
