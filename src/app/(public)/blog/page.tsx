import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ISR_REVALIDATE } from '@/config'
import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema'

export const revalidate = ISR_REVALIDATE.HIGH_TRAFFIC

export const metadata: Metadata = {
  title: 'Halal Food & Muslim Lifestyle Blog Singapore | HumbleHalal',
  description: 'Guides, reviews and tips for Muslims in Singapore — halal restaurants, prayer locations, events and the Muslim lifestyle.',
}

interface Props {
  searchParams: Promise<{ vertical?: string; area?: string; page?: string }>
}

const VERTICAL_LABELS: Record<string, string> = {
  food:       'Food',
  travel:     'Travel',
  events:     'Events',
  services:   'Services',
  products:   'Products',
  community:  'Community',
}

const PAGE_SIZE = 12

export default async function BlogPage({ searchParams }: Props) {
  const { vertical, area, page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1', 10))
  const offset = (page - 1) * PAGE_SIZE
  const supabase = await createClient()

  let query = (supabase as any)
    .from('ai_content_drafts')
    .select('id, title, keyword, area, vertical, word_count, created_at, published_at', { count: 'exact' })
    .eq('content_type', 'blog')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (vertical) query = query.eq('vertical', vertical)
  if (area) query = query.eq('area', area)

  const { data: rows, count } = (await query) as any
  const posts = (rows ?? []) as any[]
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  function buildHref(params: Record<string, string | undefined>) {
    const p = new URLSearchParams()
    Object.entries({ vertical, area, ...params }).forEach(([k, v]) => { if (v) p.set(k, v) })
    const qs = p.toString()
    return `/blog${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <header className="mb-10">
        <h1 className="text-3xl font-extrabold text-charcoal font-sans mb-2">
          Halal Singapore Blog
        </h1>
        <p className="text-charcoal/50 max-w-2xl">
          Guides, reviews and tips for the Muslim community in Singapore — from halal restaurant discoveries to prayer time guides.
        </p>
      </header>

      {/* Vertical tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-100 pb-4">
        <Link
          href={buildHref({ vertical: undefined, page: undefined })}
          className={`text-sm font-medium px-3 py-1 rounded-full transition-colors ${!vertical ? 'text-primary font-bold' : 'text-charcoal/60 hover:text-primary'}`}
        >
          All topics
        </Link>
        {Object.entries(VERTICAL_LABELS).map(([key, label]) => (
          <Link
            key={key}
            href={buildHref({ vertical: key, page: undefined })}
            className={`text-sm font-medium px-3 py-1 rounded-full transition-colors ${vertical === key ? 'text-primary font-bold' : 'text-charcoal/60 hover:text-primary'}`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Posts grid */}
      {posts.length === 0 ? (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-5xl text-charcoal/20 block mb-4">article</span>
          <p className="text-charcoal/50 font-medium">No posts published yet.</p>
          <p className="text-charcoal/30 text-sm mt-2">Check back soon — our Content Autopilot is writing new guides.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {posts.map((post: any) => (
              <Link
                key={post.id}
                href={`/blog/${post.id}`}
                className="group bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all overflow-hidden flex flex-col"
              >
                {/* Pattern header */}
                <div className="h-32 bg-gradient-to-br from-primary/10 to-accent/10 relative overflow-hidden flex items-center justify-center">
                  <div className="islamic-pattern absolute inset-0" />
                  <span className="material-symbols-outlined text-4xl text-primary/40 relative z-10">article</span>
                </div>

                <div className="p-5 flex flex-col gap-2 flex-1">
                  {/* Tags */}
                  <div className="flex gap-2 flex-wrap">
                    {post.vertical && (
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full capitalize">
                        {post.vertical}
                      </span>
                    )}
                    {post.area && (
                      <span className="text-[10px] font-medium text-charcoal/50 bg-gray-100 px-2 py-0.5 rounded-full capitalize">
                        {post.area.replace(/-/g, ' ')}
                      </span>
                    )}
                  </div>

                  <h2 className="font-bold text-charcoal text-sm leading-snug line-clamp-3 flex-1">
                    {post.title ?? post.keyword ?? 'Untitled'}
                  </h2>

                  <div className="flex items-center justify-between text-xs text-charcoal/40 mt-auto">
                    {post.word_count && <span>{post.word_count.toLocaleString()} words</span>}
                    <span>
                      {new Date(post.published_at ?? post.created_at).toLocaleDateString('en-SG', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <nav className="flex justify-center gap-2" aria-label="Pagination">
              {page > 1 && (
                <Link href={buildHref({ page: String(page - 1) })} className="px-4 py-2 rounded-lg border border-gray-200 text-sm hover:border-primary transition-colors">
                  ← Prev
                </Link>
              )}
              <span className="px-4 py-2 text-sm text-charcoal/60">Page {page} of {totalPages}</span>
              {page < totalPages && (
                <Link href={buildHref({ page: String(page + 1) })} className="px-4 py-2 rounded-lg border border-gray-200 text-sm hover:border-primary transition-colors">
                  Next →
                </Link>
              )}
            </nav>
          )}
        </>
      )}

      <BreadcrumbSchema items={[
        { name: 'Home', href: '/' },
        { name: 'Blog' },
      ]} />
    </div>
  )
}
