import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listings/ListingCard'
import { ISR_REVALIDATE, HalalStatus } from '@/config'
import type { ListingCardProps } from '@/components/listings/ListingCard'

export const revalidate = ISR_REVALIDATE.LONG_TAIL

interface Props {
  params: Promise<{ slug: string }>
}

const CATERING_TYPE_META: Record<string, { label: string; description: string; icon: string; serviceType: string }> = {
  'wedding-catering': {
    label: 'Wedding Catering',
    description: 'Halal wedding caterers in Singapore for nikah receptions, solemnisations, and wedding banquets.',
    icon: 'favorite',
    serviceType: 'wedding',
  },
  'corporate-catering': {
    label: 'Corporate Catering',
    description: 'Halal corporate catering services in Singapore for meetings, seminars, and office events.',
    icon: 'business_center',
    serviceType: 'corporate',
  },
  'aqiqah-catering': {
    label: 'Aqiqah Catering',
    description: 'Halal aqiqah catering packages in Singapore. MUIS-certified caterers for your aqiqah ceremony.',
    icon: 'child_care',
    serviceType: 'aqiqah',
  },
  'birthday-catering': {
    label: 'Birthday Catering',
    description: 'Halal birthday party catering in Singapore. Customisable menus for birthday celebrations.',
    icon: 'cake',
    serviceType: 'birthday',
  },
  'buffet-catering': {
    label: 'Halal Buffet Catering',
    description: 'Halal buffet catering services in Singapore. Live stations, wide menus, and MUIS-certified options.',
    icon: 'restaurant',
    serviceType: 'buffet',
  },
  'bento-catering': {
    label: 'Bento & Packed Meal Catering',
    description: 'Halal bento box and packed meal catering in Singapore for events and offices.',
    icon: 'lunch_dining',
    serviceType: 'bento',
  },
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const meta = CATERING_TYPE_META[slug]
  if (!meta) return { title: 'Not Found' }

  return {
    title: `${meta.label} Singapore — Halal, MUIS Certified | HumbleHalal`,
    description: meta.description,
    alternates: { canonical: `/catering/${slug}` },
  }
}

const PAGE_SIZE = 24

export default async function CateringSlugPage({ params }: Props) {
  const { slug } = await params
  const meta = CATERING_TYPE_META[slug]
  if (!meta) notFound()

  const supabase = await createClient()
  const { data: rows, count } = await supabase
    .from('listings')
    .select(
      `id, slug, name, vertical, area, address, halal_status,
       avg_rating, review_count, photos, featured,
       listings_catering ( service_types, min_pax, max_pax, cuisines )`,
      { count: 'exact' }
    )
    .eq('vertical', 'catering')
    .eq('status', 'active')
    .contains('listings_catering.service_types' as any, [meta.serviceType])
    .order('featured', { ascending: false })
    .order('avg_rating', { ascending: false })
    .range(0, PAGE_SIZE - 1)

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
      cuisine_types: cat?.cuisines as string[] | undefined,
      is_featured: r.featured ?? false,
    }
  })

  // Other catering types for cross-linking
  const otherTypes = Object.entries(CATERING_TYPE_META).filter(([s]) => s !== slug)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-charcoal/50 mb-6">
        <Link href="/" className="hover:text-primary">Home</Link>
        <span>›</span>
        <Link href="/catering" className="hover:text-primary">Catering</Link>
        <span>›</span>
        <span className="text-charcoal font-medium">{meta.label}</span>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="material-symbols-outlined text-3xl text-primary">{meta.icon}</span>
          <h1 className="text-3xl font-extrabold text-charcoal font-sans">{meta.label} Singapore</h1>
        </div>
        <p className="text-charcoal/60 max-w-2xl">{meta.description}</p>
        <p className="text-charcoal/40 text-sm mt-2">{count ?? 0} halal caterers found</p>
      </header>

      {/* Listings */}
      {listings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-10">
          {listings.map((l) => <ListingCard key={l.id} {...l} />)}
        </div>
      ) : (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-5xl text-charcoal/20 block mb-4">restaurant_menu</span>
          <p className="text-charcoal/50 font-medium">No {meta.label.toLowerCase()} listings yet.</p>
          <Link href="/catering" className="text-primary text-sm hover:underline mt-4 block">
            Browse all halal catering →
          </Link>
        </div>
      )}

      {/* Cross-links */}
      <section className="mt-14 border-t border-gray-100 pt-8">
        <h2 className="text-base font-bold text-charcoal mb-4">Other Halal Catering Types</h2>
        <div className="flex flex-wrap gap-2">
          {otherTypes.map(([s, m]) => (
            <Link key={s} href={`/catering/${s}`} className="text-sm text-primary hover:underline">
              {m.label}
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
            name: `${meta.label} Singapore`,
            description: meta.description,
            numberOfItems: listings.length,
            itemListElement: listings.map((l, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: l.name,
              url: `https://humblehalal.sg/catering/${l.slug}`,
            })),
          }),
        }}
      />
    </div>
  )
}
