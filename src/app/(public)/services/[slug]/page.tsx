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

const SERVICE_META: Record<string, {
  label: string
  description: string
  icon: string
  serviceCategory: string
}> = {
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const meta = SERVICE_META[slug]
  if (!meta) return { title: 'Not Found' }

  return {
    title: `${meta.label} Singapore — Muslim-Owned | HumbleHalal`,
    description: meta.description,
    alternates: { canonical: `/services/${slug}` },
  }
}

const PAGE_SIZE = 24

export default async function ServiceSlugPage({ params }: Props) {
  const { slug } = await params
  const meta = SERVICE_META[slug]
  if (!meta) notFound()

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
    .eq('listings_services.service_category' as any, meta.serviceCategory)
    .order('featured', { ascending: false })
    .order('avg_rating', { ascending: false })
    .range(0, PAGE_SIZE - 1)

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

  const otherServices = Object.entries(SERVICE_META).filter(([s]) => s !== slug)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-charcoal/50 mb-6">
        <Link href="/" className="hover:text-primary">Home</Link>
        <span>›</span>
        <Link href="/services" className="hover:text-primary">Muslim Services</Link>
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
        <p className="text-charcoal/40 text-sm mt-2">{count ?? 0} providers found</p>
      </header>

      {/* Listings */}
      {listings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-10">
          {listings.map((l) => <ListingCard key={l.id} {...l} />)}
        </div>
      ) : (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-5xl text-charcoal/20 block mb-4">support_agent</span>
          <p className="text-charcoal/50 font-medium">No {meta.label.toLowerCase()} listings yet.</p>
          <Link href="/services" className="text-primary text-sm hover:underline mt-4 block">
            Browse all Muslim services →
          </Link>
        </div>
      )}

      {/* Cross-links */}
      <section className="mt-14 border-t border-gray-100 pt-8">
        <h2 className="text-base font-bold text-charcoal mb-4">Other Muslim Services</h2>
        <div className="flex flex-wrap gap-2">
          {otherServices.map(([s, m]) => (
            <Link key={s} href={`/services/${s}`} className="text-sm text-primary hover:underline">
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
              url: `https://humblehalal.sg/services/${l.slug}`,
            })),
          }),
        }}
      />
    </div>
  )
}
