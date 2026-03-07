import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ISR_REVALIDATE, SITE_URL } from '@/config'
import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema'

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

      <BreadcrumbSchema items={[
        { name: 'Home', href: '/' },
        { name: 'Blog', href: '/blog' },
        ...(post.vertical ? [{ name: post.vertical, href: `/blog?vertical=${post.vertical}` }] : []),
        { name: title },
      ]} />

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
