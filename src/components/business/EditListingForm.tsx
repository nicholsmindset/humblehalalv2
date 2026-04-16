'use client'

import { useState } from 'react'

interface EditListingFormProps {
  listing: {
    id: string
    name: string
    description: string | null
    address: string | null
    phone: string | null
    website: string | null
    operating_hours: string | null
  }
}

type FormState = {
  name: string
  description: string
  address: string
  phone: string
  website: string
  opening_hours: string
}

type Toast = { type: 'success' | 'error'; message: string } | null

export function EditListingForm({ listing }: EditListingFormProps) {
  const [form, setForm] = useState<FormState>({
    name: listing.name ?? '',
    description: listing.description ?? '',
    address: listing.address ?? '',
    phone: listing.phone ?? '',
    website: listing.website ?? '',
    opening_hours: listing.operating_hours ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<Toast>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setToast(null)

    try {
      const res = await fetch('/api/listings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: listing.id,
          name: form.name,
          description: form.description,
          address: form.address,
          phone: form.phone,
          website: form.website,
          operating_hours: form.opening_hours,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setToast({ type: 'error', message: data.error ?? 'Something went wrong. Please try again.' })
      } else {
        setToast({ type: 'success', message: 'Listing updated successfully.' })
      }
    } catch {
      setToast({ type: 'error', message: 'Network error. Please check your connection.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          <span className="material-symbols-outlined text-base">
            {toast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          {toast.message}
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-auto opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Dismiss"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}

      {/* Business Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-[#1C1917] mb-1.5">
          Business Name <span className="text-red-400">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          value={form.name}
          onChange={handleChange}
          required
          maxLength={150}
          placeholder="e.g. Al-Aziz Restaurant"
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-[#1C1917] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#047857]/30 focus:border-[#047857] transition-colors"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-semibold text-[#1C1917] mb-1.5">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={form.description}
          onChange={handleChange}
          maxLength={2000}
          rows={4}
          placeholder="Tell customers about your business, specialties, and what makes you unique…"
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-[#1C1917] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#047857]/30 focus:border-[#047857] transition-colors resize-y"
        />
        <p className="text-xs text-gray-400 mt-1">{form.description.length}/2000</p>
      </div>

      {/* Address */}
      <div>
        <label htmlFor="address" className="block text-sm font-semibold text-[#1C1917] mb-1.5">
          Address
        </label>
        <input
          id="address"
          name="address"
          type="text"
          value={form.address}
          onChange={handleChange}
          maxLength={300}
          placeholder="e.g. 123 Arab Street, Singapore 198845"
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-[#1C1917] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#047857]/30 focus:border-[#047857] transition-colors"
        />
      </div>

      {/* Phone & Website row */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="phone" className="block text-sm font-semibold text-[#1C1917] mb-1.5">
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            maxLength={30}
            placeholder="+65 9123 4567"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-[#1C1917] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#047857]/30 focus:border-[#047857] transition-colors"
          />
        </div>
        <div>
          <label htmlFor="website" className="block text-sm font-semibold text-[#1C1917] mb-1.5">
            Website
          </label>
          <input
            id="website"
            name="website"
            type="url"
            value={form.website}
            onChange={handleChange}
            maxLength={500}
            placeholder="https://yourwebsite.com"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-[#1C1917] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#047857]/30 focus:border-[#047857] transition-colors"
          />
        </div>
      </div>

      {/* Opening Hours */}
      <div>
        <label htmlFor="opening_hours" className="block text-sm font-semibold text-[#1C1917] mb-1.5">
          Opening Hours
        </label>
        <textarea
          id="opening_hours"
          name="opening_hours"
          value={form.opening_hours}
          onChange={handleChange}
          rows={3}
          placeholder={'Mon–Fri: 9am–10pm\nSat–Sun: 10am–11pm\nClosed on Public Holidays'}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-[#1C1917] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#047857]/30 focus:border-[#047857] transition-colors resize-y font-mono"
        />
        <p className="text-xs text-gray-400 mt-1">
          Enter your hours in plain text. Changes are reviewed before going live.
        </p>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 bg-[#047857] text-white rounded-lg font-bold px-6 py-2.5 text-sm hover:bg-[#047857]/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <span className="material-symbols-outlined text-base animate-spin">refresh</span>
              Saving…
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-base">save</span>
              Save Changes
            </>
          )}
        </button>
        <p className="text-xs text-gray-400">
          Changes to sensitive fields go back to pending review.
        </p>
      </div>
    </form>
  )
}
