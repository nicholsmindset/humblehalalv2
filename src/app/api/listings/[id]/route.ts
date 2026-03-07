import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Params {
  params: Promise<{ id: string }>
}

// ── PATCH /api/listings/[id] — update listing (owner or admin only) ───────────
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const db = supabase as any

  // Verify ownership (RLS also enforces this)
  const { data: listing } = await db
    .from('listings')
    .select('id, owner_id')
    .eq('id', id)
    .maybeSingle()

  if (!listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  }

  // Check admin role via user metadata
  const isAdmin = user.user_metadata?.role === 'admin'

  if (listing.owner_id !== user.id && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Strip fields that should not be user-editable
  const { id: _id, owner_id: _owner, status: _status, slug: _slug, ...updatePayload } = body

  const { data, error } = await db
    .from('listings')
    .update({ ...updatePayload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, slug, name, status, updated_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

// ── DELETE /api/listings/[id] — soft-delete (owner or admin) ────────────────
export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const db = supabase as any

  const { data: listing } = await db
    .from('listings')
    .select('id, owner_id')
    .eq('id', id)
    .maybeSingle()

  if (!listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  }

  const isAdmin = user.user_metadata?.role === 'admin'

  if (listing.owner_id !== user.id && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Soft-delete: set status to 'deleted'
  const { error } = await db
    .from('listings')
    .update({ status: 'deleted', updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
