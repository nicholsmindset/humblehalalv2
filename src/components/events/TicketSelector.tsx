'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Ticket {
  id: string
  name: string
  description: string | null
  price: number
  quantity: number
  sold_count: number
  sale_start: string | null
  sale_end: string | null
  is_active: boolean
}

interface Props {
  eventId: string
  eventSlug?: string
  tickets: Ticket[]
  isPast: boolean
}

export default function TicketSelector({ eventId, tickets, isPast }: Props) {
  const router = useRouter()
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'tickets' | 'details'>('tickets')

  const now = new Date()

  function available(t: Ticket): boolean {
    if (!t.is_active || isPast) return false
    if (t.sale_start && new Date(t.sale_start) > now) return false
    if (t.sale_end && new Date(t.sale_end) < now) return false
    return t.quantity - t.sold_count > 0
  }

  function setQty(id: string, delta: number) {
    setQuantities((prev) => {
      const cur = prev[id] ?? 0
      const next = Math.max(0, cur + delta)
      const ticket = tickets.find((t) => t.id === id)!
      const max = ticket.quantity - ticket.sold_count
      return { ...prev, [id]: Math.min(next, max) }
    })
  }

  const selectedItems = Object.entries(quantities).filter(([, q]) => q > 0)
  const total = selectedItems.reduce((sum, [id, qty]) => {
    const ticket = tickets.find((t) => t.id === id)!
    return sum + ticket.price * qty
  }, 0)

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      setError('Please enter your name and email.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/events/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          items: selectedItems.map(([ticket_id, quantity]) => ({ ticket_id, quantity })),
          attendee_name: name.trim(),
          attendee_email: email.trim(),
          attendee_phone: phone.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Checkout failed. Please try again.')
        return
      }
      if (data.free && data.redirect_url) {
        router.push(data.redirect_url)
      } else if (data.checkout_url) {
        window.location.href = data.checkout_url
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (tickets.length === 0 || isPast) {
    return (
      <div className="bg-gray-50 rounded-xl p-5 text-center">
        <span className="material-symbols-outlined text-3xl text-charcoal/20 block mb-2">
          {isPast ? 'event_busy' : 'confirmation_number'}
        </span>
        <p className="text-charcoal/50 text-sm font-medium">
          {isPast ? 'This event has ended' : 'No tickets available'}
        </p>
      </div>
    )
  }

  if (step === 'details') {
    return (
      <form onSubmit={handleCheckout} className="space-y-4">
        <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
          <h3 className="text-xs font-bold text-charcoal/50 uppercase tracking-wider mb-2">Order Summary</h3>
          {selectedItems.map(([id, qty]) => {
            const ticket = tickets.find((t) => t.id === id)!
            return (
              <div key={id} className="flex justify-between text-sm">
                <span className="text-charcoal/70">{qty}× {ticket.name}</span>
                <span className="font-medium text-charcoal">
                  {ticket.price === 0 ? 'Free' : `SGD ${(ticket.price * qty).toFixed(2)}`}
                </span>
              </div>
            )
          })}
          <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold text-charcoal">
            <span>Total</span>
            <span>{total === 0 ? 'Free' : `SGD ${total.toFixed(2)}`}</span>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-charcoal/50 block mb-1">Full Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Your full name"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-charcoal/50 block mb-1">Email *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="your@email.com"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-charcoal/50 block mb-1">Phone (optional)</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+65 9XXX XXXX"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {error && (
          <p className="text-red-500 text-xs bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent text-charcoal rounded-xl font-bold py-3 text-sm hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="material-symbols-outlined text-base animate-spin">refresh</span>
          ) : (
            <span className="material-symbols-outlined text-base">
              {total === 0 ? 'confirmation_number' : 'credit_card'}
            </span>
          )}
          {loading ? 'Processing…' : total === 0 ? 'Register Free' : `Pay SGD ${total.toFixed(2)}`}
        </button>

        <button
          type="button"
          onClick={() => setStep('tickets')}
          className="w-full text-charcoal/40 text-xs hover:text-charcoal transition-colors"
        >
          ← Back to ticket selection
        </button>

        <p className="text-center text-xs text-charcoal/30">
          {total > 0 ? 'Secure payment via Stripe. Accepts card & PayNow.' : 'Free registration — no payment required.'}
        </p>
      </form>
    )
  }

  return (
    <div className="space-y-3">
      {tickets.map((ticket) => {
        const avail = available(ticket)
        const remaining = ticket.quantity - ticket.sold_count
        const qty = quantities[ticket.id] ?? 0

        return (
          <div
            key={ticket.id}
            className={`border rounded-xl p-4 transition-colors ${
              avail ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-charcoal text-sm">{ticket.name}</p>
                {ticket.description && (
                  <p className="text-charcoal/50 text-xs mt-0.5">{ticket.description}</p>
                )}
                <p className="text-primary font-extrabold text-base mt-1">
                  {ticket.price === 0 ? 'Free' : `SGD ${ticket.price.toFixed(2)}`}
                </p>
                {avail && remaining <= 10 && (
                  <p className="text-amber-600 text-xs mt-0.5 font-medium">
                    Only {remaining} left!
                  </p>
                )}
                {!avail && !isPast && (
                  <p className="text-red-400 text-xs mt-0.5 font-medium">Sold out</p>
                )}
              </div>

              {avail && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setQty(ticket.id, -1)}
                    disabled={qty === 0}
                    className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-charcoal hover:bg-gray-100 disabled:opacity-30 transition-colors"
                    aria-label="Decrease"
                  >
                    <span className="material-symbols-outlined text-base">remove</span>
                  </button>
                  <span className="w-6 text-center font-bold text-charcoal text-sm">{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty(ticket.id, 1)}
                    disabled={qty >= Math.min(remaining, 10)}
                    className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-charcoal hover:bg-gray-100 disabled:opacity-30 transition-colors"
                    aria-label="Increase"
                  >
                    <span className="material-symbols-outlined text-base">add</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      })}

      {selectedItems.length > 0 && (
        <div className="pt-2">
          <div className="flex justify-between items-center text-sm mb-3">
            <span className="text-charcoal/60">
              {selectedItems.reduce((s, [, q]) => s + q, 0)} ticket(s)
            </span>
            <span className="font-extrabold text-charcoal">
              {total === 0 ? 'Free' : `SGD ${total.toFixed(2)}`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setStep('details')}
            className="w-full bg-accent text-charcoal rounded-xl font-bold py-3 text-sm hover:bg-accent/90 transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-base">confirmation_number</span>
            Continue to Checkout
          </button>
        </div>
      )}
    </div>
  )
}
