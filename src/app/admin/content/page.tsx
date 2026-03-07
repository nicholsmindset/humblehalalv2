import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Content Autopilot | HumbleHalal Admin' }
export const dynamic = 'force-dynamic'

const CONTENT_TYPE_LABELS: Record<string, string> = {
  blog:             'Blog Post',
  travel:           'Travel Guide',
  social:           'Social Media',
  newsletter:       'Newsletter',
  meta_description: 'Meta Description',
  product_review:   'Product Review',
}

const STATUS_STYLES: Record<string, string> = {
  draft:     'bg-white/10 text-white/50',
  pending:   'bg-accent/20 text-accent',
  published: 'bg-primary/20 text-primary',
  archived:  'bg-red-500/10 text-red-400',
}

const TABS = [
  { key: '',           label: 'All',        icon: 'article' },
  { key: 'blog',       label: 'Blog',       icon: 'rss_feed' },
  { key: 'travel',     label: 'Travel',     icon: 'travel_explore' },
  { key: 'social',     label: 'Social',     icon: 'share' },
  { key: 'newsletter', label: 'Newsletter', icon: 'email' },
]

const PAGE_SIZE = 20

interface Props {
  searchParams: Promise<{ type?: string; status?: string; page?: string }>
}

export default async function ContentPage({ searchParams }: Props) {
  const { type, status, page } = await searchParams
  const pageNum = Math.max(1, Number(page) || 1)
  const offset = (pageNum - 1) * PAGE_SIZE

  const supabase = await createClient()

  let query = (supabase as any)
    .from('ai_content_drafts')
    .select(
      'id, content_type, title, status, seo_score, word_count, keyword, area, vertical, created_at, published_at',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (type) query = query.eq('content_type', type)
  if (status) query = query.eq('status', status)

  const { data: rows, count } = (await query) as any
  const drafts = (rows ?? []) as any[]
  const total = count ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  function tabHref(key: string) {
    const p = new URLSearchParams()
    if (key) p.set('type', key)
    if (status) p.set('status', status)
    return `/admin/content${p.toString() ? `?${p.toString()}` : ''}`
  }

  function statusHref(s: string) {
    const p = new URLSearchParams()
    if (type) p.set('type', type)
    if (s) p.set('status', s)
    return `/admin/content${p.toString() ? `?${p.toString()}` : ''}`
  }

  function pageHref(p: number) {
    const params = new URLSearchParams()
    if (type) params.set('type', type)
    if (status) params.set('status', status)
    params.set('page', String(p))
    return `/admin/content?${params.toString()}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Content Autopilot</h1>
          <p className="text-white/40 text-sm mt-1">
            {total.toLocaleString()} AI-generated draft{total !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/admin/content/generate"
          className="flex items-center gap-2 bg-accent text-charcoal rounded-lg px-4 py-2 text-sm font-bold hover:bg-accent/90 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">auto_awesome</span>
          Generate
        </Link>
      </div>

      {/* Content type tabs */}
      <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1 w-fit flex-wrap">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={tabHref(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              (type ?? '') === tab.key
                ? 'bg-primary text-white'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-xs">{tab.icon}</span>
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: '',          label: 'All statuses' },
          { key: 'draft',     label: 'Draft' },
          { key: 'pending',   label: 'Pending' },
          { key: 'published', label: 'Published' },
          { key: 'archived',  label: 'Archived' },
        ].map((s) => (
          <Link
            key={s.key}
            href={statusHref(s.key)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              (status ?? '') === s.key
                ? 'border-primary text-primary bg-primary/10'
                : 'border-white/10 text-white/40 hover:text-white hover:border-white/30'
            }`}
          >
            {s.label}
          </Link>
        ))}
      </div>

      {/* Drafts grid */}
      {drafts.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
          <span className="material-symbols-outlined text-4xl text-white/20 block mb-3">auto_awesome</span>
          <p className="text-white/60 font-medium mb-1">No content drafts yet</p>
          <p className="text-white/30 text-sm mb-4">
            Run the Content Autopilot to generate blog posts, travel guides, and more.
          </p>
          <Link
            href="/admin/content/generate"
            className="inline-flex items-center gap-2 bg-accent text-charcoal rounded-lg px-4 py-2 text-sm font-bold hover:bg-accent/90 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            Generate your first draft
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {drafts.map((d: any) => (
              <div
                key={d.id}
                className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/[0.07] transition-colors group"
              >
                {/* Top row: status + type + SEO score */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[d.status] ?? 'bg-white/10 text-white/40'}`}>
                      {d.status}
                    </span>
                    <span className="text-white/30 text-xs">
                      {CONTENT_TYPE_LABELS[d.content_type] ?? d.content_type}
                    </span>
                  </div>
                  {d.seo_score != null && (
                    <span className={`text-xs font-bold tabular-nums ${
                      d.seo_score >= 80 ? 'text-primary' :
                      d.seo_score >= 60 ? 'text-accent' : 'text-red-400'
                    }`}>
                      SEO {d.seo_score}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-white font-semibold text-sm leading-snug mb-3 line-clamp-2">
                  {d.title ?? '(Untitled)'}
                </h3>

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-white/30 text-xs">
                  {d.keyword && (
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">search</span>
                      {d.keyword}
                    </span>
                  )}
                  {d.word_count != null && (
                    <span>{d.word_count.toLocaleString()} words</span>
                  )}
                  {d.area && (
                    <span className="capitalize">{d.area.replace(/-/g, ' ')}</span>
                  )}
                  {d.vertical && (
                    <span className="capitalize">{d.vertical}</span>
                  )}
                  <span className="ml-auto">
                    {new Date(d.created_at).toLocaleDateString('en-SG')}
                  </span>
                </div>

                {/* Hover actions */}
                <div className="mt-3 pt-3 border-t border-white/5 flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={`/admin/content/${d.id}`} className="text-xs text-primary hover:underline">
                    View draft →
                  </Link>
                  {d.status === 'draft' && (
                    <span className="text-xs text-white/30">Ready to publish</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <p className="text-white/40">
                {total.toLocaleString()} draft{total !== 1 ? 's' : ''} · Page {pageNum} of {totalPages}
              </p>
              <div className="flex gap-2">
                {pageNum > 1 && (
                  <Link
                    href={pageHref(pageNum - 1)}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    ← Prev
                  </Link>
                )}
                {pageNum < totalPages && (
                  <Link
                    href={pageHref(pageNum + 1)}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    Next →
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
