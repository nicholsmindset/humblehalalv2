export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { sendTicketConfirmation } from '@/lib/resend/send'

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' })
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err: any) {
    console.error('[stripe webhook] signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Replay protection: Stripe's library verifies the timestamp signature, but
  // we add an application-level freshness window as defence-in-depth.
  const MAX_EVENT_AGE_SECONDS = 300
  const ageSeconds = Math.floor(Date.now() / 1000) - event.created
  if (ageSeconds > MAX_EVENT_AGE_SECONDS) {
    console.warn(`[stripe webhook] rejecting stale event ${event.id} (age ${ageSeconds}s)`)
    return NextResponse.json({ error: 'Event too old' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
      break
    default:
      console.log(`[stripe webhook] ignoring unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const supabase = await createClient()
  const db = supabase as any

  const orderId = session.metadata?.order_id
  if (!orderId) return

  // Mark order completed
  const { data: order } = (await db
    .from('event_orders')
    .update({
      status: 'completed',
      stripe_payment_intent_id: session.payment_intent,
    })
    .eq('id', orderId)
    .select('id, event_id, name, email, total_amount')
    .single()) as any

  if (!order) return

  // Parse items from metadata
  let items: { ticket_id: string; quantity: number }[] = []
  try {
    items = JSON.parse(session.metadata?.items ?? '[]')
  } catch {
    return
  }

  const attendeeName = session.metadata?.attendee_name ?? order.name

  // Generate order items with QR codes
  const itemInserts: any[] = []
  const soldUpdates: { ticket_id: string; qty: number }[] = []

  for (const item of items) {
    for (let i = 0; i < item.quantity; i++) {
      const qrCode = `${orderId}-${item.ticket_id}-${i}-${Date.now()}`
      itemInserts.push({
        order_id: orderId,
        ticket_id: item.ticket_id,
        attendee_name: attendeeName,
        attendee_email: order.email,
        qr_code: qrCode,
      })
    }
    soldUpdates.push({ ticket_id: item.ticket_id, qty: item.quantity })
  }

  if (itemInserts.length > 0) {
    await db.from('event_order_items').insert(itemInserts)
  }

  // Increment sold_count on each ticket tier
  for (const { ticket_id, qty } of soldUpdates) {
    await db.rpc('increment_ticket_sold_count', { p_ticket_id: ticket_id, p_qty: qty })
      .then(() => {})
      .catch(() => {
        // RPC may not exist yet — fallback: read-modify-write
        db.from('event_tickets')
          .select('sold_count')
          .eq('id', ticket_id)
          .single()
          .then(({ data }: any) => {
            if (data) {
              db.from('event_tickets')
                .update({ sold_count: (data.sold_count ?? 0) + qty })
                .eq('id', ticket_id)
            }
          })
      })
  }

  // Update event totals via RPC (increment pattern — db.raw is not available in supabase-js)
  await db
    .rpc('increment_event_totals', {
      p_event_id: order.event_id,
      p_tickets: itemInserts.length,
      p_revenue: order.total_amount,
    })
    .then(() => {})
    .catch(() => {})  // best-effort; RPC may not exist yet

  // Fetch event details for emails
  const { data: evt } = (await db
    .from('events')
    .select('slug, title, starts_at, ends_at, venue, area, is_online, online_platform, online_link')
    .eq('id', order.event_id)
    .single()) as any

  // Send ticket confirmation email
  if (evt && itemInserts.length > 0) {
    // Fetch ticket names for email
    const ticketIdSet = Array.from(new Set(itemInserts.map((i: any) => i.ticket_id))) as string[]
    const { data: ticketRows } = (await db
      .from('event_tickets')
      .select('id, name, price')
      .in('id', ticketIdSet)) as any
    const ticketMap: Record<string, any> = {}
    for (const t of (ticketRows ?? [])) ticketMap[t.id] = t

    const startDate = new Date(evt.starts_at)
    await sendTicketConfirmation({
      orderNumber: order.order_number ?? orderId.slice(0, 8).toUpperCase(),
      attendeeName: attendeeName,
      attendeeEmail: order.email,
      eventTitle: evt.title,
      eventSlug: evt.slug,
      eventDate: startDate.toLocaleDateString('en-SG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      eventTime: startDate.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' }),
      venue: evt.venue ?? null,
      area: evt.area ?? null,
      isOnline: !!evt.is_online,
      onlinePlatform: evt.online_platform ?? null,
      tickets: itemInserts.map((item: any) => ({
        id: item.ticket_id,
        qrCode: item.qr_code,
        ticketName: ticketMap[item.ticket_id]?.name ?? 'Ticket',
        attendeeName: item.attendee_name,
        price: ticketMap[item.ticket_id]?.price ?? 0,
      })),
    })
  }

  // Schedule reminders (24h + 1h before event)
  if (evt?.starts_at) {
    const startTime = new Date(evt.starts_at).getTime()
    const reminder24h = new Date(startTime - 24 * 60 * 60 * 1000)
    const reminder1h = new Date(startTime - 60 * 60 * 1000)
    const now = Date.now()

    for (const item of itemInserts) {
      // Find the created order item
      const { data: createdItem } = (await db
        .from('event_order_items')
        .select('id')
        .eq('order_id', orderId)
        .eq('qr_code', item.qr_code)
        .single()) as any

      if (!createdItem) continue

      const reminders: any[] = []
      if (reminder24h.getTime() > now) {
        reminders.push({ order_item_id: createdItem.id, channel: 'email', scheduled_for: reminder24h.toISOString(), status: 'pending' })
      }
      if (reminder1h.getTime() > now) {
        reminders.push({ order_item_id: createdItem.id, channel: 'email', scheduled_for: reminder1h.toISOString(), status: 'pending' })
      }
      if (reminders.length > 0) {
        await db.from('event_reminders').insert(reminders)
      }
    }
  }

  console.log(`[stripe webhook] Order ${orderId} completed — ${itemInserts.length} tickets issued`)
}

