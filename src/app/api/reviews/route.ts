import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  }

  const body = await request.json()
  const { listing_id, rating, title, body: reviewBody } = body

  if (!listing_id || !rating || !reviewBody) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be 1–5' }, { status: 400 })
  }

  // Check the listing exists and is active
  const { data: listing } = await supabase
    .from('listings')
    .select('id')
    .eq('id', listing_id)
    .eq('status', 'active')
    .single()

  if (!listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  }

  // Check user hasn't already reviewed this listing
  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('listing_id', listing_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'You have already reviewed this listing' }, { status: 409 })
  }

  const { data: review, error } = (await supabase
    .from('reviews')
    .insert({
      listing_id,
      user_id: user.id,
      rating,
      title: title?.slice(0, 120) || null,
      body: reviewBody.slice(0, 2000),
      status: 'pending' as const,
    } as any)
    .select('id')
    .single()) as any

  if (error) {
    console.error('[reviews] insert error:', error)
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 })
  }

  return NextResponse.json({ id: review?.id }, { status: 201 })
}
