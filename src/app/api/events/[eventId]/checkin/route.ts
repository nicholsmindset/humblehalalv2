import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Props {
  params: Promise<{ eventId: string }>
}

export async function POST(request: NextRequest, { params }: Props) {
  const { eventId } = await params
  const supabase = await createClient()
  const db = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  // Verify organiser owns this event
  const { data: evt } = (await db
    .from('events')
    .select('id, created_by')
    .eq('id', eventId)
    .single()) as any

  if (!evt) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (evt.created_by !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { item_id, checked_in } = body

  if (!item_id || typeof checked_in !== 'boolean') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const updateData: any = { checked_in }
  if (checked_in) {
    updateData.checked_in_at = new Date().toISOString()
  } else {
    updateData.checked_in_at = null
  }

  const { error } = await db
    .from('event_order_items')
    .update(updateData)
    .eq('id', item_id)

  if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
