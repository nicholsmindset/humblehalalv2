import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listings/ListingCard'
import { ListingActions } from '@/components/listings/ListingActions'
import { ReviewForm } from '@/components/reviews/ReviewForm'
import { ReviewsList } from '@/components/reviews/ReviewsList'
import { MuisBadge } from '@/components/ui/MuisBadge'
import { ISR_REVALIDATE, HalalStatus, HALAL_STATUS_LABELS } from '@/config'
import type { ListingCardProps } from '@/components/listings/ListingCard'

export const revalidate = ISR_REVALIDATE.LONG_TAIL

interface Props {
  params: Promise<{ slug: string }>
}

// ── Category (pSEO) meta ──────────────────────────────────────────────────────
const SERVICE_META: Record<string, { label: string; description: string; icon: string; serviceCategory: string }> = {
  'muslim-finance': {
    label: 'Islamic Finance',
    description: 'Find Islamic finance providers in Singapore — halal mortgages, sukuk investments, takaful insurance, and Shariah-compliant financial planning.',
    icon: 'account_balance',
    serviceCategory: 'finance',
  },
  'muslim-legal': {
    label: 'Muslim Legal Services',
    description: 'Find Muslim lawyers and legal professionals in Singapore specialising in syariah law, estate planning, business law, and family matters.',
    icon: 'gavel',
    serviceCategory: 'legal',
  },
  'muslim-healthcare': {
    label: 'Muslim Healthcare',
    description: 'Discover Muslim doctors, clinics, and healthcare providers in Singapore. Culturally sensitive and faith-aware healthcare services.',
    icon: 'local_hospital',
    serviceCategory: 'healthcare',
  },
  'muslim-education': {
    label: 'Islamic Education',
    description: 'Find madrasahs, Quran classes, Islamic studies tutors, and Muslim preschools in Singapore for all ages.',
    icon: 'school',
    serviceCategory: 'education',
  },
  'muslim-wedding': {
    label: 'Muslim Wedding Services',
    description: 'Plan your dream nikah with Muslim wedding planners, decorators, photographers, and vendors in Singapore.',
    icon: 'favorite',
    serviceCategory: 'wedding',
  },
  'muslim-photography': {
    label: 'Muslim Photography',
    description: 'Book Muslim photographers and videographers in Singapore for weddings, aqiqah, family portraits, and events.',
    icon: 'photo_camera',
    serviceCategory: 'photography',
  },
  'muslim-travel': {
    label: 'Halal Travel Services',
    description: 'Find Muslim travel agencies in Singapore specialising in umrah packages, halal holidays, and Muslim-friendly tours.',
    icon: 'flight',
    serviceCategory: 'travel',
  },
  'muslim-cleaning': {
    label: 'Muslim Cleaning Services',
    description: 'Find Muslim-owned cleaning companies in Singapore for homes, offices, and post-renovation cleaning.',
    icon: 'cleaning_services',
    serviceCategory: 'cleaning',
  },
}

export function generateStaticParams() {
  return Object.keys(SERVICE_META).map((slug) => ({ slug }))
}

// ── Metadata ──────────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const meta = SERVICE_META[slug]
  if (meta) {
    return {
      title: `${meta.label} Singapore — Muslim-Owned | HumbleHalal`,
      description: meta.description,
      alternates: { canonical: `/services/${slug}` },
    }
  }

  const supabase = await createClient()
  const { data: listing } = (await supabase
    .from('listings')
    .select('name, area, description, halal_status')
    .eq('slug', slug)
    .eq('vertical', 'services')
    .eq('status', 'active')
    .single()) as any

  if (!listing) return { title: 'Not Found' }
  return {
    title: `${listing.name} — Muslim Service Provider in ${listing.area}, Singapore | HumbleHalal`,
    description: listing.description?.slice(0, 155) ??
      `${listing.name} is a Muslim-owned service provider in ${listing.area}, Singapore. Find contact details and reviews on HumbleHalal.`,
  }
}

