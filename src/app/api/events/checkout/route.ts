import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { SITE_URL } from '@/config'
import { sendTicketConfirmation } from '@/lib/resend/send'

function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `HH-${date}-${rand}`
}

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' })
  const supabase = await createClient()
  const db = supabase as any

  const { data: { user } } = await supabase.auth.getUser()

  const body = await request.json()
  const { event_id, items, attendee_name, attendee_email, attendee_phone } = body

  if (!event_id || !items?.length || !attendee_name || !attendee_email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Load event
  const { data: evt } = (await db
    .from('events')
    .select('id, slug, title, is_ticketed, platform_fee_percent, organiser_stripe_account_id, starts_at, venue, area, is_online, online_platform')
    .eq('id', event_id)
    .eq('status', 'active')
    .single()) as any

  if (!evt) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  if (!evt.is_ticketed) return NextResponse.json({ error: 'Event is not ticketed' }, { status: 400 })

  // Validate tickets and compute totals
  const ticketIds: string[] = items.map((i: any) => i.ticket_id)
  const { data: ticketRows } = (await db
    .from('event_tickets')
    .select('id, name, price, quantity, sold_count, is_active')
    .in('id', ticketIds)
    .eq('event_id', event_id)) as any

  const tickets: Record<string, any> = {}
  for (const t of (ticketRows ?? [])) {
    tickets[t.id] = t
  }

  let totalAmount = 0
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []

  for (const item of items) {
    const ticket = tickets[item.ticket_id]
    if (!ticket || !ticket.is_active) {
      return NextResponse.json({ error: `Ticket ${item.ticket_id} not found or inactive` }, { status: 400 })
    }
    const available = ticket.quantity - ticket.sold_count
    if (available < item.quantity) {
      return NextResponse.json({ error: `Not enough tickets available for ${ticket.name}` }, { status: 400 })
    }
    totalAmount += ticket.price * item.quantity
    if (ticket.price > 0) {
      lineItems.push({
        price_data: {
          currency: 'sgd',
          product_data: { name: `${ticket.name} — ${evt.title}` },
          unit_amount: Math.round(ticket.price * 100),
        },
        quantity: item.quantity,
      })
    } else {
      lineItems.push({
        price_data: {
          currency: 'sgd',
          product_data: { name: `${ticket.name} — ${evt.title} (Free)` },
          unit_amount: 0,
        },
        quantity: item.quantity,
      })
    }
  }

  const platformFeePercent = evt.platform_fee_percent ?? 3.0
  const platformFee = Math.round(totalAmount * (platformFeePercent / 100) * 100) // in cents

  // Create pending order
  const orderNumber = generateOrderNumber()
  const { data: order, error: orderErr } = (await db
    .from('event_orders')
    .insert({
      event_id,
      user_id: user?.id ?? null,
      order_number: orderNumber,
      email: attendee_email,
      name: attendee_name,
      phone: attendee_phone ?? null,
      total_amount: totalAmount,
      platform_fee: platformFee / 100,
      status: 'pending',
    })
    .select('id')
    .single()) as any

  if (orderErr || !order) {
    console.error('[checkout] order insert error:', orderErr)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }

  // Free event — skip Stripe
  if (totalAmount === 0) {
    await db.from('event_orders').update({ status: 'completed' }).eq('id', order.id)
    // Generate items
    const itemInserts: any[] = []
    for (const item of items) {
      const ticket = tickets[item.ticket_id]
      for (let i = 0; i < item.quantity; i++) {
        const qrCode = `${order.id}-${ticket.id}-${i}-${Date.now()}`
        itemInserts.push({
          order_id: order.id,
          ticket_id: ticket.id,
          attendee_name,
          attendee_email,
          qr_code: qrCode,
        })
      }
    }
    await db.from('event_order_items').insert(itemInserts)

    // Send confirmation email for free orders
    const startDate = new Date(evt.starts_at)
    await sendTicketConfirmation({
      orderNumber,
      attendeeName: attendee_name,
      attendeeEmail: attendee_email,
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
        ticketName: tickets[item.ticket_id]?.name ?? 'Ticket',
        attendeeName: item.attendee_name,
        price: 0,
      })),
    })

    return NextResponse.json({
      free: true,
      redirect_url: `${SITE_URL}/events/${evt.slug}/confirmation/${order.id}`,
    })
  }

  // Build Stripe Checkout
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'payment',
    payment_method_types: ['card', 'paynow'],
    line_items: lineItems,
    customer_email: attendee_email,
    metadata: {
      order_id: order.id,
      event_id,
      user_id: user?.id ?? '',
      attendee_name,
      items: JSON.stringify(items),
    },
    success_url: `${SITE_URL}/events/${evt.slug}/confirmation/${order.id}`,
    cancel_url: `${SITE_URL}/events/${evt.slug}`,
  }

  // Stripe Connect — route payment to organiser if they have a Connect account
  if (evt.organiser_stripe_account_id && platformFee > 0) {
    sessionParams.payment_intent_data = {
      application_fee_amount: platformFee,
      transfer_data: { destination: evt.organiser_stripe_account_id },
    }
  }

  const session = await stripe.checkout.sessions.create(sessionParams)

  // Store session ID on order
  await db
    .from('event_orders')
    .update({ stripe_checkout_session_id: session.id })
    .eq('id', order.id)

  return NextResponse.json({ checkout_url: session.url })
}
