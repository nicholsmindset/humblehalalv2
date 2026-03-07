import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listings/ListingCard'
import { ISR_REVALIDATE, HalalStatus, SingaporeArea } from '@/config'
import type { ListingCardProps } from '@/components/listings/ListingCard'

export const revalidate = ISR_REVALIDATE.HIGH_TRAFFIC

const CATERING_TYPES = [
  'wedding', 'corporate', 'birthday', 'buffet', 'bento',
  'nasi-ambeng', 'private-event', 'food-truck',
] as const

interface Props {
  searchParams: Promise<{ type?: string; area?: string; q?: string; page?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { type, area } = await searchParams
  const typeLabel = type ? `${type.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} ` : ''
  const areaLabel = area ? area.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Singapore'

  return {
    title: `Halal ${typeLabel}Catering in ${areaLabel} | HumbleHalal`,
    description: `Find halal ${typeLabel.toLowerCase()}catering services in ${areaLabel}. MUIS-certified caterers with menus, pricing, and reviews.`,
  }
}

const PAGE_SIZE = 24

export default async function CateringPage({ searchParams }: Props) {
  const { type, area, q, page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1', 10))
  const offset = (page - 1) * PAGE_SIZE

  const supabase = await createClient()

  let query = supabase
    .from('listings')
    .select(`
      id, slug, name, vertical, area, address, halal_status,
      avg_rating, review_count, photos, featured,
      listings_catering ( catering_types, min_pax, max_pax, price_per_pax_min )
    `, { count: 'exact' })
    .eq('vertical', 'catering')
    .eq('status', 'active')
    .order('featured', { ascending: false })
    .order('avg_rating', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (area) query = query.eq('area', area)
  if (q) query = query.ilike('name', `%${q}%`)

  const { data: rows, count } = await query
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  const listings: ListingCardProps[] = ((rows ?? []) as any[]).map((r) => {
    const catering = Array.isArray(r.listings_catering) ? r.listings_catering[0] : r.listings_catering
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
      price_range: catering?.price_per_pax_min ? `From $${catering.price_per_pax_min}/pax` : null,
    }
  })

  const heading = `Halal ${type ? type.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) + ' ' : ''}Catering ${area ? `in ${area.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}` : 'in Singapore'}`

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-charcoal font-sans mb-2">{heading}</h1>
        <p className="text-charcoal/50 text-sm">{count ?? 0} caterers found</p>
      </header>

      {/* Catering type tabs */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-100 pb-4">
        <Link href={`/catering${area ? `?area=${area}` : ''}`} className={`text-sm font-medium px-3 py-1 rounded-full ${!type ? 'text-primary font-bold' : 'text-charcoal/60 hover:text-primary'}`}>All</Link>
        {CATERING_TYPES.map((t) => (
          <Link key={t} href={`/catering?type=${t}${area ? `&area=${area}` : ''}`} className={`text-sm font-medium px-3 py-1 rounded-full transition-colors capitalize ${type === t ? 'text-primary font-bold' : 'text-charcoal/60 hover:text-primary'}`}>
            {t.replace(/-/g, ' ')}
          </Link>
        ))}
      </div>

      {/* Area chips */}
      <div className="flex flex-wrap gap-2 mb-8">
        {Object.values(SingaporeArea).slice(0, 12).map((a) => (
          <Link key={a} href={`/catering?area=${a}${type ? `&type=${type}` : ''}`} className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${area === a ? 'bg-primary text-white border-primary' : 'bg-white text-charcoal border-gray-200 hover:border-primary'}`}>
            {a.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </Link>
        ))}
      </div>

      {listings.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-10">
            {listings.map((l) => <ListingCard key={l.id} {...l} />)}
          </div>
          {totalPages > 1 && (
            <nav className="flex justify-center gap-2" aria-label="Pagination">
              {page > 1 && <Link href={`/catering?page=${page - 1}${area ? `&area=${area}` : ''}${type ? `&type=${type}` : ''}`} className="px-4 py-2 rounded-lg border border-gray-200 text-sm hover:border-primary transition-colors">← Prev</Link>}
              <span className="px-4 py-2 text-sm text-charcoal/60">Page {page} of {totalPages}</span>
              {page < totalPages && <Link href={`/catering?page=${page + 1}${area ? `&area=${area}` : ''}${type ? `&type=${type}` : ''}`} className="px-4 py-2 rounded-lg border border-gray-200 text-sm hover:border-primary transition-colors">Next →</Link>}
            </nav>
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-5xl text-charcoal/20 block mb-4">search_off</span>
          <p className="text-charcoal/50 font-medium">No caterers found.</p>
          <Link href="/catering" className="text-primary text-sm hover:underline mt-4 block">Clear filters</Link>
        </div>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: heading,
        numberOfItems: listings.length,
        itemListElement: listings.map((l, i) => ({ '@type': 'ListItem', position: i + 1, name: l.name, url: `https://humblehalal.sg/catering/${l.slug}` })),
      }) }} />
    </div>
  )
}