const PAGE_SIZE = 24

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function ServiceSlugPage({ params }: Props) {
  const { slug } = await params
  const categoryMeta = SERVICE_META[slug]

  // ── Branch A: pSEO category page ────────────────────────────────────────────
  if (categoryMeta) {
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
      .eq('listings_services.service_category' as any, categoryMeta.serviceCategory)
      .order('featured', { ascending: false })
      .order('avg_rating', { ascending: false })
      .range(0, PAGE_SIZE - 1)

    const listings: ListingCardProps[] = ((rows ?? []) as any[]).map((r) => {
      const svc = Array.isArray(r.listings_services) ? r.listings_services[0] : r.listings_services
      return {
        id: r.id, slug: r.slug, name: r.name, vertical: r.vertical,
        area: r.area, address: r.address ?? '',
        halal_status: r.halal_status as HalalStatus,
        avg_rating: Number(r.avg_rating ?? 0),
        review_count: r.review_count ?? 0,
        photos: r.photos as string[] | undefined,
        category: svc?.service_category,
        is_featured: r.featured ?? false,
      }
    })

    const otherServices = Object.entries(SERVICE_META).filter(([s]) => s !== slug)

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <nav className="flex items-center gap-2 text-xs text-charcoal/50 mb-6">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>›</span>
          <Link href="/services" className="hover:text-primary">Muslim Services</Link>
          <span>›</span>
          <span className="text-charcoal font-medium">{categoryMeta.label}</span>
        </nav>

        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-3xl text-primary">{categoryMeta.icon}</span>
            <h1 className="text-3xl font-extrabold text-charcoal font-sans">{categoryMeta.label} Singapore</h1>
          </div>
          <p className="text-charcoal/60 max-w-2xl">{categoryMeta.description}</p>
          <p className="text-charcoal/40 text-sm mt-2">{count ?? 0} providers found</p>
        </header>

        {listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-10">
            {listings.map((l) => <ListingCard key={l.id} {...l} />)}
          </div>
        ) : (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-5xl text-charcoal/20 block mb-4">support_agent</span>
            <p className="text-charcoal/50 font-medium">No {categoryMeta.label.toLowerCase()} listings yet.</p>
            <Link href="/services" className="text-primary text-sm hover:underline mt-4 block">Browse all Muslim services →</Link>
          </div>
        )}

        <section className="mt-14 border-t border-gray-100 pt-8">
          <h2 className="text-base font-bold text-charcoal mb-4">Other Muslim Services</h2>
          <div className="flex flex-wrap gap-2">
            {otherServices.map(([s, m]) => (
              <Link key={s} href={`/services/${s}`} className="text-sm text-primary hover:underline">{m.label}</Link>
            ))}
          </div>
        </section>

        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org', '@type': 'ItemList',
            name: `${categoryMeta.label} Singapore`, description: categoryMeta.description,
            numberOfItems: listings.length,
            itemListElement: listings.map((l, i) => ({
              '@type': 'ListItem', position: i + 1, name: l.name,
              url: `https://humblehalal.sg/services/${l.slug}`,
            })),
          }),
        }} />
      </div>
    )
  }

  // ── Branch B: Individual service provider detail ─────────────────────────────
  const supabase = await createClient()

  const { data: listing } = (await supabase
    .from('listings')
    .select(`
      id, name, slug, area, address, phone, website, email,
      description, halal_status, muis_cert_no, muis_expiry,
      photos, avg_rating, review_count, categories, operating_hours,
      listings_services ( service_category, service_tags, pricing_model, contact_methods )
    `)
    .eq('slug', slug)
    .eq('vertical', 'services')
    .eq('status', 'active')
    .single()) as any

  if (!listing) notFound()

  const svc = Array.isArray(listing.listings_services) ? listing.listings_services[0] : listing.listings_services
  const isMuis = listing.halal_status === HalalStatus.MuisCertified
  const halalLabel = HALAL_STATUS_LABELS[listing.halal_status as HalalStatus]
  const { data: { user } } = await supabase.auth.getUser()

  const PRICING_LABELS: Record<string, string> = {
    hourly: 'Hourly Rate', fixed: 'Fixed Price', subscription: 'Subscription', quote: 'Quote on Request',
  }

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <nav className="text-sm text-charcoal/50 mb-6">
        <Link href="/services" className="hover:text-primary">Muslim Services</Link>
        <span className="mx-2">›</span>
        {svc?.service_category && (
          <>
            <Link href={`/services/muslim-${svc.service_category}`} className="hover:text-primary capitalize">{svc.service_category}</Link>
            <span className="mx-2">›</span>
          </>
        )}
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
          <span className={isMuis ? 'text-primary font-semibold' : ''}>{halalLabel}</span>
          <span className="capitalize">{listing.area}</span>
          {svc?.pricing_model && <span className="text-accent font-medium">{PRICING_LABELS[svc.pricing_model] ?? svc.pricing_model}</span>}
        </div>
      </header>

      {listing.photos?.length > 0 && (
        <div className="grid grid-cols-3 gap-2 rounded-xl overflow-hidden mb-8 h-56">
          {(listing.photos as string[]).slice(0, 3).map((url: string, i: number) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={url} alt={`${listing.name} photo ${i + 1}`}
              className={`object-cover w-full h-full ${i === 0 ? 'col-span-2' : ''}`} />
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

          {svc?.service_tags?.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-charcoal mb-3">Specialisations</h2>
              <div className="flex flex-wrap gap-2">
                {(svc.service_tags as string[]).map((tag: string) => (
                  <span key={tag} className="bg-emerald-50 text-primary text-xs font-semibold px-3 py-1 rounded-full capitalize">{tag}</span>
                ))}
              </div>
            </section>
          )}

          {isMuis && listing.muis_cert_no && (
            <section className="bg-emerald-50 border border-primary/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-primary">verified</span>
                <h2 className="font-bold text-primary">MUIS Certified</h2>
              </div>
              <p className="text-sm text-charcoal/70">Cert No: <strong>{listing.muis_cert_no}</strong></p>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <ListingActions listing={{
            id: listing.id, name: listing.name, area: listing.area,
            address: listing.address ?? '', phone: listing.phone ?? undefined,
            website: listing.website ?? undefined,
          }} />
        </aside>
      </div>

      <section className="mt-12 pt-10 border-t border-gray-100">
        <h2 className="text-xl font-bold text-charcoal mb-6">
          Reviews {listing.review_count > 0 && <span className="text-charcoal/40 font-normal text-base ml-2">({listing.review_count})</span>}
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <ReviewForm listingId={listing.id} listingName={listing.name} isLoggedIn={!!user} />
          <ReviewsList listingId={listing.id} />
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org', '@type': 'LocalBusiness',
          name: listing.name,
          address: { '@type': 'PostalAddress', streetAddress: listing.address, addressLocality: listing.area, addressCountry: 'SG' },
          telephone: listing.phone, url: listing.website,
          ...(listing.review_count > 0 && {
            aggregateRating: { '@type': 'AggregateRating', ratingValue: listing.avg_rating, reviewCount: listing.review_count, bestRating: 5 },
          }),
        }),
      }} />
    </article>
  )
}
