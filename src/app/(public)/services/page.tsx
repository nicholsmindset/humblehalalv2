import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listings/ListingCard'
import { ISR_REVALIDATE, HalalStatus, SingaporeArea } from '@/config'
import type { ListingCardProps } from '@/components/listings/ListingCard'

export const revalidate = ISR_REVALIDATE.LONG_TAIL

interface Props {
  searchParams: Promise<{ area?: string; type?: string; q?: string; page?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { area, type } = await searchParams

  const parts = ['Muslim Services']
  if (type) parts.push(type.charAt(0).toUpperCase() + type.slice(1))
  parts.push('Singapore')
  if (area) parts.push(`— ${area.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}`)

  const title = parts.join(' ')
  const description = `Find Muslim-friendly services${area ? ` in ${area.replace(/-/g, ' ')}` : ' across Singapore'}. Islamic finance, legal, medical, education, and professional services.`

  return {
    title,
    description,
    openGraph: { title, description },
  }
}

const PAGE_SIZE = 24

const SERVICE_LABELS: Record<string, string> = {
  finance: 'Islamic Finance',
  legal: 'Legal Services',
  medical: 'Medical & Healthcare',
  education: 'Islamic Education',
  property: 'Property & Real Estate',
  insurance: 'Takaful Insurance',
  funerary: 'Funerary Services',
  counselling: 'Counselling & Therapy',
  marriage: 'Marriage & Solemnisation',
  childcare: 'Childcare & Enrichment',
  beauty: 'Muslim Beauty & Spa',
  fitness: 'Fitness & Wellness',
}

const AREA_LABELS: Record<string, string> = {
  'arab-street': 'Arab Street', tampines: 'Tampines', 'jurong-east': 'Jurong East',
  woodlands: 'Woodlands', bugis: 'Bugis', bedok: 'Bedok', yishun: 'Yishun',
  orchard: 'Orchard', sengkang: 'Sengkang', punggol: 'Punggol',
  hougang: 'Hougang', clementi: 'Clementi', 'toa-payoh': 'Toa Payoh',
}

export default async function MuslimServicesPage({ searchParams }: Props) {
  const { area, type, q, page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1', 10))
  const offset = (page - 1) * PAGE_SIZE

  const supabase = await createClient()

  let query = (supabase as any)
    .from('listings')
    .select(
      `id, slug, name, vertical, area, address, halal_status, avg_rating, review_count, photos, featured,
       listings_services ( service_types )`,
      { count: 'exact' }
    )
    .eq('vertical', 'services')
    .eq('status', 'active')
    .order('featured', { ascending: false })
    .order('avg_rating', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (area) query = query.eq('area', area)
  if (q) query = query.ilike('name', `%${q}%`)

  const { data: rows, count } = await query

  const listings: ListingCardProps[] = ((rows ?? []) as any[]).map((r) => {
    const svc = Array.isArray(r.listings_services) ? r.listings_services[0] : r.listings_services
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
      cuisine_types: svc?.service_types as string[] | undefined,
    }
  })

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  const heading = [
    type ? SERVICE_LABELS[type] ?? type : 'Muslim Services',
    area ? `in ${AREA_LABELS[area] ?? area.replace(/-/g, ' ')}` : 'in Singapore',
  ].filter(Boolean).join(' ')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <header className="mb-8">
        <nav className="text-xs text-charcoal/40 mb-3 flex items-center gap-1">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <span className="text-charcoal">Muslim Services</span>
        </nav>
        <h1 className="text-3xl font-extrabold text-charcoal font-sans mb-2">{heading}</h1>
        <p className="text-charcoal/50 text-sm">{count ?? 0} Muslim-friendly services found</p>
      </header>

      {/* Area filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(AREA_LABELS).map(([val, label]) => (
          <Link
            key={val}
            href={`/services?area=${val}${type ? `&type=${type}` : ''}`}
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
          <Link href={`/services${type ? `?type=${type}` : ''}`} className="rounded-full px-3 py-1.5 text-xs font-medium text-charcoal/60 hover:text-primary">
            Clear ×
          </Link>
        )}
      </div>

      {/* Service type tabs */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-100 pb-4">
        <Link
          href={`/services${area ? `?area=${area}` : ''}`}
          className={`text-sm font-medium px-3 py-1 rounded-full ${!type ? 'text-primary font-bold' : 'text-charcoal/60 hover:text-primary'}`}
        >
          All
        </Link>
        {Object.entries(SERVICE_LABELS).map(([val, label]) => (
          <Link
            key={val}
            href={`/services?type=${val}${area ? `&area=${area}` : ''}`}
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
                  href={`/services?page=${page - 1}${area ? `&area=${area}` : ''}${type ? `&type=${type}` : ''}`}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm hover:border-primary transition-colors"
                >
                  ← Prev
                </Link>
              )}
              <span className="px-4 py-2 text-sm text-charcoal/60">Page {page} of {totalPages}</span>
              {page < totalPages && (
                <Link
                  href={`/services?page=${page + 1}${area ? `&area=${area}` : ''}${type ? `&type=${type}` : ''}`}
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
          <span className="material-symbols-outlined text-5xl text-charcoal/20 block mb-4">handshake</span>
          <p className="text-charcoal/50 font-medium">No services found.</p>
          <p className="text-charcoal/40 text-sm mt-1">Try a different area or service type.</p>
          <Link href="/services" className="text-primary text-sm hover:underline mt-4 block">Clear filters</Link>
        </div>
      )}

      {/* Cross-links */}
      <section className="mt-16 border-t border-gray-100 pt-10">
        <h2 className="text-lg font-bold text-charcoal mb-4">Muslim Services by Type</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(SERVICE_LABELS).map(([val, label]) => (
            <Link key={val} href={`/services?type=${val}`} className="text-sm text-primary hover:underline">
              {label} Singapore
            </Link>
          ))}
        </div>
        <h2 className="text-lg font-bold text-charcoal mt-8 mb-4">Services by Area</h2>
        <div className="flex flex-wrap gap-2">
          {Object.values(SingaporeArea).slice(0, 12).map((a) => (
            <Link key={a} href={`/services?area=${a}`} className="text-sm text-primary hover:underline capitalize">
              Muslim services in {a.replace(/-/g, ' ')}
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
