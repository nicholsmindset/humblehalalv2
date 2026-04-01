import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ISR_REVALIDATE } from '@/config'

export const revalidate = ISR_REVALIDATE.HIGH_TRAFFIC

export const metadata: Metadata = {
  title: 'Muslim Community Forum Singapore | HumbleHalal',
  description: 'Join Singapore\'s Muslim community forum — discuss halal food, Islamic finance, family life, travel, and more. Ask questions, share experiences, connect.',
}

interface Props {
  searchParams: Promise<{ category?: string; page?: string }>
}

const CATEGORIES: { key: string; label: string; icon: string }[] = [
  { key: '',             label: 'All',            icon: 'forum' },
  { key: 'halal-food',  label: 'Halal Food',      icon: 'restaurant' },
  { key: 'parenting',   label: 'Parenting',       icon: 'family_restroom' },
  { key: 'finance',     label: 'Islamic Finance',  icon: 'account_balance' },
  { key: 'travel',      label: 'Travel',          icon: 'flight' },
  { key: 'events',      label: 'Events',          icon: 'event' },
  { key: 'classifieds', label: 'Classifieds',     icon: 'sell' },
  { key: 'general',     label: 'General',         icon: 'chat' },
]

const PAGE_SIZE = 20

export default async function CommunityPage({ searchParams }: Props) {
  const { category, page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1', 10))
  const offset = (page - 1) * PAGE_SIZE
  const supabase = await createClient()

  let query = (supabase as any)
    .from('forum_posts')
    .select(
      'id, slug, title, category, tags, view_count, reply_count, is_pinned, created_at, user_id',
      { count: 'exact' }
    )
    .eq('moderation_status', 'approved')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (category) query = query.eq('category', category)

  const { data: rows, count } = (await query) as any
  const posts: any[] = rows ?? []
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  // Pinned posts (always show, regardless of category filter)
  const { data: pinnedRaw } = category
    ? (await (supabase as any)
        .from('forum_posts')
        .select('id, slug, title, category, reply_count, created_at')
        .eq('moderation_status', 'approved')
        .eq('is_pinned', true)
        .limit(3)) as any
    : { data: [] }
  const pinned: any[] = pinnedRaw ?? []

  function buildUrl(params: Record<string, string | number | undefined>) {
    const base = new URLSearchParams()
    const merged = { page: '1', ...(category ? { category } : {}), ...params }
    Object.entries(merged).forEach(([k, v]) => {
      if (v !== undefined && v !== '') base.set(k, String(v))
    })
    const qs = base.toString()
    return `/community${qs ? `?${qs}` : ''}`
  }

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `${days}d ago`
    return new Date(iso).toLocaleDateString('en-SG', { day: '2-digit', month: 'short' })
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-charcoal font-sans">Community</h1>
            <p className="text-charcoal/50 mt-1 text-sm">
              Ask questions, share experiences, connect with Singapore&apos;s Muslim community
            </p>
          </div>
          <Link
            href="/login?next=/community/new"
            className="bg-accent text-charcoal rounded-lg font-bold px-4 py-2.5 text-sm hover:bg-accent/90 transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">edit</span>
            New Post
          </Link>
        </div>
      </header>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.key}
            href={buildUrl({ category: cat.key || undefined, page: '1' })}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${
              (category ?? '') === cat.key
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-charcoal/60 hover:bg-gray-200'
            }`}
          >
            <span className="material-symbols-outlined text-base">{cat.icon}</span>
            {cat.label}
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Posts list */}
        <div className="md:col-span-2">
          {/* Pinned posts (only show on All tab) */}
          {!category && pinned.length > 0 && (
            <div className="mb-4">
              {pinned.map((post: any) => (
                <Link
                  key={post.id}
                  href={`/community/${post.slug}`}
                  className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 mb-2 hover:bg-primary/10 transition-colors"
                >
                  <span className="material-symbols-outlined text-primary text-base shrink-0 mt-0.5">push_pin</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-charcoal text-sm truncate">{post.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-charcoal/40">
                      <span className="capitalize">{post.category?.replace(/-/g, ' ')}</span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">chat_bubble</span>
                        {post.reply_count ?? 0}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Posts */}
          {posts.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
              <span className="material-symbols-outlined text-5xl text-charcoal/20 block mb-3">forum</span>
              <p className="text-charcoal/50 font-medium">No posts yet</p>
              <p className="text-charcoal/30 text-sm mt-1">Be the first to start a discussion.</p>
              <Link
                href="/login?next=/community/new"
                className="inline-block mt-4 bg-primary text-white rounded-lg px-4 py-2 text-sm font-bold hover:bg-primary/90 transition-colors"
              >
                Start a discussion
              </Link>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-50 overflow-hidden">
              {posts.map((post: any) => {
                const catLabel = CATEGORIES.find((c) => c.key === post.category)?.label ?? post.category
                return (
                  <Link
                    key={post.id}
                    href={`/community/${post.slug}`}
                    className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
                  >
                    {/* Reply count bubble */}
                    <div className="shrink-0 w-12 h-12 rounded-xl bg-gray-100 flex flex-col items-center justify-center">
                      <span className="text-sm font-extrabold text-charcoal leading-none">
                        {post.reply_count ?? 0}
                      </span>
                      <span className="text-[9px] text-charcoal/40 uppercase tracking-wide leading-none mt-0.5">
                        {(post.reply_count ?? 0) === 1 ? 'reply' : 'replies'}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-charcoal text-sm leading-snug line-clamp-2">
                        {post.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-charcoal/40">
                        {catLabel && (
                          <span className="bg-gray-100 text-charcoal/60 px-2 py-0.5 rounded-full capitalize">
                            {catLabel}
                          </span>
                        )}
                        {Array.isArray(post.tags) && post.tags.slice(0, 2).map((tag: string) => (
                          <span key={tag} className="text-primary/60">#{tag}</span>
                        ))}
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">visibility</span>
                          {(post.view_count ?? 0).toLocaleString()}
                        </span>
                        <span>{timeAgo(post.created_at)}</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              {page > 1 && (
                <Link
                  href={buildUrl({ page: page - 1 })}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-charcoal hover:bg-gray-50 transition-colors"
                >
                  Previous
                </Link>
              )}
              <span className="text-sm text-charcoal/50">Page {page} of {totalPages}</span>
              {page < totalPages && (
                <Link
                  href={buildUrl({ page: page + 1 })}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-charcoal hover:bg-gray-50 transition-colors"
                >
                  Next
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Community rules */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-bold text-charcoal text-sm mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">gavel</span>
              Community Guidelines
            </h2>
            <ol className="space-y-2 text-xs text-charcoal/60 list-decimal list-inside">
              <li>Be respectful and kind to all members</li>
              <li>Keep discussions relevant to halal living</li>
              <li>No spam, advertising, or self-promotion</li>
              <li>Cite sources for Islamic rulings</li>
              <li>Report harmful content — don&apos;t engage</li>
            </ol>
          </div>

          {/* Popular categories */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-bold text-charcoal text-sm mb-3">Browse Categories</h2>
            <div className="space-y-1.5">
              {CATEGORIES.filter((c) => c.key).map((cat) => (
                <Link
                  key={cat.key}
                  href={buildUrl({ category: cat.key, page: '1' })}
                  className="flex items-center gap-2 py-1.5 text-sm text-charcoal/60 hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-base text-charcoal/30">{cat.icon}</span>
                  {cat.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Related links */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
            <h2 className="font-bold text-charcoal text-sm mb-3">Explore HumbleHalal</h2>
            <div className="space-y-2">
              {[
                { href: '/halal-food', label: 'Halal Restaurants', icon: 'restaurant' },
                { href: '/events', label: 'Events', icon: 'event' },
                { href: '/classifieds', label: 'Classifieds', icon: 'sell' },
                { href: '/mosque', label: 'Mosques', icon: 'mosque' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 text-sm text-charcoal/60 hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-base text-primary/50">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'DiscussionForumPosting',
            name: 'HumbleHalal Community Forum',
            description: metadata.description,
            url: 'https://humblehalal.sg/community',
          }),
        }}
      />
    </div>
  )
}
