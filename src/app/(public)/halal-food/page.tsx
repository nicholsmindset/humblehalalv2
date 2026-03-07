import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listings/ListingCard'
import { ISR_REVALIDATE, HalalStatus, SingaporeArea } from '@/config'
import type { ListingCardProps } from '@/components/listings/ListingCard'
import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema'

export const revalidate = ISR_REVALIDATE.HIGH_TRAFFIC

interface Props {
  searchParams: Promise<{ area?: string; cuisine?: string; q?: string; page?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { area, cuisine } = await searchParams

  const parts = ['Halal Food']
  if (cuisine) parts.push(cuisine.charAt(0).toUpperCase() + cuisine.slice(1))
  parts.push('Singapore')
  if (area) parts.push(`— ${area.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}`)

  const title = parts.join(' ')
  const description = `Find ${cuisine ? cuisine + ' ' : ''}halal restaurants${area ? ` in ${area.replace(/-/g, ' ')}` : ' across Singapore'}. MUIS-certified listings with reviews, menus, and directions.`

  return { title, description }
}

const PAGE_SIZE = 24

const CUISINE_LABELS: Record<string, string> = {
  malay: 'Malay', indian: 'Indian', chinese: 'Chinese', korean: 'Korean',
  japanese: 'Japanese', turkish: 'Turkish', 'middle-eastern': 'Middle Eastern',
  western: 'Western', mediterranean: 'Mediterranean', thai: 'Thai',
  indonesian: 'Indonesian', buffet: 'Buffet', seafood: 'Seafood',
  dessert: 'Dessert', cafe: 'Café', bakery: 'Bakery', mamak: 'Mamak',
}

const AREA_LABELS: Record<string, string> = {
  'arab-street': 'Arab Street', tampines: 'Tampines', 'jurong-east': 'Jurong East',
  woodlands: 'Woodlands', bugis: 'Bugis', bedok: 'Bedok', yishun: 'Yishun',
  orchard: 'Orchard', sengkang: 'Sengkang', punggol: 'Punggol',
  hougang: 'Hougang', clementi: 'Clementi', 'toa-payoh': 'Toa Payoh',
}

export default async function HalalFoodPage({ searchParams }: Props) {
  const { area, cuisine, q, page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1', 10))
  const offset = (page - 1) * PAGE_SIZE

  const supabase = await createClient()

  // Build query
  let query = supabase
    .from('listings')
    .select(`
      id, slug, name, vertical, area, address, halal_status,
      avg_rating, review_count, photos, featured,
      listings_food ( cuisine_types, price_range )
    `, { count: 'exact' })
    .eq('vertical', 'food')
    .eq('status', 'active')
    .order('featured', { ascending: false })
    .order('avg_rating', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (area) query = query.eq('area', area)
  if (q) query = query.ilike('name', `%${q}%`)

  const { data: rows, count } = await query
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  // Map to card props
  const listings: ListingCardProps[] = ((rows ?? []) as any[]).map((r) => {
    const food = Array.isArray(r.listings_food) ? r.listings_food[0] : r.listings_food
    return {
      id: r.id,
      slug: r.slug,
      name: r.name,
      vertical: r.vertical,
      area: r.area,
      address: r.address ?? '',
      halal_status: r.halal_status as HalalStatus,
      avg_rating: Number(r.avg_rating ?? 0),
      review_count: r.review_count ?? 0,
      photos: r.photos as string[] | undefined,
      cuisine_types: food?.cuisine_types as string[] | undefined,
      price_range: food?.price_range ?? null,
      is_featured: r.featured ?? false,
    }
  })

  const heading = [
    cuisine ? CUISINE_LABELS[cuisine] ?? cuisine : null,
    'Halal Restaurants',
    area ? `in ${AREA_LABELS[area] ?? area}` : 'in Singapore',
  ].filter(Boolean).join(' ')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-charcoal font-sans mb-2">{heading}</h1>
        <p className="text-charcoal/50 text-sm">
          {count ?? 0} halal restaurants found
        </p>
      </header>

      {/* Filters row */}
      <div className="flex flex-wrap gap-2 mb-8">
        {/* Area chips */}
        {Object.entries(AREA_LABELS).map(([val, label]) => (
          <Link
            key={val}
            href={`/halal-food?area=${val}${cuisine ? `&cuisine=${cuisine}` : ''}`}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors border ${
              area === val
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-charcoal border-gray-200 hover:border-primary'
            }`}
          >
            {label}
          </Link>
        ))}
        {area && (
          <Link
            href={`/halal-food${cuisine ? `?cuisine=${cuisine}` : ''}`}
            className="rounded-full px-3 py-1.5 text-xs font-medium text-charcoal/60 hover:text-primary"
          >
            Clear ×
          </Link>
        )}
      </div>

      {/* Cuisine tabs */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-100 pb-4">
        <Link
          href={`/halal-food${area ? `?area=${area}` : ''}`}
          className={`text-sm font-medium px-3 py-1 rounded-full ${!cuisine ? 'text-primary font-bold' : 'text-charcoal/60 hover:text-primary'}`}
        >
          All
        </Link>
        {Object.entries(CUISINE_LABELS).map(([val, label]) => (
          <Link
            key={val}
            href={`/halal-food?cuisine=${val}${area ? `&area=${area}` : ''}`}
            className={`text-sm font-medium px-3 py-1 rounded-full transition-colors ${
              cuisine === val ? 'text-primary font-bold' : 'text-charcoal/60 hover:text-primary'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Listings grid */}
      {listings.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-10">
            {listings.map((l) => (
              <ListingCard key={l.id} {...l} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="flex justify-center gap-2" aria-label="Pagination">
              {page > 1 && (
                <Link
                  href={`/halal-food?page=${page - 1}${area ? `&area=${area}` : ''}${cuisine ? `&cuisine=${cuisine}` : ''}`}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm hover:border-primary transition-colors"
                >
                  ← Prev
                </Link>
              )}
              <span className="px-4 py-2 text-sm text-charcoal/60">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`/halal-food?page=${page + 1}${area ? `&area=${area}` : ''}${cuisine ? `&cuisine=${cuisine}` : ''}`}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm hover:border-primary transition-colors"
                >
                  Next →
                </Link>
              )}
            </nav>
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-5xl text-charcoal/20 block mb-4">search_off</span>
          <p className="text-charcoal/50 font-medium">No listings found.</p>
          <p className="text-charcoal/40 text-sm mt-1">Try a different area or cuisine.</p>
          <Link href="/halal-food" className="text-primary text-sm hover:underline mt-4 block">
            Clear filters
          </Link>
        </div>
      )}

      {/* pSEO cross-links */}
      <section className="mt-16 border-t border-gray-100 pt-10">
        <h2 className="text-lg font-bold text-charcoal mb-4">Explore by Area</h2>
        <div className="flex flex-wrap gap-2">
          {Object.values(SingaporeArea).slice(0, 12).map((a) => (
            <Link
              key={a}
              href={`/halal-food?area=${a}`}
              className="text-sm text-primary hover:underline capitalize"
            >
              Halal food in {a.replace(/-/g, ' ')}
            </Link>
          ))}
        </div>
      </section>

      <BreadcrumbSchema items={[
        { name: 'Home', href: '/' },
        { name: 'Halal Food' },
      ]} />

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: heading,
            numberOfItems: listings.length,
            itemListElement: listings.map((l, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: l.name,
              url: `https://humblehalal.sg/restaurant/${l.slug}`,
            })),
          }),
        }}
      />
    </div>
  )
}
