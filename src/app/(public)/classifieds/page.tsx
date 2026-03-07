import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ISR_REVALIDATE, SingaporeArea } from '@/config'

export const revalidate = ISR_REVALIDATE.HIGH_TRAFFIC

interface Props {
  searchParams: Promise<{ category?: string; area?: string; page?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { category, area } = await searchParams
  const base = category
    ? `${CATEGORY_LABELS[category] ?? category} Classifieds`
    : 'Muslim Classifieds Singapore'
  const desc = `Browse halal and Muslim-friendly ${category ?? 'buy, sell and swap'} listings${area ? ` in ${area.replace(/-/g, ' ')}` : ' across Singapore'}.`
  return {
    title: `${base} | HumbleHalal`,
    description: desc,
  }
}

const CATEGORY_LABELS: Record<string, string> = {
  jobs:       'Jobs & Careers',
  housing:    'Housing & Rentals',
  services:   'Services',
  items:      'Buy & Sell',
  vehicles:   'Vehicles',
  matrimony:  'Matrimony',
  education:  'Education & Tuition',
  other:      'Other',
}

const CATEGORY_ICONS: Record<string, string> = {
  jobs:      'work',
  housing:   'home',
  services:  'handyman',
  items:     'sell',
  vehicles:  'directions_car',
  matrimony: 'favorite',
  education: 'school',
  other:     'more_horiz',
}

const PAGE_SIZE = 24

export default async function ClassifiedsPage({ searchParams }: Props) {
  const { category, area, page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1', 10))
  const offset = (page - 1) * PAGE_SIZE
  const supabase = await createClient()

  let query = (supabase as any)
    .from('classifieds')
    .select('id, slug, title, category, price, currency, condition, area, images, created_at', { count: 'exact' })
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (category) query = query.eq('category', category)
  if (area) query = query.eq('area', area)

  const { data: rows, count } = (await query) as any
  const listings = (rows ?? []) as any[]
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  function buildHref(params: Record<string, string | undefined>) {
    const p = new URLSearchParams()
    Object.entries({ category, area, ...params }).forEach(([k, v]) => { if (v) p.set(k, v) })
    const qs = p.toString()
    return `/classifieds${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <header className="mb-8">
        <nav className="text-sm text-charcoal/50 mb-3">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span className="mx-2">›</span>
          {category ? (
            <>
              <Link href="/classifieds" className="hover:text-primary">Classifieds</Link>
              <span className="mx-2">›</span>
              <span className="text-charcoal">{CATEGORY_LABELS[category] ?? category}</span>
            </>
          ) : (
            <span className="text-charcoal">Classifieds</span>
          )}
        </nav>
        <h1 className="text-3xl font-extrabold text-charcoal font-sans">
          {category ? CATEGORY_LABELS[category] ?? category : 'Muslim Classifieds Singapore'}
        </h1>
        <p className="text-charcoal/50 text-sm mt-1">
          {(count ?? 0).toLocaleString()} listing{(count ?? 0) !== 1 ? 's' : ''} available
        </p>
      </header>

      {/* Category tiles — show when not filtered */}
      {!category && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <Link
              key={key}
              href={`/classifieds?category=${key}`}
              className="flex flex-col items-center gap-2 bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-primary/30 transition-all text-center"
            >
              <span className="material-symbols-outlined text-2xl text-primary">{CATEGORY_ICONS[key]}</span>
              <span className="text-xs font-medium text-charcoal">{label}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Area filter chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link
          href={buildHref({ area: undefined, page: undefined })}
          className={`text-xs font-medium px-3 py-1 rounded-full border transition-colors ${
            !area ? 'border-primary text-primary bg-primary/5' : 'border-gray-200 text-charcoal/60 hover:border-primary/50'
          }`}
        >
          All areas
        </Link>
        {Object.values(SingaporeArea).slice(0, 12).map((a) => (
          <Link
            key={a}
            href={buildHref({ area: a, page: undefined })}
            className={`text-xs font-medium px-3 py-1 rounded-full border transition-colors capitalize ${
              area === a ? 'border-primary text-primary bg-primary/5' : 'border-gray-200 text-charcoal/60 hover:border-primary/50'
            }`}
          >
            {a.replace(/-/g, ' ')}
          </Link>
        ))}
      </div>

      {/* Listings grid */}
      {listings.length === 0 ? (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-5xl text-charcoal/20 block mb-4">sell</span>
          <p className="text-charcoal/50 font-medium">No listings found.</p>
          <Link href="/classifieds" className="text-primary text-sm hover:underline mt-2 block">Clear filters</Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-10">
            {listings.map((item: any) => (
              <Link
                key={item.id}
                href={`/classifieds/${item.slug}`}
                className="group bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all overflow-hidden flex flex-col"
              >
                {/* Image / placeholder */}
                <div className="h-36 overflow-hidden bg-gray-50 relative">
                  {item.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-3xl text-charcoal/20">
                        {CATEGORY_ICONS[item.category] ?? 'sell'}
                      </span>
                    </div>
                  )}
                  {item.condition && (
                    <span className="absolute top-2 left-2 bg-white/90 text-charcoal text-[10px] font-medium px-2 py-0.5 rounded-full capitalize">
                      {item.condition}
                    </span>
                  )}
                </div>

                <div className="p-3 flex flex-col gap-1.5 flex-1">
                  <h2 className="font-semibold text-charcoal text-sm leading-snug line-clamp-2">{item.title}</h2>
                  {item.price != null && (
                    <p className="text-accent font-extrabold text-base">
                      {item.currency ?? 'SGD'} {Number(item.price).toLocaleString()}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-auto pt-1">
                    {item.area && (
                      <span className="text-charcoal/40 text-xs capitalize">{item.area.replace(/-/g, ' ')}</span>
                    )}
                    <span className="text-charcoal/30 text-xs ml-auto">
                      {new Date(item.created_at).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <nav className="flex justify-center gap-2" aria-label="Pagination">
              {page > 1 && (
                <Link href={buildHref({ page: String(page - 1) })} className="px-4 py-2 rounded-lg border border-gray-200 text-sm hover:border-primary transition-colors">
                  ← Prev
                </Link>
              )}
              <span className="px-4 py-2 text-sm text-charcoal/60">Page {page} of {totalPages}</span>
              {page < totalPages && (
                <Link href={buildHref({ page: String(page + 1) })} className="px-4 py-2 rounded-lg border border-gray-200 text-sm hover:border-primary transition-colors">
                  Next →
                </Link>
              )}
            </nav>
          )}
        </>
      )}

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: category ? CATEGORY_LABELS[category] : 'Muslim Classifieds Singapore',
            numberOfItems: listings.length,
            itemListElement: listings.map((item: any, i: number) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: item.title,
              url: `https://humblehalal.sg/classifieds/${item.slug}`,
            })),
          }),
        }}
      />
    </div>
  )
}
