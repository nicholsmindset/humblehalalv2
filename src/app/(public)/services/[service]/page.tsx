import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ListingCard, type ListingCardProps } from '@/components/listings/ListingCard'
import { generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo/schema'
import { buildMetadata } from '@/lib/seo/meta'
import { ISR_REVALIDATE, SITE_URL } from '@/config'

export const revalidate = ISR_REVALIDATE.LONG_TAIL

// Common Muslim service types for pSEO
const SERVICE_TYPES = [
  'photographer', 'wedding-planner', 'caterer', 'tutor', 'lawyer',
  'financial-advisor', 'doctor', 'dentist', 'counsellor', 'fitness-trainer',
  'home-cleaner', 'contractor', 'interior-designer', 'event-planner', 'childcare',
] as const

export function generateStaticParams() {
  return SERVICE_TYPES.map((service) => ({ service }))
}

interface Props {
  params: Promise<{ service: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { service } = await params
  const label = service.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  return buildMetadata({
    title: `Muslim ${label} Singapore`,
    description: `Find trusted Muslim and halal-friendly ${label.toLowerCase()} services in Singapore. Verified listings, reviews, and contact details.`,
    path: `/services/${service}`,
    keywords: [`Muslim ${label} Singapore`, `halal ${label}`, `Muslim-friendly ${label} Singapore`],
  })
}

const PAGE_SIZE = 24

export default async function MuslimServicePage({ params }: Props) {
  const { service } = await params

  const label = service.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  const supabase = await createClient()
  const db = supabase as any

  const { data: listings, count } = await db
    .from('listings')
    .select('id, slug, name, vertical, area, address, halal_status, avg_rating, review_count, photos, price_range, is_featured', { count: 'exact' })
    .eq('status', 'active')
    .eq('vertical', 'services')
    .ilike('category', `%${service.replace(/-/g, '%')}%`)
    .order('is_featured', { ascending: false })
    .order('avg_rating', { ascending: false })
    .limit(PAGE_SIZE)

  if (!listings) notFound()

  const breadcrumbs = generateBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Services', url: `${SITE_URL}/services` },
    { name: `Muslim ${label}`, url: `${SITE_URL}/services/${service}` },
  ])

  const faqs = generateFAQSchema([
    {
      question: `How do I find a Muslim ${label.toLowerCase()} in Singapore?`,
      answer: `Browse HumbleHalal's verified directory of Muslim and halal-friendly ${label.toLowerCase()} providers in Singapore. Each listing includes reviews, contact details, and halal status.`,
    },
    {
      question: `Are the ${label.toLowerCase()} providers on HumbleHalal verified?`,
      answer: `Yes. We verify each provider's halal status and Muslim-owned credentials. Look for the MUIS Certified or Muslim-Owned badges on each listing profile.`,
    },
  ])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqs) }} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <nav className="text-xs text-charcoal/50 mb-6 flex items-center gap-1">
          <a href="/" className="hover:text-primary">Home</a>
          <span>/</span>
          <a href="/services" className="hover:text-primary">Services</a>
          <span>/</span>
          <span>Muslim {label}</span>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-charcoal mb-2">
            Muslim <span className="text-primary">{label}</span> in Singapore
          </h1>
          <p className="text-charcoal/60">{count ?? 0} Muslim-friendly {label.toLowerCase()} providers</p>
        </div>

        {listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {(listings as ListingCardProps[]).map((l) => (
              <ListingCard key={l.id} {...l} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-charcoal/40">
            <span className="material-symbols-outlined text-5xl mb-3 block">handyman</span>
            <p className="font-medium">No {label} listings yet.</p>
            <a href="/services" className="text-primary underline text-sm mt-2 inline-block">
              Browse all services →
            </a>
          </div>
        )}
      </main>
    </>
  )
}
