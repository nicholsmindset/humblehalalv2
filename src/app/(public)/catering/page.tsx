import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listings/ListingCard'
import { generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo/schema'
import { ISR_REVALIDATE, HalalStatus, SingaporeArea, SITE_URL } from '@/config'
import type { ListingCardProps } from '@/components/listings/ListingCard'

export const revalidate = ISR_REVALIDATE.LONG_TAIL

interface Props {
  searchParams: Promise<{ area?: string; type?: string; q?: string; page?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { area, type } = await searchParams

  const parts = ['Halal Catering']
  if (type) parts.push(type.charAt(0).toUpperCase() + type.slice(1))
  parts.push('Singapore')
  if (area) parts.push(`— ${area.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}`)

  const title = parts.join(' ')
  const description = `Find MUIS-certified halal catering services${area ? ` in ${area.replace(/-/g, ' ')}` : ' across Singapore'} for weddings, corporate events, and gatherings.`

  return {
    title,
    description,
    openGraph: { title, description },
  }
}

const PAGE_SIZE = 24

const TYPE_LABELS: Record<string, string> = {
  wedding: 'Wedding Catering',
  corporate: 'Corporate Events',
  buffet: 'Buffet Catering',
  nasi_padang: 'Nasi Padang',
  bento: 'Bento & Boxed Meals',
  bbq: 'BBQ & Grill',
  malay: 'Malay Cuisine',
  indian: 'Indian Cuisine',
  mixed: 'Mixed Cuisine',
  delivery: 'Delivery Catering',
}

const AREA_LABELS: Record<string, string> = {
  'arab-street': 'Arab Street', tampines: 'Tampines', 'jurong-east': 'Jurong East',
  woodlands: 'Woodlands', bugis: 'Bugis', bedok: 'Bedok', yishun: 'Yishun',
  orchard: 'Orchard', sengkang: 'Sengkang', punggol: 'Punggol',
  hougang: 'Hougang', clementi: 'Clementi', 'toa-payoh': 'Toa Payoh',
}

export default async function CateringPage({ searchParams }: Props) {
  const { area, type, q, page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1', 10))
  const offset = (page - 1) * PAGE_SIZE

  const supabase = await createClient()

  let query = (supabase as any)
    .from('listings')
    .select(
      `id, slug, name, vertical, area, address, halal_status, avg_rating, review_count, photos, featured,
       listings_catering ( catering_types, min_pax, max_pax )`,
      { count: 'exact' }
    )
    .eq('vertical', 'catering')
    .eq('status', 'active')
    .order('featured', { ascending: false })
    .order('avg_rating', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (area) query = query.eq('area', area)
  if (q) query = query.ilike('name', `%${q}%`)

  const { data: rows, count } = await query

  const listings: ListingCardProps[] = ((rows ?? []) as any[]).map((r) => {
    const cat = Array.isArray(r.listings_catering) ? r.listings_catering[0] : r.listings_catering
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
      is_featured: r.featured ?? false,
      cuisine_types: cat?.catering_types as string[] | undefined,
    }
  })

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  const heading = [
    type ? TYPE_LABELS[type] ?? type : 'Halal Catering',
    area ? `in ${AREA_LABELS[area] ?? area.replace(/-/g, ' ')}` : 'in Singapore',
  ].filter(Boolean).join(' ')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <header className="mb-8">
        <nav className="text-xs text-charcoal/40 mb-3 flex items-center gap-1">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <span className="text-charcoal">Halal Catering</span>
        </nav>
        <h1 className="text-3xl font-extrabold text-charcoal font-sans mb-2">{heading}</h1>
        <p className="text-charcoal/50 text-sm">{count ?? 0} halal catering providers found</p>
      </header>

      {/* Area filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(AREA_LABELS).map(([val, label]) => (
          <Link
            key={val}
            href={`/catering?area=${val}${type ? `&type=${type}` : ''}`}
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
          <Link href={`/catering${type ? `?type=${type}` : ''}`} className="rounded-full px-3 py-1.5 text-xs font-medium text-charcoal/60 hover:text-primary">
            Clear ×
          </Link>
        )}
      </div>

      {/* Type tabs */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-100 pb-4">
        <Link
          href={`/catering${area ? `?area=${area}` : ''}`}
          className={`text-sm font-medium px-3 py-1 rounded-full ${!type ? 'text-primary font-bold' : 'text-charcoal/60 hover:text-primary'}`}
        >
          All
        </Link>
        {Object.entries(TYPE_LABELS).map(([val, label]) => (
          <Link
            key={val}
            href={`/catering?type=${val}${area ? `&area=${area}` : ''}`}
            className={`text-sm font-medium px-3 py-1 rounded-full transition-colors ${
              type === val ? 'text-primary font-bold' : 'text-charcoal/60 hover:text-primary'
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

          {totalPages > 1 && (
            <nav className="flex justify-center gap-2" aria-label="Pagination">
              {page > 1 && (
                <Link
                  href={`/catering?page=${page - 1}${area ? `&area=${area}` : ''}${type ? `&type=${type}` : ''}`}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm hover:border-primary transition-colors"
                >
                  ← Prev
                </Link>
              )}
              <span className="px-4 py-2 text-sm text-charcoal/60">Page {page} of {totalPages}</span>
              {page < totalPages && (
                <Link
                  href={`/catering?page=${page + 1}${area ? `&area=${area}` : ''}${type ? `&type=${type}` : ''}`}
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
          <span className="material-symbols-outlined text-5xl text-charcoal/20 block mb-4">restaurant</span>
          <p className="text-charcoal/50 font-medium">No catering providers found.</p>
          <p className="text-charcoal/40 text-sm mt-1">Try a different area or type.</p>
          <Link href="/catering" className="text-primary text-sm hover:underline mt-4 block">Clear filters</Link>
        </div>
      )}

      {/* Cross-links */}
      <section className="mt-16 border-t border-gray-100 pt-10">
        <h2 className="text-lg font-bold text-charcoal mb-4">Halal Catering by Event Type</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(TYPE_LABELS).map(([val, label]) => (
            <Link key={val} href={`/catering?type=${val}`} className="text-sm text-primary hover:underline">
              {label} catering Singapore
            </Link>
          ))}
        </div>
        <h2 className="text-lg font-bold text-charcoal mt-8 mb-4">Catering by Area</h2>
        <div className="flex flex-wrap gap-2">
          {Object.values(SingaporeArea).slice(0, 12).map((a) => (
            <Link key={a} href={`/catering?area=${a}`} className="text-sm text-primary hover:underline capitalize">
              Halal catering {a.replace(/-/g, ' ')}
            </Link>
          ))}
        </div>
      </section>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            generateBreadcrumbSchema([
              { name: 'Home', url: SITE_URL },
              { name: 'Halal Catering', url: `${SITE_URL}/catering` },
              ...(area ? [{ name: AREA_LABELS[area] ?? area, url: `${SITE_URL}/catering?area=${area}` }] : []),
            ]),
            generateFAQSchema([
              {
                question: 'How do I find halal catering in Singapore?',
                answer: 'Browse HumbleHalal\'s directory of MUIS-certified and Muslim-owned catering services across Singapore. Filter by area and event type to find the right caterer.',
              },
              {
                question: 'What types of halal catering are available in Singapore?',
                answer: 'Singapore has a wide variety of halal catering options including Malay, Indian Muslim, buffet, bento, BBQ, nasi padang, wedding catering, and corporate event catering.',
              },
            ]),
            {
              '@context': 'https://schema.org',
              '@type': 'ItemList',
              name: heading,
              numberOfItems: listings.length,
              itemListElement: listings.map((l, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                name: l.name,
                url: `${SITE_URL}/catering/${l.slug}`,
              })),
            },
          ]),
        }}
      />
    </div>
  )
}
