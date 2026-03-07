'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Script from 'next/script'
import Link from 'next/link'

declare global {
  interface Window {
    liteAPIPayment?: {
      init: (opts: {
        secretKey: string
        containerId: string
        onSuccess?: (data: { transactionId?: string }) => void
        onError?: (err: unknown) => void
      }) => void
    }
  }
}

type Step = 'form' | 'payment' | 'booking' | 'done'

function CheckoutContent() {
  const { hotelId } = useParams() as { hotelId: string }
  const searchParams = useSearchParams()
  const router = useRouter()

  const offerId    = searchParams.get('offerId') ?? ''
  const hotelName  = searchParams.get('hotelName') ?? 'Hotel'
  const city       = searchParams.get('city') ?? ''
  const checkin    = searchParams.get('checkin') ?? ''
  const checkout   = searchParams.get('checkout') ?? ''
  const amount     = searchParams.get('amount') ?? ''
  const currency   = searchParams.get('currency') ?? 'SGD'

  const [step, setStep] = useState<Step>('form')
  const [sdkReady, setSdkReady] = useState(false)

  // Holder form state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName]   = useState('')
  const [email, setEmail]         = useState('')
  const [phone, setPhone]         = useState('')

  // Prebook result
  const [prebookId, setPrebookId]       = useState('')
  const [bookingId, setBookingId]       = useState('')
  const [secretKey, setSecretKey]       = useState('')
  const [transactionId, setTransactionId] = useState('')

  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  // Initialize payment SDK after secretKey is set and SDK is ready
  const initPaymentSdk = useCallback(() => {
    if (!window.liteAPIPayment || !secretKey) return
    window.liteAPIPayment.init({
      secretKey,
      containerId: 'liteapi-payment-container',
      onSuccess: (data) => {
        const txId = data?.transactionId ?? transactionId
        setTransactionId(txId)
        handleBook(txId)
      },
      onError: (err) => {
        console.error('[checkout] payment error:', err)
        setError('Payment failed. Please try again.')
        setStep('form')
      },
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secretKey, transactionId])

  useEffect(() => {
    if (step === 'payment' && sdkReady && secretKey) {
      initPaymentSdk()
    }
  }, [step, sdkReady, secretKey, initPaymentSdk])

  async function handlePrebook(e: React.FormEvent) {
    e.preventDefault()
    if (!offerId) { setError('Missing offer — please go back and try again.'); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/travel/prebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId, holderFirstName: firstName, holderLastName: lastName, holderEmail: email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Prebook failed')
      setPrebookId(data.prebookId)
      setBookingId(data.bookingId)
      setSecretKey(data.secretKey ?? '')
      setTransactionId(data.transactionId ?? '')
      setStep('payment')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to prepare booking')
    } finally {
      setLoading(false)
    }
  }

  async function handleBook(txId: string) {
    setStep('booking')
    setError(null)
    try {
      const res = await fetch('/api/travel/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          prebookId,
          transactionId: txId,
          holderFirstName: firstName,
          holderLastName: lastName,
          holderEmail: email,
          holderPhone: phone || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Booking failed')
      setStep('done')
      router.push(data.redirect_url ?? `/travel/bookings/${bookingId}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Booking confirmation failed')
      setStep('payment')
    }
  }

  const nights = checkin && checkout
    ? Math.round((new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000)
    : null

  const formattedAmount = amount
    ? new Intl.NumberFormat('en-SG', { style: 'currency', currency, minimumFractionDigits: 0 }).format(Number(amount))
    : null

  return (
    <>
      <Script
        src="https://payment-wrapper.liteapi.travel/dist/liteAPIPayment.js"
        strategy="afterInteractive"
        onReady={() => setSdkReady(true)}
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="text-xs text-charcoal/50 mb-6 flex items-center gap-1.5">
          <Link href="/travel/hotels" className="hover:text-primary transition-colors">Hotels</Link>
          <span>/</span>
          <Link href={`/travel/hotels/${hotelId}`} className="hover:text-primary transition-colors">{hotelName}</Link>
          <span>/</span>
          <span className="text-charcoal font-semibold">Checkout</span>
        </nav>

        {/* Booking summary card */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <h2 className="font-bold text-charcoal text-sm mb-3">Booking summary</h2>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-charcoal">{hotelName}</p>
              {city && <p className="text-xs text-charcoal/50">📍 {city}</p>}
              {checkin && checkout && (
                <p className="text-xs text-charcoal/50 mt-1">
                  {checkin} → {checkout}
                  {nights && ` (${nights} night${nights !== 1 ? 's' : ''})`}
                </p>
              )}
            </div>
            {formattedAmount && (
              <div className="text-right">
                <p className="font-bold text-charcoal text-lg">{formattedAmount}</p>
                <p className="text-xs text-charcoal/40">total</p>
              </div>
            )}
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {(['form', 'payment', 'booking'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step === s
                  ? 'bg-primary text-white'
                  : ['payment', 'booking', 'done'].indexOf(step) > ['form', 'payment', 'booking'].indexOf(s)
                  ? 'bg-primary/20 text-primary'
                  : 'bg-gray-100 text-charcoal/40'
              }`}>
                {i + 1}
              </div>
              <span className={`text-xs font-semibold ${step === s ? 'text-charcoal' : 'text-charcoal/40'}`}>
                {s === 'form' ? 'Guest details' : s === 'payment' ? 'Payment' : 'Confirming'}
              </span>
              {i < 2 && <div className="w-8 h-px bg-gray-200" />}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Step: Guest details form */}
        {step === 'form' && (
          <form onSubmit={handlePrebook} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h1 className="font-bold text-charcoal text-lg">Guest details</h1>
            <p className="text-sm text-charcoal/50">The lead guest must be present at check-in.</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal/60 mb-1">First name *</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  placeholder="Ahmad"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-charcoal/60 mb-1">Last name *</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  placeholder="Rahman"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal/60 mb-1">Email address *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="ahmad@example.com"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
              <p className="text-xs text-charcoal/40 mt-1">Booking confirmation will be sent here</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal/60 mb-1">Phone number (optional)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+65 9123 4567"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading ? 'Preparing booking…' : 'Continue to payment →'}
              </button>
            </div>

            <p className="text-xs text-charcoal/40 text-center">
              By continuing you agree to the cancellation policy displayed on the hotel page.
            </p>
          </form>
        )}

        {/* Step: Payment */}
        {step === 'payment' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h1 className="font-bold text-charcoal text-lg mb-4">Secure payment</h1>
            <div id="liteapi-payment-container" className="min-h-[200px]">
              {!sdkReady && (
                <div className="flex items-center justify-center py-12 text-charcoal/40">
                  <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-3" />
                  Loading payment…
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step: Confirming */}
        {(step === 'booking' || step === 'done') && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="font-semibold text-charcoal">Confirming your booking…</p>
            <p className="text-sm text-charcoal/50 mt-1">This usually takes a few seconds</p>
          </div>
        )}
      </div>
    </>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-charcoal/40">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
        <p>Loading checkout…</p>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
