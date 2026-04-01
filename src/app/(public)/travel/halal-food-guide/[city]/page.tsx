import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo/schema'
import { buildMetadata } from '@/lib/seo/meta'
import { ISR_REVALIDATE, SITE_URL } from '@/config'

export const revalidate = ISR_REVALIDATE.LONG_TAIL

// Top cities for Muslim travellers from Singapore
const HALAL_CITIES = [
  'bangkok', 'kuala-lumpur', 'jakarta', 'tokyo', 'osaka', 'seoul',
  'istanbul', 'dubai', 'london', 'paris', 'melbourne', 'sydney',
  'hong-kong', 'taipei', 'rome', 'barcelona', 'amsterdam', 'berlin',
  'new-york', 'bali', 'maldives', 'cairo', 'morocco', 'lisbon',
] as const

export function generateStaticParams() {
  return HALAL_CITIES.map((city) => ({ city }))
}

interface Props {
  params: Promise<{ city: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params
  const label = city.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  return buildMetadata({
    title: `Halal Food Guide ${label}`,
    description: `Complete halal food guide for ${label}. Find Muslim-friendly restaurants, prayer facilities, and halal travel tips for Singapore Muslims visiting ${label}.`,
    path: `/travel/halal-food-guide/${city}`,
    keywords: [`halal food ${label}`, `halal restaurants ${label}`, `Muslim travel ${label}`, `halal guide ${label}`],
  })
}

export default async function HalalFoodGuidePage({ params }: Props) {
  const { city } = await params
  const isValidCity = HALAL_CITIES.includes(city as typeof HALAL_CITIES[number])

  const label = city.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  const supabase = await createClient()
  const db = supabase as any

  // Check for AI-generated travel guide
  const { data: guide } = await db
    .from('ai_content_drafts')
    .select('title, body, created_at')
    .eq('content_type', 'travel')
    .eq('status', 'published')
    .ilike('slug', `%${city}%`)
    .limit(1)
    .single()

  // If no guide and not a known city — 404
  if (!guide && !isValidCity) notFound()

  const breadcrumbs = generateBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Travel', url: `${SITE_URL}/travel` },
    { name: 'Halal Food Guides', url: `${SITE_URL}/travel` },
    { name: label, url: `${SITE_URL}/travel/halal-food-guide/${city}` },
  ])

  const faqs = generateFAQSchema([
    {
      question: `Is there halal food in ${label}?`,
      answer: `Yes, ${label} has a growing halal food scene. Many restaurants are certified halal or Muslim-friendly. This guide covers the best options for Muslim travellers.`,
    },
    {
      question: `Are there prayer facilities in ${label}?`,
      answer: `${label} has several mosques and prayer rooms for Muslim visitors. Check our guide for locations and prayer times.`,
    },
  ])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqs) }} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <nav className="text-xs text-charcoal/50 mb-6 flex items-center gap-1">
          <a href="/" className="hover:text-primary">Home</a>
          <span>/</span>
          <a href="/travel" className="hover:text-primary">Travel</a>
          <span>/</span>
          <span>Halal Food Guide — {label}</span>
        </nav>

        {guide ? (
          <>
            <h1 className="text-3xl font-extrabold text-charcoal mb-6">{guide.title}</h1>
            <article
              className="prose prose-emerald max-w-none text-charcoal/80"
              dangerouslySetInnerHTML={{ __html: guide.body ?? '' }}
            />
          </>
        ) : (
          <>
            <h1 className="text-3xl font-extrabold text-charcoal mb-4">
              Halal Food Guide: <span className="text-primary">{label}</span>
            </h1>
            <p className="text-charcoal/60 mb-8">
              Our travel guide for {label} is coming soon. In the meantime, explore our other halal travel destinations.
            </p>
            <a href="/travel" className="inline-flex items-center gap-2 text-primary font-bold hover:underline">
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Browse all travel guides
            </a>
          </>
        )}
      </main>
    </>
  )
}
