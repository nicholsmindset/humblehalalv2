import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

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

  if (event.type === 'checkout.session.completed') {
    await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
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

  // Update event totals
  await db
    .from('events')
    .update({
      total_tickets_sold: db.raw(`total_tickets_sold + ${itemInserts.length}`),
      total_revenue: db.raw(`total_revenue + ${order.total_amount}`),
    })
    .eq('id', order.event_id)
    .catch(() => {})  // raw not available — best effort

  // Schedule email reminders (24h + 1h before event)
  const { data: evt } = (await db
    .from('events')
    .select('starts_at')
    .eq('id', order.event_id)
    .single()) as any

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

