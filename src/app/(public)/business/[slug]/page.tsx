import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listings/ListingCard'
import { ISR_REVALIDATE, HalalStatus, SingaporeArea, BusinessCategory } from '@/config'
import type { ListingCardProps } from '@/components/listings/ListingCard'

export const revalidate = ISR_REVALIDATE.LONG_TAIL

interface Props {
  params: Promise<{ slug: string }>
}

const CATEGORY_LABELS: Record<string, string> = {
  restaurant: 'Restaurant', catering: 'Catering', 'food-delivery': 'Food Delivery',
  grocery: 'Grocery', fashion: 'Fashion', beauty: 'Beauty',
  finance: 'Finance', travel: 'Travel', education: 'Education',
  healthcare: 'Healthcare', 'legal-services': 'Legal Services',
  photography: 'Photography', events: 'Events', cleaning: 'Cleaning',
  technology: 'Technology', 'real-estate': 'Real Estate',
  childcare: 'Childcare', fitness: 'Fitness', 'home-services': 'Home Services',
  other: 'Other',
}

const AREA_LABELS: Record<string, string> = {
  tampines: 'Tampines', 'jurong-east': 'Jurong East', 'jurong-west': 'Jurong West',
  woodlands: 'Woodlands', yishun: 'Yishun', sengkang: 'Sengkang',
  punggol: 'Punggol', bedok: 'Bedok', hougang: 'Hougang',
  'bukit-timah': 'Bukit Timah', orchard: 'Orchard', bugis: 'Bugis',
  'arab-street': 'Arab Street', 'marina-bay': 'Marina Bay',
  'geylang-serangoon': 'Geylang / Serangoon', 'pasir-ris': 'Pasir Ris',
  clementi: 'Clementi', queenstown: 'Queenstown', bishan: 'Bishan',
  'toa-payoh': 'Toa Payoh', sembawang: 'Sembawang',
  'choa-chu-kang': 'Choa Chu Kang', 'ang-mo-kio': 'Ang Mo Kio',
  'boon-lay': 'Boon Lay', jurong: 'Jurong', city: 'City Area',
}

function parseSlug(slug: string): { category: string; area: string } | null {
  const areas = Object.values(SingaporeArea) as string[]
  const categories = Object.values(BusinessCategory) as string[]

  for (const area of areas.sort((a, b) => b.length - a.length)) {
    if (slug.endsWith(`-${area}`)) {
      const category = slug.slice(0, slug.length - area.length - 1)
      if (categories.includes(category)) {
        return { category, area }
      }
    }
  }
  return null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const parsed = parseSlug(slug)
  if (!parsed) return { title: 'Not Found' }

  const catLabel = CATEGORY_LABELS[parsed.category] ?? parsed.category
  const areaLabel = AREA_LABELS[parsed.area] ?? parsed.area

  return {
    title: `Halal ${catLabel} Businesses in ${areaLabel}, Singapore | HumbleHalal`,
    description: `Find trusted Muslim-owned and halal ${catLabel.toLowerCase()} businesses in ${areaLabel}, Singapore. Verified listings on HumbleHalal.`,
    alternates: { canonical: `/business/${slug}` },
  }
}

const PAGE_SIZE = 24

export default async function BusinessSlugPage({ params }: Props) {
  const { slug } = await params
  const parsed = parseSlug(slug)
  if (!parsed) notFound()

  const { category, area } = parsed
  const catLabel = CATEGORY_LABELS[category] ?? category
  const areaLabel = AREA_LABELS[area] ?? area

  const supabase = await createClient()
  const { data: rows, count } = await supabase
    .from('listings')
    .select(
      `id, slug, name, vertical, area, address, halal_status,
       avg_rating, review_count, photos, featured, categories`,
      { count: 'exact' }
    )
    .eq('status', 'active')
    .eq('area', area)
    .contains('categories' as any, [category])
    .order('featured', { ascending: false })
    .order('avg_rating', { ascending: false })
    .range(0, PAGE_SIZE - 1)

  const listings: ListingCardProps[] = ((rows ?? []) as any[]).map((r) => ({
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
    category: r.categories?.[0],
    is_featured: r.featured ?? false,
  }))

  // Related categories in same area
  const relatedCategories = Object.entries(CATEGORY_LABELS)
    .filter(([c]) => c !== category)
    .slice(0, 8)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-charcoal/50 mb-6">
        <Link href="/" className="hover:text-primary">Home</Link>
        <span>›</span>
        <Link href="/business" className="hover:text-primary">Muslim Businesses</Link>
        <span>›</span>
        <span className="text-charcoal font-medium">{catLabel} in {areaLabel}</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-charcoal font-sans mb-2">
          Halal {catLabel} Businesses in {areaLabel}
        </h1>
        <p className="text-charcoal/50 text-sm">
          {count ?? 0} Muslim-owned & halal {catLabel.toLowerCase()} businesses in {areaLabel}
        </p>
      </header>

      {listings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-10">
          {listings.map((l) => <ListingCard key={l.id} {...l} />)}
        </div>
      ) : (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-5xl text-charcoal/20 block mb-4">store_off</span>
          <p className="text-charcoal/50 font-medium">No {catLabel} businesses found in {areaLabel}.</p>
          <Link href="/business" className="text-primary text-sm hover:underline mt-4 block">
            Browse all Muslim businesses →
          </Link>
        </div>
      )}

      {/* Related pSEO links */}
      <section className="mt-14 border-t border-gray-100 pt-8">
        <h2 className="text-base font-bold text-charcoal mb-4">Other Halal Businesses in {areaLabel}</h2>
        <div className="flex flex-wrap gap-2">
          {relatedCategories.map(([c, label]) => (
            <Link key={c} href={`/business/${c}-${area}`} className="text-sm text-primary hover:underline">
              {label} in {areaLabel}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-base font-bold text-charcoal mb-4">{catLabel} Businesses in Other Areas</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(AREA_LABELS)
            .filter(([a]) => a !== area)
            .slice(0, 8)
            .map(([a, label]) => (
              <Link key={a} href={`/business/${category}-${a}`} className="text-sm text-primary hover:underline">
                {catLabel} in {label}
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
            name: `Halal ${catLabel} Businesses in ${areaLabel}`,
            numberOfItems: listings.length,
            itemListElement: listings.map((l, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: l.name,
              url: `https://humblehalal.sg/business/${l.slug}`,
            })),
          }),
        }}
      />
    </div>
  )
}
