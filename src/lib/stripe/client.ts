import Stripe from 'stripe'

// ── Singleton Stripe client (server-only) ─────────────────────────────────────
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-02-24.acacia',
    })
  }
  return _stripe
}

// ── Premium listing tiers ─────────────────────────────────────────────────────
export const PREMIUM_TIERS = {
  basic: {
    name: 'Basic Listing',
    priceId: process.env.STRIPE_PRICE_BASIC ?? '',
    amountSgd: 29,
    features: ['Featured placement', 'Photo gallery (up to 10)', 'Direct contact button'],
  },
  premium: {
    name: 'Premium Listing',
    priceId: process.env.STRIPE_PRICE_PREMIUM ?? '',
    amountSgd: 79,
    features: ['Top placement in search', 'Unlimited photos', 'Menu/price list', 'Analytics dashboard', 'Monthly sponsor report'],
  },
  enterprise: {
    name: 'Enterprise',
    priceId: process.env.STRIPE_PRICE_ENTERPRISE ?? '',
    amountSgd: 199,
    features: ['Homepage featured slot', 'Newsletter feature', 'Dedicated account manager', 'Custom landing page'],
  },
} as const

export type PremiumTier = keyof typeof PREMIUM_TIERS

// ── Checkout helpers ──────────────────────────────────────────────────────────
export async function createPremiumListingCheckout(params: {
  listingId: string
  listingName: string
  tier: PremiumTier
  userId: string
  successUrl: string
  cancelUrl: string
}): Promise<string> {
  const stripe = getStripe()
  const tierConfig = PREMIUM_TIERS[params.tier]

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'sgd',
          product_data: {
            name: `${tierConfig.name} — ${params.listingName}`,
            description: tierConfig.features.join(' · '),
          },
          unit_amount: tierConfig.amountSgd * 100, // cents
        },
        quantity: 1,
      },
    ],
    metadata: {
      listing_id: params.listingId,
      tier: params.tier,
      user_id: params.userId,
      type: 'premium_listing',
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  })

  return session.url!
}

export async function createEventTicketCheckout(params: {
  eventId: string
  eventName: string
  ticketType: string
  quantity: number
  pricePerTicketSgd: number
  buyerEmail?: string
  successUrl: string
  cancelUrl: string
}): Promise<string> {
  const stripe = getStripe()

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    ...(params.buyerEmail ? { customer_email: params.buyerEmail } : {}),
    line_items: [
      {
        price_data: {
          currency: 'sgd',
          product_data: {
            name: `${params.eventName} — ${params.ticketType}`,
          },
          unit_amount: Math.round(params.pricePerTicketSgd * 100),
        },
        quantity: params.quantity,
      },
    ],
    metadata: {
      event_id: params.eventId,
      ticket_type: params.ticketType,
      quantity: String(params.quantity),
      type: 'event_ticket',
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  })

  return session.url!
}

export async function retrieveSession(sessionId: string): Promise<Stripe.Checkout.Session> {
  return getStripe().checkout.sessions.retrieve(sessionId, {
    expand: ['line_items', 'payment_intent'],
  })
}
