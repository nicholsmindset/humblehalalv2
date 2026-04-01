import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ListingCard, type ListingCardProps } from '@/components/listings/ListingCard'
import { generateBreadcrumbSchema } from '@/lib/seo/schema'
import { buildMetadata } from '@/lib/seo/meta'
import { CuisineType, SingaporeArea, ISR_REVALIDATE, SITE_URL } from '@/config'

export const revalidate = ISR_REVALIDATE.LONG_TAIL

export function generateStaticParams() {
  return Object.values(CuisineType).map((cuisine) => ({ cuisine }))
}

interface Props {
  params: Promise<{ cuisine: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { cuisine } = await params
  const cuisineLabel = cuisine.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  return buildMetadata({
    title: `${cuisineLabel} Halal Restaurants Singapore`,
    description: `Discover the best halal ${cuisineLabel} restaurants across Singapore. Find MUIS-certified eateries, read reviews, and get directions.`,
    path: `/halal-food/${cuisine}`,
    keywords: [`halal ${cuisineLabel} Singapore`, `${cuisineLabel} halal food`, `best halal ${cuisineLabel}`],
  })
}

const PAGE_SIZE = 24

export default async function HalalFoodCuisinePage({ params }: Props) {
  const { cuisine } = await params

  if (!Object.values(CuisineType).includes(cuisine as CuisineType)) notFound()

  const cuisineLabel = cuisine.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  const supabase = await createClient()
  const db = supabase as any

  const { data: listings, count } = await db
    .from('listings')
    .select('id, slug, name, vertical, cuisine_types, area, address, halal_status, avg_rating, review_count, photos, price_range, is_featured', { count: 'exact' })
    .eq('status', 'active')
    .eq('vertical', 'food')
    .contains('cuisine_types', [cuisine])
    .order('is_featured', { ascending: false })
    .order('avg_rating', { ascending: false })
    .limit(PAGE_SIZE)

  const breadcrumbs = generateBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Halal Food', url: `${SITE_URL}/halal-food` },
    { name: cuisineLabel, url: `${SITE_URL}/halal-food/${cuisine}` },
  ])

  const areas = Object.values(SingaporeArea)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <nav className="text-xs text-charcoal/50 mb-6 flex items-center gap-1">
          <a href="/" className="hover:text-primary">Home</a>
          <span>/</span>
          <a href="/halal-food" className="hover:text-primary">Halal Food</a>
          <span>/</span>
          <span className="capitalize">{cuisineLabel}</span>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-charcoal mb-2">
            Halal <span className="text-primary">{cuisineLabel}</span> Restaurants in Singapore
          </h1>
          <p className="text-charcoal/60">{count ?? 0} halal {cuisineLabel} listings across Singapore</p>
        </div>

        {/* Filter by area */}
        <div className="flex flex-wrap gap-2 mb-8">
          {areas.slice(0, 12).map((area) => (
            <Link
              key={area}
              href={`/halal-food/${cuisine}/${area}`}
              className="text-xs px-3 py-1.5 rounded-full border border-primary/20 text-primary hover:bg-primary hover:text-white transition-colors capitalize"
            >
              {area.replace(/-/g, ' ')}
            </Link>
          ))}
        </div>

        {listings && listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {(listings as ListingCardProps[]).map((l) => (
              <ListingCard key={l.id} {...l} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-charcoal/40">
            <span className="material-symbols-outlined text-5xl mb-3 block">restaurant</span>
            <p className="font-medium">No halal {cuisineLabel} listings yet.</p>
          </div>
        )}
      </main>
    </>
  )
}
