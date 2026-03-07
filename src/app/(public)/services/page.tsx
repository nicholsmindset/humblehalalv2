import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listings/ListingCard'
import { ISR_REVALIDATE, HalalStatus, SingaporeArea } from '@/config'
import type { ListingCardProps } from '@/components/listings/ListingCard'

export const revalidate = ISR_REVALIDATE.HIGH_TRAFFIC

const SERVICE_TYPES = [
  'photography', 'cleaning', 'renovation', 'tuition',
  'legal', 'financial', 'healthcare', 'beauty', 'fitness', 'childcare',
] as const

interface Props {
  searchParams: Promise<{ service?: string; area?: string; q?: string; page?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { service, area } = await searchParams
  const svcLabel = service ? service.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : ''
  const areaLabel = area ? area.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Singapore'

  return {
    title: `Muslim ${svcLabel ? svcLabel + ' ' : ''}Services in ${areaLabel} | HumbleHalal`,
    description: `Find Muslim-friendly ${svcLabel.toLowerCase() || 'service'} providers in ${areaLabel}. Verified listings with reviews and contact info.`,
  }
}

const PAGE_SIZE = 24

export default async function ServicesPage({ searchParams }: Props) {
  const { service, area, q, page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1', 10))
  const offset = (page - 1) * PAGE_SIZE

  const supabase = await createClient()

  let query = supabase
    .from('listings')
    .select(`
      id, slug, name, vertical, area, address, halal_status,
      avg_rating, review_count, photos, featured,
      listings_services ( service_type, price_range_text, service_areas )
    `, { count: 'exact' })
    .eq('vertical', 'services')
    .eq('status', 'active')
    .order('featured', { ascending: false })
    .order('avg_rating', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (area) query = query.eq('area', area)
  if (q) query = query.ilike('name', `%${q}%`)

  const { data: rows, count } = await query
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  const listings: ListingCardProps[] = ((rows ?? []) as any[]).map((r) => ({
    id: r.id, slug: r.slug, name: r.name, vertical: r.vertical,
    area: r.area, address: r.address ?? '',
    halal_status: r.halal_status as HalalStatus,
    avg_rating: Number(r.avg_rating ?? 0), review_count: r.review_count ?? 0,
    photos: r.photos as string[] | undefined, is_featured: r.featured ?? false,
  }))

  const heading = `Muslim ${service ? service.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) + ' ' : ''}Services ${area ? `in ${area.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}` : 'in Singapore'}`

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-charcoal font-sans mb-2">{heading}</h1>
        <p className="text-charcoal/50 text-sm">{count ?? 0} services found</p>
      </header>

      <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-100 pb-4">
        <Link href={`/services${area ? `?area=${area}` : ''}`} className={`text-sm font-medium px-3 py-1 rounded-full ${!service ? 'text-primary font-bold' : 'text-charcoal/60 hover:text-primary'}`}>All</Link>
        {SERVICE_TYPES.map((s) => (
          <Link key={s} href={`/services?service=${s}${area ? `&area=${area}` : ''}`} className={`text-sm font-medium px-3 py-1 rounded-full transition-colors capitalize ${service === s ? 'text-primary font-bold' : 'text-charcoal/60 hover:text-primary'}`}>
            {s.replace(/-/g, ' ')}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {Object.values(SingaporeArea).slice(0, 12).map((a) => (
          <Link key={a} href={`/services?area=${a}${service ? `&service=${service}` : ''}`} className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${area === a ? 'bg-primary text-white border-primary' : 'bg-white text-charcoal border-gray-200 hover:border-primary'}`}>
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
              {page > 1 && <Link href={`/services?page=${page - 1}${area ? `&area=${area}` : ''}${service ? `&service=${service}` : ''}`} className="px-4 py-2 rounded-lg border border-gray-200 text-sm hover:border-primary transition-colors">← Prev</Link>}
              <span className="px-4 py-2 text-sm text-charcoal/60">Page {page} of {totalPages}</span>
              {page < totalPages && <Link href={`/services?page=${page + 1}${area ? `&area=${area}` : ''}${service ? `&service=${service}` : ''}`} className="px-4 py-2 rounded-lg border border-gray-200 text-sm hover:border-primary transition-colors">Next →</Link>}
            </nav>
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-5xl text-charcoal/20 block mb-4">search_off</span>
          <p className="text-charcoal/50 font-medium">No services found.</p>
          <Link href="/services" className="text-primary text-sm hover:underline mt-4 block">Clear filters</Link>
        </div>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'ItemList', name: heading, numberOfItems: listings.length,
        itemListElement: listings.map((l, i) => ({ '@type': 'ListItem', position: i + 1, name: l.name, url: `https://humblehalal.sg/services/${l.slug}` })),
      }) }} />
    </div>
  )
}
