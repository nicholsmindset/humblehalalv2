import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ListingCard, type ListingCardProps } from '@/components/listings/ListingCard'
import { generateBreadcrumbSchema } from '@/lib/seo/schema'
import { buildMetadata } from '@/lib/seo/meta'
import { BusinessCategory, SingaporeArea, ISR_REVALIDATE, SITE_URL } from '@/config'

export const revalidate = ISR_REVALIDATE.LONG_TAIL

export function generateStaticParams() {
  return Object.values(BusinessCategory).flatMap((category) =>
    Object.values(SingaporeArea).map((area) => ({ category, area }))
  )
}

interface Props {
  params: Promise<{ category: string; area: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, area } = await params
  const catLabel  = category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  const areaLabel = area.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  return buildMetadata({
    title: `Halal ${catLabel} in ${areaLabel} Singapore`,
    description: `Find Muslim-friendly and halal ${catLabel.toLowerCase()} businesses in ${areaLabel}, Singapore. Verified listings with reviews.`,
    path: `/business/${category}/${area}`,
  })
}

const PAGE_SIZE = 24

export default async function BusinessCategoryAreaPage({ params }: Props) {
  const { category, area } = await params

  const validCat  = Object.values(BusinessCategory).includes(category as BusinessCategory)
  const validArea = Object.values(SingaporeArea).includes(area as SingaporeArea)
  if (!validCat || !validArea) notFound()

  const catLabel  = category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  const areaLabel = area.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  const supabase = await createClient()
  const db = supabase as any

  const { data: listings, count } = await db
    .from('listings')
    .select('id, slug, name, vertical, cuisine_types, area, address, halal_status, avg_rating, review_count, photos, price_range, is_featured', { count: 'exact' })
    .eq('status', 'active')
    .eq('category', category)
    .eq('area', area)
    .order('is_featured', { ascending: false })
    .order('avg_rating', { ascending: false })
    .limit(PAGE_SIZE)

  const breadcrumbs = generateBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Muslim Businesses', url: `${SITE_URL}/business` },
    { name: catLabel, url: `${SITE_URL}/business/${category}` },
    { name: areaLabel, url: `${SITE_URL}/business/${category}/${area}` },
  ])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <nav className="text-xs text-charcoal/50 mb-6 flex items-center gap-1">
          <a href="/" className="hover:text-primary">Home</a>
          <span>/</span>
          <a href="/business" className="hover:text-primary">Businesses</a>
          <span>/</span>
          <span>{catLabel} in {areaLabel}</span>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-charcoal mb-2">
            Halal <span className="text-primary">{catLabel}</span> in {areaLabel}
          </h1>
          <p className="text-charcoal/60">{count ?? 0} Muslim-friendly {catLabel.toLowerCase()} businesses in {areaLabel}</p>
        </div>

        {listings && listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {(listings as ListingCardProps[]).map((l) => (
              <ListingCard key={l.id} {...l} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-charcoal/40">
            <span className="material-symbols-outlined text-5xl mb-3 block">store</span>
            <p className="font-medium">No {catLabel} listings in {areaLabel} yet.</p>
            <a href="/business" className="text-primary underline text-sm mt-2 inline-block">
              Browse all businesses →
            </a>
          </div>
        )}
      </main>
    </>
  )
}
