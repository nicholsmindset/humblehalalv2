'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const VERTICALS = [
  { value: 'food', label: 'Restaurant / Food' },
  { value: 'catering', label: 'Catering' },
  { value: 'services', label: 'Services' },
  { value: 'products', label: 'Products / Retail' },
  { value: 'other', label: 'Other Business' },
] as const

const HALAL_STATUSES = [
  { value: 'muis_certified', label: 'MUIS Certified' },
  { value: 'muslim_owned', label: 'Muslim-Owned' },
  { value: 'self_declared', label: 'Self-Declared Halal' },
  { value: 'not_applicable', label: 'Not Applicable' },
] as const

const SINGAPORE_AREAS = [
  'Arab Street', 'Bedok', 'Bishan', 'Bugis', 'Buona Vista',
  'Choa Chu Kang', 'Clementi', 'Geylang Serai', 'Hougang',
  'Jurong East', 'Jurong West', 'Kallang', 'Little India',
  'Novena', 'Orchard', 'Pasir Ris', 'Punggol',
  'Queenstown', 'Sengkang', 'Tampines', 'Toa Payoh',
  'Woodlands', 'Yishun',
]

interface ListingFormData {
  name: string
  vertical: string
  category: string
  area: string
  address: string
  phone: string
  website: string
  halal_status: string
  muis_cert_no: string
  description: string
  opening_hours: string
}

export function ListingForm() {
  const router = useRouter()

  const [form, setForm] = useState<ListingFormData>({
    name: '',
    vertical: 'food',
    category: '',
    area: '',
    address: '',
    phone: '',
    website: '',
    halal_status: 'muis_certified',
    muis_cert_no: '',
    description: '',
    opening_hours: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function update(field: keyof ListingFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.area || !form.address.trim()) {
      setError('Business name, area, and address are required.')
      return
    }

    setLoading(true)
    setError(null)

    const res = await fetch('/api/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        name: form.name.trim(),
        address: form.address.trim(),
        phone: form.phone.trim() || null,
        website: form.website.trim() || null,
        muis_cert_no: form.muis_cert_no.trim() || null,
        description: form.description.trim() || null,
        opening_hours: form.opening_hours.trim() || null,
      }),
    })

    setLoading(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Failed to create listing. Please try again.')
      return
    }

    const data = await res.json()
    router.push(`/business/listings/${data.id}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Business name */}
      <div>
        <label htmlFor="listing-name" className="block text-sm font-medium text-charcoal mb-1">
          Business Name <span className="text-red-500">*</span>
        </label>
        <input
          id="listing-name"
          type="text"
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          placeholder="e.g. Al-Fatihah Restaurant"
          required
          maxLength={120}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </div>

      {/* Vertical + Category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="listing-vertical" className="block text-sm font-medium text-charcoal mb-1">
            Business Type <span className="text-red-500">*</span>
          </label>
          <select
            id="listing-vertical"
            value={form.vertical}
            onChange={(e) => update('vertical', e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
          >
            {VERTICALS.map((v) => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="listing-category" className="block text-sm font-medium text-charcoal mb-1">Category</label>
          <input
            id="listing-category"
            type="text"
            value={form.category}
            onChange={(e) => update('category', e.target.value)}
            placeholder="e.g. Malay cuisine, Photography"
            maxLength={80}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
      </div>

      {/* Area + Halal status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="listing-area" className="block text-sm font-medium text-charcoal mb-1">
            Area <span className="text-red-500">*</span>
          </label>
          <select
            id="listing-area"
            value={form.area}
            onChange={(e) => update('area', e.target.value)}
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
          >
            <option value="">Select area...</option>
            {SINGAPORE_AREAS.map((a) => (
              <option key={a} value={a.toLowerCase().replace(/\s+/g, '-')}>{a}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="listing-halal" className="block text-sm font-medium text-charcoal mb-1">
            Halal Status <span className="text-red-500">*</span>
          </label>
          <select
            id="listing-halal"
            value={form.halal_status}
            onChange={(e) => update('halal_status', e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
          >
            {HALAL_STATUSES.map((h) => (
              <option key={h.value} value={h.value}>{h.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* MUIS cert number (conditional) */}
      {form.halal_status === 'muis_certified' && (
        <div>
          <label htmlFor="listing-muis" className="block text-sm font-medium text-charcoal mb-1">
            MUIS Cert Number
          </label>
          <input
            id="listing-muis"
            type="text"
            value={form.muis_cert_no}
            onChange={(e) => update('muis_cert_no', e.target.value)}
            placeholder="e.g. MUIS-2024-XXXXX"
            maxLength={50}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
      )}

      {/* Address */}
      <div>
        <label htmlFor="listing-address" className="block text-sm font-medium text-charcoal mb-1">
          Full Address <span className="text-red-500">*</span>
        </label>
        <input
          id="listing-address"
          type="text"
          value={form.address}
          onChange={(e) => update('address', e.target.value)}
          placeholder="e.g. 123 Geylang Road, #01-45, Singapore 389188"
          required
          maxLength={200}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </div>

      {/* Phone + Website */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="listing-phone" className="block text-sm font-medium text-charcoal mb-1">Phone</label>
          <input
            id="listing-phone"
            type="tel"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            placeholder="+65 6xxx xxxx"
            maxLength={20}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <div>
          <label htmlFor="listing-website" className="block text-sm font-medium text-charcoal mb-1">Website</label>
          <input
            id="listing-website"
            type="url"
            value={form.website}
            onChange={(e) => update('website', e.target.value)}
            placeholder="https://yourbusiness.com"
            maxLength={200}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
      </div>

      {/* Opening hours */}
      <div>
        <label htmlFor="listing-hours" className="block text-sm font-medium text-charcoal mb-1">Opening Hours</label>
        <input
          id="listing-hours"
          type="text"
          value={form.opening_hours}
          onChange={(e) => update('opening_hours', e.target.value)}
          placeholder="e.g. Mon–Fri 11am–10pm, Sat–Sun 10am–11pm"
          maxLength={200}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="listing-description" className="block text-sm font-medium text-charcoal mb-1">Description</label>
        <textarea
          id="listing-description"
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          placeholder="Tell customers what makes your business special..."
          rows={4}
          maxLength={1000}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
        />
        <p className="text-xs text-charcoal/40 mt-1 text-right">{form.description.length}/1000</p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-white font-bold py-2.5 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Creating Listing...' : 'Submit for Review'}
      </button>

      <p className="text-xs text-charcoal/40 text-center">
        Listings are reviewed within 1–2 business days. You&apos;ll receive an email when approved.
      </p>
    </form>
  )
}
