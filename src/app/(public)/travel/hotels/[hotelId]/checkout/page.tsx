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
  const hotelName  = searchParams.get('hotelName') ?? ''
  const city       = searchParams.get('city') ?? ''
  const checkin    = searchParams.get('checkin') ?? ''
  const checkout   = searchParams.get('checkout') ?? ''
  const amount     = searchParams.get('amount') ?? ''
  const currency   = searchParams.get('currency') ?? 'SGD'
  const roomName   = searchParams.get('roomName') ?? ''

  const [step, setStep] = useState<Step>('form')
  const [sdkReady, setSdkReady] = useState(false)
  const [sdkTimeout, setSdkTimeout] = useState(false)

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
  const [sandboxMode, setSandboxMode]   = useState(false)

  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  // Initialize payment SDK after secretKey is set and SDK is ready
  const initPaymentSdk = useCallback((onSuccess: (txId: string) => void) => {
    if (!window.liteAPIPayment || !secretKey) return
    // Ensure container exists in DOM before SDK tries to mount into it
    if (!document.getElementById('liteapi-payment-container')) return
    try {
      window.liteAPIPayment.init({
        secretKey,
        containerId: 'liteapi-payment-container',
        onSuccess: (data) => {
          const txId = data?.transactionId ?? ''
          onSuccess(txId)
        },
        onError: (err) => {
          console.error('[checkout] payment SDK error:', err)
          setError('Payment failed. Please try again.')
          setStep('form')
        },
      })
    } catch (err) {
      console.error('[checkout] payment SDK init failed:', err)
      setSandboxMode(true)
    }
  }, [secretKey])

  // When payment step is active, try to init SDK or detect sandbox
  useEffect(() => {
    if (step !== 'payment') return

    if (sandboxMode || !secretKey) return

    if (sdkReady && secretKey) {
      initPaymentSdk((txId) => {
        setTransactionId(txId)
        handleBook(txId)
      })
    }

    // If SDK doesn't load within 8s, fall back to sandbox mode
    const timer = setTimeout(() => {
      if (!sdkReady) {
        console.warn('[checkout] Payment SDK load timeout — falling back to sandbox mode')
        setSdkTimeout(true)
        setSandboxMode(true)
      }
    }, 8000)

    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, sdkReady, secretKey, sandboxMode, initPaymentSdk])

  async function handlePrebook(e: React.FormEvent) {
    e.preventDefault()
    if (!offerId) { setError('Missing offer — please go back and try again.'); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/travel/prebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerId,
          hotelId,
          hotelName,
          hotelCity: city || searchParams.get('dest') || '',
          hotelCountry: '',
          checkIn: checkin,
          checkOut: checkout,
          guests: parseInt(searchParams.get('guests') ?? '2'),
          totalAmount: amount ? parseFloat(amount) : 0,
          currency,
          holderFirstName: firstName,
          holderLastName: lastName,
          holderEmail: email,
          guestNationality: 'SG',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Prebook failed')
      setPrebookId(data.prebookId)
      setBookingId(data.bookingId)
      setSecretKey(data.secretKey ?? '')
      setTransactionId(data.transactionId ?? '')
      setSandboxMode(data.sandboxMode ?? !data.secretKey)
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
          guestNationality: 'SG',
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

  function handleSandboxPayment() {
    // In sandbox mode, simulate payment with the existing transactionId or a test ID
    const txId = transactionId || `sandbox_${Date.now()}`
    setTransactionId(txId)
    handleBook(txId)
  }

  const nights = checkin && checkout
    ? Math.max(1, Math.round((new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000))
    : null

  const formattedAmount = amount
    ? new Intl.NumberFormat('en-SG', { style: 'currency', currency, minimumFractionDigits: 0 }).format(Number(amount))
    : null

  const perNightAmount = (amount && nights)
    ? new Intl.NumberFormat('en-SG', { style: 'currency', currency, minimumFractionDigits: 0 }).format(Math.round(Number(amount) / nights))
    : null

  return (
    <>
      {/* Only load payment SDK if we have a secretKey */}
      {secretKey && (
        <Script
          src="https://payment-wrapper.liteapi.travel/dist/liteAPIPayment.js"
          strategy="afterInteractive"
          onReady={() => setSdkReady(true)}
          onError={() => {
            console.error('[checkout] Payment SDK script failed to load')
            setSandboxMode(true)
          }}
        />
      )}

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="text-xs text-charcoal/50 mb-6 flex items-center gap-1.5">
          <Link href="/travel/hotels" className="hover:text-primary transition-colors">Hotels</Link>
          <span>/</span>
          <Link href={`/travel/hotels/${hotelId}?${searchParams.toString()}`} className="hover:text-primary transition-colors">{hotelName}</Link>
          <span>/</span>
          <span className="text-charcoal font-semibold">Checkout</span>
        </nav>

        {/* Booking summary card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <p className="text-xs font-bold text-charcoal/40 uppercase tracking-wide mb-3">Booking summary</p>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-bold text-charcoal text-base">{hotelName}</p>
              {city && <p className="text-xs text-charcoal/50 mt-0.5">{city}</p>}
              {checkin && checkout && (
                <p className="text-xs text-charcoal/50 mt-1">
                  {new Date(checkin).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })}
                  {' — '}
                  {new Date(checkout).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {nights ? ` (${nights} night${nights !== 1 ? 's' : ''})` : ''}
                </p>
              )}
              <p className="text-xs text-charcoal/40 mt-1">
                {searchParams.get('guests') ?? '2'} guest{(parseInt(searchParams.get('guests') ?? '2')) !== 1 ? 's' : ''}
              </p>
              {roomName && (
                <p className="text-xs text-charcoal/50 mt-1 font-medium">{roomName}</p>
              )}
            </div>
            {formattedAmount && (
              <div className="text-right flex-shrink-0">
                {perNightAmount && nights && nights > 1 && (
                  <p className="text-sm text-primary font-semibold">{perNightAmount}<span className="text-xs font-normal text-charcoal/40">/night</span></p>
                )}
                <p className="font-extrabold text-charcoal text-lg">{formattedAmount}</p>
                <p className="text-xs text-charcoal/40">total {nights ? `· ${nights} night${nights !== 1 ? 's' : ''}` : ''}</p>
              </div>
            )}
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {(['form', 'payment', 'booking'] as Step[]).map((s, i) => {
            const stepOrder = ['form', 'payment', 'booking', 'done']
            const currentIdx = stepOrder.indexOf(step)
            const thisIdx = stepOrder.indexOf(s)
            const isActive = step === s
            const isCompleted = currentIdx > thisIdx
            return (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : isCompleted
                    ? 'bg-primary/20 text-primary'
                    : 'bg-gray-100 text-charcoal/40'
                }`}>
                  {isCompleted ? '✓' : i + 1}
                </div>
                <span className={`text-xs font-semibold ${isActive ? 'text-charcoal' : 'text-charcoal/40'}`}>
                  {s === 'form' ? 'Guest details' : s === 'payment' ? 'Payment' : 'Confirm'}
                </span>
                {i < 2 && <div className="w-8 h-px bg-gray-200" />}
              </div>
            )
          })}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-600 flex items-start gap-2">
            <span className="material-symbols-outlined text-base mt-0.5 flex-shrink-0">error</span>
            <div className="flex-1">
              <p className="font-medium">
                {error.includes('availability') || error.includes('expired')
                  ? 'This rate is no longer available — hotel rates expire quickly.'
                  : error}
              </p>
              {(error.includes('availability') || error.includes('expired')) && (
                <a
                  href="/travel"
                  className="inline-block mt-2 text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Search hotels again
                </a>
              )}
              {!error.includes('availability') && !error.includes('expired') && (
                <button onClick={() => setError(null)} className="text-xs text-red-500 hover:underline mt-1">
                  Dismiss
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step: Guest details form */}
        {step === 'form' && (
          <form onSubmit={handlePrebook} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div>
              <h1 className="font-bold text-charcoal text-lg">Guest details</h1>
              <p className="text-sm text-charcoal/50 mt-0.5">Lead guest must be present at check-in with valid ID.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal/60 mb-1">First name *</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  placeholder="Ahmad"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
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
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
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
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
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
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Preparing booking…
                  </>
                ) : (
                  'Continue to payment'
                )}
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
            {sandboxMode ? (
              /* Sandbox / test mode — no real payment SDK */
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="font-bold text-charcoal text-lg">Payment</h1>
                  <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    TEST MODE
                  </span>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                  <p className="font-semibold mb-1">Sandbox Environment</p>
                  <p className="text-xs">
                    Payment processing is in test mode. No real charges will be made.
                    Click the button below to simulate a successful payment.
                  </p>
                </div>

                {/* Order summary */}
                <div className="border border-gray-100 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-charcoal/60">Room ({nights ?? 1} night{nights !== 1 ? 's' : ''})</span>
                    <span className="font-semibold text-charcoal">{formattedAmount ?? 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-charcoal/60">Taxes & fees</span>
                    <span className="text-charcoal/60">Included</span>
                  </div>
                  <div className="border-t border-gray-100 pt-2 flex justify-between text-sm font-bold">
                    <span className="text-charcoal">Total</span>
                    <span className="text-primary">{formattedAmount ?? 'N/A'}</span>
                  </div>
                </div>

                {/* Guest info review */}
                <div className="border border-gray-100 rounded-lg p-4 text-xs text-charcoal/60 space-y-1">
                  <p><span className="font-semibold text-charcoal">Guest:</span> {firstName} {lastName}</p>
                  <p><span className="font-semibold text-charcoal">Email:</span> {email}</p>
                  {phone && <p><span className="font-semibold text-charcoal">Phone:</span> {phone}</p>}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setStep('form'); setError(null) }}
                    className="flex-1 border border-gray-200 text-charcoal font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleSandboxPayment}
                    className="flex-[2] bg-accent text-charcoal font-bold py-3 rounded-xl hover:bg-accent/90 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">lock</span>
                    Complete test payment
                  </button>
                </div>
              </div>
            ) : (
              /* Live payment SDK */
              <div>
                <h1 className="font-bold text-charcoal text-lg mb-4">Secure payment</h1>
                <div id="liteapi-payment-container" className="min-h-[200px]">
                  {!sdkReady && !sdkTimeout && (
                    <div className="flex items-center justify-center py-12 text-charcoal/40">
                      <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-3" />
                      Loading payment form…
                    </div>
                  )}
                </div>
                <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => { setStep('form'); setError(null) }}
                    className="text-sm text-charcoal/50 hover:text-charcoal font-semibold"
                  >
                    ← Back to guest details
                  </button>
                </div>
              </div>
            )}
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

        {/* Trust signals */}
        <div className="mt-8 flex items-center justify-center gap-6 text-xs text-charcoal/30">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">lock</span>
            Secure checkout
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">verified</span>
            Instant confirmation
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">support_agent</span>
            24/7 support
          </span>
        </div>
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
