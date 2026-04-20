export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkLimit, contentLimiter, getIdentifier } from '@/lib/security/rate-limit'
import { sanitisePlainText, sanitiseHTML } from '@/lib/security/sanitise'
import { listingCreateSchema, listingUpdateSchema, validationError } from '@/lib/validation/schemas'

// ── GET /api/listings ─────────────────────────────────────────────────────
// Public: list active listings with optional filters

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const vertical = searchParams.get('vertical')
  const area = searchParams.get('area')
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20')))
  const offset = (page - 1) * limit

  const supabase = await createClient()

  let query = (supabase as any)
    .from('listings')
    .select('id, slug, name, area, vertical, halal_status, avg_rating, photos, description, address', { count: 'exact' })
    .eq('status', 'active')
    .order('avg_rating', { ascending: false })
    .range(offset, offset + limit - 1)

  if (vertical) query = query.eq('vertical', vertical)
  if (area) query = query.eq('area', area)

  const { data, count, error } = await query

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 })
  }

  return NextResponse.json({
    listings: data ?? [],
    total: count ?? 0,
    page,
    limit,
  })
}

// ── POST /api/listings ────────────────────────────────────────────────────
// Authenticated: create a new listing (business owner submission)

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  }

  // Rate limit: 10 listing submissions per hour per user
  const rl = await checkLimit(contentLimiter, getIdentifier(request, user.id))
  if (rl.limited) return rl.response

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsedBody = listingCreateSchema.safeParse(raw)
  if (!parsedBody.success) return validationError(parsedBody.error.issues)

  const { name, area, vertical, description, address, phone, website, halal_status } = parsedBody.data as {
    name: string; area: string; vertical: string; description?: string | null;
    address?: string | null; phone?: string | null; website?: string | null; halal_status?: string
  }

  const cleanHalal = halal_status ?? 'self_declared'

  // Sanitise all user-supplied text
  const cleanName = sanitisePlainText(name).trim().slice(0, 150)
  const cleanArea = sanitisePlainText(area).trim().slice(0, 100)
  const cleanDescription = description ? sanitiseHTML(description).slice(0, 2000) : null
  const cleanAddress = address ? sanitisePlainText(address).trim().slice(0, 300) : null
  const cleanPhone = phone ? sanitisePlainText(phone).trim().replace(/[^\d\s+\-().]/g, '').slice(0, 30) : null
  const cleanWebsite = website ? sanitisePlainText(website).trim().slice(0, 500) : null

  if (!cleanName) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  // Generate slug
  const slug = `${cleanName}-${cleanArea}`
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 200)

  const { data, error } = await (supabase as any)
    .from('listings')
    .insert({
      name: cleanName,
      area: cleanArea,
      vertical,
      description: cleanDescription,
      address: cleanAddress,
      phone: cleanPhone,
      website: cleanWebsite,
      halal_status: cleanHalal,
      slug,
      status: 'pending', // requires admin approval before going live
      owner_id: user.id,
    })
    .select('id, slug, name')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A listing with this name and area already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 })
  }

  return NextResponse.json({ listing: data }, { status: 201 })
}

// ── PATCH /api/listings ───────────────────────────────────────────────────
// Authenticated: update own listing fields (owner or admin)

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  }

  const rl = await checkLimit(contentLimiter, getIdentifier(request, user.id))
  if (rl.limited) return rl.response

  let rawPatch: unknown
  try {
    rawPatch = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsedPatch = listingUpdateSchema.safeParse(rawPatch)
  if (!parsedPatch.success) return validationError(parsedPatch.error.issues)

  const { id, name, description, address, phone, website, halal_status } = parsedPatch.data as {
    id: string; name?: string; description?: string | null; address?: string | null;
    phone?: string | null; website?: string | null; halal_status?: string
  }

  // Verify ownership (RLS will also enforce this, but give a clear error)
  const { data: existing } = await (supabase as any)
    .from('listings')
    .select('owner_id')
    .eq('id', id)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  }

  // Check profile role for admin bypass
  const { data: profile } = await (supabase as any)
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = (profile as { role?: string } | null)?.role === 'admin'

  if (!isAdmin && (existing as { owner_id: string }).owner_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const ALLOWED_HALAL = ['muis_certified', 'muslim_owned', 'self_declared', 'not_applicable']

  const updates: Record<string, string | null> = {}
  if (name !== undefined) updates.name = sanitisePlainText(name).trim().slice(0, 150)
  if (description !== undefined) updates.description = sanitiseHTML(description).slice(0, 2000)
  if (address !== undefined) updates.address = sanitisePlainText(address).trim().slice(0, 300)
  if (phone !== undefined) updates.phone = sanitisePlainText(phone).trim().replace(/[^\d\s+\-().]/g, '').slice(0, 30)
  if (website !== undefined) updates.website = sanitisePlainText(website).trim().slice(0, 500)
  if (halal_status !== undefined && ALLOWED_HALAL.includes(halal_status)) updates.halal_status = halal_status

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { data, error } = await (supabase as any)
    .from('listings')
    .update(updates)
    .eq('id', id)
    .select('id, slug, name, area')
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 })
  }

  return NextResponse.json({ listing: data })
}
