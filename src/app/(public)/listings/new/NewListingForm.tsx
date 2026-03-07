'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const VERTICALS = [
  { value: 'food',       label: 'Restaurant / Café / F&B', icon: 'restaurant' },
  { value: 'catering',  label: 'Catering Service', icon: 'restaurant_menu' },
  { value: 'services',  label: 'Muslim-Owned Service', icon: 'support_agent' },
  { value: 'products',  label: 'Halal Product / Brand', icon: 'inventory_2' },
]

const HALAL_OPTIONS = [
  { value: 'muis_certified', label: 'MUIS Certified' },
  { value: 'muslim_owned',   label: 'Muslim-Owned (not certified)' },
  { value: 'self_declared',  label: 'Self-Declared Halal' },
  { value: 'not_applicable', label: 'Not Applicable' },
]

const AREAS = [
  'Ang Mo Kio', 'Bedok', 'Bishan', 'Bukit Batok', 'Bukit Merah', 'Bukit Panjang',
  'Bukit Timah', 'Central', 'Choa Chu Kang', 'Clementi', 'Geylang', 'Hougang',
  'Jurong East', 'Jurong West', 'Kallang', 'Novena', 'Pasir Ris', 'Punggol',
  'Queenstown', 'Sembawang', 'Sengkang', 'Serangoon', 'Tampines', 'Toa Payoh',
  'Woodlands', 'Yishun',
]

type Step = 'type' | 'details' | 'contact' | 'done'

export function NewListingForm() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('type')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    vertical: '',
    name: '',
    area: '',
    address: '',
    description: '',
    halal_status: 'self_declared',
    phone: '',
    website: '',
    email: '',
  })

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    setError(null)
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.vertical || !form.area) {
      setError('Please fill in all required fields.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (res.status === 401) {
          // Redirect to login
          router.push(`/login?next=/listings/new`)
          return
        }
        setError(data.error ?? 'Something went wrong. Please try again.')
        return
      }

      setStep('done')
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  // ── Step: Done ──────────────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <div className="text-center py-12">
        <span className="material-symbols-outlined text-6xl text-primary block mb-4">check_circle</span>
        <h2 className="text-2xl font-extrabold text-charcoal mb-2">Listing Submitted!</h2>
        <p className="text-charcoal/60 mb-6">
          We&apos;ll review your listing and it will go live within 24 hours. Thank you for listing on HumbleHalal!
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-2 bg-primary text-white rounded-lg px-5 py-2.5 font-bold text-sm hover:bg-primary/90 transition-colors"
        >
          <span className="material-symbols-outlined text-base">home</span>
          Back to Home
        </a>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 space-y-8">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 text-xs text-charcoal/40">
        {(['type', 'details', 'contact'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs
              ${step === s ? 'bg-primary text-white' : (i < ['type','details','contact'].indexOf(step) ? 'bg-emerald-100 text-primary' : 'bg-gray-100 text-charcoal/30')}`}
            >
              {i + 1}
            </div>
            {i < 2 && <div className="w-8 h-px bg-gray-200" />}
          </div>
        ))}
        <span className="ml-2 capitalize font-medium text-charcoal/60">
          {step === 'type' ? 'Business type' : step === 'details' ? 'Details' : 'Contact'}
        </span>
      </div>

      {/* ── Step 1: Choose vertical ── */}
      {step === 'type' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-charcoal">What type of business are you listing?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {VERTICALS.map((v) => (
              <button
                key={v.value}
                type="button"
                onClick={() => update('vertical', v.value)}
                className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all
                  ${form.vertical === v.value
                    ? 'border-primary bg-emerald-50 text-primary'
                    : 'border-gray-200 hover:border-primary/40 text-charcoal'}`}
              >
                <span className="material-symbols-outlined text-2xl">{v.icon}</span>
                <span className="font-semibold text-sm">{v.label}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={!form.vertical}
            onClick={() => setStep('details')}
            className="w-full bg-primary text-white rounded-lg px-5 py-3 font-bold text-sm hover:bg-primary/90 disabled:opacity-40 transition-colors"
          >
            Next →
          </button>
        </div>
      )}

      {/* ── Step 2: Details ── */}
      {step === 'details' && (
        <div className="space-y-5">
          <h2 className="text-lg font-bold text-charcoal">Tell us about your business</h2>

          <div>
            <label className="block text-sm font-semibold text-charcoal mb-1.5">
              Business Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="e.g. Al-Raudhah Kitchen"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-charcoal mb-1.5">
              Area / District <span className="text-red-500">*</span>
            </label>
            <select
              value={form.area}
              onChange={(e) => update('area', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary bg-white"
            >
              <option value="">Select area...</option>
              {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-charcoal mb-1.5">Street Address</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => update('address', e.target.value)}
              placeholder="e.g. 123 Changi Road, #01-02"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-charcoal mb-1.5">Halal Status</label>
            <select
              value={form.halal_status}
              onChange={(e) => update('halal_status', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary bg-white"
            >
              {HALAL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-charcoal mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={4}
              placeholder="Tell customers what makes your business special..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => setStep('type')}
              className="flex-1 border border-gray-200 text-charcoal rounded-lg px-5 py-3 font-semibold text-sm hover:border-primary transition-colors">
              ← Back
            </button>
            <button type="button" disabled={!form.name.trim() || !form.area}
              onClick={() => setStep('contact')}
              className="flex-1 bg-primary text-white rounded-lg px-5 py-3 font-bold text-sm hover:bg-primary/90 disabled:opacity-40 transition-colors">
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Contact ── */}
      {step === 'contact' && (
        <div className="space-y-5">
          <h2 className="text-lg font-bold text-charcoal">Contact information</h2>

          <div>
            <label className="block text-sm font-semibold text-charcoal mb-1.5">Phone Number</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              placeholder="+65 9123 4567"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-charcoal mb-1.5">Website</label>
            <input
              type="url"
              value={form.website}
              onChange={(e) => update('website', e.target.value)}
              placeholder="https://yourwebsite.com"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-charcoal mb-1.5">Email Address</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              placeholder="contact@yourbusiness.com"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={() => setStep('details')}
              className="flex-1 border border-gray-200 text-charcoal rounded-lg px-5 py-3 font-semibold text-sm hover:border-primary transition-colors">
              ← Back
            </button>
            <button type="button" onClick={handleSubmit} disabled={loading}
              className="flex-1 bg-accent text-charcoal rounded-lg px-5 py-3 font-bold text-sm hover:bg-accent/90 disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
              {loading ? (
                <><span className="material-symbols-outlined text-base animate-spin">refresh</span> Submitting...</>
              ) : (
                <><span className="material-symbols-outlined text-base">send</span> Submit Listing</>
              )}
            </button>
          </div>

          <p className="text-xs text-charcoal/40 text-center">
            By submitting, you confirm this information is accurate and your business meets halal standards.
          </p>
        </div>
      )}
    </div>
  )
}
