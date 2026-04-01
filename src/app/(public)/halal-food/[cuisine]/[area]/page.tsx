import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ListingCard, type ListingCardProps } from '@/components/listings/ListingCard'
import { generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo/schema'
import { buildMetadata } from '@/lib/seo/meta'
import { CuisineType, SingaporeArea, ISR_REVALIDATE, SITE_URL } from '@/config'

export const revalidate = ISR_REVALIDATE.LONG_TAIL

// ── Static params (all cuisine × area combos) ─────────────────────────────────
export function generateStaticParams() {
  const cuisines = Object.values(CuisineType)
  const areas = Object.values(SingaporeArea)
  return cuisines.flatMap((cuisine) => areas.map((area) => ({ cuisine, area })))
}

// ── Metadata ──────────────────────────────────────────────────────────────────
interface Props {
  params: Promise<{ cuisine: string; area: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { cuisine, area } = await params
  const cuisineLabel = cuisine.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  const areaLabel    = area.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  return buildMetadata({
    title: `${cuisineLabel} Halal Food in ${areaLabel}`,
    description: `Find the best ${cuisineLabel} halal restaurants in ${areaLabel}, Singapore. MUIS-certified listings with reviews, menus, and directions.`,
    path: `/halal-food/${cuisine}/${area}`,
    keywords: [`${cuisineLabel} halal food ${areaLabel}`, `halal ${cuisineLabel} ${areaLabel} Singapore`, `MUIS certified ${cuisineLabel}`],
  })
}

const PAGE_SIZE = 24

export default async function HalalFoodCuisineAreaPage({ params }: Props) {
  const { cuisine, area } = await params

  const cuisineLabel = cuisine.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  const areaLabel    = area.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  // Validate params against known enums
  const validCuisine = Object.values(CuisineType).includes(cuisine as CuisineType)
  const validArea    = Object.values(SingaporeArea).includes(area as SingaporeArea)
  if (!validCuisine || !validArea) notFound()

  const supabase = await createClient()
  const db = supabase as any

  const { data: listings, count } = await db
    .from('listings')
    .select('id, slug, name, vertical, cuisine_types, area, address, halal_status, avg_rating, review_count, photos, price_range, is_featured', { count: 'exact' })
    .eq('status', 'active')
    .eq('vertical', 'food')
    .contains('cuisine_types', [cuisine])
    .eq('area', area)
    .order('is_featured', { ascending: false })
    .order('avg_rating', { ascending: false })
    .limit(PAGE_SIZE)

  // JSON-LD
  const breadcrumbs = generateBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Halal Food', url: `${SITE_URL}/halal-food` },
    { name: cuisineLabel, url: `${SITE_URL}/halal-food/${cuisine}` },
    { name: areaLabel, url: `${SITE_URL}/halal-food/${cuisine}/${area}` },
  ])

  const faqs = generateFAQSchema([
    {
      question: `Where can I find halal ${cuisineLabel} food in ${areaLabel}?`,
      answer: `HumbleHalal lists ${count ?? 0}+ halal ${cuisineLabel} restaurants in ${areaLabel}. Browse verified MUIS-certified and Muslim-owned options on this page.`,
    },
    {
      question: `Is ${cuisineLabel} food in ${areaLabel} MUIS certified?`,
      answer: `Many ${cuisineLabel} restaurants in ${areaLabel} carry MUIS halal certification. Look for the green MUIS badge on each listing to confirm certification status.`,
    },
  ])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqs) }} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb */}
        <nav className="text-xs text-charcoal/50 mb-6 flex items-center gap-1">
          <a href="/" className="hover:text-primary">Home</a>
          <span>/</span>
          <a href="/halal-food" className="hover:text-primary">Halal Food</a>
          <span>/</span>
          <a href={`/halal-food/${cuisine}`} className="hover:text-primary capitalize">{cuisineLabel}</a>
          <span>/</span>
          <span className="capitalize">{areaLabel}</span>
        </nav>

        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-charcoal mb-2">
            {cuisineLabel} Halal Food in{' '}
            <span className="text-primary">{areaLabel}</span>
          </h1>
          <p className="text-charcoal/60">
            {count ?? 0} halal {cuisineLabel} restaurants found in {areaLabel}, Singapore
          </p>
        </div>

        {/* Listings grid */}
        {listings && listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {(listings as ListingCardProps[]).map((l) => (
              <ListingCard key={l.id} {...l} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-charcoal/40">
            <span className="material-symbols-outlined text-5xl mb-3 block">restaurant</span>
            <p className="font-medium">No {cuisineLabel} halal listings in {areaLabel} yet.</p>
            <a href="/halal-food" className="text-primary underline text-sm mt-2 inline-block">
              Browse all halal food →
            </a>
          </div>
        )}

        {/* SEO content block */}
        <section className="mt-16 prose prose-sm max-w-none text-charcoal/70">
          <h2>About Halal {cuisineLabel} in {areaLabel}</h2>
          <p>
            {areaLabel} is home to a growing halal food scene, with {cuisineLabel} cuisine being
            one of the most popular choices for Singapore&apos;s Muslim community. All listings on
            HumbleHalal are verified for halal status — look for the MUIS badge for officially
            certified restaurants.
          </p>
          <p>
            Explore nearby areas:{' '}
            {Object.values(SingaporeArea).slice(0, 5).filter(a => a !== area).map((a, i, arr) => (
              <span key={a}>
                <a href={`/halal-food/${cuisine}/${a}`} className="text-primary hover:underline">
                  {a.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </a>
                {i < arr.length - 1 ? ', ' : ''}
              </span>
            ))}
          </p>
        </section>
      </main>
    </>
  )
}
