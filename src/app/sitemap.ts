import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'
import { SingaporeArea, SITE_URL } from '@/config'

const AREAS = Object.values(SingaporeArea)

// pSEO category slugs — keep in sync with page.tsx PRODUCT_META / SERVICE_META / CATERING_TYPE_META
const CATERING_SLUGS = ['wedding-catering', 'corporate-catering', 'aqiqah-catering', 'birthday-catering', 'buffet-catering', 'bento-catering']
const SERVICE_SLUGS = ['muslim-finance', 'muslim-legal', 'muslim-healthcare', 'muslim-education', 'muslim-wedding', 'muslim-photography', 'muslim-travel', 'muslim-cleaning']
const PRODUCT_SLUGS = ['halal-meat', 'halal-groceries', 'halal-cosmetics', 'halal-supplements', 'halal-fashion', 'halal-snacks']

const VERTICAL_TO_PATH: Record<string, string> = {
  food: 'restaurant',
  catering: 'catering',
  services: 'services',
  products: 'products',
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  // Fetch all slugs in parallel — cast as any to bypass Supabase never inference
  const db = supabase as any
  const [
    { data: listings },
    { data: mosques },
    { data: events },
    { data: classifieds },
    { data: prayerRooms },
    { data: blogPosts },
  ] = (await Promise.all([
    db.from('listings').select('slug, vertical, updated_at').eq('status', 'active').limit(5000),
    db.from('mosques').select('slug, updated_at').limit(2000),
    db.from('events').select('slug, updated_at').eq('status', 'active').gte('ends_at', new Date().toISOString()).limit(500),
    db.from('classifieds').select('slug, updated_at').eq('status', 'active').limit(2000),
    db.from('prayer_rooms').select('slug, updated_at').limit(500),
    db.from('ai_content_drafts').select('id, updated_at').eq('content_type', 'blog').eq('status', 'published').limit(1000),
  ])) as any[]

  const now = new Date().toISOString()

  // ── Static pages ──────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL,                              lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${SITE_URL}/halal-food`,              lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${SITE_URL}/events`,                  lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${SITE_URL}/mosque`,                  lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${SITE_URL}/classifieds`,             lastModified: now, changeFrequency: 'daily',   priority: 0.8 },
    { url: `${SITE_URL}/blog`,                    lastModified: now, changeFrequency: 'daily',   priority: 0.8 },
    { url: `${SITE_URL}/prayer-times/singapore`,  lastModified: now, changeFrequency: 'daily',   priority: 0.8 },
    { url: `${SITE_URL}/prayer-rooms`,            lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${SITE_URL}/catering`,                lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${SITE_URL}/services`,                lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${SITE_URL}/products`,                lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${SITE_URL}/listings/new`,            lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/login`,                   lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
  ]

  // ── pSEO category pages ───────────────────────────────────
  const cateringCategoryPages: MetadataRoute.Sitemap = CATERING_SLUGS.map((slug) => ({
    url: `${SITE_URL}/catering/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  const serviceCategoryPages: MetadataRoute.Sitemap = SERVICE_SLUGS.map((slug) => ({
    url: `${SITE_URL}/services/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  const productCategoryPages: MetadataRoute.Sitemap = PRODUCT_SLUGS.map((slug) => ({
    url: `${SITE_URL}/products/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // ── Prayer rooms by area ──────────────────────────────────
  const prayerRoomAreaPages: MetadataRoute.Sitemap = AREAS.map((area) => ({
    url: `${SITE_URL}/prayer-rooms?area=${area}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  // ── Listings — route by vertical ──────────────────────────
  const listingPages: MetadataRoute.Sitemap = ((listings ?? []) as any[]).map((l: any) => {
    const path = VERTICAL_TO_PATH[l.vertical] ?? 'restaurant'
    return {
      url: `${SITE_URL}/${path}/${l.slug}`,
      lastModified: l.updated_at ?? now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }
  })

  // ── Mosques ───────────────────────────────────────────────
  const mosquePages: MetadataRoute.Sitemap = ((mosques ?? []) as any[]).map((m: any) => ({
    url: `${SITE_URL}/mosque/${m.slug}`,
    lastModified: m.updated_at ?? now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // ── Events ────────────────────────────────────────────────
  const eventPages: MetadataRoute.Sitemap = ((events ?? []) as any[]).map((e: any) => ({
    url: `${SITE_URL}/events/${e.slug}`,
    lastModified: e.updated_at ?? now,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  // ── Classifieds ───────────────────────────────────────────
  const classifiedPages: MetadataRoute.Sitemap = (classifieds ?? []).map((c: any) => ({
    url: `${SITE_URL}/classifieds/${c.slug}`,
    lastModified: c.updated_at ?? now,
    changeFrequency: 'daily' as const,
    priority: 0.6,
  }))

  // ── Prayer room detail pages ──────────────────────────────
  const prayerRoomPages: MetadataRoute.Sitemap = (prayerRooms ?? []).map((r: any) => ({
    url: `${SITE_URL}/prayer-rooms/${r.slug}`,
    lastModified: r.updated_at ?? now,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  // ── Blog posts ────────────────────────────────────────────
  const blogPages: MetadataRoute.Sitemap = (blogPosts ?? []).map((p: any) => ({
    url: `${SITE_URL}/blog/${p.id}`,
    lastModified: p.updated_at ?? now,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [
    ...staticPages,
    ...cateringCategoryPages,
    ...serviceCategoryPages,
    ...productCategoryPages,
    ...prayerRoomAreaPages,
    ...listingPages,
    ...mosquePages,
    ...eventPages,
    ...classifiedPages,
    ...prayerRoomPages,
    ...blogPages,
  ]
}
