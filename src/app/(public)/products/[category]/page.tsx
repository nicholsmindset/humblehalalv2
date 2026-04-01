import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { generateBreadcrumbSchema } from '@/lib/seo/schema'
import { buildMetadata } from '@/lib/seo/meta'
import { ISR_REVALIDATE, SITE_URL } from '@/config'

export const revalidate = ISR_REVALIDATE.LONG_TAIL

const PRODUCT_CATEGORIES = [
  'cosmetics', 'food-ingredients', 'snacks', 'supplements', 'skincare',
  'baby-products', 'cleaning-products', 'beverages', 'frozen-food', 'meat',
  'confectionery', 'dairy', 'fashion', 'accessories',
] as const

export function generateStaticParams() {
  return PRODUCT_CATEGORIES.map((category) => ({ category }))
}

interface Props {
  params: Promise<{ category: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params
  const label = category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  return buildMetadata({
    title: `Halal ${label} Singapore`,
    description: `Discover halal-certified ${label.toLowerCase()} in Singapore. Browse verified halal products with certifications and reviews on HumbleHalal.`,
    path: `/products/${category}`,
    keywords: [`halal ${label} Singapore`, `halal certified ${label}`, `Muslim ${label}`],
  })
}

const PAGE_SIZE = 24

export default async function HalalProductCategoryPage({ params }: Props) {
  const { category } = await params
  const label = category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  const supabase = await createClient()
  const db = supabase as any

  const { data: products, count } = await db
    .from('listings')
    .select('id, slug, name, vertical, area, address, halal_status, avg_rating, review_count, photos, price_range, is_featured', { count: 'exact' })
    .eq('status', 'active')
    .eq('vertical', 'products')
    .ilike('category', `%${category.replace(/-/g, '%')}%`)
    .order('is_featured', { ascending: false })
    .limit(PAGE_SIZE)

  if (!products) notFound()

  const breadcrumbs = generateBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Products', url: `${SITE_URL}/products` },
    { name: `Halal ${label}`, url: `${SITE_URL}/products/${category}` },
  ])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <nav className="text-xs text-charcoal/50 mb-6 flex items-center gap-1">
          <a href="/" className="hover:text-primary">Home</a>
          <span>/</span>
          <a href="/products" className="hover:text-primary">Products</a>
          <span>/</span>
          <span>Halal {label}</span>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-charcoal mb-2">
            Halal <span className="text-primary">{label}</span> in Singapore
          </h1>
          <p className="text-charcoal/60">{count ?? 0} halal {label.toLowerCase()} products</p>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {products.map((p: any) => (
              <a
                key={p.id}
                href={`/products/${p.slug}`}
                className="group bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all overflow-hidden"
              >
                <div className="p-4">
                  <h3 className="font-bold text-charcoal text-sm line-clamp-2">{p.name}</h3>
                  <p className="text-charcoal/50 text-xs mt-1 capitalize">{p.area}</p>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-charcoal/40">
            <span className="material-symbols-outlined text-5xl mb-3 block">inventory_2</span>
            <p className="font-medium">No halal {label} products listed yet.</p>
            <a href="/products" className="text-primary underline text-sm mt-2 inline-block">
              Browse all products →
            </a>
          </div>
        )}
      </main>
    </>
  )
}
