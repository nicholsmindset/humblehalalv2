'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const CATEGORIES = [
  'Bazaar', 'Class & Workshop', 'Talk & Lecture', 'Networking', 'Family',
  'Charity', 'Sports', 'Conference', 'Festival', 'Private',
]

const EVENT_TYPES = [
  { value: 'in_person', label: 'In-Person', icon: 'location_on' },
  { value: 'online', label: 'Online', icon: 'videocam' },
  { value: 'hybrid', label: 'Hybrid', icon: 'devices' },
]

interface TicketTier {
  name: string
  price: string
  quantity: string
  description: string
}

export default function CreateEventPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1 — Basic info
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [eventType, setEventType] = useState('in_person')
  const [organiser, setOrganiser] = useState('')

  // Step 2 — Date & location
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [venue, setVenue] = useState('')
  const [area, setArea] = useState('')
  const [onlinePlatform, setOnlinePlatform] = useState('')
  const [onlineLink, setOnlineLink] = useState('')

  // Step 3 — Tickets
  const [isTicketed, setIsTicketed] = useState(false)
  const [tickets, setTickets] = useState<TicketTier[]>([
    { name: 'General Admission', price: '0', quantity: '100', description: '' },
  ])
  const [refundPolicy, setRefundPolicy] = useState('no_refund')

  function addTicket() {
    setTickets((prev) => [...prev, { name: '', price: '0', quantity: '50', description: '' }])
  }

  function updateTicket(i: number, field: keyof TicketTier, val: string) {
    setTickets((prev) => prev.map((t, idx) => idx === i ? { ...t, [field]: val } : t))
  }

  function removeTicket(i: number) {
    setTickets((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, description, category, organiser,
          is_online: eventType === 'online' || eventType === 'hybrid',
          is_hybrid: eventType === 'hybrid',
          online_platform: onlinePlatform || null,
          online_link: onlineLink || null,
          starts_at: startsAt,
          ends_at: endsAt || null,
          venue: venue || null,
          area: area || null,
          is_ticketed: isTicketed,
          refund_policy: refundPolicy,
          tickets: isTicketed ? tickets.map((t) => ({
            name: t.name,
            price: parseFloat(t.price) || 0,
            quantity: parseInt(t.quantity) || 0,
            description: t.description || null,
          })) : [],
          price_type: isTicketed && tickets.some((t) => parseFloat(t.price) > 0) ? 'paid' : 'free',
          status: 'pending',
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to create event.')
        return
      }
      router.push(`/dashboard/my-events`)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const STEPS = ['Basic Info', 'Date & Location', 'Tickets & Pricing', 'Review']

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-charcoal">Create an Event</h1>
        <p className="text-charcoal/50 text-sm mt-1">
          List your event on HumbleHalal and sell tickets directly.
        </p>
      </div>

      {/* Step progress */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              step > i + 1 ? 'bg-primary text-white' :
              step === i + 1 ? 'bg-primary text-white ring-4 ring-primary/20' :
              'bg-gray-100 text-charcoal/40'
            }`}>
              {step > i + 1 ? (
                <span className="material-symbols-outlined text-sm">check</span>
              ) : i + 1}
            </div>
            <span className={`text-xs font-medium ${step === i + 1 ? 'text-charcoal' : 'text-charcoal/30'} hidden sm:block`}>
              {s}
            </span>
            {i < STEPS.length - 1 && <div className="flex-1 h-px bg-gray-200 hidden sm:block" />}
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
        {/* Step 1 */}
        {step === 1 && (
          <>
            <h2 className="font-bold text-charcoal">Basic Information</h2>
            <div>
              <label className="text-xs font-medium text-charcoal/50 block mb-1">Event Title *</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Ramadan Bazaar 2026"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-charcoal/50 block mb-1">Description *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="Describe your event — what to expect, who it's for, what's included…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-charcoal/50 block mb-1">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-charcoal bg-white"
                >
                  <option value="">Select…</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-charcoal/50 block mb-1">Organiser Name</label>
                <input
                  value={organiser}
                  onChange={(e) => setOrganiser(e.target.value)}
                  placeholder="Your name or org"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-charcoal/50 block mb-2">Event Format *</label>
              <div className="grid grid-cols-3 gap-3">
                {EVENT_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setEventType(t.value)}
                    className={`flex flex-col items-center gap-2 border rounded-xl py-3 px-2 text-xs font-medium transition-colors ${
                      eventType === t.value
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 text-charcoal/50 hover:border-gray-300'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl">{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <>
            <h2 className="font-bold text-charcoal">Date & Location</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-charcoal/50 block mb-1">Start Date & Time *</label>
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-charcoal/50 block mb-1">End Date & Time</label>
                <input
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            {(eventType === 'in_person' || eventType === 'hybrid') && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-charcoal/50 block mb-1">Venue Name & Address</label>
                  <input
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="e.g. Suntec City Convention Centre"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-charcoal/50 block mb-1">Area</label>
                  <input
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="e.g. city, tampines, jurong-east"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
            )}
            {(eventType === 'online' || eventType === 'hybrid') && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-charcoal/50 block mb-1">Online Platform</label>
                  <select
                    value={onlinePlatform}
                    onChange={(e) => setOnlinePlatform(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-charcoal bg-white"
                  >
                    <option value="">Select platform…</option>
                    <option value="zoom">Zoom</option>
                    <option value="google_meet">Google Meet</option>
                    <option value="teams">Microsoft Teams</option>
                    <option value="custom">Custom URL</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-charcoal/50 block mb-1">Meeting Link (hidden until ticket purchase)</label>
                  <input
                    type="url"
                    value={onlineLink}
                    onChange={(e) => setOnlineLink(e.target.value)}
                    placeholder="https://zoom.us/j/..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <>
            <h2 className="font-bold text-charcoal">Tickets & Pricing</h2>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-charcoal text-sm">Sell tickets on HumbleHalal</p>
                <p className="text-charcoal/40 text-xs mt-0.5">3% platform fee on paid tickets</p>
              </div>
              <button
                type="button"
                onClick={() => setIsTicketed((v) => !v)}
                className={`relative w-12 h-6 rounded-full transition-colors ${isTicketed ? 'bg-primary' : 'bg-gray-200'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isTicketed ? 'translate-x-6' : ''}`} />
              </button>
            </div>

            {isTicketed && (
              <div className="space-y-4">
                {tickets.map((t, i) => (
                  <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-charcoal text-sm">Ticket Tier {i + 1}</p>
                      {tickets.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTicket(i)}
                          className="text-red-400 hover:text-red-500 transition-colors"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-charcoal/40 block mb-1">Tier Name</label>
                        <input
                          value={t.name}
                          onChange={(e) => updateTicket(i, 'name', e.target.value)}
                          placeholder="General Admission"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-charcoal bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-charcoal/40 block mb-1">Price (SGD)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={t.price}
                          onChange={(e) => updateTicket(i, 'price', e.target.value)}
                          placeholder="0.00"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-charcoal bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-charcoal/40 block mb-1">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={t.quantity}
                          onChange={(e) => updateTicket(i, 'quantity', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-charcoal bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-charcoal/40 block mb-1">Description</label>
                        <input
                          value={t.description}
                          onChange={(e) => updateTicket(i, 'description', e.target.value)}
                          placeholder="Includes lunch"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-charcoal bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addTicket}
                  className="flex items-center gap-2 text-primary text-sm font-medium hover:underline"
                >
                  <span className="material-symbols-outlined text-base">add_circle</span>
                  Add another ticket tier
                </button>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-charcoal/50 block mb-2">Refund Policy</label>
              <select
                value={refundPolicy}
                onChange={(e) => setRefundPolicy(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-charcoal bg-white"
              >
                <option value="no_refund">No Refunds</option>
                <option value="full_refund">Full Refund</option>
                <option value="partial">Partial Refund</option>
                <option value="custom">Custom Policy</option>
              </select>
            </div>
          </>
        )}

        {/* Step 4 — Review */}
        {step === 4 && (
          <>
            <h2 className="font-bold text-charcoal">Review & Submit</h2>
            <div className="space-y-3 text-sm">
              {[
                { label: 'Title', value: title },
                { label: 'Category', value: category },
                { label: 'Format', value: eventType.replace('_', ' ') },
                { label: 'Organiser', value: organiser || '—' },
                { label: 'Start', value: startsAt ? new Date(startsAt).toLocaleString('en-SG') : '—' },
                { label: 'End', value: endsAt ? new Date(endsAt).toLocaleString('en-SG') : '—' },
                { label: 'Venue', value: venue || (eventType === 'online' ? 'Online only' : '—') },
                { label: 'Ticketed', value: isTicketed ? `Yes — ${tickets.length} tier(s)` : 'No (free/external)' },
                { label: 'Refund Policy', value: refundPolicy.replace('_', ' ') },
              ].map(({ label, value }) => (
                <div key={label} className="flex gap-3">
                  <span className="text-charcoal/40 w-28 shrink-0">{label}</span>
                  <span className="text-charcoal font-medium capitalize">{value}</span>
                </div>
              ))}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700">
              <strong>Note:</strong> Your event will be reviewed before it goes live. We typically approve within 24 hours.
              Verified organisers get auto-publish.
            </div>

            {error && (
              <p className="text-red-500 text-xs bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}
          </>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-3 mt-6">
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="flex-1 border border-gray-200 text-charcoal rounded-xl py-3 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
        )}
        {step < 4 ? (
          <button
            type="button"
            onClick={() => {
              if (step === 1 && (!title.trim() || !category || !description.trim())) {
                setError('Please fill in all required fields.')
                return
              }
              if (step === 2 && !startsAt) {
                setError('Please set a start date and time.')
                return
              }
              setError(null)
              setStep((s) => s + 1)
            }}
            className="flex-1 bg-primary text-white rounded-xl py-3 text-sm font-bold hover:bg-primary/90 transition-colors"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-accent text-charcoal rounded-xl py-3 text-sm font-bold hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <span className="material-symbols-outlined text-base animate-spin">refresh</span>}
            {loading ? 'Submitting…' : 'Submit for Review'}
          </button>
        )}
      </div>
      {error && step < 4 && (
        <p className="text-red-500 text-xs mt-2 text-center">{error}</p>
      )}
    </div>
  )
}
