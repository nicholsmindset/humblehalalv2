import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ISR_REVALIDATE, SITE_URL } from '@/config'
import { ReplyForm } from '@/components/forum/ReplyForm'

export const revalidate = ISR_REVALIDATE.HIGH_TRAFFIC

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('forum_posts')
    .select('title, body')
    .eq('slug', slug)
    .single()
  if (!data) return { title: 'Community | HumbleHalal' }
  return {
    title: `${data.title} | HumbleHalal Community`,
    description: (data.body as string).slice(0, 155).replace(/\s+/g, ' '),
  }
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(date).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function ForumPostPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()
  const db = supabase as any

  const { data: { user } } = await supabase.auth.getUser()

  // Fetch post
  const { data: post } = (await db
    .from('forum_posts')
    .select('id, slug, title, body, category, tags, view_count, reply_count, is_pinned, created_at, user_id, moderation_status, user_profiles(display_name, avatar_url)')
    .eq('slug', slug)
    .eq('moderation_status', 'approved')
    .single()) as any

  if (!post) notFound()

  // Increment view count (fire and forget)
  db.from('forum_posts').update({ view_count: (post.view_count ?? 0) + 1 }).eq('id', post.id).then(() => {})

  // Fetch top-level replies
  const { data: replies } = (await db
    .from('forum_replies')
    .select('id, body, created_at, helpful_count, user_id, moderation_status, user_profiles(display_name, avatar_url)')
    .eq('post_id', post.id)
    .eq('moderation_status', 'approved')
    .is('parent_reply_id', null)
    .order('created_at', { ascending: true })
    .limit(50)) as any

  const author = post.user_profiles
  const authorName = author?.display_name ?? 'Anonymous'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    headline: post.title,
    text: post.body,
    url: `${SITE_URL}/community/${post.slug}`,
    datePublished: post.created_at,
    author: { '@type': 'Person', name: authorName },
    interactionStatistic: [
      { '@type': 'InteractionCounter', interactionType: 'https://schema.org/CommentAction', userInteractionCount: post.reply_count ?? 0 },
    ],
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-charcoal/50 mb-6 flex items-center gap-2 flex-wrap">
        <Link href="/" className="hover:text-primary">Home</Link>
        <span>›</span>
        <Link href="/community" className="hover:text-primary">Community</Link>
        {post.category && (
          <>
            <span>›</span>
            <Link href={`/community?category=${post.category}`} className="hover:text-primary capitalize">
              {post.category.replace(/-/g, ' ')}
            </Link>
          </>
        )}
        <span>›</span>
        <span className="text-charcoal truncate max-w-xs">{post.title}</span>
      </nav>

      {/* Post */}
      <article className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="p-6">
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            {post.is_pinned && (
              <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full font-medium">
                <span className="material-symbols-outlined text-xs">push_pin</span> Pinned
              </span>
            )}
            {post.category && (
              <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full capitalize font-medium">
                {post.category.replace(/-/g, ' ')}
              </span>
            )}
            {(post.tags ?? []).map((tag: string) => (
              <span key={tag} className="text-xs bg-gray-100 text-charcoal/60 px-2.5 py-0.5 rounded-full">
                #{tag}
              </span>
            ))}
          </div>

          <h1 className="text-xl font-extrabold text-charcoal mb-4 leading-snug">{post.title}</h1>

          {/* Author + meta */}
          <div className="flex items-center gap-3 mb-5 pb-5 border-b border-gray-100">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
              {authorName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-charcoal">{authorName}</p>
              <p className="text-xs text-charcoal/40">{timeAgo(post.created_at)}</p>
            </div>
            <div className="ml-auto flex items-center gap-4 text-xs text-charcoal/30">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">visibility</span>
                {post.view_count ?? 0}
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">chat_bubble</span>
                {post.reply_count ?? 0}
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="prose prose-sm max-w-none text-charcoal/80 leading-relaxed whitespace-pre-wrap">
            {post.body}
          </div>
        </div>
      </article>

      {/* Replies */}
      <section>
        <h2 className="text-sm font-bold text-charcoal mb-4">
          {(replies?.length ?? 0) === 0 ? 'No replies yet' : `${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}`}
        </h2>

        {(replies ?? []).length > 0 && (
          <div className="space-y-4 mb-8">
            {replies.map((reply: any) => {
              const replyAuthor = reply.user_profiles?.display_name ?? 'Anonymous'
              return (
                <div key={reply.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-charcoal/50 font-bold text-xs shrink-0">
                      {replyAuthor.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-charcoal">{replyAuthor}</p>
                      <p className="text-xs text-charcoal/40">{timeAgo(reply.created_at)}</p>
                    </div>
                  </div>
                  <p className="text-sm text-charcoal/80 leading-relaxed whitespace-pre-wrap">{reply.body}</p>
                </div>
              )
            })}
          </div>
        )}

        {/* Reply form */}
        {user ? (
          <ReplyForm postId={post.id} />
        ) : (
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 text-center">
            <p className="text-sm text-charcoal/60 mb-3">Sign in to join the conversation</p>
            <Link
              href={`/login?next=/community/${post.slug}`}
              className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors"
            >
              Sign in to reply
            </Link>
          </div>
        )}
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  )
}
