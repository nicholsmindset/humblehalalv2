import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ── GET /api/listings — list with filters ────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const vertical = searchParams.get('vertical')
  const area = searchParams.get('area')
  const halal_status = searchParams.get('halal_status')
  const limit = Math.min(Number(searchParams.get('limit') ?? '24'), 100)
  const offset = Number(searchParams.get('offset') ?? '0')

  const supabase = await createClient()
  const db = supabase as any

  let query = db
    .from('listings')
    .select('id, slug, name, vertical, area, address, halal_status, avg_rating, review_count, photos, featured, status, created_at', { count: 'exact' })
    .eq('status', 'active')
    .order('featured', { ascending: false })
    .order('avg_rating', { ascending: false })
    .range(offset, offset + limit - 1)

  if (vertical) query = query.eq('vertical', vertical)
  if (area) query = query.ilike('area', `%${area}%`)
  if (halal_status) query = query.eq('halal_status', halal_status)

  const { data, count, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, count, limit, offset })
}

// ── POST /api/listings — create listing (authenticated) ──────────────────────
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { name, vertical, area, address, phone, website, email, description, halal_status, categories } = body

  // Basic validation
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return NextResponse.json({ error: 'name is required (min 2 chars)' }, { status: 422 })
  }
  if (!vertical || typeof vertical !== 'string') {
    return NextResponse.json({ error: 'vertical is required' }, { status: 422 })
  }
  if (!area || typeof area !== 'string') {
    return NextResponse.json({ error: 'area is required' }, { status: 422 })
  }

  const ALLOWED_VERTICALS = ['food', 'catering', 'services', 'products', 'events', 'classifieds']
  if (!ALLOWED_VERTICALS.includes(vertical)) {
    return NextResponse.json({ error: `vertical must be one of: ${ALLOWED_VERTICALS.join(', ')}` }, { status: 422 })
  }

  // Generate slug
  const baseSlug = `${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${area.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

  const db = supabase as any

  // Ensure slug uniqueness
  const { data: existing } = await db
    .from('listings')
    .select('id')
    .eq('slug', baseSlug)
    .maybeSingle()

  const slug = existing ? `${baseSlug}-${Date.now()}` : baseSlug

  const { data, error } = await db
    .from('listings')
    .insert({
      name: name.trim(),
      slug,
      vertical,
      area: area.trim(),
      address: address ?? null,
      phone: phone ?? null,
      website: website ?? null,
      email: email ?? null,
      description: description ?? null,
      halal_status: halal_status ?? 'self_declared',
      categories: categories ?? [],
      status: 'pending',
      owner_id: user.id,
    })
    .select('id, slug, name, status')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
