import Image from 'next/image'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo/schema'
import { buildMetadata } from '@/lib/seo/meta'
import { ISR_REVALIDATE, SITE_URL } from '@/config'

export const revalidate = ISR_REVALIDATE.LONG_TAIL

const CATERING_TYPES = [
  'wedding-catering', 'corporate-catering', 'buffet-catering',
  'bento-delivery', 'bbq-catering', 'malay-catering',
  'indian-catering', 'nasi-padang', 'hari-raya-catering',
  'birthday-catering', 'event-catering', 'school-catering',
] as const

const TYPE_LABELS: Record<string, string> = {
  'wedding-catering':   'Wedding Catering',
  'corporate-catering': 'Corporate Catering',
  'buffet-catering':    'Buffet Catering',
  'bento-delivery':     'Bento & Box Meals',
  'bbq-catering':       'BBQ Catering',
  'malay-catering':     'Malay Catering',
  'indian-catering':    'Indian Muslim Catering',
  'nasi-padang':        'Nasi Padang Catering',
  'hari-raya-catering': 'Hari Raya Catering',
  'birthday-catering':  'Birthday Party Catering',
  'event-catering':     'Event Catering',
  'school-catering':    'School Catering',
}

export function generateStaticParams() {
  return CATERING_TYPES.map((type) => ({ type }))
}

interface Props {
  params: Promise<{ type: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type } = await params
  const label = TYPE_LABELS[type] ?? type.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  return buildMetadata({
    title: `Halal ${label} Singapore`,
    description: `Find MUIS-certified halal ${label.toLowerCase()} services in Singapore. Browse verified providers with reviews, pricing, and pax capacity on HumbleHalal.`,
    path: `/catering/${type}`,
    keywords: [`halal ${label} Singapore`, `${label} halal Singapore`, `Muslim ${label}`],
  })
}

const PAGE_SIZE = 24

export default async function HalalCateringTypePage({ params }: Props) {
  const { type } = await params
  const isValid = CATERING_TYPES.includes(type as typeof CATERING_TYPES[number])
  if (!isValid) notFound()

  const label = TYPE_LABELS[type] ?? type.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  const supabase = await createClient()
  const db = supabase as any

  const { data: providers, count } = await db
    .from('listings')
    .select(
      'id, slug, name, area, address, halal_status, avg_rating, review_count, photos, is_featured',
      { count: 'exact' }
    )
    .eq('status', 'active')
    .eq('vertical', 'catering')
    .ilike('category', `%${type.replace(/-/g, '%')}%`)
    .order('is_featured', { ascending: false })
    .order('avg_rating', { ascending: false })
    .limit(PAGE_SIZE)

  const breadcrumbs = generateBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Catering', url: `${SITE_URL}/catering` },
    { name: label, url: `${SITE_URL}/catering/${type}` },
  ])

  const faqs = generateFAQSchema([
    {
      question: `How do I find halal ${label.toLowerCase()} in Singapore?`,
      answer: `Browse HumbleHalal's directory of MUIS-certified halal ${label.toLowerCase()} providers. Filter by area, read reviews, and compare pricing to find the best fit for your event.`,
    },
    {
      question: `Are all ${label.toLowerCase()} providers on HumbleHalal MUIS certified?`,
      answer: `We verify halal status for each provider. Look for the green "MUIS Certified" badge — these providers have active MUIS halal certification. Other listings may be Muslim-owned or self-declared halal.`,
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
          <a href="/catering" className="hover:text-primary">Catering</a>
          <span>/</span>
          <span>Halal {label}</span>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-charcoal mb-2">
            Halal <span className="text-primary">{label}</span> Singapore
          </h1>
          <p className="text-charcoal/60">{count ?? 0} verified halal {label.toLowerCase()} providers</p>
        </div>

        {/* Type navigation */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATERING_TYPES.map((t) => (
            <a
              key={t}
              href={`/catering/${t}`}
              className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                t === type
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-charcoal border-gray-200 hover:border-primary'
              }`}
            >
              {TYPE_LABELS[t]}
            </a>
          ))}
        </div>

        {providers && providers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {providers.map((p: any) => (
              <a
                key={p.id}
                href={`/catering/${p.slug}`}
                className="group bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all overflow-hidden"
              >
                {p.photos?.[0] && (
                  <div className="h-36 overflow-hidden relative">
                    <Image src={p.photos[0]} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-bold text-charcoal text-sm line-clamp-2">{p.name}</h3>
                    {p.halal_status === 'muis_certified' && (
                      <span className="shrink-0 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">MUIS</span>
                    )}
                  </div>
                  <p className="text-charcoal/50 text-xs capitalize">{p.area}</p>
                  {p.avg_rating > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-accent text-xs">★</span>
                      <span className="text-xs font-medium text-charcoal">{Number(p.avg_rating).toFixed(1)}</span>
                      <span className="text-xs text-charcoal/40">({p.review_count})</span>
                    </div>
                  )}
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-charcoal/40">
            <span className="material-symbols-outlined text-5xl mb-3 block">restaurant</span>
            <p className="font-medium">No {label.toLowerCase()} providers listed yet.</p>
            <a href="/catering" className="text-primary underline text-sm mt-2 inline-block">
              Browse all catering →
            </a>
          </div>
        )}

        {/* SEO cross-links */}
        <section className="mt-16 border-t border-gray-100 pt-10">
          <h2 className="text-lg font-bold text-charcoal mb-4">Explore Other Halal Catering Types</h2>
          <div className="flex flex-wrap gap-3">
            {CATERING_TYPES.filter((t) => t !== type).map((t) => (
              <a key={t} href={`/catering/${t}`} className="text-sm text-primary hover:underline">
                {TYPE_LABELS[t]}
              </a>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}
