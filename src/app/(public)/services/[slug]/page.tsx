import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { MuisBadge } from '@/components/ui/MuisBadge'
import { HalalStatus, HALAL_STATUS_LABELS, ISR_REVALIDATE } from '@/config'
import { ListingActions } from '@/components/listings/ListingActions'
import { ReviewForm } from '@/components/reviews/ReviewForm'
import { ReviewsList } from '@/components/reviews/ReviewsList'

export const revalidate = ISR_REVALIDATE.LONG_TAIL

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: listing } = await supabase.from('listings').select('name, area, description').eq('slug', slug).eq('status', 'active').single()
  if (!listing) return { title: 'Service Not Found | HumbleHalal' }
  return {
    title: `${listing.name} — Muslim Service Provider in ${listing.area} | HumbleHalal`,
    description: listing.description?.slice(0, 155) ?? `${listing.name} — Muslim-friendly service provider in ${listing.area}, Singapore. Reviews and contact info on HumbleHalal.`,
  }
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: listing } = (await supabase
    .from('listings')
    .select(`
      id, name, slug, area, address, phone, website, email,
      description, halal_status, photos, avg_rating, review_count,
      listings_services ( service_type, price_range_text, service_areas, qualifications, years_experience )
    `)
    .eq('slug', slug)
    .eq('status', 'active')
    .single()) as any

  if (!listing) notFound()

  const service = Array.isArray(listing.listings_services) ? listing.listings_services[0] : listing.listings_services
  const halalLabel = HALAL_STATUS_LABELS[listing.halal_status as HalalStatus]
  const isMuis = listing.halal_status === HalalStatus.MuisCertified
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <nav className="text-sm text-charcoal/50 mb-6" aria-label="Breadcrumb">
        <a href="/services" className="hover:text-primary">Services</a>
        <span className="mx-2">›</span>
        <span className="text-charcoal">{listing.name}</span>
      </nav>

      <header className="mb-8">
        <div className="flex flex-wrap items-start gap-3 mb-3">
          <h1 className="text-3xl font-extrabold text-charcoal font-sans flex-1">{listing.name}</h1>
          {isMuis && <MuisBadge />}
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-charcoal/60">
          {listing.review_count > 0 && (
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-accent text-base">star</span>
              <strong className="text-charcoal">{Number(listing.avg_rating).toFixed(1)}</strong>
              <span>({listing.review_count} reviews)</span>
            </span>
          )}
          {service?.service_type && <span className="capitalize">{service.service_type.replace(/-/g, ' ')}</span>}
          <span>{listing.area}</span>
          <span className={isMuis ? 'text-primary font-semibold' : ''}>{halalLabel}</span>
        </div>
      </header>

      {listing.photos?.length > 0 && (
        <div className="grid grid-cols-3 gap-2 rounded-xl overflow-hidden mb-8 h-56">
          {listing.photos.slice(0, 3).map((url: string, i: number) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={url} alt={`${listing.name} photo ${i + 1}`} className={`object-cover w-full h-full ${i === 0 ? 'col-span-2 row-span-2' : ''}`} />
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {listing.description && (
            <section>
              <h2 className="text-lg font-bold text-charcoal mb-3">About</h2>
              <p className="text-charcoal/70 leading-relaxed">{listing.description}</p>
            </section>
          )}

          {service && (
            <section className="bg-warm-white border border-gray-200 rounded-xl p-5">
              <h2 className="text-lg font-bold text-charcoal mb-3">Service Details</h2>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                {service.service_type && <div><dt className="text-charcoal/50">Type</dt><dd className="font-medium capitalize">{service.service_type.replace(/-/g, ' ')}</dd></div>}
                {service.price_range_text && <div><dt className="text-charcoal/50">Pricing</dt><dd className="font-medium">{service.price_range_text}</dd></div>}
                {service.years_experience && <div><dt className="text-charcoal/50">Experience</dt><dd className="font-medium">{service.years_experience} years</dd></div>}
                {service.service_areas?.length > 0 && <div><dt className="text-charcoal/50">Areas Served</dt><dd className="font-medium capitalize">{service.service_areas.join(', ')}</dd></div>}
                {service.qualifications?.length > 0 && <div className="col-span-2"><dt className="text-charcoal/50">Qualifications</dt><dd className="font-medium">{service.qualifications.join(', ')}</dd></div>}
              </dl>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <ListingActions listing={{ id: listing.id, name: listing.name, area: listing.area, address: listing.address ?? '', phone: listing.phone ?? undefined, website: listing.website ?? undefined }} />
        </aside>
      </div>

      <section className="mt-12 pt-10 border-t border-gray-100">
        <h2 className="text-xl font-bold text-charcoal mb-6">Reviews {listing.review_count > 0 && <span className="text-charcoal/40 font-normal text-base ml-2">({listing.review_count})</span>}</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <ReviewForm listingId={listing.id} listingName={listing.name} isLoggedIn={!!user} />
          <ReviewsList listingId={listing.id} />
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'LocalBusiness',
        name: listing.name,
        address: { '@type': 'PostalAddress', streetAddress: listing.address, addressLocality: listing.area, addressCountry: 'SG' },
        telephone: listing.phone, url: listing.website,
        ...(listing.review_count > 0 && { aggregateRating: { '@type': 'AggregateRating', ratingValue: listing.avg_rating, reviewCount: listing.review_count, bestRating: 5 } }),
      }) }} />
    </article>
  )
}
