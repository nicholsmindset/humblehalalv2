import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listings/ListingCard'
import { ISR_REVALIDATE, HalalStatus } from '@/config'
import type { ListingCardProps } from '@/components/listings/ListingCard'

export const revalidate = ISR_REVALIDATE.HIGH_TRAFFIC

export const metadata: Metadata = {
  title: 'Muslim Professional Services Singapore — Finance, Legal, Healthcare | HumbleHalal',
  description: 'Find trusted Muslim-owned professional services in Singapore. Islamic finance, halal legal advice, Muslim healthcare providers, and more verified on HumbleHalal.',
  alternates: { canonical: '/services' },
}

const SERVICE_CATEGORIES = [
  { slug: 'muslim-finance', label: 'Islamic Finance', icon: 'account_balance' },
  { slug: 'muslim-legal', label: 'Muslim Legal Services', icon: 'gavel' },
  { slug: 'muslim-healthcare', label: 'Muslim Healthcare', icon: 'local_hospital' },
  { slug: 'muslim-education', label: 'Islamic Education', icon: 'school' },
  { slug: 'muslim-wedding', label: 'Wedding Services', icon: 'favorite' },
  { slug: 'muslim-photography', label: 'Muslim Photography', icon: 'photo_camera' },
  { slug: 'muslim-travel', label: 'Halal Travel', icon: 'flight' },
  { slug: 'muslim-cleaning', label: 'Cleaning Services', icon: 'cleaning_services' },
]

export default async function ServicesPage() {
  const supabase = await createClient()
  const { data: rows, count } = await supabase
    .from('listings')
    .select(
      `id, slug, name, vertical, area, address, halal_status,
       avg_rating, review_count, photos, featured,
       listings_services ( service_category, service_tags, pricing_model )`,
      { count: 'exact' }
    )
    .eq('vertical', 'services')
    .eq('status', 'active')
    .order('featured', { ascending: false })
    .order('avg_rating', { ascending: false })
    .range(0, 23)

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
      category: svc?.service_category,
      is_featured: r.featured ?? false,
    }
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold text-charcoal font-sans mb-3">
          Muslim Professional Services
        </h1>
        <p className="text-charcoal/60 max-w-2xl">
          Connect with {count ?? 0}+ trusted Muslim-owned and halal-conscious service providers in
          Singapore — from Islamic finance to wedding planners.
        </p>
      </header>

      {/* Category grid */}
      <section className="mb-10">
        <h2 className="text-sm font-bold text-charcoal/50 uppercase tracking-wider mb-4">Browse by Service</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {SERVICE_CATEGORIES.map(({ slug, label, icon }) => (
            <Link
              key={slug}
              href={`/services/${slug}`}
              className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl border border-gray-200 hover:border-primary hover:shadow-md transition-all text-center"
            >
              <span className="material-symbols-outlined text-2xl text-primary">{icon}</span>
              <span className="text-[11px] font-semibold text-charcoal leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured services */}
      <section>
        <h2 className="text-xl font-bold text-charcoal mb-5">Featured Service Providers</h2>
        {listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {listings.map((l) => <ListingCard key={l.id} {...l} />)}
          </div>
        ) : (
          <div className="text-center py-16 text-charcoal/40">
            <span className="material-symbols-outlined text-5xl block mb-3">support_agent</span>
            <p>Service listings coming soon.</p>
          </div>
        )}
      </section>

      {/* pSEO cross-links */}
      <section className="mt-14 border-t border-gray-100 pt-8">
        <h2 className="text-base font-bold text-charcoal mb-4">Popular Muslim Services</h2>
        <div className="flex flex-wrap gap-2">
          {SERVICE_CATEGORIES.map(({ slug, label }) => (
            <Link key={slug} href={`/services/${slug}`} className="text-sm text-primary hover:underline">
              {label} Singapore
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
            name: 'Muslim Professional Services Singapore',
            numberOfItems: listings.length,
            itemListElement: listings.map((l, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: l.name,
              url: `https://humblehalal.sg/services/${l.slug}`,
            })),
          }),
        }}
      />
    </div>
  )
}
