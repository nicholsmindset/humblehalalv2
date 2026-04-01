export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkLimit, searchLimiter, getIdentifier } from '@/lib/security/rate-limit'

const MAX_RESULTS_PER_VERTICAL = 5

export async function GET(request: NextRequest) {
  const rl = await checkLimit(searchLimiter, getIdentifier(request))
  if (rl.limited) return rl.response

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()
  const vertical = searchParams.get('vertical') // optional filter
  const area = searchParams.get('area')          // optional filter

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  if (q.length > 100) {
    return NextResponse.json({ error: 'Query too long' }, { status: 400 })
  }

  const supabase = await createClient()
  const pattern = `%${q}%`

  // Run vertical queries in parallel
  type SearchResult = { vertical: string; items: unknown[] }
  const queryPromises: Promise<SearchResult>[] = []

  const shouldInclude = (v: string) => !vertical || vertical === v

  async function runQuery<T>(v: string, p: PromiseLike<{ data: T[] | null }>): Promise<SearchResult> {
    const { data } = await p
    return { vertical: v, items: (data ?? []) as unknown[] }
  }

  // ── Food / Restaurants ──────────────────────────────────────
  if (shouldInclude('food')) {
    queryPromises.push(runQuery('food',
      supabase
        .from('listings')
        .select('id, slug, name, area, halal_status, photos, vertical')
        .eq('vertical', 'food')
        .eq('status', 'active')
        .or(`name.ilike.${pattern},description.ilike.${pattern}`)
        .order('avg_rating', { ascending: false })
        .limit(MAX_RESULTS_PER_VERTICAL) as any
    ))
  }

  // ── Mosques ─────────────────────────────────────────────────
  if (shouldInclude('mosque')) {
    let q2 = supabase
      .from('mosques')
      .select('id, slug, name, area')
      .ilike('name', pattern)
      .limit(MAX_RESULTS_PER_VERTICAL)

    if (area) q2 = q2.eq('area', area)

    queryPromises.push(runQuery('mosque', q2 as any))
  }

  // ── Events ──────────────────────────────────────────────────
  if (shouldInclude('events')) {
    queryPromises.push(runQuery('events',
      supabase
        .from('events')
        .select('id, slug, title, area, starts_at, price_type')
        .eq('status', 'active')
        .gte('ends_at', new Date().toISOString())
        .or(`title.ilike.${pattern},description.ilike.${pattern}`)
        .order('starts_at', { ascending: true })
        .limit(MAX_RESULTS_PER_VERTICAL) as any
    ))
  }

  // ── Classifieds ─────────────────────────────────────────────
  if (shouldInclude('classifieds')) {
    queryPromises.push(runQuery('classifieds',
      supabase
        .from('classifieds')
        .select('id, slug, title, area, price, category')
        .eq('status', 'active')
        .or(`title.ilike.${pattern},description.ilike.${pattern}`)
        .order('created_at', { ascending: false })
        .limit(MAX_RESULTS_PER_VERTICAL) as any
    ))
  }

  const results = await Promise.all(queryPromises)

  // Flatten into a unified response
  return NextResponse.json({
    query: q,
    results: results.map((r: SearchResult) => ({ vertical: r.vertical, items: r.items })),
    total: results.reduce((sum: number, r: SearchResult) => sum + r.items.length, 0),
  })
}
