import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ISR_REVALIDATE, SITE_URL } from '@/config'
import { ShareButtons } from '@/components/blog/ShareButtons'

export const revalidate = ISR_REVALIDATE.LONG_TAIL

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: post } = (await (supabase as any)
    .from('ai_content_drafts')
    .select('title, keyword, area, vertical')
    .eq('id', id)
    .eq('content_type', 'blog')
    .single()) as any

  if (!post) return { title: 'Post Not Found' }

  const title = post.title ?? post.keyword ?? 'Halal Singapore Guide'
  return {
    title: `${title} | HumbleHalal Blog`,
    description: `${title}${post.area ? ` in ${post.area.replace(/-/g, ' ')}` : ' in Singapore'}. Halal guides and Muslim lifestyle content by HumbleHalal.`,
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: post } = (await (supabase as any)
    .from('ai_content_drafts')
    .select('*')
    .eq('id', id)
    .eq('content_type', 'blog')
    .eq('status', 'published')
    .single()) as any

  if (!post) notFound()

  const title = post.title ?? post.keyword ?? 'Halal Singapore Guide'
  const publishDate = new Date(post.published_at ?? post.created_at)

  // Related posts: same vertical, published, exclude current
  const { data: relatedRows } = (await (supabase as any)
    .from('ai_content_drafts')
    .select('id, title, keyword, area, vertical, word_count, published_at, created_at')
    .eq('content_type', 'blog')
    .eq('status', 'published')
    .eq('vertical', post.vertical)
    .neq('id', post.id)
    .order('published_at', { ascending: false })
    .limit(3)) as any
  const related = (relatedRows ?? []) as any[]

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-charcoal/50 mb-8">
        <Link href="/" className="hover:text-primary">Home</Link>
        <span className="mx-2">›</span>
        <Link href="/blog" className="hover:text-primary">Blog</Link>
        {post.vertical && (
          <>
            <span className="mx-2">›</span>
            <Link href={`/blog?vertical=${post.vertical}`} className="hover:text-primary capitalize">{post.vertical}</Link>
          </>
        )}
        <span className="mx-2">›</span>
        <span className="text-charcoal line-clamp-1">{title}</span>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <div className="flex flex-wrap gap-2 mb-4">
          {post.vertical && (
            <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full capitalize">
              {post.vertical}
            </span>
          )}
          {post.area && (
            <span className="text-xs font-medium text-charcoal/50 bg-gray-100 px-3 py-1 rounded-full capitalize">
              {post.area.replace(/-/g, ' ')}
            </span>
          )}
          {post.keyword && post.keyword !== post.title && (
            <span className="text-xs font-medium text-charcoal/40 bg-gray-50 px-3 py-1 rounded-full">
              {post.keyword}
            </span>
          )}
        </div>

        <h1 className="text-3xl font-extrabold text-charcoal font-sans leading-tight mb-4">
          {title}
        </h1>

        <div className="flex flex-wrap gap-4 text-sm text-charcoal/50">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-base">calendar_month</span>
            {publishDate.toLocaleDateString('en-SG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
          {post.word_count && (
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-base">schedule</span>
              {Math.ceil(post.word_count / 200)} min read
            </span>
          )}
        </div>
      </header>

      {/* Body content */}
      {post.body ? (
        <div className="prose prose-charcoal max-w-none prose-headings:font-extrabold prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
          {/* Render as pre-formatted text — in production, use a markdown renderer */}
          <div className="text-charcoal/80 leading-relaxed whitespace-pre-line text-[15px]">
            {post.body}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-xl p-8 text-center text-charcoal/40">
          <span className="material-symbols-outlined text-3xl block mb-2">hourglass_empty</span>
          Content coming soon.
        </div>
      )}

      {/* Share buttons */}
      <ShareButtons url={`${SITE_URL}/blog/${post.id}`} title={title} />

      {/* Related posts */}
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-bold text-charcoal mb-4">Related Articles</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {related.map((r: any) => (
              <Link
                key={r.id}
                href={`/blog/${r.id}`}
                className="group bg-white rounded-xl border border-gray-200 hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden"
              >
                <div className="h-20 bg-gradient-to-br from-primary/10 to-accent/10 relative overflow-hidden flex items-center justify-center">
                  <div className="islamic-pattern absolute inset-0" />
                  <span className="material-symbols-outlined text-2xl text-primary/40 relative z-10">article</span>
                </div>
                <div className="p-3">
                  <p className="text-xs font-bold text-charcoal line-clamp-2 leading-snug">
                    {r.title ?? r.keyword ?? 'Untitled'}
                  </p>
                  <p className="text-[10px] text-charcoal/40 mt-1">
                    {new Date(r.published_at ?? r.created_at).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Footer / back link */}
      <footer className="mt-12 pt-8 border-t border-gray-100">
        <Link
          href="/blog"
          className="flex items-center gap-2 text-charcoal/50 text-sm hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to blog
        </Link>
      </footer>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: title,
            datePublished: post.published_at ?? post.created_at,
            dateModified: post.updated_at ?? post.created_at,
            author: { '@type': 'Organization', name: 'HumbleHalal' },
            publisher: {
              '@type': 'Organization',
              name: 'HumbleHalal',
              url: SITE_URL,
            },
            url: `${SITE_URL}/blog/${post.id}`,
            wordCount: post.word_count,
            keywords: post.keyword,
          }),
        }}
      />
    </article>
  )
}
