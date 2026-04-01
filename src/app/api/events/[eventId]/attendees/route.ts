export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Props {
  params: Promise<{ eventId: string }>
}

export async function GET(_request: NextRequest, { params }: Props) {
  const { eventId } = await params
  const supabase = await createClient()
  const db = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  // Verify organiser owns this event
  const { data: evt } = (await db
    .from('events')
    .select('id, title, created_by')
    .eq('id', eventId)
    .single()) as any

  if (!evt) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (evt.created_by !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: items } = (await db
    .from('event_order_items')
    .select(`
      id, attendee_name, attendee_email, qr_code, checked_in, checked_in_at, status,
      event_tickets!inner(name),
      event_orders!inner(order_number, event_id, status)
    `)
    .eq('event_orders.event_id', eventId)
    .eq('event_orders.status', 'completed')
    .neq('status', 'cancelled')
    .order('attendee_name')) as any

  const attendees = (items ?? []).map((item: any) => ({
    id: item.id,
    attendee_name: item.attendee_name,
    attendee_email: item.attendee_email,
    qr_code: item.qr_code,
    checked_in: item.checked_in,
    checked_in_at: item.checked_in_at,
    status: item.status,
    ticket_name: item.event_tickets?.name ?? 'Ticket',
    order_number: item.event_orders?.order_number ?? '',
  }))

  return NextResponse.json({ event_title: evt.title, attendees })
}
