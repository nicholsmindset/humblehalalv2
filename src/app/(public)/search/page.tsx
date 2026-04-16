export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

interface Props {
  searchParams: { q?: string; vertical?: string }
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = searchParams.q?.trim() ?? ''
  return {
    title: q ? `Search results for "${q}" | HumbleHalal` : 'Search | HumbleHalal',
    robots: { index: false },
  }
}

const VERTICAL_LABELS: Record<string, string> = {
  food:     'Restaurant',
  catering: 'Catering',
  services: 'Service',
  products: 'Product',
  business: 'Business',
}

const VERTICALS = [
  { key: '',        label: 'All' },
  { key: 'food',    label: 'Food' },
  { key: 'mosque',  label: 'Mosques' },
  { key: 'events',  label: 'Events' },
]

function listingHref(vertical: string, slug: string): string {
  if (vertical === 'food') return `/restaurant/${slug}`
  return `/business/${vertical}/${slug}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-SG', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default async function SearchPage({ searchParams }: Props) {
  const q = searchParams.q?.trim() ?? ''
  const vertical = searchParams.vertical ?? ''

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://humblehalal.sg' },
      { '@type': 'ListItem', position: 2, name: 'Search', item: 'https://humblehalal.sg/search' },
    ],
  }

  if (!q) {
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <main className="min-h-screen bg-warm-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <span className="material-symbols-outlined text-5xl text-charcoal/20 block mb-4">search</span>
            <h1 className="text-2xl font-extrabold text-charcoal mb-3">Search HumbleHalal</h1>
            <p className="text-charcoal/50 mb-8">Find halal restaurants, mosques, events and more.</p>
            <form action="/search" method="get">
              <div className="flex gap-2 max-w-lg mx-auto">
                <input
                  name="q"
                  type="search"
                  placeholder="e.g. nasi lemak, Tampines mosque…"
                  autoFocus
                  className="flex-1 px-4 h-12 rounded-xl border border-gray-300 text-charcoal text-base focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="submit"
                  className="bg-primary text-white font-bold px-6 h-12 rounded-xl hover:bg-primary/90 transition-colors shrink-0"
                >
                  Search
                </button>
              </div>
            </form>
            <div className="mt-10 flex flex-wrap gap-3 justify-center">
              {['Halal food', 'Mosques', 'Events', 'Catering'].map((label) => (
                <Link
                  key={label}
                  href={`/search?q=${encodeURIComponent(label)}`}
                  className="bg-white border border-gray-200 rounded-full px-4 py-2 text-sm text-charcoal hover:border-primary hover:text-primary transition-colors"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </main>
      </>
    )
  }

  const supabase = await createClient()
  const pattern = `%${q}%`
  const shouldInclude = (v: string) => !vertical || vertical === v

  const listingsPromise = shouldInclude('food') || shouldInclude('business')
    ? (supabase as any)
        .from('listings')
        .select('id, name, slug, vertical, area, halal_status, avg_rating')
        .eq('status', 'active')
        .ilike('name', pattern)
        .limit(8)
    : Promise.resolve({ data: [] })

  const eventsPromise = shouldInclude('events')
    ? (supabase as any)
        .from('events')
        .select('id, slug, title, area, start_datetime, is_ticketed')
        .eq('status', 'active')
        .ilike('title', pattern)
        .limit(5)
    : Promise.resolve({ data: [] })

  const mosquesPromise = shouldInclude('mosque')
    ? (supabase as any)
        .from('mosques')
        .select('id, slug, name, area')
        .ilike('name', pattern)
        .limit(5)
    : Promise.resolve({ data: [] })

  const [
    { data: listings },
    { data: events },
    { data: mosques },
  ] = await Promise.all([
    listingsPromise,
    eventsPromise,
    mosquesPromise,
  ])

  const totalResults =
    (listings?.length ?? 0) +
    (events?.length ?? 0) +
    (mosques?.length ?? 0)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen bg-warm-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

          {/* Search bar */}
          <form action="/search" method="get" className="flex gap-2 mb-6">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/40 text-sm">search</span>
              <input
                name="q"
                type="search"
                defaultValue={q}
                placeholder="Search halal restaurants, mosques, events…"
                className="w-full pl-9 pr-4 h-11 rounded-xl border border-gray-300 text-charcoal text-base focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {vertical && <input type="hidden" name="vertical" value={vertical} />}
            </div>
            <button
              type="submit"
              className="bg-primary text-white font-bold px-5 h-11 rounded-xl hover:bg-primary/90 transition-colors shrink-0 text-sm"
            >
              Search
            </button>
          </form>

          {/* Result count + heading */}
          <h1 className="text-xl font-extrabold text-charcoal mb-1">
            {totalResults > 0
              ? `${totalResults} result${totalResults !== 1 ? 's' : ''} for "${q}"`
              : `No results for "${q}"`}
          </h1>

          {/* Vertical filter tabs */}
          <div className="flex gap-2 flex-wrap mt-4 mb-8">
            {VERTICALS.map(({ key, label }) => {
              const isActive = key === vertical
              const href = key
                ? `/search?q=${encodeURIComponent(q)}&vertical=${key}`
                : `/search?q=${encodeURIComponent(q)}`
              return (
                <Link
                  key={key}
                  href={href}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-charcoal/60 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </Link>
              )
            })}
          </div>

          {totalResults === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <span className="material-symbols-outlined text-4xl text-charcoal/20 block mb-3">search_off</span>
              <p className="font-bold text-charcoal/60 mb-1">No results found for &ldquo;{q}&rdquo;</p>
              <p className="text-charcoal/40 text-sm">Try a different keyword or browse a category below.</p>
              <div className="mt-6 flex flex-wrap gap-3 justify-center">
                <Link href="/halal-food" className="bg-primary/10 text-primary rounded-full px-4 py-2 text-sm font-medium hover:bg-primary/20 transition-colors">Halal Food</Link>
                <Link href="/events" className="bg-primary/10 text-primary rounded-full px-4 py-2 text-sm font-medium hover:bg-primary/20 transition-colors">Events</Link>
                <Link href="/mosque" className="bg-primary/10 text-primary rounded-full px-4 py-2 text-sm font-medium hover:bg-primary/20 transition-colors">Mosques</Link>
              </div>
            </div>
          ) : (
            <div className="space-y-8">

              {/* Listings */}
              {listings && listings.length > 0 && (
                <section>
                  <h2 className="text-base font-semibold text-charcoal mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">restaurant</span>
                    Halal Restaurants &amp; Businesses
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(listings as {id:string;name:string;slug:string;vertical:string;area:string|null;halal_status:string|null;avg_rating:number|null}[]).map((l) => (
                      <Link
                        key={l.id}
                        href={listingHref(l.vertical, l.slug)}
                        className="bg-white rounded-xl border border-gray-200 hover:shadow-md hover:-translate-y-0.5 transition-all p-4 flex items-start gap-3"
                      >
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-primary text-lg">
                            {l.vertical === 'food' ? 'restaurant' : 'store'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-charcoal text-sm truncate">{l.name}</p>
                          <p className="text-charcoal/50 text-xs capitalize">{l.vertical === 'food' ? 'Restaurant' : (VERTICAL_LABELS[l.vertical] ?? l.vertical)}{l.area ? ` · ${l.area.replace(/-/g, ' ')}` : ''}</p>
                        </div>
                        {l.halal_status === 'muis_certified' && (
                          <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full shrink-0">MUIS</span>
                        )}
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Events */}
              {events && events.length > 0 && (
                <section>
                  <h2 className="text-base font-semibold text-charcoal mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">event</span>
                    Events
                  </h2>
                  <div className="space-y-2">
                    {(events as {id:string;slug:string;title:string;area:string|null;start_datetime:string;is_ticketed:boolean}[]).map((ev) => (
                      <Link
                        key={ev.id}
                        href={`/events/${ev.slug}`}
                        className="bg-white rounded-xl border border-gray-200 hover:shadow-md hover:-translate-y-0.5 transition-all p-4 flex items-center justify-between gap-3"
                      >
                        <div>
                          <p className="font-bold text-charcoal text-sm">{ev.title}</p>
                          <p className="text-charcoal/50 text-xs">
                            {formatDate(ev.start_datetime)}
                            {ev.area ? ` · ${ev.area.replace(/-/g, ' ')}` : ''}
                          </p>
                        </div>
                        <span className={`shrink-0 text-xs font-bold px-2.5 py-0.5 rounded-full ${ev.is_ticketed ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'}`}>
                          {ev.is_ticketed ? 'Ticketed' : 'Free'}
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Mosques */}
              {mosques && mosques.length > 0 && (
                <section>
                  <h2 className="text-base font-semibold text-charcoal mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">mosque</span>
                    Mosques
                  </h2>
                  <div className="space-y-2">
                    {(mosques as {id:string;slug:string;name:string;area:string|null}[]).map((m) => (
                      <Link
                        key={m.id}
                        href={`/mosque/${m.slug}`}
                        className="bg-white rounded-xl border border-gray-200 hover:shadow-md hover:-translate-y-0.5 transition-all p-4 flex items-center gap-3"
                      >
                        <span className="material-symbols-outlined text-primary">mosque</span>
                        <div>
                          <p className="font-bold text-charcoal text-sm">{m.name}</p>
                          {m.area && <p className="text-charcoal/50 text-xs capitalize">{m.area.replace(/-/g, ' ')}</p>}
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

            </div>
          )}
        </div>
      </main>
    </>
  )
}
