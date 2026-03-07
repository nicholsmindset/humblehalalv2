import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyCronSecret } from '@/lib/utils/cron-auth'
import { generateNewsletter } from '@/lib/anthropic/content'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// Weekly newsletter draft generation — Wed 6am SGT
export async function GET(request: NextRequest) {
  const deny = verifyCronSecret(request)
  if (deny) return deny

  const db = getServiceClient()

  try {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const since = sevenDaysAgo.toISOString()

    // Gather newsletter data in parallel
    const [
      { data: newListings },
      { data: upcomingEvents },
      { data: topSearches },
      { data: blogPosts },
    ] = await Promise.all([
      db.from('listings')
        .select('name, area, vertical')
        .gte('created_at', since)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(10),
      db.from('events')
        .select('title, start_datetime')
        .eq('status', 'active')
        .gte('start_datetime', new Date().toISOString())
        .order('start_datetime', { ascending: true })
        .limit(5),
      db.from('analytics_events')
        .select('search_term')
        .eq('event_type', 'search_query')
        .gte('timestamp', since)
        .not('search_term', 'is', null)
        .limit(100),
      db.from('ai_content_drafts')
        .select('title, slug')
        .eq('content_type', 'blog')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(3),
    ])

    // Deduplicate top searches
    const searchCounts = new Map<string, number>()
    for (const row of topSearches ?? []) {
      if (row.search_term) {
        const term = row.search_term.toLowerCase()
        searchCounts.set(term, (searchCounts.get(term) ?? 0) + 1)
      }
    }
    const topSearchList = [...searchCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([term]) => term)

    const result = await generateNewsletter({
      newListings: (newListings ?? []).map((l) => ({
        name: l.name,
        area: l.area ?? '',
        cuisine: l.vertical,
      })),
      upcomingEvents: (upcomingEvents ?? []).map((e) => ({
        title: e.title,
        date: new Date(e.start_datetime).toLocaleDateString('en-SG'),
      })),
      topSearches: topSearchList,
      blogPosts: (blogPosts ?? []).map((b) => ({
        title: b.title ?? '',
        slug: b.slug ?? '',
      })),
    })

    // Save as draft
    const slug = `newsletter-${new Date().toISOString().slice(0, 10)}`
    await db.from('ai_content_drafts').insert({
      content_type: 'newsletter',
      title: result.subject,
      slug,
      body: result.body_html,
      meta_description: result.preview_text,
      status: 'draft',
    })

    await db.from('ai_activity_log').insert({
      action: 'cron:newsletter-draft',
      details: `Newsletter draft generated: "${result.subject}"`,
      metadata: { slug, subject: result.subject },
    })

    return NextResponse.json({ ok: true, subject: result.subject, slug })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Newsletter draft failed'
    console.error('[cron/newsletter-draft]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
